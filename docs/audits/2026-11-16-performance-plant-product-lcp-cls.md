# Florial performance audit — plant product page (Washingtonia)

**Date:** 2026-11-16  
**Base main SHA:** `390391797dd1fe2beb8e8fcf1e1634d47580b326`  
**Branch:** `perf/plant-product-lcp-cls-2026-11-16`  
**Target:** `https://florial-bg.com/product/washingtonia`

## Owner-supplied Lighthouse baseline

Mobile, Moto G Power, Lighthouse 13.6.0, low-end 4G, initial load, 2026-11-16 19:41 GMT+2:

- Performance: **59**; Accessibility: 96; Best Practices: 100; SEO: 100.
- FCP: **0.9 s**; LCP: **5.0 s**; TBT: **10 ms**; CLS: **0.693**; Speed Index: **1.7 s**.
- Render-blocking CSS: 14.0 KiB, estimated 160 ms.
- Unused JavaScript estimate: 54 KiB from a 142.9 KiB application bundle.
- LCP element is the Washingtonia main product image. The report does not show `fetchpriority=high`; the separate raw middleware fallback image has no explicit dimensions.
- Network dependency tree includes large Sanity product-catalogue responses from both the `production` and `plants` datasets (about 94.9 KiB and 24.4 KiB in the report), alongside smaller metadata/category requests.
- The CLS diagnostic attributes 0.693 to Footer movement and 0.001 to the Header search form.

This is one Lighthouse lab run, not CrUX/field data or a three-run median.

## Code findings on base main

1. On a direct product URL, `App.tsx` treated the product route as a catalogue route and downloaded the complete equipment catalogue and complete plants catalogue before it could resolve the requested slug. Only then did it fetch the full product document and related records. The two full catalogues are not needed to render a single product detail.
2. While those requests were pending, the product route rendered a short text-only loading block. The app is a flex column with Footer after the route content. The short placeholder lets the Footer enter the viewport before the much taller product page arrives.
3. `ProductPage.tsx` initialized the selected hero image to an empty string and populated it in an effect after mount. The main image did not explicitly request eager loading or high fetch priority.
4. Middleware inserted an un-sized raw product image into the server-rendered fallback body. It did not provide responsive `srcset`, `sizes`, intrinsic dimensions or fetch priority.
5. The existing `getSanityImageProps` helper already builds responsive Sanity CDN candidates using `auto=format`; the product page can use the same candidate policy for the initial server-rendered image.

## Changes in this branch

- Product detail routes now resolve the exact slug (or ID) directly against the equipment and plants datasets, in parallel, and then fetch only the matching product detail and its related records. Full catalogue downloads remain for category pages and other catalogue workflows.
- Added a product-specific loading skeleton with `min-height: 100svh`, including the lazy-page Suspense fallback. It is scoped to the product route; Header, menu, Footer component, global shell and routing structure are unchanged.
- The product hero image state now starts with `product.imageUrl`, avoiding an empty first render followed by an effect-inserted LCP image. The hero uses `loading=eager` and `fetchPriority=high`.
- The middleware's product-only fallback body reserves at least one viewport of height so the Footer is not initially placed within the viewport while React starts.
- The middleware emits a responsive Sanity CDN image for product fallback HTML, with `srcset`, `sizes`, intrinsic width/height, eager loading and high fetch priority. The URL candidate construction mirrors the client helper.
- Product pages receive scoped preconnect hints for `cdn.sanity.io`, `bxvcy0qs.api.sanity.io` and `bxvcy0qs.apicdn.sanity.io`; these are not added to unrelated routes.
- Added regression tests for targeted product lookup, reserved product loading space, responsive server image markup and resource hints.

## Expected effect (hypothesis; not yet measured)

- Avoid downloading the two complete product catalogues before a product can render. This should shorten the Sanity request chain and reduce transferred JSON on direct product visits.
- Keep Footer outside the initial viewport while the product route loads, which should reduce the large Footer-attributed CLS.
- Make the LCP image discoverable and prioritized in the initial server HTML, and ensure the React image uses matching responsive candidates.
- Preconnect to the three Sanity origins before the browser makes product/image requests.

## Preview verification and measured results

### Build and automated checks

- Exact PR head: `97d839ea12c86c295b25043c694fadd6bb34e5ec`.
- Cloudflare Pages Preview deployment `46ec699f-c08c-46f1-98c5-c994e5f3d02e` completed successfully on that exact SHA. Preview URL: `https://perf-plant-product-lcp-cls-2.florial.pages.dev`.
- GitHub Actions passed: D1 migration validation run `43923525041` (lint, website build, Pages Functions syntax, migration validations) and Blog/Studio validation run `43923525082` (app/Pages type-check, lint, website tests, website build, Studio type-check/build, read-only migration dry-run).

### Read-only browser QA

