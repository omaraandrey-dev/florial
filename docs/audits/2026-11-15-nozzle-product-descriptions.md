# Rain Bird nozzle product description refresh — 2026-11-15

## Scope

- Sanity project: `bxvcy0qs`
- Dataset: `production`
- Root category: `nozzles` — `ad3914b4-5ab0-49e3-868a-52621c4654a7`
- Child category: `spray-nozzles` — `6534adc5-78f7-4276-bbdd-2843ef30420e`
- Child category: `rotator-nozzles` — `6690848d-a4a5-4386-b9ae-5f63604914b1`
- Published products reviewed and updated: 26 (17 spray nozzles, 9 rotary nozzles).

## Product families

- VAN: 7 models.
- HE-VAN: 4 models.
- R-VAN: 9 models, including adjustable/fixed-circle models and LCS/RCS/SST strip patterns.
- Fixed-pattern strip nozzles: 6 models — 15-CST, 15-EST, 15-LCS, 15-RCS, 15-SST and 9-SST.

## Sanity changes

For each of the 26 products, only these content fields were updated:

1. `description` — Bulgarian Portable Text.
2. `translations.ru.formattedDescription` — Russian Portable Text.
3. `translations.en.formattedDescription` — English Portable Text.

Each of the 78 descriptions contains five H2 sections, four strong emphasis spans and two internal links. The copy is model-specific: it distinguishes adjustable and fixed sectors, full-circle models, strip geometry, left/right corner patterns, side-strip patterns, coverage dimensions, pressure, spacing, flow and filter details.

Internal links:
- Spray-nozzle products: `/category/spray-nozzles`.
- Rotary-nozzle products: `/category/rotator-nozzles`.
- All products: `/blog/montazh-podmyana-remont-razpruskvachi-nesebar`.

Both category targets and the blog article slug were confirmed as published Sanity documents before publication.

## Backup and protection of existing data

- Complete pre-write snapshot of all 26 published product documents: `docs/backups/sanity/2026-11-15-nozzles-before-description-refresh.json`.
- Draft versions already existed before this task. Before replacing descriptions, core non-description fields were compared between the existing drafts and published documents: name, SKU, slug, price, stock, categories, images/galleries, SEO, specifications and related-content references. No differences were found in those fields.
- Existing product specifications, pricing, stock, categories, images, related content, SEO and other catalog fields were not edited.

## Validation and publication

- Sanity schema validation: 26/26 documents reported `valid`.
- The validator marked checks `complete=false` because custom callbacks (including custom slug uniqueness callbacks) are not run by this tool. Built-in validation rules passed.
- All 26 drafts were published with `ifRevisionId` optimistic-lock guards.
- Production read-back: 26/26 published; 0 remaining drafts.
- Read-back checks across all 78 localized descriptions: exactly five H2 blocks, four strong spans, two internal links, correct locale-specific link targets, no `undefined` text.

## Not changed

- No source code, Sanity schema, category relationship, product specification, SEO metadata, navigation, Analytics, sitemap/RSS, Cloudflare configuration, D1, Resend or Pages deployment was changed.
- No existing service, blog post or portfolio document was edited. The existing blog article is linked only; it remains unchanged.

## Remaining verification

- Live visual/browser QA of representative VAN, HE-VAN, R-VAN and strip-nozzle product pages in BG/RU/EN, including mobile layout and internal-link navigation, was not completed.
- Google recrawl/indexing and search impact are not confirmed.
