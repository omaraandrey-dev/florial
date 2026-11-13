# SEO audit — 10 primary irrigation categories

**Date:** 2026-11-13  
**Sanity:** project `bxvcy0qs`, dataset `production`, published perspective  
**GitHub branch:** `content/irrigation-category-seo-2026-11-13`  
**Pre-write backup:** `docs/backups/sanity-irrigation-categories-before-seo-2026-11-13.json`

## Scope

Ten direct child categories under the irrigation catalogue root were updated. Existing category documents and their IDs were retained. The work covered all three storefront languages: Bulgarian (primary), Russian and English.

For each category:
- localized H1, Meta Title and Meta Description;
- a concise two-sentence description above the product grid;
- one localized SEO article below the product grid;
- four visible FAQ questions and answers inside that article.

Each SEO article is stored as Portable Text with 13 blocks: two H2 headings, three explanatory paragraphs, four H3 questions and four answers. No new schema fields or application code were required.

## Categories and published catalogue evidence

| Category | Published product references | Assortment evidence |
|---|---:|---|
| Ready-made irrigation kits | 12 | Florial |
| Controllers | 23 | Rain Bird |
| Sprinklers | 20 | Rain Bird |
| Nozzles | 26 | Rain Bird |
| Irrigation valves | 17 | Rain Bird |
| Valve boxes | 7 | Rain Bird |
| Drip irrigation | 22 | Rain Bird, Irritec |
| Pipes, fittings and accessories | 136 | Rain Bird, Irritec and unbranded |
| Filters and pressure regulators | 5 | Rain Bird |
| Other irrigation components | 6 | Unbranded |

The sum is **274 category-product references**, not a deduplicated count of unique products.

## Length and structure verification

All published localized Meta Titles are at most 70 characters. All Meta Descriptions are at most 160 characters. Each article is within the target range of 1,500–2,000 characters after Portable Text is converted to plain text.

| Category | Article length BG | RU | EN |
|---|---:|---:|---:|
| Ready-made kits | 1,948 | 1,812 | 1,779 |
| Controllers | 1,797 | 1,711 | 1,803 |
| Sprinklers | 1,718 | 1,597 | 1,622 |
| Nozzles | 1,611 | 1,570 | 1,667 |
| Valves | 1,527 | 1,508 | 1,529 |
| Valve boxes | 1,674 | 1,635 | 1,615 |
| Drip irrigation | 1,892 | 1,699 | 1,671 |
| Pipes and fittings | 1,753 | 1,692 | 1,701 |
| Filters and regulators | 1,807 | 1,684 | 1,775 |
| Other components | 1,733 | 1,646 | 1,735 |

## Editorial decisions

- Rain Bird is named in titles and copy only where the published assortment supports it. Mixed Rain Bird/Irritec categories name both brands; the kit category uses Florial; the other-components category avoids inventing a brand.
- Controller copy includes both Bulgarian search terms **контролери** and **програматори**. It distinguishes 24 V and 9 V valve systems and states that Bluetooth/Wi-Fi phone control depends on the exact controller and compatible module.
- No unsupported claims about stock availability, warranty duration or guaranteed delivery speed were added.
- Meta descriptions refer to delivery across Bulgaria and installation/consultation only where relevant to the category.
- FAQ content is visible on the page. FAQPage structured data was not added because this would require a separate implementation decision and is not expected to guarantee a Google rich result.

## Data-integrity checks

Compared the published documents with the pre-write backup. All 10 documents passed these checks:
- category IDs, names and slugs unchanged;
- parent references, images and sort order unchanged;
- existing help blocks unchanged;
- existing root-level legacy `seoTitle` / `seoDescription` fields unchanged where present;
- BG/RU/EN `noIndex` values unchanged;
- all 30 localized H1/Title/Description fields present;
- 13 Portable Text blocks per locale and 1,500–2,000 characters per article.

The Sanity read-back returned 10/10 documents.

## Existing schema inconsistency

Four documents — controllers, sprinklers, nozzles and valve boxes — already contain root-level `seoTitle` and `seoDescription` values that are not declared by the currently deployed `category` schema. The Sanity beta document validator therefore marked these four drafts invalid with `object.unknown-field` markers. The publishing action nevertheless succeeded for all ten documents. These legacy fields were preserved and must not be removed without a separate approved migration and backup.

## Code and deployment impact

- No application code or Sanity schema changed.
- No product documents or category relationships changed.
- No Cloudflare Pages, D1, Resend or other Production infrastructure changed.
- The existing `CategoryPage` reads localized SEO metadata through `resolveCategorySeo`, displays the short description above the grid and renders `seoContent` through `RichText` after the products.
- This is a content-only change; no new Production deployment was triggered by this work.

## Remaining verification

1. Inspect initial HTTP HTML and rendered Production pages for representative irrigation categories in BG/RU/EN.
2. Confirm title, description, H1, canonical/hreflang and SEO article visibility on those routes.
3. Monitor/request Google recrawling after route verification.
4. Handle the legacy root-level SEO fields only through a separately approved schema/data migration.
