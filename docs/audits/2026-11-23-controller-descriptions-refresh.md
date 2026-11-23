# Controller descriptions refresh — 2026-11-23

**Status:** COMPLETE — 23/23 active controller products published and read back  
**Sanity project/dataset:** `bxvcy0qs / production`  
**Root category:** `Контролери` — `587a2ee3-8152-4193-bff1-dfd3838f12c5`

## Scope and inventory reconciliation

The live root category contains **23 active products**. The previous audit dated 15.11.2026 counted 24 because it also included the Rain Bird RSD-BEx rain sensor. The sensor is now a separate product in the published category `Сензори за автоматизация`:

- RSD-BEx product ID: `bf7db992-9380-4f45-a00c-bda51be6b408`
- SKU: `A61200`
- Category: `Сензори за автоматизация`

It is not part of the current controller root category count. The inventory difference is therefore reconciled; no controller is missing.

The 23 products processed:

- ESP-BAT-BT: ESP-BAT-BT1, ESP-BAT-BT2, ESP-BAT-BT4, ESP-BAT-BT6.
- ESP-TM2: F54232, F54234, F54228, F54236, F54238, F54224, F54226, F54242.
- Hose-end timer: ZA84007 (1ZEHTMR).
- ESP-9V: F48351, F48352, F48354, F48356, F48373.
- ESP-RC2: F56128, F56158, F56154, F56156.
- Wi-Fi accessory: F55005 (LNK2).

## Backup

A complete published snapshot of all 23 controller products was saved before editing:

- `docs/backups/sanity-controllers-current-2026-11-23.json`

The snapshot includes the original BG/RU/EN descriptions, short descriptions, specifications, localized specifications, SEO fields and document revisions.

## Changes made

For all 23 products:

- Added a fifth H2 section for delivery and service to the Bulgarian, Russian and English Portable Text descriptions.
- Added one verified internal link to the automatic irrigation installation stages article; the pre-existing contextual link was preserved.
- Added Econt delivery throughout Bulgaria, optional engineer delivery in Nessebar and the Burgas area, and paid installation/setup/repair wording.
- Kept the original product-specific technical descriptions, localized short descriptions, technical specifications, prices, stock, product identity and SEO fields unchanged.

For the 1ZEHTMR hose-end timer (ZA84007), the existing “Typical applications” heading was changed from H2 to H3 before adding the delivery H2. This keeps the required total at five H2 sections without deleting or rewriting the existing application content.

## Internal links

The existing contextual links were retained and checked against published Sanity routes/products:

- `/category/klapani`
- `/product/rain-bird-lnk2-wifi`
- `/category/kapkovo-napoyavane`
- `/category/controllers`

The new service link is:

- `/blog/etapi-montazh-avtomatichna-polivna-instalatsiya`

## Verification

- Active products in the controller root category: **23**.
- Documents edited and published: **23/23**.
- Published read-back: **23/23**.
- All three locales for all 23 products: five H2 sections, two internal links and Econt delivery wording.
- English descriptions: no Cyrillic-language mixing detected by the read-back check.
- Target draft count after publication: **0**.
- Sanity validator: **23 valid**. The validator reports `complete=false` because the available tool does not execute custom validation callbacks such as custom slug `isUnique`; built-in checks ran.

## Exclusions

No short descriptions, technical specifications, prices, stock, product names, SKUs, images, category references, SEO metadata, Sanity schema, application code, Cloudflare, D1, Resend or Production infrastructure were changed. No Production deployment was required for this content-only update.
