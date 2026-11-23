# Sanity product description refresh — spray nozzles

**Date:** 2026-11-23  
**Status:** COMPLETE — 26/26 products published and read back from Sanity Production  
**Sanity project/dataset:** `bxvcy0qs / production`  
**Root category:** `Дюзи` — `ad3914b4-5ab0-49e3-868a-52621c4654a7`

## Scope

All 26 active products linked to the nozzle category were processed in four product families:

- **VAN — 7 products:** P10004, P10006, P10008, P1001001, P1001201, P1001501, P10018.
- **HE-VAN — 4 products:** HE0801, HE1001, HE1201, HE1501.
- **MPR strip — 6 products:** A47047 (9-SST), A47008 (15-SST), A47007 (15-CST), A47034A (15-RCS), A47006 (15-EST), A47033A (15-LCS).
- **R-VAN — 9 products:** A84659, A84660, A84661, A84664, A84665, A84666, A84667, A84668, A84669.

## Updated fields

For all 26 products:

- `description` — Bulgarian Portable Text.
- `translations.ru.formattedDescription` — Russian Portable Text.
- `translations.en.formattedDescription` — English Portable Text.
- `shortDescription` and localized `translations.ru.shortDescription` / `translations.en.shortDescription`.

Each description has five H2 sections, selective emphasis, and two verified internal links. The links point to the relevant Sanity category route and the existing sprinkler installation/maintenance article. Existing product names, SKUs, images, prices, stock status, category references and SEO metadata were not changed.

Selected radius values in specifications were aligned in all three languages:

- VAN-12: 2.7–3.7 m; VAN-15: 3.4–4.6 m; VAN-18: 4.3–5.5 m.
- HE-VAN-8: 1.8–2.4 m; HE-VAN-10: 2.4–3.0 m; HE-VAN-12: 3.0–3.7 m.

The current Rain Bird HE-VAN product page lists HE-VAN-12 as 10–12 ft (3.0–3.7 m). The older 2023 performance chart contains a 2.7 m radius at 1.0 bar; the current product-page model comparison was used for the localized product radius field. This source-version difference is retained as a note rather than silently mixing nominal model range and pressure-table performance.

## Technical audit highlights

### VAN

- 4-, 6- and 8-VAN: adjustable arc 0°–330°.
- 10-, 12-, 15- and 18-VAN: adjustable arc 0°–360°.
- Pressure: 1.0–2.1 bar; optimum: 2.1 bar.
- Model radii: 4-VAN 0.9–1.2 m; 6-VAN 1.2–1.8 m; 8-VAN 1.8–2.4 m; 10-VAN 2.1–3.1 m; 12-VAN 2.7–3.7 m; 15-VAN 3.4–4.6 m; 18-VAN 4.3–5.5 m.
- Corrected the VAN-8 short-description arc from 0°–360° to 0°–330° and corrected the VAN-12/15/18 radius values in localized specifications.

### HE-VAN

- Adjustable arc: 0°–360°.
- Pressure: 1.0–2.1 bar; optimum: 2.1 bar; spacing: 1.8–4.6 m.
- Radii used in the product cards: HE-VAN-8 1.8–2.4 m; HE-VAN-10 2.4–3.0 m; HE-VAN-12 3.0–3.7 m; HE-VAN-15 3.7–4.6 m.
- Descriptions include the manufacturer's average DULQ of 70% and the stated improvement of more than 40% versus typical variable-arc spray nozzles. No guaranteed water-saving percentage was added.

### MPR strip nozzles

The 15 Strip performance data below are stated at 2.1 bar and zero-wind test conditions; the pattern trajectory is 30°:

- 9-SST: 2.7 × 5.5 m; 6.5 L/min.
- 15-SST: 1.2 × 9.2 m; 4.6 L/min.
- 15-CST: 1.2 × 9.2 m; 4.6 L/min.
- 15-RCS and 15-LCS: 1.2 × 4.6 m; 1.9 L/min.
- 15-EST: 1.2 × 4.6 m; 2.3 L/min.

