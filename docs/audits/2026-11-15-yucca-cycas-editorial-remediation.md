# Florial — Yucca and Cycas editorial remediation

Date: 2026-11-15  
Repository baseline: `main` at `8c829c7e3e5f9e2a5857f56bfb9639aa8619a364`  
Sanity: project `bxvcy0qs`, dataset `plants`, published perspective

## Result

Published the explicitly approved editorial corrections for three existing plant product documents. The three records remain separate and active; no product was merged, deleted, redirected or unpublished.

| Product | Sanity ID | URL | Published revision |
|---|---|---|---|
| Yucca rostrata | `palm-yucca-rostrata` | `/product/yucca-rostrata` | `mCiJ6j1PmqLVq15csfbAQv` |
| Cycas A | `ac0fa4a7-54fd-4149-b0af-aa9759867ec5` | `/product/tsyaka-tsikas` | `mCiJ6j1PmqLVq15csfbAQv` |
| Cycas B | `palm-cycas` | `/product/cycas-revoluta` | `mCiJ6j1PmqLVq15csfbAQv` |

## Changes published

### Yucca rostrata

- Standardized BG product name and BG translation name as **Юка рострата (Yucca rostrata)**.
- Corrected the opening of the Bulgarian description (removed the incorrect form “Юката рострата”) in the root and BG translation.
- Filled the previously empty BG translation name, short description and SEO fields; aligned the localized BG H1/title/description with the root BG SEO.
- Completed main-image and all three gallery-image ALT values in BG/RU/EN. Existing image asset references and gallery membership were preserved.
- Kept `productType: shrub`, primary category `plants-exotic`, secondary category `plants-palms`, scientific name and slug unchanged.

### Cycas A — `tsyaka-tsikas`

- Corrected the root name from **Цяка (Цикас)** to **Цикас (Cycas revoluta)**.
- Replaced incorrect palm positioning in short descriptions and BG/RU/EN H1/metadata with the correct cycad/sagovnik classification. BG translation SEO was aligned with the root BG SEO; the malformed Russian-language word “Купуй” was removed from the BG Meta Title.
- Edited the localized descriptions to state clearly that Cycas is not a true palm and to remove the reference to palm fertilizer.
- Added a clear toxicity warning in BG/RU/EN: all parts are toxic if ingested, especially the seeds; keep the plant away from children and pets.
- Completed the missing gallery ALT values in BG/RU/EN. Existing main-image ALT and image assets were preserved.

### Cycas B — `cycas-revoluta`

- Corrected RU/EN localized names, short descriptions, H1 and metadata so the product is described as an ornamental cycad/sagovnik rather than a true palm.
- Kept its existing BG root SEO and all three published descriptions unchanged. The existing toxicity warning in BG/RU/EN remains intact.

## SEO length check

All edited localized Meta Titles are within the 70-character project target; all edited localized Meta Descriptions are within 160 characters. The Yucca RU/EN and Cycas B BG descriptions were shortened where necessary to meet the limit.

## Protected data — verified unchanged in the published read-back

- All three slugs and URLs.
- Product type, scientific names, category references and active status.
- Root prices, old prices, stock status and stock quantity.
- All sale variant arrays, variant keys, names, heights, container volumes, prices and stock quantities/statuses.
- All image asset references and existing gallery membership.

Commercial values observed before and after:
- Yucca: root price EUR 150; variants 120 cm / 15 L / EUR 300 / stock 5 and 80 cm / 15 L / EUR 150 / stock 10.
- Cycas A: 57–63 cm / 20 L / EUR 300 / stock 5; root stock status `inStock`.
- Cycas B: 100 cm / EUR 300 / `onRequest`; root price EUR 3,000 and old price EUR 4,000 retained.

## Safety and verification

- Before-write, field-scoped rollback snapshot: [yucca-cycas-editorial-before-2026-11-15.md](../backups/sanity/yucca-cycas-editorial-before-2026-11-15.md).
- No full Sanity dataset export was performed, in accordance with the owner's current instruction for intensive editorial work.
- No drafts existed before the update. Each document was patched with its exact published revision guard, draft content was read back, validated against the deployed product schema, and published with a draft revision guard.
- Sanity validation reported all 3 documents as `valid`; validation is incomplete because custom callbacks were not run by the validation tool.
- Final published-perspective read-back confirmed the content and the protected commercial fields listed above.
- No Sanity schema, application code, GitHub runtime code, Cloudflare configuration, deployment, DNS, analytics or redirects were changed.
- Live storefront/browser rendering and Google Search Console URL Inspection/indexing status were not checked in this task. Google recrawl is not confirmed.

## Next verification

1. Check the three live product URLs in BG/RU/EN for rendered H1, metadata, ALT text and localized descriptions.
2. Confirm selected variant price/stock display remains correct on the storefront.
3. Use Search Console URL Inspection later to check Google's selected canonical and indexing; do not infer recrawl from Sanity publication.
4. Keep the two Cycas offers distinct until the owner separately decides whether their inventory offers are genuinely independent.
