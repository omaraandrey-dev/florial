# Rain Bird 3500 — candidate generator stage 2

Date: 2026-11-16

## Purpose

This increment adds a rotor-specific candidate-position generator after the isolated 180-degree evaluator. It is intentionally separate from the R-VAN/HE-VAN spray layout solver.

Runtime files:
- `src/lib/irrigation/rainBird3500LayoutGenerator.mjs`
- `src/lib/irrigation/rainBird3500LayoutGenerator.d.mts`
- `tests/irrigation-rain-bird-3500-layout-generator.test.mjs`

## Input gates

- Geometry must pass the existing lawn geometry validator as confirmed/accepted.
- Exactly one supported rectangle or L-shape region is accepted.
- Exclusions are rejected in this increment.
- Nozzle pressure must be the exact published D42378 pressure point measured/verified at the nozzle, not pressure at the source.
- Nozzle-tree size and pressure must match an exact D42378 row. No interpolation, extrapolation or nearest-point substitution.
- Only 180-degree sectors are generated. No 90/270/360 degree arc is inferred from the rotor's mechanical adjustment range.

## Candidate generation and selection

- Candidate positions are sampled on a grid with a step equal to half the selected manufacturer's throw radius, plus boundary samples at the same interval.
- Eight fixed direction bearings are evaluated (45-degree increments).
- Every candidate uses a 180-degree sector and the exact D42378 radius/flow row.
- A deterministic greedy set-cover pass repeatedly selects the candidate that covers the greatest number of currently uncovered geometry samples.
- The same physical coordinate cannot be selected twice.
- Candidate and sample caps fail closed rather than silently reducing precision.
- The selected layout is then passed through the independent 3500 evaluator for sampled coverage, mutual directional head-to-head and sampled overspray diagnostics.

## Interpretation and non-claims

This is a deterministic heuristic candidate generator, not a global optimizer. The 45-degree direction resolution and half-radius position grid are search discretization choices, not manufacturer design rules.

A sampled coverage result is not a continuous geometric proof. A candidate layout may remain preliminary because of uncovered samples, directional head-to-head failure or sampled overspray. Even a sampled geometric pass does not establish:
- hydraulic feasibility or zone sizing;
- actual nozzle pressure from source pressure;
- precipitation uniformity, DU or SC;
- package/nozzle-tree/body/regulator compatibility;
- product availability, price or a purchasable BOM;
- field performance or engineer certification.

The 25%/35% radius-reduction conflict remains unresolved and is not applied. No other arc's performance is derived from the half-circle table.

## Scope

- The generator is not connected to the customer-facing assistant or cart.
- No R-VAN/HE-VAN solver behavior is changed.
- No 5000 MPR engine or customer recommendation is added.
- No Sanity, D1, Cloudflare settings/secrets, Resend or manual Production changes are made.

## Next validation gates

1. Build a versioned set of engineer-reviewed rectangle and L-shape reference layouts, including mirrored and rotated shapes and widths in the practical 6–8 m radius band.
2. Compare candidate results with manual placements and inspect each rotor's boundary overspray and directional head-to-head relationships.
3. Run finer-grid convergence tests (e.g. 0.25 m and 0.125 m) and quantify sensitivity to candidate grid and bearing increments.
4. Improve candidate scoring to account for mutual head-to-head and overspray during selection, not only after selection.
5. Add exclusion polygons and boundary-aware placement only after an explicit engineering rule is reviewed.
6. Implement hydraulic network calculations and precipitation matching as independent gates; do not infer either from the geometry result.
7. Obtain written Rain Bird clarification on arc-specific performance and the conflicting radius-reduction statements before supporting other arcs or reductions.
8. Confirm 3504-PC / 3504-PC-SAM factory nozzle-tree/package mapping before catalogue/BOM integration.

## References

- Rain Bird D42378: https://www.rainbird.com/sites/default/files/media/documents/2023-11/d42378_3500_rotor_tech_spec.pdf
- Rain Bird 3500 product page: https://www.rainbird.com/products/3500-series-professional-grade-rotor-sprinklers
- Existing manufacturer evidence audit: `docs/audits/2026-11-16-rain-bird-3500-layout-readiness.md`
- First-stage evaluator: `src/lib/irrigation/rainBird3500RotorEngine.mjs`
