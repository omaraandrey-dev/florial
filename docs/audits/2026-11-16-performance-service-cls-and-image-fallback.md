# Florial performance audit — service CLS and duplicate hero fallback

**Date:** 2026-11-16  
**Repository:** `omaraandrey-dev/florial`  
**Base main SHA:** `74aa6a7dd896be9e5ad0ce2df18dbe449675ec05`  
**Branch:** `perf/service-cls-and-responsive-fallback-2026-11-16`  
**Target URL:** `https://florial-bg.com/services/avtomatichno-napoyavane`

## Owner-supplied Lighthouse baseline

Mobile, Moto G Power emulation, Lighthouse 13.6.0, low-end 4G, initial page load, 2026-11-16 19:01 GMT+2:

- Performance: **60**
- Accessibility: 100; Best Practices: 100; SEO: 100
- FCP: 1.7 s; LCP: 4.5 s; TBT: 10 ms; CLS: **0.693**; Speed Index: 1.7 s
- Image delivery opportunity: estimated 268.7 KiB (Sanity image responses totalling 415.4 KiB)
- Render-blocking CSS opportunity: approximately 300 ms
- Layout shift diagnostic attributes 0.693 to the Footer moving; it also flags the hero image as missing explicit dimensions and the search form with a small 0.001 shift.

These are a single Lighthouse lab run, not CrUX/field data and not a three-run median.

## Code findings on base main

1. `src/App.tsx` rendered a short generic Suspense fallback for a lazy service page. After the lazy module loaded, a second short text-only state was rendered while the Sanity service document loaded. The actual service page is much taller. The outer app is a flex column with Footer after the page, so the Footer can move substantially when the short placeholder is replaced.
2. The category route already uses a viewport-height loading state (`CategoryLoadingState`), but service routes did not have an equivalent reserved layout.
3. `functions/_middleware.ts` inserted `doc.imageUrl` as a raw, un-sized `<img>` into the initial HTML for all document types except categories. For a service, this is not the actual hero chosen by the React page when `hero.imageUrl` exists. It duplicates a separate image request before hydration, bypasses the responsive Sanity image helper and is then replaced when React mounts.
4. The actual service hero in `src/pages/ServicePage.tsx` already uses `getSanityImageProps`, `srcSet`, `sizes`, eager loading and high fetch priority. The image helper negotiates modern formats with Sanity CDN `auto=format`.
5. The owner-supplied report's un-sized 1200×896 image with inline `max-height:360px` matches the middleware fallback markup exactly. The separate 1086×815 hero is already requested responsively (the report shows an 800×600 candidate).

## Changes in this branch

- Add a service-specific loading skeleton with `min-height: 100svh`, matching the existing category strategy. Use it both while the lazy route chunk is loading and while the Sanity service document is loading. Header, Footer, menu, route structure and service content are not changed.
- Stop inserting a second raw fallback image for service documents. The actual React service hero remains responsive; the service image URL remains in Open Graph metadata and Service structured data. Product-page fallback imagery remains unchanged; category behavior remains unchanged.
- Add regression tests for both service loading states and the middleware's image inclusion rule.

## Expected effect (hypothesis, not yet measured)

- The Footer should no longer start within the initial viewport while the service page is being fetched; this should materially reduce the large Footer-attributed CLS.
- The raw 1200×896 duplicate service image should no longer be downloaded as an initial HTML fallback. This should remove most of the 224.4 KiB estimated saving attributed to that image. The actual responsive hero remains and is not removed.
- No claim is made yet for LCP, Lighthouse score or actual transfer savings. These require a Preview browser run and at least three matched Lighthouse runs after the branch is deployed to Preview.

## Still open after this increment

- Re-measure image transfer/currentSrc and LCP on mobile and desktop; verify the hero remains visually correct and prioritized.
- Inspect the remaining CLS sources in browser Performance trace, especially the header search form and any font/layout changes.
- Investigate the 13.9 KiB render-blocking CSS separately. Do not defer the main stylesheet without a measured critical-CSS strategy, as that can introduce FOUC and another layout shift.
- Obtain three matched mobile and desktop Lighthouse runs and compare medians. Field/CrUX data remains unavailable in the supplied report.
- No Production release, Sanity write, content/schema change, Cloudflare settings/secrets change, D1 or Resend change was made.
