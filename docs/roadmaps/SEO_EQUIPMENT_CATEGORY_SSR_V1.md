# Equipment category server-rendered catalogue — SSR Catalog v1

**Status:** implementation in PR #531; CI and Preview build passed; raw initial-HTML verification and merge remain open.  
**Scope:** equipment categories in Sanity dataset `production`. Plant category SSR is a frozen compatibility baseline and is not redesigned.

## Objective

Include a useful, crawlable product listing in the initial HTML response for irrigation-equipment category routes. The existing middleware already fetches published products from Sanity and uses them for CollectionPage structured data; this work connects that data to the category body for the `production` dataset.

## Implementation

- Reuse the existing published Sanity category/product query, nested-category traversal and 30-second product cache.
- Extend the product projection with SKU, primary image URL, primary category ID and additional category IDs.
- Reuse the category tree, including slugs, to mirror the existing React ordering on the all-irrigation root: six-category round-robin plus R-VAN → HE-VAN → VAN nozzle priority. Other equipment categories use localized alphabetical ordering.
- Add a dedicated equipment renderer alongside the existing plant renderer. It outputs up to 20 products, localized product names and URLs, product images with localized Florial ALT/title text, EUR price when available, stock label when known, and SKU when present.
- Use the same ordered equipment entries for the server listing and CollectionPage ItemList JSON-LD.
- Keep React CategoryPage responsible for the interactive catalogue, filters and pagination. The server listing is the initial no-JavaScript/crawler fallback and is replaced by the existing `createRoot` mount; it is not a second interactive catalogue.
- If the equipment catalogue query fails, do not render a false empty state and do not cache that response (`Cache-Control: no-store`). A successful empty result may render a localized empty state.
- Do not change Sanity documents/schemas, D1, Cloudflare settings/secrets, routing, Header, Footer or the irrigation assistant.

## Acceptance criteria

1. Equipment category initial HTML contains a product listing in BG, RU and EN.
2. Each rendered card uses a canonical product URL with the appropriate `?lang=ru|en` suffix.
3. Cards expose localized name, image ALT/title, EUR price when present, stock only when known, and SKU when present.
4. Nested category membership continues to use the existing descendant-category query.
5. The all-irrigation root order and CollectionPage ItemList match the existing React category ordering.
6. Plant category SSR output and its failure behavior remain unchanged.
7. Equipment query failure does not become an empty listing and is not edge-cached.
8. Existing React catalogue behavior remains responsible for filtering and pagination; no second interactive layer is added.
9. Tests and exact-SHA CI pass; Production raw HTML smoke is checked only after a confirmed deployment.

## Verification status

- Exact code-head CI passed on `331ffee5b548864c36497fafb788293569c4180a`: 483/483 tests, app/Pages Functions type-check, lint, website build, Studio type-check/build; D1 validation passed without applying a migration.
- Cloudflare Pages Preview deployment `ba6a681a-2865-4c40-815e-27216bc510e5` succeeded from that exact SHA.
- Post-hydration Preview smoke checks passed for BG/RU/EN controllers, irrigation root and nested categories. These do not verify the initial HTTP HTML.
- Raw first-response HTML verification remains open because available Firecrawl snapshots are post-hydration and Browser Use was unavailable. Production merge/deployment remains pending.
- No Sanity, D1, Cloudflare configuration, secrets, orders or email writes are part of this task.
