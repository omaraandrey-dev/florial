# Rain Bird 3504-PC corner-first integration audit

**Integration branch:** `integration/irrigation-3504pc-corner-first`  
**Source branch A:** `feature/irrigation-dimensions-3504pc` (PR #527)  
**Source branch B:** `feature/irrigation-3504pc-global-layout-v2` (PR #528)  
**Base main SHA at integration start:** `d9a24afc4ba04f36b4bf027646eba986e38156f5`  
**Status:** implementation in progress; automated validation and visual acceptance pending.

## Owner-approved change

Replace the Rain Bird 3504-PC placement logic with a corner-first, shared-cell algorithm:
1. Test the four true rectangle corners first.
2. Accept only if sampled coverage and mutual Head-to-Head pass.
3. Otherwise create a complete grid of square/rectangular cells, each with four corner positions.
4. Deduplicate shared cell corners into one physical rotor position.
5. Check actual mutual sector reach for every adjacent grid pair.
6. Prefer 8 m planning reach; use 9/10 m only when justified by a materially smaller valid head count; locally reduce to 7/6/5 m where geometry requires.

## Integration decisions

- PR #527 is the integration base because it carries the dimension annotations, exclusion snapshot/PDF support, orthogonal decomposition and per-rectangle rotor/R-VAN selection.
- The newer PR #528 rotor grid/pruning implementation is not copied as the final algorithm; it is superseded by the owner-approved corner-first model.
- PR #528's explicit `pattern: 'rotor'` contract is retained for 3504-PC heads, with validation and persistence updates.
- The assistant layout list now shows the geometric planning radius for rotor heads.
- The BOM explicitly validates rotor identity and 5–10 m planning radius, maps the head to `Y34001`, and does not add an 1804 spray body for it.
- The project snapshot validator preserves the explicit rotor pattern.

## Bounded R-VAN seam-offset approval

- The owner approved one narrow extension: a 7.5 cm inward offset may be applied to the exact matching R-VAN corner candidate at a shared strip/rectangle seam, only when that rectangle falls back to R-VAN.
- The new `candidatePositionOffsets` input is opt-in. Without an offset entry, the established R-VAN candidate generation, nozzle/model selection, radius selection, perimeter/interior ordering and spacing logic are unchanged.
- The bridge passes seam offsets only to the R-VAN fallback. The spray sector is still checked against the calculation rectangle and original lawn/exclusion geometry.
- The 3504-PC solver does not accept or receive seam offsets; its corner-first positions remain on the true geometric corners.
- No R-VAN repair, nozzle sizing or general placement rule was changed.

## Current code changes

- `src/lib/irrigation/rainBird3504Layout.mjs`: new corner-first and shared-cell grid phases.
- `src/lib/irrigation/rainBird3504Layout.d.mts`: updated result/type contract.
- `functions/api/_lib/irrigation-project.mjs`: preserve validated rotor pattern.
- `src/lib/irrigation/irrigationBillOfMaterials.mjs`: validate rotor pattern/radius and map Y34001.
- `src/pages/IrrigationAssistantPage.tsx`: display rotor planning radius in sprinkler list.
- `tests/irrigation-rain-bird-3504-layout.test.mjs`: corner-only, 38×16 shared-cell, 20×10 and local-radius regressions; rotor corners remain unshifted.
- `tests/irrigation-layout-bridge.test.mjs`: 7.5 cm offset regression is scoped to the matching R-VAN corner candidate.
- `tests/irrigation-bom.test.mjs` and `tests/irrigation-project-order.test.mjs`: BOM and persisted snapshot regressions.
- `docs/engineering/IRRIGATION_ASSISTANT_3504PC_GEOMETRIC_LAYOUT_V1.md`: current algorithm specification.

## Verification result on exact integration head

- Blog/Studio validation run `45448308122` passed: 475/475 tests, app/Pages Functions type-check, lint, website build, read-only D1 description migration dry-run, Studio type-check and Studio build.
- D1 validation run `45448308116` passed; no migration was applied.
- Cloudflare Pages Preview deployment `03615d85-7a08-42a9-8d41-cbd0d3ec2de9` succeeded from exact head `e1480631e4dedd2bb119fc644f7369b0cb9228ca`: https://03615d85.florial.pages.dev.
- Manual browser interaction/visual acceptance is **not confirmed**. Browser Use was unavailable because the connected browser project reported insufficient credits. Owner visual review remains pending.

## Remaining verification before merge

- Run the full Blog/Studio validation on the exact integration head.
- Run D1 migration validation; no migration should be applied.
- Verify all existing irrigation bridge, L-shape, exclusion, PDF, BOM and R-VAN regressions.
- Confirm the exact R-VAN source blob is unchanged from main.
- Review the complete integration diff and the final shared-document changes.
- Deploy a Cloudflare Pages Preview from the exact final head and visually check 8×8, 10×10 and 38×16 layouts, including the 3504-PC marker/radius, dimensions, exclusions, zones and PDF.
- Do not claim visual acceptance if Browser Use/Preview interaction is unavailable.

No Sanity writes, D1 data/schema changes, Cloudflare settings/secrets changes, Production deployments, Production orders or emails are authorized by this integration task.
