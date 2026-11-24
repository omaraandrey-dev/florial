# SSR Catalog v1 — equipment category initial HTML

**Date:** 2026-11-24  
**Branch:** `feat/seo-equipment-category-ssr-v1`  
**PR:** #531 — implementation candidate; awaiting raw initial-HTML verification and owner merge decision.

## Baseline confirmed on GitHub main

- `functions/_middleware.ts` already fetched published category products from Sanity dataset `production` for CollectionPage JSON-LD.
- Before this work, `documentBody()` inserted product cards only when `doc._dataset === 'plants'`.
- React `CategoryPage` owns the interactive catalogue, filtering and pagination.
- Existing plant SSR was retained as a compatibility baseline.

## Changes in this PR

- Added `buildEquipmentCategoryEntries()` and `renderEquipmentCategoryListing()` alongside the plant renderer.
- Extended the Sanity category product projection with SKU, primary image URL, primary category ID and additional category IDs.
- Reused the cached category tree with category slugs so the server renderer can reproduce the React all-irrigation root ordering.
- For `vsichko-za-polivane`, the SSR list mirrors React's six-category round-robin and R-VAN → HE-VAN → VAN nozzle ordering. Other equipment categories use localized alphabetical ordering.
- The CollectionPage ItemList uses the same ordered equipment entries as the server-rendered listing.
- Cards include localized product names/URLs, image ALT/title, EUR price when present, known stock status and SKU when present; the list is capped at 20.
- A failed equipment query does not render a false empty state and uses `Cache-Control: no-store` only for failed category responses. Product/service/blog cache behavior is unchanged.
- Plant rendering and plant CollectionPage product ordering remain unchanged.
- Added tests for localized URLs/labels, escaping, images/ALT/title, EUR price, stock, SKU, empty state, 20-item cap, root category round-robin, nozzle-series order, middleware metadata wiring and CollectionPage parity.

## Scope boundaries

No Sanity documents/schemas, D1 data or migrations, Cloudflare settings/secrets, orders, email, routing, global layout, Header/Footer, or irrigation-assistant code were changed. No Production deployment was made.

## Verification

- **CLOSED — exact code-head CI:** PR head `331ffee5b548864c36497fafb788293569c4180a` passed Blog/Studio workflow `45464093721` and D1 validation workflow `45464093741`.
- `npm test`: **483/483 passed**. Application/Pages Functions type-check, oxlint, website build, migration syntax check, read-only migration dry-run, Studio type-check and Studio build all passed. Lint reported 94 existing warnings and 0 errors.
- **CLOSED — Preview deployment:** Cloudflare Pages Preview deployment `ba6a681a-2865-4c40-815e-27216bc510e5` succeeded from exact head `331ffee5b548864c36497fafb788293569c4180a`; URL: https://ba6a681a.florial.pages.dev.
- **CLOSED — post-hydration route smoke:** Firecrawl returned HTTP 200 for BG/RU/EN controllers (20 product links and one React grid each), irrigation root (20), nested autonomous controllers (10), and nested 9V valves (6). These are client DOM checks after React hydration, not proof of the first HTTP response.
- **OPEN — raw initial HTML:** Firecrawl snapshots are post-hydration DOMs; the existing plant SSR marker also disappears after React mounts. Browser Use could not run because its project has insufficient credits. A network-level raw response check remains required before merge.
- **OPEN — Production:** PR #531 is not merged; no Production deployment is claimed.
