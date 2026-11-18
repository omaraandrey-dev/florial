# Аудит обновления статьи: зимний ландшафтный проект в Бургасе

Дата: 2026-11-18  
Репозиторий: `omaraandrey-dev/florial`, branch `main`  
Sanity project: `bxvcy0qs`  
Dataset: `production`  
Document: `blogPost-landshaften-proekt-zima-burgas`  
Slug / URL: `landshaften-proekt-zima-burgas` / https://florial-bg.com/blog/landshaften-proekt-zima-burgas  
Published revision after final publish: `QNgifPbO9FtDWOAbTv7vHo`

## Scope and approval

The owner explicitly approved the exact plan on 2026-11-18. Only the existing blog post was edited. The document ID, slug, public URL, BG title, cover asset, publication date and published state were preserved.

## Backup

Before any Sanity write, the full raw document response was saved in:

- `docs/backups/sanity/2026-11-18-landshaften-proekt-zima-burgas-before-editorial-refresh.json`
- Backup commit: `23b7c8cf02fc18138fa3927dfefc3a78b8168f7c`
- Original published revision: `wShFcTvKnRduO9ho4JbXhm`

The backup file preserves the complete original Sanity document response. No other content document was modified.

## Editorial result

All three language versions were rewritten as separate localized Portable Text content:

| Locale | Blocks | Text characters |
|---|---:|---:|
| BG | 69 | 11,739 |
| RU | 69 | 10,914 |
| EN | 69 | 11,142 |

The article is materially longer than the previous versions. It now covers winter planning, site assessment, functional zoning, plant composition, trees and ornamental shrubs, conifers, flowering shrubs, flowers and roses, irrigation planning, lawns and paving, winter preparation tasks, project stages and a commercial enquiry.

The content is written for the Bulgarian Black Sea coast and refers naturally to Burgas, Nessebar, Ravda, Sunny Beach, Sveti Vlas, Aheloy, Pomorie, Kosharitsa and Kableshkovo. It uses the requested brand expression “градински център Флориал” / “садовый центр Florial” / “Florial Garden Centre”; no landscape-studio positioning remains.

Unverified seasonal discounts and the old 20% offer were removed. No price, discount, availability, delivery date or installation saving was invented.

## Images

Each locale has 8 inline images; the cover is preserved separately.

- Reused existing Florial Production assets, including the existing landscape-project photos.
- Uploaded 4 published plant-category images from the `plants` dataset into `production`: trees and ornamental shrubs, conifers, flowering shrubs, flowers and roses.
- Uploaded 2 additional project photographs from the specified DROP source article into `production`.
- Every inline image has localized BG/RU/EN alt text; captions are localized.
- No plant-category document or product record was modified.

Source article: https://www.drop.od.ua/post/ландшафтный-проект-зимой-в-одессе

## Internal navigation and conversion

Verified internal links in the published BG Portable Text:

- Plant categories: `/category/darveta-i-hrasti`, `/category/igol_listni`, `/category/tsaftyashti-hrasti`, `/category/tsvetya-i-rozi`, `/category/rastenia`.
- Irrigation categories: `/category/vsichko-za-polivane`, `/category/kapkovo-napoyavane`.
- Existing irrigation service: `/services/avtomatichno-napoyavane`.
- Landscape design service and enquiry form: `/services/landshaften-dizain`.
- Rolled turf and related landscape articles: `/blog/prodavane-traven-chim`, `/blog/etapi-landshaften-proekt-nesebar`, `/blog/podroben-landshaften-proekt-gradina`.

The existing landscape-design service is active. The article sends prospective customers to that service page and its existing enquiry form. No form/API changes were made and no test production enquiry was submitted.

The existing blog related-card renderer remains unchanged. With the final tags `Озеленяване` and `Ландшафтно проектиране`, the top three related posts resolve to:
1. `podroben-landshaften-proekt-gradina`
2. `etapi-landshaften-proekt-nesebar`
3. `landshaften-dizain-proekt-zasazhdenie`

## Verification

- Sanity Production read after publish: document exists, published, slug unchanged, final revision `QNgifPbO9FtDWOAbTv7vHo`.
- BG/RU/EN each have 69 Portable Text blocks and 8 inline images.
- Localized titles, short descriptions, SEO titles/descriptions and cover ALT fields are populated.
- All plant and irrigation category slugs and the two service slugs were checked against published Sanity documents.
- Sanity document validator returned `valid`. Validation is incomplete because the beta validator does not run custom validation callbacks; this limitation is retained explicitly.
- Live BG article was fetched successfully after publishing. The fetched page contained the new text and localized links; checks found no studio positioning and no old 20% discount.
- Live RU/EN HTML fetch was not completed: Firecrawl connected-app credits were exhausted after the BG fetch. The published RU/EN Sanity content was verified directly, but rendered Production HTML for those locales remains unconfirmed.
- The web page open tool could not access the Production URL. Do not claim a full three-locale browser/HTML check.
- No application code, Sanity schema, Cloudflare Pages, D1, Resend, secrets, navigation shell or forms were changed. No build/deployment was required for this content-only update.

## Final state

The article is published in Sanity Production. The only pending verification is a rendered live-page check for RU and EN after Firecrawl credits refresh. No other action is required to keep the article published.
