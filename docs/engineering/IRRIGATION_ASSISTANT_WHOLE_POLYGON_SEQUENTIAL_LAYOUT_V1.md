# Whole-polygon sequential sprinkler layout — owner-approved specification

**Status:** implemented, merged and deployed to Production on 2026-11-27 (PR #551).  
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
- Complete the whole-polygon rotor sector-expansion pass before reducing the rotor set or invoking R-VAN.
- **Rotor-only redundancy reduction then runs before R-VAN.** Its target set contains only whole-polygon samples already covered by at least one 3504-PC rotor. This preserves the existing rotor coverage footprint; the reduction is not allowed to hand a rotor gap to the later R-VAN pass.
- A rotor is prioritized for a removal trial when another rotor centre is at a distance no greater than half of the candidate rotor's own planning radius. This is only a candidate-ordering heuristic, never an automatic deletion rule.
- True polygon-vertex/corner rotors are protected during this pre-R-VAN reduction. Only non-vertex/non-corner rotors may be trial-removed in this phase.
- Every trial removal must preserve all baseline rotor-covered samples, mutual rotor Head-to-Head, composite overspray, and the applicable full-circle clearance checks. Symmetry orbits are evaluated atomically for symmetric layouts.
- This stage is removal-only: it does not change sector arcs/directions/radii, relocate heads, or consolidate heads. The sector-expansion pass has already completed.
- If the reduction is skipped, fails its baseline checks, or fails final validation, the original rotor set is retained. Only a completed reduction replaces the rotor set.
- The result exposes `layout.rotorReduction` diagnostics: baseline/optimized head and rotor counts, removed IDs, proximity candidates and distances, sampled rotor-only coverage, Head-to-Head outcome, and overspray outcome.
- Rotor geometric radius is a Florial planning parameter, not a claim that every 3504-PC nozzle/pressure combination has that manufacturer throw.
- The polygon rotor adapter reuses the shared corner-first/perimeter/interior candidate positions and sectors; it does not copy R-VAN flow, pressure, or precipitation values into rotor records.
- Manufacturer hydraulic data must not be invented or interpolated.

For a simple rectangle without exclusions, the rectangle rotor solver may be used directly, but it still represents one whole-polygon rotor pass and must keep the same corner-first priority.

## 4. R-VAN residual pass

- Run only after the complete rotor pass.
- Pass the final accepted rotor set (after the rotor-only reduction) as initial coverage.
- Remove samples already covered by the reduced rotor set from the R-VAN residual target map.
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
- The strip-component decomposition evaluates both horizontal and vertical sweep orientations and prefers the non-overlapping partition with the lower area-weighted elongation penalty, `sum(area × (1 − shortSide / longSide))`. Ties retain the historical horizontal sweep. This prevents a compact square arm from being split into artificial narrow-strip fragments solely because of decomposition direction.
- Regression: an 18 × 2 m L-shaped lawn with a 16 × 1 m top-right exclusion must preserve the 2 × 2 m corner as a non-strip area and recognize only the 16 × 1 m horizontal arm as a strip. If the whole-polygon circular passes cannot cover the square, it remains uncovered and the layout stays incomplete; it must not be falsely covered by two artificial 1 m strip fragments.
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
- `src/lib/irrigation/orthogonalRectangleDecomposition.mjs`: strip-component discovery only; evaluates both sweep orientations, preserves compact square regions and validates exact net area/no rectangle overlap. It is not used to assign the main rotor/R-VAN layout to rectangles.

## 10. Release and documentation boundary

- PR [#551](https://github.com/omaraandrey-dev/florial/pull/551) merged from `develop` into `main` on 2026-11-27 at 06:32:19 UTC.
- Merge commit: `97d4188abeeaaa7842a9924e1e30eccc20e3202e`.
- Validated implementation/code-test head: `4cbc21173f5dc4dff3195f7c4e2d4a9b10dcba96`. Final pre-merge branch/documentation head: `79bb1af61583359a8bd8bba5aa4f25a715caebbc`.
- Cloudflare Pages Production deployment: `09ab6446-e488-42a0-967f-0f7e0f05e44b`; URL `https://09ab6446.florial.pages.dev`; exact source branch `main`, exact source commit `97d4188abeeaaa7842a9924e1e30eccc20e3202e`; build and deploy stages both succeeded. Production aliases include `https://florial-bg.com` and `https://www.florial-bg.com`.
- The `develop` branch was fast-forward synchronized to the merge commit before this documentation closeout.

### Exact verification evidence

- **Blog and Studio validation:** run `45952279577` on final code/test head `79bb1af` passed **581/581 Node tests**, including the rotor-only reduction and compact L-shape square/strip regressions; app/Pages type-check, lint, website build, Studio type-check and Studio build passed.
- **Full SSR/SEO Preview regression:** run `45952279566` passed against Preview `https://602adc0a.florial.pages.dev`.
- **Equipment product SSR:** run `45952279612` passed for all 275 active equipment product routes in BG/RU/EN, with missing/unpublished products returning 404 noindex.
- **D1 migration validation:** run `45952279475` passed as read-only validation; no migration was applied.
- **Other Preview/Production smoke workflows:** blog index `45952279535`, blog article `45952279523`, services directory `45952279575`, service details `45952279537` all passed.
- **Post-merge exact-SHA checks:** all 13 check runs attached to merge commit `97d4188` completed successfully, including Cloudflare Pages, full SSR/SEO regression, D1 validation, Blog/Studio validation, equipment/category/product checks, service/blog smoke and raw HTTP smoke.
- **Post-merge full Production SSR/SEO regression:** run `45952514023` passed against `https://florial-bg.com`. It verified first-response HTML in BG/RU/EN for homepage, services, blog, plants, irrigation equipment, contacts and About; verified 275 active equipment product pages per locale, 180 plant product routes plus 51 plant-category routes across locales, 162 localized equipment category routes, 26 service links, 19 blog articles, robots.txt, 1,384 canonical sitemap URLs and noindex behavior for private routes.
- **Post-merge equipment raw HTTP smoke:** run `45952514108` passed. Main-merge Cloudflare Pages check `140351567008` passed.
- These checks establish code, CI, deployment and raw HTTP outcomes. They do not establish owner visual/functional acceptance of every sprinkler drawing or real-world field performance.

### Production and data boundary

- The application code was deployed to Cloudflare Pages Production by the GitHub merge push.
- No Sanity content/schema write, D1 schema/data write, Cloudflare setting/secret/binding change, test order or test email was performed as part of this irrigation task.
- No Header, main menu, Footer, global routing or unrelated site feature was changed.
- `CHANGELOG.md`, `docs/TECHNICAL_PASSPORT.md`, `docs/AI/CURRENT_STATE.md` and `docs/AI/OPEN_QUESTIONS.md` remain untouched because they are frozen by the separate PR #409 workflow. This dedicated engineering document and the unique AI entry instructions carry the task closeout until that conflict is resolved.
- **Workstream status:** complete and paused. Further irrigation solver changes require a new explicit owner task or a reported issue.


## 11. Implementation record — 2026-11-27

- Development branch: `develop`; implementation commit: `1dc4b23ef5fd5a4c2cda4db190412cdbb49eb94d`.
- The bridge now completes the whole-polygon 3504-PC rotor sector-adjustment pass before invoking the R-VAN solver. The R-VAN solver receives the final adjusted rotor set as `initialSprinklers` and therefore targets the remaining uncovered samples only.
- Sector adjustment is applied to supported rectangles, L-shaped polygons and polygons with rectangular exclusions; it is no longer restricted to plain rectangles.
- Verification at the time of this record: source read-back and branch-head comparison passed. Automated test/CI status is **not confirmed**; the GitHub commit currently exposes no status checks. No Production, Sanity, D1 or Cloudflare configuration changes were made.


## 12. Final implementation and verification handoff — 2026-11-27

### 12.1 Released algorithm

The released calculation sequence is:

1. Validate one complete orthogonal lawn polygon with its rectangular exclusions. Preserve real convex and concave vertices.
2. Place Rain Bird 3504-PC rotors across the complete polygon using corner → perimeter → interior candidate progression and individual continuous geometric planning radii from 6 m to 9 m.
3. Expand rotor sectors against the complete polygon before R-VAN placement.
4. Run a rotor-only redundancy-reduction pass before R-VAN. The reduction target map includes only samples already covered by at least one rotor. Proximity within half of a candidate rotor's own radius only prioritizes a removal trial; it never deletes a head by itself. True polygon-corner rotors are protected. A removal is accepted only if all baseline rotor-covered samples, mutual rotor Head-to-Head, composite overspray, applicable full-circle clearance and symmetry constraints remain valid. The pass is removal-only and exposes `layout.rotorReduction` diagnostics.
5. Give the reduced rotor set to the R-VAN solver as existing coverage; R-VAN handles only residual uncovered samples and uses exact supported manufacturer performance points.
6. Discover residual directional strips only after rotor and R-VAN coverage. Generate exact 1 m / 2 m LCS/RCS/SST patterns for valid residual runs. Evaluate horizontal and vertical orthogonal decompositions and choose the lower area-weighted elongation penalty; preserve compact 2 × 2 m areas as non-strip geometry.
7. Run final global sampled coverage, overspray, mixed-family mutual Head-to-Head, full-circle clearance and layout/BOM consistency checks. If mandatory checks cannot be verified or pass, retain an explicit incomplete/not-verified result rather than claiming success.

### 12.2 Important geometry and optimization safeguards

- Rotor and R-VAN heads may coexist on the same territory. Cross-family rotor↔R-VAN mutual Head-to-Head is valid under the owner's confirmed compatibility decision.
- No main-polygon rectangle-first decomposition is used for rotor or R-VAN placement. Rectangle decomposition is limited to residual strip discovery.
- The 18 × 2 m L-shape with a 16 × 1 m top-right exclusion must preserve the compact 2 × 2 m corner as non-strip; if circular heads do not cover it, it remains uncovered and the layout remains incomplete.
- Symmetric rectangular layouts preserve reflection/rotation symmetry during grouped removal. Symmetry orbits are tested atomically.
- Newly expanded 360° rotors require at least 6 m clearance from other 3504-PC rotors; legacy corner-first/shared-cell layouts remain backward-compatible and expose actual spacing in `layout.fullCircleRotorSpacing`.
- The owner-approved 16 × 16 m five-head candidate is four inward-facing 180° side-midpoint rotors plus one 360° centre rotor, with 8 m centre-to-side spacing.
- Non-strip L-shapes use whole-polygon corner-first placement, including the reflex corner. If that attempt fails complete validation, the documented safe rectangular fallback is used and diagnostics remain visible.
- X=0, Y=0 and (0,0) are valid coordinates.
- Exact manufacturer data is retained; no unsupported pressure/flow/radius/precipitation interpolation is introduced.

### 12.3 Code and test files

- `src/lib/irrigation/irrigationLayoutBridge.mjs` — sequential whole-polygon family passes, rotor-sector completion, pre-R-VAN rotor reduction integration, residual strip extraction and final validation.
- `src/lib/irrigation/rainBird3504Layout.mjs` and `.d.mts` — 3504-PC polygon/rectangle layout, continuous safe radii, corner-first placement and full-circle spacing metadata.
- `src/lib/irrigation/lawnSprinklerLayout.mjs` — R-VAN corner-first placement, prior-head coverage, exclusion handling and mixed-family Head-to-Head.
- `src/lib/irrigation/globalSprinklerOptimization.mjs` — global sampled validation and safe rotor minimization logic.
- `src/lib/irrigation/orthogonalRectangleDecomposition.mjs` — orthogonal decomposition for residual strip discovery only, orientation scoring and compact-square protection.
- `src/lib/irrigation/irrigationLayoutBridge.d.mts` — public result/type declarations.
- Tests: `tests/irrigation-layout-bridge.test.mjs`, `tests/irrigation-lawn-sprinkler-layout.test.mjs`, `tests/irrigation-rain-bird-3504-layout.test.mjs`, and new `tests/globalSprinklerOptimization.test.mjs`.
- UI scope remained limited to irrigation-assistant rendering/diagnostic adjustments in `src/pages/IrrigationAssistantPage.tsx`; no global site shell, Header, menu or Footer change.

### 12.4 Documentation included in PR #551

- This document is the authoritative current algorithm and release handoff.
- `IRRIGATION_ASSISTANT_GLOBAL_HEAD_MINIMIZATION_V1.md` is retained as a historical specification for the earlier rectangle-first minimization approach; it is superseded for the current live flow by this whole-polygon specification.
- `IRRIGATION_ASSISTANT_SEQUENTIAL_RECTANGLE_SHARED_COVERAGE_V1.md` is retained as a historical/superseded design.
- `IRRIGATION_ASSISTANT_CORNER_FIRST_RECTANGLE_AND_L_SHAPE_CORRECTION_2026-11-26.md` records the symmetric rectangle and safe L-shape fallback correction.
- `IRRIGATION_ASSISTANT_GLOBAL_LAYOUT_REOPTIMIZATION_V2.md` remains historical/superseded; the rejected V2 optimizer is not the active solver.
- `AI_INSTRUCTIONS.md` and `docs/AI/START_HERE.md` identify the completed Production release and the paused workstream.
- The common changelog/passport/open-question files were deliberately not edited while PR #409 keeps their diff frozen.

### 12.5 Verification and release identifiers

- Implementation/code-test head: `4cbc21173f5dc4dff3195f7c4e2d4a9b10dcba96`.
- Final PR head before merge: `79bb1af61583359a8bd8bba5aa4f25a715caebbc`.
- PR #551 merge commit: `97d4188abeeaaa7842a9924e1e30eccc20e3202e`.
- Blog and Studio validation run `45952279577`: **581 passed, 0 failed**; app/Pages type-check, lint, website build, Studio type-check/build passed.
- Preview full SSR/SEO regression run `45952279566`: success; Preview `https://602adc0a.florial.pages.dev`.
- Equipment product SSR run `45952279612`: success; 275 active products checked in BG/RU/EN.
- D1 validation run `45952279475`: success, read-only, no migration applied.
- Main-merge exact-SHA checks: 13/13 success, including full regression run `45952514023`, Blog/Studio run `45952514274`, D1 validation `45952514059`, equipment product smoke `45952514108`, Cloudflare Pages check `140351567008` and service/blog/homepage smoke workflows.
- Production deployment `09ab6446-e488-42a0-967f-0f7e0f05e44b`: build success and deploy success from merge SHA `97d4188`.
- Production full SSR/SEO raw HTTP smoke run `45952514023`: passed in BG/RU/EN against `https://florial-bg.com`; equipment raw HTTP smoke run `45952514108`: passed.
- Production deployment and SSR checks do not replace manual review of irrigation drawings or field validation.

### 12.6 Known limits and remaining non-goals

- Coverage and overspray are sampled geometric checks, not a continuous mathematical proof.
- This is not a site-specific hydraulic design: source pressure/flow, pipe losses, valve grouping, hydraulic balancing, precipitation uniformity (DU/CU) and real-world performance are not calculated or certified.
- The solver does not invent manufacturer performance data or interpolate unsupported operating points.
- Multiple independent lawn regions and unsupported non-orthogonal geometry remain outside the documented supported geometry.
- Visual/functional acceptance of every calculated irrigation drawing by the owner is not recorded as complete by CI alone.

### 12.7 Closeout

PR #551 is merged and its exact merge commit is deployed to Cloudflare Pages Production. All exact-commit CI checks and the post-merge Production SSR/SEO raw HTTP regression passed. No Sanity writes, D1 schema/data changes, Cloudflare configuration/secret changes, Production orders or emails were performed as part of this irrigation implementation. The irrigation workstream is now **paused after completion** and resumes only on a new owner task or a reported defect.
