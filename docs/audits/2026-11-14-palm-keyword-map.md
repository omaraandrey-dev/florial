# Florial — palm keyword map (BG / RU / EN)

Date: 2026-11-14  
Stage: SEO plan 9.3 — keyword research and URL ownership  
Repository baseline: `main` at `e12bac1f0f7eb13e64574f45908287ccc27e1a36`  
Sanity: project `bxvcy0qs`, dataset `plants`, read-only published perspective  
Google Search Console source: Windsor.ai connector `searchconsole`, property `sc-domain:florial-bg.com`

## 1. Executive result

The existing page architecture is sufficient for a first keyword map; no new category is justified by the evidence collected in this pass.

- The main broad commercial target should be the existing category **Palmi i yuki** (`plants-palms`, Sanity slug `palmi-yuki`), expected route `/category/palmi-yuki`.
- Each existing species product page should own its species-specific and Latin-name searches.
- Trachycarpus is the strongest candidate for the cold-hardy palm cluster, but broad category-level cold-hardy terms should remain on the category page; the product page owns Trachycarpus-specific variants.
- Yucca rostrata has primary category `plants-exotic` and secondary reference `plants-palms`; its exact species query belongs to its product page. Cycas is now correctly classified as `other` in `plants-exotic` and must not be optimized as a true palm.
- Search Console currently shows some species-level visibility, but the broad category page produced no matching query rows in the last-28-day check. This is an observation for that short period, not proof that the page has never ranked.
- No reliable monthly search volumes were available. Do not present estimated volumes or keyword difficulty as measured facts.

## 2. Data sources and limitations

### Search Console via Windsor.ai

Connected property confirmed: `sc-domain:florial-bg.com`.

The connector trial rejected a request for a 12-month range and explicitly limited history to the last 30 days. The usable report was therefore restricted to the last-28-day preset (captured 2026-11-14). Google Search Console data can lag approximately 2–3 days; the newest dates may be incomplete.

All-query sample returned 82 rows. A palm/species-filtered query-to-page sample returned 18 rows. Relevant Bulgarian-country query observations included:

| Query | Impressions | Clicks | Average position |
|---|---:|---:|---:|
| `юка рострата` | 13 | 1 | 9.54 |
| `yucca rostrata` | 8 | 0 | 4.75 |
| `washingtonia filifera` | 5 | 1 | 5.80 |
| `butia capitata` | 5 | 0 | 8.40 |
| `брахея армата` | 6 | 0 | 12.67 |
| `вашингтония филифера` | 3 | 0 | 9.67 |
| `финикова палма` | 3 | 0 | 32.00 |
| `хамеропс` | 2 | 0 | 8.50 |
| `cycas` | 2 | 0 | 12.00 |
| `cycas revoluta` | 1 | 0 | 3.00 |
| `washingtonia robusta` | 3 | 0 | 11.00 |
| `sabal palmetto` | 1 | 0 | 9.00 |
| `phoenix roebelenii` | 1 | 0 | 4.00 |
| `канарска финикова палма` | 1 | 0 | 11.00 |
| `робелини` | 1 | 0 | 5.00 |
| `brahea armata` | 1 | 1 | 4.00 |

These are low-volume observations with small sample sizes; positions fluctuate and are not guaranteed rankings. The list is not a complete demand estimate.

The query-level filter for `/category/palmi-yuki` returned zero visible query-text rows in this 28-day window. A separate page-only GSC report returned **5 impressions and 0 clicks** across the three locale URLs: BG base URL — 1 impression, average position 60; EN `?lang=en` — 2 impressions, average position 3; RU `?lang=ru` — 2 impressions, average position 7.5. Thus the category is receiving a small number of impressions, but no query strings were exposed in the query-level sample. Product pages have more visible species-query rows.

The GSC query/page sample included both apex and `www` URL forms for some product queries (for example Butia and Washingtonia). The source code sets the canonical host to the apex domain and emits localized canonical/hreflang URLs; the RU/EN category query-parameter URLs are intentional locale routes. GSC's www rows still merit URL Inspection to confirm Google's selected canonical.

