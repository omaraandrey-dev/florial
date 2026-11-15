# Rain Bird drip-tube product description refresh — 2026-11-15

## Scope

- Sanity project: `bxvcy0qs`
- Dataset: `production`
- Category: `category-drip-tubes`, slug `kapkovo-napoyavane-trabi`
- Published products: 4
- Changed fields only: root BG `description`, `translations.ru.formattedDescription`, `translations.en.formattedDescription`
- No category content, product relationships, specifications, SEO, images, prices, stock or product identity fields changed.

## Products reviewed

| Product | SKU | Document ID | Distinct purpose |
|---|---|---|---|
| Rain Bird XFD-2333-100 | X44202 | `9c7da8ea-ac30-4faf-afe3-75301a4c250b` | Surface dripline with integrated pressure-compensating emitters |
| Rain Bird XFS-2333-100 | X48201 | `9d2784c8-f36b-471e-afc3-4927c5dd22d8` | Subsurface dripline with Copper Shield™ root-intrusion protection |
| Rain Bird XFD1600-100 | X45009 | `cce8b863-a3b8-4945-9db8-33236ce8f40a` | Blank distribution tubing; no built-in emitters |
| Rain Bird PCD-2333-100 | X44402 | `fb4c4f20-4299-41fb-97ce-badb13b04eac` | Pressure-compensating dripline with self-flushing emitter design |

## Editorial and technical content

- XFD-2333-100: 100 m coil, 16.1/13.6 mm OD/ID, 1.2 mm wall, 2.3 L/h emitters at 33 cm, 0.58–4.14 bar, 120-mesh filtration. Described as primarily surface-installed; the separate XFS line is identified for subsurface work.
- XFS-2333-100: 100 m coil, 16.1/13.6 mm OD/ID, 1.2 mm wall, 2.3 L/h at 33 cm, 0.58–4.14 bar, 120-mesh filtration. Content explains Copper Shield™, use of XF fittings for subsurface application, and air/vacuum relief and flush-point requirements.
- XFD1600-100: blank tubing without emitters, 100 m coil, 16.1/13.6 mm OD/ID and 1.2 mm wall. Content explicitly distinguishes it from emitter tubing and cautions against selecting fittings by a generic 16 mm label.
- PCD-2333-100: 100 m coil, 2.3 L/h at 33 cm, 15.9/13.61 mm OD/ID, 1.14 mm wall, 0.58–4.14 bar and 120-mesh filtration. Content explains pressure compensation, self-flushing design and the need to size laterals from manufacturer performance tables rather than coil length.

Each language version has 5–6 H2 headings, bold emphasis, three practical bullet points and two internal links. The internal links target the published drip-fittings category `/category/kapkovo-napoyavane-fitingi` and active automatic-irrigation service `/services/avtomatichno-napoyavane`.

## Sources checked

- Rain Bird XFD on-surface dripline: https://www.rainbird.com/products/xfd-surface-dripline
- Rain Bird XFS subsurface dripline with Copper Shield™: https://www.rainbird.com/products/xfs-subsurface-dripline-copper-shieldtm-technology
- Rain Bird PCD technical specification (D42407): https://www.rainbird.com/sites/default/files/media/documents/2025-04/d42407_-_pcd_dripline_-_tech_spec_042025.pdf
- Rain Bird XF Series blank tubing: https://www.rainbird.com/products/xf-series-blank-tubing
- Rain Bird blank tubing specifications: https://www.rainbird.com/products/blank-tubing
- Rain Bird international catalogue model table for XFS: https://www.rainbird.com/sites/default/files/media/documents/2022-11/d42140_2023_intl_turf_catalog_v3_eng.pdf

## Backup and publication evidence

- Full pre-write snapshots: `docs/backups/sanity/2026-11-15-drip-tube-products-before-description-refresh.xml`
- Backup commit: `c5dd176ba24ff0237af027bfc95118ffd727b449`
- Pre-write published revisions were used as revision guards when creating drafts; final drafts were also published with their current revision guards.
- Schema validation: 4/4 documents reported `valid`; validation is marked incomplete because custom validation callbacks (including custom slug uniqueness callbacks) are not run by the beta validation tool.
- Post-publication Production read-back: 4/4 products found. Each locale has 5–6 H2 sections, 3 bullet blocks and 2 internal links.
- Read-back confirmed SKUs, prices (EUR 186.13 / 259.92 / 147.49 / 114.24), stock status `onRequest`, slugs and category references remain unchanged.

## Data-quality follow-up — not changed

The existing XFD1600-100 `specifications` row with name “Съвместимост” says “Фитинги за капкова тръба с външен диаметър 16 mm”. Rain Bird's official XF blank-tubing documentation says the brown XF blank tubing accepts XF insert fittings, Easy Fit compression fittings and 17 mm insert fittings, and is **not compatible with 16 mm fittings**. The new descriptions explain the manufacturer guidance, but the specification row was not modified because this task was limited to descriptions. Correct that Sanity specification in a separately scoped content correction.

## Remaining checks

- Visual storefront QA on desktop and mobile for all four products in BG/RU/EN, including both internal links.
- Google recrawl/indexing and ranking effects are not confirmed.
- No code build or Pages deployment was required or run for this content-only change.
