# SSR Content v1 — Phase 4: blog index /blog

**Date:** 2026-11-25  
**Status:** RELEASED to Production; owner accepted desktop/mobile visual and hydration behavior; exact Production deployment and BG/RU/EN raw HTTP smoke passed.  
**Base main:** 28afdf7e895d1b6dbf6d32302e4ffc7dd60b3dab  
**Merged main SHA:** 01405cfba21a42f2ca6d92753a8a4e07e08d19de

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

### Exact-SHA Preview evidence

- Cloudflare Pages Preview deployment: d037a5bc-6e26-4665-8410-904ddd9a2f36
- Commit: 7527d28d68046d61d4ec0ffbc4084f19f80cf855
- Deployment URL: https://d037a5bc.florial.pages.dev
- Branch alias: https://feat-ssr-blog-index-v1.florial.pages.dev
- All Cloudflare Preview stages completed successfully.

### GitHub Actions

- Blog index raw HTTP smoke: run 45559157579 — success on exact code head 7527d28d68046d61d4ec0ffbc4084f19f80cf855.
- Blog and Studio validation: run 45559157619 — success; application/Pages type-check, lint, website tests, website build, Studio type-check and Studio build passed.
- D1 migration validation: run 45559157631 — success; no migration was applied.
- Services directory smoke: run 45559157624 — success.
- Service detail smoke: run 45559157642 — success.
- Equipment SSR smoke: run 45559157449 — success.

The blog raw HTTP smoke waited for the exact Cloudflare Pages check to succeed before requesting the branch alias. It then passed BG/RU/EN and verified HTML language, robots, canonical, all hreflang alternates, four topic cards, all 19 article cards, matching card/ItemList order and the localized hydration seed. The run does not depend on JavaScript execution.

**Owner acceptance:** On 2026-11-25, the owner confirmed that the blog index works correctly after checking the Preview. Desktop/mobile visual and hydration acceptance was granted.

### Production release evidence

- PR #540 squash-merged to main as 01405cfba21a42f2ca6d92753a8a4e07e08d19de.
- Cloudflare Pages Production deployment: 4cde1b83-a672-422c-857f-47aa1cf70486; all stages succeeded from the exact merge SHA.
- Blog index Production raw HTTP smoke: workflow run 45559999719 — success on the exact main SHA. BG/RU/EN, all 19 published article cards, four curated directions, locale metadata, CollectionPage/ItemList order and hydration seed passed.
- Blog and Studio validation: run 45559999767 — success.
- D1 migration validation: run 45559999685 — success; no migration applied.
- Homepage, services directory, service detail and equipment SSR regression smoke runs on the same main SHA also passed.

No Production data/schema/configuration writes were performed. Phase 4 is released; Phase 5 portfolio is documented as already covered by the combined blog/portfolio index in docs/audits/2026-11-25-portfolio-route-inventory.md. The next implementation phase is Phase 6, individual article/project publication pages.

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

1. Phase 5 inventory is closed: there is no separate portfolio route/type; project publications are part of the existing blogPost model and combined /blog index.
2. Phase 6 implements first-response HTML for each /blog/{slug} article and project publication.
