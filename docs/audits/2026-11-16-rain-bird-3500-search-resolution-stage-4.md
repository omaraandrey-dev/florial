# Rain Bird 3500 — bounded search-resolution controls, stage 4

Date: 2026-11-16

## Purpose

This increment exposes bounded, deterministic candidate-search resolutions so that the 3500 heuristic can be evaluated for sensitivity instead of relying on one hard-coded grid.

## Search controls

- `candidatePositionStepFactor`: 0.25, 0.5 or 1.0 × exact D42378 throw radius. Default: 0.5.
- `candidateDirectionStepDeg`: 15°, 30° or 45°. Default: 45°.
- Target sampling remains independently controlled by `sampleStepM` (default 0.5 m).
- Unsupported values are rejected. Search candidate/sample caps remain fail-closed.

These are internal numerical search controls, not Rain Bird performance or spacing specifications. A finer grid does not automatically mean a more correct or approved design.

## Intended use

Run the same confirmed geometry and exact nozzle-pressure point with combinations of target sampling, candidate-position spacing and direction increments. Compare:
- candidate count and search size;
- selected rotor count and coordinates;
- sampled uncovered target count/coverage;
- mutual directional head-to-head;
- sampled overspray;
- execution cost.

Do not infer a best configuration from coverage percentage alone. A finer search can change greedy selection order and may increase computation without resolving hydraulic, uniformity or manufacturer evidence gaps.

## Constraints unchanged

- Only exact D42378 pressure/nozzle pairs.
- Only 180° half-circle arcs.
- No pressure interpolation, radius reduction, other arcs or 5000 MPR.
- No hydraulic feasibility, DU/SC, package compatibility, exclusions or customer-facing integration.
- Synthetic regression results are not engineer-reviewed reference designs or field validation.

## Next validation

Build a repeatable benchmark report across approved synthetic geometries first, then compare with owner/engineer-provided manual layouts. Preserve input geometry, exact operating point and all search settings with each result. Only after review should the default search resolution be changed.
