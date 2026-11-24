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
- Unit tests: pending CI.
- Type-check/lint/build: pending exact-commit CI.
- Preview raw HTML for BG/RU/EN and nested categories: pending.
- Production HTML/deployment: pending; no deployment claim.
