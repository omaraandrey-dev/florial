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
- Added an `AboutPage` JSON-LD entity linked to the existing `#organization` and `#website` IDs. Existing Organization/OnlineStore and both GardenStore entities, including their parent-organization references, are preserved.
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
- **Automated tests, type-check, lint and build:** pending GitHub Actions on the draft integration PR.
- **Cloudflare Preview:** pending deployment; no Preview URL is claimed yet.
- **Owner visual acceptance:** pending Preview.
- **Production:** unchanged. No merge or Production deployment is authorized or performed in this phase.

## 6. Next steps

1. Run exact-head CI and inspect all workflow results.
2. Verify the Preview raw first-response HTML for `/about` in BG/RU/EN, including the SSR marker, all visible sections, images, metadata, canonical/hreflang and AboutPage/Organization/GardenStore JSON-LD.
3. Have the owner visually check desktop and mobile Preview.
4. Only after explicit owner approval, merge the PR and verify the exact Production deployment and raw HTML smoke.
5. After About release, continue to phase 10: full SSR/SEO regression for public BG/RU/EN routes. The separate React hydration/handoff and Core Web Vitals work remains a later task.
