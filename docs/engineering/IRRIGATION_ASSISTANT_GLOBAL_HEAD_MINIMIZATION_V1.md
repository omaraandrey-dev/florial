# Irrigation Assistant — global sprinkler head minimization v1

**Status:** historical specification — superseded for the current live algorithm by [IRRIGATION_ASSISTANT_WHOLE_POLYGON_SEQUENTIAL_LAYOUT_V1.md](IRRIGATION_ASSISTANT_WHOLE_POLYGON_SEQUENTIAL_LAYOUT_V1.md).  
**Owner decision:** 2026-11-26  
**Development branch:** `develop`  
**Historical context:** this document records the earlier rectangle-first minimization design. Do not treat its rectangle-first sequencing or sector-consolidation proposal as the current Production algorithm. The current implementation is the whole-polygon sequence documented in the linked specification; its rotor-only reduction is removal-only before R-VAN.


> **Supersession note (2026-11-27):** PR #551 replaced the earlier rectangle-first global minimization flow with a whole-polygon sequential algorithm. The current live implementation performs whole-polygon rotor sector expansion, then a protected rotor-only redundancy reduction before R-VAN, followed by residual R-VAN and strip passes and final mixed-family validation. This file is retained for historical traceability; use [the current whole-polygon specification](IRRIGATION_ASSISTANT_WHOLE_POLYGON_SEQUENTIAL_LAYOUT_V1.md) for all current implementation and maintenance work.

## 1. Purpose and safety boundary

Add a global, bounded minimization pass after the existing per-rectangle placement has completed. The pass may remove or consolidate only Rain Bird 3504-PC rotor heads. It must not alter the existing 3504-PC candidate generator, radius stages, R-VAN placement, directional strip placement, approved 7.5 cm seam adjustment, geometry decomposition, or hydraulic assumptions.

The objective is to reduce the number of installed heads while preserving all sampled target coverage, the existing mutual Head-to-Head relationship rules, and the existing sampled spray-boundary/exclusion checks. This is a deterministic greedy/local optimization, not a proof of a mathematical global minimum.

## 2. Approved rectangle order

All non-overlapping calculation rectangles are processed by **descending area** (largest first). Ties are deterministic: descending short side, descending long side, then ascending minimum Y and minimum X. The same order applies to the explicit two-rectangle L-shape path and the general orthogonal decomposition path.

Already placed heads continue to be supplied to subsequent local solvers exactly as before. R-VAN and strip placement rules remain unchanged.

## 3. Initial layout and global target map

1. Complete the existing primary layout for every calculation rectangle.
2. Combine all selected heads, including fixed R-VAN and strip heads.
3. Build one target map from the original lawn boundary at the configured sample step (normally 0.5 m).
4. Include samples on the outer lawn boundary. Exclude all points inside or on rectangular exclusions, including pools, buildings, paved areas and drip-irrigated areas.
5. Count target points after clipping to the lawn and exclusions. If the target count exceeds 30,000, skip global minimization and report `skipped_target_limit`. Do not claim that global coverage was verified. Existing local per-rectangle results may still be reported as local checks.
6. Before optimization, validate the combined baseline against global coverage, the existing Head-to-Head relationship model, and `evaluateCompositeOverspray`. If the baseline fails, do not optimize it; preserve the incomplete result and warnings.

## 4. Removal pass — 3504-PC only

1. Compute each 3504-PC head's unique contribution: target points covered by that head and by no other head in the current complete set.
2. Try heads in ascending unique-contribution count; use a deterministic ID tie-break.
3. Temporarily remove one head.
4. Accept removal only when every global target remains covered, the existing Head-to-Head checks still pass for every affected calculation region, and sampled spray footprints remain inside the original lawn and outside all exclusions.
5. If any gate fails, restore the head.
6. Recompute unique contributions after every accepted removal.
7. Never remove R-VAN circular heads, R-VAN-LCS/RCS/SST strip heads, or other non-3504-PC heads.

Head-to-Head is **not** an all-to-all requirement. Preserve the current semantics: each head must retain its required mutually reachable neighbor; perimeter heads must retain both previous and next perimeter relationships where applicable. Cross-region links continue to use the existing mutual-sector/radius test. Do not replace these rules with center-distance-only checks.

## 5. Sector consolidation

1. Find 3504-PC heads at the same physical coordinate (within the solver's coordinate tolerance).
2. Try replacing a multi-head same-coordinate group with one 270° or 360° 3504-PC head at exactly that coordinate. Prefer an inward-facing 270° sector at a reflex corner; test 360° only as another candidate.
3. Candidate radius must be selected from the radii already present in the group; do not invent a new radius or move the head.
4. Validate every candidate against global coverage, the same Head-to-Head rules, and sampled overspray/exclusion checks.
5. A sector edit to a single existing head is retained only when the edit enables removal of at least one additional 3504-PC head. A sector-only change with no net head-count reduction is rejected.
6. Count sector candidates. Stop after 500 variants and report `sector_variant_limit_reached`; never imply exhaustive search.

Only project-supported 3504-PC sectors (90°, 180°, 270°, 360°) may be emitted. The existing project snapshot/BOM contract must remain valid.

## 6. Finalization

After accepted changes:

- Re-run the complete global target coverage check.
- Re-run the affected regional Head-to-Head checks and cross-region mutual reach checks.
- Re-run the complete sampled spray-footprint check against the original boundary and all exclusions.
- Rebuild irrigation zones and pipe routes from the final head set.
- Rebuild the BOM from the final head set; zone counts and BOM quantities must match.
- Preserve the original primary layout in diagnostics or test fixtures so the optimized result can be compared with its baseline.

If a gate fails, retain the last valid head set and expose an incomplete status/warning. Never hide a failure by dropping heads or reporting a successful global check.

## 7. Explicit non-goals

This remains sampled geometric planning. It does not calculate source pressure/flow, pipe losses, hydraulic zone feasibility, precipitation uniformity (DU/CU), actual field performance, or manufacturer-guaranteed throw for arbitrary nozzle/pressure/arc combinations.

## 8. Regression matrix

At minimum cover:

- 8×8 and 10×10 m rectangles.
- 38×16 m rectangle.
- 28×14 m L-shape with 16×12 m top-right exclusion.
- 28×4 m L-shape with 16×2 m top-right exclusion.
- Rectangular lawn with pool/building/patio/drip exclusions.
- Multiple calculation rectangles with shared coordinates.
- Duplicate 3504-PC positions, including a reflex-corner inward 270° candidate.
- X=0, Y=0 and X=0/Y=0 exclusion coordinates.
- A target grid above 30,000 points (optimization must skip explicitly).
- A 500-variant sector-search cap.
- Regressions proving R-VAN and strip heads are never removed or moved.
- Final zone count, BOM quantity and pipe-network consistency.

## 9. Verification evidence

Record exact branch/commit SHA, CI run IDs, Preview deployment ID and owner visual/functional acceptance separately. A passing local build does not prove Preview or Production deployment. Production release requires a separate `develop → main` PR, exact-SHA checks, Preview, review and explicit owner approval.
