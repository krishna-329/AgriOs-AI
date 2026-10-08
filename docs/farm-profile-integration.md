# Step 2 — Farm profile and shared context

## Database

Farm now has id, name, farmer_name, location_name, district, state, latitude, longitude, area_acres, soil_type, soil_ph, nitrogen, phosphorus, potassium, irrigation_type, water_availability, current_crop, crop_variety, sowing_date, budget, created_at and updated_at. Only name is required in the new write API. Coordinates must both be set or both absent.

Startup adds missing columns without deleting farms or weather readings. Known legacy fields are backfilled once. Legacy area in hectares is converted to acres. Optional fields explicitly cleared later remain null across restarts. Existing farms are not renamed or overwritten. Green Valley Farm (R. Karthikeyan, Ramanathapuram, Tamil Nadu, 10 acres, Paddy, Borewell) is seeded only when the farm table is empty. The existing local database also has this example created through the real UI during verification.

Units: area_acres is acres; N/P/K are kg/ha; water_availability is cubic metres; budget is INR; pH is 0–14. Missing values are null, not made-up measurements. created_at is preserved and updated_at changes on save, with UTC API timestamps.

Local SQLite is durable in backend/agrios.db. The existing Vercel Step 1 demo uses ephemeral /tmp storage; connect persistent PostgreSQL through DATABASE_URL before relying on hosted farm persistence. Step 2 is deployed at https://agrios-ai.vercel.app with the backend at https://agrios-ai-api.vercel.app. Production build, farm loading, CORS PUT, and selected-farm live weather were verified. The MVP has no user authentication or farm ownership isolation yet.

## APIs

| Method | Endpoint | Behavior |
| --- | --- | --- |
| GET | /api/farms | List profiles in stable creation order |
| GET | /api/farms/{farm_id} | Fetch a profile; 404 if missing |
| POST | /api/farms | Create; return full saved profile, status 201 |
| PUT | /api/farms/{farm_id} | Replace editable fields; missing optional fields become null |

POST/PUT use FarmWrite; server-managed IDs and timestamps cannot be supplied. Invalid values return 422. Database failures return a sanitized 503. PUT is included in allowed CORS methods. Original /api/v1 farm routes remain for older clients; profiles that cannot be represented by the older mandatory schema return an explicit 409 directing clients to /api/farms.

GET /api/weather still accepts latitude and longitude, and now accepts optional farm_id. The frontend supplies all three from the selected farm. The backend validates that coordinates match that farm (409 on mismatch) and associates the reading with the exact farm even if two farms share coordinates. Unknown farm_id returns 404. No coordinates means the UI shows a setup prompt rather than requesting default weather.

## Frontend

FarmProvider exposes farms, selectedFarm, status, error, saving, selectFarm, reloadFarms and saveFarm through useFarm(). It wraps WeatherProvider in the shell so future modules can consume the same profile. Only the selected ID is saved in localStorage under agrios.selectedFarmId. Profiles are always loaded from the backend; unknown stored IDs fall back to the first available farm. With storage disabled selection remains session-only.

The navbar uses farm names and locations from the API, and displays the selected farmer. The Overview heading uses the selected name, area and crop. Unrelated dashboard card logic was not changed by this step.

Settings and /farm-profile use the connected farm-profile-editor component; /onboarding opens create mode. The Settings reference is reflected through green tabs and two-column profile/location cards. Tabs cover Profile, Farm Details, Crop Details and Resources. All five requested sections remain available. Form edits are drafts until Save; errors preserve drafts; Cancel resets them. A separately introduced static farm-profile-form mockup is preserved but is not used by these routes.

WeatherProvider depends on selected ID and coordinates, cancels superseded requests, clears previous farm data immediately, and refetches after coordinate edits. It does not call /api/farms/demo. Loading, missing coordinates, API errors, manual retry and five-minute refresh are supported.

### Frontend files

Created:
- frontend/types/farm-profile.ts
- frontend/services/farms.ts
- frontend/components/farm-provider.tsx
- frontend/components/farm-profile-editor.tsx
- frontend/app/farm-profile/page.tsx

Changed:
- frontend/components/shell.tsx
- frontend/components/navigation.tsx
- frontend/components/weather-provider.tsx
- frontend/components/pages/overview.tsx
- frontend/components/overview/dashboard-cards.tsx (weather state only)
- frontend/services/weather.ts
- frontend/types/weather.ts
- frontend/app/settings/page.tsx
- frontend/app/onboarding/page.tsx
- frontend/app/reference.css (farm form styles)

Backend: app/db/models.py, app/db/bootstrap.py, app/db/repositories.py, app/main.py, app/api/weather.py, app/services/farms.py; new app/api/farms.py, app/schemas/farm.py, tests/test_farm_profiles.py.

## Run and test

From the repository root, in separate PowerShell terminals:

```powershell
cd backend
..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

```powershell
cd frontend
npm run dev -- --port 3001
```

Frontend NEXT_PUBLIC_API_URL should be http://127.0.0.1:8000 locally. Keep the existing backend database URL and local CORS origins.

1. Open http://127.0.0.1:3001/settings. Choose a farm, change details in any tab, Save and reload; verify values persist.
2. Add a farm; only name is mandatory. Verify the new farm is selected automatically and its ID survives refresh.
3. Enter only one coordinate: saving must report both are required together. Reject latitude outside ±90, longitude outside ±180, nonpositive area, pH outside 0–14, and negative resources.
4. Switch farms using the navbar (or Settings selector on mobile). Overview header and farmer name should change. Without coordinates, the weather card should show its setup prompt and no previous values.
5. Save different coordinates. Verify GET /api/weather carries the selected ID and new coordinates, and the card refreshes.
6. Stop backend and save. An explicit error should appear while draft values remain. Restart and retry.

```powershell
cd backend
..\.venv\Scripts\python.exe -m pytest tests/test_farm_profiles.py tests/test_farms.py tests/test_weather.py -q -p no:cacheprovider
```

The 28 farm/weather tests cover migration, empty-only seeding, create/read/update, restart persistence, validation, legacy compatibility, database errors, CORS PUT and correct weather association. The Next.js production build includes TypeScript checking.

## Latest production deployment

Frontend: dpl_WqGkLLSiLzAMjx1QF5A7qwwCczCQ
Backend: dpl_6riPCmUgCJUwX43DzLFWLA1BeLd4
Existing https://agrios-ai.vercel.app alias points to the updated frontend. Local environment files and SQLite data were excluded from uploads. Hosted farm storage remains ephemeral until DATABASE_URL points to persistent PostgreSQL.
