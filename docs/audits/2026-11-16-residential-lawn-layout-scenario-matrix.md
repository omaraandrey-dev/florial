# Residential lawn layout scenario matrix

Date: 2026-11-16
Branch: `feat/irrigation-rvan-performance-priority`
Base: `76be044bbed3f097e288263d57ac59cee469d24a`

## Purpose

Extend the deterministic single-lawn solver regression coverage beyond one rectangle and one L-shape. This is a code-level scenario matrix, not field validation or an approved irrigation design.

## Added scenarios

- Rectangles 12 m long and 4, 5, 6 and 8 m wide, using the exact R-VAN18 operating point at 3.1 bar and 0.25 m coverage sampling.
- Repeated calculation equality for each rectangle to assert deterministic sprinkler output.
- Head-to-head diagnostic assertion for each rectangle.
- L-shape variants with original orientation, axis swap (rotation/reflection) and reversed vertex winding.
- Explicit assertion that reflex-corner 270-degree heads remain present in each L-shape variant.

## Interpretation and limits

- The tests assert accepted geometry, deterministic output, sample generation and head-to-head diagnostics. They do not prove continuous geometric coverage.
- Hydraulic feasibility, source dynamic pressure, pipe sizing/losses, precipitation uniformity, overspray, wind and body/nozzle compatibility remain unevaluated.
- Rain Bird D42378 confirms that the 3500 can be adjusted from 40° to 360° (including reversing full-circle operation), but explicitly states that the published precipitation rates are based on half-circle operation. The current 36-row dataset stores those half-circle precipitation values. Do not treat them as arc-specific measured precipitation for 90°/270°/360° layouts, or scale them by angle without a reviewed engineering rule. Radius and flow use also needs a documented arc-independence decision before being wired into the layout solver. The current layout solver branch does not select 3500.
- R-VAN remains the user's preferred family for suitable narrow residential lawns; the test matrix does not establish universal superiority or a water-saving percentage.

## Validation

GitHub Actions is triggered by the test commit. Record exact-head workflow results here after they complete; no local or Production validation is implied by this audit.
