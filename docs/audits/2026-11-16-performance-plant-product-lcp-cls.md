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

No claim is made for an improved score, CLS, LCP or actual byte savings until Preview browser/network QA and matched Lighthouse measurements complete.

## Scope and safety

- No Sanity documents, Sanity schema, D1 data/schema, Resend, Cloudflare settings, secrets, DNS or Production deployment changes.
- No changes to Header, navigation/menu, Footer component or global shell.
- Product content, descriptions, SEO fields, schema.org data, prices, stock, variant selection and cart behavior are intended to remain unchanged.
- Existing category catalogue loading remains on its current path.

## Verification still required

- Run exact-head CI: type-check, lint, full tests, website build, Studio checks/build and D1 validation.
- Verify Preview deployment for exact PR head.
- Browser QA on `/product/washingtonia` in BG/RU/EN, mobile 390×844 and desktop; check image, variant selector, price/stock, gallery, cart controls, breadcrumbs and Footer. No purchase/order submission.
- Inspect initial HTML and network: ensure server image and React hero choose the same Sanity CDN candidate, no duplicate full-size download, preconnects present, and the two full catalogue queries are absent from the product route.
- Capture three matched mobile and desktop Lighthouse runs; compare medians against the owner-supplied single-run baseline. Inspect CLS trace and image bytes/currentSrc.
- Keep the CSS render-blocking and unused-JS audits separate until these route-specific changes are measured.
