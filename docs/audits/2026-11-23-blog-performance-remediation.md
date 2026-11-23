# Blog performance remediation — 2026-11-23

## Owner-supplied baseline

PageSpeed Insights mobile report for `https://florial-bg.com/blog`, captured 23.11.2026 22:57 GMT+2, Moto G Power emulation, Lighthouse 13.6.0, low-end 4G:

- Performance 79; FCP 0.9 s; LCP 2.7 s; TBT 10 ms; CLS 0.337; Speed Index 2.9 s.
- CrUX/field data: unavailable in the supplied report.
- The reported layout shift (0.337) is attributed to the footer element. This is consistent with the blog content being absent during both the lazy-page chunk load and the subsequent Sanity list request, allowing the footer to enter the initial viewport before the long page content appears.
- Initial dependency chain includes the main JS bundle (156.46 KiB), six Sanity requests, and the page CSS (15.8 KiB; estimated render-blocking delay 330 ms).
- Two initial Sanity requests are unrelated full category indexes: equipment categories with nested product counts and plants categories with nested product counts. The blog route does not consume the full category state; Header uses separate compact projections.
- The report identifies oversized responsive image candidates and estimates about 54 KiB potential image savings.

## Implementation scope

Code changes are limited to the blog route and shared route bootstrap:

1. `src/App.tsx`
   - Skip the two full equipment/plants category-index requests on `/blog` and `/blog/*`.
   - Keep the category loader available for later SPA navigation from blog to a route that requires categories. A ref records successful completion; the route effect is keyed to the blog/non-blog transition.
   - Add a blog-specific lazy-chunk fallback with a viewport-reserving skeleton.
2. `src/pages/BlogPage.tsx`
   - Reserve at least one viewport of main-content height.
   - Replace the short loading text with layout-matched category/filter/article skeleton blocks while the published list request is pending.
   - Tighten responsive `sizes` for category and article cards and request Sanity image quality 68. Original Sanity assets and content are unchanged.
3. `functions/_middleware.ts`
   - Add route-specific preconnect hints to `bxvcy0qs.apicdn.sanity.io` and `cdn.sanity.io` for the blog index's initial HTML response. The unrelated live API origin is not preconnected for this route.
4. `tests/content-route-performance.test.mjs`
   - Add regression assertions for route-scoped category loading, reserved skeletons, blog preconnect hints and responsive image parameters.

## Explicitly not changed

- Footer, Header layout, main menu, routes, global CSS and global architecture.
- Sanity schema, datasets, published blog posts, tags, assets or any Sanity data.
- D1, Cloudflare settings/secrets/bindings/DNS, Resend.
- The 15.8 KiB render-blocking CSS has not been deferred or inlined: doing so without measured CSS/visual regression evidence risks a flash of unstyled content and further layout shift.
- Main JS bundle splitting is deferred until post-change bundle/waterfall evidence shows a safe, material opportunity. TBT is only 10 ms in the supplied baseline.

## Verification

- Baseline is the owner's single Lighthouse mobile lab run, not field data or a multi-run median.
- CI, Preview, Production deployment, live route/network checks and matched post-change Lighthouse results are to be appended after they are actually completed.
- No performance improvement is claimed until comparable post-change measurements exist.


## Release and Production verification

- PR #510 squash-merged into main at f0913f3d379c718bc140d539e5b66beb7411a8f2; exact PR head d32e6717de33aec4d1b10ca59f49002ceba35e3f. Blog/Studio validation run 45267333166 and D1 validation run 45267333146 both succeeded. Cloudflare Pages Preview deployment 905e4a1d-f586-439e-abb9-f48802b5f177 succeeded. Cloudflare Pages Production deployment b7fd5ab1-4628-46b4-90af-8d6dd1853674 succeeded from the merge commit; aliases https://florial-bg.com and https://www.florial-bg.com are attached.
- Production Browser Rendering HTML smoke (390×844 mobile viewport) passed for BG, RU and EN: localized title/intro, all four category labels, localized Filters control, footer and blog-specific preconnects to bxvcy0qs.apicdn.sanity.io and cdn.sanity.io are present; the loading skeleton is absent after content load.
- Browser Use screenshot/interaction QA could not be completed because the Browser Use project has insufficient credits. HTML smoke is not a substitute for screenshot-based visual review or actual filter/category click testing.
- A matched post-change PageSpeed Insights/Lighthouse run on the same Moto G Power / Lighthouse 13.6 / low-end 4G profile was not available during this release verification. Therefore the baseline (Performance 79, FCP 0.9 s, LCP 2.7 s, TBT 10 ms, CLS 0.337, Speed Index 2.9 s) remains the only confirmed Lighthouse measurement; no numerical improvement is claimed.
- Next measurement: run at least three mobile PSI/Lighthouse samples on Production with the same profile and compare the median to the supplied baseline; then run desktop. Specifically verify CLS < 0.1 and LCP <= 2.5 s rather than assuming the skeleton solved the measured shift.
- No Sanity schema/data/assets, Footer, Header/menu, D1, Cloudflare settings/secrets/bindings/DNS, or Resend changes.
