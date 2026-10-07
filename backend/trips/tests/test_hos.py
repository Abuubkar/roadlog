from datetime import datetime
from itertools import pairwise

from django.test import SimpleTestCase

from trips.services.hos import Activity, ActivityKind, DutyStatus, HOSPlanner, HOSRules, Leg
from trips.services.logs import build_daily_logs

RULES = HOSRules()


def plan(miles_to_pickup: float, miles_to_dropoff: float, cycle_used: float = 0, mph: float = 50):
    legs = [Leg(miles, miles / mph * 60) for miles in (miles_to_pickup, miles_to_dropoff)]
    return HOSPlanner(cycle_used).plan(legs)


def assert_compliant(test: SimpleTestCase, activities: list[Activity], cycle_used: float = 0) -> None:
    """Replay a plan and check every rule independently of the planner's own bookkeeping."""
    shift_start = None
    shift_driving = since_break = non_driving = miles_since_fuel = 0.0
    cycle = cycle_used * 60

    for prev, a in pairwise([None, *activities]):
        if prev:
            test.assertAlmostEqual(prev.end_min, a.start_min, msg="timeline must be contiguous")
        if a.kind == ActivityKind.RESTART:
            test.assertGreaterEqual(a.duration_min, RULES.restart_min)
            cycle, shift_start = 0.0, None
        if a.kind == ActivityKind.REST:
            test.assertGreaterEqual(a.duration_min, RULES.daily_rest_min)
            shift_start = None

        if a.status == DutyStatus.DRIVING:
            if shift_start is None:
                shift_start = a.start_min
            shift_driving += a.duration_min
            since_break += a.duration_min
            miles_since_fuel += a.end_mile - a.start_mile
            non_driving = 0.0
            test.assertLessEqual(shift_driving, RULES.max_driving_min + 1e-6, "11-hour limit")
            test.assertLessEqual(a.end_min - shift_start, RULES.duty_window_min + 1e-6, "14-hour window")
            test.assertLessEqual(since_break, RULES.break_after_driving_min + 1e-6, "30-minute break")
            test.assertLessEqual(miles_since_fuel, RULES.fuel_interval_miles + 1e-6, "fuel interval")
        else:
            non_driving += a.duration_min
            if non_driving >= RULES.break_min:
                since_break = 0.0
            if a.kind in (ActivityKind.REST, ActivityKind.RESTART):
                shift_driving = 0.0
            if a.kind == ActivityKind.FUEL:
                miles_since_fuel = 0.0
            if a.status == DutyStatus.ON_DUTY and shift_start is None:
                shift_start = a.start_min

        if a.status in (DutyStatus.DRIVING, DutyStatus.ON_DUTY):
            cycle += a.duration_min
            test.assertLessEqual(cycle, RULES.cycle_limit_min + 1e-6, "70-hour/8-day limit")


