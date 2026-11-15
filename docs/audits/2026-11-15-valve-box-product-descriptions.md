# Rain Bird valve boxes and hydrant accessories — 2026-11-15

## Scope

- Sanity project: `bxvcy0qs`
- Dataset: `production`
- Category: `Шахти`, slug `shahti`, document ID `6d09232c-4c54-4ba2-b463-1cb61d7345b8`
- Parent category: irrigation equipment
- Products reviewed and updated: 7
- Locales: BG, RU, EN

## Products

| Model | SKU | Product type |
|---|---|---|
| Rain Bird P33 | LP3300 | Underground quick-coupling hydrant |
| Rain Bird P33DK | LP3310 | Operating key for P33 |
| Rain Bird VBA02672 | VBA02672 | Round valve box, bayonet lid |
| Rain Bird VBA02673 | VBA02673 | Round valve box, clip-on lid |
| Rain Bird VBA02674 | VBA02674 | Rectangular valve box, size L |
| Rain Bird VBA02675 | VBA02675 | Rectangular valve box, size XL |
| Rain Bird VBA17186 | VBA17186 | Round hydrant with integrated 3/4-inch valve |

The category contains two P33 quick-coupling products and one integrated hydrant in addition to the four actual VBA valve boxes. Their descriptions preserve those distinctions rather than incorrectly presenting every item as an empty valve box.

## Work completed

- Expanded Bulgarian `description` Portable Text for all 7 products.
- Added localized `translations.ru.formattedDescription` and `translations.en.formattedDescription` for all 7 products.
- Each locale has an introduction, four H2 sections, bold emphasis, three practical bullet points and two internal links:
  - `/category/klapani`
  - `/services/avtomatichno-napoyavane`
- The copy covers intended use, operating principle where relevant, construction/materials, dimensions, pipe openings and threads, installation, selection, maintenance and service access.
- Product-specific notes distinguish P33 from P33DK; bayonet lid on VBA02672 from clip-on lid on VBA02673; bolt-secured lids and separately sold extensions for VBA02674/VBA02675; and the integrated valve in VBA17186.

## Technical accuracy

Official Rain Bird manufacturer information was used to cross-check product features and dimensions:

- VBA series valve boxes: https://www.rainbird.com/products/vba-series-valve-boxes
- P-33 / P-33DK: https://www.rainbird.com/products/p-33-series-p-33-p-33dk
- Rain Bird international catalogue dimensions: https://www.rainbird.com/sites/default/files/media/documents/2022-05/d41409_2022_intl_turf_catalog_v8_eng.pdf

Important distinctions retained:
- P33 has a 3/4-inch male threaded inlet, maximum operating pressure 6.2 bar and 13.8 cm height; a compatible P33DK key is required. Manufacturer materials/features include Delrin valve cage, stainless-steel spring, O-ring and UV-inhibited impact-resistant plastic.
- P33DK is the dedicated P33 key, with 3/4-inch female inlet, 3/4-inch male outlet and 18 cm height. It is not described as universal.
- VBA02672: bayonet lid; lid Ø160 mm, base Ø200 mm, height 236.5 mm, pipe openings 67 × 64 mm.
- VBA02673: clip-on lid; lid Ø242 mm, base Ø335 mm, height 255 mm, pipe openings 52 × 89 mm. The product title currently says “for up to 3 valves”; the description does not guarantee that count because actual fit depends on valve/fitting dimensions and service clearance.
- VBA02674: lid 386 × 267 mm, base 505 × 370 mm, height 305 mm, pipe openings 70 × 105 mm; VBA02676 extension sold separately.
- VBA02675: lid 545 × 380 mm, base 630 × 480 mm, height 305 mm, pipe openings 80 × 105 mm; VBA07777 extension sold separately.
- VBA17186 is a round irrigation hydrant with an integrated 3/4-inch valve, not an empty box. The current product specification does not state its maximum operating pressure, so the description explicitly asks the installer to verify it rather than inventing a rating.

## Backup and data protection

Full pre-write snapshots of all 7 published Sanity documents were captured using `get_document` before any writes and committed to:

`docs/backups/sanity/2026-11-15-valve-box-products-before-description-refresh.xml`

Backup commit: `59a2096ff3e22dca51e6a6eb160f17b39e2aaadc`.

Only these fields were changed:
- root `description`
- `translations.ru.formattedDescription`
- `translations.en.formattedDescription`

Names, slugs, SKUs, prices, old prices, stock, categories, images/galleries, specifications, SEO, related products and related content were not edited.

## Validation and publication

- Sanity schema validation: 7/7 documents reported `valid`.
- The validator marks checks incomplete because custom validation callbacks (including custom slug-uniqueness callbacks) are not executed by this tool; built-in checks ran.
- All 7 drafts were published with revision guards.
- Production read-back confirmed 7/7 published and 0 remaining drafts.
- Read-back confirmed four H2 headings, two actual link spans and three bold spans in each Bulgarian description; four H2 headings and two actual link spans in each RU/EN formatted description. Three product-specific bullets were also confirmed in each BG description.
- Existing `ProductPage.tsx` reads `formattedDescription` when present. `src/lib/richTextUtils.mjs` includes safe relative-link classification. The deployed product schema supports H2/H3, strong marks, lists and relative internal links.

## Not performed / remaining verification

- No code, Sanity schema, category relationships, navigation, analytics, sitemap/RSS, Cloudflare configuration, D1, Resend or Pages deployment was changed.
- Live browser/visual verification of representative product pages in BG/RU/EN, internal-link click-through and mobile layout remains open.
- Google recrawl/indexing and search-performance impact are not confirmed.
