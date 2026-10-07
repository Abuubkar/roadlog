"""Thin clients for the free map services: Photon/Nominatim (geocoding) and OSRM (routing).

All three hosts are on PythonAnywhere's free-tier allowlist.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from functools import lru_cache
from itertools import pairwise

import requests
from django.conf import settings

from .places import nearest_town

METERS_PER_MILE = 1609.344
TIMEOUT = 12

US_STATES = {
    "Alabama": "AL",
    "Alaska": "AK",
    "Arizona": "AZ",
    "Arkansas": "AR",
    "California": "CA",
    "Colorado": "CO",
    "Connecticut": "CT",
    "Delaware": "DE",
    "District of Columbia": "DC",
    "Florida": "FL",
    "Georgia": "GA",
    "Hawaii": "HI",
    "Idaho": "ID",
    "Illinois": "IL",
    "Indiana": "IN",
    "Iowa": "IA",
    "Kansas": "KS",
    "Kentucky": "KY",
    "Louisiana": "LA",
    "Maine": "ME",
    "Maryland": "MD",
    "Massachusetts": "MA",
    "Michigan": "MI",
    "Minnesota": "MN",
    "Mississippi": "MS",
    "Missouri": "MO",
    "Montana": "MT",
    "Nebraska": "NE",
    "Nevada": "NV",
    "New Hampshire": "NH",
    "New Jersey": "NJ",
    "New Mexico": "NM",
    "New York": "NY",
    "North Carolina": "NC",
    "North Dakota": "ND",
    "Ohio": "OH",
    "Oklahoma": "OK",
    "Oregon": "OR",
    "Pennsylvania": "PA",
    "Rhode Island": "RI",
    "South Carolina": "SC",
    "South Dakota": "SD",
    "Tennessee": "TN",
    "Texas": "TX",
    "Utah": "UT",
    "Vermont": "VT",
    "Virginia": "VA",
    "Washington": "WA",
    "West Virginia": "WV",
    "Wisconsin": "WI",
    "Wyoming": "WY",
}


class GeoServiceError(Exception):
    """Raised when an upstream map service fails or returns nothing useful."""


@dataclass(frozen=True)
class Place:
    label: str
    lat: float
    lon: float


@dataclass(frozen=True)
class Route:
    distance_miles: float
    duration_min: float
    geometry: list[tuple[float, float]]  # (lat, lon)
    legs: list[tuple[float, float]]  # (miles, minutes) per leg
    instructions: list[dict]


_session = requests.Session()


def _get(url: str, params: dict | None = None) -> dict:
    try:
        response = _session.get(
            url, params=params, timeout=TIMEOUT, headers={"User-Agent": settings.GEO_USER_AGENT}
        )
        response.raise_for_status()
        return response.json()
    except (requests.RequestException, ValueError) as exc:
        raise GeoServiceError(f"Map service request failed: {exc}") from exc


# ----------------------------------------------------------------- geocoding


def geocode(query: str) -> Place:
    """Forward-geocode free text. Photon first, Nominatim as a fallback."""
    data = _get(f"{settings.PHOTON_URL}/api", {"q": query, "limit": 1, "lang": "en"})
    features = data.get("features") or []
    if features:
        lon, lat = features[0]["geometry"]["coordinates"]
        return Place(_photon_label(features[0]["properties"]) or query, lat, lon)

    results = _get(f"{settings.NOMINATIM_URL}/search", {"q": query, "format": "jsonv2", "limit": 1})
    if results:
        hit = results[0]
        return Place(hit.get("display_name", query), float(hit["lat"]), float(hit["lon"]))
    raise GeoServiceError(f"Could not find a location for “{query}”.")


@lru_cache(maxsize=2048)
def reverse_geocode(lat: float, lon: float) -> str:
    """Nearest 'City, ST' for a coordinate (used for log-sheet remarks)."""
    if town := nearest_town(lat, lon):
        return town
    try:
        data = _get(f"{settings.PHOTON_URL}/reverse", {"lat": lat, "lon": lon, "lang": "en"})
        features = data.get("features") or []
        if features:
            return _photon_label(features[0]["properties"], short=True) or _coords(lat, lon)
    except GeoServiceError:
        pass
    return _coords(lat, lon)


SETTLEMENT_TYPES = {"city", "town", "village", "hamlet", "locality"}


def _photon_label(props: dict, short: bool = False) -> str:
    city = props.get("name") if props.get("type") in SETTLEMENT_TYPES else None
    city = city or props.get("city") or props.get("town") or props.get("village") or props.get("county")
    state = props.get("state")
    state = US_STATES.get(state, state)
    if short:
        return ", ".join(p for p in (city or props.get("name"), state) if p)
    name = props.get("name")
    parts = [name, city if city != name else None, state]
    return ", ".join(p for p in parts if p)


def _coords(lat: float, lon: float) -> str:
    return f"{lat:.3f}, {lon:.3f}"


# ------------------------------------------------------------------- routing


def route(points: list[Place]) -> Route:
    coords = ";".join(f"{p.lon:.6f},{p.lat:.6f}" for p in points)
    data = _get(
        f"{settings.OSRM_URL}/route/v1/driving/{coords}",
        {"overview": "full", "geometries": "geojson", "steps": "true"},
    )
    if data.get("code") != "Ok" or not data.get("routes"):
        raise GeoServiceError("No drivable route found between these locations.")

    best = data["routes"][0]
    geometry = [(lat, lon) for lon, lat in best["geometry"]["coordinates"]]
    legs = [(leg["distance"] / METERS_PER_MILE, leg["duration"] / 60) for leg in best["legs"]]
    instructions = [
        step for index, leg in enumerate(best["legs"]) for step in _instructions(leg.get("steps", []), index)
    ]
    return Route(
        distance_miles=best["distance"] / METERS_PER_MILE,
        duration_min=best["duration"] / 60,
        geometry=_downsample(geometry, 4000),
        legs=legs,
        instructions=instructions,
    )


def _instructions(steps: list[dict], leg_index: int) -> list[dict]:
    out = []
    for step in steps:
        maneuver = step.get("maneuver", {})
        kind, modifier = maneuver.get("type", ""), maneuver.get("modifier", "")
        road = step.get("ref") or step.get("name") or ""
        text = _maneuver_text(kind, modifier, road)
        if not text:
            continue
        out.append(
            {
                "leg": leg_index,
                "text": text,
                "distance_miles": round(step.get("distance", 0) / METERS_PER_MILE, 1),
                "type": kind,
                "modifier": modifier,
            }
        )
    return out


def _maneuver_text(kind: str, modifier: str, road: str) -> str:
    onto = f" onto {road}" if road else ""
    direction = modifier.replace("uturn", "U-turn")
    match kind:
        case "depart":
            return f"Head out{(' on ' + road) if road else ''}"
        case "arrive":
            return "Arrive at destination"
        case "turn" | "end of road" | "fork":
            return f"{'Keep' if kind == 'fork' else 'Turn'} {direction}{onto}".strip()
        case "merge":
            return f"Merge{onto}"
        case "on ramp":
            return f"Take the ramp{onto}"
        case "off ramp":
            return f"Take the exit{onto}"
        case "roundabout" | "rotary":
            return f"Enter the roundabout and exit{onto}"
        case "new name" | "continue":
            return f"Continue{onto}" if road else ""
        case "notification" | "use lane":
            return ""
        case _:
            return f"{kind.capitalize()} {direction}{onto}".strip()


def _downsample(points: list[tuple[float, float]], limit: int) -> list[tuple[float, float]]:
    if len(points) <= limit:
        return points
    stride = math.ceil(len(points) / limit)
    return points[::stride] + [points[-1]]


# ------------------------------------------------------------------ geometry


def haversine_miles(a: tuple[float, float], b: tuple[float, float]) -> float:
    lat1, lon1, lat2, lon2 = map(math.radians, (*a, *b))
    h = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin((lon2 - lon1) / 2) ** 2
    return 3958.8 * 2 * math.asin(math.sqrt(h))


class RouteLocator:
    """Find the coordinate at a given mile along a polyline."""

    def __init__(self, geometry: list[tuple[float, float]], total_miles: float):
        self._points = geometry
        cumulative = [0.0]
        for a, b in pairwise(geometry):
            cumulative.append(cumulative[-1] + haversine_miles(a, b))
        self._cumulative = cumulative
        # Scale straight-line sums to the router's road distance.
        self._scale = cumulative[-1] / total_miles if total_miles else 1.0

    def at(self, mile: float) -> tuple[float, float]:
        target = mile * self._scale
        cum, pts = self._cumulative, self._points
        if target <= 0:
            return pts[0]
        if target >= cum[-1]:
            return pts[-1]
        lo, hi = 0, len(cum) - 1
        while hi - lo > 1:
            mid = (lo + hi) // 2
            lo, hi = (mid, hi) if cum[mid] <= target else (lo, mid)
        span = cum[hi] - cum[lo] or 1.0
        t = (target - cum[lo]) / span
        (lat1, lon1), (lat2, lon2) = pts[lo], pts[hi]
        return lat1 + (lat2 - lat1) * t, lon1 + (lon2 - lon1) * t
