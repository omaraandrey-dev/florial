# SSR Content v1 — Phase 10 full SSR/SEO regression audit

**Date:** 2026-11-25  
**Development branch:** `develop`  
**Production baseline:** `main` at `23285148e20d799438c4cf6fec3de6600038608b`  
**Validated code head:** `14dd0b3f2c2af426d6e707b4f2b92a19acf4f9fe`  
**Integration PR:** [#548 — full localized SSR and SEO regression](https://github.com/omaraandrey-dev/florial/pull/548)  
**Status:** full Preview regression PASS; Production regression pending owner-approved merge.

## 1. Purpose and scope

Phase 10 consolidates the existing raw first-response smoke scripts and adds coverage for contacts, About, sitemap/robots and intentionally non-indexable routes. All page requests use Node.js `fetch`; no browser or client JavaScript is executed.

The workflow targets the exact successful Cloudflare Pages Preview deployment for pull requests, Production after a `main` push, or a manually supplied URL through `workflow_dispatch`.

## 2. Production About smoke discrepancy

The Production deployment for About SSR was successful at deployment `b6f6a959-08ec-4404-85bc-c83fe09aea2b`, sourced from main commit `23285148e20d799438c4cf6fec3de6600038608b`.

The first Production smoke stopped at the literal assertion for `barakov1971@abv.bg`. Cloudflare zone setting `email_obfuscation` was read-only confirmed as `on`. The failed smoke did not prove that the page content was absent; it proved that the expected literal string was not present in the Node fetch response. The revised check accepts either the literal address or a correctly decoded Cloudflare `data-cfemail` / `email-protection#...` value. It does not change Cloudflare settings.

Unit tests cover literal addresses, both supported Cloudflare markup forms, unrelated addresses and malformed values. The revised About smoke passed on Preview for all three locales. A corrected Production rerun remains pending PR #548 integration.

## 3. Phase 10 implementation

- `scripts/lib/cloudflare-email.mjs`: safe decoding and exact comparison for standard Cloudflare email-protection markup.
- `tests/cloudflare-email-obfuscation.test.mjs`: four unit tests for literal, encoded, unrelated and malformed values.
- `scripts/smoke-about-ssr.mjs`: email check accepts literal or verified Cloudflare-obfuscated representation.
- `scripts/smoke-contacts-ssr.mjs`: first-response checks for localized H1, canonical/hreflang, two garden-centre cards, map links, phones, seven-day hours and GardenStore JSON-LD.
- `scripts/smoke-seo-surface-ssr.mjs`: robots.txt, sitemap.xml, localized sitemap alternates, sitemap exclusions and noindex for cart/search/withdrawal.
- `scripts/smoke-ssr-regression.mjs`: sequential runner for all current route-specific smoke scripts, passing the exact target URL to each.
- `.github/workflows/ssr-seo-regression.yml`: exact Preview on PR, Production on main push and manual target URL support.

No application renderer, customer-facing page content, Sanity document/schema, D1 data/schema, Cloudflare settings/secrets/DNS or Resend configuration was changed.

## 4. Exact Preview verification

- Preview deployment: `151077b4-2ed2-44db-afa8-598fad20a959`.
- Preview URL: https://151077b4.florial.pages.dev.
- Exact source SHA: `14dd0b3f2c2af426d6e707b4f2b92a19acf4f9fe`.
- Full regression workflow run: `45610530548` — success.
- Full raw first-response regression completed with no JavaScript execution.

### Route inventory and results

- Homepage: BG/RU/EN — 3/3.
- Services directory: 26 service links in each locale — 3/3.
- Service details: 25 active service routes × 3 locales (75/75), plus the legacy delivery route in BG/RU/EN.
- Blog index: 19 published cards in BG/RU/EN (57 card renderings).
- Blog details: 19 articles × 3 locales (57/57); missing/unpublished article returned 404 noindex.
- Plant catalogue: 60 active published products × 3 locales (180/180) and 17 categories × 3 locales (51/51); missing plant product returned 404 noindex.
- Irrigation equipment categories: 54 categories × 3 locales (162/162); 275 linked published products discovered.
- Irrigation equipment product details: 275 products × 3 locales (825/825); missing/unpublished product returned 404 noindex.
- Contacts: BG/RU/EN — 3/3; two garden-centre cards, map links, phone numbers, daily 09:00–17:00 opening hours and GardenStore JSON-LD.
- About: BG/RU/EN — 3/3; 8 Sanity images per locale, localized content and AboutPage/Organization/GardenStore JSON-LD.
- `robots.txt`: PASS — public crawling rule and canonical sitemap reference.
- `sitemap.xml`: PASS — 1,384 unique URLs, BG/RU/EN and x-default alternates, no cart/search/Manager/API routes.
- `/cart`, `/search`, `/withdrawal`: `noindex, nofollow` confirmed in BG/RU/EN (9/9).

The existing scripts also check localized metadata, canonical, hreflang, robots, HTML markers, internal product/service/article links, image markup, prices/stock where applicable, and relevant Product, Service, BlogPosting, CollectionPage, BreadcrumbList, AboutPage and GardenStore structured data.

## 5. CI and build evidence

On exact head `14dd0b3f2c2af426d6e707b4f2b92a19acf4f9fe`:

- Full SSR/SEO regression run `45610530548`: success.
- Blog and Studio validation run `45610530318`: success; **557/557 tests passed**; application and Pages Functions type-check passed; website build passed; Sanity Studio type-check and build passed.
- Lint: **0 errors, 102 warnings** across the repository.
- D1 migration validation run `45610530331`: success; validation only, no migration applied.
- Dedicated About, contacts-related route, blog, services and equipment-product smoke workflows on the exact head: success.
- Cloudflare Pages Preview deployment succeeded from the exact SHA.

## 6. Verification boundaries and remaining work

- **Production:** not yet re-run with the corrected About email assertion or the full phase-10 suite. Preview success is not Production evidence.
- **Redirects:** the route smoke clients follow redirects, but this phase does not claim an exhaustive redirect-map audit.
- **React handoff/hydration:** not evaluated here. The current client bootstrap still uses `createRoot`; migration to `hydrateRoot` and DOM parity require a separate technical phase.
- **Core Web Vitals:** no LCP/CLS/INP or Lighthouse/CrUX improvement is claimed.
- **Google Search Console:** previously recorded noindex/canonical anomalies remain separate; this audit does not mark them fixed.

## 7. Next step

PR #548 remains draft/open on `develop`. After owner approval to merge, verify the exact Production deployment, run the same full regression against `https://florial-bg.com`, and record the corrected About Production result. Then proceed to a separately scoped SSR-to-React handoff/hydration audit.
