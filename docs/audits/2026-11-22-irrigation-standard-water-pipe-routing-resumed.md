# Irrigation Assistant — resumed standard routing implementation

Date: 2026-11-22  
Branch: `feat/irrigation-standard-water-pipe-routing-resumed`  
Base: `main` at `b48d6c5b354c500250957355b4eb90751be072d0`  
Latest verified source checkpoint before this audit refresh: `5d69fca651c7b71049177aebfae30d30fe0d1668`

## Scope implemented

- Replaced customer water-source, pressure and flow questions with geometry-only intake plus optional site notes.
- Dimensions are treated as approximate; the assistant no longer asks the customer to confirm that measurements were taken on site.
- Applied fixed Florial assumptions internally: 1-inch tap, 4 bar inlet pressure, incoming Ø25 mm pipe, top-right connection point.
- All displayed pipe sections now use nominal Ø25 mm; the previous Ø32 mm main-line assumption was removed.
- The internal zone rule is a maximum of six sprinkler heads per zone, regardless of arc. 90°, 180°, 270° and 360° heads may be mixed in one zone.
- Each zone is represented by its own pipe route starting at the top-right source and following the perimeter in one direction. Sprinkler heads are connected sequentially along that route; individual take-offs are retained only for interior heads.
- For the 25 × 5 m and 26 × 5 m reference rectangles, the layout produces 12 perimeter heads, two zones of six, two source-fed pipe routes and Ø25 mm throughout.
- The layout solver remains perimeter-first. Rectangles can receive an optional centreline parallel to the long side only if the perimeter pass leaves sampled points uncovered. L-shapes retain interior candidates for uncovered areas.
- Narrow-strip intake exposes exact manufacturer pattern options where the table provides an exact width match (for example, 1.5 m at the selected manufacturer operating point). It does not generate a strip placement plan yet; unsupported widths fail closed.
- The plan view includes nominal manufacturer spray-radius rings and the sequential zone pipe routes.
- Removed total-flow summation and flow-based candidate tie-breaking. No hydraulic flow or pressure-loss calculation is performed.

## Head-to-head correction

The previous validator selected the nearest sprinkler by Euclidean distance. On a narrow lawn, a sprinkler on the opposite side could therefore hide a 10 m gap to the next sprinkler along the same perimeter edge.

The updated solver:
- records each perimeter head's position along the polygon perimeter;
- checks both adjacent perimeter heads in perimeter order, including cyclic wrap-around;
- requires each adjacent gap to be no greater than the smaller of the two nominal throw radii;
- verifies mutual sector reach between those adjacent heads;
- iteratively adds an available boundary candidate inside an excessive gap until the perimeter spacing is repaired or no valid repair remains.

A regression test now reproduces the false-positive case: a 5 m opposite-side neighbour no longer makes a 10 m same-edge gap pass.

## Engineering assumptions and boundaries

- R-VAN model envelope used by the bridge:
  - 2.4–4.8 m short side: R-VAN14
  - above 4.8–10.4 m: R-VAN18
  - above 10.4–15 m: R-VAN24
  - outside this envelope: engineer review
- The sprinkler solver uses exact Rain Bird operating points; it does not interpolate manufacturer data.
- The drawing shows nominal tabulated radius. The field adjustment range of each R-VAN is not numerically optimized by this increment.
- Sampled coverage is not a continuous mathematical proof.
- Obstacles, overspray, body/nozzle compatibility, hydraulic feasibility, actual pressure at each nozzle, pump sizing and actual flow are not calculated.
- The pipe route is a schematic installation route, not a hydraulic loss calculation.
- For an L-shape whose top-right bounding-box corner is cut out, the route starts at the fixed top-right bounding-box point and joins the nearest boundary vertex. This still needs visual owner review.

## Files changed

- `src/lib/irrigation/irrigationIntake.mjs`
- `src/lib/irrigation/irrigationLayoutBridge.mjs`
- `src/lib/irrigation/irrigationLayoutBridge.d.mts`
- `src/lib/irrigation/irrigationProjectStandards.mjs`
- `src/lib/irrigation/lawnSprinklerLayout.mjs`
- `src/lib/irrigation/lawnSprinklerLayout.d.mts`
- `src/pages/IrrigationAssistantPage.tsx`
- `tests/irrigation-intake.test.mjs`
- `tests/irrigation-layout-bridge.test.mjs`
- `tests/irrigation-lawn-sprinkler-layout.test.mjs`
- `tests/irrigation-project-standards.test.mjs`
- `tests/irrigation-assistant-ui-standard.test.mjs`

## Verification

Targeted executable checks were run against the exact source files at the current branch checkpoint (this is not the repository's full `node --test` suite):

- **25 × 5 m:** 12 heads; two zones of six; two routes from the top-right source; Ø25 mm; 100% sampled coverage; head-to-head passed; maximum perimeter gap 5.0 m with 5.2 m nominal radius.
- **26 × 5 m:** 12 heads; two zones of six; two routes from the top-right source; Ø25 mm; 100% sampled coverage; head-to-head passed; maximum perimeter gap 5.2 m with 5.2 m nominal radius.
- **20 × 10 m:** 100% sampled coverage and head-to-head passed.
- **20 × 15 m:** 100% sampled coverage and head-to-head passed.
- **12 × 8 m rectangle and orthogonal L-shape variants:** 100% sampled coverage and head-to-head passed.
- The synthetic false-positive test confirms that a 10 m perimeter gap fails even when an opposite-side head is only 5 m away.

Not yet verified:

- Full repository Node test suite and application/Studio build.
- New Cloudflare Pages Preview deployment for the latest branch head.
- Visual browser QA. Browser access remains unused pending the owner's permission.

PR #473 remains open and contains overlapping irrigation work. No duplicate PR was created. Shared `CHANGELOG.md`, Technical Passport and OPEN_QUESTIONS updates remain deferred until the overlapping PR/documentation work is coordinated.

No changes to `main`, Production, Sanity, D1, Cloudflare settings or secrets were made. No merge was performed.

## Owner review needed

1. Review the latest Preview on 25 × 5 m and 26 × 5 m, especially the two separate routes from the top-right source.
2. Review L-shaped geometry, especially a top-right cut-out and the route from the assumed source point.
3. Review narrow-strip messaging and exact LCS/RCS/SST table options. Automatic strip-head placement remains unimplemented.