### Live SERP / competitor observations

- Palmi.bg has a dedicated `Студоустойчиви палми` category with subgroups for Brahea, Washingtonia, Butia/Jubaea/Sabal, Phoenix, Trachycarpus/Chamaerops and related plants. Its Trachycarpus/Chamaerops category lists 18 products. This is a materially deeper topical structure than Florial's current single broad category.
- Search results for Bulgarian purchase intent also surfaced marketplace listings for cold-hardy Trachycarpus, reinforcing that “студоустойчиви палми” and “трахикарпус” are commercially relevant phrase families. Marketplace listings are not reliable volume data.
- The separate domain `palmandolivetrees.com` presents “Палми и маслини-Несебър” and also names “Градински център Флориал”. Its ownership, indexing, canonical/redirect relationship and content overlap are reserved for stage 9.4; this report does not assume its technical relationship to the main domain.

## 3. URL ownership — Bulgarian (primary language)

| Search-intent cluster | Primary target page | Query variants to cover |
|---|---|---|
| Broad commercial / local palm shopping | `/category/palmi-yuki` | палми; палми и юки; продажба на палми; палми Несебър; палми в Несебър; палми България; палми за градина; декоративни палми; едроразмерни палми |
| Cold-hardy palms — broad category intent | `/category/palmi-yuki` | студоустойчиви палми; студоустойчива палма; студоустойчиви палми за България; палми за двор; палми за градина |
| Trachycarpus species / purchase | `/product/trachycarpus-fortunei` | трахикарпус; трахикарпус форчуна; трахикарпус палма; палма трахикарпус; студоустойчив трахикарпус; трахикарпус цена |
| Standard Washingtonia offer (240 cm / 50 L / EUR 600 / stock 50) | `/product/washingtonia` | вашингтония; вашингтония филифера; вашингтония робуста; палма вашингтония; купить вашингтонию |
| Large Washingtonia specimen (475–525 cm / 300 L / EUR 3,000 / stock 1) | `/product/ventlieva-palyma-vashintoniya` | едроразмерна вашингтония; голяма палма вашингтония; вашингтония 5 метра; крупномерная вашингтония; large Washingtonia palm 5 m |
| Canary Island date palm | `/product/phoenix-canariensis` | канарска финикова палма; канарска палма; Phoenix canariensis |
| Date palm | `/product/phoenix-dactylifera` | финикова палма; Phoenix dactylifera |
| Pygmy date palm | `/product/phoenix-roebelenii` | робелини; палма робелини; финик робелини; Phoenix roebelenii |
| Mediterranean fan palm | `/product/chamaerops-humilis` | хамеропс; хамеропс хумилис; Chamaerops humilis |
| Blue/armata palm | `/product/brahea-armata` | брахея армата; брагея армата; Brahea armata |
| Jelly palm | `/product/butia-capitata` | бутиа; бутиа капитата; Butia capitata |
| Sabal | `/product/sabal-palmetto` | сабал; сабал палмето; Sabal palmetto |
| Yucca rostrata (not a palm) | `/product/yucca-rostrata` | юка рострата; Yucca rostrata; юка за градина |

Read-only Sanity comparison confirms these are distinct offers, not duplicate inventory: the `washingtonia` page is 240 cm / 50 L / EUR 600 / stock 50; `ventlieva-palyma-vashintoniya` is 475–525 cm / 300 L / EUR 3,000 / stock 1. GSC query/page rows for Washingtonia species terms currently point to `/product/washingtonia`; the large-specimen URL had no matching row in this query sample. Keep both pages but give the large specimen a distinct size-led search target.

## 4. URL ownership — Russian

Russian keyword ideas are hypotheses for page copy and later GSC validation; no meaningful Russian-language palm query sample was returned in the current 28-day report.

