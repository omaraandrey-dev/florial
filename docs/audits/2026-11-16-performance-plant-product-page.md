# Plant product page performance investigation — 2026-11-16

## Owner-supplied baseline

PageSpeed Insights mobile lab report for `/product/washingtonia`, 16 November 2026, Lighthouse 13.6.0, Moto G Power, low-end 4G:

- Performance 59; Accessibility 96; Best Practices 100; SEO 100.
- FCP 0.9 s; LCP 5.0 s; TBT 10 ms; CLS 0.693; Speed Index 1.7 s.
- LCP element is the main Washingtonia product image from Sanity. Lighthouse reports that it is discoverable in the initial document, but has no `fetchpriority=high`.
- Footer accounts for 0.693 of reported layout shift; search form accounts for 0.001. A separate image-size warning is reported.
- Critical request chain contains the app JS followed by multiple catalogue and product-detail Sanity requests, including large live responses. Sanity CDN/API preconnect hints are absent.
- CSS render-blocking opportunity: 160 ms; unused JS estimate: 54 KiB.
- No CrUX field data is available. These are single-run lab results, not field measurements.

## Code findings on main before this branch

- Product routes were included in the global catalogue loader. On a direct product URL, the app requested both equipment and plant catalogues because the URL did not identify the Sanity dataset.
- Product details were fetched only after the full catalogue was loaded and the requested product was found in that catalogue.
- The product-detail loading branch displayed a short text-only placeholder, leaving the Footer exposed to a large vertical movement when the product page replaced it.
- The client product hero image did not declare eager loading or high fetch priority.
- Middleware emits a product fallback image for no-JavaScript content. The fallback was not responsive and did not reserve intrinsic dimensions. Product-page HTML did not preconnect to Sanity CDN/API hosts.

## Changes prepared in this branch

- Product routes no longer trigger full equipment/plant catalogue downloads. The product loader performs a small slug lookup against the equipment and plants datasets in parallel, then loads detailed fields only for the matching product.
- Added a product loading skeleton with viewport-height reservation during lazy module and product-data loading.
- The product main image is initialized from the product image URL and marked `loading="eager"` / `fetchPriority="high"`.
- Middleware's no-JavaScript product fallback uses a responsive Sanity URL/srcset, intrinsic image dimensions when available, eager loading and high fetch priority.
- Product HTML adds preconnect hints for Sanity image CDN and the two Sanity API hostnames.
- Added regression tests for targeted product loading, layout reservation, image priority and resource hints.

## Scope and safety

- No Sanity content/schema writes, D1 changes, Resend changes, Cloudflare settings/secrets changes or Production configuration changes.
- Header, navigation, Footer component and global shell are not modified.
- Existing product-detail projections, pricing/stock logic and cart behavior remain the downstream detail path after the slug lookup.

## Verification status

- Code review and static regression assertions are prepared in this branch.
- CI, build, Preview deployment, browser/network checks and post-change Lighthouse runs are **pending**.
- No performance gain is claimed. Compare at least three matched mobile Lighthouse runs against the owner-supplied single-run baseline; investigate actual LCP request, selected `currentSrc`, transfer bytes and Footer layout-shift trace.
- The reported CSS blocking and unused JavaScript opportunities are deliberately not changed in this increment; measure after the route/query and LCP work before splitting CSS or changing shared bundles.
