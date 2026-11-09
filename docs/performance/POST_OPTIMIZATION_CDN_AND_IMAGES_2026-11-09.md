# Florial — responsive images and Sanity CDN release report (09.11.2026)

**Production:** https://florial-bg.com  
**Main commit:** `2f35bf3151f68ecb64288ba861b97b084d21b1c9`  
**Latest Production deployment:** `100ac60e-28b9-4da3-8dc1-7197743844c4` — success; aliases `florial-bg.com`, `www.florial-bg.com`.

## 1. Releases

### PR #148 — responsive Sanity images on public content pages

- Merge commit: `0b72d45021230e7d286b42dfb116acd6ca47ee80`.
- Production deployment: `113205bf-630b-4586-a873-223dac8a9140` — success.
- Added `src/lib/sanityImage.ts`: responsive Sanity URLs, `srcSet`, `sizes`, `fit=max`, `auto=format`, `q=75`, intrinsic dimensions parsed from Sanity asset IDs.
- Applied to homepage card images, BlogSection, BlogPage, BlogPostPage/Portable Text, ServicePage and AboutPage.
- Homepage Hero background and Header logo intentionally not changed.

### PR #149 — split Sanity public CDN and live clients

- Merge commit: `606d7c8c26daee641a1890a786b54b1decda5340`.
- Production deployment: `6b84da59-f2a8-4d8b-90a1-ed415d2272b9` — success.
- `sanityClient` and `publicPlantsClient`: `useCdn: true`, `perspective: 'published'`.
- `sanityLiveClient` and existing `plantsClient`: `useCdn: false`.
- Public published content (site settings, services, blog, equipment categories, plant categories, related content, contact imagery) uses Sanity API CDN.
- Product/plant product lists and details, price/stock data, product search, recommended products, delivery tariffs and Manager plant-category reads remain on the live API.
- Server-side order validation in `functions/api/orders.ts` remains live. No Sanity writes, schema changes or data migrations.

### PR #150 — category and product images

- Merge commit: `2f35bf3151f68ecb64288ba861b97b084d21b1c9`.
- Production deployment: `100ac60e-28b9-4da3-8dc1-7197743844c4` — success.
- Applied responsive images to CategoryPage, ProductPage and public product search results.
- Candidate widths now include 160w and 240w for small thumbnails, followed by 320w–1600w.
- First four category product cards remain eager; cards below them are lazy-loaded. Existing main product image remains eager; offscreen related images are lazy.
- CartPage/checkout, Manager, Header/menu/Footer were not changed.

## 2. Controlled category image comparison

Route: `/category/rastenia`  
Profile: viewport 390×844; CPU slowdown 4×; latency 150 ms; download 10 Mbps; upload 1.5 Mbps; browser cache disabled. Three runs per deployment. Baseline is the immediately preceding Production deployment after PR #149 but before PR #150; post is the current Production deployment after PR #150.

### Browser timing medians

| Metric | Before PR #150 | After PR #150 | Difference |
|---|---:|---:|---:|
| First Contentful Paint | 428 ms | 408 ms | −20 ms (−4.7%) |
| DOM Content Loaded | 575 ms | 562 ms | −13 ms (−2.3%) |
| Load event | 691 ms | 691 ms | no change |

Raw runs:
- Before FCP: 428 / 408 / 616 ms; DCL: 575 / 570 / 620 ms; load: 691 / 678 / 724 ms.
- After FCP: 404 / 436 / 408 ms; DCL: 561 / 580 / 562 ms; load: 673 / 694 / 691 ms.

The navigation timings show a small FCP/DCL improvement and no change in median load event. The major confirmed gain is image bytes and deferring offscreen images, not a claim of a 94% page-speed improvement.

### Image network and DOM

