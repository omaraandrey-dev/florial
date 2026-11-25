# SSR Content v1 — Phase 3: individual service pages audit

**Date:** 25.11.2026  
**Routes:** `/services/{slug}`  
**Locales:** BG / RU / EN  
**PR:** [#539](https://github.com/omaraandrey-dev/florial/pull/539)  
**Branch:** `feat/ssr-service-details-v1`  
**Verified code head:** `efe361e6bb474206a3ddc911644c87f33473bb66`  
**Base main:** `85cca297fa4179a01129b65d343e1936aae298f4`  
**Status:** Final Preview deployment and automated raw HTTP checks passed on the verified code head. Owner visual/hydration review is pending; Production release has not been performed.

## 1. Objective and result

The existing client-side service pages already rendered full content after hydration, while the middleware's generic Sanity document renderer emitted only a heading and short description for most `/services/{slug}` URLs.

Phase 3 adds a dedicated first-response renderer for published Sanity service documents. It renders the localized page content into the initial HTML response while preserving the existing React page and client-side behavior.

The existing hard-coded `/services/dostavka-poliv` delivery route remains on its previous SSR implementation and is explicitly checked as a compatibility case.

## 2. Server-side Sanity data

- Added a dedicated read-only GROQ projection for active `service` documents in the `production` dataset.
- Projection includes the current fields used by the client page: name/slug, short and full descriptions, hero, gallery, content blocks, related content, advantages, steps, CTA, lead-form display fields, starting price and localized SEO/translations.
- Published perspective is used through the existing `querySanityData` helper.
- Edge cache TTL for the detail query is 60 seconds; rendered HTML uses `s-maxage=60` with stale-while-revalidate.
- Missing documents remain 404; Sanity lookup failures use the existing unavailable response. No empty/partial content is cached as a successful page.
- No Sanity documents or schemas were written.

## 3. First-response HTML rendering

The new `functions/_lib/serviceDetailHtml.mjs` renderer supports:

- BG Portable Text blocks, heading levels, strong/emphasis/underline/strike/code marks, safe link annotations and list items.
- RU/EN Markdown headings, paragraphs, lists, bold and safe links.
- A single service H1 derived from the same localized hero-title/name fallback as the client page; repeated hero heading in the body is removed.
- Responsive Sanity CDN hero/gallery images with ALT localization, dimensions, srcset and lazy/eager loading appropriate to placement.
- Existing gallery-marker blocks and known gallery-to-section mappings, keeping relevant images with the article sections.
- Related services/resources, advantages, steps, CTA and lead-form contact information.
- Internal links preserve the selected `?lang=ru|en` locale. Unsafe protocols and malformed links are omitted.
- Lead-form SSR is a non-submitting contact link; the smoke test does not submit a form or create a lead.

The renderer does not change the React component or its interactive lead submission. It only supplies meaningful initial HTML for crawlers and no-JavaScript consumers.

## 4. SEO and structured data

- Localized title and meta description use the published language-specific `seo` fields, with the same Florial fallback behavior as the client page.
- Canonical URLs retain the current `/services/{slug}` path and the selected locale query parameter.
- `hreflang` alternates are emitted only for localized documents with complete metaTitle/metaDescription and `noIndex !== true`.
- Robots/noindex is preserved from the language-specific SEO document.
- Service hero image is used for Open Graph/Twitter metadata and responsive preload.
- Emits `Service` JSON-LD with provider `https://florial-bg.com/#organization`, the existing confirmed service-area cities, and the localized URL.
- Emits a BreadcrumbList for Home → All services → specialist direction (where applicable) → service.

## 5. Verification evidence

### Cloudflare Preview

- Deployment: `9056cf4e-7208-4f06-893b-55b8803ca27f`
- Commit: `efe361e6bb474206a3ddc911644c87f33473bb66`
- Branch alias: `https://feat-ssr-service-details-v1.florial.pages.dev`
- All Cloudflare Preview stages completed successfully.

### Cloudflare Production

- Deployment: `ed0dbd75-6f4a-4f86-8410-e74ef85113b1`
- Commit: `28afdf7e895d1b6dbf6d32302e4ffc7dd60b3dab` (PR #539 squash merge).
- Deployment URL: `https://ed0dbd75.florial.pages.dev`
- Canonical aliases: `https://florial-bg.com` and `https://www.florial-bg.com`.
- Production deploy stage completed successfully from the exact merge commit.

### GitHub Actions

- Blog and Studio validation on merge commit: run `45557311577` — success.
- Service detail Production raw HTTP smoke: run `45557311581`, attempt 2 — success. The first push-triggered attempt failed; after the Production deployment completed, the failed job was rerun and passed.
- Services directory Production smoke: run `45557311571` — success.
- Equipment SSR smoke: run `45557311599` — success.
- Homepage SSR raw HTTP smoke: run `45557311588` — success.
- D1 migration validation: run `45557311593` — success; no migration applied.
- The original PR validation remains recorded above: 506 website tests passed, with application/Pages type-check, lint, website build, read-only migration dry-run, Studio type-check and Studio build all passing.

### Service detail raw HTTP smoke

The smoke first reads the BG `/services` directory, discovers active Sanity service detail links, and fetches every discovered detail route in BG/RU/EN without executing JavaScript.

Observed result:
- 25 active Sanity service detail routes discovered.
- BG: 25/25 passed.
- RU: 25/25 passed.
- EN: 25/25 passed.
- Legacy static delivery route: BG/RU/EN passed.

For each Sanity detail response the smoke verifies:
- HTTP 200 HTML and correct `html lang`;
- robots and canonical metadata;
- server-rendered `data-florial-service-detail` main and non-empty H1;
- no raw gallery marker leakage;
- parseable Service JSON-LD with name, description, URL, provider and areaServed;
- parseable BreadcrumbList with a complete trail.

The Preview run above is raw first-response HTTP evidence. The Production run `45557311581` repeated the same discovery and BG/RU/EN checks against the canonical Production domain after deployment. Neither run is a Google Rich Results Test or an independent screenshot comparison of the hydrated DOM.

## 6. Scope and safety

No changes were made to:
- Sanity schema or published documents;
- D1 schema/data or migrations;
- Cloudflare settings, bindings or secrets;
- order, Manager, Resend or customer lead-submission endpoints;
- Header, global navigation, Footer or global site layout;
- public service slugs or URL structure;
- existing service-direction route implementation.

The service page remains client-interactive after hydration. The SSR output is additive and does not submit lead forms.

## 7. Acceptance and next action

- **Automated Preview checks:** PASS.
- **Owner visual/hydration review on desktop and mobile:** ACCEPTED by owner on 2026-11-25.
- **Merge:** PR #539 squash-merged at `28afdf7e895d1b6dbf6d32302e4ffc7dd60b3dab`.
- **Production deployment:** RELEASED; exact-SHA Cloudflare deployment `ed0dbd75-6f4a-4f86-8410-e74ef85113b1` succeeded.
- **Production raw HTTP smoke:** PASS on rerun `45557311581` attempt 2; 25 active service detail routes passed in BG/RU/EN, and the legacy delivery route passed in all three locales.
- **Next stage:** Phase 4 (`/blog` index) is now authorized and has started on branch `feat/ssr-blog-index-v1`.

## 8. Shared documentation boundary

`CHANGELOG.md`, `docs/TECHNICAL_PASSPORT.md` and `docs/AI/OPEN_QUESTIONS.md` are not changed in this PR because open PR #409 is based on an obsolete main and overlaps those shared files. Reconcile PR #409 before editing those shared documents; do not overwrite its changes.
