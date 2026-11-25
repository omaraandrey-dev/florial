# Plant catalogue SSR v1 — implementation, Preview and Production release audit

**Date:** 2026-11-25  
**Development branch:** `develop`  
**Code commit validated in Preview:** `f2731a635141608cb718e6b8fe2abcfd1dd446c3`  
**Integration PR:** [#545 — feat(ssr): server-render the complete plant catalogue](https://github.com/omaraandrey-dev/florial/pull/545) — merged by squash.  
**Production merge commit:** `2b008089e1134dc72bf3b3f592b5102fdd52b6b9`  
**Develop synchronization merge:** `c320d9195854ead8451506d26c4e72b1370b9019` (tree identical to Production main at sync time).  
**Cloudflare Preview deployment:** `8edfaba7-a854-4d4d-ba2a-65891e371d50`  
**Preview URL:** https://8edfaba7.florial.pages.dev  
**Preview status:** successful build and deployment  
**Production status:** RELEASED; Cloudflare Pages deployment succeeded from the exact PR #545 merge commit.

## 1. Scope

The owner changed the SSR priority: before continuing with contacts and about pages, deliver server-rendered HTML for the entire plants catalogue and each plant detail page.

Implementation is code-only and reads the published Sanity `plants` dataset. No Sanity content/schema writes, D1 migrations, Cloudflare settings/secrets/DNS changes, Resend changes or Production application-code changes were made as part of the plant SSR implementation.

## 2. Live published Sanity inventory

Read-only queries against project `bxvcy0qs`, dataset `plants`, perspective `published` confirmed:

- 60 active published plant products with public slugs.
- 17 published plant categories with public slugs.
- All 60 active published plant products are reachable through the complete 17-category tree.
- The exact product detail projection and catalogue product projection were executed against the live dataset and returned the expected fields.

Plant detail fields used where present:
- localized name, H1, meta title/description and short description;
- botanical/scientific name;
- main image and gallery;
- sale variants with localized labels, price, old price, SKU, stock status, height and container volume;
- full Portable Text description and care guide;
- structured plant-care characteristics;
- published irrigation recommendation and related content slugs;
- category relation and product SKU.

The renderer does not expose the preliminary AI recommendation field as a verified horticultural fact. It only displays the explicit `blackSeaCoast` status when present.

## 3. Implemented

### Plant product detail

- Added `functions/_lib/plantProductHtml.mjs` with a dedicated localized plant renderer.
- Added a plant-only published Sanity GROQ query in `functions/_middleware.ts`; it does not use the shortened generic product fallback.
- Initial HTML contains localized H1 and summary, botanical name, responsive main image/gallery, all actual sale variants, EUR prices, stock status, SKU, full Portable Text description/care guide, available plant-care fields, irrigation recommendations and related links.
- Product JSON-LD uses actual priced sale variants as an AggregateOffer; it does not invent a price or infer unavailable stock states.
- BreadcrumbList JSON-LD and product breadcrumbs are included.
- Plant detail image is eligible for the existing page-head image preload path.
- Missing/unpublished plant products retain 404/noindex behavior.

### Plant categories and root catalogue

- Expanded `functions/_lib/plantCategoryHtml.mjs` to render sale offers, not merely source products.
- The server's first page is capped at 20 sale offers, consistent with the client's current 20-card page size.
- Sale offers use the same key ordering rules: product-level availability order, localized product name, then variant-level availability and stable variant order.
- Variant cards include real price, old price where valid, size/height/container volume, stock status, short description and winter minimum temperature when present.
- Deterministic gallery image selection follows the client's variant selection pattern.
- Localized image alt/title text is rendered.
- The plant category tree is available to the renderer; direct child categories render as crawlable category links with images.
- Localized category Portable Text SEO content is rendered in the first response.
- CollectionPage/ItemList JSON-LD is based on the same first-page sale offers.

### Automated regression coverage

- Added `tests/plant-product-server-rendering.test.mjs`.
- Extended `tests/plant-category-server-rendering.test.mjs`.
- Updated the middleware contract assertion in `tests/google-seo-schema.test.mjs`.
- Added `scripts/smoke-plant-ssr.mjs` and `.github/workflows/plant-catalog-ssr-smoke.yml`. The workflow waits for the exact successful Cloudflare Preview check and tests the deployment-specific URL rather than a mutable branch alias.

## 4. Exact Preview validation

The dedicated plant smoke workflow ran against the exact successful Preview deployment for commit `f2731a635141608cb718e6b8fe2abcfd1dd446c3`.

Sanity discovery:
- 60 active published plants.
- 17 published plant categories.

Raw HTTP results, without executing client JavaScript:

| Route group | BG | RU | EN | Total |
|---|---:|---:|---:|---:|
| Plant product details | 60 | 60 | 60 | 180 |
| Plant categories | 17 | 17 | 17 | 51 |

All 231 routes passed. The smoke validated:
- HTTP status and HTML response;
- locale `html lang`;
- canonical URL for each locale;
- plant SSR marker and initial page content;
- localized H1;
- botanical name and real Sanity image where present;
- sale variant section, description and care guide where present;
- Product, BreadcrumbList and CollectionPage JSON-LD;
- AggregateOffer low/high prices, offer count and EUR currency;
- root `/category/rastenia` category navigation and first 20 sale offers;
- a missing plant product returns HTTP 404 and noindex.

**Plant smoke workflow run on exact PR head:** `45581984035` — success.

## 5. CI and build evidence

For the same validated code commit:
- Website/Pages Functions type-check — passed.
- Website lint — passed.
- Website utility and SSR regression tests — **543 passed, 0 failed**.
- Website build — passed.
- Sanity Studio type-check — passed.
- Sanity Studio build — passed.
- D1 migration script syntax and read-only validation — passed; no migration was applied.
- Plant SSR Preview smoke — passed (231/231).
- Existing equipment, services, blog and other raw HTTP regression checks on the same commit — passed.

Relevant validation runs include:
- Plant catalogue SSR smoke: `45581984035`.
- Blog and Studio validation: `45581984034`.
- Equipment product SSR validation: `45581983904`.
- D1 migration validation: `45581984179`.

No Sanity writes or D1 migrations were performed.

## 5A. Production release verification

- PR #545 was merged into `main` by squash at `2b008089e1134dc72bf3b3f592b5102fdd52b6b9`.
- Cloudflare Pages Production deployment: `5fba6345-f886-4eb8-a4b2-154efe326e04`; exact commit `2b008089e1134dc72bf3b3f592b5102fdd52b6b9`; build and deploy stages succeeded.
- Custom domains `florial-bg.com` and `www.florial-bg.com` are both active in Cloudflare Pages.
- Exact merge-commit workflow `45582913604`: 543/543 tests passed; application/Pages Functions type-check, lint, website build, Studio type-check and Studio build passed. D1 validation `45582913445` was read-only; no migration was applied.
- Other exact-merge-commit raw HTTP regression workflows passed for homepage, services, service details, blog index/articles, equipment categories and equipment product pages.
- **Plant-specific Production raw HTTP smoke was not separately run after merge.** The exhaustive plant smoke remains confirmed on exact Preview: 180 product + 51 category routes (231/231). Do not claim a separate 231-route Production raw HTTP verification.
- Owner visually checked plant catalogue and product detail pages in Preview and confirmed that navigation and pages work.
- Production deployment success and active domain status are verified; direct HTTP fetch from the current execution environment was unavailable, so no independent manual Production page fetch is claimed.

## 6. Files changed for plant SSR

- `functions/_lib/plantProductHtml.mjs` — new.
- `functions/_lib/plantCategoryHtml.mjs` — expanded plant catalogue rendering; equipment rendering preserved.
- `functions/_middleware.ts` — plant detail query, SSR routing, category tree and localized editorial content.
- `tests/plant-product-server-rendering.test.mjs` — new.
- `tests/plant-category-server-rendering.test.mjs` — expanded.
- `tests/google-seo-schema.test.mjs` — updated middleware assertion.
- `scripts/smoke-plant-ssr.mjs` — new.
- `.github/workflows/plant-catalog-ssr-smoke.yml` — new.

## 7. Branch and Production operational note

The project policy is `develop` as the only permanent development branch and `main` as Production. During creation of the smoke script and workflow, the GitHub create-file operation was mistakenly executed without an explicit branch, so two test-only files were committed to `main`:

- `e7324d7b38cb0cd0036d9faea71052a58a153b1e` — smoke script.
- `1e56c12ed4bd73307ff24f7255bc3b6c16780ea4` — workflow.

The resulting main diff against the previous Production commit `7465914b61f859768b073d1f678f9d22161e9ba6` contains only these two test/CI files; no website application source, Sanity data, D1 data or Cloudflare configuration was changed by those commits.

Cloudflare nevertheless created a Production deployment because `main` advanced:
- Deployment `d57f00f9-2fbd-4d8c-b045-686498096c5d`.
- Commit `1e56c12ed4bd73307ff24f7255bc3b6c16780ea4`.
- Status: success.
- Aliases: `https://florial-bg.com` and `https://www.florial-bg.com`.

This deployment did not contain plant SSR application-code changes. The accidental commits were not reverted automatically because further changes to `main` require the owner's explicit approval.

PR #545 subsequently merged the complete plant SSR implementation to `main` at `2b008089e1134dc72bf3b3f592b5102fdd52b6b9`. `develop` was synchronized with the released main by merge commit `c320d9195854ead8451506d26c4e72b1370b9019`; the two trees were identical at synchronization. The accidental test-only files remain in the history and were not rewritten or force-removed.

PR #409 remains open and untouched. Shared documents overlapping PR #409 were not modified.

## 8. Remaining work / acceptance boundary

- PR #545 is merged; plant SSR is released to Production from exact merge commit `2b008089e1134dc72bf3b3f592b5102fdd52b6b9`.
- Owner visually accepted the Preview catalogue and product pages. Production deployment succeeded and custom domains are active.
- A separate 231-route plant raw HTTP smoke against Production remains unverified; Preview raw HTTP smoke passed 231/231.
- Client startup still uses `createRoot`, not `hydrateRoot`; assess the SSR-to-client handoff and layout shift as a separate scoped task before changing the global bootstrap.
- Next SSR roadmap stage is `/contacts`, followed by `/about` and the full SSR/SEO regression.
- Do not edit Sanity product data, schema, D1 or Production configuration as part of this phase without separate approval.
