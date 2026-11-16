# Rain Bird 3500 — search sensitivity benchmark, stage 5

Date: 2026-11-16
Status: benchmark harness executed successfully in exact-head CI; results reviewed.

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


## Exact-head benchmark results

The benchmark ran on commit `42d4455ddf1328603bd008a0538dd7ab28f8ede2`. Blog/Studio CI run `43850890915` and D1 validation run `43850890870` both passed.

### Candidate-resolution matrix

Across all 36 combinations (four geometries × three position factors × three direction increments):

- Sampled target coverage was 100% and uncovered target count was zero.
- Every generated layout failed directional head-to-head.
- Every generated layout reported sampled overspray.
- Selected rotor count was one for every L-shape orientation and one or two for the rectangle.
- Thus none of these benchmark layouts passed the evaluator as a complete candidate. Finer candidate grids and smaller bearing increments did not fix the H2H/overspray failures.

Representative default setting (position factor 0.5, direction increment 45°, target step 0.5 m):
- Rectangle 12 × 8 m: 15 candidate positions, 118 directional candidates, 2 selected rotors; positions (5.05, 0.00) m at 90° and (10.10, 0.00) m at 0°; 425 sampled targets, 100% coverage, H2H failed, 811 sampled outside-sector points.
- L-shape 8 × 7 m: 10 candidate positions, 78 directional candidates, 1 selected rotor at (0.00, 0.00) m at 0°; 191 sampled targets, 100% coverage, H2H failed (a single rotor has no neighbour), 468 sampled outside-sector points.
- Mirrored and 90°-rotated L-shapes also selected one rotor and showed the same H2H/overspray failure. Their selected coordinates transform with the input orientation, but this does not imply a feasible design.

### Target-sampling sensitivity

With candidate settings fixed at defaults:

- Rectangle 12 × 8 m: 425 / 1,617 / 6,305 sampled targets at 0.5 / 0.25 / 0.125 m; measured CI runtimes 9.919 / 35.725 / 171.377 ms.
- L-shape: 191 / 701 / 2,681 sampled targets at 0.5 / 0.25 / 0.125 m; measured CI runtimes 3.221 / 11.011 / 41.486 ms.
- Selected rotor count and coordinates remained unchanged across those three sample steps for each geometry. Coverage remained 100%, while H2H and overspray remained failed.
- Runtime values are environment-specific diagnostics, not a performance SLA. Halving the sample interval increases computational work substantially; the rectangle 0.125 m run took about 17× the 0.5 m run in this CI observation.

## Engineering conclusion

The present greedy objective maximizes newly covered sampled points but does not enforce head-to-head or overspray during selection. On these small synthetic shapes, one large-radius 180° sector can cover every sampled target from a boundary coordinate while spraying outside the lawn and having no mutual neighbour. This exposes a structural limitation in the objective, not a sampling-resolution issue.

Do not interpret 100% sampled coverage as an acceptable arrangement. The generator must remain internal and preliminary. The next design task is to revise the selection objective/feasibility gates and the geometry context (site boundary, no-water surfaces and permitted adjacent irrigated regions) before claiming a feasible layout. Non-180° arcs remain out of scope until manufacturer performance evidence supports their use. Hydraulic feasibility and precipitation uniformity remain unevaluated.
