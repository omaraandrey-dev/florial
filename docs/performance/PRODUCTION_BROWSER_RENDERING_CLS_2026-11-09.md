# Florial — Production browser-rendering diagnostics (09.11.2026)

## Method
Cloudflare Browser Rendering `/browser-rendering/content`, fresh browser sessions, cacheTTL=0, JavaScript enabled for CLS runs. Viewports: mobile 390×844 and desktop 1365×900. PerformanceObserver captured buffered `layout-shift`, `largest-contentful-paint`, `paint`, and `longtask` entries. No CPU or network throttling was available in this endpoint.

A separate request with JavaScript disabled inspected the initial HTML response.

## Initial HTML verification
Category route `/category/vsichko-za-polivane`:
- HTTP 200
- SEO H1 present
- Loading placeholder absent
- Fallback image includes `width="1254" height="1254"`
This confirms the image dimension mitigation is present in the initial server HTML.

## CLS results

| Route | Mobile runs / median | Desktop runs / median |
|---|---|---|
| Irrigation category | 0 / 0.0002631 / 0.0002631 — median 0.0002631 | 0.0148097 / 0.0148097 / 0.0148097 — median 0.0148097 |
| Homepage | 0.0002631 / 0.0002631 / 0.0002631 — median 0.0002631 | 0.0148097 / 0.0148097 / 0.0148097 — median 0.0148097 |
| Blog | 0.0002631 (1 run) | 0.0148097 (1 run) |
| Blog article | 0.0002631 (1 run) | 0.0148097 (1 run) |
| Lavender planting service | 0.0002631 (1 run) | 0.0148097 (1 run) |

### Shift sources
Mobile:
- Only Header search form: previous x=108.69, width=169.27; current x=119.5, width=158.45; y=14, height=40.
- No Footer source observed.

Desktop:
- Shared content wrapper: previous y=73, height=827; current y=77, height=823.
- Header search form: previous x=323.39/y=15; current x=344.81/y=17.
- No Footer source observed.
- The same desktop shift repeated on category, homepage, blog, article and service. CLS 0.01481 is below 0.1 and is not category-specific. Header was not modified.

## LCP / FCP diagnostic medians
| Route | Mobile LCP | Desktop LCP | Mobile FCP | Desktop FCP |
|---|---:|---:|---:|---:|
| Category | 0.872 s | 0.812 s | 0.532 s | 0.324 s |
| Homepage | 1.692 s | 1.504 s | 1.296 s | 0.836 s |

These are unthrottled browser-rendering diagnostics, not Lighthouse scores, not CrUX field data and not directly comparable with the earlier CPU 4× / 150 ms latency / 10 Mbps down / 1.5 Mbps up profile.

## INP and remaining work
- No trusted user interaction was performed; Event Timing returned no interaction entries. INP is not measured.
- Long Task API observations do not substitute for INP.
- Lighthouse mobile/desktop was not run.
- Repeat the post-fix mobile 3-run CLS test with the previous controlled profile, then compare against the pre-fix median 0.3441 before closing the residual CLS item.

## Release / scope
- Runtime commit: `9bd5d3fb268d7dec9c3dab330e8039987ec78718`.
- Documentation PR #159 merge commit: `180a07d356305cc927f185cc748c615c345a48c9`.
- Documentation Production deployment: `9a70fddc-ce74-4743-9cd3-dedc5a9703c8`, success, aliases assigned.
- No Header/menu/Footer code, Sanity data/schema, D1 data/migrations, Manager, orders, checkout, API contracts or Cloudflare settings were changed.
