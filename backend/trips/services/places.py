"""Offline nearest-town lookup for log-sheet remarks.

Data: US populated places (population >= 5,000) from GeoNames, CC BY 4.0
(https://www.geonames.org). Bundled so remarks resolve instantly without
hammering public reverse-geocoding services.
"""

from __future__ import annotations

import csv
import math
from functools import cache
from pathlib import Path

DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "us_places.csv"
MAX_DISTANCE_MILES = 60


@cache
def _places() -> list[tuple[str, float, float]]:
    with DATA_FILE.open(newline="", encoding="utf-8") as fh:
        return [(f"{r['name']}, {r['state']}", float(r["lat"]), float(r["lon"])) for r in csv.DictReader(fh)]


def nearest_town(lat: float, lon: float) -> str | None:
    """'City, ST' of the closest bundled place, or None if nothing is within range."""
    cos_lat = math.cos(math.radians(lat))
    best, best_d2 = None, float("inf")
    for label, p_lat, p_lon in _places():
        d2 = (p_lat - lat) ** 2 + ((p_lon - lon) * cos_lat) ** 2
        if d2 < best_d2:
            best, best_d2 = label, d2
    miles = math.sqrt(best_d2) * 69.0
    return best if miles <= MAX_DISTANCE_MILES else None
