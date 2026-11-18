# Florial — коммерческие связи блога: публикация

Date: 2026-11-12

## Scope

Approved content-only improvement of the 14 published blog articles in Sanity Production. No application code, Studio schema, routes, service pages, products, categories, global navigation, Cloudflare configuration or secrets were changed.

## Published changes

- 14/14 published blogPost documents updated and published successfully.
- Added one localized end-of-article CTA to each publication in Bulgarian, Russian and English: 42 CTA blocks total.
- Each CTA has two relevant links, giving 84 new commercial links to active services or plant/equipment categories.
- Compared with the full pre-edit backup, 33 existing link destinations were corrected:
  - six Florial brand anchors now lead to the homepage instead of the unrelated rolled-turf service;
  - other root links were replaced only when anchor text clearly identified an active service/category or a relevant existing article.
- Existing useful links, article text, images/assets, slugs, publication dates, tags and SEO metadata were preserved.
- Legacy Wix-hosted image URLs were intentionally left unchanged; they require a separate visual/media review.

## Editorial destinations

- Irrigation cost/installation articles → maintenance and installation services.
- Misting article → general irrigation service and irrigation equipment category; no dedicated active misting product was confirmed.
- Roses, palms, olives and conifers → matching plant category and planting service.
- Rolled turf articles → rolled-turf and old-lawn replacement services.
- Landscape case studies → landscape design and landscaping services.
- Rain Bird article → irrigation equipment category and installation service.

## Backup

Full pre-edit snapshots of all 14 published documents:
`docs/backups/sanity-blog-commercial-links-before-2026-11-12.json`

## Verification

- Sanity patch operation: 14/14 successful.
- Sanity document validation: 14/14 marked valid. Validation is incomplete only for custom slug uniqueness callbacks that the validation tool does not execute.
- Sanity publish operation: 14/14 successful.
- Post-publish Production query: 14/14 documents returned; all 14 have exactly two CTA links in each of BG/RU/EN.
- Backup comparison: 33 existing href corrections confirmed.
- Active service slugs and plant category slugs were checked in Sanity.
- External web fetch could not access florial-bg.com routes in this session, so HTTP status and visual rendering of destination pages are not claimed as verified.

## Remaining QA

- Open representative articles in BG/RU/EN and visually confirm CTA placement and link behavior.
- Confirm destination pages open correctly in the live browser.
- Review legacy Wix-hosted images separately; they were not altered in this task.
