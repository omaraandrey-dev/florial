# Rotary nozzle replacement service — Bulgarian copy refinement

**Date:** 2026-11-20  
**Main baseline:** `62d11da8d3ab3b929bdfc4d90d48e38bc71e68ad`  
**Sanity:** project `bxvcy0qs`, dataset `production`

## Target document

- ID: `5b88a838-5f5e-4024-9bb8-f4fd8baaeda8`
- Type: `service`
- Preserved slug: `zamyana-vaeerni-dyuzi-rotatorni-r-van`
- URL: `https://florial-bg.com/services/zamyana-vaeerni-dyuzi-rotatorni-r-van`
- Status: active and published; category `irrigation`; layout `standard`; sort order 151.

## Owner-approved content changes

Before editing, the complete Sanity document was backed up and verified in GitHub:
`docs/backups/sanity/2026-11-20-service-5b88a838-5f5e-4024-9bb8-f4fd8baaeda8-before-bg-edit.json`

Backup commit: `997f0d5c147ac293b2163d4f0fefdf5cf927ea40`.

### Bulgarian (primary locale)

- Refined service name and H1 to: `Подмяна на веерни (Spray) дюзи с ротаторни Rain Bird R-VAN`, with Nessebar / Southern Black Sea coast in the hero title.
- Updated Bulgarian short description, meta title and meta description. `noIndex=false` retained; existing slug and URL unchanged.
- The BG advantages (4), steps (4), CTA and lead form already existed. They were not missing as the initial quick audit suggested. Their wording was polished rather than duplicated/recreated.
- Completed the existing form field definitions with explicit HTML input types and placeholders: text, tel, email, text, textarea. Added a localized success message.
- Removed the redundant opening H2 from the Portable Text description. The main article starts with its introductory paragraph, followed by the existing section headings.
- Removed the repeated opening H2 from the RU and EN Markdown descriptions as well. Their article body content, translations, SEO and form data were otherwise preserved.

### Preserved

- Document ID, slug, active/published status, category, layout, sort order.
- Existing hero/main image and all localized image ALT text.
- Technical body content, remaining BG Portable Text blocks, RU/EN translations except the duplicated opening heading.
- Existing SEO indexability and keywords.
- Product references and related-content relationships.
- No schema, frontend, API, form submission integration, Cloudflare, D1, Resend or deployment changes.

## Verification

- Exact full-document backup was saved to GitHub and re-read/verified before writes.
- Sanity writes were applied through a revision-guarded draft and published after readback.
- Sanity deployed-schema validator reported `valid`; the beta validator marks validation incomplete because custom validation callbacks (including custom slug uniqueness callbacks) are not executed. Built-in checks ran.
- Post-publish read-only query confirmed: slug unchanged, BG name/SEO, four advantages, four steps, CTA, five typed form fields, duplicate headings removed in BG/RU/EN, and both existing image references preserved.
- External web reader could not access the live service URL; visual/browser rendering and live form submission were not independently verified.
- No frontend build or deployment was required because no code/schema was changed.

## Documentation integration

This PR contains only this unique audit and its unique backup artifact. Shared `CHANGELOG.md`, Technical Passport and OPEN_QUESTIONS integration is deferred to the coordinated documentation pass because other open PRs touch shared documentation files.
