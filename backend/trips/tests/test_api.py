from unittest.mock import patch

from django.test import SimpleTestCase, override_settings
from rest_framework.test import APIClient

from trips.services.geo import GeoServiceError, Place, Route

ROUTE = Route(
    distance_miles=700,
    duration_min=700,
    geometry=[(41.88, -87.63), (39.77, -86.16), (35.15, -90.05)],
    legs=[(180, 180), (520, 520)],
    instructions=[
        {"leg": 0, "text": "Head out on I-65", "distance_miles": 180, "type": "depart", "modifier": ""},
    ],
)

PAYLOAD = {
    "current_location": {"label": "Chicago, IL", "lat": 41.88, "lon": -87.63},
    "pickup_location": {"label": "Indianapolis, IN", "lat": 39.77, "lon": -86.16},
    "dropoff_location": {"label": "Memphis, TN", "lat": 35.15, "lon": -90.05},
    "current_cycle_used": 12.5,
    "start_time": "2026-03-02T06:00",
}


@override_settings(ALLOWED_HOSTS=["testserver"])
@patch("trips.services.planner.geo.route", return_value=ROUTE)
class TripPlanApiTests(SimpleTestCase):
    def setUp(self):
        self.client = APIClient()

    def post(self, payload):
        return self.client.post("/api/trips/plan/", payload, format="json")

    def test_returns_route_stops_and_logs(self, _route):
        response = self.post(PAYLOAD)
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["route"]["distance_miles"], 700)
        self.assertEqual(body["summary"]["start"], "2026-03-02T06:00")
        self.assertTrue(body["logs"])
        stop_types = [s["type"] for s in body["stops"]]
        self.assertEqual(stop_types[0], "pickup")
        self.assertEqual(stop_types[-1], "dropoff")
        self.assertEqual(body["stops"][0]["location"], "Indianapolis, IN")

    @patch("trips.services.planner.geo.geocode", return_value=Place("Dallas, TX", 32.78, -96.8))
    def test_free_text_locations_are_geocoded(self, geocode, _route):
        payload = {**PAYLOAD, "current_location": "Dallas, TX"}
        self.assertEqual(self.post(payload).status_code, 200)
        geocode.assert_called_once_with("Dallas, TX")

    def test_validates_cycle_hours(self, _route):
        response = self.post({**PAYLOAD, "current_cycle_used": 71})
        self.assertEqual(response.status_code, 400)
        self.assertIn("current_cycle_used", response.json())

    def test_requires_locations(self, _route):
        response = self.post({**PAYLOAD, "pickup_location": ""})
        self.assertEqual(response.status_code, 400)

    def test_map_service_failure_is_a_bad_gateway(self, route):
        route.side_effect = GeoServiceError("No drivable route found between these locations.")
        response = self.post(PAYLOAD)
        self.assertEqual(response.status_code, 502)
        self.assertIn("No drivable route", response.json()["detail"])

    def test_health(self, _route):
        self.assertEqual(self.client.get("/api/health/").json(), {"status": "ok"})
