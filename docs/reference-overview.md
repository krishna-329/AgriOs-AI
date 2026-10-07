# Reference-based Farm Overview

## Scope
Frontend-only revision to match the supplied desktop/mobile reference. No backend or ML changes.

## Structure
- Shared Sidebar, TopNavbar and MobileBottomNav in `frontend/components/navigation.tsx`.
- Reference theme tokens and responsive layouts in `frontend/app/reference.css`.
- Farm Overview and PageHeader in `frontend/components/pages/overview.tsx`.
- DashboardCard, SectionHeader, FarmHealthCard, PriorityActions, PriorityActionItem, WeatherCard, CropPlannerCard, CropRecommendationItem, ResourceAllocationCard, ResourceProgress, FieldMonitorChart, GrainGuardCard, RiskDistributionCard, StatusBadge and MetricItem in `frontend/components/overview/dashboard-cards.tsx`.
- Typed mock fixture in `frontend/data/mockFarmData.ts`. Replace this source with an API adapter later.

## Responsive behavior
Desktop: left sidebar, search/location/weather/profile navigation, three-column card grid with two wide bottom cards.
Tablet: collapsible sidebar and two-column cards.
Mobile: compact brand/notifications/profile bar, period tabs, health → priority action → weather → field chart → crop summary, and five-destination bottom navigation with More menu.

## Working controls
Page search, demo location selection, notification/profile menus, priority-action expansion, chart metric tabs and 3-/7-day range, sidebar toggle, mobile More menu, page links and example settings form.

## Mock transparency
82/100 health, suitability percentages and risk indicators are reference fixtures, not calibrated model outputs. Risk donut proportions are visual mock weights; percentages are independent indicators and are not averaged. Low storage risk refers to Bin 1; the Bin 2 inspection alert remains separate. Historical sample dates are explicitly labeled. Overview period tabs select a labeled preview context, not a live reporting query.

## Imagery
All images are served from frontend/public/images. Image credits are available at `/image-credits`.
Generated landscape: `frontend/public/images/farm-landscape.png`, created with the built-in imagegen tool.
Prompt: Create a photorealistic wide panoramic agricultural landscape for a premium Indian AgriTech dashboard banner. Lush cultivated green fields with gentle parallel crop rows, a few coconut palms, distant soft blue-green mountains, warm early morning cream sky, natural muted greens and golden sunlight. Calm professional editorial photography. Broad horizontal composition, no people, no buildings in foreground, no text, no logos, no UI. This will be cropped into a shallow horizontal header; keep mountains and palms near the middle horizontal band. Save as a landscape image.

Steel-silo asset: `frontend/public/images/silo-generated.png`, generated with the built-in imagegen tool. Prompt: Photorealistic square editorial photograph of three modern corrugated galvanized steel grain storage silos with conical metal roofs and a small grain elevator behind, beside a lush green agricultural field, soft pale blue sky, warm natural daylight. Clean professional agricultural product dashboard thumbnail. Silos fill most of the frame, eye-level three-quarter angle, no people, no text, no logos, no borders.

## Verification — 2026-10-06
Production build and TypeScript checks passed. Browser checks: desktop card grid; chart metric and time range; expandable priority action; notification popover; search results; 390px mobile layout with no horizontal overflow; More menu; 820px tablet sidebar. All image elements loaded. No console errors observed.

Unused original silo photograph retained at frontend/public/images/silo.jpg: Diego Delso, CC BY-SA 3.0, https://commons.wikimedia.org/wiki/File:Silos,_Acatlán,_Hidalgo,_México,_2013-10-11,_DD_02.JPG . License: https://creativecommons.org/licenses/by-sa/3.0/ .
