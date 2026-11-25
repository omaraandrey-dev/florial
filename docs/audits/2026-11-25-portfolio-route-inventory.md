# SSR Content v1 — Phase 5: portfolio route and content-model inventory

**Date:** 2026-11-25  
**Status:** CLOSED — portfolio is already represented by the combined /blog index; no separate route or document type exists.  
**Main SHA checked:** 01405cfba21a42f2ca6d92753a8a4e07e08d19de

## 1. Objective

Determine read-only whether Florial has a separate portfolio route/content type or whether portfolio/project publications are represented within the existing blog index. Do not introduce a new route or alter published content as part of this inventory.

## 2. Code evidence

- src/App.tsx has the /blog route and the /blog/{slug} detail route. No /portfolio route or portfolio page component exists.
- src/pages/BlogPage.tsx labels the existing listing as “Блог и портфолио” / “Blog and portfolio”.
- The listing has four curated visual directions: landscape design, automatic irrigation, rolled turf, and planting/greenery.
- The reviewed landscape/project articles are selected from existing blogPost slugs and Sanity tags. No separate project listing query is used.
- tests/blog-portfolio-page.test.mjs protects this combined blog/portfolio UX and its four topic directions.
- The existing SSR Content v1 Phase 4 implementation renders all published blogPost cards and the same four curated topic directions into the first HTML response for /blog.

## 3. Live Sanity Production evidence (read-only)

Project: bxvcy0qs  
Dataset: production  
Perspective: published

A count query returned:

- blogPost: 27 total documents
- published blogPost with isPublished == true and publishedAt defined: 19
- portfolio: 0
- project: 0
- portfolioProject: 0

A second projection inspected all 19 published posts and confirmed that project/landscape content is stored as blogPost documents with localized BG/RU/EN content and existing tags. No Sanity writes were performed.

## 4. Decision

Phase 5 does not require an additional portfolio index route or a new Sanity type. Creating /portfolio, duplicating project records, or changing the content model would create an unnecessary parallel catalogue and would violate the existing public-URL/content-model preservation boundary.

**Phase 5 is therefore closed as already covered by Phase 4.** The next independent SSR work item is Phase 6: render every existing /blog/{slug} article/project publication in the first HTML response.

## 5. Safety

No Sanity documents, schemas, assets, tags, slugs, references, publication states, Cloudflare settings, D1 data, navigation, Header, Footer or routes were changed by this inventory.
