# Equipment category server-rendered catalogue — SSR Catalog v1

**Status:** CLOSED — PR #531 merged; exact-head CI, Preview and Production raw initial-HTML verification passed.  
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
9. Tests and exact-SHA CI pass; Preview first-response HTML is verified directly without JavaScript; Production smoke is checked after merge and deployment.

## Verification status

- Exact PR head `17aefbb2781d24b401310d759dbe9cb678b4e945`: Blog/Studio CI run `45466168536` and D1 validation run `45466168430` passed. Website tests: 483 passed / 0 failed; app/Pages Functions type-check, lint, website build, read-only migration dry-run, Studio type-check and Studio build passed. No migration was applied.
- Raw first-response smoke passed for BG/RU/EN using Node native `fetch()` from GitHub Actions (push run `45466157907`, PR run `45466168466`). Each initial HTML response contains 20 equipment product links; the ordered links match CollectionPage ItemList; RU/EN links retain the locale query. No JavaScript or browser hydration is involved in this proof.
- Cloudflare Pages Preview deployment `34fe3142-5306-4391-afb5-d195691361a4` succeeded from the same exact SHA.
- Production merge commit `39e756fe63993557ee7702dee4eaefc6c8111b14` deployed successfully as Cloudflare Pages deployment `d558f601-ebc0-495c-ac2a-a900214a60ca`.
- Production raw first-response smoke run `45466953350` passed against `https://florial-bg.com` for BG/RU/EN: 20 product links each, exact CollectionPage ItemList order parity, and correct RU/EN locale query suffixes. The test uses native Node `fetch()` without browser execution or hydration.
- **SSR Catalog v1 is complete.** The independent Search Console noindex/canonical discrepancies for other URLs remain a separate SEO workstream.
- No Sanity, D1, Cloudflare configuration, secrets, orders or email writes are part of this task.
