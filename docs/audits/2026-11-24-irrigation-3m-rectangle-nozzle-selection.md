# Irrigation Assistant — 3 m-wide elongated rectangle nozzle selection correction

Date: 2026-11-24  
PR: https://github.com/omaraandrey-dev/florial/pull/521  
Base: `main` at `a92bd59352b1a3fc9bb2f9a150107eb55cf31314`  
Code commit: `28f43672bf259c95e6577c4eb8477462e56f4e40`

## Owner-reported defect

The owner reported that a rectangular lawn 3 × 18 m incorrectly received R-VAN24 heads with a 6 m planning radius, causing spray reach to extend beyond the 3 m-wide lawn. The correct expected model for this short-side envelope is R-VAN14 / 3 m.

## Root cause verified in main

In `src/lib/irrigation/lawnSprinklerLayout.mjs`, corner candidate selection used:

```js
nozzleForRadius(distance(current, center))
```

For a 3 × 18 m rectangle, the distance from a corner to the global centroid is approximately:

```
sqrt(9² + 1.5²) = 9.12 m
```

The selector therefore escalated to R-VAN24 / 6 m. This incorrectly made a corner head responsible for reaching across the full long axis, ignoring the perimeter-first sequence and intermediate heads along the long edges. The short-side bridge had already correctly selected the R-VAN14 / 3 m base model, but the corner-level selector overrode it.

## Implemented correction

For rectangular geometry with a short bounding-box side ≤3 m, cap corner required reach at 3 m before mapping it to the owner-approved nozzle radii. Edge candidates continue to select their model from actual equal spacing. The general perimeter-first selection, interior fallback and head-to-head repair are unchanged.

This bounded rule preserves wider accepted cases: 8 × 8 m continues to require R-VAN24 at corners and R-VAN18 at side midpoints; 30 × 5 m remains covered by its existing regression test.

## Regression coverage

Added two cases in `tests/irrigation-layout-bridge.test.mjs`:
- 18 × 3 m;
- rotated 3 × 18 m.

Both require all selected heads to be R-VAN14 / 3 m, no interior row, all heads inside the rectangle, zero uncovered samples and a passing head-to-head check.

## Verification

- Blog/Studio validation run `45350255095`: 443/443 tests passed; application/Pages Functions type-check, lint, website build, read-only description migration dry-run, Studio type-check and Studio build all succeeded.
- D1 migration validation run `45350255177`: success.
- Cloudflare Pages Preview deployment `1ae47c71-3276-4ab8-b37a-ce36191231bc`: success from exact code commit `28f43672bf259c95e6577c4eb8477462e56f4e40`, URL https://1ae47c71.florial.pages.dev.
- No Browser visual/interaction QA performed. No Sanity writes, D1 schema/data changes, Cloudflare settings/secrets changes, Production orders/emails or Production deployment.
- PR #521 remains draft and awaits owner review/approval before merge.
