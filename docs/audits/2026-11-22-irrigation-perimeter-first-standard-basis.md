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

This is still sampled geometric coverage at the configured sample interval. It is not a continuous mathematical proof, a precipitation-uniformity calculation or a finished hydraulic design.

## Rain Bird preference and current manufacturer-data boundary

Rain Bird R-VAN is the preferred rotary-nozzle family in the current supported envelope. The bridge uses:
- R-VAN14 for the existing 4.0–4.6 m short-side candidate band;
- R-VAN18 for above 4.6 m through 5.5 m;
- R-VAN24 for above 5.5 m through 7.0 m;
- the existing Rain Bird HE-VAN dataset for narrower geometry (1.8 m to below 4.0 m).

Model choice remains a preliminary candidate rule and requires engineering review. Exact manufacturer operating points are used; there is no interpolation. The R-VAN24 3.1 bar table point has a 7.0 m radius, which is why this bridge envelope is capped at 7.0 m.

### Explicit unresolved example: 20 × 10 m

A 20 × 10 m lawn has a 10 m short side and is outside the currently connected R-VAN bridge envelope. The present code therefore escalates it instead of inventing a 10 m R-VAN throw.

The repository contains Rain Bird 3500 manufacturer performance data, but its existing evaluator only accepts supplied 180° rotor positions. The manufacturer precipitation table is based on half-circle operation, and the existing component does not generate a complete perimeter-first 3500 layout. It must not be enabled by copying half-circle performance values to other arcs or by assuming an unverified radius.

The owner described a preferred rotary sprinkler that “waters 10 metres” and subsequently confirmed the R-VAN interpretation. The exact meaning of 10 m (radius versus diameter) and the exact Rain Bird model/table point remain to be reconciled with the currently verified R-VAN dataset. Do not change manufacturer values to force the 20 × 10 example to pass. Resolve this before claiming the example is supported.

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
