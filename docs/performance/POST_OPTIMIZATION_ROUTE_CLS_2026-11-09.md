# Florial — controlled route CLS audit (09.11.2026)

**Production deployment during measurement:** `28d3d2c0-6046-4c75-8a2c-723b4e89c9eb` — success; main commit `81114ccd42740a3fedbcd1d7eec113b7b1eef935`.

## Profile and method

- Viewport: 390×844.
- CPU slowdown: 4×.
- Network: 150 ms latency, 10 Mbps download, 1.5 Mbps upload.
- Browser cache disabled.
- Three cold navigations per route.
- `PerformanceObserver` collected buffered `layout-shift` entries excluding `hadRecentInput`.
- Session-window CLS grouped entries when the gap was at most 1 second and the window length at most 5 seconds; median of three runs reported.
- This is a controlled lab/browser sample, not field CrUX data or a Lighthouse score.

## Results

| Route | Run 1 | Run 2 | Run 3 | Median session CLS |
|---|---:|---:|---:|---:|
| `/` | 0.0002 | 0.0002 | 0.0002 | **0.0002** |
| `/category/vsichko-za-polivane` | 1.0443 | 1.0443 | 1.0443 | **1.0443** |
| `/product/musa-banana` | 0.7005 | 0.7005 | 0.7005 | **0.7005** |
| `/blog` | 0.6124 | 0.6124 | 0.6124 | **0.6124** |
| `/blog/montazh-podmyana-remont-razpruskvachi-nesebar` | 0.7805 | 0.7805 | 0.7805 | **0.7805** |

## Main shift sources

- Homepage: only a tiny header search-form shift (`0.000249`).
- Irrigation category: an initial shift of about `0.34385` from nodes not resolved by the browser source API, a tiny header search-form shift (`0.000249`), and a major Footer shift of about `0.70024`.
- Product: major Footer shift about `0.70024`, plus the tiny header search-form shift.
- Blog: Footer shifts about `0.20576` and `0.40640`, plus the tiny header search-form shift.
- Article: initial small shifts about `0.01408` and `0.02799`, followed by a major Footer shift about `0.73815`, plus the tiny header search-form shift.

The Footer is the dominant reported source on all four affected internal routes. Source inspection of `src/App.tsx` shows the shared root flex column, route-level Suspense fallback, and separate short loading placeholders for product/category/service detail routes; `<Footer />` renders after the Suspense boundary. This is consistent with asynchronous route content changing the available main-area height and moving the Footer. It is a strong working diagnosis, not proof that a single class is the only cause.

## Recommended bounded fix — not implemented

Prepare a narrowly scoped change in `src/App.tsx` to reserve a stable minimum height for the shared route-content area while lazy chunks and route data load, or use route-shaped loading placeholders with a stable vertical footprint. Preserve page content, SEO, navigation, Header, menu and Footer. Do not modify the Footer component.

**Approval required:** MD2 rev42 explicitly requires user approval before changing shared layout/loading behavior in `src/App.tsx`. No implementation has been made.

## Scope and other checks

- All five routes returned HTTP 200 in all runs.
- No failed images; responsive srcset counts remained correct on the tested routes.
- No JavaScript page errors observed.
- No real orders, payments, service leads or forms were submitted.
- No Sanity/D1/API/Manager/Cloudflare configuration writes were made.

## Deployment ancestry finding

- Stale documentation commit `51ef6b56f475232275dceb0a5ad94310cee9d768` (MD2 rev35) has parent `612b47134dbc8ad5813222def4868f934aa8cade`; its tree lacks responsive catalog image helper and route lazy-loading changes.
- Stale documentation commit `6a4eea12ddc67c4fd44092446e4f66565dae9880` (MD2 rev41) has parent `2f35bf3151f68ecb64288ba861b97b084d21b1c9`; it predates PR #152 Hero LCP change.
- Those commits triggered successful Pages deployments from branch `main` but were not descendants of the then-current runtime line. The Pages build matched the commit it received; this was a Git branch ancestry/push issue, not a Cloudflare cache issue.
- The current main line was restored to the correct ancestry and the current production deployment uses the PR #152 runtime. For future doc-only changes, create the branch from current `main`, open a PR, and verify the merge parent before publishing.

