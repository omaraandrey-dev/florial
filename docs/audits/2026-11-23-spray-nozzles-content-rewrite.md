# Sanity product content rewrite — spray nozzles — 2026-11-23

## Scope and source state

- GitHub `main` baseline: `7e657dea3093acd83a41ec9a53290bddd6b22a64`.
- Sanity project: `bxvcy0qs`; dataset: `production`; perspective checked: `published`.
- Parent category ID: `ad3914b4-5ab0-49e3-868a-52621c4654a7`; parent category count: 26 active products.
- Spray-nozzle child category ID: `6534adc5-78f7-4276-bbdd-2843ef30420e`; exact active product count: 17.
- Before editing, a published-data backup was captured for all 26 products in the parent nozzle category. The snapshot is stored at `docs/backups/sanity-nozzles-current-2026-11-23.json` in this branch.

## Products processed

| SKU | Model | Sanity document ID |
|---|---|---|
| P10004 | 4-VAN | 11a27fdf-2904-40b8-9ba3-264bc22a4359 |
| P10006 | 6-VAN | 1d4a4b1d-aea5-4d1e-bd19-1f4933de98d4 |
| P10008 | VAN-8 | 47d220db-38af-4b22-9995-dc52de55efb7 |
| P1001001 | VAN-10 | 2e200586-8866-4526-adc7-ae0becb35601 |
| P1001201 | VAN-12 | 81dfc913-3bfe-451b-9c76-fa468366cdbb |
| P1001501 | VAN-15 | f36e2aff-6c5b-4544-a6c0-a7c413fbb181 |
| P10018 | VAN-18 | a6e7016e-7bba-4078-b76c-6afef30661d6 |
| HE0801 | HE-VAN-8 | 21e4bb9f-c635-4d6f-882d-c9fefb70b8d3 |
| HE1001 | HE-VAN-10 | e25925d0-b54f-45fa-844e-ad4fde8e6440 |
| HE1201 | HE-VAN-12 | de88e310-c33d-4111-9ad6-c638b49a2ed8 |
| HE1501 | HE-VAN-15 | 63289ec9-c0dd-4f13-ae4d-1f7f00a442c6 |
| A47047 | 9-SST | 3f5c3d95-ec09-40f7-b5ab-86337b3a362a |
| A47008 | 15-SST | 6f45d30e-1d6b-48e5-8ffd-c72faeb733b0 |
| A47007 | 15-CST | a365a2c3-1936-4076-a7a7-ba462b21c07f |
| A47006 | 15-EST | ccbd32bb-7f3f-4109-8928-4518f21e7ec4 |
| A47033A | 15-LCS | f6a7da86-77fd-4b8d-b761-1d86569a12ae |
| A47034A | 15-RCS | c8902118-2d87-4f8d-aa3e-bbcafdc5593a |

## Work performed

- Rewrote the full product description in BG and the localized `formattedDescription` fields in RU and EN for all 17 products.
- Each locale now has five H2 sections, four strong spans, two internal links, and the Econt / engineer-delivery / paid installation-service wording.
- Added product-specific application text and preserved model, radius, sector/pattern, pressure, optimum pressure, filter, compatibility, efficiency, strip dimensions, flow, trajectory and performance notes where applicable.
- Corrected 4-VAN RU/EN specification arc to `0°–330°` (the previous localized values incorrectly showed `0°–360°`).
- Corrected RU/EN product-type, pattern, tag, coverage and flow fields for 15-SST, 15-CST and 15-EST. The metric values at 2.1 bar are now:
  - 15-SST: 1.2 × 9.2 m; 4.6 L/min.
  - 15-CST: 1.2 × 9.2 m; 4.6 L/min.
  - 15-EST: 1.2 × 4.6 m; 2.3 L/min.
- No price, stock, SKU, slug, category membership, images, availability or other unrelated product fields were changed.

## Verification

- Sanity patch operations: 17/17 successful.
- Schema validation: 17/17 reported `valid`. The validator marks checks as incomplete because custom validation callbacks were not executed; built-in checks ran. This limitation is retained rather than claiming full custom validation.
- Publish: 17/17 published successfully.
- Published-perspective readback: 17/17 documents returned.
- Every BG/RU/EN description passed the structural checks: five H2 headings, four strong spans, the two expected internal links, delivery wording present, and no literal `undefined` / `null`.
- Published category counts after the change: 17 spray nozzles; 26 products in the parent nozzle category.
- Raw-perspective readback found no remaining drafts for the 17 processed IDs.
- The two internal destinations were checked in published Sanity: category slug `spray-nozzles` and blog slug `montazh-podmyana-remont-razpruskvachi-nesebar`.
- Storefront browser/visual QA was not performed. This record confirms published Sanity content, not a rendered-page visual inspection.

## Manufacturer references used

- Rain Bird VAN specification guide: https://www.rainbird.com/sites/default/files/media/documents/2018-02/bro_SpraysSpecificationGuideInteractive.pdf
- Rain Bird 4-VAN product page: https://store.rainbird.com/4van-4-ft-van-series-variable-arc-spray-nozzle.html
- Rain Bird HE-VAN technical specification: https://www.rainbird.com/sites/default/files/media/documents/2018-02/ts_HE-VAN.pdf
- Rain Bird HE-VAN product specification: https://www.rainbird.com/products/he-van-high-efficiency-variable-arc-nozzles
- Rain Bird MPR spray nozzle performance charts: https://www.rainbird.com/sites/default/files/media/documents/2020-09/mpr-spray-nozzle-performance-charts_1.pdf
- Rain Bird 9-SST product page: https://store.rainbird.com/9sst-9-ft-mpr-nozzle-side-strip-spray.html

## Tooling note

The requested Humanizer connector was not available among connected tools/plugins. The BG/RU/EN editorial rewrite was performed manually; no external Humanizer service was used.

## Boundaries and next step

- No Sanity schema, Cloudflare configuration, secrets, D1, Resend, source code or Production deployment was changed.
- The next product-content group is the nine R-VAN rotary nozzles. Their manufacturer performance tables and current Sanity specifications must be checked before editing.
- Common documents (`CHANGELOG.md`, technical passport and roadmap index) are intentionally left untouched in this category-specific PR because several unrelated documentation PRs are already open. Integrate the category status into common documents in one synchronized documentation pass after checking the latest `main`.
