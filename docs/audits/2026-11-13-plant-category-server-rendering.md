# Plant category server-rendered HTML — 13.11.2026

## Status

Implementation is on branch `feat/plant-category-server-rendering`. Pull request and CI validation are pending. No Production release has been performed.

## Scope

Phase 1 covers plant category routes only (`plants` Sanity dataset). Equipment categories are intentionally unchanged and are a separate follow-up after this phase is validated.

## Implementation

- Cloudflare Pages Middleware resolves the published plant category document, loads the plant category tree and determines all descendant category IDs.
- A published GROQ query uses `references($categoryIds)` to retrieve active plant products assigned to the category or any descendant. The projection is limited to localized product names, SEO H1 fallbacks, slugs, prices, stock statuses and sale-variant price/availability fields.
- The first HTML response now contains a semantic product listing with product detail links, starting prices where available and availability only when Sanity provides a known status. A genuine empty-state message is rendered only after a successful query returns an empty array.
- The middleware adds an `ItemList` JSON-LD block for the same product links.
- The existing React application and live catalogue loading remain unchanged. React uses `createRoot`, so it replaces the initial server HTML when JavaScript starts; this is a crawler/no-JavaScript fallback, not React hydration.
- Category-tree cache: 300 seconds. Product-list cache: 30 seconds. Server-rendered plant-category HTML: `s-maxage=30`, `stale-while-revalidate=60`.
- If Sanity requests fail or return an invalid result, the middleware returns the existing temporary-unavailable 503/noindex response rather than showing a false empty category.

## Read-only Sanity validation

- Published plant dataset contains 17 category documents.
- The same product query pattern with `references($categoryIds)` returned 12 published products for `plants-palms` and 50 published products for the `plants-root` tree.
- No Sanity documents, schemas or assets were written or published.

## Files changed

- `functions/_middleware.ts`
- `functions/_lib/plantCategoryHtml.mjs`
- `functions/_lib/plantCategoryHtml.d.mts`
- `tests/plant-category-server-rendering.test.mjs`
- `CHANGELOG.md`
- `docs/TECHNICAL_PASSPORT.md`
- `docs/AI/OPEN_QUESTIONS.md`
- `docs/ROADMAP_PERFORMANCE_OPTIMIZATION.md`

## Pending verification

- GitHub Actions lint, unit tests, website build and Pages Functions validation on the exact PR SHA.
- Inspect the PR build output and Cloudflare Pages deployment only after merge authorization.
- After a permitted Production release, inspect raw HTML for BG/RU/EN plant category routes, verify product links and ItemList JSON-LD, then compare JavaScript-enabled rendering and confirm no duplicate/incorrect empty-state content.
- Repeat the same pattern for equipment categories only after Phase 1 is stable.

## Not changed

No Sanity content/schema, D1, Resend, Cloudflare Pages settings/secrets, DNS, routing, Header, menu, Footer or global React architecture changes.
