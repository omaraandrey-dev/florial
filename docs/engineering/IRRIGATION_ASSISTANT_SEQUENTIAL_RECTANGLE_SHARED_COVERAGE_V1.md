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

## 8. Engineering limits

This is deterministic sampled geometric planning, not a continuous-coverage proof or hydraulic design. No water pressure, flow, nozzle precipitation, DU/CU, pipe sizing or hydraulic compatibility is inferred from geometry. Manufacturer-supported R-VAN performance points remain discrete.

## 9. Current implementation snapshot

Implementation is in progress on `develop` / PR #551. The v2 global optimizer was reverted to its pre-v2 baseline. The sequential shared-coverage flow, 3504-PC sector expansion, five-head 16×16 candidate, and spacing diagnostics have been added. Exact verification status must be read from CI for the latest head SHA; earlier failing runs are not evidence of a successful build.
