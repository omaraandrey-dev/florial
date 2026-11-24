# Florial — L-shaped lawn rectangular-zone layout v1

**Status:** implementation in PR #520; not yet merged to `main` or deployed to Production.  
**Branch:** `fix/irrigation-lshape-rectangular-zone-solver`  
**Verified PR head:** `16b537442d949751cb22650389681806b6a7f9f4`

## Purpose

Correct the sprinkler layout for orthogonal L-shaped lawns when one arm is a narrow 1 m / 2 m strip. The previous bridge selected the strip algorithm only when the entire lawn was rectangular. An L-shape such as 28 × 14 m with a 16 × 12 m cut-out therefore entered the general solver using the overall 28 × 14 m bounds; the 16 × 2 m arm was not treated as a narrow strip.

## Geometry decomposition

- Accept only one confirmed, orthogonal six-vertex L-shaped polygon with no exclusions for this decomposition path.
- Find the reflex vertex. Determine the cut-out orientation from its adjacent horizontal and vertical edges, not from SVG/screen coordinates or assumptions about the cut-out label.
- Split the lawn into two non-overlapping rectangles: the full-height/main rectangle and the remaining arm rectangle.
- Verify that the sum of the rectangle areas equals the original polygon area before calculating.
- Apply this decomposition when at least one rectangle has a supported 1 m or 2 m short side. L-shapes without a supported narrow arm continue through the existing whole-polygon solver.

Reference example:

- Overall bounds: 28 × 14 m.
- Cut-out: 16 × 12 m, top-right.
- Main rectangle: 12 × 14 m = 168 m².
- Connected strip: 16 × 2 m = 32 m².
- Total irrigated area: 200 m², equal to 28 × 14 − 16 × 12.

The same geometric decomposition is derived for all four cut-out corners and for transposed/vertical layouts.

## Per-zone calculation

### Circular rectangle

- Run the R-VAN solver against the rectangle's own coordinates and local dimensions, not the original L-shape bounding box.
- Enable rectangular-boundary-safe candidate generation: edge heads are inset according to the selected planning radius, interior candidates are positioned using local dimensions, and any candidate sector that leaves the calculation rectangle is excluded.
- Keep the existing fixed Florial planning radii: R-VAN14 = 3 m; R-VAN18 = 4/5 m; R-VAN24 = 6 m.
- Preserve sampled coverage and head-to-head diagnostics for circular heads.

### Connected 1 m / 2 m strip

- Use the approved directional Rain Bird R-VAN-LCS / RCS / SST models and catalog mappings: LCS A84667, RCS A84668, SST A84669.
- Place the end nozzle at the free end of the strip and orient it toward the connected end.
- Place bidirectional SST heads from the shared seam toward the free end at the approved 3 m / 4 m planning spacing, while keeping the free-end reach within the strip.
- Do not add a redundant LCS/RCS at the shared seam when an SST pattern already reaches that seam. For short strips that require a connected-end nozzle, reserve that exact shared coordinate in the adjacent circular solver.
- If two narrow arms would require conflicting connected-end heads at the same shared corner, return an incomplete result requiring manual engineering review; do not silently generate overlapping heads.
- Vertical strips retain the right-long-edge row and orient the free-end nozzle/SST pattern according to which end connects to the other rectangle.

The existing standalone rectangular strip rules remain unchanged by this connected-arm path.

## Spray-boundary validation and diagram

- The circular rectangle solver filters candidates by whether the complete sector arc remains inside its rectangular calculation bounds.
- After combining the zone layouts, sample the actual circular sectors against the original L-shaped polygon at 1° angular increments and 0.2 m radial increments.
- Sample each directional strip footprint on a 0.2 m spatial grid against the original L-shaped polygon. A detected outside point makes the layout incomplete.
- This is a spatially sampled overspray check, not a continuous mathematical proof.
- The customer SVG draws actual 90° / 180° / 270° sector wedges. A full circle is drawn only for 360° heads.
- Strip direction arrows use a 0.32 m SVG marker; the former 4 m user-space marker produced oversized dark arrowheads that visually resembled water leaving the lawn.

## Result and persistence

- The combined sprinkler list is used by the existing zone grouping, schematic pipe network and BOM builders against the original L-shape geometry.
- Sprinkler IDs are prefixed by calculation-region index so two strip regions cannot collide.
- For mixed layouts, `coverageScope = decomposed_rectangular_zones`; coverage statistics refer only to the circular calculation region and are labelled accordingly. Strip placement follows the owner-defined pattern and is not counted as circular sampled coverage.
- Head-to-head checks refer to circular heads only and are labelled as such. Strip-only layouts retain `owner_defined_strip_pattern` and head-to-head is not applicable.
- Existing cart snapshot, server validation and owner PDF contracts are reused. No D1 schema or data changes are required.
- The fixed top-right pipe connection point is unchanged. The orange line in the schematic is the pipe route, not a sprinkler spray sector; for a top-right cut-out it may pass through the cut-out to reach that fixed connection point.

## Verification evidence

- Exact PR head `16b537442d949751cb22650389681806b6a7f9f4`.
- Blog/Studio validation run `45342615527`: 447/447 tests passed, TypeScript checks, lint, website build, Studio type-check and Studio build succeeded.
- D1 validation run `45342615577`: migration syntax and read-only description dry-run succeeded; no migration was applied.
- Cloudflare Pages Preview deployment `e320d6d7-ae8f-4456-a91d-29572e9dbbb1` succeeded from the exact PR head: https://e320d6d7.florial.pages.dev.
- Browser Rendering preview interaction: 28 × 14 m with 16 × 12 m top-right cut-out; 15 sprinklers, 3 zones, 100% sampled coverage in the circular zone, 0 uncovered circular samples, head-to-head passed.
- Browser Rendering preview interaction: transposed 14 × 28 m with 12 × 16 m top-right cut-out; 15 sprinklers, 3 zones, 100% sampled coverage in the circular zone, 0 uncovered circular samples, head-to-head passed.
- Automated regressions cover all four cut-out corners, a 2 m vertical strip, two narrow connected arms, unique sprinkler IDs, strip SKU placement, boundary sampling and SVG arrow-marker size.

## Explicit limitations and remaining QA

- Hydraulic feasibility, measured dynamic pressure/flow, pressure losses, precipitation uniformity, field distribution and body/nozzle assembly compatibility are not calculated or verified by this geometric layout.
- Browser preview interaction was checked for the top-right horizontal-strip case and the top-right vertical-strip case. Other three cut-out orientations are covered by automated regression tests but still need visual preview acceptance.
- No Production merge/deployment, Sanity writes, D1 schema/data changes, Cloudflare settings/secrets changes, orders or emails were performed in this PR.
