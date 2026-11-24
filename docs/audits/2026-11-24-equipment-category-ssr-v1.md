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

- **CLOSED — final documentation-head CI:** PR head `a30dcd3323922130441b28331c28872934378e4c` passed Blog/Studio workflow run `45462628899` and D1 workflow run `45462628831`; all steps succeeded.
- **CLOSED — final Preview deployment:** deployment `5db5441d-2f0b-4b92-a9c5-6b939ecf9cf4` succeeded from exact head `a30dcd3323922130441b28331c28872934378e4c`; URL: https://5db5441d.florial.pages.dev.
- **CLOSED — post-hydration route smoke:** Firecrawl returned HTTP 200 and the correct BG/RU/EN language/H1 for `controllers`; each rendered 20 product links and exactly one React product grid. The irrigation root rendered 20 links; nested `autonomous-controllers` rendered 10; nested `electromagnetic-valves-9v` rendered 6. These are post-hydration DOM checks, not proof of the first HTTP response.
- **OPEN — raw initial HTML:** Firecrawl snapshots are post-hydration DOMs and cannot prove what the first HTTP response contained. The existing plant SSR marker also disappears after React mounts. Browser Use could not run because its project has insufficient credits. A network-level raw response check remains required before merge.
- **OPEN — Production:** no merge or Production deployment is claimed.
