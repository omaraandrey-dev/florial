# Irrigation controller product descriptions — 2026-11-15

## Status

**Published in Sanity Production.** This was a content-only update; no application or schema change was made.

## Scope

- Sanity project: `bxvcy0qs`
- Dataset: `production`
- Root category: `controllers` (document ID `587a2ee3-8152-4193-bff1-dfd3838f12c5`)
- Scope: all 24 published products linked to the root category and its four child categories.
- Languages: Bulgarian (primary), Russian and English.

### Product families

- Rain Bird ESP-TM2 — 8 products (indoor/outdoor variants and 4/6/8/12 stations).
- Rain Bird ESP-RC2 — 4 products (indoor/outdoor variants with built-in Wi-Fi).
- Rain Bird ESP-BAT-BT — 4 products (1/2/4/6 stations).
- Rain Bird ESP-9V and ESP-9V-DVF-KIT — 5 products (1/2/4/6 stations plus the one-zone valve kit).
- Rain Bird LNK2 Wi-Fi module — 1 product.
- Rain Bird 1ZEHTMR hose-end timer — 1 product.
- Rain Bird RSD-BEx rain sensor — 1 product.

## Fields changed

For each of the 24 products:

- `description` — Bulgarian Portable Text.
- `translations.ru.formattedDescription` — Russian Portable Text.
- `translations.en.formattedDescription` — English Portable Text.

Total: 72 localized description fields.

The storefront already selects `formattedDescription` when available and renders Portable Text through `src/components/RichText.tsx`. The renderer supports H2/H3, strong emphasis, lists and safe internal links. Each refreshed description uses 4–5 H2 sections, selective bold emphasis and one verified internal link per locale. H3 was intentionally not added because there are no nested subsections that need it.

The content was expanded around the actual model: station count, installation type, mains or battery power, programming options, Wi-Fi/Bluetooth functionality, rain-sensor input, valve/solenoid compatibility, typical applications and installation considerations. Similar products share a consistent information architecture, but model-specific values and differences are retained.

## Technical source checks

Sanity product specifications were treated as the primary source for the exact Florial SKU/model configuration. Manufacturer references used to check model-family capabilities:

- [Rain Bird ESP-TM2 overview](https://www.rainbird.com/es/professionals/TakeControl) — fixed station variants, programs, start times and optional LNK2.
- [Rain Bird LNK2 Enhanced Control](https://www.rainbird.com/products/lnk2-enhanced-control) — controller compatibility and connected-control functions.
- [Rain Bird battery-operated controllers](https://www.rainbird.com/professionals/specifier/battery-operated-controllers) — ESP-BAT-BT and ESP-9V family, battery operation, IP68, station variants and compatible solenoids.
- [Rain Bird ESP-BAT-BT](https://www.rainbird.com/products/esp-bat-bt) — Bluetooth app workflow and controller features.
- [Rain Bird 1ZEHTMR international hose-end timer](https://www.rainbird.com/products/easy-program-hose-end-timer-international) — one-zone use, two daily starts, run time, battery and operating conditions.
- [Rain Bird RSD rain sensor series](https://www.rainbird.com/products/rsd-series-rain-shut) — 5–20 mm adjustment, hygroscopic discs, drying adjustment and controller compatibility.

No unsupported percentage water-saving guarantee was added. Battery life is expressed as manufacturer-stated/conditional rather than a guaranteed service life. The ESP-9V one-zone model is distinguished from multi-zone versions regarding the master-valve/pump output. The ESP-9V-DVF-KIT is described as a one-zone set with the 100-DVF valve, not as a controller-only product.

## Backup and write procedure

- Before any Sanity write, exported full published snapshots for all 24 target documents.
- Backup path: `docs/backups/sanity-controllers-before-description-refresh-2026-11-15.json`.
- Backup committed on branch: `content/controller-product-descriptions-2026-11-15`.
- The backup contains 24 complete product documents and their pre-change revisions.
- Drafts were created using optimistic revision guards, read back, validated, then published using the exact draft revisions.

## Verification

- Category query: 24 published products in scope.
- Draft validation: 24/24 returned `valid`. The validation result is marked `complete=false` because custom validation callbacks (including custom slug uniqueness callbacks) were not executed by the validation tool. Built-in checks passed. No slug was changed.
- Publication: 24/24 published successfully with revision guards.
- Post-publication Production read-back: 24/24 products present; 0 remaining drafts.
- Every published product has 4–5 H2 headings and at least one internal link in BG/RU/EN.
- Text-length read-back: approximately 1,400–2,000 characters per locale, depending on the model.
- A field comparison against the full pre-change snapshot confirmed no changes to names, slugs, SKUs, prices, old prices, stock values, product types, category references, images/galleries, related-content references, SEO or product specifications.

## Scope explicitly left unchanged

- Product names, short descriptions, slugs and SKUs.
- Prices, old prices, stock status and stock quantities.
- Product categories and related-content references.
- Product specifications and compatibility fields.
- Images, galleries and image metadata.
- SEO metadata, H1, canonical, noIndex and category content.
- Sanity schema, frontend code, navigation, analytics, sitemap/RSS, Cloudflare, D1, Resend and Cloudflare Pages deployment.

## Remaining verification

- Visual inspection of representative live product pages in BG/RU/EN and mobile layout remains open. The public page fetch was not available during this run, so no claim of visual QA is made.
- Google recrawl/indexing and search impact are not confirmed.

