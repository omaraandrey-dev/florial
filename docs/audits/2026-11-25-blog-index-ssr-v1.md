# SSR Content v1 — Phase 4: blog index /blog

**Date:** 2026-11-25  
**Status:** implementation on feature branch; exact-SHA CI, Preview and raw HTTP smoke pending.  
**Base main:** 28afdf7e895d1b6dbf6d32302e4ffc7dd60b3dab  
**Branch:** feat/ssr-blog-index-v1

## 1. Objective

Render the existing /blog index in the first HTML response for BG/RU/EN, so crawlers and clients that do not execute JavaScript receive the published articles, localized text, images, dates and crawlable article links. Preserve the current client-side BlogPage, topic filters, tag filters, year filter, search, sorting and URL structure.

## 2. Read-only content inventory

A read-only query against Sanity project bxvcy0qs, dataset production, perspective published, returned **19** documents matching:

- _type == "blogPost"
- isPublished == true
- defined(publishedAt)

The query was tested with the exact card projection used by the middleware. It returns _id, slug, publishedAt, tags, cover asset URL/alt/caption, and localized title, shortDescription, coverAlt.

The existing client fetchBlogPosts(undefined, language) has no pagination or page-size limit and sorts by publishedAt desc. The SSR query preserves that full published list and order. The client uses language-specific values with BG fallback; the server projection follows the same fallback. The current route has four curated topic directions and retains the same reviewed slug/tag mapping.

**No Sanity documents or schemas were changed.** No create, patch, publish, unpublish or delete operation was performed.

## 3. Implementation

### Dedicated renderer

functions/_lib/blogIndexHtml.mjs renders:

- localized H1 and introduction;
- breadcrumb navigation;
- the four existing topic-direction cards and their current matching counts;
- article cards in the existing newest-first order;
- localized titles, descriptions, dates, cover alt text and article links;
- responsive Sanity CDN image URLs with srcset, sizes, intrinsic dimensions where available, lazy loading and first-image priority;
- a visible filter summary placeholder before client interactivity is available.

Untrusted text is HTML-escaped. Image URLs are accepted only from the expected HTTPS Sanity production CDN path.

### Middleware and metadata

functions/_middleware.ts now performs a dedicated read-only published Sanity query for /blog, caches the Sanity projection for 60 seconds, and caches the HTML response at the edge for 60 seconds with stale-while-revalidate.

The route emits:

- localized title and meta description;
- canonical and BG/RU/EN hreflang alternates;
- index/follow robots directives;
- Open Graph/Twitter metadata and Sanity resource hints;
- BreadcrumbList;
- CollectionPage with an ItemList whose URLs and order match the rendered article cards.

A Sanity failure returns a localized HTTP 503 with noindex, nofollow, Retry-After: 30 and no-store; it does not return a false successful empty index.

### Client continuity and hydration

src/pages/BlogPage.tsx reads the same-locale JSON seed from a non-executable application/json script in the document head. It initializes the existing React post state from that seed and skips the duplicate initial list request. The seed element is removed after parsing. When the language changes, the existing localized client fetch remains available.

The client continues to own all interactive filtering, search and sorting. Its SEO effect restores both CollectionPage and BreadcrumbList after the normal client route SEO cleanup. Metadata fallbacks are aligned with the server metadata.

## 4. Regression coverage and raw HTTP smoke

Added:

- tests/blog-index-ssr.test.mjs — localized HTML, all-card ordering, category cards, responsive images, canonical/hreflang, CollectionPage/ItemList/BreadcrumbList, escaping, safe JSON seed, hydration continuity and taxonomy parity with the client route.
- scripts/smoke-blog-index-ssr.mjs — native Node fetch against BG/RU/EN first responses, with no JavaScript execution; checks card count/order against JSON-LD and hydration seed.
- .github/workflows/blog-index-ssr-smoke.yml — runs on PR Preview and on main push against Production.

**Pending:** exact-head CI, Cloudflare Pages Preview deployment, and BG/RU/EN raw HTTP smoke. No test or deployment success is claimed until those results are available.

## 5. Scope and safety

No changes were made to:

- Sanity schemas or published documents;
- D1 schema/data or migrations;
- Cloudflare settings, bindings or secrets;
- orders, Manager, Resend or lead-submission endpoints;
- Header, main navigation, Footer or global layout;
- public blog/article slugs or route structure;
- existing article detail rendering.

The JSON hydration seed is derived only from the same published Sanity projection used for SSR. No form submission or business side effect is introduced.

## 6. Shared documentation boundary

CHANGELOG.md, docs/TECHNICAL_PASSPORT.md and docs/AI/OPEN_QUESTIONS.md are not changed because open PR #409 is based on an obsolete main and overlaps those shared files. Reconcile PR #409 before editing them; do not overwrite its diff. This phase audit and the SSR-specific roadmap are updated independently.

## 7. Next action

1. Open/validate the PR and wait for exact-head CI and Preview deployment.
2. Inspect the raw Preview HTML smoke for all three locales.
3. Ask the owner to inspect /blog on desktop and mobile, including images, article ordering and filter behavior after hydration.
4. Only after owner acceptance, merge and verify the exact Cloudflare Production deployment plus the push-triggered Production raw HTTP smoke.
