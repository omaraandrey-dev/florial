# Valve product descriptions — 2026-11-15

## Scope

- Sanity project: `bxvcy0qs`
- Dataset: `production`
- Parent category: `65742b44-11c2-43ae-9551-e91eb675dc93`
- Child categories: `category-valves-24v`, `category-valves-9v`
- Published products reviewed and updated: 17
- Locales: BG, RU, EN

## Products

| Model | SKU |
|---|---|
| Rain Bird 100-DV-MM | B70500 |
| Rain Bird 100-DVF | B70311 |
| Rain Bird 100-DVF-TBOS | B70350 |
| Rain Bird 100-HV | H01000 |
| Rain Bird 100-HV-9V | H01040 |
| Rain Bird 100-HVF | H01010 |
| Rain Bird 100-PEB | B34073 |
| Rain Bird 100-PGA | B31410 |
| Rain Bird 100-PGA-9V | B31440 |
| Rain Bird 150-PGA | B31510 |
| Rain Bird 150-PGA-9V | B31540 |
| Rain Bird 150-PEB | B34083 |
| Rain Bird 200-PGA | B31610 |
| Rain Bird 200-PGA-9V | B31640 |
| Rain Bird 200-PEB | B34093 |
| Rain Bird LFV-075 | X12100 |
| Rain Bird LFV-075-9V | X12105 |

## Work completed

- Expanded the Bulgarian `description` Portable Text for all 17 products.
- Added localized `translations.ru.formattedDescription` and `translations.en.formattedDescription` for all 17 products.
- Each locale now has five H2 sections, selective bold emphasis, three practical installation/maintenance bullets, and two verified internal links:
  - `/category/controllers`
  - `/services/montazh-remont-elektromagnitni-klapani`
- Content covers purpose and operating principle, series/model differences, flow-control options, hydraulic selection, thread/connection variants, electrical coil type, installation and service.

## Technical accuracy points retained

- 24 VAC and 9 V DC latching solenoids are distinguished; they are not interchangeable and must be matched to the controller output.
- The model 100-HV-9V is explicitly marked as incompatible with Rain Bird ESP-BAT-BT.
- DV/DVF and HV/HVF low-flow/drip filter recommendations are described separately from LFV. LFV filter type and placement are deferred to LFV-specific instructions and water quality.
- PGA and PEB model-specific flow ranges and low-flow adjustment/filtration notes are included. PRS-D is described as a separate optional pressure-regulating module, not as included equipment.
- 100-DV-MM is described with male threads at both ends; the BSP/NPT thread standard is not assumed where the delivered variant must be confirmed.
- PEB thread variants and model-specific sizes/flow ranges are kept distinct.

## Backup and data protection

Full pre-write snapshots of the 17 published Sanity documents were committed before edits:

`docs/backups/sanity/2026-11-15-valve-products-before-description-refresh.xml`

The Sanity patches changed only:
- root `description`
- `translations.ru.formattedDescription`
- `translations.en.formattedDescription`

Names, slugs, SKUs, prices, stock, categories, images/galleries, specifications, SEO fields and related-content references were not edited.

## Validation and publication

- Sanity schema validation: 17/17 documents reported `valid`.
- The validation tool marks checks incomplete because custom validation callbacks (including custom slug-uniqueness callbacks) are not executed by this tool. Built-in validation ran.
- All 17 drafts were published with revision guards.
- Production read-back: 17/17 published; 0 remaining drafts.
- Production Portable Text read-back: 5 H2 headings and 2 internal links in BG/RU/EN for every product; four bold spans confirmed in the BG description for every product.
- Existing `src/components/RichText.tsx` was inspected at main. It supports H2/H3, strong marks, safe links and localized internal navigation.

## External technical references

Official Rain Bird product information used to cross-check series features and model specifications:

- DV/DVF: https://www.rainbird.com/products/dvdvf-series
- HV: https://www.rainbird.com/products/hv-series-line-automatic-sprinkler-valves
- PGA: https://www.rainbird.com/products/pga-series
- PEB/PESB: https://www.rainbird.com/products/pebpesb-series
- LFV: https://www.rainbird.com/products/lfv-series

## Not performed / remaining verification

- No code, Sanity schema, navigation, analytics, sitemap/RSS, Cloudflare configuration, D1, Resend, or Pages deployment was changed.
- Live visual/browser verification of representative product pages in BG/RU/EN, internal-link click-through and mobile layout was not completed.
- Google recrawl/indexing and search-performance effects are not confirmed.
