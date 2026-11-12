# Florial — аудит коммерческих связей блога

Date: 2026-11-12

## Проверенная база

- GitHub repository: `omaraandrey-dev/florial`.
- Main snapshot used for code/documentation review: `d878f661a45947a373c55dc137a66440f8b62168`.
- Sanity project: `bxvcy0qs`; dataset: `production`; perspective: `published`.
- Live read-only query returned 14 published `blogPost` documents (all with BG/RU/EN translation objects).
- Related code inspected: `src/lib/blog.ts`, `src/pages/BlogPostPage.tsx`, `src/components/BlogContent.tsx`.
- Schema inspected: deployed `blogPost` schema in Studio workspace `florial-admin`.

## Проверено по коду

1. `BlogPostPage` displays up to three related articles, ranked by shared tags and then publication date.
2. `BlogPostPage` has no dedicated commercial CTA section and does not query article-to-service/product/category references.
3. `BlogContent` filters contact-related Portable Text blocks through `isContactCta`; legacy email/phone CTA paragraphs can therefore be hidden instead of displayed.
4. The deployed `blogPost` schema has localized Portable Text bodies and SEO fields, but no `relatedContent` or dedicated CTA field. A first safe content-only pass can use existing Portable Text links without schema changes.

## Live Sanity findings

### Descriptions and metadata

- All 14/14 BG `shortDescription` values begin with the same generic template: `Полезна информация от Florial:`.
- All 14/14 RU values use the same generic template: `Полезная информация от Florial:`.
- All 14/14 EN values use the same generic template: `Useful advice from Florial:`.
- The same generic template is used in `seoDescription` for all 14 documents in all three languages.
- This makes article cards and search snippets repetitive. Rewriting these descriptions is a separate editorial/SEO pass; it is not mixed into the initial link correction.

### Internal links and CTAs

- The Bulgarian bodies contain the majority of legacy link annotations. In the read-only projection, localized RU/EN link annotations were found in the Rain Bird article; the other articles need localized links added.
- Five articles contain a brand anchor labelled `ФЛОРИАЛ` whose href is incorrectly set to `/services/rulonna-treva`: `maslina-sredizemnomorie`, `kiparis-totem`, `landshaften-proekt-zima-burgas`, `landshaften-proekt-nesebar`, and `etapi-landshaften-proekt-nesebar`. The brand anchor should lead to the homepage, not the rolled-turf service.
- Several existing link annotations use href `/` even though their anchor text describes a specific service (for example landscape design, irrigation system design, annual irrigation maintenance, or landscaping). These should be mapped only when the destination is unambiguous and the target service is active.
- Some old article-to-article links are topically questionable (for example plant articles linking to irrigation-price or turf-sale articles). Review before replacing; do not delete content solely for SEO.
- Legacy links to `static.wixstatic.com` occur in article Portable Text. They may represent linked legacy images; do not replace them blindly until visual/source usage is checked.
- Existing mailto annotations are filtered by the current renderer when they form contact CTA blocks; they are not a dependable visible conversion path.

### Existing reverse references

- Three active service documents reference blog articles: olive planting → olive article; landscaping/flower-bed services → landscape case study; old-turf replacement → rolled-turf article.
- 58 active irrigation product documents reference the article `etapi-montazh-avtomatichna-polivna-instalatsiya`. This is a broad product-to-article relationship and should be reviewed for relevance separately; it does not create links from the article to those products.
- Active plant categories confirmed in the separate `plants` dataset: olives (5 active products), palms/yukkas (12), flowers/roses (8), conifers (9).
- Active relevant services include olive planting, general planting, landscaping, irrigation system installation, automatic irrigation, rolled turf and old-turf replacement. The palm-specific service record did not have `isActive=true`; do not link to it as an active service without further confirmation.

## Предлагаемый content-only scope

