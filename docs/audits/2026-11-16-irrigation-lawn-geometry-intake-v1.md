# Lawn geometry intake UI v1 — implementation audit

**Date:** 2026-11-16  
**Status:** draft PR #315; depends on geometry-core PR #314  
**Baseline:** \`main\` at \`a9dc18be8a0d0c2266bd77170c0f8dd6b1ce8219\`

## Delivered in this branch

- Replaced the previous area-only input for non-rectangular lawns with actual metric outline dimensions.
- Rectangle input: overall length and width.
- Orthogonal L-shape input: overall length/width, missing rectangular cut-out width/depth, and one of four cut-out corners.
- Added a proportional SVG outline preview derived from the same metric vertices supplied to the geometry validator.
- Added live calculated area and perimeter.
- Added an explicit customer confirmation checkbox. Any geometry edit clears confirmation.
- The Next action is disabled until the validator returns \`accepted\` for the confirmed geometry.
- Localized the new geometry controls and status messages in Bulgarian, Russian and English.
- Added a pure dimension-to-polygon helper and tests for rectangle, all four L-shape orientations and invalid/incomplete dimensions.

## Engineering semantics

The UI builds \`local_cartesian_m\` polygons from manually entered measured dimensions and passes them to \`validateLawnGeometry\`. The UI does not infer a scale from a photo or drawing. A checkbox changes the input state to \`confirmed\`; it is a customer assertion that the entered measurements and outline match the site, not an engineer approval.

The area and perimeter are calculated by the geometry module, not by an LLM or by a separate UI-only formula. The L-shape area is not accepted if the cut-out dimensions are missing, zero or not smaller than the overall dimensions.

## Explicit limitations

- One lawn region only. Separate lawn islands are not accepted by the v1 solver.
- Only rectangle and one-corner orthogonal L-shapes are supported.
- No exclusion polygons/obstacles, paths, buildings, trees, slopes or elevation data are captured in this UI. The summary explicitly warns that these have not been mapped.
- No drawing upload, image interpretation, drag-to-edit polygon, GPS or scale inference.
- No sprinkler placement, coverage, precipitation, zoning, pipe sizing or hydraulic calculation.
- Existing optional flow and reported pressure fields remain intake-only. Pressure type/test conditions are not validated here.
- No data is persisted or sent to an API; no AI provider is called.

## Files

- \`src/pages/IrrigationAssistantPage.tsx\`
- \`src/lib/irrigation/lawnGeometryInput.mjs\`
- \`src/lib/irrigation/lawnGeometryInput.d.mts\`
- \`tests/irrigation-lawn-geometry-input.test.mjs\`
- The geometry-core module and its audit/tests from dependency PR #314 are included in this branch ancestry.

## Safety / release boundary

No Header, menu, Footer, global layout, routes, Sanity, D1, Cloudflare settings/secrets, Resend, catalog, orders or Production deployment are changed. PR #315 is a draft and depends on PR #314. Shared CHANGELOG, Technical Passport and Open Questions updates are deferred to one synchronized documentation integration after the dependent engineering work is reconciled.


## Verification evidence

- Commit tested: \`08885de2007f1d70a5e475112084dbc4aba3d772\`.
- GitHub Actions Blog and Studio validation run \`43812300760\` (#1380): success. Application/Pages TypeScript, lint, all tests, website build, migration script syntax/dry-run, Studio TypeScript and Studio build all passed.
- Test summary: 202 tests, 202 passed, 0 failed.
- GitHub Actions D1 migration validation run \`43812300769\` (#1699): success.
- Cloudflare Pages Preview deployment \`1f9f5005-511b-4b21-855a-bacd6775f8c9\` deployed the exact commit above; build and deploy stages succeeded. Preview alias: \`https://feat-irrigation-lawn-geometr-dbvj.florial.pages.dev\`.
- Public browser QA on \`/irrigation-assistant\`: rectangle 12 × 8 m produced 96 m² / 40 m; L-shape 12 × 8 m with 4 × 3 m cut-out produced 84 m² / 40 m. All four cut-out corners produced the same correct metrics and matching SVG orientation.
- Desktop 1536 × 643 and mobile 390 × 844 rendered without horizontal overflow. No uncaught runtime errors, unhandled promise rejections or console errors were observed.
- Privacy-settings banner was left untouched and no form was submitted.
- Production was not deployed or modified.
