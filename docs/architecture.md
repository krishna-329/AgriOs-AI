# Architecture and implementation plan
## Pipeline
Farmer input and external/historical/simulated sources → transport adapters → validation → repository → inference modules → resource optimization → risk events → decision engine → farmer actions → outcome records.

Next.js uses FastAPI `/api/v1` contracts. Routes delegate to services, which coordinate repositories and domain modules. SQLAlchemy supports PostgreSQL deployment and SQLite local development. Future WebSocket events are published only after persisted validation. MQTT adapters must invoke the same ingestion service as REST; transport never bypasses validation.

## Entities
| Entity | Main fields and relations |
| --- | --- |
| Farmer | id, display name, preferred language, auth subject |
| Farm | farmer_id, location/coordinates, hectares, season, crop, resource limits |
| SoilTest | farm_id, sample date, N/P/K units, pH, lab/source |
| SensorDevice | farm_id, asset_id, device type, source mode, calibration metadata |
| SensorReading | device_id, observed/received time, sequence, values/units, quality flags, source |
| WeatherObservation | farm_id, provider, forecast horizon, values, retrieval time |
| Prediction | farm_id, model/version, input snapshot, output, uncertainty, source references |
| OptimizationRun | farm_id, candidates, objective, constraints, solver status, allocations |
| RiskEvent | farm_id, asset_id, module/type, evidence, priority components, lifecycle |
| FarmerAction | risk_id, action text/key, due time, acknowledgment/completion |
| Outcome | action_id, observed result, farmer feedback, harvest amount, timestamp |
| AudioAnalysis | farm_id, storage asset, file reference/hash, features, model output |
| DemoRun | farm_id, scenario, seed, started/stopped times, source label |

Only Farm is persisted in Phase 1; farmer details are embedded in its profile. Normalize Farmer when registration/auth is introduced. JSON profile storage supports initial scaffolding; promote frequently queried fields and add migrations before broader use.

## Frontend
App Router: `/`, `/onboarding`, `/overview`, `/crop-planner`, `/field-monitor`, `/grainguard`, `/risk-center`, `/expert`. Shared Shell, typed API client and English content module. Future StatusCard, ActionCard, SourceBadge, SensorTrend and PredictionDetails components. Farmer view emphasizes what/why/action/when; charts belong behind details and in the expert view. Unknown health is distinct from normal. Translation dictionaries expand to Telugu/Hindi; voice, messaging and PWA are later adapters.

## Directory boundaries
```text
frontend/{app,components,content,services,types}
backend/app/{api,services,models,schemas,ml,optimization,risk_engine,decision_engine,db}
backend/tests
ml/{datasets,training,artifacts,notebooks}
simulator/scenarios
docs
```

## Phased delivery and acceptance gates
1. Foundation: architecture/contracts, persistence, profile UI, API validation, both servers start. Prototype authentication remains a follow-up before shared access.
2. Crop/yield: licensed dataset adapters, regional splits, saved preprocessing and models, evaluated outputs with provenance; no invented confidence.
3. PuLP optimizer: enforce land/water/fertilizer/budget, report infeasible plans, verify each objective on known cases. Minimum-water objective needs production or planting target to prevent trivial zero allocation. Balanced objective uses documented normalized weights.
4. Ingestion/simulator: typed REST envelope, timestamp/idempotency handling, missing/range/spike/drop/frozen/inconsistent checks; invalid evidence cannot drive strong agronomic actions. Gradual seeded scenarios and WebSocket updates.
5. Risk/decision: common events, deduplication, lifecycle, explainable priorities and farmer action feedback. Never average unrelated risk percentages.
6. GrainGuard: validated audio upload, preprocessing/features, evaluated classifier, storage environment fusion; acoustic confidence remains separate from storage risk.
7. Demo/quality: normal, gradual water stress, sensor malfunction and insect activity scenarios, end-to-end tests, accessibility and UI polish.

## Dependencies and constraints
Now: Next.js/React/TypeScript/Tailwind, FastAPI/Pydantic/Uvicorn, SQLAlchemy/psycopg, pytest/httpx. Later: scikit-learn/pandas/numpy, librosa, PuLP, Recharts, Alembic. Avoid deep learning until dataset volume and validation justify it.

Canonical units: ha, m³, kg, °C, relative humidity %, INR; nutrient units must be explicit, not guessed. All event times use UTC with local display. Dataset licensing, regional generalization, seasonal shifts, audio noise, uncertain price assumptions and uncalibrated confidence are primary risks. No agronomic certainty or pesticide dosage is generated. Source labels must distinguish Simulated IoT Data, Historical Data Replay, farmer input and actual external/sensor measurements. Optional satellite, livestock, aquaculture and AR work is deferred.
