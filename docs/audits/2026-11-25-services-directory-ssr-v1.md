# SSR Content v1 — Phase 2: services directory audit

**Date:** 25.11.2026  
**Route:** `/services`  
**Locales:** BG / RU / EN  
**PR:** [#535](https://github.com/omaraandrey-dev/florial/pull/535)  
**Branch:** `feat/ssr-services-directory-v1`  
**Verified code head:** `a9cdcf97102aa640f90fc40f393e1d4947fb8a0e`  
**Base main:** `cc2562194107cf0df2be05b1f13a6b9e10610bb9`  
**Status:** PR #535 merged; exact merge commit deployed successfully to Production. Canonical Production raw HTTP smoke remains pending.

## 1. Result

The `/services` route now returns its meaningful directory content in the initial HTTP HTML response. The SSR implementation is additive: the existing React page, filtering controls, detail routes and navigation remain in place.

The initial response contains the localized page H1 and introduction, four specialist direction tiles, the published service cards, crawlable links, and structured data. The renderer uses the existing published Sanity content and the same service ordering helper as the client application.

## 2. Data and rendering

- Service query: dataset `production`, type `service`, active documents only (`isActive != false`), with localized `name` and `shortDescription`, slug, category/layout, sort order and image URL.
- Role-photo query: dataset `production`, type `photo`, active documents only, restricted to the four existing slugs: `landshaften-arhitekt`, `inzhener-polivni-sistemi`, `gardinar`, `specialist-trevni-ploshti`.
- Both queries use the middleware's published-perspective Sanity query/cache helper. They are read-only.
- `getOrderedServiceEntries` from `src/lib/servicesOrder.ts` is reused, preserving Sanity `sortOrder`, deterministic tie-breaking and the legacy delivery card only when a Sanity delivery service does not exist.
- Locale copy, titles, descriptions, canonical URLs and localized internal links are aligned with `ServicesListPage`.
- Service and role images use HTTPS validation, escaped attributes, responsive Sanity CDN URLs, dimensions where known, and the same width/quality/loading policy as `getSanityImageProps`.
- Structured data: `CollectionPage` with an `ItemList` matching the rendered card order, plus a localized `BreadcrumbList`.
- Successful data responses use short edge caching. If either Sanity collection fails or returns an invalid shape, the route retains a meaningful static fallback and sets `Cache-Control: no-store`; it does not cache an empty directory as if it were valid.

## 3. Verification evidence

### GitHub Actions — exact code head `a9cdcf97102aa640f90fc40f393e1d4947fb8a0e`

- Blog and Studio validation run `45553300013`: **success**.
  - Application and Pages Functions type-check: success.
  - Website lint: success, 94 warnings / 0 errors.
  - Website tests: **501 passed, 0 failed**.
  - Website build: success.
  - Migration script syntax checks and read-only description migration dry-run: success.
  - Studio dependency install, type-check and build: success.
- D1 migration validation run `45553300016`: **success**. No migration was applied.
- Services directory raw HTTP smoke run `45553300014`: **success**.
  - BG, RU and EN fetched without executing JavaScript.
  - Each locale returned HTTP 200 HTML with index/follow robots metadata and localized H1.
  - Each locale contained 26 service detail links.
  - `CollectionPage` and `BreadcrumbList` JSON-LD were present.
  - HTML service-link order matched the JSON-LD ItemList order.
  - RU/EN service URLs retained their language query parameter.

### Cloudflare Pages Preview

- Deployment ID: `6518ee68-7461-4dbc-a2b3-75d3c698018e`
- Source commit: `a9cdcf97102aa640f90fc40f393e1d4947fb8a0e`
- Status: **success** (queued, initialize, clone, build and deploy stages).
- URL: https://6518ee68.florial.pages.dev
- Branch alias: https://feat-ssr-services-directory.florial.pages.dev

## 4. Scope and safety

- No Sanity writes, schema changes, document publication changes or content edits.
- No D1 schema/data changes or migration application.
- No Cloudflare account settings, secrets, bindings, Production configuration or domain changes.
- No Header, main menu, Footer, global routing or layout changes.
- No changes to service detail routes.
- Production was not changed by this PR.

## 5. Remaining acceptance and release status

- **Owner Preview acceptance:** The owner reports personally checking the Preview and confirming that it works. This is recorded as owner acceptance; an independent browser screenshot/trace is not available.
- **Production deployment:** Complete. Cloudflare Pages deployment `9f02e8e9-9064-4a87-9df9-b75cca365671` succeeded from exact merge commit `eb5a8c7ca2a94884f44f367f791800ea35d0749b`.
- **Production raw first-response smoke:** Pending for canonical `https://florial-bg.com/services` in BG/RU/EN. Preview smoke and deployment success do not substitute for this check.
- **Browser-level Production visual/hydration check:** Not independently recorded. The owner accepted the Preview; Browser Use could not run because the connected service reported insufficient credits.
- **Shared documentation:** `CHANGELOG.md`, `docs/TECHNICAL_PASSPORT.md` and `docs/AI/OPEN_QUESTIONS.md` remain unchanged pending reconciliation of stale open PR #409, which overlaps those shared files. Do not overwrite its diff.
- **Phase 3 gate:** Do not begin individual service pages `/services/{slug}` until the canonical Production raw HTTP smoke is recorded.

## 6. Changed files in the implementation PR

- `functions/_lib/servicesDirectoryHtml.mjs`
- `functions/_middleware.ts`
- `tests/services-directory-html.test.mjs`
- `scripts/smoke-services-directory-ssr.mjs`
- `.github/workflows/services-directory-ssr-smoke.yml`
- `docs/roadmaps/SSR_CONTENT_V1_ROADMAP_2026-11-24.md`
- `docs/audits/2026-11-25-services-directory-ssr-v1.md`


## 7. Post-merge integration record — 2026-11-25

- PR #535 was squash-merged into `main` at `eb5a8c7ca2a94884f44f367f791800ea35d0749b`.
- Cloudflare Pages Production deployment `9f02e8e9-9064-4a87-9df9-b75cca365671` completed successfully from that exact merge SHA. The canonical domains are attached.
- Latest PR-head Blog and Studio validation run `45553763682` passed; Services directory Preview smoke run `45553763725` passed; D1 validation run `45553568579` passed without applying a migration.
- Owner reports personally checking the Preview and confirming that it works. This is owner acceptance; no independent Browser Use screenshot/trace is available.
- The canonical Production route-level raw HTTP smoke for BG/RU/EN is **pending**. Do not infer raw-response correctness solely from the successful deployment.
- Phase 3 (`/services/{slug}`) is next, but should begin only after the Production raw HTTP smoke is recorded.
- Shared `CHANGELOG.md`, `docs/TECHNICAL_PASSPORT.md` and `docs/AI/OPEN_QUESTIONS.md` remain untouched pending reconciliation of open, stale PR #409, which overlaps those files.
