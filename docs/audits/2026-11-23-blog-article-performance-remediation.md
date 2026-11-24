# Blog article performance remediation — 2026-11-23

## Owner-supplied baseline

PageSpeed Insights mobile report for https://florial-bg.com/blog/podroben-landshaften-proekt-gradina, captured 23 Nov 2026 at 23:28 GMT+2, Moto G Power / Lighthouse 13.6 / low-end 4G:

- Performance 66; FCP 0.9 s; LCP 3.6 s; TBT 10 ms; CLS 0.760; Speed Index 1.7 s.
- CrUX/field data: unavailable in the supplied report.
- Footer accounted for 0.731 CLS (the Footer itself was the dominant shifting element).
- Sanity images had an estimated 105.6 KiB savings; the article cover was selected as LCP.
- Initial dependency chain included the main JS bundle and six Sanity API queries. No preconnect origins were present.
- Render-blocking stylesheet was 15.7 KiB with estimated 320 ms savings; it was deliberately left unchanged to avoid introducing FOUC or new layout shifts without separate evidence.

## Code changes

Released through PR #512, squash merge commit 2fe92f6b269fa29183cd02e7bc334d27ccb8006c.

- src/components/BlogArticleLoadingState.tsx: new article-shaped skeleton reserves at least 100svh, with space for breadcrumb/title/intro, cover and body.
- src/App.tsx: the lazy-route Suspense fallback for /blog/:slug now uses the article skeleton instead of the generic short loading state.
- src/pages/BlogPostPage.tsx: the Sanity document loading state uses the same skeleton; the cover is responsive, eager and high priority, with 960px fallback and quality 68; related article thumbnails use narrower sizes and quality 68.
- src/components/BlogContent.tsx: Portable Text images use the article content width rather than a 768px assumption, with quality 68.
- src/lib/sanityImage.ts: added an intermediate 720px responsive candidate.
- functions/_middleware.ts: initial HTML for blog posts reserves 100svh; article routes receive Sanity query/image preconnects and a responsive high-priority preload for the exact cover asset. The preload uses the same URL candidates and quality as the hydrated cover image.
- tests/content-route-performance.test.mjs: regression assertions cover article route fallback, viewport reservation, article cover preload, CDN hints and image sizing.

## Verification evidence

- PR #512: https://github.com/omaraandrey-dev/florial/pull/512 — squash-merged.
- Exact PR head: fd0ef9c279bb5d484440ff77ba3903198baac98c.
- Blog/Studio CI run 45272014683 — success (typecheck, lint, all website tests, website build, migration dry-run, Studio typecheck and build).
- D1 validation run 45272014645 — success.
- Preview deployment from final PR head fd0ef9c: 4a67958b-f4d5-4dd1-8741-7997aa6b6808 — success.
- Production deployment from exact merge commit 2fe92f6b269fa29183cd02e7bc334d27ccb8006c: e2b84205-e7a2-4164-ba20-d657dbad0a8e — success. Cloudflare reports the deployment environment as Production and branch main.
- Production Browser Rendering, mobile viewport 390×844, JavaScript disabled: HTTP 200; two Sanity preconnects, one responsive high-priority image preload, correct cover URL and min-height:100svh found in initial HTML.
- Production Browser Rendering, mobile viewport 390×844, JavaScript enabled: localized article title and .blog-content rendered; loading skeleton absent after data load; responsive image markup with quality 68 and Footer present.
- No matched post-change PageSpeed/Lighthouse run has been supplied yet. The owner should rerun PSI on the same Moto G Power / Lighthouse 13.6 / low-end 4G profile. Do not claim a numeric score, LCP or CLS improvement until measured.

## Explicitly unchanged

- No published Sanity documents, translations, tags, images, references or schema were modified.
- No Header, Footer, main menu, global CSS, route architecture, D1, Cloudflare settings/secrets/bindings/DNS, Resend or order data changes.
- No broad JS bundle split or stylesheet deferral; the measured TBT baseline was only 10 ms and the stylesheet change remains a separate evidence-gated task.
