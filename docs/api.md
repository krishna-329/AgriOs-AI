# API contracts
Version prefix: `/api/v1`. Live interactive schemas: `/docs`; machine schema: `/openapi.json`.

## Implemented
| Method | Path | Result |
| --- | --- | --- |
| GET | /health | DB connectivity, stage, authentication status |
| POST | /farms | Validated FarmCreate → persisted FarmRead (201) |
| GET | /farms/{farm_id} | FarmRead or 404 |

FarmCreate: farmer_name, name, location, area_ha > 0, budget_inr/water_m3/fertilizer_kg >= 0, season (kharif/rabi/zaid), optional current_crop. FarmRead adds UUID id, created_at, data_source=farmer_input. Unknown fields rejected; invalid inputs return 422. No public farm listing is exposed. Authentication and ownership checks are not implemented.

## Planned; not callable yet
| Method | Path | Contract |
| --- | --- | --- |
| POST | /farmers | Prototype registration; later identity binding |
| PATCH | /farms/{id} | Profile/resource revision |
| POST | /farms/{id}/soil-tests | Source, sample date, nutrient values and units |
| POST | /ingestion/readings | Device/farm/asset, source, observed_at, sequence, metric map |
| GET | /farms/{id}/readings | Time range, cursor pagination, quality flags |
| GET | /farms/{id}/weather | Provider and forecast provenance |
| POST | /farms/{id}/crop-predictions | Soil/weather/resources → ranked candidates |
| POST | /farms/{id}/yield-predictions | Crop/region/season/features → kg per ha and total kg |
| POST | /farms/{id}/optimization-runs | Candidates, objective, limits → solver status/allocations |
| POST | /farms/{id}/audio-analyses | Bounded WAV upload + storage conditions → analysis reference |
| GET | /farms/{id}/risks | Ranked active risk events with priority explanation |
| GET | /farms/{id}/actions | What/why/action/when and evidence |
| POST | /actions/{id}/feedback | Completion/outcome for future evaluation |
| POST | /farms/{id}/demo-runs | Seeded scenario and progression settings |
| DELETE | /demo-runs/{id} | Stop active scenario |
| WS | /farms/{id}/stream | Versioned reading.accepted, reading.flagged, risk.updated, action.updated |

Ingestion requirements: explicit units/source, UTC timestamps, deduplication by device/sequence, bounded payload, quarantine rather than silent imputation. WebSocket reconnect uses persisted REST history. Future authentication must scope every farm/device request.

## Shared risk event
Executable schema: backend/app/schemas/contracts.py (RiskEvent).
```json
{
  "id": "event-id", "farm_id": "farm-id", "module": "grain_storage",
  "risk_type": "possible_insect_activity", "probability": null, "confidence": null,
  "severity": "high", "urgency": "immediate", "economic_impact": "medium",
  "reason": ["Illustrative scenario: acoustic activity and humid storage"],
  "evidence_ids": ["analysis-id"], "data_sources": ["simulated_iot"],
  "recommended_action": "Inspect Grain Bin 2", "due_at": null,
  "status": "open", "timestamp": "2026-10-05T06:00:00Z"
}
```
This is a contract example, not an observed event. Null confidence stays unknown. Future ranking returns a separate priority score and component weights, not a risk probability. Severity, urgency and impact map to documented normalized weights; probability is used only when meaningful. Missing probability uses an explicitly named rule-based ordering. Distinguish modeled uncertainty, evidence quality and priority.
