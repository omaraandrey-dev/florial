# Florial — Rain Bird blog article editorial refresh

**Date:** 2026-11-18  
**Sanity:** project `bxvcy0qs`, dataset `production`  
**Document:** `blogPost-rain-bird-oborudvane`  
**URL:** https://florial-bg.com/blog/rain-bird-oborudvane  
**Source article:** https://www.drop.od.ua/post/rain-bird  
**Published revision before:** `qvVg1luYRxJZnxaWi1OfUN`  
**Published revision after:** `4wsk3P4LWpbmPrrSds5FQJ`  
**Status:** published and live; original slug, URL and publication date preserved.

## 1. Owner approval and backup

- Owner explicitly approved the exact plan in this conversation before any Sanity write.
- Full read-only snapshot of the original Production document was committed before writes: `docs/backups/sanity/2026-11-18-rain-bird-before-editorial-refresh.xml`.
- Original `publishedAt` (`2024-08-22T12:58:55.802Z`), slug (`rain-bird-oborudvane`), sourceUrl, published state, cover asset and tag `Автоматично напояване` were retained.
- The existing document was updated in place; no new article, slug change, unpublish or delete was performed.

## 2. Content changes

Updated existing fields only:
- root Bulgarian `title`;
- `translations.bg/ru/en.title`;
- `shortDescription`, `coverAlt`, `seoTitle`, `seoDescription` for all three locales;
- Portable Text `body` for BG/RU/EN;
- localized cover ALT fields `cover.alt`, `cover.altRu`, `cover.altEn`.

Text volume (characters in Portable Text text spans, excluding image captions):
| Locale | Before | After |
|---|---:|---:|
| BG | 8,163 | 14,002 |
| RU | 4,521 | 13,215 |
| EN | 4,223 | 13,061 |

Each localized body contains 81 Portable Text blocks, including six inline image blocks and 20 inline-link annotations. All headings use semantic H2/H3 blocks; all image blocks have localized ALT values. The old mixed/legacy presentation was replaced by consistent Portable Text in all three languages.

Editorial sections cover:
- project selection and hydraulic design;
- Rain Bird 1800 Spray bodies;
- R-VAN rotary nozzles;
- 3500 Series rotors;
- solenoid valves;
- ESP-TM2 controllers and LNK2 Wi-Fi compatibility;
- XF/XFS dripline;
- irrigation for trees, shrubs and flowers;
- comparison of the three Florial kits;
- installation, service enquiry and FAQs;
- related blog articles.

Technical claims were checked against current Rain Bird manufacturer material:
- 1800 Series: https://www.rainbird.com/products/1800-series-pressure-regulated-prs-spray-sprinkler-heads-no-nozzles
- 3500 Series: https://www.rainbird.com/products/3500-series-rotor-sprinklers
- ESP-TM2: https://www.rainbird.com/products/esp-tm2-series-controllers
- LNK2 compatibility and 2.4 GHz requirement: https://www.rainbird.com/sites/default/files/media/documents/2023-11/d42005-lnk2_tech_spec.pdf
- XF dripline: https://www.rainbird.com/professionals/specifier/dripline
- XF installation/design guide: https://www.rainbird.com/sites/default/files/media/documents/2023-01/d40024c-xf-series-dripline-design-installation-and-maintenance-guide-011022.pdf

## 3. Images and media

The original cover image was retained. Six inline image assets are used in each language:
- Existing Florial catalogue assets: Rain Bird 1800 Spray, R-VAN and 3500 rotor.
- Imported from the supplied DROP/Wix article and used inline: solenoid valve (`image-07209378a23e81c329fbb78502ba67f9f107e85a-350x350-jpg`), controller (`image-608b778210a03204ab64c04653a0a5c492bfbce1-1200x1600-jpg`) and dripline (`image-463beb4ba278d0a8a402f50ea1a9058d002c2667-375x274-jpg`).
- Source credit metadata for imported assets records DROP and the original article URL.

Three original animated GIFs were also imported from DROP but deliberately not embedded because each is approximately 5.9–6.8 MB (about 19.4 MB combined). They remain unreferenced in Sanity; no asset was deleted. The article uses existing catalogue product imagery for those three equipment sections to avoid adding that transfer weight to every page view.

## 4. Products, internal links and lead capture

Published Sanity product data was checked before adding kit information:
- Super Economy, manual control: 242.32 EUR incl. VAT — https://florial-bg.com/product/super-ikonomichen-komplekt-polivane
- Economy, automatic control: 478.32 EUR incl. VAT — https://florial-bg.com/product/ikonomichen-komplekt-polivane-gradina
- Standard, automatic control: 631.42 EUR incl. VAT — https://florial-bg.com/product/standarten-komplekt-polivane-gradina

The article explains the different control methods and equipment configurations. It also states the published water-source requirement and exclusions for PE Ø25 mm pipe and controller cable; final suitability remains subject to site and hydraulic verification.

Internal links were checked against published category documents in the production and plants datasets, the three published product documents, the active irrigation design service, and existing published blog posts. Contextual links cover irrigation equipment, sprinklers, nozzles, rotators, rotors, valves, filters/pressure regulators, controllers, drip irrigation, trees/shrubs and flowers/roses.

The existing tag `Автоматично напояване` was preserved. The related-post query returns exactly three relevant published articles:
1. `cena-sistema-avtomatichno-napoyavane-burgas`;
2. `etapi-montazh-avtomatichna-polivna-instalatsiya`;
3. `sistema-magluvane-terasa-besedka`.

The article CTA links to the existing active service page:
https://florial-bg.com/services/proektirane-sistemi-avtomatichno-napoyavane-nesebar

The service document contains localized BG/RU/EN lead-form configuration. The existing frontend posts to `/api/service-leads`; the handler validates the service and locale and uses Cloudflare D1 and Resend. The service page was read-only checked live. No test lead was submitted, to avoid creating a false production enquiry.

## 5. Validation and Production verification

- Sanity `documents_validate`: status `valid`; validation is incomplete because the beta validator does not execute custom validation callbacks. This limitation is retained rather than reported as a complete validation.
- Published read-back: document exists, `isPublished=true`, slug unchanged, revision `4wsk3P4LWpbmPrrSds5FQJ`.
- Live Firecrawl Production check, BG/RU/EN: HTTP 200; localized title, description, language and Open Graph locale match; `robots=index, follow`; article markdown contains the new content, 10 rendered images (cover, six inline images and three related-card images), 14 headings and 20 links per locale.
- Live service page check: HTTP 200; existing enquiry form content present.
- SEO implementation was read in `src/lib/seo.ts`: it sets a self-referencing canonical, localized robots metadata and alternate-language links when supplied by the article page. No frontend code was changed.
- No Cloudflare Pages deployment was required: this was a Sanity content update only. No Studio schema, GitHub runtime code, D1, Resend, Cloudflare settings/secrets, navigation, Header or Footer was changed.
- No build/CI run was applicable because no code or schema was changed. No form submission, PageSpeed/Lighthouse run or Google recrawl/indexing confirmation was performed.

## 6. Remaining notes

- The three large original GIF assets remain in Sanity but are not referenced by the article; they can be optimized separately if the owner later wants the animated versions included.
- The published article itself is live. GitHub audit/backup and changelog are documentation-only follow-up changes; they do not alter the website runtime.
