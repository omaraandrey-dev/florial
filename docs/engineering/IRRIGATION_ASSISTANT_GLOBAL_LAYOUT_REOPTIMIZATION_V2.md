# Irrigation Assistant — global layout re-optimization v2

**Status:** owner-requested redesign, 2026-11-26  
**Development branch:** `develop`  
**Production baseline:** `main`; no Production changes are authorized.  
**Supersedes for future implementation:** the v1 optimization scope in `IRRIGATION_ASSISTANT_GLOBAL_HEAD_MINIMIZATION_V1.md`. The v1 document remains as the historical record of the first implementation.

## 1. Problem statement

The v1 optimizer starts from independent rectangle layouts and applies deterministic one-head-at-a-time deletion plus same-coordinate sector consolidation. It does not relocate heads, jointly rebuild the layout, or search for a new candidate position after a removal fails. A stable ID tie-break can also break geometric symmetry when candidates have equal unique contribution.

Consequences include asymmetric side counts on geometrically symmetric squares, visible seams between calculation rectangles, and redundant groups of heads that cannot be reduced without moving one or more heads.

## 2. New design principle

The final sprinkler arrangement is optimized against the **original complete irrigated geometry**, not against the artificial rectangle boundaries created for decomposition.

Rectangle decomposition remains a seed-generation and diagnostic tool only. It must not constrain the final head positions or preserve per-rectangle head ownership as a hard placement rule.

## 3. Hard constraints — never traded for a lower head count

Every accepted candidate layout must pass all applicable checks:

1. All global target samples are covered.
2. Existing project Head-to-Head semantics are preserved: each rotor has a valid mutually reachable neighbor; perimeter-linked heads retain their required previous/next relationships; cross-region relationships use actual mutual sector reach, not center distance alone.
3. Every spray sector/footprint stays inside the original lawn boundary and outside every exclusion.
4. Candidate head positions and sectors are supported by the project model.
5. Final zones, pipe route and BOM are regenerated from the final set and remain internally consistent.

A candidate that fails any hard constraint is rejected. If no valid re-optimized candidate exists, retain the best valid baseline and expose the incomplete state; never report a failed check as successful.

## 4. Search architecture

### 4.1 Build several starting candidates

- Keep the existing 3504-PC and R-VAN solvers as deterministic seed generators.
- Generate at least one whole-geometry seed candidate for simple rectangles.
- For orthogonal shapes and exclusions, combine the existing decomposition seed with candidates generated from the complete original geometry.
- Do not treat the descending-area rectangle order as an optimization objective. It is only a deterministic seed-processing order.

### 4.2 Build a global candidate-position pool

Candidate positions are generated from:
- existing sprinkler positions;
- global lawn sample/grid positions;
- boundary and reflex-corner positions;
- local offsets around existing positions and coverage gaps;
- symmetric counterparts when the geometry and exclusion set have the corresponding symmetry.

Candidate positions must lie on or inside the irrigated geometry. Candidate sectors are generated only from supported project sectors and allowed planning radii. Sector footprints are checked against the original polygon and exclusions.

The candidate pool and number of evaluated variants must be bounded and observable in diagnostics.

### 4.3 Joint reconfiguration

The optimizer must support these moves, always validating the complete candidate set:

- remove a redundant head;
- relocate one head to a nearby candidate position;
- move a group of heads together when a seam or symmetry relationship requires it;
- replace a group of nearby circular heads with one or more new 3504-PC candidates;
- replace circular R-VAN heads with 3504-PC candidates when the complete global layout passes every geometric and Head-to-Head gate;
- adjust a sector at a fixed or relocated position;
- add a head only when required to restore coverage or Head-to-Head after a better global arrangement.

Directional strip heads are not silently reinterpreted as circular heads. Replacing a strip pattern requires an explicit candidate that covers the strip's full target area and passes all checks; otherwise preserve the directional heads.

A relocation or replacement is not accepted merely because it improves local coverage. It must improve the global objective while retaining every hard constraint.

### 4.4 Symmetry-aware search

Detect exact reflection/rotation symmetry of the outer boundary and exclusions.

For a symmetric square or rectangle:
- evaluate symmetric candidate groups as units;
- do not accept a one-sided deletion when the mirrored counterpart is equivalent;
- preserve equal sprinkler counts on equivalent sides where the geometry and exclusions are symmetric;
- use deterministic geometric tie-breaks, not sprinkler IDs, as the primary optimization tie-break.

For asymmetric geometry, do not impose artificial symmetry. Use global spacing, coverage redundancy and geometric balance instead.

### 4.5 Objective order

Use lexicographic scoring:

1. hard feasibility: coverage, Head-to-Head and no overspray;
2. minimum total head count;
3. minimum count of heads that require local exceptions or unusual sectors;
4. balanced distribution and symmetry where geometrically justified;
5. reduced redundant overlap and unnecessary clustering;
6. minimum displacement from a valid seed, as a stability tie-break.

The algorithm is bounded greedy/local search with deterministic multi-start candidates. It must not claim a mathematically proven global minimum.

## 5. Equipment-family boundary

A 3504-PC may replace circular R-VAN heads only as a geometric planning alternative. 3504-PC flow, nozzle pressure, hydraulic compatibility and precipitation uniformity are not currently calculated. The result must continue to state that hydraulic feasibility is not evaluated.

Do not remove or convert directional LCS/RCS/SST strip heads unless a full-pattern replacement is explicitly modelled and independently validated. Preserve the existing strip-pattern rules otherwise.

## 6. Validation and stopping rules

