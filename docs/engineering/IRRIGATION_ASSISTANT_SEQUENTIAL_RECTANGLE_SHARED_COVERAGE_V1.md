# Irrigation assistant — sequential rectangle planning with shared coverage

**Status:** owner-requested redesign, 2026-11-26  
**Development branch:** `develop`  
**Production:** `main` unchanged; no Production deployment is authorized.  
**Baseline:** the pre-v2 deterministic global head-minimization implementation is restored. The rejected global relocation / R-VAN group-replacement optimizer is not used.

## 1. Owner's design principle

Process the decomposed lawn rectangles from largest area to smallest, but never treat a rectangle as an independent lawn. Every already-installed sprinkler remains active in the shared lawn model. Its actual sector and throw determine which samples in the next rectangle are already irrigated.

The next rectangle may receive new heads only for the remaining uncovered samples. After placement, the new 3504-PC sectors are opened as far as the original complete lawn geometry permits. The following rectangle sees those expanded sectors.

## 2. Sequential placement

1. Decompose the supported orthogonal lawn and exclusions into non-overlapping rectangles.
2. Sort rectangles by descending area, retaining the existing deterministic tie-breaks.
3. Before placing heads in a rectangle, sample it and calculate coverage from every head already placed in earlier rectangles.
4. If previous heads cover all rectangle samples, add no duplicate heads for that rectangle.
5. Otherwise, try the existing 3504-PC rectangle solver first, passing all previously placed heads as `initialSprinklers`. If the rotor solver cannot produce a complete valid layout, retain the existing R-VAN fallback and pass all previously placed heads (including supported directional strip patterns) to its existing shared-coverage interface.
6. Maximize each new 3504-PC sector against the original full lawn boundary and exclusions, not the artificial rectangle boundary. Search larger arcs in one-degree increments and nearby sector directions; accept a candidate only when all previously uncovered global samples remain covered, the existing Head-to-Head relationships remain valid, and the complete sector stays inside the original irrigated geometry.
7. Add the resulting heads to the shared set before processing the next rectangle.

Directional LCS/RCS/SST strip patterns remain directional and are not converted into circular rotors. A strip rectangle is skipped only when previously placed heads already cover all of its sampled points. R-VAN performance points are only used for manufacturer dataset-supported arcs; the algorithm does not invent hydraulic performance values for arbitrary nozzle angles.

## 3. Final whole-layout pass

After all rectangles have been processed:

- Revisit every 3504-PC rotor against the complete set of installed heads and the original lawn geometry.
- Open its sector further if a larger angle remains inside the lawn and exclusions.
- Run the restored pre-v2 global minimizer to remove a head only if the remaining layout still passes global sampled coverage, existing mutual Head-to-Head checks and overspray checks.
- Rebuild zones and pipe/BOM outputs from the final sprinkler set, not from intermediate rectangle layouts.

The objective is not to preserve rectangle seams. The objective is one coherent sprinkler layout for the complete lawn.

## 4. Accepted 16×16 m reference candidate

The rectangle solver tests the owner's preferred five-head pattern:

- four rotors at the side midpoints, each with an inward-facing 180° sector;
- one 360° rotor at the rectangle centre;
- no corner rotors.

For a 16×16 m square, the candidate uses the 8 m planning radius. Each side-midpoint rotor is 8 m from the centre rotor. The candidate is selected only if sampled coverage and mutual Head-to-Head checks pass.

## 5. Full-circle rotor spacing

A newly expanded 3504-PC rotor may be opened to exactly 360° only if it is at least 6 m from every other 3504-PC rotor. The 16×16 m five-head candidate passes this check (8 m centre-to-side-midpoint spacing).

For backward compatibility, pre-existing corner-first/shared-cell grid candidates are not discarded solely because their legacy 360° centre head has a neighbour closer than 6 m. Such cases are exposed through `layout.fullCircleRotorSpacing`; the 6 m gate is applied to newly opened 360° sectors and to the five-head reference candidate. This distinction is intentional and should be revisited only with explicit acceptance tests for smaller rectangles.

## 6. Required validation

- Global sampled coverage on the original lawn and all exclusions.
- Existing Head-to-Head semantics.
- Composite overspray against the original geometry.
- Six-metre clearance before a newly expanded 3504-PC rotor is set to 360°.
- Deterministic rectangle order and deterministic candidate evaluation.
- No duplicated heads where prior rectangles already cover the samples.
- Zones and pipe/BOM regenerated from final heads.
- Search/coverage limits reported rather than silently treated as success.

## 7. Regression cases

- 16×16 m: exactly five heads at four side midpoints plus centre; 8 m centre clearance; no corner heads.
- 17×17 m and 20×20 m: retain the restored shared-cell behaviour and symmetry regressions.
- 10×10 m, 20×10 m, 38×16 m and local-clearance radius stages: retain established v1 behaviour.
- L-shapes and orthogonal polygons with pools/exclusions: later rectangles report previous-head coverage and avoid duplicate placement.
- A rotor at a shared seam may rotate its sector and expand beyond its calculation rectangle only while its full sector remains inside the original lawn and global coverage / Head-to-Head remain valid.
- A shared-seam regression must demonstrate that a rotor can change its sector direction and widen beyond its original 180° sector. Arc search uses one-degree steps, so non-standard values remain valid when geometry determines them.
- A newly opened 360° rotor less than 6 m from another 3504-PC rotor must be rejected.
- Directional strip heads remain unchanged.
- X=0, Y=0 and (0,0) coordinates remain valid.

## 8. Symmetry-preserving minimization for symmetric rectangles

