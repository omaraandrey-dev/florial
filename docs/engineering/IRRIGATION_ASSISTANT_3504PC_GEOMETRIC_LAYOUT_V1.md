# Florial — Rain Bird 3504-PC corner-first cell layout

**Status:** integrated implementation candidate; not yet merged into `main`.  
**Scope:** 3504-PC rotor geometry only. The established R-VAN solver source remains identical to the current `main` version.

## Owner-approved placement rule

1. Start with the actual orthogonal calculation rectangle and identify its four outer corners.
2. Build a regular set of rectangular/square cells. Every cell has four required corner positions.
3. Place one rotor at each unique cell-corner coordinate. Adjacent cells share one physical rotor at their common coordinate; do not create duplicate heads.
4. Assign the sector from the location within the rectangle: 90° at a convex outer corner, 180° on a straight edge, and 360° at an interior grid point. When adjacent decomposed rectangles share a coordinate, determine the sector from the original irrigated geometry: 90°/180°/270°/360° according to the contiguous irrigated quadrants around that point.
5. Verify every adjacent grid pair in both directions. Distance must not exceed the smaller planning radius, and both real sectors must reach the other head.
6. Check the complete sampled target mesh and sampled sector containment. If the stage fails, try the next planning radius.
7. Keep all required cell-corner heads. Do not run a greedy pruning pass that can delete a required corner.

## Radius order

- 8 m is the default and first attempt.
- 9 m and then 10 m are considered only if the 8 m grid cannot satisfy coverage and mutual Head-to-Head.
- If expansion does not solve the geometry, try denser grids at 7 m, 6 m and 5 m.
- Each local head is capped by its geometric clearance. A candidate that cannot retain at least 5 m of safe planning reach is rejected.
- These are Florial planning values, not manufacturer-certified throws, nozzle performance data or hydraulic calculations.

## Grid and shared corners

The grid uses deterministic axis positions with no chessboard/staggered pattern. The number of intervals is selected so the distance between adjacent grid lines does not exceed the planning pitch. The grid is anchored to the rectangle bounds; the final shorter interval is kept rather than creating a second cluster at the far end.

For a 38 × 16 m rectangle at the default 8 m stage:
- X positions: 0, 8, 16, 24, 30 and 38 m.
- Y positions: 0, 8 and 16 m.
- 10 calculation cells, 18 unique rotor positions.
- Each cell references four corners; shared corners are represented by one physical head.
- Expected sampled coverage and every adjacent Head-to-Head pair must pass before the stage is accepted.

For a 10 × 10 m rectangle, the grid creates four 5 × 5 m cells and nine unique corner positions. The four outer geometry corners remain present.

If a directional R-VAN strip head occupies a seam coordinate needed by the adjacent rotor rectangle, the rotor-only candidate may be inset 0.075 m toward that rectangle. This exception does not change R-VAN placement or the R-VAN solver.

## Decomposed geometry

Orthogonal geometry and rectangular exclusions continue through the existing decomposition bridge. Circular calculation rectangles use the corner-first 3504-PC grid first; narrow 1 m / 2 m strip regions retain their established directional R-VAN pattern. Coincident 3504-PC heads from adjacent calculation rectangles are merged into one head and receive a sector based on the original irrigated geometry. The merged rotor uses the larger candidate radius, then the final composite sector footprint is checked against the original lawn and exclusions; if it leaves the irrigated area, the layout is rejected.

## Verification boundaries

- Coverage uses a 0.5 m sampled mesh by default; this is not a continuous mathematical proof.
- Sector containment uses spatial sampling; this is not a continuous proof.
- Head-to-Head is a geometric mutual-sector/reach test, not precipitation uniformity, DU/CU or field-performance validation.
- Hydraulic pressure, flow, pipe losses, nozzle-specific performance and zone hydraulic feasibility are not evaluated.
- R-VAN implementation is preserved from `main`; the only seam adjustment is an optional 0.075 m offset applied to a 3504-PC rotor candidate, never to an R-VAN candidate.