class HOSPlannerTests(SimpleTestCase):
    def kinds(self, activities):
        return [a.kind for a in activities]

    def test_short_trip_has_no_rest_stops(self):
        activities = plan(50, 100)
        self.assertEqual(
            self.kinds(activities),
            [
                ActivityKind.PRE_TRIP,
                ActivityKind.DRIVE,
                ActivityKind.PICKUP,
                ActivityKind.DRIVE,
                ActivityKind.DROPOFF,
                ActivityKind.POST_TRIP,
            ],
        )
        self.assertAlmostEqual(activities[-1].end_mile, 150)

    def test_pickup_and_dropoff_take_one_hour(self):
        activities = plan(50, 100)
        for a in activities:
            if a.kind in (ActivityKind.PICKUP, ActivityKind.DROPOFF):
                self.assertEqual(a.duration_min, 60)

    def test_break_is_taken_after_eight_hours_of_driving(self):
        activities = plan(0, 450)  # 9 hours of driving
        breaks = [a for a in activities if a.kind == ActivityKind.BREAK]
        self.assertEqual(len(breaks), 1)
        before_break = activities[: activities.index(breaks[0])]
        driven_before = sum(a.duration_min for a in before_break if a.status == DutyStatus.DRIVING)
        self.assertAlmostEqual(driven_before, 8 * 60)
        assert_compliant(self, activities)

    def test_long_pickup_counts_as_the_thirty_minute_break(self):
        activities = plan(350, 200)  # 7h, 1h pickup, then 4h
        self.assertNotIn(ActivityKind.BREAK, self.kinds(activities))
        assert_compliant(self, activities)

    def test_eleven_hour_limit_forces_ten_hour_rest(self):
        activities = plan(0, 1000)  # 20 hours of driving
        self.assertIn(ActivityKind.REST, self.kinds(activities))
        rest = next(a for a in activities if a.kind == ActivityKind.REST)
        self.assertEqual(rest.status, DutyStatus.SLEEPER_BERTH)
        self.assertEqual(rest.duration_min, 600)
        assert_compliant(self, activities)

    def test_fuel_stop_at_least_every_thousand_miles(self):
        activities = plan(100, 2400, mph=60)
        fuel_miles = [a.start_mile for a in activities if a.kind == ActivityKind.FUEL]
        self.assertEqual(len(fuel_miles), 2)
        self.assertAlmostEqual(fuel_miles[0], 1000)
        self.assertAlmostEqual(fuel_miles[1], 2000)
        assert_compliant(self, activities)

    def test_exhausted_cycle_triggers_34_hour_restart(self):
        activities = plan(100, 600, cycle_used=65)
        self.assertIn(ActivityKind.RESTART, self.kinds(activities))
        assert_compliant(self, activities, cycle_used=65)

    def test_full_cycle_restarts_before_any_work(self):
        activities = plan(100, 100, cycle_used=70)
        self.assertEqual(activities[0].kind, ActivityKind.RESTART)
        assert_compliant(self, activities, cycle_used=70)

    def test_inspections_can_be_disabled(self):
        legs = [Leg(50, 60), Leg(100, 120)]
        activities = HOSPlanner(0, HOSRules(include_inspections=False)).plan(legs)
        self.assertNotIn(ActivityKind.PRE_TRIP, self.kinds(activities))
        self.assertNotIn(ActivityKind.POST_TRIP, self.kinds(activities))

    def test_many_trips_are_compliant(self):
        for to_pickup in (0, 120, 640):
            for to_dropoff in (30, 800, 1900, 3100):
                for cycle in (0, 33.5, 62, 69, 69.5, 69.75):
                    with self.subTest(to_pickup=to_pickup, to_dropoff=to_dropoff, cycle=cycle):
                        assert_compliant(self, plan(to_pickup, to_dropoff, cycle), cycle)


class DailyLogTests(SimpleTestCase):
    def build(self, start=datetime(2026, 1, 5, 7, 30), cycle=10):
        activities = plan(200, 1500)
        return activities, build_daily_logs(activities, start, cycle, lambda mile: f"Mile {mile:.0f}")

    def test_every_day_totals_twenty_four_hours(self):
        _, logs = self.build()
        self.assertGreater(len(logs), 1)
        for log in logs:
            self.assertAlmostEqual(sum(log["totals"].values()), 24, places=1)

    def test_segments_cover_the_day_without_gaps(self):
        _, logs = self.build()
        for log in logs:
            segments = log["segments"]
            self.assertEqual(segments[0]["start"], 0)
            self.assertEqual(segments[-1]["end"], 24)
            for a, b in pairwise(segments):
                self.assertAlmostEqual(a["end"], b["start"])
                self.assertNotEqual(a["status"], b["status"])

    def test_before_trip_start_is_off_duty(self):
        _, logs = self.build()
        self.assertEqual(logs[0]["segments"][0], {"status": "off_duty", "start": 0, "end": 7.5})

    def test_daily_miles_add_up_to_trip_miles(self):
        activities, logs = self.build()
        self.assertAlmostEqual(sum(log["total_miles"] for log in logs), activities[-1].end_mile, delta=0.5)

    def test_remarks_record_each_status_change(self):
        activities, logs = self.build()
        self.assertEqual(sum(len(log["remarks"]) for log in logs), len(activities))
        self.assertEqual(logs[0]["remarks"][0]["time"], "07:30")
        self.assertEqual(logs[0]["remarks"][0]["location"], "Mile 0")

    def test_recap_tracks_the_cycle(self):
        _, logs = self.build(cycle=10)
        first = logs[0]["recap"]
        self.assertAlmostEqual(first["cycle_used"], 10 + first["on_duty_today"], places=1)
        self.assertAlmostEqual(first["available_tomorrow"], 70 - first["cycle_used"], places=1)