| Search-intent cluster | Primary target page | Query variants to cover |
|---|---|---|
| Broad commercial / local | `/category/palmi-yuki` | купить пальмы в Несебре; пальмы в Болгарии; продажа пальм Болгария; пальмы для сада; пальмы и юкки; крупномерные пальмы |
| Cold-hardy palms | `/category/palmi-yuki` | морозостойкие пальмы; зимостойкие пальмы для сада; пальмы для открытого грунта в Болгарии |
| Trachycarpus | `/product/trachycarpus-fortunei` | трахикарпус Форчуна; купить трахикарпус; морозостойкая пальма трахикарпус |
| Standard Washingtonia offer (240 cm / 50 L / EUR 600) | `/product/washingtonia` | вашингтония; вашингтония филифера; вашингтония робуста; купить вашингтонию |
| Large Washingtonia specimen (475–525 cm / 300 L / EUR 3,000) | `/product/ventlieva-palyma-vashintoniya` | крупномерная вашингтония; большая пальма вашингтония; вашингтония 5 метров |
| Phoenix canariensis | `/product/phoenix-canariensis` | канарская финиковая пальма |
| Phoenix dactylifera | `/product/phoenix-dactylifera` | финиковая пальма; финик пальма |
| Phoenix roebelenii | `/product/phoenix-roebelenii` | финик Робелини; пальма Робелини |
| Chamaerops | `/product/chamaerops-humilis` | хамеропс; хамеропс приземистый |
| Brahea | `/product/brahea-armata` | брахея вооружённая; брагея армата |
| Butia | `/product/butia-capitata` | бутиа головчатая; бутиа капитата |
| Sabal | `/product/sabal-palmetto` | пальма сабаль; сабал палметто |
| Yucca rostrata | `/product/yucca-rostrata` | юкка рострата; купить юкку рострата |

Do not put the generic “купить пальмы в Болгарии” cluster into every product title. Keep it on the category page; use local geographic modifiers in product pages only where they read naturally and distinguish the offer.

## 5. URL ownership — English

English terms are hypotheses for the EN locale and should be validated against later GSC data.

| Search-intent cluster | Primary target page | Query variants to cover |
|---|---|---|
| Broad commercial / local | `/category/palmi-yuki` | palm trees for sale Bulgaria; buy palm trees in Nessebar; palms in Bulgaria; garden palm trees; palms and yuccas |
| Cold-hardy palms | `/category/palmi-yuki` | cold hardy palm trees Bulgaria; hardy palms for gardens; outdoor palm trees Bulgaria |
| Trachycarpus | `/product/trachycarpus-fortunei` | windmill palm for sale; Trachycarpus fortunei; cold hardy windmill palm |
| Standard Washingtonia offer (240 cm / 50 L / EUR 600) | `/product/washingtonia` | Washingtonia palm; Washingtonia filifera; Washingtonia robusta |
| Large Washingtonia specimen (475–525 cm / 300 L / EUR 3,000) | `/product/ventlieva-palyma-vashintoniya` | large Washingtonia palm; 5 m Washingtonia; specimen Washingtonia |
| Canary Island date palm | `/product/phoenix-canariensis` | Canary Island date palm; Phoenix canariensis |
| Date palm | `/product/phoenix-dactylifera` | date palm; Phoenix dactylifera |
| Pygmy date palm | `/product/phoenix-roebelenii` | pygmy date palm; Phoenix roebelenii |
| Chamaerops | `/product/chamaerops-humilis` | Mediterranean fan palm; Chamaerops humilis |
| Brahea | `/product/brahea-armata` | blue hesper palm; Brahea armata |
| Butia | `/product/butia-capitata` | jelly palm; Butia capitata |
| Sabal | `/product/sabal-palmetto` | Sabal palmetto palm |
| Yucca rostrata | `/product/yucca-rostrata` | Yucca rostrata for sale; beaked yucca |

## 6. Cannibalization and taxonomy rules

