<div align="center">

<img src="frontend/public/favicon.svg" width="72" alt="RoadLog logo" />

# RoadLog

**Hours-of-Service trip planner & ELD daily log generator for truck drivers**

Enter a trip and get the route, every legally required stop, and filled-out *Drivers Daily Log* sheets for each day on the road.

[![CI](https://github.com/Abuubkar/roadlog/actions/workflows/ci.yml/badge.svg)](https://github.com/Abuubkar/roadlog/actions/workflows/ci.yml)
[![Deploy](https://github.com/Abuubkar/roadlog/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/Abuubkar/roadlog/actions/workflows/deploy-pages.yml)
![Django](https://img.shields.io/badge/Django-5.2-092E20?logo=django&logoColor=white)
![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
[![License: MIT](https://img.shields.io/badge/License-MIT-f59200.svg)](LICENSE)

**[Live demo](https://abuubkar.github.io/roadlog/)** · [Live API](https://abubakarrkhawaj.pythonanywhere.com/api/health/) · [API docs](docs/api.md) · [HOS model](docs/hos-rules.md) · [Architecture](docs/architecture.md)

</div>

---

## Features

- **Trip inputs:** current, pickup and drop-off locations (with address autocomplete), plus current cycle hours used and departure time.
- **Fleet-console UI:** sidebar navigation, a one-row trip bar, a KPI summary strip, and Overview / Route & stops / Daily logs / Directions tabs. The design follows fleet-compliance tools like Motive and Samsara.
- **Route map:** the full route on a muted Esri basemap (with a satellite option), plus markers for pickup, drop-off, fuel stops, 30-minute breaks, 10-hour rests and 34-hour restarts.
- **Live HOS clocks:** drag along the whole-trip duty-status timeline to move the truck on the map. The until-break, drive, shift and cycle clocks and the upcoming stops update as you go.
- **HOS-compliant schedule:** enforces the 11-hour driving limit, the 14-hour window, the 30-minute break, the 70 h / 8-day cycle, fueling every 1,000 mi, and 1 h pickup/drop-off.
- **Daily logs:** one per calendar day. Each has an ELD-style graph, an events table, day totals, the 70-hour recap and a form-and-manner checklist. A **Paper form** toggle draws the FMCSA paper log sheet, with the grid line, totals that sum to 24, remarks and the recap.
- **Itinerary & directions:** a day-by-day timeline and turn-by-turn instructions for each leg.
- **Print-ready:** print every sheet, or save them as a PDF, one landscape page per day.

## Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, React Leaflet, Lucide icons |
| Backend | Django 5.2, Django REST Framework, django-cors-headers |
| Map services | [OSRM](https://project-osrm.org) routing, [Photon](https://photon.komoot.io) / [Nominatim](https://nominatim.org) geocoding, [OpenStreetMap](https://www.openstreetmap.org) tiles, [GeoNames](https://www.geonames.org) places. All free, no API keys |
| Hosting | GitHub Pages (frontend) · PythonAnywhere (API) |
| Quality | Django test suite, Ruff, Oxlint, strict TypeScript, GitHub Actions CI |

## Project structure

```text
roadlog/
├── backend/                     Django REST API
│   ├── config/                  settings, urls, wsgi
│   ├── trips/
│   │   ├── services/
│   │   │   ├── hos.py           HOS rules engine (pure, unit-tested)
│   │   │   ├── logs.py          activities → daily log sheets
│   │   │   ├── geo.py           OSRM / Photon / Nominatim clients
│   │   │   ├── places.py        offline nearest-town lookup
│   │   │   └── planner.py       orchestration
│   │   ├── data/us_places.csv   GeoNames US places (CC BY 4.0)
│   │   ├── tests/               HOS compliance + API tests
│   │   ├── serializers.py
│   │   └── views.py
│   ├── deploy/                  PythonAnywhere WSGI template
│   └── requirements.txt
├── frontend/                    React + Vite SPA
│   └── src/
│       ├── api/                 HTTP client
│       ├── components/
│       │   ├── layout/          sidebar, page header & tabs
│       │   ├── trip-form/       trip bar & address autocomplete
│       │   ├── summary/         KPI strip
│       │   ├── map/             Leaflet route map
│       │   ├── hos/             HOS clocks & upcoming stops
│       │   ├── timeline/        whole-trip duty status scrubber
│       │   ├── logs/            log graph, events, paper form
│       │   ├── itinerary/       stops table & directions
│       │   └── ui/              shared primitives
│       ├── hooks/ · lib/ · types/
├── docs/
│   ├── assessment/              original brief, FMCSA guide, video transcript
│   ├── api.md · architecture.md · hos-rules.md · deployment.md
└── .github/workflows/           CI + GitHub Pages deploy
```

## Getting started

**Prerequisites:** Python 3.11+ and Node 20+.

### API

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env            # DJANGO_DEBUG=true is enough locally
python manage.py runserver      # http://localhost:8000
```

### Web app

```bash
cd frontend
npm install
npm run dev                     # http://localhost:5173
```

Click **Load sample trip** to fill in Chicago → Indianapolis → Los Angeles, or open `/?sample` to plan it straight away.

### Tests & linting

```bash
cd backend && python manage.py test && ruff check .
cd frontend && npm run lint && npm run build
```

## How the planner works

1. Geocode the three locations and request one OSRM route through them.
2. Simulate the trip against the HOS limits. Whenever the next limit would be hit, insert the stop that clears it (break, rest, fuel or restart).
3. Map each stop to a point on the route and the nearest town.
4. Split the timeline at midnight into daily log sheets.

The full rule table and modelling assumptions are in [docs/hos-rules.md](docs/hos-rules.md).

## Deployment

Full steps are in [docs/deployment.md](docs/deployment.md).

- **Frontend:** every push to `main` builds and publishes to GitHub Pages via [`deploy-pages.yml`](.github/workflows/deploy-pages.yml).
- **API:** runs on PythonAnywhere using the WSGI template in [`backend/deploy/`](backend/deploy/pythonanywhere_wsgi.py).

## License

[MIT](LICENSE). Place data © GeoNames (CC BY 4.0); map data © OpenStreetMap contributors.
