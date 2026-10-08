# AgriOS AI
AI-powered farm decision intelligence and resource optimization.

## Frontend MVP (current)
The frontend now runs independently using mock data. It includes all six modules, reusable cards, Recharts trends, responsive desktop/mobile navigation, crop previews, a browser sensor simulation, GrainGuard sample selection and risk acknowledgments. No real ML/API integration is performed. See [frontend architecture and interactions](docs/frontend-mvp.md).

```powershell
cd frontend
npm ci
npm run dev
```

The backend foundation below remains available for later integration. Its endpoints are not required by the current frontend. The earlier connected onboarding/overview has been replaced by a frontend demo.

## Earlier backend foundation
Phase 1 skeleton: Next.js pages, working farm onboarding and overview, FastAPI validation, persistent farm profiles, source contracts and tests. Other pages are explicitly inactive. There are no trained models, simulated sensor readings, authentication or live risk assessments yet.

## Run locally (PowerShell)
From the repository root:
```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
cd backend
..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
In another terminal:
```powershell
cd frontend
npm ci
npm run dev
```
Open http://localhost:3000 and backend OpenAPI at http://localhost:8000/docs.
SQLite is the default local database (`backend/agrios.db`). Profiles survive restarts. The browser stores only the last farm ID. Authentication is not implemented; keep this development instance on localhost and use demo profiles.

## PostgreSQL
Production requires an environment-provided `DATABASE_URL` pointing to persistent PostgreSQL with `sslmode=require` (or certificate verification). Standard provider `postgres://` and `postgresql://` URLs are normalized to the installed psycopg 3 driver. SQLite is only a local-development fallback. No database credentials are included in source.

For local Docker PostgreSQL, provide your own `LOCAL_POSTGRES_PASSWORD` before starting Compose. `backend/.env.example` documents development defaults. Actual values come from environment variables or `backend/.env`; example files are not loaded. PostgreSQL initialization is atomic and serialized with a transaction advisory lock. The existing schema is preserved and missing legacy columns are added. SQLite data is not automatically transferred to PostgreSQL.

See [production stabilization and UI deployment steps](docs/production-stabilization.md).

## Verify
```powershell
cd backend
..\.venv\Scripts\python.exe -m pytest -q
cd ../frontend
npm run typecheck
npm run build
```
See docs/architecture.md, docs/api.md, docs/models.md and docs/datasets.md for the phased plan. Real PostgreSQL persistence, concurrency, migration, API and browser checks are recorded in docs/production-stabilization.md.
