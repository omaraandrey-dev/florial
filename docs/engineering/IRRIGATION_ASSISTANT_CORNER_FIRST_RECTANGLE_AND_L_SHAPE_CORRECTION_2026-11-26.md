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

For an orthogonal L-shaped lawn without a dedicated narrow strip arm, first attempt the whole-polygon R-VAN solver while retaining the original L outline. That solver:
1. seeds useful geometric vertices (including the reflex corner);
2. examines uncovered perimeter samples and adds edge heads, preferring mutual Head-to-Head links to already placed heads;
3. adds interior heads only for samples still uncovered;
4. closes perimeter Head-to-Head gaps before adding interior heads;
5. runs sampled coverage and boundary-sector checks.

The current whole-polygon attempt does not yet pass the complete validation set for every ordinary L-shape. If sampled coverage, Head-to-Head or boundary validation fails, the bridge does not publish an incomplete result: it falls back to the existing largest-area-first rectangular-zone solver and attaches `cornerFirstAttempt` diagnostics plus warning `l_shape_corner_first_attempt_failed_safe_rectangle_fallback_used`. This is a deliberate safety fallback, not proof that the requested whole-polygon L-shape algorithm is complete. Decomposition also remains the primary path for arms with supported 1 m / 2 m widths requiring dedicated directional strip nozzles (RCS/LCS/SST).

## Validation contract

A generated layout is accepted only when sampled coverage is complete, Head-to-Head passes where applicable, and spray footprints pass the existing boundary validation. The tests do not claim a continuous mathematical proof or hydraulic feasibility. The R-VAN nozzle/radius/pressure values remain bound to the existing manufacturer performance dataset and current Florial planning rules.

## Changed implementation and tests

- `src/lib/irrigation/irrigationLayoutBridge.mjs`: restrict L-shape decomposition to layouts containing a supported narrow strip arm; keep other L-shapes intact for the corner-first polygon solver.
- `tests/irrigation-layout-bridge.test.mjs`: assert exact 20 × 20 side coordinates `[0, 8, 12, 20]` on every side; add a non-strip L-shape regression confirming the whole-polygon corner-first attempt is recorded and that an incomplete attempt safely falls back to a validated rectangular layout.

## Release boundary

All changes are limited to `develop`. No merge to `main`, Production deployment, Cloudflare configuration, Sanity write, D1 change or secret change is authorized by this task.
