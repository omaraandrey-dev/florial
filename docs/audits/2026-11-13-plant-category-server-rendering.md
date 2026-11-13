# Plant category server-rendered HTML — 13.11.2026

## Status — checkpoint 13.11.2026

- Implementation branch: `feat/plant-category-server-rendering`; PR #251 is open, not merged. Code implementation SHA: `0ef46d74d7fd5e48af38c80985a1604e968bbf30`; subsequent commits recorded in this PR are documentation/status updates.
- GitHub Actions passed on that exact SHA: Blog and Studio validation run `43396561749` — success; Florial D1 migration validation run `43396561879` — success.
- Cloudflare Pages project `florial` was inspected live. With owner approval, `preview_deployment_setting` changed from `none` to `all`; branch includes remain `*`, production branch remains `main`, and automatic Production deployments remain enabled.
- Fresh Preview deployment `5fc9f0fb-3f3c-4e82-b1a1-8556866f093c` (`https://5fc9f0fb.florial.pages.dev`) completed queued, initialize, clone, build and deploy stages successfully on documentation-updated PR head `73c2132f4ac69546c26697d48b33a156991460d3`.
- Initial HTTP HTML QA is still **not confirmed**. The available page scrape returned the post-JavaScript React DOM, which cannot establish whether the server fallback was present in the first HTTP response. A JavaScript-disabled/raw-response capture for BG/RU/EN is required.
- Production is still `main` commit `0df7a52bb2a923f71096179c3837141382446554`; deployment `5c52db09-707f-47a7-a4c7-1ffea0300130` completed successfully on that exact commit. PR #251 is not in Production.
- Preview currently has no D1 binding. Use it for the public plant-category HTML/SEO test only; Manager, orders and D1-backed flows are out of scope. Preview URLs are public unless access controls are separately configured.

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

1. Preview deployment is confirmed successful for code implementation SHA `0ef46d74d7fd5e48af38c80985a1604e968bbf30` and documentation head `73c2132f4ac69546c26697d48b33a156991460d3` (deployment ID and URL are recorded above).
2. Capture the **initial HTTP response with JavaScript disabled** for BG/RU/EN plant category routes. Verify HTTP status, document language, canonical/hreflang/robots, H1 and SEO text, `data-florial-server-catalogue`, product links/names/prices/known stock labels and matching `ItemList` JSON-LD. The available browser scrape ran React and is not evidence of the initial response.
3. Separately compare JavaScript-enabled output with the initial server HTML; confirm React starts, the server fallback is replaced without duplicate content, and a real empty state is not shown when products exist.
5. Keep Manager/orders/D1-backed smoke tests out of Preview because the live Preview configuration has no D1 binding. Do not copy Production secrets/bindings into Preview as part of this task.
6. Only after Preview HTML and browser checks pass, consider merging PR #251 under the existing owner authorization. Then verify the exact Production deployment and live HTML separately.
7. Equipment category rendering remains Phase 2 and must not be added until Phase 1 is stable.

## Configuration changes and non-changes

- **Changed with owner approval:** Cloudflare Pages project `florial` source config `preview_deployment_setting`: `none` → `all`; branch include pattern remains `*`.
- **Not changed:** Production branch (`main`), automatic Production deployments, Production environment variables/secrets/bindings, Preview environment variables/secrets/bindings, DNS, D1, Sanity, Resend, routing, Header, menu, Footer and global React architecture.
- Preview environment has no D1 binding at this checkpoint. Legacy `VITE_SUPABASE_*` variable names remain visible in the Preview environment configuration; values were not read or disclosed. Their current code usage has not been re-audited in this PR.
