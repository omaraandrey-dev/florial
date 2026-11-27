# Whole-polygon sequential sprinkler layout — owner-approved specification

**Status:** owner-approved on 2026-11-27; implementation on `develop`; not released to Production.  
**Supersedes:** rectangle-first / per-rectangle family assignment for the current irrigation-assistant layout flow.  
**Scope:** geometric sprinkler placement and sampled validation only.

## 1. Owner-approved family order

The complete confirmed lawn polygon is processed in this exact order:

1. Rain Bird 3504-PC rotors over the whole polygon.
2. R-VAN heads only for the residual areas not adequately covered by the rotor pass.
3. Directional strip patterns only for remaining strips whose width is exactly 1 m or 2 m.
4. One final global validation and rotor redundancy-removal pass.

The next family receives the residual uncovered map from the previous pass. It must not restart its search over the original lawn as if previous heads did not exist.

Rotors and R-VAN heads may be used simultaneously on the same continuous territory. The owner confirms that their practical precipitation intensity and hydraulic compatibility are sufficiently aligned for this combined geometric layout. A cross-family rotor↔R-VAN Head-to-Head link is a full, valid Head-to-Head link; do not require a separate same-family link.

## 2. Geometry rules

- Use one validated whole-polygon calculation region, including all real convex and concave vertices.
- Do not decompose the lawn into rectangles for the rotor or R-VAN placement passes.
- Preserve rectangular non-irrigated exclusions as exclusion boundaries during candidate validation and target sampling.
- The current bridge supports one confirmed orthogonal lawn region. Multiple independent regions and unsupported non-orthogonal geometry remain outside this task.
- Rectangle decomposition may be used only to discover directional 1 m / 2 m residual strip components after the rotor and R-VAN passes. It is not the main placement geometry.
- Adjacent strip rectangles with the same cross-section and orientation are merged. Strip patterns are then generated only for contiguous residual runs that still contain uncovered samples.

## 3. Rotor pass — Rain Bird 3504-PC

- Rotors are always the first family.
- Use corner-first placement, then perimeter positions, then interior positions.
- Use the same candidate progression as the R-VAN polygon engine.
- Each rotor has its own continuous geometric planning radius in the approved range **6–9 m**, including fractional values.
- Never force a rotor below 6 m. If the local safe radius is less than 6 m, leave that residual area for R-VAN or a supported strip pattern.
- Check the complete sector footprint against the original polygon and exclusions.
- Rotor geometric radius is a Florial planning parameter, not a claim that every 3504-PC nozzle/pressure combination has that manufacturer throw.
- The polygon rotor adapter reuses the shared corner-first/perimeter/interior candidate positions and sectors; it does not copy R-VAN flow, pressure, or precipitation values into rotor records.
- Manufacturer hydraulic data must not be invented or interpolated.

For a simple rectangle without exclusions, the rectangle rotor solver may be used directly, but it still represents one whole-polygon rotor pass and must keep the same corner-first priority.

## 4. R-VAN residual pass

- Run only after the complete rotor pass.
- Pass all accepted rotor heads as initial coverage.
- Remove samples already covered by rotors from the R-VAN residual target map.
- Follow the same corner → perimeter → interior progression.
- Check 90° → 180° → 270° → 360° sector candidates in the approved priority order where candidate geometry and the selected manufacturer point support them.
- Use exact manufacturer performance points only. Do not interpolate radius, flow, pressure, or precipitation.
- Use local corner clearance for nozzle selection. Narrow arms must not be assigned a model solely because the overall polygon bounding box is large.
- The final Head-to-Head check includes all rotor and R-VAN heads together.

## 5. Directional strip pass

- Run last, after both rotor and R-VAN passes.
- Only exact 1 m and 2 m strip widths are supported.
- Use the approved fixed strip patterns and intervals; small overlap is acceptable, dry gaps are not.
- Determine residual longitudinal runs from the combined rotor + R-VAN coverage map.
- If a residual run connects to already covered territory at one end, use the connected-strip pattern at that end; otherwise use the normal two-ended strip pattern.
- Validate each proposed strip pattern against the original polygon before accepting it. Reject a pattern that would overspray and report the remaining uncovered samples rather than keeping an invalid head.
- Do not classify a square area (for example 2 m × 2 m) as a strip merely because its short side is 2 m.
- Strip patterns are validated against the original polygon and exclusions.

