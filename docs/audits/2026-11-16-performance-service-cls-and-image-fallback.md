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
- PR #353 was merged into `main` at `74642455efe284730cdf442efc1b82182e10eda8`; Cloudflare Pages Production deployment `4060e639-d643-496d-ae3f-65706cd85000` succeeded on that exact commit. No Sanity write, content/schema change, Cloudflare settings/secrets change, D1 or Resend change was made.

## Verification checkpoint

- PR: [#353](https://github.com/omaraandrey-dev/florial/pull/353), final head `c5bce3257c5c3b847f3908abef53f212245ff428`.
- GitHub Actions on that exact head: Blog and Studio validation run `43915057217` — success; D1 validation run `43915057276` — success. The Blog/Studio workflow completed type-check, lint, website tests, website build, Studio type-check and Studio build.
- Cloudflare Pages Preview deployment `a62f6149-fb73-4535-9b1a-b3a4acf5806b` — build and deploy success on that exact head; URL: `https://a62f6149.florial.pages.dev`.
- Initial Preview browser attempt against BG/RU/EN was blocked by browser-environment `ERR_SOCKS_CONNECTION_FAILED`. A subsequent read-only Production browser check completed successfully at desktop 1440×900 and mobile 390×844: service title, breadcrumbs, hero image and Footer rendered; mobile layout reflowed with no horizontal overflow; hero measured approximately 358×269; no console errors/warnings, uncaught errors or unhandled rejections were observed. No forms were submitted. The privacy dialog and help widget remained visible and were not interacted with. This verifies visible rendering and basic responsive layout only; it does not measure layout-shift during load or inspect transfer bytes/currentSrc/initial HTML.
- No Lighthouse after-measurement has been obtained. Baseline remains the single owner-supplied run only; do not claim score improvement. Three matched mobile and desktop Lighthouse runs and a Performance trace remain outstanding.
- The common `CHANGELOG.md`, `docs/TECHNICAL_PASSPORT.md` and `docs/AI/OPEN_QUESTIONS.md` are intentionally not edited in this branch because multiple unrelated open PRs currently touch shared documentation. Consolidate the release record in one documentation integration pass after those PRs are reconciled.