1. Correct the five Florial brand links to `/`.
2. Replace clearly broken root links with verified active service routes only when the anchor text clearly identifies that service.
3. Add one concise, localized BG/RU/EN end-of-article CTA to each publication, linking to the most relevant existing service and/or active category.
4. Keep existing article URLs, publication dates, tags, cover/gallery assets and all untouched Portable Text blocks unchanged.
5. Do not add a new Sanity schema field and do not alter global Header/menu/Footer or service pages.
6. Do not rewrite the 14 generic SEO descriptions in this pass; prepare those separately with editorial review.

## Backup and write status

- Full pre-edit snapshot of all 14 published blogPost documents is stored at `docs/backups/sanity-blog-commercial-links-before-2026-11-12.json`.
- Backup includes full document JSON, including existing Portable Text, image references, metadata and revision IDs.
- Backup was created before any live Sanity mutation.
- **No Sanity documents have been patched or published by this audit.**
- This audit is read-only and does not claim Production changes or conversion improvements.

## Next verification after any approved content write

- Re-read every modified document from Sanity Production.
- Confirm no existing body blocks/assets/references were lost.
- Confirm BG/RU/EN CTA links resolve to the intended active service/category routes.
- Run safe live HTTP smoke checks for each destination and each article language.
- Visually inspect representative article pages at desktop and 320–360 px mobile widths.


## Предварительная карта целевых переходов

Все пути ниже сверены с опубликованными service/category documents. Перед фактической записью необходимо повторно проверить active status и конечный HTTP URL.

| Статья | Рекомендуемые коммерческие переходы |
|---|---|
| `cena-sistema-avtomatichno-napoyavane-burgas` | `/services/avtomatichno-napoyavane`, `/services/montaj-avtomatichni-polivni-sistemi-nesebar`, `/category/gotovi-komplekti-za-polivane` |
| `sistema-magluvane-terasa-besedka` | `/services/avtomatichno-napoyavane`; конкретный товар/категория туманообразования не подтверждены в активном каталоге |
| `rozi-sympathy` | `/category/tsvetya-i-rozi`, при необходимости `/services/zasazhdane-na-rasteniya` |
| `nov-vnos-palmi-2025` | `/category/palmi-yuki`, `/services/zasazhdane-na-rasteniya`; palm-specific service не подтверждён как active |
| `maslina-sredizemnomorie` | `/category/maslini`, `/services/profesionalno-zasazhdane-na-maslini` |
| `prodavane-traven-chim` | `/services/rulonna-treva` |
| `kiparis-totem` | `/category/igol_listni`, `/services/zasazhdane-na-rasteniya` |
| `kupete-travna-plosht` | `/services/rulonna-treva`, `/services/podmyana-stara-travna-plosht`, `/services/montaj-avtomatichni-polivni-sistemi-nesebar` |
| `etapi-montazh-avtomatichna-polivna-instalatsiya` | `/services/montaj-avtomatichni-polivni-sistemi-nesebar`, `/services/avtomatichno-napoyavane`, `/category/vsichko-za-polivane` |
| `rain-bird-oborudvane` | Сохранить существующие категории Rain Bird; добавить `/services/montaj-avtomatichni-polivni-sistemi-nesebar` |
| `landshaften-dizain-proekt-zasazhdenie` | `/services/landshaften-dizain`, `/services/ozelenyavane`, `/services/zasazhdane-na-rasteniya` |
| `landshaften-proekt-zima-burgas` | `/services/landshaften-dizain`, `/services/ozelenyavane` |
| `landshaften-proekt-nesebar` | `/services/landshaften-dizain`, `/services/ozelenyavane` |
| `etapi-landshaften-proekt-nesebar` | `/services/landshaften-dizain`, `/services/ozelenyavane` |

### Правила применения

- В каждой публикации добавить один короткий финальный CTA на BG/RU/EN; обычно одна категория + одна услуга, не больше двух коммерческих ссылок в CTA.
- Существующие полезные links Rain Bird и turf сохранить.
- Исправлять root href только там, где anchor text однозначно называет существующую услугу/категорию.
- Пять брендовых anchors «ФЛОРИАЛ» перевести на homepage `/`.
- Не создавать искусственную товарную ссылку для misting: соответствующий активный товар не найден.
- Не менять тексты и URL публикаций, не менять SEO descriptions в этой итерации.
