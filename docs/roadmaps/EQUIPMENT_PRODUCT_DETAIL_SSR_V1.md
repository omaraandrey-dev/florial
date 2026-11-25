# Equipment product detail SSR v1 — roadmap

Created: 2026-11-25
Base main: \`e8eb2f50e709948f2ccea0b95b0df2bc2cfedeec\`
Branch: \`feat/ssr-equipment-product-pages-v1\`
PR: https://github.com/omaraandrey-dev/florial/pull/543
Production domain: https://florial-bg.com

## Goal

Serve complete individual irrigation equipment product pages in the first HTML response for crawlers and clients that do not execute JavaScript, using the existing published Sanity Production product catalogue. Keep the React ProductPage, cart, variants, navigation and plant product pages intact.

## Inventory baseline (read-only)

- 275 active published equipment products with a slug.
- 275/275 have BG, RU and EN names, localized short descriptions and localized SEO metadata.
- 275/275 have a positive EUR price and an explicit stock status.
- 0 products have \`seo.noIndex == true\`.
- 262 products have technical specifications.
- 128 products have a gallery.
- 12 products have kit components.
- 95 products have a manufacturer manual PDF.
- 118 products have related products.
- 260 products have related service/article content.
- All 275 have a product image URL through the same main-image/category-image fallback used by the client product details loader.
- All 275 have VAT included.

## Phases

### Phase 1 — inspect existing model and route behavior
Status: complete.
- Read current GitHub main instructions, current SSR roadmap, product route, ProductPage, Sanity product detail query, product schema and shared Product Offer builder.
- Confirmed current middleware only emits a short SEO fallback body and Product JSON-LD for equipment; detailed specs, full Portable Text, kit, compatibility, documents, related resources and gallery are fetched by the client.

### Phase 2 — full localized equipment product HTML
Status: implemented on Preview; automated checks pending.
- Dedicated Sanity published-product projection and versioned edge cache.
- Localized H1, short description, brand, SKU, EUR pricing, valid previous price, VAT and stock.
- Main image and gallery with safe CDN URLs, responsive srcset, dimensions and localized ALT.
- All technical specifications.
- Localized Portable Text: headings, paragraphs, lists, marks and safe links.
- Kit contents with decimal quantities and localized notes.
- Compatibility, manufacturer manual/catalog PDF, related content and related products.
- Category breadcrumbs derived from the existing category hierarchy.
- Product and BreadcrumbList JSON-LD; shared Florial Product Offer builder preserves on-request availability semantics.

### Phase 3 — exact-commit verification
Status: in progress.
- Type-check, lint, full website tests and production build.
- Raw HTTP smoke discovers all active published product slugs directly from Sanity and checks BG/RU/EN first-response HTML without JavaScript.
- Product name/H1, canonical, hreflang, robots, image, price, stock, SKU, specs, documents, related content, Product Offer and BreadcrumbList parity.
- Missing/unpublished product returns 404 noindex.

### Phase 4 — owner Preview acceptance and Production release
Status: not started.
- Owner checks representative equipment pages on desktop/mobile, including a simple sprinkler/nozzle, controller, solenoid valve and kit.
- After explicit acceptance, merge PR #543.
- Verify exact Cloudflare Pages Production deployment and rerun the full 275 × 3 raw HTTP smoke on https://florial-bg.com.
- Record release evidence and reconcile shared docs after open PR #409 is resolved.

## Boundaries

- Sanity reads only; no Sanity documents, schemas or published content changed.
- No D1 migration, Cloudflare settings/secrets/DNS, Manager, orders, Resend, Header, navigation, Footer or global layout changes.
- Plant product rendering remains on its existing path.
- Do not invent GTIN, MPN, ratings, reviews, or in-stock status for on-request products.
- Shared CHANGELOG, Technical Passport and OPEN_QUESTIONS are not edited while open PR #409 overlaps those files. This roadmap and its audit are task-specific records.
