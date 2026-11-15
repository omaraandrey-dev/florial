# Drip-fitting product description refresh — 2026-11-15

## Scope and target

- Sanity project: `bxvcy0qs`
- Dataset: `production`
- Category: `category-drip-fittings`, slug `kapkovo-napoyavane-fitingi`
- Published products: 6
- Changed fields only: BG root `description`; RU `translations.ru.formattedDescription`; EN `translations.en.formattedDescription`
- Each locale has 5 H2 headings, 3 bullet blocks, selective bold emphasis and 2 internal links.
- Internal links: `/category/kapkovo-napoyavane-trabi` (published drip-tube category) and `/services/avtomatichno-napoyavane` (published active service).

## Products

| Product | SKU | Document ID | Description focus |
|---|---|---|---|
| Rain Bird XFF COUP | X36370 | `3f96175c-2e23-49d4-9697-97df5cf68cd0` | Straight coupling, two 17 mm barbs |
| Rain Bird XFF ELBOW | X36372 | `fcfe9234-992e-4c2a-ae5f-500d14afbf16` | 90° elbow, two 17 mm barbs |
| Rain Bird XFF TEE | X36373 | `0693b9f5-bf1b-4479-a218-8e8d7ff409ae` | Three-way branch, three 17 mm barbs |
| Rain Bird XFF-MA-075 | X36375 | `73b45db4-4fc3-455f-86ff-35bd8a0e330a` | 17 mm barb to 3/4″ MPT male thread |
| Support stake 16 mm | 3112/1620 | `0fd0565a-e2d8-4aeb-bc68-92e3b26020a5` | Ground fixing for 16 mm drip hose; pack 100; length not stated |
| Brown support stake 16–20 mm, 145 mm | 3112/16202 | `582265a9-944e-4928-aee2-577cbe34e774` | 145 mm brown stake for 16–20 mm hose; pack 100 |

## Technical content and sources

### Rain Bird XF fittings

The official Rain Bird XF Insert Fittings product page confirms:
- 17 mm barbed insert fitting family;
- XFF-COUP is a coupling, XFF-ELBOW an elbow, XFF-TEE a tee, and XFF-MA-075 a 17 mm barb × 3/4″ MPT male adapter;
- compatibility with Rain Bird XF dripline, including XFD and XFS;
- operating pressure 1.0–3.5 bar; retaining clamps are required at 4.1 bar (60 psi).

Sources:
- https://www.rainbird.com/products/xf-dripline-insert-fittings
- https://www.rainbird.com/professionals/xf-dripline-insert-fittings
- https://www.rainbird.com/professionals/specifier/drip-fittings-stakes-risers
- https://www.rainbird.com/sites/default/files/media/documents/2022-05/d41409_2022_intl_turf_catalog_v8_eng.pdf

### Support stakes

The descriptions use only existing Sanity facts. For SKU 3112/1620, no length is present in the published specification, so the copy explicitly does not state one. For SKU 3112/16202, the published name/specification supports 16–20 mm hose, brown colour, 145 mm length and a 100-piece pack. No universal stake spacing or soil suitability claim was added.

## Backup and publication evidence

- Full pre-write snapshots: `docs/backups/sanity/2026-11-15-drip-fitting-products-before-description-refresh.xml`
- Backup commit: `0fbe8cde88ec8e2991ebc66629ef621998b8a35a`
- Pre-write published revisions were used as optimistic revision guards. No drafts existed before editing.
- Schema validation: 6/6 documents reported `valid`. Validation was incomplete because custom validation callbacks, including custom slug uniqueness callbacks, were not executed; the validator resolved the legacy deployed schema.
- All six drafts were published with revision guards.
- Post-publication Production read-back: 6/6 products found, 0 remaining drafts; all BG/RU/EN descriptions have 5 H2 headings, 3 bullet blocks and 2 internal links.

## Preserved data

Post-publication read-back confirmed product names, slugs, SKUs, prices, old prices, stock statuses, category references, related-content/product references, SEO and specifications were unchanged. No image/gallery references were changed. Only the three description fields per product were updated.

## Frontend and release scope

At GitHub main SHA `e7ba53839775599c7a9625d8eef4b21a520efebd`:
- `src/pages/ProductPage.tsx` selects `translations[language].formattedDescription` when populated.
- `src/components/RichText.tsx` renders Portable Text H2/H3, strong marks, lists and safe localized internal links.
- `src/lib/richTextUtils.mjs` classifies internal links safely.

No code, schema, navigation, analytics, sitemap/RSS, Cloudflare configuration, D1, Resend or Pages deployment changed. No build was required for this content-only update.

## Remaining checks

- Live storefront visual/browser verification on desktop and mobile in BG/RU/EN, including link click-through.
- Google recrawl, indexing and ranking effects are not confirmed.
