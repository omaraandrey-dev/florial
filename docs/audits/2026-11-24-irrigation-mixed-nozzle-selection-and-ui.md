# Florial irrigation assistant — mixed R-VAN selection and customer diagram

Date: 2026-11-24  
Base: `main` at `fc361fa1f2560e236a5850439334f38aab843fe7`  
Work branch: `fix/irrigation-mixed-rvan-visual-layout`

## Owner feedback

1. Distinguish R-VAN14, R-VAN18 and R-VAN24 visually by their Rain Bird identification colors.
2. Remove the fixed Florial planning-radius explanatory paragraph from the customer result.
3. Show each zone's nozzle models and quantities, e.g. `Zone 1 (R-VAN18 × 2, R-VAN24 × 2)`.
4. Remove planned flex-pipe metres and 30 m coil explanation from the customer-facing kit summary; keep sprinkler and zone counts.
5. Correct the 8 × 8 m rectangle: R-VAN24 at the four corners and R-VAN18 (4 m) at the midpoint of each side.

## Root cause confirmed in main

`irrigationLayoutBridge.mjs` selected one R-VAN model from the overall bounding-box short side. `lawnSprinklerLayout.mjs` then passed that same model and radius to every vertex, edge and interior candidate. The edge subdivision was calculated from the one global radius, so an 8 m side produced a midpoint candidate but inherited R-VAN24 instead of being sized for its 4 m interval.

## Implementation

- The solver now selects a nozzle model independently for each candidate:
  - corners use the distance from the corner to the polygon area centroid;
  - side candidates use the equal spacing produced on that side;
  - interior candidates use the interior lattice spacing.
- Project radius mapping: R-VAN14 = 3 m; R-VAN18 = 4 m or 5 m; R-VAN24 = 6 m. Arc changes sector shape only.
- Sampled coverage and head-to-head checks run using each candidate's actual selected model/radius. No precipitation-intensity matching gate is added.
- Added a regression target for 8 × 8 m: four R-VAN24 / 6 m corners and four R-VAN18 / 4 m side midpoints, complete sampled coverage and passed head-to-head.
- The customer SVG uses model-specific colors for sprinkler markers and radius rings and shows a legend of the models present. Zone labels list exact model variants and quantities. Both the layout result and the project/PDF operating-scenario label report the actual selected model set (for example, `R-VAN18 / R-VAN24`) rather than the former single base model.
- Removed the R-VAN fixed-radius note, removed flex-pipe metres/coil wording from the kit summary, and preserved exact `-360` model names in zone summaries.
- Rain Bird color references: R-VAN14 blue, R-VAN18 tan/beige, R-VAN24 burgundy. R-VAN strip nozzles are gray in the official technical sheet; RCS is shown in medium gray to remain distinct on the diagram.

## Files changed

- `src/lib/irrigation/lawnSprinklerLayout.mjs`
- `src/lib/irrigation/irrigationLayoutBridge.mjs`
- `src/pages/IrrigationAssistantPage.tsx`
- `src/lib/irrigation/lawnSprinklerLayout.d.mts`
- `tests/irrigation-lawn-sprinkler-layout.test.mjs`
- `tests/irrigation-layout-bridge.test.mjs`
- `docs/engineering/IRRIGATION_ASSISTANT_PERIMETER_FIRST_IMPLEMENTATION_V1.md`

- The first PR-head TypeScript check caught inferred `unknown` types in the new legend list. The list and legend are now explicitly typed; final validation must run against the updated PR head.

## Verification

- Exact code/test commit `53e73149644a5e567f6c272eb0479242e35959a8` passed Blog and Studio validation run #2498 (`45322938039`): application and Pages Functions type-check, lint, full website utility tests/build, Studio type-check/build.
- D1 migration validation run #2683 (`45322938340`) passed on the same commit. No D1 migration or data change was part of this task.
- Cloudflare Pages Preview deployment `0f21ec49-6e44-4e8a-b3dc-41a2ac1faa09` succeeded for the same code/test commit: https://0f21ec49.florial.pages.dev.
- The subsequent verification-record commit changes documentation only; no source or test code changes were made after the verified code/test commit.
- A manual browser visual check could not be completed: Browser Use returned insufficient credits and the public-page fetch did not expose the preview. Visual/interactive QA is therefore **not confirmed**.
- Production has not been changed; merge and Production deployment await owner approval.

## Safety boundary

No Sanity writes, D1 schema/data changes, Cloudflare configuration/secrets, Production orders, emails or service/content edits are part of this task. The implementation is code, tests and documentation only.
