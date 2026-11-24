# 2026-11-24 — Rain Bird 3504-PC integration audit

**Work item:** PR #527 — https://github.com/omaraandrey-dev/florial/pull/527  
**Base:** `main` at `d9a24afc4ba04f36b4bf027646eba986e38156f5`  
**Validated implementation commit:** `a337a8923fcbb303b91f99a88d7b03b218d8fc3c`  
**Status:** implementation and automated validation complete; owner visual acceptance and merge remain pending.

## Work performed

1. Added the separate 3504-PC geometric candidate generator using owner-approved 10/9/8 m planning radii and 90/180/270/360 degree sectors.
2. Integrated rotor-first placement with the existing R-VAN gap-fill path. The R-VAN placement module itself was not modified.
3. Added a combined Head-to-Head gate and a final composite overspray sampling gate. Unsafe mixed layouts fall back to the legacy R-VAN-only layout.
4. Added dimension annotations for outer boundary edges, L-shape recess edges and rectangular exclusions in the assistant's geometry and calculated-layout diagrams.
5. Extended project snapshot validation to preserve sanitized rectangular exclusions so the project PDF can draw and dimension them.
6. Added the 3504-PC triangle marker to the layout and PDF.
7. Added preliminary BOM mapping for SKU Y34001 without adding a separate 1804 spray body to rotor heads. Accessory quantities remain provisional.

## Geometry regression outcomes

- Rectangles 8×8, 20×10, 20×15 and 30×30 m: rotor-priority scenarios are covered by regression tests.
- L-shaped 28×14 m lawn with a 16×12 m top-right recess: test confirms 3504-PC is retained in the accepted layout with complete sampled coverage and sampled overspray inside the original geometry.
- 20×16 m lawn with a 4×4 m non-irrigated rectangle: no 3504 candidate is selected; the test confirms the safe R-VAN-only fallback, complete sampled coverage and sampled overspray inside the original geometry.
- Legacy R-VAN model selection, interior placement and zone grouping are exercised directly against the unchanged R-VAN engine.

## Automated verification

For implementation commit `a337a8923fcbb303b91f99a88d7b03b218d8fc3c`:

- Blog and Studio validation: run **45383446806**, success; **466 tests passed, 0 failed**. Type-check, lint, website tests/build, migration script syntax, read-only migration dry-run, Studio type-check and Studio build all passed.
- D1 migration validation: run **45383448234**, success.
- Cloudflare Pages Preview: successful deployment for the same commit.
  - Preview: https://b3a0e185.florial.pages.dev/irrigation-assistant

The documentation-only commits added after that implementation commit are being revalidated by the PR checks.

## Live catalogue read-back

Sanity Production was queried read-only on 2026-11-24:

- `Y34001` — published Rain Bird 3504-PC product;
- `A46010` — Rain Bird SBE-050;
- `A82060` — Rain Bird SPX-FLEX30.

No Sanity documents were written. No D1 records or schema were changed.

The manufacturer product page confirms a 1/2-inch female threaded inlet and an attachable six-nozzle Rain Curtain tree. The exact factory package/accessory configuration and final BOM remain provisional; this audit does not approve a final purchase list.

## Manual acceptance still pending

A read-only browser inspection of the Cloudflare Preview could not be completed in this environment because Browser Use had insufficient credits and the connected browser context was unavailable. The Preview deployment itself succeeded, but visual QA of the diagram, dimension labels and generated PDF is **not claimed as completed**.

Owner review should verify:
- Bulgarian assistant flow and dimension entry;
- rotor triangle markers versus spray-head circles;
- L-shape recess and non-irrigated exclusion outlines and dimensions;
- zone labels and PDF diagram/dimension labels;
- preliminary BOM display.

## Release and documentation controls

- PR #527 remains open and unmerged.
- `main` and Production were not changed.
- No Sanity writes, D1 data writes, Cloudflare settings/secrets changes or Production deployment were performed.
- Shared `CHANGELOG.md`, Technical Passport, `OPEN_QUESTIONS.md` and `CURRENT_STATE.md` were not edited on this branch because open PR #409 also changes those shared records. Reconcile them in the single integration step after owner acceptance.