A square or rectangle with no exclusions has geometric reflection symmetry. For a symmetric initial 3504-PC layout, the global minimizer must preserve the same symmetry while removing redundant heads or changing sectors. It evaluates a complete symmetry orbit (mirrored/rotated heads) as one removal operation; the whole group is accepted only when global sampled coverage, mutual Head-to-Head, and composite overspray all continue to pass. Sector changes are accepted only when the resulting layout remains symmetric.

For a 20 × 20 m square, the solver must not independently remove a head from only one side and leave the opposite side or adjacent sides with a different pattern. The four sides must retain equal head counts and the complete position/sector set must be invariant under the square's reflections and quarter-turn rotations. If the starting layout is not symmetric, this additional constraint is not imposed; existing validation remains authoritative.

## 9. L-shaped polygon placement — corner-first progression

For an L-shaped polygon handled by the whole-polygon circular layout solver, seed useful heads at the actual polygon vertices first, including the reflex corner. Then inspect the still-uncovered samples and add edge heads in order of coverage gain, preferring candidates that mutually reach already placed heads. Add interior heads only for samples that remain uncovered after the perimeter pass. The final Head-to-Head repair and validation remain mandatory; a layout is not accepted merely because its sample coverage is complete.

This is a deterministic corner-first progression, not a global relocation or group-replacement optimizer. It does not change the separately approved 1 m / 2 m connected LCS/RCS/SST strip pattern or the rectangle decomposition used for those narrow arms.

## 10. Engineering limits

This is deterministic sampled geometric planning, not a continuous-coverage proof or hydraulic design. No water pressure, flow, nozzle precipitation, DU/CU, pipe sizing or hydraulic compatibility is inferred from geometry. Manufacturer-supported R-VAN performance points remain discrete.

## 9. Current implementation snapshot

Implementation is present on `develop` / PR #551; merge and Production release remain pending exact-head validation and owner acceptance. The v2 global optimizer was reverted to its pre-v2 baseline. The sequential shared-coverage flow, 3504-PC sector expansion, five-head 16×16 candidate, spacing diagnostics, and pre-R-VAN rotor-only reduction have been added.

### 9.1 Rotor reduction before R-VAN

After the 3504-PC sector-expansion pass and before R-VAN selection/placement, run a rotor-only reduction pass:

- Build the sampled target set from points already covered by at least one rotor. This preserves the existing rotor coverage footprint; it does not require rotors to cover residual lawn samples that are intended for R-VAN.
- A rotor whose center is within half of its own radius from another 3504-PC rotor is prioritized as a removal candidate. This is a candidate heuristic only, not a deletion rule.
- The optimizer may remove only non-vertex/non-corner rotors in this phase. True polygon vertices/corners remain protected.
- Every trial removal must preserve all baseline rotor-covered samples, mutual Head-to-Head checks, composite overspray and the existing full-circle clearance policy. Symmetry orbits remain atomic for symmetric layouts.
- This stage is removal-only. It must not consolidate same-position heads, change arc/direction/radius, or otherwise mutate sectors already optimized by the preceding whole-polygon sector pass.
- A simple rectangular region whose short side is exactly 1 m or 2 m and whose long side is strictly greater than its short side bypasses circular rotor/R-VAN placement and is handled directly by the approved directional LCS/RCS/SST strip pattern. A 1×1 m or 2×2 m square is not a strip. Narrow arms inside a larger polygon still use the normal whole-polygon rotor/R-VAN passes before residual strip placement.
- For an SST `both` direction, `stripLengthM` is the symmetric longitudinal reach from the head in each direction. Standalone strip footprints are bounded by their explicit strip rectangle; connected strip footprints are checked at full reach against the original lawn boundary and exclusions so they cannot spray into an adjacent non-strip area. LCS/RCS end heads retain their one-sided reach.
- Only a completed rotor-only pass replaces the rotor set. A skipped or failed pass leaves the original rotor set unchanged.
- R-VAN is then placed against the residual coverage from the reduced rotor set. The existing final whole-layout validation/minimization remains in place and still checks the combined rotor/R-VAN/strip system.

The reduction reports baseline/optimized rotor counts, removed IDs, proximity candidates and the rotor-only sampled coverage/Head-to-Head/overspray results. Proximity does not override any validation gate.

Exact verification status must be read from CI for the latest head SHA; earlier failing runs are not evidence of a successful build.


### 9.2 Orientation-aware decomposition of orthogonal L-shapes

The orthogonal rectangle decomposition now evaluates both sweep orientations (horizontal and vertical) and chooses the non-overlapping partition with the lower area-weighted elongation penalty:

`sum(rectangleArea × (1 − shortSide / longSide))`

This avoids allowing a decomposition direction to turn a compact square arm into multiple artificial narrow strips. Ties retain the historical horizontal sweep, preserving deterministic behavior for ordinary rectangles and geometries where both orientations are equivalent.

Regression case: an 18 × 2 m L-shaped lawn with a 16 × 1 m top-right exclusion must retain the 2 × 2 m corner as a compact non-strip rectangle and identify only the 16 × 1 m horizontal arm as a directional strip. The 2 × 2 m square must not be reinterpreted as a 2 m-wide strip or covered by two artificial 1 m strip fragments. If the whole-polygon circular pass cannot cover that square, it remains explicitly uncovered and the layout must remain incomplete rather than report a false generated result.

The decomposition still validates exact net area and rejects overlapping rectangles. The new orientation choice does not change the supported geometry contract, sprinkler throw data, hydraulic assumptions, or Production state.
