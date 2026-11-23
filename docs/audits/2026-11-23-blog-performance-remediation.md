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