The descriptions distinguish side, centre, end and left/right corner strip patterns. The 15-RCS and 15-LCS short descriptions were corrected to the 2.1 bar coverage dimensions rather than the lower-pressure 0.8 × 3.2 m figures. The white filter for Rain Bird 1800 bodies is described as included.

### R-VAN

- Adjustable models: 45°–270°.
- Full-circle variants: fixed 360°.
- Pressure: 2.1–3.8 bar; recommended: 3.1 bar.
- Radius ranges: R-VAN14 2.4–4.6 m; R-VAN18 4.0–5.5 m; R-VAN24 5.2–7.3 m.
- Strip patterns: LCS 1.5 × 4.6 m; RCS 1.5 × 4.6 m; SST 1.5 × 9.1 m. Flow ranges already present in the product specifications were preserved.
- Corrected short descriptions that stated 40°–270° instead of 45°–270°, and corrected the R-VAN14/R-VAN18 radius ranges, including the full-circle variants.

## Verification

- Published active product count in the root category after the update: **26**.
- Read-back: all 26 published documents were queried after publication.
- All 26 documents passed the Sanity validator's reported built-in validation status.
- The validator reports `complete=false` because custom validation callbacks (including the custom slug `isUnique` callback) are not executed by this validation tool. Built-in slug uniqueness checks were run.
- Draft count for the 26 target IDs after publication: **0**.
- Localized descriptions and short descriptions were read back from the published perspective. Each language has five H2 sections and two internal links.
- Internal category routes verified against published Sanity category slugs: `/category/spray-nozzles` and `/category/rotator-nozzles`. The linked sprinkler service article slug was also verified.

## Backups

Sanity snapshots were committed to branch `backup/sanity-nozzles-current-2026-11-23` before writes, including published and pre-existing draft states where applicable:

- `docs/backups/sanity-nozzles-van-latest-2026-11-23.json`
- `docs/backups/sanity-nozzles-he-van-latest-2026-11-23.json`
- `docs/backups/sanity-nozzles-he-van-after-publish-before-uniformity-fix-2026-11-23.json`
- `docs/backups/sanity-nozzles-he-van-before-restore-dulq-wording-2026-11-23.json`
- `docs/backups/sanity-nozzles-he1201-before-radius-correction-2026-11-23.json`
- `docs/backups/sanity-nozzles-strip-latest-2026-11-23.json`
- `docs/backups/sanity-nozzles-r-van-latest-2026-11-23.json`
- `docs/backups/sanity-nozzles-r-van-drafts-before-edit-2026-11-23.json`

The initial all-category snapshot at `docs/backups/sanity-nozzles-current-2026-11-23.json` predates later edits to the source documents and is retained only as historical evidence; the per-family snapshots above are the relevant pre-write backups.

## Sources

Manufacturer references used for technical checks:

- [Rain Bird VAN Series Variable Arc Nozzles](https://www.rainbird.com/products/van-series-variable-arc-nozzles)
- [Rain Bird HE-VAN High-Efficiency Variable Arc Nozzles](https://www.rainbird.com/products/he-van-high-efficiency-variable-arc-nozzles)
- [Rain Bird R-VAN Rotary Nozzles](https://www.rainbird.com/products/r-van-rotary-nozzles)
- [Rain Bird MPR 15 Strip Series — metric performance chart](https://www.rainbird.com/sites/default/files/media/documents/2018-02/chart_MPRnozzles_0.pdf)
- [Rain Bird 2021 International Turf Catalog](https://www.rainbird.com/sites/default/files/media/documents/2021-03/2021-intl-turf-catalog-v8.pdf)
- [Rain Bird 2023 International Turf Catalog — R-VAN and HE-VAN](https://www.rainbird.com/sites/default/files/media/documents/2022-11/d42140_2023_intl_turf_catalog_v3_eng.pdf)

## Limitations and exclusions

- The Humanizer connector was searched for but was not available in the connected plugin directory. The descriptions were edited and checked manually; no Humanizer tool use is claimed.
- This was a content-only Sanity update. No code, schema, deployment, Cloudflare, D1, Resend, price, stock, image, category-reference or SEO metadata changes were made.
- No independent hydraulic design or site-specific pressure/flow calculation was performed.