- Use the existing 0.5 m global target map for search compatibility.
- Revalidate the accepted final candidate with a denser 0.25 m sample for supported project sizes, plus explicit outer-boundary and exclusion-boundary samples. If the denser check exceeds a configured cap, report the validation scope and do not imply it ran.
- Retain the 30,000-point cap for the 0.5 m search map unless profiling justifies a documented adjustment.
- Bound candidate positions, move iterations, multi-start seeds and total evaluated variants. Report which cap stopped the search.
- Preserve the best fully valid candidate found so far. Never fall back to a less valid, lower-count candidate.
- The optimizer must be deterministic for identical input geometry and options.

## 7. Required regression matrix

### Symmetric rectangles
- 16×16 m: preserve the owner's described balanced side-midpoint + center pattern; whether the four corner heads are additional or included in the five-head count is a pending acceptance detail.
- 17×17 m: equivalent side counts and reflection symmetry; no one-sided rotor deletion.
- 20×20 m: equivalent side counts and reflection symmetry; no one-sided rotor deletion.
- 8×8, 10×10 and 16×16/17×17/20×20 with exact coordinates and sector assertions.

### Complex geometry
- 38×16 m rectangle.
- 28×14 m L-shape with 16×12 m top-right recess.
- 28×4 m L-shape with 16×2 m top-right recess.
- Rectangular lawns with pool, building, paved and drip exclusions.
- Multi-rectangle layouts where a head can cover targets on both sides of a decomposition seam.
- Cases where two or more R-VAN circular heads can be replaced by a single 3504-PC at a new position.
- Cases where a proposed replacement is rejected because it fails Head-to-Head, coverage or overspray.

### Safety/regressions
- X=0, Y=0 and X=0/Y=0 exclusions.
- R-VAN directional strip preservation.
- 30,000-target search cap and all new search caps.
- Deterministic identical output for identical input.
- Zone count, pipe-network references and BOM quantities match the final head set.

## 8. Acceptance criteria

The redesign is accepted only when:
- 16×16, 17×17 and 20×20 square cases are geometrically balanced and reproducible;
- no equivalent side is left with a different count due only to ID ordering;
- complex lawns no longer retain artificial per-rectangle seams when a globally valid lower-count arrangement exists;
- relocation/replacement tests prove that the optimizer can change coordinates, not just delete heads;
- replacement of circular R-VAN groups by 3504-PC is possible when valid and rejected when any hard constraint fails;
- all existing geometry, PDF, zone and BOM regressions remain green.

## 9. Non-goals

This is still sampled geometric planning, not a hydraulic design. It does not establish actual throw under site pressure, pipe-loss feasibility, zone flow compatibility, DU/CU or field performance.

No Sanity content, D1 data/schema, Cloudflare settings/secrets or Production configuration may be changed as part of this work.


## Implementation status — 2026-11-26

Implemented on PR #551 / branch `develop` (not merged to `main`):

1. **16×16 m reference candidate**
   - Exactly five Rain Bird 3504-PC rotors.
   - Four side-midpoint rotors use inward-facing 180° sectors.
   - Centre rotor uses a 360° sector.
   - No corner rotors.
   - Candidate is accepted only after the current sampled coverage map, Head-to-Head and overspray checks pass, followed by the 0.25 m dense check when within the point cap.

2. **Symmetric rectangles**
   - Detects axis-aligned rectangle symmetry.
   - Rotor removal is evaluated as a complete symmetry orbit.
   - Single-head sector edits are disabled for symmetric rectangles so the later sector pass cannot reintroduce an asymmetric layout.
   - Regression tests cover 17×17 m and 20×20 m, including equal side counts and reflection symmetry.

3. **Circular R-VAN replacement**
   - Bounded deterministic search over groups of 3–4 nearby circular R-VAN heads, with a 10 m neighbourhood bound.
   - Generates new 3504-PC candidate positions around the group centre and tests supported radius/sector variants.
   - Search cap: 160 variants.
   - Mixed layouts containing directional strip heads skip this circular replacement pass; strip heads are preserved and are never treated as circular rotors.

4. **Asymmetric relocation**
   - Bounded search can move an existing 3504-PC rotor to a new in-geometry candidate position, then remove another rotor only if the complete resulting layout remains covered and Head-to-Head valid.
   - Existing arc, direction and radius are retained during a relocation.
   - Relocation is disabled for detected symmetric rectangles; search cap: 120 candidate variants.
   - Regression test verifies a move that enables removal of a seam-bridging head.

5. **Final validation and fallback**
   - Runs a 0.25 m target mesh when no more than 30,000 points are required.
   - If a changed candidate fails the dense check and the original baseline was valid, the optimizer rejects that candidate and restores the original baseline.
   - If the dense mesh exceeds the cap, diagnostics explicitly report `skipped_target_limit`; this is not represented as a passed dense check.

6. **Bridge diagnostics**
   - Reports the selected seed, replaced R-VAN groups, relocated heads, variant counts/cap states, and dense-validation result.

### Verified implementation snapshot

- PR #551 head: `f4e307b87f5070278554b1cce27cd438352538fb`.
- 575/575 repository tests passed.
- Website / Pages Functions and Sanity Studio type-checks and builds passed.
- Lint, migration syntax, read-only dry-run and D1 validation passed.
- Preview smoke verified 275 active published irrigation equipment products in BG, RU and EN.
- Production remains unchanged.

### Remaining v2 work

- Relocate symmetric groups as a joint operation rather than disabling individual relocation on symmetric rectangles.
- Expand candidate generation and multi-start search for complex polygons and multiple exclusions.
- Improve the search objective for overlap reduction and balanced spacing without sacrificing hard coverage, Head-to-Head or overspray constraints.
- Keep all search caps deterministic and expose when a cap prevents further exploration.

The implementation is bounded heuristic search. It does not prove a mathematical global minimum or continuous coverage, and it does not perform hydraulic design.
