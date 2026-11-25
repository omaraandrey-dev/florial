# About page SSR — discovery and implementation audit

**Date:** 2026-11-25  
**Work branch:** `develop`  
**Production baseline:** `main` at `1b18d7ae7db06f8d656d539b28037889f99d8d94`  
**Scope:** localized first-response HTML for `/about` (BG/RU/EN). Discovery and implementation are read-only with respect to Sanity content.

## 1. Current implementation findings

### Code-verified

- The current client page is `src/pages/AboutPage.tsx`; it renders the hero, two catalog offer cards, four team-role cards, two garden-centre cards, company/bank/contact details, a four-step process, service-area copy and a contacts CTA.
- Its current localized copy was embedded in the React component. The page also contained additional legacy copy fields (detailed design, planting, irrigation and turf descriptions) that are **not rendered by the current JSX**. Those fields were retained in the shared copy module but are not injected into SSR, so the first response matches the existing visible page instead of silently restoring old sections.
- The existing middleware `staticPageMetadata('/about')` provided only a small fallback `<main><h1>…</h1><p>…</p></main>`. It did not call Sanity or a dedicated About renderer. The shared `index.html` has an empty `#root`, and `renderRoot()` inserts the middleware-provided body.
- Before this work, server metadata for `/about` differed from the SEO title and description applied by the client page. Both now read the same shared localized copy.
- `AboutPage` uses `createRoot` through the existing application bootstrap. This task preserves that existing client bootstrap; a React `hydrateRoot`/handoff migration is not part of this phase.

### Historical source document

The repository's `about.docx` was read for comparison. It contains older, longer Russian-first copy and historical claims/wording that are not the content currently rendered by `AboutPage.tsx`. It is not treated as the live page source, and none of its retired sections or claims were reintroduced.

## 2. Live Sanity read-only verification

Project: `bxvcy0qs` (Florial). Published datasets: `production` and `plants`. Both datasets were queried with the published perspective; no document was created, edited, published, unpublished or deleted.

### Dataset `production`

Six published photo documents used by the current page were found:

- `landshaften-arhitekt`
- `inzhener-polivni-sistemi`
- `gardinar`
- `specialist-trevni-ploshti`
- `Florial-nesebr`
- `Florial-ravda`

The four team-role photos contain BG/RU/EN alt text. The two garden-centre photos contain localized alt text; the current React component uses the localized centre name as the rendered alt text, and SSR preserves that behavior.

The irrigation category `vsichko-za-polivane` was found with a published Sanity image.

### Dataset `plants`

The root plants category `rastenia` was found with a published Sanity image.

### About document search

A read-only query for published `about` and `page` documents returned zero documents. `siteSettings` currently supplies the site name only; the current About text is code-owned rather than a Sanity page singleton.

## 3. Implementation delivered on `develop`

- Extracted the existing BG/RU/EN copy into `src/content/aboutPageContent.ts`, shared by React and the Pages Function.
- Moved the existing four team-role definitions and two garden-centre definitions into the same shared module. Both client and SSR use the same records for titles, translations, routes, addresses and map links.
- Added `functions/_lib/aboutHtml.mjs` and its TypeScript declaration. The renderer emits the visible page structure with semantic headings, localized links, all currently displayed company details, responsive Sanity image candidates, localized alt text and the SSR marker `data-florial-ssr="about"`.
- Added bounded published Sanity projections for the six photos and the two category images. Queries use the existing Cloudflare Cache API wrapper and 300-second data-cache keys.
- SSR uses the full-media cache policy only when all six expected photos and both category images are present. If a query fails or an expected asset is missing, the textual page is still rendered with safe image fallbacks and the response is `no-store`.
- Image URLs are accepted only from HTTPS `cdn.sanity.io/images/...`; all rendered text and attributes are HTML-escaped.
- Server `title` and `description` now come from the same shared localized copy used by React. Canonical and BG/RU/EN hreflang URLs continue through the existing route helper.
- Added an `AboutPage` JSON-LD entity linked to the existing `#organization` entity. The React page re-adds the same page-specific entity after `applyPageSeo()` clears page JSON-LD; Organization/OnlineStore and both GardenStore entities, including their parent-organization references, remain preserved. The AboutPage does not depend on the transient WebSite node.
- Added `tests/about-ssr.test.mjs` for complete page structure, locale links, Sanity image rendering, HTML escaping, unsafe image rejection, shared content, metadata parity and structured-data references.
- Added `scripts/smoke-about-ssr.mjs` and `.github/workflows/about-ssr-smoke.yml`. This dedicated CI job waits for the exact successful Cloudflare Pages Preview deployment, then uses Node `fetch` (no browser and no JavaScript execution) to verify BG/RU/EN first-response HTML. It retries brief 404/5xx responses during Pages edge propagation.

