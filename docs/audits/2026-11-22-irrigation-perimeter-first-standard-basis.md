# Irrigation assistant — perimeter-first standard design basis

Date: 2026-11-22  
Branch: `feat/irrigation-perimeter-first-standard-basis`  
Base: `b48d6c5b354c500250957355b4eb90751be072d0`  
Status: implementation in progress; CI and browser QA pending.

## Owner-approved scope

The first customer-facing design stage is limited to small residential lawns and relatively small private hotels. Large hotel complexes, parks, sports fields and other large-scale systems require a separate professional engineering project and are outside this automatic assistant scope.

Current geometry scope remains one confirmed rectangle or orthogonal L-shaped lawn. The site is treated as flat. Plants, trees, shrubs, flower beds, drip irrigation and other landscape zones are later phases and are not part of this increment.

## Standard design assumptions

The customer is not asked to identify the water source or enter pressure/flow measurements during the initial lawn layout. The calculation snapshot records the following Florial standard assumptions:

- 4 atm at the 1-inch inlet tap (normalized as 4.053 bar);
- incoming supply pipe: nominal Ø25 mm;
- calculation starts at the 1-inch tap;
- main line: nominal Ø32 mm;
- zone laterals: nominal Ø25 mm;
- project allowance for pipe pressure loss: 1 bar per 100 m;
- project allowance for elevation pressure loss: 1 bar per 10 m;
- flat-site assumption, so no elevation-loss term is applied to the current lawn geometry.

These are owner-approved standard project assumptions for this target market, not universal hydraulic laws and not a measurement of the customer's actual supply. If the actual site differs, that is handled in a later engineer/customer dialogue. The present implementation does not claim hydraulic feasibility and does not yet calculate zone pipe losses, valve limits, pump duty or residual nozzle pressure.

## Intake UX

`src/pages/IrrigationAssistantPage.tsx` now limits customer intake to:
1. lawn shape and dimensions, with customer confirmation of the outline;
2. optional site notes.

Water source, static/dynamic pressure, measured flow, test-point and elevation questions have been removed from the initial customer flow. The standard design basis is displayed in the project summary.

`src/lib/irrigation/irrigationIntake.mjs` stores the standard assumptions in the immutable intake snapshot. Geometry readiness is independent of customer water measurements. Hydraulic readiness deliberately remains false / `not_evaluated`.

## Perimeter-first placement

`src/lib/irrigation/lawnSprinklerLayout.mjs` now uses a two-pass deterministic strategy:

1. Generate and evaluate boundary candidates (corner and straight-edge heads).
2. Run greedy sampled coverage using boundary candidates only.
3. Only if the perimeter pass leaves sampled lawn points uncovered, evaluate interior candidates to fill the remaining points.
4. Run the existing head-to-head repair pass. It may add a further candidate, including an interior head, if a selected head has no valid mutual head-to-head neighbour.
5. Return diagnostics describing whether the perimeter-only pass was sufficient and why the interior pass was activated.

Boundary edge spacing is constrained by the smaller 90°/270° corner-arc radius, not just the 180° edge-head radius. Even segment division also places a candidate at each edge midpoint, so a corner's shorter throw does not leave an unsupported gap at the start of an edge.

This is still sampled geometric coverage at the configured sample interval. It is not a continuous mathematical proof, a precipitation-uniformity calculation or a finished hydraulic design.

## Rain Bird preference and current manufacturer-data boundary

Rain Bird R-VAN is the preferred rotary-nozzle family. Model selection uses half the lawn's short side as the initial cross-lawn head-spacing target, consistent with the manufacturer's 50%-of-throw-diameter spacing basis. The bridge uses:
- R-VAN14 for a half-short-side target of 4.0–4.6 m (lawn short side 8.0–9.2 m);
- R-VAN18 for above 4.6 m through 5.5 m (lawn short side above 9.2 m through 11.0 m);
- R-VAN24 for above 5.5 m through 7.5 m (lawn short side above 11.0 m through 15.0 m);
- the existing Rain Bird HE-VAN dataset for narrower geometry (half-short-side target 1.8 m to below 4.0 m).

Model choice remains a preliminary candidate rule and requires engineering review. Exact manufacturer operating points are used; there is no interpolation. At the 3.1 bar design point, the R-VAN18 radius is 5.2 m and the R-VAN24 radius is 7.0 m.

### Owner reference cases: 20 × 10 m and 20 × 15 m

The solver now has regression scenarios for both owner examples:
- **20 × 10 m:** the initial target is 5.0 m; R-VAN18 is selected. The perimeter-only pass is expected to cover the sampled lawn, so no central row is selected.
- **20 × 15 m:** the initial target is 7.5 m; R-VAN24 is selected. The perimeter-only pass leaves a central coverage band, so a single central row parallel to the long side is evaluated and selected to fill it.

For rectangles, interior candidates are generated as one central row parallel to the long side, not a generic triangular lattice. That row is only used if the perimeter pass leaves sampled points uncovered. L-shaped lawns retain the existing conservative interior lattice.

These are sampled-geometry scenarios, not continuous coverage proofs or hydraulic certification. The 3500 dataset remains outside the placement solver because its existing evaluator accepts supplied 180° positions only and the manufacturer precipitation table is based on half-circle operation. Do not copy those values to other arcs.

## Not implemented in this increment

- Automatic Rain Bird 3500 position generation.
- A complete pipe hydraulic calculation, pipe-sizing verification or zone grouping.
- Valve/controller/pump/tank selection.
- Verified body/nozzle assembly and package compatibility.
- Overspray/exclusion geometry.
- Precipitation uniformity / distribution uniformity.
- Sanity SKU, live price/stock, BOM or cart handoff.
- Plants and non-lawn irrigation types.

No Sanity, D1, Cloudflare settings/secrets, Resend, catalogue or Production data are changed by this work.

## Verification status

Source changes and regression tests are present in the branch. GitHub Actions CI, build/type-check, Preview deployment and visual browser QA are pending. No merge to `main` and no Production deployment have been performed.
