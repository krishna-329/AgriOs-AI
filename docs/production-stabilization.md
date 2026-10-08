# Production stabilization — prepared, not deployed

## Database changes

Production is detected by VERCEL or APP_ENV=production. DATABASE_URL is mandatory there; SQLite and missing/blank connection URLs are rejected. Standard PostgreSQL URLs are normalized to postgresql+psycopg:// for the installed driver. Production requires sslmode=require, verify-ca or verify-full. Credential values are never hardcoded, printed in startup logs, or included in the source package.

Development keeps SQLite by default. All current Farm, WeatherReading and SensorReading columns, foreign keys, JSON profiles, dates, timestamps and indexes remain intact. PostgreSQL uses NullPool so the managed provider owns pooling, a bounded connection timeout, no prepared statements for transaction-pooler compatibility, and explicit session rollback on failures.

Startup runs initialization in one transaction. PostgreSQL takes a transaction-scoped advisory lock with a bounded wait before inspecting/creating tables, adding legacy missing farm columns, backfilling legacy values and seeding an empty database once. Concurrent cold starts were tested. Startup failures stop the application with a sanitized configuration message; they do not switch to SQLite.

No new business schema fields or destructive migrations were introduced. Empty PostgreSQL gets all existing tables automatically. For an older AgriOS schema the additive initializer adds missing fields. Moving existing SQLite records into PostgreSQL is a separate one-time data transfer; this change does not perform it. Existing local SQLite was retained. Versioned migrations such as Alembic should be used for future complex schema changes.

## Frontend fixes

Working weather and Farm Context source files were left unchanged. Field Monitor no longer substitutes 22%/32°C/60% when history is empty. It shows exactly "No simulated sensor readings available yet". Failed requests show "Sensor readings temporarily unavailable" and clear old readings. Farm changes clear stale data immediately. Requests have a timeout, are cancelled on farm changes, and do not overlap; polling recovers after failures. Existing map/NDVI/rainfall/insight examples are explicitly marked as demos.

Crop Planner now references a bundled groundnut.svg illustration instead of the missing groundnut.jpg. Existing crop images are retained. The overall page layout and navigation are retained.

## Verification

- 48 backend tests passed, including three integration tests on isolated real PostgreSQL 16.15: create/read/edit farms, reconnect persistence for all three tables, selected farm weather association, sensor ingestion/latest/history, concurrent startup and legacy PostgreSQL migration.
- Production missing URL, SQLite rejection, TLS enforcement, URL normalization and sanitized invalid-URL errors have automated tests.
- Next.js production build and its TypeScript check passed.
- Headless browser against the local PostgreSQL-backed API verified farm edit/reload, multiple-farm selection/reload, real Open-Meteo weather, empty sensor state, sensor ingestion/polling, outage/recovery and groundnut HTTP 200. No browser runtime exceptions were recorded.
- The actual Neon account/database is not provisioned or tested; that connection must be verified after setup. No Vercel settings or deployed applications were changed.

## Recommended provider and variables

Use Neon through Vercel Marketplace for this prototype. It provides managed PostgreSQL and a pooled connection URL. Select a region near the API functions (currently iad1 / US East). Reference: https://vercel.com/marketplace/neon/neon and https://vercel.com/docs/storage .

Set DATABASE_URL only on the backend project agrios-ai-api, as a sensitive Production variable. Paste the provider's pooled PostgreSQL connection URL with sslmode=require. Do not put this value in NEXT_PUBLIC variables, source files, or chat. APP_ENV=production is optional on Vercel because VERCEL is set automatically. Existing NEXT_PUBLIC_API_URL=https://agrios-ai-api.vercel.app and CORS_ORIGINS already work and should stay unchanged. DATABASE_CONNECT_TIMEOUT defaults to 10 seconds; DATABASE_INIT_LOCK_TIMEOUT defaults to 30 seconds.

## UI-only deployment steps (after approval)

The two current Vercel projects have no linked Git repository. Redeploying an existing deployment would rebuild old source. Updated source must be connected first. A clean source ZIP is provided beside this guide; it excludes secrets, databases, node_modules, .next, .vercel metadata and runtime files. It is not uploaded anywhere.

1. In Vercel, open Storage → Create Database, or Marketplace, and choose Neon. Choose the free prototype plan and a region near iad1. Create the database and connect it to agrios-ai-api for Production. If an integration dialog offers an immediate redeploy, postpone it until the new source is connected.
2. Open agrios-ai-api → Settings → Environment Variables. Verify the exact key DATABASE_URL exists for Production. Use the pooled connection string from Neon’s Connect dialog, including sslmode=require. Mark it sensitive. Keep CORS_ORIGINS unchanged. If you test Preview deployments, connect an isolated Neon test branch to Preview rather than silently using production data.
3. If you need existing ephemeral records, save the current farm JSON from https://agrios-ai-api.vercel.app/api/farms before replacing the backend. Existing weather/sensor history needs an explicit export/import; table creation does not copy it. Do not treat this as a data migration.
4. In GitHub's website create a private personal repository with a README. Extract the provided ZIP. Choose Add file → Upload files, drag its backend and frontend folders into the repository root, and Commit changes to main. The repository root must contain backend/ and frontend/, not an extra wrapper folder. Do not upload the ZIP itself. Keep GitHub upload batches below its browser upload limits if prompted.
5. In the existing agrios-ai-api Vercel project, open Settings → Build and Deployment (Build & Development Settings on some layouts). Set Root Directory to backend and framework to FastAPI. Then open Settings → Git → Connect Git Repository and choose that repository. Use main as Production Branch. Do this only after DATABASE_URL is saved. In Deployments choose Create Deployment, enter main, and create the Production deployment if connection does not already trigger one. Avoid deploying the old snapshot. If you see a pending automatic deployment while correcting settings, cancel it until root and variables are correct. Reference: https://vercel.com/docs/git .
6. Once the backend is Ready, open https://agrios-ai-api.vercel.app/health and /api/farms in your browser. Verify health is ok and farm profiles load. In Neon’s Tables view confirm farms, weather_readings and sensor_readings were created. Use Vercel Logs if initialization fails; never remove DATABASE_URL to bypass the failure.
7. In the existing agrios-ai frontend project, set Root Directory to frontend and framework to Next.js. Verify Production NEXT_PUBLIC_API_URL stays https://agrios-ai-api.vercel.app. Connect the same repository under Settings → Git and deploy main from Deployments. Its vercel.json preserves npm ci and npm run build. Under Settings → Domains, keep agrios-ai.vercel.app attached to this project’s Production deployment. If Vercel offers Assign Domain or Promote to Production, assign the new frontend deployment to the existing domain.
8. Open https://agrios-ai.vercel.app/settings, create or edit a demo farm, save and reload. Verify Overview weather uses that selected farm. Field Monitor must show the empty sensor message until readings are ingested. The backend /docs page offers Try it out for POST /api/sensors/readings using a farm ID from /api/farms, field_id=field-1 and source=simulator; then verify latest/history and the dashboard. Check that groundnut renders without a 404.

Do not start these deployment actions until approval. This preparation intentionally leaves the currently deployed site untouched.

## Changed files

Backend: app/config.py, app/db/database.py, app/db/bootstrap.py, app/main.py, .env.example; new tests/test_database_config.py and tests/test_postgres_integration.py. Root: .env.example, docker-compose.yml, README.md. Frontend: components/pages/monitor.tsx, components/pages/planner.tsx, new public/images/groundnut.svg. This guide and the source ZIP are local deliverables.
