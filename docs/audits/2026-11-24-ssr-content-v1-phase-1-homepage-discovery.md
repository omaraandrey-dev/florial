# SSR Content v1 — Phase 1 homepage discovery

**Date:** 24.11.2026  
**Repository baseline:** `omaraandrey-dev/florial`  
**main SHA inspected:** `f4e04913a2876bf863deef9fa1b7774b5c416a47`  
**Status:** read-only discovery completed; initial implementation exists in draft PR #533 and is not merged. No live data writes.

## Confirmed current behavior

### Middleware
- `functions/_middleware.ts` handles `/`, `/contacts`, and `/about` through one static-page branch.
- For `/`, `staticPageMetadata('/', language)` returns localized title/description and only a minimal fallback body: one H1 and one short paragraph.
- Middleware inserts that minimal body into the empty `#root`, then sets localized canonical/hreflang and existing GardenStore structured data.
- Therefore the homepage's substantive sections are not server-rendered by the current root route implementation. This is verified by source code; a fresh raw Production response was not executed in this discovery pass.

### Client-rendered homepage sections
`src/pages/HomePage.tsx` currently contains:
1. Hero: H1, H2, explanatory paragraph, category/about links and background image.
2. Services: up to six ordered service entries, including a dedicated delivery entry.
3. Plant categories: six explicitly selected category IDs (`plants-root`, `plants-palms`, `plants-olives`, `plants-trees-shrubs`, `plants-solitaires`, `plants-flowers`).
4. Featured plants: up to four visible cards after filtering out of-stock items and products without a valid price.
5. Irrigation equipment categories: up to six entries after the existing root/child category ordering.
6. Featured irrigation equipment: up to four visible cards after stock, price and image filtering.
7. Blog/portfolio teaser: `BlogSection`, showing the two pinned slugs `podroben-landshaften-proekt-gradina`, `cena-sistema-avtomatichno-napoyavane-burgas` plus one latest non-pinned article when available.

Heading outline currently includes one H1, a hero H2, and H3/H4 for services, plants, equipment and cards. Preserve it unless the owner separately approves editorial restructuring.

### Current client-side data sources and selection rules
- Equipment categories: Sanity `category` query, sorted by `sortOrder`; visible category calculation retains populated categories and their ancestors, excludes `electromagnetic-valves`.
- Plant categories: public plants dataset, with the homepage's fixed six IDs selected separately.
- Hero background: active `photo` document with slug `florial-homepage-hero-background`; the client currently has a known CDN fallback URL for immediate LCP rendering.
- Services: existing compact `headerServiceQuery` returns active services, localized names/descriptions, slug, sortOrder, category/layout and image/alt fields. `HomePage` then applies `getOrderedServiceEntries` and takes six.
- Featured plants: public plants dataset, published/non-draft active plant product, `isFeatured == true`, slug and main image required, sorted by `sortOrder asc, name asc`, first eight fetched; UI filters out-of-stock and products without a positive price, then displays four. Variant pricing/stock is handled by `getPlantPrice` and `getPlantStockStatus`.
- Featured equipment: equipment dataset products referencing ready-kits category ID `6709cd41-18c6-4c5f-bc27-90d55d685dec`, active, not out of stock, slug/image/positive price required, sorted by price/name, first twenty fetched. `selectFeaturedEquipment` excludes two named kits from the first three regular picks and appends the six-zone kit if present; UI applies final stock/price/image filters and displays four.
- Blog teaser: `BlogSection` separately requests the two pinned slugs and latest ten; it shows the pinned results plus one latest item not already pinned.
- All of the above currently load in React effects after the initial document.

## Implementation implications

1. Do not build a second set of editorial rules. Extract/reuse or faithfully mirror the exact existing projections, filters, sorting, pinned selections and locale fallback.
2. The middleware should request only homepage-sized projections, in parallel, with bounded result counts. Do not fetch full plant/equipment catalogues.
3. Build a dedicated homepage HTML renderer/helper rather than embedding a large string template in the middleware. Keep HTML escaping, image URL safety, localized labels, link generation and structured data isolated and testable.
4. Reuse the same data contract for initial server HTML and client hydration where practical. If client code refetches after hydration, ensure the selection/order is identical and there are no duplicate cards or visual jumps.
5. The hero LCP image needs one deliberate loading strategy. The current client fallback and later Sanity resolution must not cause a second oversized download after SSR.
6. Treat service/blog/portfolio source documents as read-only. No Sanity writes are needed for this implementation.
7. Do not change Header, Footer, global layout or routes. The SSR work is confined to the root page body and its data/rendering path plus focused tests.

## Required next implementation tasks
- Inspect the remainder of `HomePage.tsx` to capture all rendered fields, link targets, image alt/title and exact section order.
- Inspect existing middleware Sanity fetch utilities, caching/error conventions, route tests and raw-HTML smoke workflow to choose a compatible server data access pattern.
- Implement a focused helper and root-route middleware integration on a new branch from the then-current `main`.
- Add unit/regression tests for section presence, locale fallback, selection order, escaping, image attributes and bounded HTML.
- Add a raw HTTP smoke workflow for `/`, `/?lang=ru`, `/?lang=en` that uses native fetch and never executes JavaScript.
- Verify exact-SHA CI and Preview first. Production release requires the normal explicit phase release decision and exact deployment verification.

## Boundaries / not done
- Application code changes exist only on branch `feat/ssr-homepage-content-v1` in draft PR #533; they are not merged into `main`.
- No Sanity documents/schema changed; no Sanity writes performed.
- No Cloudflare settings/secrets, D1 schema/data, orders, email or Production settings changed.
- No claim of raw Production HTML verification is made in this audit.


