# Single-lawn sprinkler placement engine — first implementation

Date: 2026-11-16  
Branch: `feat/irrigation-rvan-performance-priority`  
Scope: deterministic sampled geometry coverage for one confirmed rectangle or orthogonal L-shaped lawn.

## Algorithm

The engine consumes the existing metric geometry validator and exact R-VAN / HE-VAN manufacturer performance tables. It creates:
- inward-facing 90° heads at convex corners;
- inward-facing 270° heads at reflex corners;
- 180° heads along straight boundary edges, subdivided by the exact selected throw radius;
- 360° heads on an interior triangular lattice whose nearest-neighbour spacing does not exceed the manufacturer 50%-of-diameter spacing basis.

It then evaluates each candidate sector against a deterministic sample of lawn points and selects candidates using a deterministic greedy set-cover pass. A second deterministic neighbour-augmentation pass adds nearby candidates where needed to establish head-to-head adjacency; the final layout reports whether every selected sprinkler has a neighbour within the smaller of the two tested radii. The output contains coordinates, sector, direction, radius, pressure, flow and precipitation for every selected sprinkler, sampled coverage and explicit head-to-head spacing diagnostics.

The solver accepts one confirmed rectangle or L-shape and a single nozzle model/family/pressure per run. R-VAN and HE-VAN are run as separate configurations; they are not mixed in one layout. All operating points are exact manufacturer table lookups.

## Strict boundaries

This is a first placement/coverage engine, not an approved irrigation design:
- coverage is evaluated on a configurable spatial sample (default 0.25m), not a continuous mathematical proof;
- the greedy set-cover result is deterministic but not guaranteed globally minimum; neighbour augmentation can add heads beyond the coverage-only selection;
- head-to-head spacing is reported independently and may fail;
- exclusions, multiple regions and unsupported polygons are rejected explicitly;
- overspray, wind, precipitation uniformity, body/nozzle compatibility, dynamic source pressure, pipe losses, zone sizing, valve selection and hydraulic feasibility are not evaluated;
- R-VAN pressure 3.1bar is the manufacturer recommended point; other exact tabulated points may be evaluated but are flagged as not the recommended point;
- no catalogue price/stock, Sanity writes, customer-facing endpoint, Gemini calls, cart or Production change.

## CI verification

Latest implementation commit: `c15cf49d3b93fd0d0f10e7a543358d3139128212`. Blog/Studio validation run `43818273632` passed application/Pages TypeScript, lint, utility tests, website build, migration syntax/dry-run, Studio TypeScript and Studio build. D1 validation run `43818273585` passed. An earlier test run exposed isolated sprinklers after greedy coverage selection; neighbour augmentation was added and baseline rectangle/L-shape tests now require head-to-head spacing to pass.

## Files

- `src/lib/irrigation/lawnSprinklerLayout.mjs`
- `src/lib/irrigation/lawnSprinklerLayout.d.mts`
- `tests/irrigation-lawn-sprinkler-layout.test.mjs`
