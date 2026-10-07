# Step 1: real weather integration

The existing Overview design is retained. Only weather is external near-live data; all other dashboard modules remain demos. Open-Meteo current conditions are model estimates, not farm sensor observations. Provider documentation: https://open-meteo.com/en/docs . Attribution is shown on the card.

## Run locally (PowerShell, repository root)

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
Copy-Item backend/.env.example backend/.env
cd backend
..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

In another terminal, from the repository root:

```powershell
cd frontend
Copy-Item .env.example .env.local
npm ci
npm run dev -- --port 3001
```

Do not overwrite existing environment files; merge settings if they already exist.
Dashboard: http://127.0.0.1:3001/overview
API documentation: http://127.0.0.1:8000/docs

## Environment

Backend automatically loads backend/.env. Existing process environment wins.

| Variable | Default / purpose |
| --- | --- |
| DATABASE_URL | sqlite:///./agrios.db (run from backend directory); PostgreSQL supported via postgresql+psycopg://... |
| CORS_ORIGINS | localhost and 127.0.0.1 origins on ports 3000 and 3001; comma-separated explicit frontend origins |
| WEATHER_API_URL | https://api.open-meteo.com/v1/forecast |
| WEATHER_TIMEOUT_SECONDS | 10 (greater than 0, at most 60) |
| LOG_LEVEL | INFO |
| NEXT_PUBLIC_API_URL | Frontend: http://127.0.0.1:8000; backend base URL without /api suffix |

No weather API key is required for this prototype. For a hosted frontend, deploy the backend to an HTTPS host, use a persistent database, add the exact frontend origin to CORS_ORIGINS, and set NEXT_PUBLIC_API_URL to the public HTTPS backend URL before rebuilding the frontend. Localhost is only for local development. The frontend is deployed at https://agrios-ai.vercel.app and FastAPI at https://agrios-ai-api.vercel.app. Production NEXT_PUBLIC_API_URL and CORS_ORIGINS are saved in Vercel project settings. With no hosted DATABASE_URL configured, the Vercel demo uses SQLite in /tmp: history is temporary and can reset or differ between instances. Configure a persistent PostgreSQL DATABASE_URL to retain and share readings. The local database is unchanged.

## API contract

- GET /health returns {"status":"ok"}.
- GET /api/farms/demo returns the persisted Ramanathapuram demo farm (9.3716, 78.8308), with area in hectares.
- GET /api/weather?latitude=17.385&longitude=78.4867 returns normalized weather and up to five daily forecast entries including today.
- Temperature is Celsius; wind is km/h; humidity and probability are percent.
- rain_probability is today's maximum precipitation probability, not rainfall amount. It is null when unavailable.
- timestamp is the provider's current-data valid time converted to UTC, not the request time. Forecast dates use the location's timezone.
- Missing forecasts return an empty array; required missing or invalid current conditions fail explicitly.
- Invalid/missing coordinates: 422. Provider timeout: 504. Provider/network/malformed payload failure: 502. Persistence failure: 503. Weather failure detail: "Weather temporarily unavailable".
- The frontend has a 15-second request timeout, retries on demand, refreshes every five minutes, and clears readings on failure. Card and navbar share one response. The location control shows the sole demo farm.

## Persistence

Farm and WeatherReading live in app/db/models.py. Startup performs an additive, idempotent migration for the existing phase-one farm table, backfills known profile fields, and seeds one demo farm. Legacy farm coordinates remain null rather than invented. Existing /api/v1 farm endpoints remain compatible. All successful weather requests save a reading; farm_id is set only when requested coordinates match a registered farm. Queries for other coordinates retain their coordinates with a null farm_id. The bootstrap migration is intended for the current single-instance MVP; use versioned migrations before multi-instance deployment.

## Verification

```powershell
cd backend
..\.venv\Scripts\python.exe -m pytest tests -q
```

Nine tests cover existing farm endpoints, normalization, UTC conversion, optional forecasts, provider timeout/HTTP/malformed responses, coordinate validation, CORS, persistence, farm association and legacy migration. Frontend production build passed, including TypeScript checks. Browser verified live values, loading, full backend outage with no fallback, and retry recovery. Real example response: weather-response-example.json.

## Files

Created:
- backend/app/config.py
- backend/app/api/weather.py
- backend/app/services/weather_service.py
- backend/app/schemas/weather.py
- backend/app/db/models.py
- backend/app/db/bootstrap.py
- backend/.env.example
- backend/tests/test_weather.py
- frontend/types/weather.ts
- frontend/services/weather.ts
- frontend/components/weather-provider.tsx
- frontend/.env.example
- docs/weather-integration.md
- docs/weather-response-example.json

Changed:
- backend/app/main.py
- backend/app/db/database.py
- backend/app/db/repositories.py
- backend/app/models/farm.py
- backend/requirements.txt
- frontend/components/shell.tsx
- frontend/components/navigation.tsx
- frontend/components/pages/overview.tsx
- frontend/components/overview/dashboard-cards.tsx
- frontend/app/reference.css

Runtime files (ignored): backend/agrios.db and backend/.runtime, frontend/.runtime and frontend/.next.

## Vercel redeployment

Frontend and backend are separate linked Vercel projects. Run `vercel deploy --prod` in backend first, verify /health and /api/weather, then run the same command in frontend. backend/vercel.json selects FastAPI and .python-version selects Python 3.13. Both .vercelignore files exclude local secrets and runtime artifacts; never upload the local SQLite database.
