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

## 2026-11-13 — Manager product SEO safe mode merged and deployed (PR #259)

- PR #259 squash-merged into `main`: merge commit `3c909da0fc235aff2cc19ccdb73a1edba7960670`.
- Exact merge commit checks: GitHub Actions `validate` run `43446693123` passed (lint, website build, Pages Functions syntax and D1 migration validation); Cloudflare Pages check `131958296250` passed.
- Cloudflare Pages Production deployment `4db8a0e1-ff55-4470-9fd5-c179f2993ba7`, URL `https://4db8a0e1.florial.pages.dev`, completed build and deploy successfully for exact merge commit. Production aliases include `https://florial-bg.com` and `https://www.florial-bg.com`.
- Fresh read-only Sanity Production recount after deployment: 275 published products, 193 with missing SEO fields, 1,153 missing fields and 1,322 populated fields to preserve. Per locale: BG H1 193 / Meta Title 1 / Meta Description 1; RU and EN each H1 193 / Meta Title 143 / Meta Description 143. All 275 products have RU and EN names.
- Read-only sample review of the first six published products: products 1, 2, 4 and 5 have only BG H1 missing while their existing BG Meta Title/Description are preserved; RU/EN have all three SEO fields missing. Products 3 and 6 already have all sampled SEO fields populated and are marked preserve-only. No writes were run.
- The actual Manager UI preview endpoint requires an authenticated Owner session. No Owner session was available to this verification, so a click-through in the Manager UI is **not confirmed**. The live Sanity read-only recount and sample inspection independently match the Manager preview implementation and documented baseline.
- No Sanity mutation/publication, D1 change, Cloudflare setting/secret change, Resend or schema change was made. SEO apply remains pending a separate explicit owner instruction after review of the preview samples.
- Cloudflare Pages project configuration still contains legacy variables named `SUPABASE_*` and `VITE_SUPABASE_*` in Preview/Production. They were only observed; no values are reproduced here and nothing was changed. Supabase remains excluded from the Florial runtime architecture. Inventory/removal requires a separate approved change after checking whether any deployed code still references them.

## Related inventory

Per-product inventory of the 193 products missing H1 is tracked in PR #258: `docs/audits/2026-11-13-irrigation-product-seo-inventory.md`.