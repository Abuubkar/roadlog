# Hours-of-Service model

RoadLog simulates a **property-carrying** driver under FMCSA 49 CFR Part 395, **70-hour / 8-day** cycle, with no adverse driving conditions. The engine is pure Python in [`backend/trips/services/hos.py`](../backend/trips/services/hos.py) and is covered by [`test_hos.py`](../backend/trips/tests/test_hos.py). That suite replays every plan through an independent rule checker.

## Rules enforced

| Rule | Limit | What the planner does |
| --- | --- | --- |
| Driving limit | 11 h driving after 10 h off | Stops for a **10 h sleeper-berth rest** |
| Driving window | No driving after the 14th hour on duty | Stops for a **10 h rest**. On-duty work (e.g. unloading) may continue past hour 14 |
| Rest break | 30 min after 8 h of cumulative driving | Takes a **30 min off-duty break**. Any 30 consecutive non-driving minutes count, so a 1 h pickup resets it |
| Cycle | 70 h on duty in 8 days | Takes a **34 h restart** before the cycle would be exceeded |
| Fuel | At least every 1,000 mi | **30 min on-duty** fuel stop |
| Pickup / drop-off | 1 h each | On duty, not driving |
| Inspections | 15 min pre-trip each shift, 15 min post-trip | On duty, not driving. Can be turned off in the form |

If a break is due but less than 30 minutes of the 14-hour window is left, the planner takes the 10-hour rest instead. A break there would leave no time to drive.

## Assumptions

- **Cycle hours don't roll off during the trip.** The input gives only a total for "current cycle used", not a day-by-day history, so the planner assumes none of those hours expire mid-trip. This is the conservative choice: it may plan a restart slightly earlier than strictly necessary, but never too late.
- **Truck speed.** OSRM's public router uses a car profile. Leg times are therefore the slower of OSRM's estimate and the distance at a **55 mph average** (`TRUCK_AVG_SPEED_CAP_MPH`).
- **Clock.** All times use the home-terminal clock as entered ("Departure"). Time zones aren't converted, which matches the paper-log rule *"use time standard of home terminal"*.
- **Log sheets.** Each calendar day gets its own sheet (midnight to midnight). Time before departure and after the post-trip inspection is logged off duty, so every sheet totals 24 h.
- **Remarks.** Every change of duty status is recorded with the nearest city/town and state (GeoNames places with population ≥ 5,000).
- **Recap.** Column A is the running cycle total (the starting hours plus on-duty time logged since), and B is 70 − A. Column C needs a day-by-day history that the input doesn't provide, so it is left blank.
