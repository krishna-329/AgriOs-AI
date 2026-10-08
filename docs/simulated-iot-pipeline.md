# Step 4: simulated IoT pipeline

The simulator uses HTTP → FastAPI → PostgreSQL → farm-specific history → dashboard polling. These are **Simulated IoT Data**, not physical measurements or ML predictions. Farm Context and weather integration are unchanged.

## Existing HTTP contract

- `POST /api/sensors/readings` returns 201 with the stored reading and quality metadata.
- `POST /api/sensors/simulate-tick` accepts `farm_id`, `field_id`, and `normal`, `water_stress`, or `sensor_failure`; it creates exactly one reading through the same validation/storage path.
- `POST /api/sensors/reset-demo` deletes only `source=simulator` readings for the requested farm and field.
- `GET /api/sensors/latest?farm_id=...&field_id=field-1` returns the newest capture timestamp; 404 when empty.
- `GET /api/sensors/history?farm_id=...&field_id=field-1&limit=100` returns oldest-to-newest within the most recent limit; `[]` when empty. Limit 1–1000. Omitted field defaults to `field-1`.

Example POST body:

```json
{
  "farm_id": "agrios-demo-farm",
  "field_id": "field-1",
  "soil_moisture": 36.4,
  "temperature": 31.2,
  "humidity": 62.1,
  "source": "simulator"
}
```

Optional `timestamp` is an ISO 8601 capture time with timezone; omitted means server UTC. Responses retain `recorded_at` and also expose the equivalent `timestamp`, `sensor_status` and `validation_issues`. Future capture times beyond 30 seconds are rejected. Out-of-order timestamps are stored as suspicious and do not replace newer readings in latest.

Impossible/non-finite values or malformed IDs/source/timestamps return 422 and are **not stored** (invalid status at ingestion). Stored data quality is healthy or suspicious. Suspicious values remain available for diagnostics. The dashboard reports Sensor Issue and withholds field recommendations for them.

## Simulation

The Field Monitor page is the primary hackathon control. Start sends one tick immediately and the browser sends another about every five seconds. Stop clears that browser timer and preserves history. Navigating away or selecting another farm stops it. The backend starts no loop or background task, so this works with serverless requests.

Each request locks the selected farm row for the transaction, reads that farm/field's recent simulator history, generates one continued value, and persists it through the existing sensor validation. The server keeps no simulation process state. Reset is deliberately narrow and cannot remove farms, weather readings, hardware-source readings, another field, or another farm.

The standalone CLI remains available for development and imports the same shared simulator service:

Run from the repository root with the backend running:

```text
python simulator/sensor_simulator.py --api-url http://127.0.0.1:8000 --farm-id agrios-demo-farm --scenario NORMAL
python simulator/sensor_simulator.py --api-url http://127.0.0.1:8000 --farm-id agrios-demo-farm --scenario WATER_STRESS
python simulator/sensor_simulator.py --api-url http://127.0.0.1:8000 --farm-id agrios-demo-farm --scenario SENSOR_FAILURE --failure spike
```

The URL can alternatively come from `AGRIOS_API_URL`; farm ID from `AGRIOS_FARM_ID`. No credentials are required or embedded. The farm must exist. If omitted, farm ID is resolved only when exactly one farm exists. Use `--field field-1`, `--interval 5`, `--count 20` for a finite run, and `--seed 42` for reproducible bounded noise. Existing `SENSOR_FAULT` is retained as a compatibility alias.

- NORMAL: smooth bounded cycles around moisture 42%, temperature 29.8°C, humidity 67%, with small seeded noise.
- WATER_STRESS: moisture drops roughly 3 percentage points per reading to a floor of 8%; temperature slowly rises to 40°C; humidity declines to 30%. This is an accelerated demonstration, not a calibrated agricultural model.
- SENSOR_FAILURE: `--failure spike` periodically inserts 95% moisture (flagged suspicious); `--failure impossible` inserts 99.9°C (422, deliberately unclamped); `--failure frozen` repeats all values (flagged after at least six readings spanning 60 seconds).

Quality checks compare the same farm/field/source: moisture jumps over 15 points, temperature over 8°C, humidity over 20 points within 60 seconds. Recovery compares the recent healthy baseline, not a flagged spike. All three metrics unchanged within 0.01 for at least 60 seconds and five prior readings are suspicious. PostgreSQL serializes ingestion quality checks with a transaction row lock. Frozen inspection is bounded to the most recent 100 records.

## UI and persistence

Field Monitor and the Overview card share the same history service/hook; they fetch up to 100 readings every five seconds, cancel stale requests and clear measurements on errors. Farm changes immediately hide prior-farm data. Sensor history is never stored in localStorage. Overview time-range filters use actual capture times. No old demo history is substituted. Field Monitor retains its separately labelled illustrative map overlay.

Rule-based field status: moisture below 20% Critical; below 30% or a drop of at least 6 points across the last six healthy same-source readings Monitor; otherwise Normal. Suspicious data shows Sensor Issue. A stream older than 60 seconds shows Monitor/paused before assessing moisture. Always verify actual conditions before action; these are prototype thresholds.

Startup adds `sensor_status VARCHAR(20)` and `validation_issues JSON` idempotently under the existing database initialization transaction/lock. Existing sensor records and measurements are retained, labelled suspicious with “Legacy reading: quality not assessed”. PostgreSQL remains required in production through `DATABASE_URL`; SQLite remains local-only. No database reset or credentials are introduced.

## Future ESP32

An ESP32 can send the same JSON body to the same POST endpoint, using its real farm/field IDs and an honest source such as `esp32-prototype`; optional capture time must use UTC/offset. No simulator-specific API logic is required. Both dashboards continue reading the same history API and display the returned source. Before exposing hardware ingestion publicly, add device authentication, authorization, rate limiting and retention policy; those protections are not supplied by this prototype. Run the simulator on an external process/worker, not inside a serverless Vercel request.

## Verification

Backend: from `backend`, run `python -m pytest tests -q`. Real PostgreSQL tests additionally require `TEST_POSTGRES_URL`; they create and drop only generated test schemas. Frontend: from `frontend`, run `npm run build`. Browser regression script `frontend/tests/sensor-pipeline.cjs` accepts `AGRIOS_FRONTEND_URL`, checks empty/error/polling/farm switching and responsive charts using API fixtures (no production writes).
