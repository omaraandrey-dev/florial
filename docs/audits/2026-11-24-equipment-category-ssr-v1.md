# SSR Catalog v1 — equipment category initial HTML

**Date:** 2026-11-24  
**Branch:** `feat/seo-equipment-category-ssr-v1`  
**Status:** implementation candidate; CI and deployment verification pending.

## Baseline confirmed on GitHub main

- `functions/_middleware.ts` fetches published category products from Sanity dataset `production` for CollectionPage JSON-LD.
- `documentBody()` previously inserted product cards only when `doc._dataset === 'plants'`.
- The existing React `CategoryPage` continues to load the full category catalogue and owns filtering, pagination and interactive product cards.
- Existing plant category server renderer is retained; the new equipment renderer is additive.

## Changes in this PR

- Added `buildEquipmentCategoryEntries()` and `renderEquipmentCategoryListing()` to `functions/_lib/plantCategoryHtml.mjs`.
- Added SKU and primary image URL to the category-product Sanity projection.
- Connected the equipment renderer to `documentBody()` only for successful `production` dataset queries.
- Kept the existing plant rendering call unchanged.
- A failed equipment product query leaves the fallback listing absent rather than presenting a false empty category; the HTML response is marked `no-store`.
- Added `tests/equipment-category-server-rendering.test.mjs` for BG/RU/EN URLs and labels, escaping, image ALT/title, price, stock, SKU, empty state and the 20-product cap.

## Scope boundaries

No React category behavior, Sanity documents or schemas, D1, Cloudflare settings/secrets, routing, global layout, Header/Footer, or irrigation-assistant code is changed. No Production deployment or live data write is claimed.

## Verification

- Source-level review: performed against the branch files.
- Isolated runtime assertions against the actual renderer source passed for BG/RU/EN output, localized URLs, root equipment price/stock semantics, image ALT/title, SKU, empty state and the 20-item cap. A plant-variant renderer regression assertion also passed.
- **CLOSED — exact-PR-head CI:** Blog and Studio workflow run `45462084817` succeeded. `npm test` reported 481/481 passing; app/Pages Functions type-check, oxlint, website build, migration-script syntax check, read-only description migration dry-run, Studio type-check and Studio build all succeeded.
- **CLOSED — D1 workflow validation:** run `45462037512` succeeded, including lint, website build, Pages Functions syntax check and the existing D1 migration validators. No migration was applied.
- **CLOSED — Preview build/deployment:** Cloudflare Pages deployment `5535da5d-488c-405a-9101-cae9cf6c1dbe` succeeded from exact PR head `fb3b065930ee2bbe8e030b96fc13684727acfd48`; Preview URL: https://5535da5d.florial.pages.dev.
- **OPEN — raw initial HTML:** Firecrawl snapshots return the post-hydration DOM (the existing plant SSR marker is also absent after React mounts), so they cannot prove what the first HTTP response contained. Browser Use could not run because its project has insufficient credits. A network-level raw response check is still required before merge.
- **OPEN — Production:** no merge or Production deployment is claimed.

