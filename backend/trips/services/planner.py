"""Orchestrates a trip plan: geocode -> route -> HOS simulation -> stops & daily logs."""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from datetime import datetime, timedelta

from django.conf import settings

from . import geo
from .hos import Activity, ActivityKind, DutyStatus, HOSPlanner, HOSRules, Leg
from .logs import build_daily_logs

STOP_KINDS = {
    ActivityKind.PICKUP,
    ActivityKind.DROPOFF,
    ActivityKind.FUEL,
    ActivityKind.BREAK,
    ActivityKind.REST,
    ActivityKind.RESTART,
}


@dataclass(frozen=True)
class TripRequest:
    current: geo.Place | str
    pickup: geo.Place | str
    dropoff: geo.Place | str
    cycle_used_hours: float
    start: datetime
    include_inspections: bool = True


def plan_trip(req: TripRequest) -> dict:
    with ThreadPoolExecutor(max_workers=3) as pool:
        current, pickup, dropoff = pool.map(_resolve, (req.current, req.pickup, req.dropoff))
    route = geo.route([current, pickup, dropoff])
    legs = [Leg(miles, _truck_minutes(miles, minutes)) for miles, minutes in route.legs]

    rules = HOSRules(include_inspections=req.include_inspections)
    activities = HOSPlanner(req.cycle_used_hours, rules).plan(legs)

    locator = geo.RouteLocator(route.geometry, route.distance_miles)
    pickup_mile = legs[0].distance_miles
    anchors = {0.0: current, pickup_mile: pickup, route.distance_miles: dropoff}
    names = _LocationNames(locator, anchors)
    names.prefetch(a.start_mile for a in activities)

    at = lambda minutes: req.start + timedelta(minutes=minutes)  # noqa: E731
    stops = [_stop(i, a, names, at) for i, a in enumerate(activities) if a.kind in STOP_KINDS]

    return {
        "locations": {"current": _place(current), "pickup": _place(pickup), "dropoff": _place(dropoff)},
        "route": {
            "distance_miles": round(route.distance_miles, 1),
            "driving_hours": round(sum(leg.duration_min for leg in legs) / 60, 2),
            "geometry": [[round(lat, 5), round(lon, 5)] for lat, lon in route.geometry],
            "legs": [
                {"from": "current", "to": "pickup", **_leg(legs[0])},
                {"from": "pickup", "to": "dropoff", **_leg(legs[1])},
            ],
            "instructions": route.instructions,
        },
        "stops": stops,
        "timeline": [_timeline_entry(a, names, at) for a in activities],
        "logs": build_daily_logs(activities, req.start, req.cycle_used_hours, names.name, rules),
        "summary": _summary(activities, req, at),
    }


# --------------------------------------------------------------------- helpers


def _resolve(place: geo.Place | str) -> geo.Place:
    return place if isinstance(place, geo.Place) else geo.geocode(place)


def _truck_minutes(miles: float, router_minutes: float) -> float:
    """OSRM times are for cars; trucks rarely average more than the configured cap."""
    floor = miles / settings.TRUCK_AVG_SPEED_CAP_MPH * 60
    return max(router_minutes, floor)


class _LocationNames:
    """Resolves trip miles to 'City, ST', reverse-geocoding in parallel and caching."""

    def __init__(self, locator: geo.RouteLocator, anchors: dict[float, geo.Place]):
        self._locator = locator
        self._anchors = anchors
        self._cache: dict[tuple[float, float], str] = {}

    def coords(self, mile: float) -> tuple[float, float]:
        for anchor_mile, place in self._anchors.items():
            if abs(anchor_mile - mile) < 0.05:
                return place.lat, place.lon
        lat, lon = self._locator.at(mile)
        return round(lat, 3), round(lon, 3)

    def prefetch(self, miles) -> None:
        missing = list({self.coords(m) for m in miles} - self._cache.keys())
        with ThreadPoolExecutor(max_workers=12) as pool:
            for key, label in zip(missing, pool.map(lambda c: geo.reverse_geocode(*c), missing), strict=True):
                self._cache[key] = label

    def name(self, mile: float) -> str:
        key = self.coords(mile)
        if key not in self._cache:
            self._cache[key] = geo.reverse_geocode(*key)
        return self._cache[key]


def _stop(index: int, a: Activity, names: _LocationNames, at) -> dict:
    lat, lon = names.coords(a.start_mile)
    return {
        "id": index,
        "type": a.kind.value,
        "label": a.label,
        "status": a.status.value,
        "location": names.name(a.start_mile),
        "lat": lat,
        "lon": lon,
        "mile": round(a.start_mile, 1),
        "arrival": at(a.start_min).isoformat(timespec="minutes"),
        "departure": at(a.end_min).isoformat(timespec="minutes"),
        "duration_hours": round(a.duration_min / 60, 2),
    }


def _timeline_entry(a: Activity, names: _LocationNames, at) -> dict:
    return {
        "type": a.kind.value,
        "label": a.label,
        "status": a.status.value,
        "start": at(a.start_min).isoformat(timespec="minutes"),
        "end": at(a.end_min).isoformat(timespec="minutes"),
        "duration_hours": round(a.duration_min / 60, 2),
        "start_mile": round(a.start_mile, 1),
        "end_mile": round(a.end_mile, 1),
        "location": names.name(a.start_mile),
    }


def _summary(activities: list[Activity], req: TripRequest, at) -> dict:
    def hours(*statuses: DutyStatus) -> float:
        return round(sum(a.duration_min for a in activities if a.status in statuses) / 60, 2)

    def count(kind: ActivityKind) -> int:
        return sum(a.kind == kind for a in activities)

    end = activities[-1].end_min
    return {
        "start": req.start.isoformat(timespec="minutes"),
        "end": at(end).isoformat(timespec="minutes"),
        "total_hours": round(end / 60, 2),
        "total_miles": round(activities[-1].end_mile, 1),
        "driving_hours": hours(DutyStatus.DRIVING),
        "on_duty_hours": hours(DutyStatus.DRIVING, DutyStatus.ON_DUTY),
        "off_duty_hours": hours(DutyStatus.OFF_DUTY, DutyStatus.SLEEPER_BERTH),
        "fuel_stops": count(ActivityKind.FUEL),
        "breaks": count(ActivityKind.BREAK),
        "rests": count(ActivityKind.REST),
        "restarts": count(ActivityKind.RESTART),
        "cycle_used_start": req.cycle_used_hours,
    }


def _place(p: geo.Place) -> dict:
    return {"label": p.label, "lat": p.lat, "lon": p.lon}


def _leg(leg: Leg) -> dict:
    return {"distance_miles": round(leg.distance_miles, 1), "duration_hours": round(leg.duration_min / 60, 2)}
