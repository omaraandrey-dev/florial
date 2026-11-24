# Audit — Rain Bird 3504-PC corner-first integration

Date: 2026-11-24  
Integration branch: `feature/irrigation-3504pc-corner-first-integration`  
Starting point: PR #527 head `cb89ac2f9510334d3281a154d987d6df18aadedc`; the relevant 3504-PC integration from PR #528 was superseded by the owner-approved corner-first implementation.

## Owner requirement

Every generated calculation cell must have four required rotor-corner positions. Shared coordinates between adjacent cells are one physical rotor, not duplicates. Head-to-Head must be verified between adjacent grid nodes using both actual sectors and the smaller planning radius. R-VAN behavior must remain unchanged.

## Implementation

- Replaced the greedy candidate search and the uniform-grid/pruning implementation with `3504pc-corner-first-shared-cell-grid-v1`.
- Built a deterministic axis-aligned cell grid, beginning at 8 m; 9/10 m are later expansion stages, then 7/6/5 m denser stages.
- Kept every cell corner. No greedy rotor pruning is used.
- Added explicit checks for every adjacent horizontal and vertical pair, plus sampled coverage.
- Added shared-rotor coordinate merging across decomposed rectangles. Sector selection uses the occupied quadrants of the original lawn/exclusion geometry.
- A 0.075 m inward offset is allowed only for a rotor candidate when a directional R-VAN strip head occupies the exact shared seam.
- Restored `src/lib/irrigation/lawnSprinklerLayout.mjs` and its declaration exactly from `main`; no R-VAN candidate offset or solver change remains.
- Retained the dimension annotation and project PDF work from the companion geometry branch.

## Regression targets

- 38 × 16 m: 8 m default, 18 unique rotors, 10 cells, 0 uncovered sampled targets, all adjacent Head-to-Head checks pass.
- 10 × 10 m: four 5 × 5 m cells, nine unique rotor positions, all four outer corners present.
- 8 × 8 m: one cell and exactly four 90° corner rotors.
- 38 × 6 m: denser axis grid maintains mutual Head-to-Head.
- Decomposed L-shapes and rectangular exclusions retain the existing strip/fallback boundaries.

## Verification status

Automated tests and exact-head GitHub Actions are pending for this integration branch. No Preview visual acceptance has yet been claimed. No Production deployment, Sanity writes, D1 data/schema changes, Cloudflare settings/secrets changes, Resend actions or order changes were made.
