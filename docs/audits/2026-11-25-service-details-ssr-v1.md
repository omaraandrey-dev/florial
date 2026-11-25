# SSR Content v1 — Phase 3: individual service pages audit

**Date:** 25.11.2026  
**Routes:** \`/services/{slug}\`  
**Locales:** BG / RU / EN  
**PR:** [#539](https://github.com/omaraandrey-dev/florial/pull/539)  
**Branch:** \`feat/ssr-service-details-v1\`  
**Verified PR head:** \`90b06fad9e81fb47afae55308e4a22b18749b5eb\`  
**Base main:** \`85cca297fa4179a01129b65d343e1936aae298f4\`  
**Status:** Preview deployment and automated raw HTTP checks passed. Owner visual/hydration review is pending; Production release has not been performed.

## 1. Objective and result

The existing client-side service pages already rendered full content after hydration, while the middleware's generic Sanity document renderer emitted only a heading and short description for most \`/services/{slug}\` URLs.

Phase 3 adds a dedicated first-response renderer for published Sanity service documents. It renders the localized page content into the initial HTML response while preserving the existing React page and client-side behavior.

The existing hard-coded \`/services/dostavka-poliv\` delivery route remains on its previous SSR implementation and is explicitly checked as a compatibility case.

## 2. Server-side Sanity data

- Added a dedicated read-only GROQ projection for active \`service\` documents in the \`production\` dataset.
- Projection includes the current fields used by the client page: name/slug, short and full descriptions, hero, gallery, content blocks, related content, advantages, steps, CTA, lead-form display fields, starting price and localized SEO/translations.
- Published perspective is used through the existing \`querySanityData\` helper.
- Edge cache TTL for the detail query is 60 seconds; rendered HTML uses \`s-maxage=60\` with stale-while-revalidate.
- Missing documents remain 404; Sanity lookup failures use the existing unavailable response. No empty/partial content is cached as a successful page.
- No Sanity documents or schemas were written.

## 3. First-response HTML rendering

The new \`functions/_lib/serviceDetailHtml.mjs\` renderer supports:

- BG Portable Text blocks, heading levels, strong/emphasis/underline/strike/code marks, safe link annotations and list items.
- RU/EN Markdown headings, paragraphs, lists, bold and safe links.
- A single service H1 derived from the same localized hero-title/name fallback as the client page; repeated hero heading in the body is removed.
- Responsive Sanity CDN hero/gallery images with ALT localization, dimensions, srcset and lazy/eager loading appropriate to placement.
- Existing gallery-marker blocks and known gallery-to-section mappings, keeping relevant images with the article sections.
- Related services/resources, advantages, steps, CTA and lead-form contact information.
- Internal links preserve the selected \`?lang=ru|en\` locale. Unsafe protocols and malformed links are omitted.
- Lead-form SSR is a non-submitting contact link; the smoke test does not submit a form or create a lead.

The renderer does not change the React component or its interactive lead submission. It only supplies meaningful initial HTML for crawlers and no-JavaScript consumers.

## 4. SEO and structured data

- Localized title and meta description use the published language-specific \`seo\` fields, with the same Florial fallback behavior as the client page.
- Canonical URLs retain the current \`/services/{slug}\` path and the selected locale query parameter.
- \`hreflang\` alternates are emitted only for localized documents with complete metaTitle/metaDescription and \`noIndex !== true\`.
- Robots/noindex is preserved from the language-specific SEO document.
- Service hero image is used for Open Graph/Twitter metadata and responsive preload.
- Emits \`Service\` JSON-LD with provider \`https://florial-bg.com/#organization\`, the existing confirmed service-area cities, and the localized URL.
- Emits a BreadcrumbList for Home → All services → specialist direction (where applicable) → service.

## 5. Verification evidence

### Cloudflare Preview

- Deployment: \`c0f0d887-8a1d-41b2-8dea-68400a5483b3\`
- Commit: \`90b06fad9e81fb47afae55308e4a22b18749b5eb\`
- Branch alias: \`https://feat-ssr-service-details-v1.florial.pages.dev\`
- All Cloudflare Preview stages completed successfully.

### GitHub Actions

- Blog and Studio validation: run \`45555915393\` — success.
- Service detail raw HTTP smoke: run \`45555915444\` — success.
- Services directory smoke: run \`45555915419\` — success.
- Equipment SSR smoke: run \`45555915391\` — success.
- D1 migration validation: run \`45555915425\` — success; no migration applied.
- Website tests: 506 passed, 0 failed.
- Application/Pages type-check, lint, website build, read-only migration dry-run, Studio type-check and Studio build all passed.

### Service detail raw HTTP smoke

The smoke first reads the BG \`/services\` directory, discovers active Sanity service detail links, and fetches every discovered detail route in BG/RU/EN without executing JavaScript.

Observed result:
- 25 active Sanity service detail routes discovered.
- BG: 25/25 passed.
- RU: 25/25 passed.
- EN: 25/25 passed.
- Legacy static delivery route: BG/RU/EN passed.

For each Sanity detail response the smoke verifies:
- HTTP 200 HTML and correct \`html lang\`;
- robots and canonical metadata;
- server-rendered \`data-florial-service-detail\` main and non-empty H1;
- no raw gallery marker leakage;
- parseable Service JSON-LD with name, description, URL, provider and areaServed;
- parseable BreadcrumbList with a complete trail.

This is raw first-response HTTP evidence for the Preview deployment. It is not a Google Rich Results Test or an independent visual/hydration screenshot.

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
- **Owner visual/hydration review on desktop and mobile:** PENDING.
- **Production deployment:** NOT RELEASED.
- After owner acceptance, merge PR #539 and verify the exact Cloudflare Production deployment. The push-triggered raw HTTP workflow must then verify all active service details in BG/RU/EN on the canonical Production domain.
- The existing services-directory Production smoke should run on the same main push.
- Phase 4 (\`/blog\` index) must not start until Phase 3 is released and Production smoke is recorded.

## 8. Shared documentation boundary

\`CHANGELOG.md\`, \`docs/TECHNICAL_PASSPORT.md\` and \`docs/AI/OPEN_QUESTIONS.md\` are not changed in this PR because open PR #409 is based on an obsolete main and overlaps those shared files. Reconcile PR #409 before editing those shared documents; do not overwrite its changes.
