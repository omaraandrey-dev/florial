# Florial — homepage Hero LCP optimization (09.11.2026)

**Production runtime commit:** `a88ce6ca513abcad4b7ee107c441fa62ec570ec3`  
**PR:** [#152 — optimize homepage Hero LCP image](https://github.com/omaraandrey-dev/florial/pull/152)  
**Production deployment:** `6cad50d7-291a-4004-ae15-b77786f3d292` — success.

## 1. Baseline and measured element

The homepage's actual Largest Contentful Paint element was identified using the browser PerformanceObserver. Before the change, it was a `DIV` with a CSS background image from Sanity:

- Asset: `6331b4d39fc6539c970c310c48be3a48cb677d61-1518x957.png`
- Original dimensions: 1518×957.
- Original response: 2,704,931 bytes.
- Existing overlay: `rgba(247, 248, 241, 0.68)`.
- Background behavior: centered, cover.

The Hero image was confirmed as the LCP element on both mobile and desktop. No assumption based only on file size was used.

## 2. Implementation

Only `src/pages/HomePage.tsx` changed.

- Replaced the CSS background image with a decorative `img` using existing `getSanityImageProps`.
- `srcSet` and `sizes="100vw"` allow the browser to select the appropriate responsive candidate.
- Sanity transforms: `fit=max`, `auto=format`, `q=75`.
- `loading="eager"`, `fetchPriority="high"`, `decoding="async"` because this is the measured LCP image.
- The image uses `object-fit: cover` and `object-position: center`, preserving the prior centered cover crop.
- The same overlay color and opacity are retained. Hero section dimensions, text, buttons and content were not changed.
- No preload hint was added; responsive selection remains with the browser.

## 3. Controlled results

Profile for both viewport sizes: CPU slowdown 4×, latency 150 ms, download 10 Mbps, upload 1.5 Mbps, browser cache disabled, 3 runs. The original and optimized runs used the same Production host and the same profile.

### Mobile — 390×844

| Metric | Before | After |
|---|---:|---:|
| LCP median | 3,620 ms | 696 ms |
| FCP median | 404 ms | 408 ms |
| DOM Content Loaded median | 481 ms | 484 ms |
| Load event median | 482 ms | 486 ms |
| CLS | 0.00025 | 0.00025 |
| Hero image response | 2,704,931 B | 17,439 B |

- LCP samples before: 3,672 / 3,620 / 3,604 ms.
- LCP samples after: 704 / 696 / 690 ms.
- Browser selected a 480w AVIF candidate.
- LCP improved by approximately 80.8%; Hero image response bytes decreased by approximately 99.4%.

### Desktop — 1440×900

| Metric | Before | After |
|---|---:|---:|
| LCP median | 3,908 ms | 912 ms |
| CLS | 0.01417 | 0.01417 |
| Hero image response | 2,704,931 B | 141,597 B |

- Browser selected a 1518w AVIF candidate.
- LCP improved by approximately 76.7%; Hero image response bytes decreased by approximately 94.8%.
- CLS did not increase.

The measurements demonstrate a substantial LCP improvement for the measured homepage Hero. They do not establish a corresponding percentage improvement for every page or field user.

## 4. Post-release verification

- Production returned HTTP 200.
- Hero `img` has `srcSet`, `sizes=100vw`, eager loading and high fetch priority.
- Mobile selected URL: 480w AVIF, 17,439 bytes.
- Desktop selected URL: 1518w AVIF, 141,597 bytes.
- Computed style retains `object-fit: cover`, `object-position: center`; overlay remains rgba(247, 248, 241, 0.68).
- No failed Hero image and no CLS increase.
- Header, menu, Footer, other homepage sections, Sanity documents, schemas, products, orders, Manager, D1 and Cloudflare settings were not changed.

## 5. Additional route regression finding — CLS needs separate approval

Controlled route smoke on the same mobile profile found that homepage CLS remains low, but category/product/blog/article pages show substantial layout shifts during asynchronous route data loading.

Observed samples:
- Homepage: CLS 0.00025 mobile and 0.01417 desktop.
- `/category/vsichko-za-polivane`: session-window CLS approximately 1.044 in the captured run.
- `/blog`: raw layout-shift entry sum approximately 0.612 in the captured run.
- `/product/musa-banana`: raw layout-shift entry sum approximately 0.700 in the captured run.
- `/blog/montazh-podmyana-remont-razpruskvachi-nesebar`: raw layout-shift entry sum approximately 0.784 in the captured run.

For category and blog routes, layout-shift source inspection showed the Footer moving from the visible viewport to below the fold as asynchronous page content replaces a short loading state. This points to route loading/layout reservation in `src/App.tsx`, not the Hero image. The exact session-window CLS for product/article routes still needs separate capture.

Potential fix to evaluate: reserve a stable minimum height for the shared main-content/loading area or use route-shaped skeletons so the Footer does not appear in the viewport and then jump away when content arrives. This would change shared layout behavior in `src/App.tsx`; it would not require editing the Footer component. **No such change was made. Explicit user approval is required before changing this shared layout.**

Search smoke: searching `контролер` opened `/search?q=контролер`, showed 44 products, 45 images, 44 responsive image sets and zero failed images.

## 6. CI and remaining work

- PR #152 website/Studio validation run `42604050648` — success.
- PR #152 D1 validation run `42604050707` — success.
- LCP optimization is published in Production.
- Next work: decide whether to approve a targeted shared loading-area reservation to reduce CLS on category/product/blog/article/search routes. Do not change Footer, Header, menu or global layout without approval.
- Header logo remains a separate optimization candidate (~656 KB original PNG); it was not changed.
- Cloudflare HTML remains `DYNAMIC`; no Cloudflare cache rules or settings changed.
