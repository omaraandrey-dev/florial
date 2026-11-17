# Florial performance audit — landscape direction loading-space reservation

**Date:** 2026-11-17  
**Repository:** `omaraandrey-dev/florial`  
**Base `main` SHA:** `a559939083d1af5d968e342a53357f1535811e74`  
**Branch:** `perf/landscape-direction-cls-reservation-2026-11-17`  
**Target URL:** `https://florial-bg.com/services/category/landshaften-arhitekt`

## Owner-supplied PageSpeed evidence

Mobile, Moto G Power emulation, Lighthouse 13.6.0, low-end 4G, initial page load, 2026-11-17 07:14 GMT+2:

- Performance: **70**
- Accessibility: 100; Best Practices: 100; SEO: 100
- FCP: **0.9 s**; LCP: **3.2 s**; TBT: **0 ms**; CLS: **0.693**; Speed Index: **0.9 s**
- Lighthouse attributes **0.693 CLS to the Footer**. The search form contributes 0.001.
- Render-blocking CSS opportunity: 150 ms.
- LCP hero image is already eager and has `fetchpriority="high"`.
- The report shows multiple remaining global Sanity requests. The earlier route-specific query consolidation did not remove those independent global requests.

A prior owner-supplied run reported Performance 89 and LCP 3.3 s. The current LCP is within 0.1 s of that value. A prior service-page audit also recorded CLS 0.693 attributed to the Footer. These are individual lab runs, not field/CrUX data or a controlled multi-run comparison. The available evidence does **not** establish that the Sanity query optimization caused the current score or CLS.

## Code finding on base main

- `ServiceDirectionPage` is loaded with `React.lazy`.
- The shared Suspense fallback recognizes product, category and service-detail routes, but does not recognize `/services/category/:slug`.
- Therefore the landscape direction initially receives a short generic “loading page” main element. The Footer is rendered immediately after this fallback.
- Once the lazy page module resolves, the generic fallback is replaced by the substantially taller direction page (hero, localized copy, services, FAQ and five portfolio cards). This matches the Footer-attributed layout shift in the supplied report.
- The direction page already reserves space for its service cards and portfolio after it mounts. The missing reservation is the initial lazy-module Suspense state.

## Changes in this branch

- Add a dedicated `ServiceDirectionLoadingState` for valid service-direction routes.
- Use a page-shaped skeleton: breadcrumb, square hero reservation, title/intro, article sections, service cards, FAQ rows and five portfolio-card placeholders.
- Set a conservative minimum loading height of `calc(100svh + 36rem)`, keeping the Footer outside the initial viewport while the lazy module is loading. This is a layout reservation, not a claim that the final content has exactly this height.
- Select the direction-specific fallback before the generic service fallback.
- Add a source-level regression test for fallback selection order and the reserved skeleton structure.

## Scope and safety

- Runtime change is limited to `src/App.tsx`; regression coverage is in `tests/content-route-performance.test.mjs`.
- No Footer, Header, navigation, route definitions, page content, Sanity documents/schemas, Cloudflare settings/secrets, D1, Resend or Production configuration are changed.
- Existing targeted Sanity query optimization remains intact.
- No Production deployment is performed from this branch; it will occur through the normal main deployment after merge.

## Verification checkpoint

- Runtime PR-head commit `ea81cd0eea3f0d0d2ebe688d17d8e5c484bbc882`: Blog/Studio validation run `44023981699` — success; D1 migration validation run `44023981666` — success.
- The Blog/Studio workflow completed application/Pages Functions type-check, lint, website tests, website build, migration dry-run, Studio type-check and Studio build.
- Cloudflare Pages Preview deployment `37387be0-d2e9-425d-8593-fcf77a9bee48` succeeded for the exact runtime PR-head commit; URL: `https://37387be0.florial.pages.dev`; alias: `https://perf-landscape-direction-cls.florial.pages.dev`.
- Browser visual/CLS inspection was attempted through the connected browser service but could not run because its connected account had insufficient credits. No browser pass is claimed.
- No post-change Lighthouse result is available. Do not claim CLS, LCP or Performance improvement until matched measurements are obtained. Ideally compare at least three mobile Lighthouse runs using the same device/network settings and report medians.
- Shared `CHANGELOG.md`, `docs/TECHNICAL_PASSPORT.md` and `docs/AI/OPEN_QUESTIONS.md` are intentionally not edited in this PR because other open documentation PRs overlap those common files. Consolidate the release record in one documentation integration pass after those PRs are reconciled.
