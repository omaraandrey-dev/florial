# SSR Catalog v1 — equipment category initial HTML

**Date:** 2026-11-24  
**Branch:** `feat/seo-equipment-category-ssr-v1`  
**PR:** #531 — merged and verified in Production.

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

No Sanity documents/schemas, D1 data or migrations, Cloudflare settings/secrets, orders, email, routing, global layout, Header/Footer, or irrigation-assistant code were changed. The only Production runtime release was the automatic Cloudflare Pages deployment from the explicitly merged PR; no direct Production configuration change was made.

## Verification

- **CLOSED — exact-head CI:** PR head `17aefbb2781d24b401310d759dbe9cb678b4e945`. Blog and Studio validation run `45466168536` and D1 validation run `45466168430` both succeeded. Website test step: **483 passed / 0 failed**. Application/Pages Functions type-check, lint, website build, read-only migration dry-run, Studio type-check and Studio build passed. No D1 migration was applied.
- **CLOSED — raw initial HTTP HTML:** new GitHub Actions workflow `.github/workflows/equipment-ssr-preview-smoke.yml` uses Node native `fetch()` directly against the Preview alias; it does not launch a browser or execute page JavaScript. Push run `45466157907` and PR run `45466168466` passed on exact head `17aefbb2781d24b401310d759dbe9cb678b4e945`. BG/RU/EN each returned HTTP 200 with 20 product links inside `data-florial-server-catalogue="equipment"`; product-link order exactly matched CollectionPage ItemList; RU/EN locale suffixes were preserved; robots directives were index/follow.
- **CLOSED — Preview deployment:** Cloudflare Pages Preview deployment `34fe3142-5306-4391-afb5-d195691361a4` succeeded from exact head `17aefbb2781d24b401310d759dbe9cb678b4e945`; URL: https://34fe3142.florial.pages.dev.
- **CLOSED — merge/Production:** PR #531 merged as `39e756fe63993557ee7702dee4eaefc6c8111b14`; Production deployment `d558f601-ebc0-495c-ac2a-a900214a60ca` succeeded from that exact SHA. Raw Production first-response smoke run `45466953350` passed against canonical `https://florial-bg.com` for BG/RU/EN with 20 product links each and CollectionPage order parity.
- **SEPARATE SEO FOLLOW-UP:** this proves the SSR listing and indexable robots directive for the tested category route. It does not resolve the separate Search Console noindex/canonical discrepancies reported for other URLs in the 2026-11-23 comprehensive SEO audit.

