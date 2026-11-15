# Irrigation sprinkler product descriptions — 2026-11-15

## Status

**Published in Sanity Production.** This was a content-only update; no application or schema change was made.

## Scope

- Sanity project: `bxvcy0qs`
- Dataset: `production`
- Root category: `sprinklers` (document ID `de7ecefe-0a25-41ed-8146-ce475efb2378`)
- Child categories: rotor sprinklers (`0732d410-0843-4d43-8fe4-c79913845b5b`) and static sprinklers (`2a2b54f2-7181-4e7d-848a-77199a9c6ada`)
- Scope: all 20 published products linked to these categories.
- Languages: Bulgarian (primary), Russian and English.

### Product families

- Rain Bird 5000 Series — 2 products: 5004PC30 and 5004+FC.
- Rain Bird Falcon 6504 — 2 products: FALCON FC and FALCON PC.
- Rain Bird 3500 Series — 2 products: 3504-PC and 3504-PC-SAM.
- Rain Bird 8005 Series — 2 products: 8005 and 8005SS.
- Rain Bird 1800 spray bodies — 7 products: 1802, 1804, 1804-SAM, 1806, 1806-SAM, 1812 and 1812-SAM.
- Rain Bird UNI-Spray — 5 products: US-400, US-410HE, US-412HE, US-415HE and US-418.

## Fields changed

For each of the 20 products:

- `description` — Bulgarian Portable Text.
- `translations.ru.formattedDescription` — Russian Portable Text.
- `translations.en.formattedDescription` — English Portable Text.

Total: 60 localized formatted-description fields. Existing plain-text localized descriptions were retained.

Each locale contains five H2 sections: purpose/construction, technical specifications, nozzle and irrigation adjustment, design/installation/maintenance, and compatible components/next steps. Selective strong emphasis highlights the product/model and technical sections. Two internal links are included per locale:
- `/category/nozzles`
- `/blog/montazh-podmyana-remont-razpruskvachi-nesebar`

The storefront's existing `RichText` renderer supports H2/H3, strong marks and safe internal links. H3 was not added because the product sections do not require nested subsections.

## Content and technical checks

Content was based first on each product's own published Sanity specifications and then cross-checked against Rain Bird manufacturer documentation.

- [Rain Bird 5000 Series technical specification](https://www.rainbird.com/sites/default/files/media/documents/2023-12/d42380_5000_series_rotor_tech_spec.pdf) — radius, pressure, flow, arc adjustment, nozzle characteristics and Plus Flow Shut-Off.
- [Rain Bird Falcon 6504 Series](https://www.rainbird.com/products/falcon-6504-series) — 11.9–19.8 m radius, 2.1–6.2 bar pressure, flow, Rain Curtain nozzles, SAM and full/part-circle variants.
- [Rain Bird 3500 Series](https://www.rainbird.com/products/3500-series-rotor-sprinklers) — 4.6–10.7 m radius, 1.7–3.8 bar pressure, flow, 40°–360° adjustment and SAM capability up to 2.1 m.
- [Rain Bird 8005 Series](https://www.rainbird.com/products/8005-series) — 11.9–24.7 m radius, 3.5–6.9 bar pressure, 0.86–8.24 m³/h flow, Rain Curtain nozzles, SAM, Memory Arc and stainless-steel riser option.
- [Rain Bird 1800 Series spray bodies](https://www.rainbird.com/products/1800-series-spray-sprinkler-bodies) — model pop-up heights, 1/2″ inlet, pressure range, flow-by and SAM check-valve capacity.
- [Rain Bird UNI-Spray Series](https://www.rainbird.com/products/uni-spray-series-spray-sprinkler-bodies) — US400 and pre-attached HE-VAN/VAN model variants, pressure range, optimum pressure and flow-by.

Model distinctions retained:
- 5004PC30 is part-circle/reversing full-circle, with its catalogued 3.0 nozzle and five additional nozzle sets.
- 5004+FC is a fixed 360° Plus model with Flow Shut-Off.
- Falcon FC is fixed full-circle; Falcon PC has an adjustable part-circle arc.
- 3504-PC-SAM includes SAM; 3504-PC does not.
- 8005SS has the stainless-steel riser; standard 8005 does not.
- 1800 SAM variants are distinguished from base bodies; SAM is not claimed for non-SAM products.
- US-400 is the base body without a nozzle; HE-VAN and VAN versions have the specified pre-attached nozzle.

No unsupported water-saving percentage or guaranteed performance promise was added. Actual radius and flow are qualified as dependent on pressure, nozzle and hydraulic zone design.

## Backup and write procedure

- Full published snapshots for all 20 target documents were exported before any Sanity write.
- Backup path: `docs/backups/sanity-sprinklers-before-description-refresh-2026-11-15.json`.
- Backup committed on branch: `content/sprinkler-product-descriptions-2026-11-15`.
- The backup contains 20 complete product documents and their pre-change revisions.
- Drafts were created/updated using optimistic revision guards, read back, validated, and published using exact draft revisions.

## Verification

- Category scope: 20 published products — 8 rotor sprinklers and 12 static spray bodies.
- Sanity validation: 20/20 valid. The validation tool marked checks incomplete because custom validation callbacks (including custom slug uniqueness callbacks) are not executed by this tool; built-in checks passed.
- Publication: 20/20 published successfully with revision guards.
- Post-publication Production read-back: 20/20 products present; 0 remaining drafts.
- Every published product has five H2 headings, four strong-marked spans and two internal links in each locale.
- Description lengths after formatting: approximately 1,068–1,451 characters in BG, 1,029–1,404 in RU and 1,077–1,367 in EN, depending on the model.
- Compared the full pre-change snapshot with current Production documents: all fields outside the requested description fields are unchanged.

## Scope explicitly left unchanged

- Product names, short descriptions, slugs and SKUs.
- Prices, old prices, stock status and stock quantities.
- Product categories and related-content references.
- Product specifications and compatibility fields.
- Images, galleries and image metadata.
- SEO metadata, H1, canonical, noIndex and category content.
- Sanity schema, frontend code, navigation, analytics, sitemap/RSS, Cloudflare, D1, Resend and Cloudflare Pages deployment.

## Remaining verification

- Visual inspection of representative live product pages in BG/RU/EN and mobile layout remains open. Firecrawl could not fetch the page because the connected account had insufficient credits; the direct web fetch also could not access the storefront URL.
- Google recrawl/indexing and search impact are not confirmed.

