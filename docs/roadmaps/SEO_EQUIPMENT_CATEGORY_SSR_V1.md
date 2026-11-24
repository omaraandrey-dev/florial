# Equipment category server-rendered catalogue — SSR Catalog v1

**Status:** implementation candidate in PR; automated CI and live Production verification pending.  
**Scope:** equipment categories in Sanity dataset `production`. Plant category SSR is a frozen compatibility baseline and is not redesigned.

## Objective

Include a useful, crawlable product listing in the initial HTML response for irrigation-equipment category routes. The existing middleware already fetches published products from Sanity and uses them for CollectionPage structured data; this work connects that data to the category body for the `production` dataset.

## Implementation

- Reuse the existing published Sanity category/product query, nested-category traversal and 30-second product cache.
- Extend the product projection with SKU and the primary image URL needed by category cards.
- Add a dedicated equipment renderer alongside the existing plant renderer. It outputs up to 20 products, localized product names and URLs, product images with localized Florial ALT/title text, EUR price when available, stock label when known, and SKU when present.
- Preserve localized canonical/hreflang and existing CollectionPage JSON-LD generation.
- Keep the existing React CategoryPage responsible for the interactive catalogue, filters, pagination and final client-side ordering. The server listing is the initial no-JavaScript/crawler fallback and is replaced by the existing `createRoot` mount; it is not a second interactive catalogue.
- If the equipment catalogue query fails, do not render a false empty state and do not cache that response (`Cache-Control: no-store`). A successful empty result may render a localized empty state.
- Do not change Sanity documents/schemas, D1, Cloudflare settings/secrets, routing, Header, Footer or the irrigation assistant.

## Acceptance criteria

1. Equipment category initial HTML contains a product listing in BG, RU and EN.
2. Each rendered card uses a canonical product URL with the appropriate `?lang=ru|en` suffix.
3. Cards expose localized name, image ALT/title, EUR price when present, stock only when known, and SKU when present.
4. Nested category membership continues to use the existing descendant-category query.
5. Plant category SSR output and its failure behavior remain unchanged.
6. Equipment query failure does not become an empty listing and is not edge-cached.
7. Existing React catalogue behavior remains responsible for filtering and pagination; no second interactive layer is added.
8. Tests and exact-SHA CI pass; Production raw HTML smoke is checked only after a confirmed deployment.

## Verification status

- Code inspection: existing middleware fetches production dataset products for CollectionPage JSON-LD, but before this change only plant dataset products were inserted into initial category HTML.
- Added focused unit coverage for localized URLs, escaping, images/ALT/title, EUR price, stock, SKU, empty state and 20-item cap.
- Exact code-head CI passed: 481/481 tests, app/Pages Functions type-check, lint, website build, Studio type-check/build; D1 validation passed without applying a migration.
- Cloudflare Pages Preview deployment succeeded from the exact validated code head.
- Raw first-response HTML verification remains open because the available Firecrawl page snapshot is post-hydration; Production merge/deployment remains pending.
- No Sanity, D1, Cloudflare configuration, secrets, orders or email writes are part of this task.
