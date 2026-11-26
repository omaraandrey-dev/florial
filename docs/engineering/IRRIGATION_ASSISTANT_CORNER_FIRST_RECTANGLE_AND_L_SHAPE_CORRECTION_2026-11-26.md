# Irrigation assistant — symmetric rectangles and corner-first L-shape correction

**Date:** 2026-11-26  
**Branch:** `develop`  
**Scope:** geometry placement only; no hydraulic, catalogue, pressure, flow, D1, Sanity or Production changes.

## 20 × 20 m rectangle

The 3504-PC shared-cell grid uses a symmetric axis position sequence for a 20 m side at the 8 m planning stage:

`[0, 8, 12, 20]`

The global optimizer may remove redundant symmetric groups, so the final layout is not required to retain all four grid coordinates on each side. The regression test checks equal head counts on all four sides and rotational/reflection symmetry after global optimization, preventing the reported asymmetric result (four heads on one side and two on the others). It also checks global coverage, Head-to-Head and in-boundary spray.

The 8 m values are geometric planning radii used by the existing solver. They are not a manufacturer-certified throw guarantee or a hydraulic calculation.

## L-shaped lawns

For a supported orthogonal L-shaped lawn that does not contain a dedicated 1 m or 2 m narrow arm, retain the original L polygon and route it through the whole-polygon R-VAN solver. That solver:
1. seeds useful geometric vertices (including the reflex corner);
2. examines uncovered perimeter samples and adds edge heads, preferring mutual Head-to-Head links to already placed heads;
3. adds interior heads only for samples still uncovered;
4. runs the explicit Head-to-Head spacing repair and final sampled coverage validation.

Previously, the bridge decomposed every six-vertex L-shape into two rectangles. This bypassed the whole-polygon corner-first L-shape strategy for ordinary L-shapes. Decomposition remains enabled when at least one arm has the supported 1 m / 2 m width and requires the dedicated directional strip nozzle layout (RCS/LCS/SST).

## Validation contract

A generated layout is accepted only when sampled coverage is complete, Head-to-Head passes where applicable, and spray footprints pass the existing boundary validation. The tests do not claim a continuous mathematical proof or hydraulic feasibility. The R-VAN nozzle/radius/pressure values remain bound to the existing manufacturer performance dataset and current Florial planning rules.

## Changed implementation and tests

- `src/lib/irrigation/irrigationLayoutBridge.mjs`: restrict L-shape decomposition to layouts containing a supported narrow strip arm; keep other L-shapes intact for the corner-first polygon solver.
- `tests/irrigation-layout-bridge.test.mjs`: assert exact 20 × 20 side coordinates `[0, 8, 12, 20]` on every side; add a non-strip L-shape regression for full-polygon corner-first progression, complete sampled coverage, Head-to-Head and boundary validation.

## Release boundary

All changes are limited to `develop`. No merge to `main`, Production deployment, Cloudflare configuration, Sanity write, D1 change or secret change is authorized by this task.
