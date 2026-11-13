# Category-first related content on irrigation product pages

**Date:** 2026-11-13  
**Repository:** `omaraandrey-dev/florial`  
**Base:** `main` at `0f0416a141fff1c58d6aa0995e01acb4de4c5044`  
**Branch:** `feat/category-related-services-for-equipment`

## Owner-approved behavior

Apply the established plant category rule to every irrigation equipment category, including subcategories and categories added in the future:

1. Resolve the assigned product category's `helpBlock.buttonUrl`.
2. If it points to a valid service or blog route, display that category-linked item first.
3. Append the product's individual related services/articles in their existing Sanity order.
4. Do not display the same document twice.
5. Continue excluding inactive services and unpublished blog posts.
6. Preserve the existing four-card display limit.

## Implementation

- `src/lib/plantRelatedContentUtils.mjs`: added a shared category-link path parser and generalized merge helper; the old plant helper name remains as a compatibility export.
- `src/lib/routeData/productDetails.ts`: equipment detail GROQ now reads `category->helpBlock.buttonUrl`; a valid category target is resolved from the published Sanity content and merged ahead of product-specific related content. No hard-coded category list is used.
- `tests/plant-related-content-utils.test.mjs`: added coverage for equipment ordering, duplicate suppression and accepted/rejected category paths.
- `src/pages/ProductPage.tsx`: no change; the existing display order and four-item limit consume the enriched `product.relatedContent` list.

## Scope and safety

- No Sanity documents or schemas were changed; no backup/write was needed.
- No product data, Cloudflare configuration, D1, Resend, secrets, Header, menu, Footer or global routing was changed.
- The logic applies dynamically to any equipment product whose assigned category has a valid `helpBlock.buttonUrl`, including future categories.

## Verification status

- Source changes and test cases are committed to the feature branch.
- Automated tests, lint, production build and exact-SHA CI are pending PR validation.
- Production deployment and live product-page behavior are not yet verified.
