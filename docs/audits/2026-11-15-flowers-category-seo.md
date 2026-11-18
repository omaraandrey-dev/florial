# Flowers category SEO content — 2026-11-15

## Scope
- Project: Sanity `bxvcy0qs`, dataset `plants`, published perspective.
- Category: `plants-flowers`, slug `tsvetya-i-rozi`, route `https://florial-bg.com/category/tsvetya-i-rozi`.
- Main dataset content only: `seoContent`, `translations.ru.seoContent`, `translations.en.seoContent`.

## Before state
The published category had no `seoContent` field in BG, RU or EN. The existing H1, localized metaTitle/metaDescription, descriptions, helpBlock, image, slug, parent and sort order were present and retained. Eight published product documents reference this category.

## Editorial focus
The leading section presents Florial's own flower-growing greenhouses. It explains that the team prepares and plants new batches on an ongoing basis, so the range of flowers and colours is regularly refreshed during the season. The copy does not promise that every catalogue plant is greenhouse-grown or that a specific variety is always in stock. Further sections cover seasonal flowers and perennials, roses, garden/balcony/terrace use, selection, planting, watering and care, and local coastal conditions around Nessebar, Ravda, Sunny Beach, Sveti Vlas and Pomorie.

## Localized structure
- BG: 27 Portable Text blocks, 9 H2 headings and 18 paragraphs.
- RU: 27 Portable Text blocks, 9 H2 headings and 18 paragraphs.
- EN: 27 Portable Text blocks, 9 H2 headings and 18 paragraphs.

## Backup and publication
- Exact pre-write published snapshot: `docs/backups/sanity/2026-11-15-plants-flowers-before-seo-content.json`.
- Backup was committed to the working content branch before the Sanity write.
- Sanity draft validation: `valid`, `complete=false`; custom validation callbacks were not run by the beta validator.
- Draft read-back confirmed the localized content and preserved metadata/helpBlock.
- Revision-guarded publish succeeded. Published read-back confirmed the content and unchanged H1/metaTitle/metaDescription.

## Not changed
No category metadata/H1, descriptions, helpBlock, images, slug, category hierarchy, product documents/relationships, Sanity schema, website code, sitemap/RSS, analytics, Cloudflare configuration, D1, Resend or Production deployment.

## Live rendering check
- Cloudflare Browser Rendering fetched the Bulgarian Production URL successfully. The rendered HTML contained the localized page title, the SEO category section, the greenhouse-own-growing lead heading, and the paragraphs about regular new planting and assortment renewal.
- Russian and English rendering checks were attempted but Cloudflare Browser Rendering returned HTTP 429 and instructed a 10-second cooldown. Those two locale checks remain unconfirmed; no repeated request was sent during the cooldown.
- Google recrawl, indexing and rankings are not confirmed.
