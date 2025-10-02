# Simple Weather Dashboard

Full-stack implementation of the Simple Weather Dashboard for Kyiv, Singapore, London, and Sydney. The solution follows the provided Solution Design Document (SDD), consisting of a Kotlin/Spring Boot backend, a Postgres database for city metadata, and a React single-page frontend that consumes the backend API.

## Project Layout

```
weather-app-v2/
├── backend/     # Kotlin Spring Boot service exposing /api/weather
├── frontend/    # Vite + React SPA rendering the dashboard
├── docker-compose.yml  # Local Postgres instance used by the backend
└── weather_dashboard_sdd (1).md
```

## Backend (Spring Boot + Kotlin)

**Key features**
- `/api/weather` aggregates live readings from Open-Meteo for every city stored in Postgres.
- City metadata is stored in the `city` table and managed through Flyway migrations.
- Errors fetching individual cities are surfaced per city without failing the entire response.

**Local prerequisites**
- JDK 17+
- Gradle (or generate the wrapper via `gradle wrapper` inside `backend/`)
- Docker (optional, for Postgres)

**Run Postgres locally**
```
docker compose up -d db
```

The backend expects these environment variables (defaults shown):
- `DATASOURCE_URL` – `jdbc:postgresql://localhost:5432/weather_app`
- `DATASOURCE_USERNAME` – `weather_app`
- `DATASOURCE_PASSWORD` – `weather_app`
- `PORT` – `8080`

With Postgres running, start the service:
```
cd backend
./gradlew bootRun        # after generating the wrapper, or use `gradle bootRun`
```

Flyway will create and seed the `city` table on startup. Automated tests can be run with:
```
./gradlew test
```

## Frontend (React + Vite)

**Key features**
- Displays all four cities with temperatures, last refreshed timestamp, and per-city statuses.
- Manual refresh button with loading state and graceful error banner.
- Uses `fetch` to call `/api/weather`; Vite dev server proxies `/api` calls to the backend.

**Local prerequisites**
- Node.js 18+
- pnpm / npm / yarn (examples below use npm)

Install dependencies and start the dev server:
```
cd frontend
npm install
npm run dev
```

Set `VITE_BACKEND_URL` when running against a non-proxied backend (e.g., production Render environment).

## Deployment Notes
- Backend: Build the Spring Boot jar (`./gradlew bootJar`) and deploy to Render as a web service. Configure environment variables for database credentials and Open-Meteo base URL if needed.
- Database: Provision a managed Postgres instance on Render, load the Flyway migration (runs automatically on backend startup).
- Frontend: Run `npm run build` and deploy the output in `frontend/dist` via Render static site hosting, setting `VITE_BACKEND_URL` to the backend service URL.

## Testing & Validation
- Backend unit tests cover the weather aggregation service, Open-Meteo client parsing, and controller contract.
- Manual smoke testing: with backend and frontend running locally, open `http://localhost:5173/` and refresh to verify data and error handling states.

## Further Improvements
- Introduce caching (e.g., Redis) to avoid hitting Open-Meteo on every request.
- Add health checks & readiness probes for Render deployment.
- Extend data model for future customization (user-selected cities, auto-refresh cadence).
