# Irrigation assistant — intake to deterministic layout bridge v1

**Date:** 2026-11-16  
**Base main:** `77ee6047879db9112ea0eee7c542aa1e795ebcc9`  
**Branch:** `feat/irrigation-intake-layout-engine-v1`  
**Status:** implementation candidate; exact-head CI passed; provisional model-selection rule still requires engineering review

## Delivered in this increment

- Added `src/lib/irrigation/irrigationLayoutBridge.mjs` to connect the versioned, in-memory intake snapshot to the existing deterministic `generateLawnSprinklerLayout()` engine.
- The bridge requires customer-confirmed normalized geometry, exactly one supported region and no mapped exclusions.
- The first connected scenario is limited to Rain Bird R-VAN:
  - short side 4.0–4.6 m: R-VAN14;
  - short side above 4.6 m through 5.5 m: R-VAN18;
  - manufacturer-recommended operating point: exact 3.1 bar table point.
- The width-to-model envelope is a provisional geometric candidate heuristic, not an engineer-approved universal selection rule. It must be reviewed against representative rectangles and L-shapes before broader use.
- For geometry outside this narrow envelope, the bridge returns an explicit unsupported result instead of silently forcing a nozzle or model. Larger-radius rotor support remains a separate 3500/5000 engine milestone.
- The assistant summary now renders the candidate model, manufacturer operating scenario, head count, tabulated flow, sampled coverage, uncovered sample count, head-to-head result, sprinkler coordinates and a simple position diagram in BG/RU/EN.
- Added declaration types and tests for the bridge.
- Added exact boundary regression coverage for the provisional short-side rule: 4.0 m and 4.6 m select R-VAN14; 4.6001 m and 5.5 m select R-VAN18; 3.999 m and 5.5001 m are explicitly escalated.
- The new tests also require sampled coverage and the solver's head-to-head check to pass at all four supported boundary scenarios.

## Engineering and safety boundaries

- The 3.1 bar value is the Rain Bird R-VAN recommended operating point used for a manufacturer-table geometric scenario. It is **not** asserted to be the measured pressure at the sprinkler.
- Customer source pressure and measured flow are deliberately not passed as nozzle operating pressure or used to claim hydraulic feasibility.
- The engine result remains sampled geometric coverage only. It does not prove continuous coverage or field distribution uniformity.
- Hydraulic feasibility, pipe losses, source curve, elevation, zone sizing, overspray, obstacle/exclusion handling and complete body/nozzle compatibility remain unevaluated.
- No final product/BOM, Sanity lookup/write, live price/stock, Gemini call, D1 persistence, lead, Resend email or cart mutation is introduced.
- HE-VAN is not yet auto-selected as a cheaper alternative. Its comparison requires a separately reviewed operating-point and precipitation/compatibility rule; the R-VAN-first preference is preserved without making an unsupported price claim.
- No Production infrastructure, secrets, D1 schema/data, Sanity schema/data, Header, menu, Footer or global routing changes.

## Verification plan

- Exact PR head `0b0cef654acf16c5819d32e43dfe8f099788d1fa`: Blog and Studio validation run `43840039751` succeeded, including TypeScript checks, lint, website tests, website build, Studio type-check and Studio build.
- Exact PR head D1 validation run `43840039853` succeeded, including migration syntax validation and read-only dry-run. No migration was applied.
- The new boundary cases passed in the website test step. This is code/CI verification, not field validation or engineering approval.
- Confirm that an unconfirmed geometry cannot reach the solver.
- Confirm that source dynamic pressure changes do not change the manufacturer nozzle operating scenario.
- Review the provisional short-side/model envelope with the irrigation engineer before enabling wider geometry classes.
- After PR #330 is resolved, synchronize this branch with current `main` and add the integration record to the shared roadmap, changelog, technical passport and open questions in one documentation pass.

## Open limitations

- Current connected solver supports only one rectangle or orthogonal L-shape and R-VAN14/R-VAN18 within the narrow envelope above.
- Rain Bird 3500/5000 rotor layout integration is not part of this increment.
- HE-VAN comparative scenario, hydraulic network calculations, zones and catalogue assembly verification remain future gates.
- No claim of Production deployment or customer-facing live QA is made by this audit.
