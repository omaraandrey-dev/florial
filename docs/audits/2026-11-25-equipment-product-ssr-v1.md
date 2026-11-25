# Equipment product detail SSR v1 — implementation audit

Date: 2026-11-25
Status: RELEASED to Production; owner visual acceptance completed; exact-commit CI, Preview and Production raw HTTP smoke passed.

## Repository and release state

- Repository: \`omaraandrey-dev/florial\`
- Base main: \`e8eb2f50e709948f2ccea0b95b0df2bc2cfedeec\`
- Branch: \`feat/ssr-equipment-product-pages-v1\`
- PR: https://github.com/omaraandrey-dev/florial/pull/543
- Current implementation commit at audit creation: \`f01ed43cc81b8459de25dcab8422c9afa8a21010\`
- Preview alias: https://feat-ssr-equipment-product-p.florial.pages.dev
- PR #543 was squash-merged to `main` as `7465914b61f859768b073d1f678f9d22161e9ba6` on 2026-11-25.
- Permanent development branch `develop` was synchronized with this release by merge commit `04a615d3f8f19d7ab36a0ea0f3926aae5a14b762`.

## Existing behavior confirmed from main

- Middleware route matching already covers \`/product/{slug}\` and \`/products/{slug}\`, and normalizes legacy \`/products\` to canonical \`/product\`.
- Existing equipment product route used the generic short SEO fallback body and a Product JSON-LD helper.
- The detailed React ProductPage loads equipment product data through \`src/lib/routeData/productDetails.ts\`.
- The shared \`src/lib/productJsonLd.mjs\` builder is used for canonical Product Offer data. On-request availability is intentionally omitted rather than represented as pre-order or in-stock.

## Read-only Sanity Production inventory

Dataset: \`production\`.

- 275 active published equipment product documents with a slug.
- 275/275 have BG, RU and EN names, short descriptions and localized SEO metadata.
- 275/275 have a positive EUR price and explicit stock status.
- 0 products have \`seo.noIndex == true\`.
- 262 products have specifications; 128 have gallery images; 12 have kit components; 95 have a manual PDF; 118 have related products; 260 have related service/article content.
- All 275 have a usable product image through the same main-image/category-image fallback used by the existing client loader.
- All 275 have \`vatIncluded == true\`.

## Implemented changes

1. \`functions/_lib/equipmentProductHtml.mjs\` and \`.d.mts\`
   - Full localized product HTML renderer.
   - Safe Portable Text renderer and safe internal/external links.
   - Safe Sanity image/PDF URL validation, responsive images and image dimensions.
   - Product price/old price/VAT/stock, SKU and brand.
   - Specifications, gallery, kit components, compatibility, PDFs, related content and related products.
   - Localized category breadcrumb trail.
   - Product + Offer and BreadcrumbList structured data; Offer is delegated to the existing shared \`buildProductOffer\`.

2. \`functions/_middleware.ts\`
   - Dedicated read-only equipment product GROQ projection with product-specific cache namespace \`equipment-product-detail-v1\`.
   - Cached category hierarchy for localized product breadcrumbs.
   - Equipment product routes use full renderer and dedicated structured data; plant products remain on the existing fallback path.
   - Existing canonical/hreflang/noindex handling is retained.
   - Product response edge cache: \`s-maxage=60, stale-while-revalidate=120\`.

3. Tests and smoke
   - \`tests/equipment-product-ssr.test.mjs\` covers localized metadata, complete content sections, escaping, safe URLs and Product Offer/BreadcrumbList.
   - \`scripts/smoke-equipment-product-ssr.mjs\` discovers active published product slugs from Sanity and checks all BG/RU/EN raw HTTP pages.
   - \`.github/workflows/equipment-product-ssr-smoke.yml\` runs type-check, lint, tests, build, exact Preview deployment wait and all-product smoke.

## Exact-head verification — 2026-11-25

- Cloudflare Pages Preview deployment for exact head `aeb39da7bc8b28582a6d66888c1e12b4223817f8`: successful; deployment ID `09fb1058-b9fd-436a-a0e5-bfa7021cf220`; Preview alias https://feat-ssr-equipment-product-p.florial.pages.dev.
- Product SSR validation run `45575255994`: success; type-check, lint, all 535/535 website tests and build passed. The product raw HTTP job discovered 275 active published products and passed all 275 BG + 275 RU + 275 EN pages (825 responses), including localized H1, metadata, price, stock, images, technical data, Product/BreadcrumbList JSON-LD and 404/noindex for a missing product.
- Blog/Studio validation run `45575255995`: success; full app/Pages and Studio checks completed.
- D1 validation run `45575255885`: success; no migration applied.
- Regression raw HTTP workflows on the same head passed: equipment catalogue `45575255936`, services directory `45575255857`, service details `45575255971`, blog index `45575255951`, blog articles `45575255992`, and equipment SSR `45575256124`.
- Two existing assertions in `tests/content-route-performance.test.mjs` initially failed because they expected the pre-equipment-product middleware condition and single-argument image-preload call. The assertions were updated to cover the new `equipment-product` page type and its responsive preload sizes. On the verified head all 535 tests pass.
## Production release verification — 2026-11-25

- Cloudflare Pages Production deployment `25504afc-2b42-4a90-9595-501c7fa08fe8` completed successfully from exact `main` commit `7465914b61f859768b073d1f678f9d22161e9ba6`; canonical aliases `https://florial-bg.com` and `https://www.florial-bg.com` are attached.
- Production workflow `45576362238` completed successfully on the exact merge commit. Validation job passed type-check, lint (101 warnings, 0 errors), all 535/535 website tests and production build.
- Production raw HTTP smoke job discovered 275 active published irrigation equipment products in Sanity `production` and passed all 825 first-response pages without JavaScript: BG 275/275, RU 275/275, EN 275/275. It verified localized details, images, price/stock, technical data and Product/BreadcrumbList JSON-LD. Missing/unpublished product returned 404 noindex.
- Regression workflows on the exact Production commit passed: equipment catalogue `45576362312`, services directory `45576362186`, service details `45576362283`, homepage `45576362337`, blog index `45576362240`, blog articles `45576362523`, and equipment SSR Preview smoke `45576362292`.
- Blog/Studio validation `45576362273` and D1 migration validation `45576362280` completed successfully. No D1 migration was applied.
- Owner visually reviewed representative equipment products on desktop/mobile and confirmed that they work. Automated visual review is not claimed; owner acceptance is the visual gate.
- No Sanity writes, D1 schema/data changes, Cloudflare settings/secrets/DNS changes, orders or emails were performed.

## Safety

- No Sanity writes or schema changes.
- No D1 migrations applied.
- No Cloudflare Production settings, secrets, domains or DNS changes.
- No changes to cart, checkout, orders, Manager, Resend, Header, main navigation, Footer or global layout.
- No plant product rendering changes.
- No GTIN/MPN/ratings/reviews invented; \`onRequest\` does not get false Offer availability.
- Shared \`CHANGELOG.md\`, Technical Passport and \`docs/AI/OPEN_QUESTIONS.md\` are intentionally unchanged while open PR #409 overlaps those shared files.

## Close-out and next stage

- PR #543 is merged and released; all 275 published equipment products × 3 locales (825 routes) passed Production raw HTTP verification.
- `develop` is synchronized with the released `main`; all future development proceeds only on `develop`.
- Next SSR roadmap stage: read-only discovery and implementation planning for `/contacts`, then `/about`, followed by the full cross-route BG/RU/EN regression.
- Shared `CHANGELOG.md`, Technical Passport and `docs/AI/OPEN_QUESTIONS.md` remain untouched while PR #409 is open and overlaps those files. Reconcile them only after a separate owner decision on PR #409.

