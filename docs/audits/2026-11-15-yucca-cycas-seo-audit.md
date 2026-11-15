# Florial — Yucca and Cycas SEO/catalogue audit

Date: 2026-11-15  
Repository baseline: `main` at `8c829c7e3e5f9e2a5857f56bfb9639aa8619a364`  
Sanity: project `bxvcy0qs`, dataset `plants`, published perspective (read-only)  
Search Console: Windsor.ai `searchconsole`, property `sc-domain:florial-bg.com`, preset `last_28d`

## Executive summary

- **Yucca rostrata** is stored as `productType: shrub`, with primary category `plants-exotic` and secondary category `plants-palms` (the commercial category is named “Палми и юки”). This is a sound separation: the page can be discoverable from the combined palms-and-yuccas category without classifying Yucca as a true palm.
- The Yucca product has meaningful search visibility: apex URL rows show 12 impressions / 1 click for `юка рострата` (average position 9.25) and 8 impressions / 0 clicks for `yucca rostrata` (position 4.75); the www URL separately shows 3 impressions for the Bulgarian query (position 8.67). These are last-28-day observations, not a stable trend.
- Two published product documents represent **Cycas revoluta**: `tsyaka-tsikas` (5 units in stock, 57–63 cm / 20 L / EUR 300) and `cycas-revoluta` (100 cm / EUR 300, on request). Both are categorized under `plants-exotic` and use `productType: other`, not `palm`. Keep the two records distinct until the owner confirms whether these are genuinely separate offers or a duplicate catalogue entry; do not merge, redirect or delete based on SEO data alone.
- Cycas last-28-day GSC rows point only to `/product/cycas-revoluta`: 4 impressions / 0 clicks in total (`cycas`: 2 at position 12; `cycas revoluta`: 1 at position 3; `цикас`: 1 at position 47). The `/product/tsyaka-tsikas` page returned no rows in this period. This suggests a possible duplicate/cannibalization issue but does not prove it.
- Several localized fields and image ALT values need editorial cleanup. No Sanity writes were made.

## 1. Yucca rostrata

Sanity document: `palm-yucca-rostrata`  
URL: `/product/yucca-rostrata`  
Scientific name: `Yucca rostrata`  
Product type: `shrub`  
Primary category: `plants-exotic`; secondary category: `plants-palms`  
Published/active: yes; stock status: `inStock`

### Search data (last 28 days)

| Page/query | Impressions | Clicks | Average position |
|---|---:|---:|---:|
| apex — `юка рострата` | 12 | 1 | 9.25 |
| apex — `yucca rostrata` | 8 | 0 | 4.75 |
| www — `юка рострата` | 3 | 0 | 8.67 |

The page already owns both Bulgarian and Latin species queries. Do not create another Yucca page or duplicate the product text. Apex and www URL variants both appear in GSC; Google's selected canonical still requires URL Inspection.

### Content/SEO findings

- Root BG H1: `Юка рострата (Yucca rostrata)`; title: `Юка рострата | Кошарица | Градински център Флориал`; description is within 160 characters.
- `translations.bg.name` and all three BG localized SEO fields are empty. **Code check:** `ProductPage.tsx` uses root `product.seo` for BG metadata/H1, while RU/EN use `translations[language].seo`. Therefore the empty BG translation SEO object does not currently erase the root BG metadata, but the missing BG translation name remains a data-quality gap and should be aligned for consistency.
- Root English/Russian SEO fields are not used for localized metadata; RU/EN translation SEO is present.
- Main image ALT is empty in BG/RU/EN. Two of three gallery images also have empty ALT in all three languages; one gallery image has localized ALT.
- Root price is EUR 150. Variants: 120 cm / 15 L / EUR 300 / stock 5 and 80 cm / 15 L / EUR 150 / stock 10. **Code check:** the product page uses selected sale-variant price/status for plant product types, so the root price does not determine the displayed selected-variant price. Verify the actual storefront selector and stock display before any commercial-data correction.
- The Bulgarian description begins with the typo `Юката рострата`; correct species/common-name phrasing can be addressed in a later approved editorial pass.

## 2. Cycas revoluta — two published records

### Record A — `tsyaka-tsikas`

