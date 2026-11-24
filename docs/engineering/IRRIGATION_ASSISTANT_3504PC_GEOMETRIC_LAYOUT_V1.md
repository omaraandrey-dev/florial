# Rain Bird 3504-PC geometric layout — corner-first shared-cell algorithm

**Status:** implementation in integration PR #530; not merged to `main`. Automated CI and Preview deployment passed on exact head `e1480631e4dedd2bb119fc644f7369b0cb9228ca`; owner visual acceptance remains pending.  
**Owner-approved scope:** revise the Rain Bird 3504-PC rotor placement algorithm and add the separately approved 7.5 cm R-VAN corner offset only for a shared strip/rectangle seam fallback. All other established R-VAN selection and placement rules remain unchanged. This remains preliminary geometric planning, not a hydraulic design.

## 1. Owner-approved layout rules

- Start with the four actual geometric corners of each rectangular calculation region.
- Test those four corner rotors before creating side rows, interior rows or additional cells.
- If the four corner rotors provide complete sampled coverage and mutual Head-to-Head, retain only those four.
- If four corners are insufficient, subdivide the rectangle into square/rectangular cells. Every cell has four corner positions.
- A coordinate shared by two or more cells is one physical rotor position, not multiple duplicated heads.
- Adjacent Head-to-Head is checked in both directions against the actual sector of each rotor, not by distance alone.
- The base planning stage is 8 m. 9 m and 10 m are allowed when they materially reduce unnecessary heads and still pass all geometry/Head-to-Head checks. Local safe reach may be reduced to 7 m, 6 m or 5 m.
- Sector orientation and radius are validated against the calculation rectangle before a rotor is accepted.

These are Florial planning rules, not Rain Bird manufacturer-certified throw distances for every arc/nozzle/pressure. The UI and project documentation must keep that distinction explicit.

## 2. Algorithm phases

Implementation: `src/lib/irrigation/rainBird3504Layout.mjs`.

### Phase A — geometry validation

- Accept one confirmed axis-aligned rectangular calculation region with no exclusions inside that rectangle.
- The bridge decomposes supported orthogonal lawn geometry and rectangular exclusions into non-overlapping calculation rectangles before calling this rectangle solver.
- Reject unsupported geometry instead of manufacturing a layout.
- Build a 0.5 m sampled target grid, subject to a 30,000-target safety limit.

### Phase B — four-corner seed

Create one 90° rotor at each true rectangle corner, with the sector bisector directed into the rectangle. Choose the largest permitted local radius not exceeding the current stage or the safe rectangle clearance.

Try stages in the order 8 m, 9 m, 10 m, then 7 m, 6 m and 5 m. The first corner-only set that passes complete sampled coverage and mutual Head-to-Head is accepted without adding intermediate heads.

### Phase C — shared cell grid

If the four-corner set cannot pass, create X/Y axis positions for a complete cell grid. Every resulting cell has four corner positions. The global coordinate set deduplicates shared corners, so an N×M cell layout contains (N+1)×(M+1) unique grid nodes rather than four independent rotors per cell.

For each node:
- a rectangle vertex receives a 90° sector bisected toward the interior;
- a boundary node receives a 180° sector directed inward;
- an interior node receives a 360° sector;
- its radius is capped by the actual local clearance and selected from 10/9/8/7/6/5 m.

The grid is rejected if any node lacks a safe rotor radius, any sampled target remains uncovered, any sector leaves the calculation rectangle, or any horizontally/vertically adjacent grid pair fails mutual Head-to-Head.

When several complete grid candidates pass, the solver scores rotor count plus a radius-stage penalty. This prefers the 8 m baseline unless a 9/10 m stage meaningfully reduces the number of physical heads. Lower stages remain available where local geometry requires them.

### Phase D — integration and fallback

The bridge retains the existing area-ascending decomposition and per-rectangle decision:
- a non-strip rectangle is accepted as a 3504-PC layout only when the rectangle is completely covered and its Head-to-Head checks pass;
- otherwise its partial rotor candidates are discarded and the established R-VAN fallback is used for that rectangle;
- 1 m / 2 m directional LCS/RCS/SST strip rules remain unchanged.

At a shared narrow-strip seam, the 7.5 cm inward offset is applied only to the matching R-VAN corner candidate, and only if the adjacent rectangle uses the R-VAN fallback. The offset is an opt-in candidate-position adjustment; it does not alter model selection, nozzle sizing, radius selection, perimeter/interior ordering or spacing rules. The candidate's spray sector must still pass rectangle-boundary and original-lawn/exclusion checks.

The 3504-PC solver does not accept seam offsets. Its corner-first positions remain at true geometric corners; shared-grid nodes are not shifted.

## 3. Output and order snapshot

Each 3504-PC head is explicitly tagged:
- `performanceModel: '3504-PC'`;
- `pattern: 'rotor'`;
- `source: 'vertex' | 'edge' | 'interior'`;
- `radiusM: 5 | 6 | 7 | 8 | 9 | 10`.

The project snapshot validator accepts and preserves the rotor pattern. The BOM validates that a 3504-PC head is a rotor with a 5–10 m planning radius, adds SKU `Y34001`, and does not add an 1804 spray body to that rotor. The assistant's layout details show the planning radius beside the 3504-PC arc.

The four-corner and shared-cell diagnostics are included in the solver result so regression tests can verify cell count, four corner positions per cell and unique shared-node count.

## 4. Regression acceptance cases

The integration test suite must verify:
- 8×8 m: exactly four 8 m corner rotors, no intermediate heads;
- 10×10 m: four 10 m corner rotors are chosen before adding intermediate heads;
- 38×16 m: 5×2 cells, 10 cells, 18 unique rotor positions, complete coverage and mutual Head-to-Head;
- 20×10 m: 10 m grid stage avoids an unnecessary extra row while retaining mutual Head-to-Head;
- 20×15 m: local clearances reduce selected radii while preserving adjacent Head-to-Head;
- the 3504-PC solver keeps all geometric corner positions unshifted;
- a 7.5 cm seam offset applies only to the matching R-VAN fallback corner candidate;
- the decomposed L-shape and exclusion regressions still pass;
- established R-VAN model/radius and placement regressions remain unchanged outside the explicit seam-offset case.

## 5. Engineering limitations

- Sampled coverage is not a continuous mathematical proof.
- Sector-boundary validation is spatially sampled.
- No 3504-PC nozzle-specific flow, measured nozzle pressure, actual field throw, precipitation rate by arc, DU/CU, pipe loss or hydraulic zone feasibility is inferred.
- Manufacturer package/accessory configuration and final BOM quantities remain provisional.
- The rectangle solver does not independently solve arbitrary polygons; it relies on the existing geometry decomposition bridge and final composite overspray checks.

## 6. Verification record

- Blog/Studio validation run `45448308122` passed on exact head `e1480631e4dedd2bb119fc644f7369b0cb9228ca`: 475/475 tests, app/Pages Functions type-check, lint, website build, read-only D1 dry-run, Studio type-check and build.
- D1 validation run `45448308116` passed; no migration was applied.
- Cloudflare Pages Preview deployment `03615d85-7a08-42a9-8d41-cbd0d3ec2de9` succeeded: https://03615d85.florial.pages.dev.
- Browser interaction/visual QA is not confirmed; owner review remains pending.

## 7. Release boundary

No Sanity writes, D1 schema/data changes, Cloudflare settings/secrets changes, Production deployment or Production order/email tests are part of this work. Visual Preview acceptance is a separate check and must not be claimed until performed.