- BG, RU and EN product content rendered correctly. Product name/H1, €600 price, stock state, 240 cm / 2.4 m / 50 L variant, gallery, related content and Footer were present. No purchase, cart, form or contact actions were triggered.
- At 390×844, `document.documentElement.scrollWidth` was 375 px and no element overflowed the viewport. Desktop 1440×900 also showed no horizontal overflow.
- No console errors or uncaught runtime errors were observed.
- Main hero DOM: responsive `srcset` (160w–1600w), `sizes="(min-width: 1024px) 50vw, 100vw"`, intrinsic 2000×2000 dimensions, `loading="eager"`, `fetchpriority="high"`. At 390 px viewport, `currentSrc` selected the Sanity CDN 960w candidate (actual decoded image 389×389 px). The document head contains the three intended Sanity preconnects.
- Resource timing showed targeted product lookup queries by slug in `production` and `plants`, followed by the matching product detail query and related-content queries. No full, unfiltered product catalogue query was present on the product route. Header/category/site-settings queries remain and are not part of the removed product-catalogue lookup path.

### Three PageSpeed Insights runs per form factor

All six runs used Lighthouse 13.6.0 against the same Preview product URL. Values below are medians of three runs; each PSI report contains both form-factor tabs.

| Metric | Owner baseline (mobile, one run) | Preview mobile median (3 runs) | Preview desktop median (3 runs) |
|---|---:|---:|---:|
| Performance | 59 | 99 | 100 |
| FCP | 0.9 s | 0.9 s | 0.2 s |
| LCP | 5.0 s | 1.7 s | 0.4 s |
| TBT | 10 ms | 0 ms | 0 ms |
| CLS | 0.693 | 0.001 | 0.018 |
| Speed Index | 1.7 s | 2.7 s | 0.8 s |

Mobile individual runs: `ozjpcqy6re` (LCP 1.8 s, SI 2.3 s), `10fuaugey6` (LCP 1.7 s, SI 2.7 s), `ss17w8zf61` (LCP 1.7 s, SI 2.7 s). Desktop tabs for the same reports: LCP 0.5/0.4/0.4 s, CLS 0.018 in all three.

Compared with the supplied single-run mobile baseline, Preview median LCP is 5.0 → 1.7 s (about 66% lower), CLS 0.693 → 0.001, TBT 10 → 0 ms and Performance 59 → 99. FCP is unchanged at 0.9 s. Speed Index is higher in the Preview runs (2.7 s vs. 1.7 s baseline), so the overall visual completion metric is not uniformly better. These are lab measurements on Preview, not field data and not a same-host Production comparison; rerun after Production release before claiming production performance values.

Preview PageSpeed SEO is 69 because the Preview response intentionally carries `X-Robots-Tag: noindex` and `noindex, nofollow` meta. Preview `robots.txt` allows crawling, but the noindex response header is authoritative. This is Preview-only and does not change Production indexing. Do not remove Preview noindex.

### Remaining work

- PR #354 was squash-merged into `main` at `fb3bc874bf5228211511de5267824d3840f4f1c0`.
- Cloudflare Pages Production deployment `2514fc0b-a708-41de-962f-5919d05c4519` completed successfully for that exact commit; branch `main`, aliases `https://florial-bg.com` and `https://www.florial-bg.com`.
- Post-merge D1 validation run `43944981077` passed. Blog/Studio validation run `43944980984` was still in progress at the time of this audit update; website type-check, lint, utility tests, website build, migration syntax and read-only migration dry-run had passed, with Studio build still running.
- Production browser visual smoke and the three matched mobile/desktop Lighthouse reruns on `https://florial-bg.com/product/washingtonia` remain **not confirmed**. Preview measurements must not be presented as Production results.
- Remaining Preview opportunities: approximately 18 KiB image delivery, 160 ms render-blocking requests on mobile (50 ms desktop), and about 41 KiB unused JavaScript. Treat these as a separate measured optimization pass after Production confirmation.

## Scope and safety

- No Sanity documents, Sanity schema, D1 data/schema, Resend, Cloudflare settings, secrets, DNS or Production deployment changes.
- No changes to Header, navigation/menu, Footer component or global shell.
- Product content, descriptions, SEO fields, schema.org data, prices, stock, variant selection and cart behavior are intended to remain unchanged.
- Existing category catalogue loading remains on its current path.


## 2026-11-16 — PR #354 merged and Production deployment verified

- PR #354 was squash-merged into `main`; merge commit `fb3bc874bf5228211511de5267824d3840f4f1c0`.
- Cloudflare Pages Production deployment `2514fc0b-a708-41de-962f-5919d05c4519` deployed the exact merge commit successfully. Production aliases: `https://florial-bg.com` and `https://www.florial-bg.com`.
- The D1 validation workflow completed successfully. The Blog/Studio validation workflow was still running when this record was written; completed website checks and Studio build state are recorded above and must be refreshed before claiming the whole post-merge workflow passed.
- Production browser smoke and Production Lighthouse comparisons remain open; Preview metrics are not Production evidence.
