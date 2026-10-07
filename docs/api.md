# API

Base URL: `VITE_API_URL` (locally `http://localhost:8000`).

## `POST /api/trips/plan/`

### Request

```json
{
  "current_location": { "label": "Chicago, IL", "lat": 41.8756, "lon": -87.6244 },
  "pickup_location": "Indianapolis, IN",
  "dropoff_location": "Los Angeles, CA",
  "current_cycle_used": 20,
  "start_time": "2026-10-08T08:00",
  "include_inspections": true
}
```

| Field | Type | Notes |
| --- | --- | --- |
| `*_location` | string or `{label, lat, lon}` | Free text is geocoded server-side |
| `current_cycle_used` | number, 0–70 | On-duty hours already used in the current 8-day cycle |
| `start_time` | ISO datetime (optional) | Home-terminal time. Defaults to the current hour |
| `include_inspections` | boolean (optional, default `true`) | 15 min pre-trip and post-trip inspections |

### Response `200`

| Key | Contents |
| --- | --- |
| `locations` | Resolved `current`, `pickup`, `dropoff` |
| `route` | `distance_miles`, `driving_hours`, `geometry` (`[lat, lon][]`), `legs`, `instructions` |
| `stops` | Pickup, drop-off, fuel, breaks, rests and restarts, each with coordinates, arrival/departure and duration |
| `timeline` | Every duty-status activity in order |
| `logs` | One sheet per day: `segments` (hours 0–24), `totals`, `remarks`, `recap`, `total_miles`, `from_location`, `to_location` |
| `summary` | Trip totals and counts |

### Errors

- `400`: validation errors, keyed by field.
- `502`: a map service failed or no route exists (`{"detail": "..."}`).

## `GET /api/health/`

Returns `{"status": "ok"}`.