- Sanity ID: `ac0fa4a7-54fd-4149-b0af-aa9759867ec5`
- Root name: `Цяка (Цикас)`; BG translation name: `Цикас (Cycas revoluta)`.
- `productType: other`; category: `plants-exotic`; active; `inStock`.
- Sale variant: 57–63 cm / 20 L / EUR 300 / stock 5.
- Root BG H1/meta are usable, but the separate `translations.bg.seo` contains a wrong-language Meta Title (`Купуй...`) and H1 incorrectly describes Cycas as an exotic palm. ProductPage's BG SEO path uses root `seo`, not `translations.bg.seo`; nevertheless the translation object should be corrected for data consistency if the owner approves.
- Root name spelling `Цяка` is non-standard relative to the BG translation `Цикас`; current UI localization/fallback should be verified on the live page before deciding which name users see.
- Short description calls it a “саговникова палма”; the long description correctly states that it is not a true palm, but later again refers to palm fertilizers. Avoid palm taxonomy in H1/title and category ownership.

### Record B — `cycas-revoluta`

- Sanity ID: `palm-cycas`
- Root name: `Цикас (Cycas revoluta)`; `productType: other`; categories: `plants-exotic` and `plants-root`; active; `onRequest`.
- Sale variant: 100 cm / EUR 300 / on request. Root `priceEUR` is EUR 3,000, but the plant product page uses the selected variant price; the displayed price is expected to be EUR 300 if this variant is selected. Confirm live rendering before changing data.
- BG root SEO is populated; `translations.bg` is null. RU/EN localized SEO exists.
- Description explicitly says Cycas is not a true palm and notes toxicity of all plant parts if ingested. Preserve this safety information in any future rewrite.
- GSC returned 4 impressions / 0 clicks for this URL; no rows for Record A in the same period.

### Duplication decision

Both records refer to the same species but represent different size/availability details. Search data shows impressions for only Record B in the measured period. This is not sufficient evidence to merge or remove Record A. Owner confirmation is needed on whether these are separate stock offers and which page should own generic `Cycas revoluta / Цикас` searches. Until then, keep both URLs and avoid destructive SEO actions.

## 3. Category and internal-link architecture

- `plants-palms` (“Палми и юки”) has 11 product references; Yucca is a secondary member, while its primary category is `plants-exotic`.
- `plants-exotic` has 4 product references, including Yucca and both Cycas records.
- Category-to-product cards are rendered from Sanity references. Product breadcrumbs use assigned categories; Yucca's primary category is Exotic Plants, while its secondary combined-category membership remains available for listing.
- Recommendation: retain the current combined “Palms and Yuccas” commercial category. Do not add a separate Yucca category based on this sample. Ensure copy and headings clearly distinguish palms from yuccas and cycads.

## 4. Recommended next actions (approval required for Sanity edits)

1. Correct Yucca's BG translation name; populate localized BG main-image ALT and the two missing gallery ALT sets. Review the description opening typo. Keep product type `shrub` and both current category references.
2. Normalize Cycas A's BG name to “Цикас”; remove palm wording from its BG translation H1 and Meta Title; align BG root/translation SEO and avoid the malformed “Купуй” title. Do not change price, size or stock.
3. Decide with the owner whether Cycas A and B are distinct offers. If yes, differentiate size/availability in their H1/meta and descriptions; if not, prepare a redirect/canonical/stock consolidation plan separately and obtain approval before action.
4. Verify rendered product pages, localized metadata, breadcrumbs, image ALT and price/stock selectors with Cloudflare Browser Rendering. Then use GSC URL Inspection to compare Google-selected canonical for apex/www and both Cycas URLs.
5. Recheck query/page data after changes; current GSC history is limited to a rolling 30-day sample in the connected Windsor trial.

## 5. Scope and limitations

- Sanity Production reads only; no documents, images, references, prices, variants, stock, categories or slugs were changed.
- Code read: current main `src/pages/ProductPage.tsx` and `functions/_middleware.ts`. ProductPage uses root SEO for BG and translation SEO for RU/EN; sale-variant pricing applies to plant product types including `other`.
- GSC values are from the last-28-day preset, captured 2026-11-15. Low-volume rows are directional only; Search Console may omit low-volume queries and recent dates may be incomplete.
- Browser-rendered live page verification and Google's selected canonical were not available in this pass.
