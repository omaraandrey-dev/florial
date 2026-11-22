# Irrigation Assistant — resumed standard routing implementation

Date: 2026-11-22  
Branch: `feat/irrigation-standard-water-pipe-routing-resumed`  
Base: `main` at `b48d6c5b354c500250957355b4eb90751be072d0`  
Preview commit: `267946a2d10fa7381c5152a3900106b386ff13fe`  
Preview URL: https://852f1865.florial.pages.dev/irrigation-assistant

## Scope implemented

- Replaced customer water-source, pressure and flow questions with geometry-only intake plus optional site notes.
- Dimensions are treated as approximate; the assistant no longer asks the customer to confirm that measurements were taken on site.
- Applied fixed Florial assumptions: 1-inch tap, 4 bar inlet pressure, incoming Ø25 mm pipe, top-right connection point.
- Added perimeter main route Ø32 mm and sprinkler branches / zone pipes Ø25 mm.
- Added line grouping limits: up to 6 part-circle sector heads per line and up to 4 full-circle 360° heads per line. Different arc classes are grouped separately.
- Made the layout solver perimeter-first. Rectangles can receive one optional centreline parallel to the long side only if the perimeter pass leaves sampled points uncovered. L-shapes retain interior candidates for uncovered areas.
- The bridge selects only Rain Bird R-VAN families. It does not substitute HE-VAN for narrow strips or unsupported geometries.
- Narrow-strip intake exposes exact manufacturer pattern options where the table provides an exact width match (for example, 1.5 m at the selected manufacturer operating point). It does not generate a strip placement plan yet; unsupported widths fail closed and require engineering review.
- The plan view includes nominal manufacturer spray-radius rings, the perimeter main, branches and zone grouping.
- Removed total-flow summation and flow-based candidate tie-breaking. No hydraulic flow or pressure-loss calculation is performed.

## Engineering assumptions and boundaries

- R-VAN model envelope used by the bridge:
  - 2.4–4.8 m short side: R-VAN14
  - above 4.8–10.4 m: R-VAN18
  - above 10.4–15 m: R-VAN24
  - outside this envelope: engineer review
- The sprinkler solver uses the exact Rain Bird operating point exposed by `RAIN_BIRD_RVAN_DATASET.source.recommendedOperatingPressureBar`; it does not interpolate manufacturer data.
- The inlet assumption of 4 bar is distinct from the manufacturer nozzle operating point used for nominal spray radii.
- The drawing shows nominal tabulated radius. The field adjustment range of each R-VAN is not numerically optimized by this increment.
- Sampled coverage is not a continuous mathematical proof. The head-to-head status is the result of the current geometric validator only.
- Obstacles, overspray, body/nozzle compatibility, hydraulic feasibility, actual pressure at each nozzle, pump sizing and actual flow are not calculated.
- The pipe route is schematic only. It does not calculate hydraulic losses or certify pipe sizing.
- For an L-shape whose top-right bounding-box corner is cut out, the schematic route starts at the fixed top-right bounding-box point and joins the nearest boundary vertex. This needs visual owner review.

## Files changed

- `src/lib/irrigation/irrigationIntake.mjs`
- `src/lib/irrigation/irrigationLayoutBridge.mjs`
- `src/lib/irrigation/irrigationProjectStandards.mjs`
- `src/lib/irrigation/lawnSprinklerLayout.mjs`
- `src/pages/IrrigationAssistantPage.tsx`
- `tests/irrigation-intake.test.mjs`
- `tests/irrigation-layout-bridge.test.mjs`
- `tests/irrigation-project-standards.test.mjs`
- `tests/irrigation-assistant-ui-standard.test.mjs`

## Verification

- Cloudflare Pages Preview build for commit `267946a2d10fa7381c5152a3900106b386ff13fe`: **success**.
- The previous Preview build at commit `db52c4c121da72d44a050a0c138f29e719a0743b` failed due to an unescaped apostrophe in an English UI string; corrected in the succeeding commit.
- Automated Node test suite: **not run**. The branch has no push-triggered test workflow, and no PR was created because PR #473 already contains overlapping irrigation work and shared documentation coordination remains deferred.
- Browser QA: **not run**. Per owner instruction, browser access is only used after explicit permission. The owner is expected to inspect the Preview.
- No changes to `main`, Production, Sanity, D1, Cloudflare settings or secrets were made.
- No PR was created and no merge was performed.

## Owner review needed

1. Review the Preview layout and the pipe route on 10×5, 20×5, 20×10 and 20×15 m rectangles.
2. Review L-shaped geometry, especially a top-right cut-out and the assumed top-right connection route.
3. Review the narrow-strip messaging and exact LCS/RCS/SST table options. Actual strip head placement is not implemented in this increment.
4. Confirm whether the part-circle grouping rule (90°/180°/270° heads share the 6-head sector limit but remain in separate arc groups) matches the intended Florial operating rule.
