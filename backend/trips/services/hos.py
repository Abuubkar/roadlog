"""Hours-of-Service trip simulator (FMCSA 49 CFR Part 395, property-carrying).

Pure, I/O-free logic: given the driving legs of a trip, produce the ordered list of
duty-status activities a compliant driver would log. All times are minutes from the
trip start; all distances are miles from the trip origin.

Rules modelled
--------------
* 11-hour driving limit after 10 consecutive hours off duty.
* 14-hour driving window that starts with the first on-duty activity of the shift.
* 30-minute break after 8 cumulative hours of driving (any 30 consecutive minutes
  of non-driving time satisfies it, so a 1-hour pickup counts).
* 70-hour / 8-day on-duty cycle; a 34-hour off-duty restart resets it.
* Fuel at least every 1,000 miles (30 min on duty, not driving).
* 1 hour on duty for pickup and for drop-off.
* Optional 30-minute pre-trip (each shift) and 15-minute post-trip inspections.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum

EPS = 1e-6


class DutyStatus(StrEnum):
    OFF_DUTY = "off_duty"
    SLEEPER_BERTH = "sleeper_berth"
    DRIVING = "driving"
    ON_DUTY = "on_duty"  # on duty, not driving


class ActivityKind(StrEnum):
    DRIVE = "drive"
    PRE_TRIP = "pre_trip"
    POST_TRIP = "post_trip"
    PICKUP = "pickup"
    DROPOFF = "dropoff"
    FUEL = "fuel"
    BREAK = "break"
    REST = "rest"
    RESTART = "restart"


ACTIVITY_LABELS: dict[ActivityKind, str] = {
    ActivityKind.DRIVE: "Driving",
    ActivityKind.PRE_TRIP: "Pre-trip inspection",
    ActivityKind.POST_TRIP: "Post-trip inspection",
    ActivityKind.PICKUP: "Pickup (loading)",
    ActivityKind.DROPOFF: "Drop-off (unloading)",
    ActivityKind.FUEL: "Fuel stop",
    ActivityKind.BREAK: "30-min rest break",
    ActivityKind.REST: "10-hr off-duty rest",
    ActivityKind.RESTART: "34-hr cycle restart",
}


@dataclass(frozen=True)
class HOSRules:
    max_driving_min: float = 11 * 60
    duty_window_min: float = 14 * 60
    break_after_driving_min: float = 8 * 60
    break_min: float = 30
    daily_rest_min: float = 10 * 60
    cycle_limit_min: float = 70 * 60
    restart_min: float = 34 * 60
    fuel_interval_miles: float = 1000
    fuel_min: float = 30
    pickup_min: float = 60
    dropoff_min: float = 60
    pre_trip_min: float = 30
    post_trip_min: float = 15
    include_inspections: bool = True


@dataclass(frozen=True)
class Leg:
    """One driven leg of the trip (e.g. current -> pickup)."""

    distance_miles: float
    duration_min: float


@dataclass
class Activity:
    kind: ActivityKind
    status: DutyStatus
    start_min: float
    end_min: float
    start_mile: float
    end_mile: float

    @property
    def duration_min(self) -> float:
        return self.end_min - self.start_min

    @property
    def label(self) -> str:
        return ACTIVITY_LABELS[self.kind]


@dataclass
class _Clock:
    """Mutable HOS counters for the simulation."""

    now: float = 0.0
    mile: float = 0.0
    cycle_used: float = 0.0
    shift_start: float | None = None
    shift_driving: float = 0.0
    driving_since_break: float = 0.0
    non_driving_streak: float = 0.0
    miles_since_fuel: float = 0.0


@dataclass
class HOSPlanner:
    cycle_used_hours: float
    rules: HOSRules = field(default_factory=HOSRules)

    def plan(self, legs: list[Leg]) -> list[Activity]:
        """Simulate the full trip: origin -> pickup -> drop-off."""
        if len(legs) != 2:
            raise ValueError("Expected exactly two legs: to pickup and to drop-off.")

        self._clock = _Clock(cycle_used=min(self.cycle_used_hours * 60, self.rules.cycle_limit_min))
        self._activities: list[Activity] = []

        to_pickup, to_dropoff = legs
        self._drive(to_pickup)
        self._on_duty(ActivityKind.PICKUP, self.rules.pickup_min)
        self._drive(to_dropoff)
        self._on_duty(ActivityKind.DROPOFF, self.rules.dropoff_min)
        if self.rules.include_inspections:
            self._on_duty(ActivityKind.POST_TRIP, self.rules.post_trip_min)
        return self._activities

    # ------------------------------------------------------------------ driving

    def _drive(self, leg: Leg) -> None:
        if leg.distance_miles <= EPS or leg.duration_min <= EPS:
            return
        speed = leg.distance_miles / leg.duration_min  # miles per minute
        remaining = leg.duration_min
        r, c = self.rules, self._clock

        while remaining > EPS:
            self._ensure_shift()
            limits = {
                "cycle": r.cycle_limit_min - c.cycle_used,
                "driving": r.max_driving_min - c.shift_driving,
                "window": r.duty_window_min - (c.now - c.shift_start),
                "break": r.break_after_driving_min - c.driving_since_break,
                "fuel": (r.fuel_interval_miles - c.miles_since_fuel) / speed,
            }
            reason, available = min(limits.items(), key=lambda kv: kv[1])
            if available <= EPS:
                self._satisfy(reason)
                continue
            chunk = min(available, remaining)
            self._record(ActivityKind.DRIVE, DutyStatus.DRIVING, chunk, miles=chunk * speed)
            remaining -= chunk

    def _satisfy(self, reason: str) -> None:
        """Take whatever stop clears the limit that is blocking further driving."""
        r, c = self.rules, self._clock
        if reason == "cycle":
            self._off_duty(ActivityKind.RESTART, r.restart_min)
        elif reason in ("driving", "window"):
            self._off_duty(ActivityKind.REST, r.daily_rest_min)
        elif reason == "break":
            window_left = r.duty_window_min - (c.now - c.shift_start) - r.break_min
            if window_left <= EPS:
                # A break would leave no time to drive; take the full rest instead.
                self._off_duty(ActivityKind.REST, r.daily_rest_min)
            else:
                self._off_duty(ActivityKind.BREAK, r.break_min)
        elif reason == "fuel":
            self._on_duty(ActivityKind.FUEL, r.fuel_min)
        else:  # pragma: no cover - defensive
            raise ValueError(f"Unknown HOS limit: {reason}")

    # ---------------------------------------------------------------- duty time

    def _ensure_shift(self) -> None:
        """Open a 14-hour window (with pre-trip inspection) if off the clock."""
        c = self._clock
        if c.shift_start is not None:
            return
        pre_trip = self.rules.pre_trip_min if self.rules.include_inspections else 0.0
        # Restart first if the cycle can't fit the pre-trip plus at least some driving.
        if c.cycle_used + pre_trip >= self.rules.cycle_limit_min - EPS:
            self._off_duty(ActivityKind.RESTART, self.rules.restart_min)
        c.shift_start = c.now
        c.shift_driving = 0.0
        if pre_trip:
            self._record(ActivityKind.PRE_TRIP, DutyStatus.ON_DUTY, pre_trip)

    def _on_duty(self, kind: ActivityKind, minutes: float) -> None:
        c = self._clock
        opening_shift = c.shift_start is None and self.rules.include_inspections
        needed = minutes + (self.rules.pre_trip_min if opening_shift else 0.0)
        if c.cycle_used + needed > self.rules.cycle_limit_min + EPS:
            self._off_duty(ActivityKind.RESTART, self.rules.restart_min)
        self._ensure_shift()
        self._record(kind, DutyStatus.ON_DUTY, minutes)
        if kind == ActivityKind.FUEL:
            c.miles_since_fuel = 0.0

    def _off_duty(self, kind: ActivityKind, minutes: float) -> None:
        c = self._clock
        status = DutyStatus.SLEEPER_BERTH if kind == ActivityKind.REST else DutyStatus.OFF_DUTY
        self._record(kind, status, minutes)
        if kind in (ActivityKind.REST, ActivityKind.RESTART):
            c.shift_start = None
            c.shift_driving = 0.0
        if kind == ActivityKind.RESTART:
            c.cycle_used = 0.0

    # ------------------------------------------------------------- bookkeeping

    def _record(self, kind: ActivityKind, status: DutyStatus, minutes: float, miles: float = 0.0) -> None:
        c = self._clock
        self._activities.append(Activity(kind, status, c.now, c.now + minutes, c.mile, c.mile + miles))
        c.now += minutes
        c.mile += miles

        if status == DutyStatus.DRIVING:
            c.shift_driving += minutes
            c.driving_since_break += minutes
            c.miles_since_fuel += miles
            c.non_driving_streak = 0.0
        else:
            c.non_driving_streak += minutes
            if c.non_driving_streak >= self.rules.break_min - EPS:
                c.driving_since_break = 0.0

        if status in (DutyStatus.DRIVING, DutyStatus.ON_DUTY):
            c.cycle_used += minutes