1. The category page owns generic “palms / palm trees for sale / palms in Nessebar / palms in Bulgaria” intent.
2. A product page owns its species, common name, botanical name, and species-specific commercial phrases.
3. The category page may mention species and link to products, but should not duplicate full product-page copy or target every exact species phrase as its primary query.
4. “Cold-hardy palms” is a category-level discovery cluster; Trachycarpus owns the exact Trachycarpus terms. Avoid making a new cold-hardy category until stage 9.5 evaluates product count, filters, user experience and actual demand.
5. Yucca rostrata is currently primarily assigned to `plants-exotic` and secondarily referenced by `plants-palms`; optimize the exact Yucca query on its product page. Do not describe Yucca as a palm in taxonomy or botanical copy.
6. Cycas revoluta is currently `productType: other` in `plants-exotic`; keep “цикас / cycas / sago cycad” on its product page and out of the palm cluster.
7. The two Washingtonia pages are confirmed as distinct size/container/price/stock offers. Keep both, assign general species queries to the 240 cm / 50 L product, and assign large-specimen / 5 m queries to the 475–525 cm / 300 L product. Current GSC species-query rows point to the standard offer; no matching row was returned for the large specimen in this sample.
8. Do not split BG/RU/EN into separate URL families unless the current routing architecture already does so; language targeting should follow the site's existing locale/canonical/hreflang implementation.

## 7. Recommended implementation order (not applied)

1. First improve the existing `/category/palmi-yuki` landing page around broad Bulgarian local-commercial intent and a clear species navigation structure. The current GSC query/page sample returned no visible query rows for the category in the last 28 days, while species pages already have visible query rows.
2. Add/verify contextual internal links from category to each relevant palm product, and from products back to the category.
3. Keep product-page SEO focused on species-specific queries; verify BG/RU/EN localization and botanical accuracy.
4. Differentiate the SEO fields and search targets of the two confirmed Washingtonia offers; preserve both products.
5. After stage 9.4, decide whether local landing-page strategy belongs on the main domain, the second domain, or both. Avoid duplicate local pages until that is resolved.
6. Measure after indexing refresh; use a longer GSC history when the Windsor plan permits it. Do not infer success from a short sample.

## 8. Follow-up questions / limitations

- Search volume and keyword difficulty for all proposed terms: **NOT KNOWN — not supplied by the connected Search Console trial or the web SERP sample**.
- GSC history older than 30 days: **NOT AVAILABLE in the current Windsor.ai trial**; the 12-month request returned an explicit trial-history restriction.
- Category route: Sanity slug `palmi-yuki` and the `/category/:slug` route handler in `src/App.tsx` confirm `https://florial-bg.com/category/palmi-yuki`. Source inspection of `functions/_middleware.ts` confirms localized canonical URLs, hreflang alternates, `index, follow` unless `noIndex` is true, and CollectionPage JSON-LD. The middleware's initial HTML includes the short description and product listing; the 32-block `seoContent` is rendered by client-side `CategoryPage` through `RichText` after hydration. Direct live HTML / Google rendered-HTML verification remains pending.
- Google recrawl, indexing and current rankings: **not confirmed**.
- Ownership/SEO relationship of `palmandolivetrees.com`: reserved for stage 9.4.

## 9. Sources

- Connected Search Console property and query/page metrics retrieved read-only through Windsor.ai on 2026-11-14.
- Published Sanity read-only category lookup: `plants-palms`, slug `palmi-yuki`.
- Published Sanity read-only product lookup: 10 palm-type products linked to `plants-palms`; Yucca rostrata is primarily `plants-exotic` and secondarily linked to `plants-palms`; Cycas is `other` in `plants-exotic`. The two Washingtonia offers were compared read-only and confirmed as distinct size/container/price/stock records.
- Windsor.ai GSC query/page sample for Washingtonia queries: all five Bulgarian query/page rows pointed to `/product/washingtonia`; none pointed to the large-specimen URL in this sample.
- Palmi.bg cold-hardy category: https://palmi.bg/category/35/studoustoychivi-palmi.html
- Palmi.bg Trachycarpus / Chamaerops category: https://palmi.bg/category/47/trahikarpus-hamerops-trachycarpus-chamaerops.html
- Search result for the separate Nessebar domain: https://www.palmandolivetrees.com/
