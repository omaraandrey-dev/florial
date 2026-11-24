# SSR Content v1 — Phase 1 homepage discovery

**Date:** 24.11.2026  
**Repository baseline:** `omaraandrey-dev/florial`  
**main SHA inspected:** `f4e04913a2876bf863deef9fa1b7774b5c416a47`  
**Status:** read-only code discovery; no implementation or live data writes.

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
- No application code changed.
- No Sanity documents/schema changed; no Sanity writes performed.
- No Cloudflare settings/secrets, D1 schema/data, orders, email or Production settings changed.
- No claim of raw Production HTML verification is made in this audit.