- Before: 26 original Sanity image responses, approximately 17.9 MB total captured image-response bytes; no responsive `srcSet` on the category page.
- After: 18 unique image responses, 1,081,732 bytes total captured in the initial-load sample (about 1.03 MiB), approximately 94% less than the prior capture.
- Post-release DOM: 29 images; 28 use `srcSet`/ `sizes`; 17 images loaded in the initial sample; 0 failed.
- After scrolling through the full page, all 29 images loaded successfully; 0 failed.
- Transformed assets returned AVIF/WebP depending on browser support. Sample thumbnail URLs use 160w/240w, `auto=format`, `fit=max`, `q=75`.
- The post-release total includes the unchanged Header logo and an original social-preview image request. The Header logo is a 1547×581 PNG of about 656 KB and remains unoptimized because Header is protected from changes without approval.
- The HomePage CSS Hero background was intentionally left unchanged pending a reliable LCP measurement.

**Measurement boundary:** image byte totals are captured response content lengths for the tested page/profile, not Lighthouse scores or field Core Web Vitals. Baseline and post samples have different numbers of image responses because the new version defers below-fold images.

## 3. Sanity API CDN validation

Read-only comparison used project `bxvcy0qs`, datasets `production` and `plants`, API version `2024-01-01`, explicit `perspective=published`.

- The same read-only production site-settings query and plants category query returned HTTP 200 and matching results from `api.sanity.io` and `apicdn.sanity.io`.
- CDN response policy observed: `public, max-age=60, s-maxage=60, stale-while-revalidate=15, stale-if-error=3600`.
- In the same browser session, repeated cached query samples returned in about 10–12 ms; direct live API samples were about 116–140 ms. These are individual query timings, not full-page speed measurements.
- Live browser network inspection confirmed public content queries use `apicdn.sanity.io`; product/plant product queries and delivery tariff reads continue to use `api.sanity.io`.
- No Sanity document/schema writes were made.

## 4. Cloudflare cache audit — read-only

- Fingerprinted JS/CSS: `cf-cache-status: HIT`, `Cache-Control: public, max-age=31536000, immutable`.
- Brotli, HTTP/2 and HTTP/3 are enabled.
- HTML responses repeatedly returned `cf-cache-status: DYNAMIC` despite `Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=600`.
- No custom Cache Rules entrypoint or Page Rules were found for the zone.
- Zone defaults observed: cache level aggressive; edge cache TTL 7200 seconds; browser cache TTL 14400 seconds; Development Mode off.
- No Cloudflare settings, rules, secrets or bindings were changed. Public HTML edge caching remains a separate task requiring a carefully scoped policy and explicit approval; Manager, API, cart, checkout, orders and personalized routes must remain excluded.

## 5. Regression and production checks

- SPA mobile regression after PR #147: Home → Services list → planting service; Back/Forward; scroll restoration within 20 px on the programmatic navigation test. No JavaScript page errors or failed images.
- Production category page: localized Bulgarian title/H1, 29 images, 28 responsive image sets, no failed images; all images load after scroll.
- Product detail `/product/musa-banana`: HTTP 200, correct H1/title, four images, three responsive image sets, no failed images; price content remained present.
- Blog, service list/detail, delivery support and About public routes returned content after the CDN split.
- No forms, orders or payments were submitted.

## 6. CI and scope

- PR #148: Blog and Studio validation runs `42600383444`, `42600375484` and D1 validation `42600375557` — success.
- PR #149: Blog and Studio validation `42601448043` and D1 validation `42601447670` — success.
- PR #150: Blog and Studio validation `42602177767`, `42602171310` and D1 validation `42602171428` — success.
- Website lint, utility tests, website build, migration syntax/read-only dry-run and Studio build passed.
- No D1 files/data, Sanity documents/schemas, API order validation, Manager, cart/checkout, Header/menu/Footer layout, or Cloudflare configuration were changed.

## 7. Remaining work

1. Measure homepage LCP and identify the actual LCP element before changing the Hero background or adding preload.
2. Header logo remains a large original PNG; any Header image-source change requires explicit approval.
3. Consider a targeted Cloudflare HTML caching design only after reviewing the Pages middleware and exclusions; do not cache Manager, API, cart, checkout, orders or personalized routes.
4. Complete controlled measurements for homepage, equipment category, product detail, search, blog list/article and desktop profile. Lighthouse/CrUX, LCP, INP and CLS remain unmeasured in this report.
