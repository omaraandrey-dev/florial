# Bulgarian editorial review — remaining plant categories

Date: 2026-11-18  
Sanity project: `bxvcy0qs`  
Dataset: `plants`  
Perspective: Published  
Scope: all 15 plant categories except the already-reviewed root category `plants-root` and combined palms/yuccas category `plants-palms`.

## Work completed

Reviewed the Bulgarian category introductions, category SEO text, commercial closing copy, help blocks, and localized category SEO fields. Published editorial updates to all 15 in-scope category documents.

The updates:
- Added clear purchase language directing customers to the Florial online shop and the physical garden centre.
- Added natural Bulgarian calls to action in the final category SEO section.
- Kept availability wording cautious where the category currently has no linked products.
- Corrected the broadleaf-tree introduction ("атмосферни градини" and "разстилането на короната") and improved the citrus wording ("кашони" to "контейнери").
- Corrected the exotic-plants sentence to refer to the minimum temperatures tolerated by the particular species.
- Corrected the indoor-plants H1 from a garden/landscaping formulation to "Интериорни растения за дома и офиса".
- Added a dedicated purchase section after the existing FAQ in conifers, olives and specimen/large plants. Existing FAQ content was preserved.

## Documents and current linked product counts

| Document ID | Category | Linked products |
|---|---|---:|
| plants-broadleaf | Широколистни дървета | 1 |
| plants-citrus | Цитруси | 8 |
| plants-conifers | Иглолистни дървета и храсти | 9 |
| plants-exotic | Екзотични растения | 4 |
| plants-flowering-shrubs | Цъфтящи декоративни храсти | 1 |
| plants-flowers | Цветя и рози | 8 |
| plants-groundcovers | Почвопокривни растения | 0 |
| plants-hedges | Растения за жив плет | 5 |
| plants-indoor | Интериорни растения | 0 |
| plants-olives | Маслини | 5 |
| plants-ornamental-grasses | Декоративни треви и злаци | 1 |
| plants-perennials | Многогодишни цветя | 2 |
| plants-seasonal-flowers | Сезонни цветя | 4 |
| plants-solitaires | Солитери и едроразмерни растения | 4 |
| plants-trees-shrubs | Дървета и декоративни храсти | 1 |

The two categories with zero linked products use enquiry/availability wording rather than claiming that products are currently listed for immediate purchase. The category/product relationship itself was not changed.

## Sanity fields changed

- Root Bulgarian `description`.
- Root Bulgarian `seoContent` closing paragraph; three FAQ-based categories received an additional H2 + two paragraphs after the FAQ.
- Root Bulgarian `seo.h1` for `plants-indoor` only.

## Preserved

- Document IDs and slugs/URLs.
- Product references and category hierarchy.
- Images and image metadata.
- Prices, variants, stock and product documents.
- RU and EN translations and localized SEO content.
- Help-block service URLs and CTA configuration.
- All existing educational SEO paragraphs and FAQ entries, except the targeted closing text changes.

## Backup

Five full JSON snapshots of all 15 source documents were committed before Sanity writes:

- `docs/backups/sanity/2026-11-18-plant-categories-bg-before-editorial-01.json`
- `docs/backups/sanity/2026-11-18-plant-categories-bg-before-editorial-02.json`
- `docs/backups/sanity/2026-11-18-plant-categories-bg-before-editorial-03.json`
- `docs/backups/sanity/2026-11-18-plant-categories-bg-before-editorial-04.json`
- `docs/backups/sanity/2026-11-18-plant-categories-bg-before-editorial-05.json`

Native Sanity dataset backup listing returned no available backups, so the complete source-document JSON snapshots were stored in this repository before editing.

## Validation and read-back

- Revision-guarded Sanity patch: 15/15 successful.
- Sanity document validation: 15/15 reported `valid`; validation was marked incomplete because custom callbacks were not executed by the validation tool. Built-in rules ran.
- Published read-back: 15/15 documents confirmed with updated Bulgarian CTA copy.
- Product counts were re-queried after publication and remained unchanged.
- Slugs were re-read and remained unchanged.
- No code, schema, product, price, stock, reference, Cloudflare, D1 or Resend changes were made.

## Not confirmed

- Rendered storefront/browser QA for every category route and locale.
- Google recrawl, indexing or ranking changes.
