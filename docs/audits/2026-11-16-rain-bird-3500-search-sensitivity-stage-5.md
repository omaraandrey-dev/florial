# Rain Bird 3500 — search sensitivity benchmark, stage 5

Date: 2026-11-16
Status: benchmark harness added; numerical results pending exact-head CI execution and review.

## Objective

Measure how the preliminary 3500 candidate generator changes when its internal candidate-position grid and bearing increments change, while keeping the exact manufacturer operating point fixed. Independently measure sensitivity to target-sampling spacing.

## Fixed operating point

- Manufacturer data: Rain Bird D42378.
- Nozzle pressure at the nozzle: 2.5 bar (exact table point).
- Nozzle-tree size: 4.
- Arc: 180° only.
- Exact radius, flow and precipitation values are loaded from the code-owned manufacturer dataset; no interpolation or radius reduction is applied.

## Synthetic geometry matrix

The new automated benchmark covers:
- rectangle 12 × 8 m;
- orthogonal L-shape 8 × 7 m with a 4 × 4 m cut-out;
- horizontal mirror of the L-shape;
- 90° rotation of the L-shape.

For each geometry, candidate position factors 0.25/0.5/1.0 and bearing increments 15°/30°/45° are crossed at a fixed 0.5 m target-sampling step. A separate matrix compares target sampling at 0.5/0.25/0.125 m while holding candidate settings at the defaults (0.5 radius factor and 45°).

## Recorded metrics

- wall-clock runtime per call (diagnostic only; CI runtime is not a stable performance SLA);
- tested candidate positions and directional candidates;
- selected rotor count and total flow;
- sampled target count, coverage percentage and uncovered targets;
- directional head-to-head pass/fail count;
- sampled overspray status and outside-sector sample count;
- explicit hydraulic and precipitation-uniformity statuses.

## Interpretation limits

All geometries are synthetic. The benchmark is a reproducible software sensitivity study, not a field test, engineer-approved reference layout, manufacturer spacing recommendation or proof of convergence. A better sampled coverage percentage alone does not make a layout acceptable. Head-to-head and overspray are post-selection checks in the current greedy algorithm; they are not yet constraints in candidate selection. The evaluator checks the nearest qualifying mutual neighbor per rotor, not a complete engineer-defined adjacency graph.

The current generator remains limited to exact D42378 points and 180° arcs. Hydraulics, DU/SC, precipitation distribution, exclusions, body/package compatibility and customer-facing integration remain outside this stage. No 5000 MPR engine.

## Acceptance / next steps

1. Exact-head CI must pass and benchmark output must be reviewed.
2. Compare selected rotor count/coordinates across resolutions; identify unstable cases and search caps.
3. Review any no-head-to-head or overspray outcomes as failures/warnings, not as solved by coverage percentage.
4. Obtain owner/engineer-approved manual reference layouts before claiming geometric design accuracy.
5. Only after this review decide whether the generator search objective should include H2H and overspray directly.

No Sanity/D1 writes, Cloudflare settings/secrets, Resend, customer-facing wiring or Production changes are part of this benchmark.
