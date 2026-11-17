# Landscape architect route CLS stabilization audit — 2026-11-17

## Scope and baseline

Target route: `/services/category/landshaften-arhitekt`.

Owner-supplied mobile PageSpeed Insights run (2026-11-17 05:45, Lighthouse 13.6.0, Moto G Power, simulated slow 4G):
- Performance: 72
- FCP: 0.9 s
- LCP: 2.9 s
- TBT: 0 ms
- CLS: 0.693
- Speed Index: 1.7 s

The report attributes a 0.693 layout shift to the Footer. It also identifies the direction hero image and late-loading content, render-blocking CSS (estimated 160 ms), unused JavaScript (estimated 60.6 KiB), and a missing preconnect to `bxvcy0qs.apicdn.sanity.io`. These are Lighthouse diagnostics, not proof that each item independently caused the Footer shift.

## Source and live-content checks

- Repository `omaraandrey-dev/florial`, `main` at base SHA `8ac61c3779ada9b84da003315b52e868b6c8b332`.
- Read `AI_INSTRUCTIONS.md`, `docs/AI/START_HERE.md`, `docs/AI/WORK_PROTOCOL.md`, `docs/AI/MASTER_SPEC.md`, `docs/TECHNICAL_PASSPORT.md`, `CHANGELOG.md`, `docs/AI/OPEN_QUESTIONS.md`, and `docs/ROADMAP_PERFORMANCE_OPTIMIZATION.md`.
- Code inspection: the direction route mounted `ServiceDirectionPage` while Sanity data was loading. The hero image appeared only after role-photo data arrived; the service section initially displayed a short text line and then replaced it with cards; the landscape portfolio section was absent until a separate five-slug blog query completed.
- Read-only Sanity Production query confirmed the active `serviceDirection` document ID `058dbdb5-a5d4-4809-afdb-c02b16d098e2`, category `landscaping`, and the active photo ID `623e4ea6-6e5f-450b-a129-3468f79c48f7` with a 1024×1024 image. The published service query returned two active `landscaping` services. No Sanity documents were written.
- The previous main changelog records that the five selected landscape portfolio articles are published with localized BG/RU/EN card metadata. No article content was changed.

## Changes in this increment

- Reserve the landscape hero image's square display area before the Sanity photo URL is available; retain eager loading and high fetch priority for the actual LCP image.
- Replace the short service-loading text with two card-shaped placeholders matching the two active landscaping services; reserve a minimum section height.
- Render the portfolio section from the first render and reserve five card-shaped placeholders while its exact-slug Sanity request is pending. Keep the existing five article records, order, images, translations and links unchanged.
- Add route-specific initial-HTML preconnect hints for `https://bxvcy0qs.apicdn.sanity.io` and `https://cdn.sanity.io` on this one service-direction route.
- Add regression tests for reserved hero/service/portfolio space and the route-specific resource hints.

## Files changed

- `src/pages/ServiceDirectionPage.tsx`
- `functions/_middleware.ts`
- `tests/content-route-performance.test.mjs`

No Header, menu, Footer, global shell, route definitions, Sanity content/schema, D1, Resend, secrets, DNS or Cloudflare settings were changed.

## Verification status

- GitHub branch created directly from the confirmed current `main` SHA above.
- Git diff checked: three runtime/test files only; branch was three commits ahead and zero commits behind at the first diff review. Test assertion cleanup was then committed separately.
- Read-only Sanity Production queries succeeded for the direction, role photo and active services.
- Local `typecheck`, `lint`, `test` and `build` were not run in this environment because GitHub could not be cloned from the local shell (network DNS unavailable).
- GitHub Actions on exact final implementation head `fb8d3692fc4bf3ede316f9d1611ac09fc03be8f4`:
  - Blog and Studio workflow run `44013780067` — **success**. Type-check, lint, all 283 tests (283 passed, 0 failed), website build, migration script syntax checks, read-only migration dry-run, Studio type-check and Studio build all passed.
  - D1 migration validation run `44013780158` — **success**. Lint, website build, Pages Functions syntax and both isolated additive migration validations passed. No live D1 write was performed.
- Cloudflare Pages Preview deployment `abe3f063-123c-41ef-bf3b-ca98daf7192f` succeeded for exact head `fb8d3692fc4bf3ede316f9d1611ac09fc03be8f4`: https://abe3f063.florial.pages.dev.
- Read-only Cloudflare Browser Rendering smoke on Preview at 390×844 returned HTTP 200 and confirmed the localized page title, both Sanity preconnect tags in HTML, the 358×358 hero image, two service links, five portfolio links and rendered Footer. A buffered layout-shift observer installed at DOMContentLoaded reported CLS 0 with no captured entries in this browser session. This is a Preview smoke observation, not a matched Lighthouse measurement and not proof of zero cold-navigation CLS.
- Matched Lighthouse reruns and a Chrome Performance trace remain pending. No PageSpeed score/LCP/CLS improvement is claimed yet.
- Production merge/release was not performed. Production deployment is not authorized by this change; merge/release should follow the owner's established approval gate.

## Acceptance checks still required

1. Exact PR-head CI: typecheck, lint, automated tests, build and Pages Functions validation.
2. Preview route visual/network checks in BG/RU/EN, mobile 390 px and desktop; confirm the hero image dimensions/currentSrc, no horizontal overflow, and no console/runtime errors.
3. Record a browser Performance trace and verify that the Footer no longer shifts when the hero, two service cards and five portfolio cards resolve.
4. Run at least three matched mobile Lighthouse tests and compare medians with the supplied baseline. Target CLS ≤ 0.1 and LCP ≤ 2.5 s; these are goals, not measured outcomes.
5. After merge, verify the exact Cloudflare Pages deployment commit before any Production performance claim.
