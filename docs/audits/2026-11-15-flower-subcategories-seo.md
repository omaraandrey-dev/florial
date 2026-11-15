# Flower subcategory SEO content — 2026-11-15

## Scope and category hierarchy
Sanity project `bxvcy0qs`, dataset `plants`, published perspective. Parent category `plants-flowers` (slug `tsvetya-i-rozi`). Read-only query of the deployed category schema confirmed the `parent` reference. Four and only four published category documents currently reference `plants-flowers` as parent:
- `plants-perennials` — `mnogogodishni-tsvetya`
- `plants-seasonal-flowers` — `sezonni-tsvetya`
- `plants-groundcovers` — `pochvopokrivni`
- `plants-ornamental-grasses` — `dekorativni-trevi`

## Before state and backup
All four categories had no `seoContent` in BG, RU or EN. Full published-document snapshots were captured before writing in `docs/backups/sanity/2026-11-15-flower-subcategories-before-seo-content.json` and committed before the Sanity writes.

## Published changes
Only these fields were added:
- `seoContent` (BG)
- `translations.ru.seoContent`
- `translations.en.seoContent`

Each category has 27 Portable Text blocks per locale: 9 H2 headings and 18 paragraphs. Each article is distinct and localized:
- Perennials: long-term flower beds, hostas and irises, light exposure, composition, planting, watering and coastal conditions.
- Seasonal flowers: own greenhouse production, continual planting of new batches and seasonal assortment refresh; petunias, pelargoniums, impatiens and fuchsias; balconies, terraces and seasonal care.
- Ground covers: landscape use, flowering/foliage types, density, soil preparation, establishment, irrigation and coastal conditions. Copy does not assert that a currently stocked range exists.
- Ornamental grasses: texture and garden structure, combinations, mature size, planting and seasonal care.

The greenhouse wording is careful not to claim every plant in each subcategory is grown in-house or always available. The seasonal-flower page carries the strongest own-production emphasis.

## Validation and publication
- All four drafts were validated against the deployed category schema: status `valid`; validation tool marked `complete=false` because custom callbacks were not executed. This limitation was retained in the record.
- Draft read-back confirmed 27 BG/RU/EN blocks in each category and unchanged descriptions, H1 and SEO metadata.
- All four were published with revision guards. Published read-back confirmed 27 blocks and 9 H2 headings in each locale for each category; existing H1, Meta Title and Meta Description were preserved.

## Live rendering checks
Cloudflare Browser Rendering confirmed the expected localized title and rendered SEO section for:
- BG: `/category/mnogogodishni-tsvetya`
- BG: `/category/sezonni-tsvetya`
- BG: `/category/pochvopokrivni`
- BG: `/category/dekorativni-trevi`
- RU: `/category/sezonni-tsvetya?lang=ru`
- EN: `/category/mnogogodishni-tsvetya?lang=en`

## Catalog observations — not changed
- `plants-groundcovers` currently has zero published products referencing it. The SEO article is published, but the category currently has no product cards.
- `plants-ornamental-grasses` currently has one product reference: `tree-laurel`, named `Лаврово дърво (Laurus nobilis)`, with `productType: tree`. This appears mismatched to the category label. No product relationship or catalog data was changed; owner review is needed before any correction.

## Not changed
No category names, slugs, parent relationships, H1, Meta Title, Meta Description, descriptions, help blocks, images, product records/relationships, Sanity schema, application code, sitemap/RSS, analytics, Cloudflare configuration, D1, Resend or Production deployment.

## Remaining
- Google recrawl, indexing and rankings are not confirmed.
- Review the empty ground-cover category and the laurel-tree reference in ornamental grasses before changing catalog relationships.
