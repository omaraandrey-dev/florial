# SSR Content v1 — Phase 6: individual articles and project publications

**Date:** 2026-11-25  
**Status:** IMPLEMENTED ON PREVIEW; exact-SHA CI and BG/RU/EN raw HTTP smoke passed; owner visual/hydration review pending; not released to Production.  
**Base main:** 01405cfba21a42f2ca6d92753a8a4e07e08d19de  
**Branch:** feat/ssr-blog-articles-v1  
**Verified code head:** f88b1f456a1df76da73ed05df3c80ac8c5962238

## 1. Objective

Render each existing published blog article/project publication at /blog/{slug} in the first HTTP HTML response for BG/RU/EN. Preserve the current public URLs, published Sanity content, BlogPostPage and BlogContent presentation, localized SEO, inline content ordering, related article selection and client behavior.

## 2. Read-only inventory

Sanity project bxvcy0qs, dataset production, perspective published:

- 27 total blogPost documents.
- 19 published documents matching isPublished == true and defined(publishedAt).
- All 19 have localized BG/RU/EN titles and body projections; the existing client fallback to BG is preserved where a localized body is empty.
- The current article bodies include Portable Text paragraphs/headings, inline image blocks and localized image ALT fields. Current published documents have no YouTube embeds in the sampled type counts; the renderer nevertheless validates supported YouTube hosts before emitting an embed.
- The separate portfolio inventory is documented in docs/audits/2026-11-25-portfolio-route-inventory.md. No separate portfolio route or document type exists; project publications are blogPost records.

No Sanity writes, schema changes, document edits, publication changes or asset changes were made.

## 3. Implementation

### Dedicated server renderer

functions/_lib/blogArticleHtml.mjs renders:

- localized breadcrumb, publication date, H1 and short description;
- cover image with responsive Sanity CDN srcset, intrinsic dimensions and high fetch priority;
- full Portable Text body in original block order: H2/H3/H4, paragraphs, bold/emphasis/underline, links, lists, blockquotes and inline images/captions;
- safe YouTube-nocookie embeds only for recognized YouTube URL formats;
- separate gallery images/captions when present;
- the existing three related articles, using the same shared-tag count and published-date ordering as the client query;
- localized back-to-blog navigation.

Text is HTML-escaped, links are protocol/host checked and internal links retain the selected language. Images are accepted only from the Florial Sanity production CDN path. Contact/legacy CTA blocks are omitted in the same cases as the existing BlogContent component; no lead is submitted.

### Middleware, metadata and structured data

functions/_middleware.ts now handles /blog/{slug} before the generic two-segment document fallback. It queries only published blogPost documents with a defined publishedAt, using the same localized body fallback and Portable Text projection as src/lib/blog.ts.

The route emits localized title/description, canonical, BG/RU/EN hreflang, index/follow robots, Open Graph/Twitter metadata, Sanity resource hints, cover preload, BlogPosting JSON-LD and BreadcrumbList. The Sanity projection and HTML are edge-cached for 60 seconds with stale-while-revalidate.

A missing/unpublished slug returns the existing localized 404/noindex response. A Sanity failure returns the localized 503/noindex/no-store response instead of a false empty article. Related-content failure is non-fatal and leaves the valid article available.

### Client continuity

src/pages/BlogPostPage.tsx reads a safe application/json article seed containing the localized full post and related cards. When slug and locale match, the client initializes from this seed and skips the duplicate initial article and related-post requests. Existing BlogContent, language switching, client navigation and SEO effects remain in place.

## 4. Regression coverage and raw HTTP smoke

Added:

- tests/blog-article-ssr.test.mjs — Portable Text, localization/fallback, links, image safety, video validation, contact CTA behavior, gallery, related cards, metadata, JSON-LD and hydration seed.
- scripts/smoke-blog-articles-ssr.mjs — native-fetch first-response tests for every published article in BG/RU/EN without executing JavaScript, including the missing/unpublished 404 case.
- .github/workflows/blog-articles-ssr-smoke.yml — waits for the exact Cloudflare Pages deployment before testing the Preview alias; on main push, runs against Production.

### Exact-SHA Preview evidence

- Cloudflare Pages Preview deployment: 384879e6-739c-40cb-9feb-d0bed21bc4a7
- Commit: f88b1f456a1df76da73ed05df3c80ac8c5962238
- Deployment URL: https://384879e6.florial.pages.dev
- Branch alias: https://feat-ssr-blog-articles-v1.florial.pages.dev
- All Cloudflare stages (queued, initialize, clone, build, deploy) succeeded.

### GitHub Actions

- Blog article SSR raw HTTP smoke: run 45561362557 — success on exact code head.
- Blog and Studio validation: run 45561362468 — success; application/Pages type-check, lint, 521/521 website tests, website build, read-only migration dry-run, Studio type-check and Studio build passed.
- D1 migration validation: run 45561362407 — success; no migration applied.
- Blog index regression smoke: run 45561362527 — success.
- Services directory smoke: run 45561362465 — success.
- Service detail smoke: run 45561362564 — success.
- Equipment SSR smoke: run 45561362543 — success.

The article smoke discovered all 19 published article URLs from the server-rendered /blog index and checked each route in BG/RU/EN without JavaScript: **57 successful article responses**. It verified HTML language, robots, canonical, all hreflang alternates, localized H1, Portable Text body block count against the hydration seed, cover/responsive images, related-card count/seed, BlogPosting JSON-LD and BreadcrumbList. The missing/unpublished slug returned HTTP 404 with noindex.

**Pending:** owner visual/hydration review on desktop and mobile. No Production deployment or release is included in this PR.

## 5. Scope and safety

No changes to Sanity schemas or documents, D1 schema/data/migrations, Cloudflare settings/bindings/secrets, orders, Manager, Resend, lead submission, Header, main navigation, Footer, global layout or public URL structure. No Production release is included in this PR.

## 6. Shared documentation boundary

CHANGELOG.md, docs/TECHNICAL_PASSPORT.md and docs/AI/OPEN_QUESTIONS.md are not changed while open PR #409 still overlaps those shared files and is based on an older main. Reconcile that PR before editing shared documents; do not overwrite its diff. The SSR roadmap and unique audit records are updated in this feature branch.

## 7. Next action

1. Complete exact-head CI and Cloudflare Preview deployment.
2. Inspect the raw Preview HTML smoke for all 19 published articles in BG/RU/EN.
3. Ask the owner to inspect representative long/short articles on desktop and mobile, including inline images, body order, related cards and locale switching after client startup.
4. Only after owner acceptance, merge and verify the exact Cloudflare Production deployment plus the push-triggered Production raw HTTP smoke.
