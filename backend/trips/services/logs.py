"""Turn a simulated activity list into FMCSA-style daily log sheets (one per calendar day)."""

from __future__ import annotations

from collections.abc import Callable
from datetime import datetime, time, timedelta

from .hos import Activity, ActivityKind, DutyStatus, HOSRules

MINUTES_PER_DAY = 24 * 60
STATUS_ORDER = [DutyStatus.OFF_DUTY, DutyStatus.SLEEPER_BERTH, DutyStatus.DRIVING, DutyStatus.ON_DUTY]

LocationLookup = Callable[[float], str]  # trip mile -> "City, ST"


def build_daily_logs(
    activities: list[Activity],
    start: datetime,
    cycle_used_hours: float,
    location_at: LocationLookup,
    rules: HOSRules | None = None,
) -> list[dict]:
    rules = rules or HOSRules()
    if not activities:
        return []

    # Absolute timeline, padded with off-duty time to midnight on both ends.
    midnight = datetime.combine(start.date(), time.min)
    lead = (start - midnight).total_seconds() / 60
    trip_end = activities[-1].end_min
    total = lead + trip_end
    days = int(-(-total // MINUTES_PER_DAY))  # ceil

    timeline: list[tuple[Activity | None, float, float]] = []  # (activity, abs_start, abs_end)
    if lead > 0:
        timeline.append((None, 0.0, lead))
    timeline += [(a, lead + a.start_min, lead + a.end_min) for a in activities]
    if days * MINUTES_PER_DAY > total:
        timeline.append((None, total, days * MINUTES_PER_DAY))

    cycle = cycle_used_hours * 60
    logs = []
    for day_index in range(days):
        day_start = day_index * MINUTES_PER_DAY
        day_end = day_start + MINUTES_PER_DAY
        segments: list[dict] = []
        remarks: list[dict] = []
        totals = dict.fromkeys(STATUS_ORDER, 0.0)
        miles = 0.0
        on_duty_today = 0.0

        for activity, a_start, a_end in timeline:
            s, e = max(a_start, day_start), min(a_end, day_end)
            if e - s <= 1e-9:
                continue
            status = activity.status if activity else DutyStatus.OFF_DUTY
            minutes = e - s
            totals[status] += minutes

            if activity and activity.kind == ActivityKind.RESTART:
                cycle = 0.0
            if status in (DutyStatus.DRIVING, DutyStatus.ON_DUTY):
                on_duty_today += minutes
                cycle += minutes
            if activity and status == DutyStatus.DRIVING:
                miles += (activity.end_mile - activity.start_mile) * minutes / activity.duration_min

            _append_segment(segments, status, (s - day_start) / 60, (e - day_start) / 60)

            # Every activity is a change of duty status: note where it began.
            if activity and day_start <= a_start < day_end:
                remarks.append(_remark(activity, (a_start - day_start) / 60, location_at))

        log_date = start.date() + timedelta(days=day_index)
        logs.append(
            {
                "day": day_index + 1,
                "date": log_date.isoformat(),
                "total_miles": round(miles, 1),
                "segments": segments,
                "totals": {k.value: round(v / 60, 2) for k, v in totals.items()},
                "remarks": remarks,
                "recap": _recap(on_duty_today, cycle, rules),
                "from_location": _first_location(logs, location_at),
                "to_location": location_at(_last_mile_on_day(timeline, day_end)),
            }
        )
    return logs


def _append_segment(segments: list[dict], status: DutyStatus, start_h: float, end_h: float) -> None:
    if segments and segments[-1]["status"] == status and abs(segments[-1]["end"] - start_h) < 1e-9:
        segments[-1]["end"] = round(end_h, 4)
    else:
        segments.append({"status": status.value, "start": round(start_h, 4), "end": round(end_h, 4)})


def _remark(activity: Activity, hour: float, location_at: LocationLookup) -> dict:
    return {
        "hour": round(hour, 4),
        "time": _clock_label(hour),
        "status": activity.status.value,
        "location": location_at(activity.start_mile),
        "note": activity.label,
    }


def _recap(on_duty_today: float, cycle: float, rules: HOSRules) -> dict:
    return {
        "on_duty_today": round(on_duty_today / 60, 2),
        "cycle_used": round(cycle / 60, 2),
        "available_tomorrow": round(max(rules.cycle_limit_min - cycle, 0) / 60, 2),
    }


def _first_location(previous_logs: list[dict], location_at: LocationLookup) -> str:
    return previous_logs[-1]["to_location"] if previous_logs else location_at(0.0)


def _last_mile_on_day(timeline: list[tuple[Activity | None, float, float]], day_end: float) -> float:
    mile = 0.0
    for activity, a_start, a_end in timeline:
        if activity is None or a_start >= day_end:
            continue
        if a_end <= day_end:
            mile = activity.end_mile
        else:
            fraction = (day_end - a_start) / activity.duration_min
            mile = activity.start_mile + (activity.end_mile - activity.start_mile) * fraction
    return mile


def _clock_label(hour: float) -> str:
    total_minutes = round(hour * 60)
    h, m = divmod(total_minutes, 60)
    return f"{h:02d}:{m:02d}"
