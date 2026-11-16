# Rain Bird 3500 — synthetic geometry invariance tests, stage 3

Date: 2026-11-16

## Purpose

Add automated regression coverage for the stage-2 3500 candidate generator across mirrored and right-angle-rotated orthogonal L-shapes, and across progressively finer target-sampling steps.

## Test artifact

- `tests/irrigation-rain-bird-3500-reference-invariance.test.mjs`

## Cases

- Synthetic orthogonal L-shape based on a 8 m × 7 m bounding rectangle with one 4 m × 4 m cut-out.
- Horizontal and vertical mirrors.
- 90°, 180° and 270° rotations.
- Target sampling at 0.5 m, 0.25 m and 0.125 m.
- Unique generated rotor IDs and physical coordinates.
- Exact D42378 operating point remains fixed at nozzle pressure 2.5 bar and nozzle 4; all generated sectors remain 180°.
- Hydraulic feasibility and precipitation uniformity remain explicitly `not_evaluated`.

## Interpretation

These are synthetic software invariance/regression cases, not field measurements and not engineer-approved irrigation reference layouts. Passing them demonstrates only that the code accepts the transformed geometries and preserves the stated invariants. It does not demonstrate that the generated layouts are hydraulically feasible, uniformly irrigated, free of unacceptable overspray, or suitable for customer recommendations.

## Still required

1. Engineer-approved manual reference layouts with coordinates, arc settings, nozzle/pressure points and acceptance rationale.
2. Field or controlled catch-can validation where precipitation uniformity is assessed.
3. Quantified candidate-layout sensitivity and convergence, including changes in selected rotor count/positions, not only sample count.
4. Improved candidate selection that considers head-to-head and overspray during the search.
5. Hydraulic network model and verified 3504 package/nozzle-tree mapping.

No 5000 MPR work, Sanity/D1 writes, customer-facing integration or Production configuration changes are included.