## 4. Explicit non-changes

- No Sanity writes, schema changes, exports or deployments.
- No Cloudflare D1 changes or migrations.
- No Cloudflare Pages settings, DNS, secrets or environment changes.
- No Resend changes.
- No changes to Header, main menu, Footer, global routing or the React root bootstrap.
- PR #409 and the open irrigation-layout PRs were not modified.
- `CHANGELOG.md`, `docs/TECHNICAL_PASSPORT.md` and `docs/AI/OPEN_QUESTIONS.md` remain untouched while the protected documentation PR #409 is open.

## 5. Verification status

- **Live Sanity reads:** PASS — 6 photo documents and 2 category images found in their expected published datasets.
- **Source and renderer review:** implementation committed on `develop`.
- **Automated tests, type-check, lint and build:** PASS on exact PR head `68caa35b43a78cff7a80f5b50b65350ebc277a08`; 13 workflow runs successful. Blog/Studio validation: 553/553 tests, application and Pages Functions type-check, lint (0 errors; 101 repository warnings), website build, Studio type-check/build. D1 migration validation passed; it ran validation scripts only and applied no migration.
- **Cloudflare Preview:** PASS; exact Preview deployment `265cc17c-d7a8-4946-8836-0fa0fccb7647`, URL https://265cc17c.florial.pages.dev, source SHA matches PR head.
- **Raw first-response HTML smoke:** PASS — `/about` BG/RU/EN 3/3 HTTP 200 without executing JavaScript; 8 Sanity images per locale, metadata/canonical/hreflang/indexability, company details, maps and AboutPage/Organization/GardenStore JSON-LD verified.
- **Owner visual acceptance:** pending desktop/mobile review of Preview.
- **Production:** unchanged. PR #547 remains draft/open; no merge or Production deployment is authorized or performed in this phase.

## 6. Next steps

1. Exact-head CI passed (13/13 workflow runs; 553/553 tests).
2. Preview deployment and raw first-response HTML smoke passed for BG/RU/EN (3/3).
3. **Next:** owner desktop/mobile visual acceptance of the Preview.
4. Only after explicit owner approval, mark PR ready for review/merge, then verify exact Production deployment and raw HTML smoke.
5. After About release, continue to phase 10: full SSR/SEO regression for public BG/RU/EN routes. The separate React hydration/handoff and Core Web Vitals work remains a later task.


## 7. Exact-head CI and Preview verification — 2026-11-25

**Draft PR:** [#547 — localized About page first-response HTML](https://github.com/omaraandrey-dev/florial/pull/547)  
**Exact head:** `68caa35b43a78cff7a80f5b50b65350ebc277a08`  
**PR state:** open, draft, mergeable; no merge performed.

### GitHub Actions

All 13 workflow runs associated with the exact head completed successfully, including Blog and Studio validation, all existing public SSR smoke workflows, the new About raw HTTP smoke, and D1 migration validation. The Blog/Studio validation job reported 553 tests passed, 0 failed; application and Pages Functions type-check passed; website build and Sanity Studio type-check/build passed. Repository lint completed with 0 errors and 101 warnings. D1 validation ran existing migration validation scripts only; no D1 migration was applied.

### Cloudflare Pages Preview

- Deployment: `265cc17c-d7a8-4946-8836-0fa0fccb7647`.
- URL: https://265cc17c.florial.pages.dev.
- Environment: `preview`.
- Exact source SHA: `68caa35b43a78cff7a80f5b50b65350ebc277a08`.
- Cloudflare build and deploy stages: success.

### Raw HTTP smoke

The dedicated workflow `About page SSR raw HTTP smoke` passed for all three locale routes. The test uses Node's HTTP `fetch` and inspects the response body before any browser JavaScript executes. For BG/RU/EN it confirmed HTTP 200, the SSR marker, one localized H1, SEO title/description, canonical, hreflang, `index, follow`, both garden-centre map links, legal and bank details, at least eight Florial Sanity images, responsive `srcset`, and JSON-LD relationships for AboutPage → Organization and both GardenStore → Organization entities.

**Owner visual acceptance remains pending.** Production remains unchanged until explicit approval.