## 6. Global validation

After all three passes, evaluate the combined head set:

- sampled coverage of the whole irrigated polygon;
- uncovered target samples;
- overspray outside the outer boundary or into exclusions;
- mutual Head-to-Head for all circular heads, including cross-family rotor↔R-VAN pairs. A head passes when it has at least one mutually reachable neighbour; the immediate perimeter predecessor/successor spacing remains a separate distribution diagnostic and must not invalidate an otherwise valid cross-family Head-to-Head link;
- 3504-PC full-circle clearance diagnostic;
- strip interval/pattern coverage;
- redundant rotor heads and possible rotor-sector adjustments.

A location covered by both a rotor and R-VAN is not an error by itself. Cross-family overlap may be the exact Head-to-Head connection required by the layout.

True polygon-vertex rotor heads are protected during global redundancy removal; they are the mandatory first placement layer. Perimeter and interior rotor heads may be removed only when the full combined checks remain valid.

Only after the global checks pass may redundant non-corner rotor heads be removed. Preserve symmetry and even distribution where the polygon shape permits them; do not minimize head count at the cost of materially worse coverage or Head-to-Head.

If a complete layout cannot be found, return an explicit incomplete result with uncovered samples and diagnostics. Never present an incomplete sampled result as a complete project.

## 7. Hydraulic boundary

The owner confirms that Rain Bird 3504-PC rotors and R-VAN heads can be combined on the same territory and that their practical precipitation intensity and compatibility are acceptable for this planner. Mixed-family results expose `hydraulicFeasibility: owner_confirmed_compatible`, `hydraulicCompatibilityBasis: owner_confirmed`, and `precipitationIntensityCompatibility: owner_confirmed_similar`; site-specific pressure/flow losses and numerical precipitation-uniformity certification remain outside the geometry solver.

This confirmation does not turn the geometric solver into a hydraulic calculator. Site-specific pipe sizing, pressure losses, flow balancing, valve grouping, and precipitation-uniformity certification remain outside this geometric layout task unless separately authorized.

## 8. Sampling and proof boundary

- Coverage and overspray checks are sampled geometric checks.
- A sampled 100% result is not a continuous mathematical proof.
- The sampling step and the footprint sampling resolution must be retained in result metadata.
- Any target-count limit that skips global validation must produce an incomplete / not-verified result, not a success result.

## 9. Implementation map

- `src/lib/irrigation/irrigationLayoutBridge.mjs`: whole-polygon family sequence, residual strip extraction, combined final checks.
- `src/lib/irrigation/rainBird3504Layout.mjs`: rectangular rotor solver and whole-polygon rotor adapter with individual 6–9 m safe radii.
- `src/lib/irrigation/lawnSprinklerLayout.mjs`: corner-first R-VAN placement, exclusions, prior-head coverage and combined Head-to-Head evaluation.
- `src/lib/irrigation/globalSprinklerOptimization.mjs`: global sampled coverage, mixed-family Head-to-Head and rotor redundancy optimization.
- `src/lib/irrigation/orthogonalRectangleDecomposition.mjs`: strip-component discovery only; not used to assign the main rotor/R-VAN layout to rectangles.

## 10. Release and documentation boundary

- Development work stays on `develop`.
- Do not merge PR #551 or deploy Production without separate owner approval.
- Do not modify Production services, secrets, Sanity data, or unrelated global UI.
- `CHANGELOG.md`, the technical passport, and open-questions ledger are currently frozen by the separate PR #409 workflow; record this implementation in this dedicated engineering specification and update the frozen ledgers only after that conflict is resolved.


## 11. Implementation record — 2026-11-27

- Development branch: `develop`; implementation commit: `1dc4b23ef5fd5a4c2cda4db190412cdbb49eb94d`.
- The bridge now completes the whole-polygon 3504-PC rotor sector-adjustment pass before invoking the R-VAN solver. The R-VAN solver receives the final adjusted rotor set as `initialSprinklers` and therefore targets the remaining uncovered samples only.
- Sector adjustment is applied to supported rectangles, L-shaped polygons and polygons with rectangular exclusions; it is no longer restricted to plain rectangles.
- Verification at the time of this record: source read-back and branch-head comparison passed. Automated test/CI status is **not confirmed**; the GitHub commit currently exposes no status checks. No Production, Sanity, D1 or Cloudflare configuration changes were made.