## Implementation pass — draft PR #533

**Implementation base:** `07b99481571ca079a06eb5f6e44e9d903f9dc304`
**Branch:** `feat/ssr-homepage-content-v1`
**PR:** https://github.com/omaraandrey-dev/florial/pull/533
**Current PR head at this audit update:** `5f7585061f2b4bae83f9359099698842e107d28d`
**Verification:** pending exact-head CI and Preview raw HTTP smoke. No Production release.

### Initial implementation shape

- Added `functions/_lib/homepageHtml.mjs` with a dedicated, escaped HTML renderer and `homepageHtml.d.mts` declarations.
- Added `fetchHomepageHtml(language)` to `functions/_middleware.ts`. It runs bounded Sanity projections in parallel through the existing `querySanityData` cache:
  - equipment categories from `production`;
  - the six existing homepage plant categories and curated featured plants from `plants`;
  - featured irrigation kits, active services, hero photo and pinned/latest blog cards from `production`.
- Preserved existing business selection rules: equipment category visibility/ancestors and fixed order; six explicit plant category IDs; plant variant-aware minimum price and stock filtering; `selectFeaturedEquipment`; `getOrderedServiceEntries`; two pinned blog slugs plus one latest non-pinned post.
- The homepage root body is now rendered from the server projection when all required queries succeed. On query failure the existing minimal static fallback remains and the response is `Cache-Control: no-store`; no false empty listing is cached.
- Added `tests/homepage-ssr.test.mjs`, `scripts/smoke-homepage-ssr.mjs` and a manual GitHub Actions workflow `.github/workflows/homepage-ssr-smoke.yml`. The smoke script uses native `fetch()` and does not execute JavaScript.
- The client React app, `HomePage.tsx`, `Header.tsx`, Footer, routing and Sanity content have not been changed in this PR branch.

### Cart discoverability finding

- `src/components/Header.tsx` currently renders the cart control as a `<button>` with an `onClick` handler and `aria-label`, not a crawlable `<a href="/cart">`.
- `functions/_middleware.ts` correctly sets `noindex, nofollow` for `/cart` and `/search`. Do not remove cart `noindex`: the personal cart state must not be indexed.
- A visible ordinary cart anchor would let crawlers discover the cart route while preserving its `noindex` response. Converting the existing Header button into an anchor with the same styling and SPA behavior requires separate owner approval because Header changes are outside the current SSR scope.
- No hidden link or invisible SEO-only link is proposed. No Header change is included in PR #533 pending owner approval.

### Current verification boundary

- Unit tests, type-check, lint and build have not yet been confirmed for the PR head.
- Preview deployment and raw first-response smoke for BG/RU/EN have not yet been confirmed.
- Production raw HTTP response has not been fetched during this implementation pass.
- No Sanity writes, D1 changes, Cloudflare settings/secrets or Production settings were made.


## 2026-11-25 — implementation parity hardening

**Code-bearing head:** `0276d4d99256a92c500487f94a501da57b36ca21`  
**PR:** #533 — `feat/ssr-homepage-content-v1`  
**Status:** implementation and technical verification passed; client startup/CLS remains an owner-decision follow-up.

### Corrections made

- Added the missing four-item value-proposition section between the hero and services, and the category-image thumbnails in the hero's plant/equipment CTAs.
- Matched the current React category flow end to end: compute populated categories and ancestors, exclude plant-category IDs from the irrigation list, exclude `electromagnetic-valves`, identify the irrigation root, then sort and take six. This matches `App.tsx` `visibleCategories` plus `HomePage.tsx` root sorting; the category query retains the same product-count projection.
- Matched the shared responsive Sanity image builder for hero, hero CTA thumbnails, category, service, product and blog images, including source width/height behavior when Sanity filenames do or do not contain dimensions.
- Matched the client plant display-name fallback and the distinct unknown-stock label (“Check availability” rather than “Available on request”).
- Added homepage `OnlineStore` and `WebSite` JSON-LD while retaining existing local `GardenStore` nodes. Cart route remains `noindex, nofollow`; no hidden link or Header change.
- Added tests for the full localized section sequence, category ancestors/exclusions, responsive image output, unknown plant stock and homepage store/site structured data.

### Verification evidence and limitations

- **Verified on code head `0276d4d99256a92c500487f94a501da57b36ca21`:** Preview deployment `5206776a-6a44-459e-9f5c-89a33f83dbff` succeeded. Raw first-response smoke run `45514703501` passed BG/RU/EN without JavaScript. Blog and Studio validation run `45514716263` passed app/Pages type-check, lint, 493/493 tests, website build, migration syntax and read-only dry-run, Studio type-check/build. D1 validation run `45514716029` passed.
- The earlier 492/493 result on `fc21108f98de7c30b57ebe5190111002258281c6` was a false-positive test assertion; it was scoped to the Magnolia plant card before the current passing run.
- No Production deployment or Production raw-response verification is claimed.
- **Client startup caveat:** `src/main.tsx` uses `createRoot`, not `hydrateRoot`; React clears/replaces initial HTML inside `#root` on startup. This branch improves first-response HTML for crawlers, but no claim is made that the SSR DOM is hydrated or that the browser transition has zero CLS. A separate approved app-bootstrap/data-readiness change is needed to preserve the initial markup until client data is ready.
- No Sanity writes, D1 schema/data changes, Cloudflare settings/secrets or Production settings changed.
