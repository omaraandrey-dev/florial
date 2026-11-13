# Plant category SEO metadata update — 2026-11-13

## Scope

Project: Sanity `bxvcy0qs`, published dataset `plants`. Existing category documents only. 17 categories, 3 locales (BG/RU/EN).

## Change

For each category, updated only:
- Bulgarian: `seo.metaTitle`, `seo.metaDescription`
- Russian: `translations.ru.seo.metaTitle`, `translations.ru.seo.metaDescription`
- English: `translations.en.seo.metaTitle`, `translations.en.seo.metaDescription`

The agreed title structure is localized category name + geographic location + Florial garden-centre brand. When the full brand suffix would exceed 70 characters, the shorter Florial brand is used. Meta descriptions are individually written for the category rather than copied from one template. They lead with a localized sale phrase and use relevant local geography around Nessebar, Ravda and the Southern Black Sea coast.

## Categories updated

| Sanity ID | BG category | BG Meta Title |
|---|---|---|
| plants-broadleaf | Широколистни дървета | Широколистни дървета | Несебър | Градински център Флориал |
| plants-citrus | Цитруси | Цитруси | Несебър | Градински център Флориал |
| plants-conifers | Иглолистни дървета и храсти | Иглолистни дървета и храсти | Несебър | Градински център Флориал |
| plants-exotic | Екзотични растения | Екзотични растения | Несебър | Градински център Флориал |
| plants-flowering-shrubs | Цъфтящи декоративни храсти | Цъфтящи декоративни храсти | Несебър | Градински център Флориал |
| plants-flowers | Цветя и рози | Цветя и рози | Несебър | Градински център Флориал |
| plants-groundcovers | Почвопокривни растения | Почвопокривни растения | Несебър | Градински център Флориал |
| plants-hedges | Растения за жив плет | Растения за жив плет | Несебър | Градински център Флориал |
| plants-indoor | Интериорни растения | Интериорни растения | Несебър | Градински център Флориал |
| plants-olives | Маслини | Маслини | Несебър | Градински център Флориал |
| plants-ornamental-grasses | Декоративни треви и злаци | Декоративни треви и злаци | Несебър | Градински център Флориал |
| plants-palms | Палми и юки | Палми и юки | Несебър | Градински център Флориал |
| plants-perennials | Многогодишни цветя | Многогодишни цветя | Несебър | Градински център Флориал |
| plants-root | Всички растения | Всички растения | Несебър | Градински център Флориал |
| plants-seasonal-flowers | Сезонни цветя | Сезонни цветя | Несебър | Градински център Флориал |
| plants-solitaires | Солитери и едроразмерни растения | Солитери и едроразмерни растения | Несебър | Градински център Флориал |
| plants-trees-shrubs | Дървета и декоративни храсти | Дървета и декоративни храсти | Несебър | Градински център Флориал |

## Backup and verification

- Exact pre-write snapshot of all 17 published documents: [`../backups/sanity-plant-categories-before-seo-2026-11-13.json`](../backups/sanity-plant-categories-before-seo-2026-11-13.json).
- Snapshot was committed before the Sanity write.
- Patch: 17 successful, 0 failed.
- Publish: 17 documents published successfully.
- Post-publish GROQ read-back: 17 categories, 51 Meta Titles and 51 Meta Descriptions found.
- Title validation: all 51 titles are at most 70 characters.
- H1 comparison against the snapshot: zero differences across BG/RU/EN for all categories.
- The change only updates the six localized meta fields per category (two fields per locale). H1, noIndex, category content, seoContent, images, slugs, relationships and product data remain as before.

## CI

- Exact head `6100fbe1ba79f977700c4a442005b37266f4f4c7`: Blog and Studio validation run `43406072024` — success; D1 migration validation run `43406071860` — success.

## Limitations / follow-up

- This confirms published Sanity content, not the HTML emitted by Cloudflare Pages on a live request. Representative BG/RU/EN category pages should be checked in the initial HTTP response.
- Google Search/AI may continue to use previously crawled metadata until it recrawls and refreshes its index.
- Individual plant product SEO fields were not included in this category-only task.
- No schema/code/Cloudflare/D1/Resend change and no Production deployment was made.
