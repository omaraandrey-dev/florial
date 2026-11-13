# Manager product SEO — safe missing-only mode

Date: 2026-11-13
Implementation branch: `fix/manager-product-seo-missing-only`
Scope: irrigation equipment product SEO only; no Sanity writes during this change.

## Live read-only baseline

Sanity project `bxvcy0qs`, dataset `production`:
- 275 published products with names; all 275 active.
- 193 products have at least one missing SEO field.
- Total available locale fields: 2,475 (275 products × BG/RU/EN × H1/Meta Title/Meta Description).
- Missing fields: 1,153. Existing fields to preserve: 1,322.

| Locale | H1 missing | Meta Title missing | Meta Description missing |
|---|---:|---:|---:|
| BG | 193 | 1 | 1 |
| RU | 193 | 143 | 143 |
| EN | 193 | 143 | 143 |

These figures were independently checked against published Sanity product documents. Manager preview reads the same published product set in deterministic 50-document pages and applies the same shared JavaScript missing-value predicate as apply; drafts are excluded.

## Safe behavior implemented

1. API accepts only `catalog: irrigation`. Requests for `plants` are rejected server-side, even if a caller bypasses the UI.
2. Both preview and apply require `strategy: missing-only`.
3. Apply requires owner authentication and `confirm: true`.
4. A generated field is added only when its existing value is absent, null, empty, or whitespace-only. Non-empty existing values are not included in the Sanity patch. The whole-catalogue preview uses paginated read-only projections and the shared missing-value predicate, so preview totals and apply decisions follow the same rule.
5. Each patch retains the existing `ifRevisionID` guard. If a document changes after read, Sanity rejects that patch rather than silently overwriting the newer revision.
6. Only `h1`, `metaTitle`, and `metaDescription` paths are written. Product names, descriptions, slugs, SKUs, categories, prices, stock, images, relationships, noIndex and all other fields are outside the patch.
7. Manager preview reports the gap totals for the entire equipment catalogue and shows six sample products with per-field labels for values that will be added or preserved.
8. The Manager UI processes only the irrigation catalogue. It no longer sends requests for plants.

## Regression coverage

- Existing populated values are preserved.
- Missing, null and whitespace-only values are classified as missing.
- When all SEO values are missing, all three generated values are selected.
- Existing product SEO generation rules remain covered by the original tests.

## Operational state

- PR #259 is open and mergeable; current head `dee62f99950a400a631c10e3d021dfd0da0f74a1` is 25 commits ahead of and 0 behind `main`. No review threads are open.
- Exact-head CI passed: Blog and Studio run `43440703026` and D1 validation run `43440703050`. Cloudflare Pages Preview `https://0ffb5f32.florial.pages.dev` deployed successfully on the exact head. Production deployment and merge are not performed.
- No Sanity mutation or publication was run during this implementation.
- No Cloudflare secrets, bindings, D1 data/schema, Sanity schema, Resend, public navigation, Header, Footer or Production configuration were changed.
- The existing Sanity backup was not recreated. Its exact object/path and coverage were not independently verified in this code-only task.
- After merge and deployment, owner should open Manager, refresh the preview, review generated examples, and only then decide whether to trigger the explicit apply action.

## Related inventory

Per-product inventory of the 193 products missing H1 is tracked in PR #258: `docs/audits/2026-11-13-irrigation-product-seo-inventory.md`.