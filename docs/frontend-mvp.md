# Frontend MVP

## Routes and navigation
`/` redirects to `/overview`. Desktop sidebar and mobile bottom navigation share six destinations: Farm Overview, Crop Planner, Field Monitor, GrainGuard, Risk Center and Expert Analytics. Legacy `/onboarding` now routes users toward the frontend demo planner; no backend is required by this MVP.

## Component hierarchy
RootLayout → Shell → DashboardProvider + Sidebar + Header + MobileNavigation + page content.
Pages compose PageHeading, StatCard, SensorCard, RiskCard, RecommendationCard, CropRecommendationCard, ResourceAllocationCard, ChartCard, StatusBadge and EmptyState. Charts use Recharts; icons use Lucide. Global CSS/Tailwind defines shared color, spacing, responsive layout and interaction styling.

## Data contracts
`frontend/types/dashboard.ts`: FarmProfile, WeatherSummary, ResourceBudget, CropRecommendation, SensorReading, StorageAnalysis, RiskEvent and DashboardSnapshot.
`frontend/data/mock.ts`: typed fixtures, explicitly labeled mock or simulated.
`frontend/services/dashboard.ts`: asynchronous DashboardRepository adapter. Replace its load implementation with API fetch and response mapping without changing cards. Existing backend client is retained but unused by these pages.
`frontend/components/dashboard-provider.tsx`: shared demo state, session-only acknowledgments, sample selection and simulated readings.

## Interactions and limits
- Crop inputs update an illustrative single-crop allocation. Fixed yield/profit/water/cost examples scale with area; soil/season are collected but do not run inference. Resource overages are clearly identified. No optimizer runs.
- Field Monitor starts/pauses a gradual browser simulation at 2.5-second intervals. Latest readings appear in Overview and Expert Analytics. Refresh resets the demo.
- GrainGuard switches between predefined examples. Local WAV/MP3 selection validates extension/size and displays file metadata; it neither uploads nor analyzes a recording. Mock acoustic confidence is explicitly uncalibrated and separate from storage risk.
- Risk Center filters fixed demo priorities and acknowledges alerts. Acknowledgment is not resolution. Rankings and risks are fixtures, not a live risk engine.
- Expert Analytics changes the chart metric and exposes recent reading history and sources. No model artifacts or accuracy claims.

## Running
From frontend: `npm ci`, then `npm run dev`. No backend needed. Validate with `npm run build` and `npm run typecheck`. npm lockfile records dependency versions.

## Accessibility
Semantic headings, labeled numeric/select/file inputs, native form validation, visible keyboard focus, button state labels, chart text summaries, readable table and severity text alongside color. Six-destination mobile navigation stays available without a hamburger menu.

## Verification — 2026-10-05
- TypeScript validation passed; final production Next.js build passed, including static generation and type checks.
- Browser: all six modules rendered; planner area change from 4 ha to 2 ha changed maize yield from 20.8 t to 10.4 t and cost from INR 152,000 to INR 76,000.
- Browser: simulated moisture changed from 25.4% to 24.6%; pause restored the start control.
- Browser: inconclusive GrainGuard sample removed the mock confidence number and changed the action.
- Browser: urgent filter showed one risk; acknowledgment changed the count to one.
- Desktop overview and 390px mobile expert layout visually inspected.
- Audio selection checks are implemented but actual upload/inference is deliberately absent.

