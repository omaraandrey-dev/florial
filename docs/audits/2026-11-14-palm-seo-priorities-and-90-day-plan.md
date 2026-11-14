# Florial — palm SEO priorities and 90-day plan

Date: 2026-11-14  
Stages: SEO plan 9.5 (priorities) and 9.6 (90-day calendar)  
Basis: stage 9.3 keyword map and stage 9.4 second-domain review  
Primary domain: https://florial-bg.com/

## 1. Executive recommendation

Keep the existing Florial architecture and catalogue. The available evidence does not justify creating a new palm category or duplicating the catalogue on another domain yet.

The highest-value sequence is:
1. Verify the technical SEO state of the existing palm category; the two Washingtonia offers have now been confirmed as distinct and need separate search targeting.
2. Keep `florial-bg.com` as the primary commercial site and GBP destination.
3. Audit the existing `/category/palmi-yuki` content and rendered output, shorten its overlong localized Meta Descriptions, and strengthen internal links. The category already has 32 SEO content blocks in each language, so do not add more copy by default.
4. Keep each product page focused on one species and its botanical/common-name variants.
5. Resolve the second domain's intended role only after confirming ownership/control and obtaining technical access.
6. Measure progress through the connected Search Console property, recognizing the current 30-day Windsor trial history limit.

No content, category, product, domain, Google Business Profile, Cloudflare or Sanity changes are made by this plan.

## 2. Prioritized improvement list

### P0 — Before any SEO content or domain change

| Priority | Task | Reason / evidence | Completion condition |
|---|---|---|---|
| P0 | Verify `/category/palmi-yuki` initial HTML, indexability, canonical, hreflang and JSON-LD | Sanity slug and route are confirmed, but direct HTTP HTML inspection was unavailable. GSC returned no visible query rows for this page in the last 28 days. | Record the exact live response, title/description/H1, canonical, hreflang, robots and category/product structured data in a technical audit. |
| P0 | Verify category metadata and rendered output | Read-only Sanity check: Meta Descriptions are 170 BG / 163 RU / 191 EN characters; Meta Titles are 48 / 47 / 51 characters. The category already has 32 SEO content blocks per locale. | Verify which localized metadata and SEO blocks appear in live HTML, and record canonical/hreflang/indexability before any content write. |
| P0 | Confirm control and intended role of `palmandolivetrees.com` | The secondary site uses Florial branding and the same phone, but registrar/DNS/hosting control is not verified. GBP points to the main domain. | Owner confirms account control and whether the domain is intended as a separate lead-generation site or to be retired. |
| P0 | Check apex / www canonical consistency | Last-28-day GSC sample included both apex and www page URLs for some species queries. This does not prove a canonical defect. | Confirm Google-selected canonical and live canonical redirects for representative product URLs and the palm category. |

### P1 — Improve the existing category and product structure

| Priority | Task | Recommended scope | Success signal |
|---|---|---|---|
| P1 | Shorten the existing category Meta Descriptions | Published Sanity has 32 SEO content blocks in BG, RU and EN, with local geography, species guidance and FAQs. Meta Descriptions exceed the 160-character project target: BG 170, RU 163, EN 191; titles are within 70. Proposed localized descriptions are listed in the Days 8–21 section. | After approval and publish, read-back confirms all three descriptions at or below 160 characters and the live HTML emits the correct locale values. |
| P1 | Add contextual internal links between category and products | Category links to all relevant species; each product links back to the category and to relevant planting/care services where appropriate. | Crawl confirms links are present, crawl depth is reasonable and product pages are reachable from the category. |
| P1 | Separate the two Washingtonia product-page search targets | Read-only Sanity confirmed distinct offers: standard page `/product/washingtonia` = 240 cm / 50 L / EUR 600 / stock 50; large specimen `/product/ventlieva-palyma-vashintoniya` = 475–525 cm / 300 L / EUR 3,000 / stock 1. GSC species-query rows currently point to the standard URL. | Standard page owns general Washingtonia species terms; large page owns large-specimen / 5 m / 300 L intent. Keep both offers; do not merge or redirect. |
| P1 | Preserve botanical separation | Yucca rostrata is primarily in `plants-exotic`; Cycas is `other` in `plants-exotic`. Neither should be represented as a true palm in product taxonomy or botanical copy. | Product copy and category labels remain botanically accurate. |

### P2 — Local authority and content quality

| Priority | Task | Recommended scope | Success signal |
|---|---|---|---|
| P2 | Audit and maintain existing category-level decision support | The current 32-block localized content already covers species selection, coastal conditions, winter protection, planting and FAQs. Verify rendering and factual consistency first; add content only for a demonstrated gap. | Accurate, fully rendered guidance with no duplicated paragraphs or unsupported hardiness claims. |
| P2 | Improve image and product presentation | Confirm meaningful BG/RU/EN ALT for all gallery images, actual product sizes/containers and clear availability. Existing priority-1 work already corrected the main-image ALT gaps for the 11 palm records. | No missing image ALT on target pages; product details match published stock/variants. |
| P2 | Keep GBP aligned with the primary site | GBP already links to `florial-bg.com`. Maintain the same brand, phone and primary URL. Any category, service, photo or post changes require a separate review. | Consistent business identity and more relevant local actions. |
| P2 | Obtain better GSC history if economically justified | Current Windsor trial blocks ranges older than 30 days. Do not upgrade solely on assumption; first use weekly snapshots and decide whether historical trend analysis is worth the cost. | A reliable 3–6 month baseline or explicit decision that rolling weekly data is sufficient. |

### P3 — Conditional expansion

| Priority | Task | Gate before proceeding |
|---|---|---|
| P3 | Create a separate “Студоустойчиви палми” category | Only if the published assortment is deep enough, products can be meaningfully grouped and query evidence supports a separate landing page. Compare against the current category and competitor structure first. |
| P3 | Retain or retire the second domain | Choose only after confirming domain control, its independent business purpose, search performance and URL inventory. If retiring, prepare one-to-one 301 redirects and preserve the domain registration. |
| P3 | Build additional local landing pages | Do not create thin pages for every nearby settlement. Use only where Florial genuinely serves the area and can provide unique local information, inventory or services. |

## 3. Keyword-to-page rules to preserve

- Generic commercial and local palm intent belongs to `/category/palmi-yuki`.
- Exact common-name and botanical-name intent belongs to the matching species product page.
- “Студоустойчиви палми” is currently a broad discovery theme for the existing category; Trachycarpus owns its exact species phrases.
- Yucca rostrata and Cycas stay outside true-palm taxonomy.
- Keep both Washingtonia pages: they represent distinct inventory offers. Assign general species searches to the 240 cm / 50 L product and large-specimen / 5 m searches to the 475–525 cm / 300 L product.
- Do not repeat generic “buy palms in Bulgaria” phrases in every product title and description.
- Keep Nessebar as the primary local reference and use nearby service locations naturally; do not add Sozopol.
- Avoid publishing a second copy of Florial's product catalogue or duplicating local palm landing pages across both domains.

## 4. 90-day execution calendar

### Days 1–7 — Technical baseline and owner decisions

- Check live initial HTML and rendered output for `/category/palmi-yuki` in BG/RU/EN.
- Verify canonical, hreflang, robots/indexability and structured data on the category and representative species pages.
- Compare apex and www behavior and Google-selected canonical where GSC exposes it.
- Record the already verified Washingtonia offer split and assign separate search targets.
- Confirm whether the owner controls `palmandolivetrees.com` and what role it should serve.
- Do not publish content changes during this diagnostic week.

**Deliverable:** technical baseline, confirmed Washingtonia search-target split, secondary-domain ownership/role decision or a clearly recorded blocker.

### Days 8–21 — Category landing page and internal links

- Shorten the existing BG/RU/EN category Meta Descriptions after checking the live rendered values.
- Proposed text (all within 160 characters):
  - BG (144): `Продажба на палми и юки в Несебър, Равда и по Южното Черноморие. Изберете подходящ вид за градина или двор с доставка и професионално засаждане.`
  - RU (142): `Продажа пальм и юкк в Несебре, Равде и на Южном Черноморье. Подберём вид для сада или участка, организуем доставку и профессиональную посадку.`
  - EN (152): `Buy palms and yuccas in Nessebar, Ravda and Bulgaria’s southern Black Sea coast. Choose a suitable garden plant with delivery and professional planting.`
- Do not add new long SEO blocks: the existing category already has 32 blocks per locale; first verify that they render correctly and that internal product links are present.
- Add or verify navigation from category to each palm product and from products back to the category.
- Include planting/delivery/service details only where they accurately reflect the published service offer.
- Preserve the existing 32-block localized SEO content unless the live rendering audit identifies a specific omission; avoid duplicate FAQ or repeated paragraphs.

**Deliverable:** approved category content and internal-link map; publish only after the normal Sanity backup and owner approval process.

### Days 22–35 — Species pages and catalogue alignment

- Differentiate the SEO fields of the two Washingtonia pages: general species intent on the 240 cm / 50 L offer; large-specimen / 5 m intent on the 475–525 cm / 300 L offer. Preserve both distinct products.
- Review each species page against its assigned query cluster.
- Confirm BG/RU/EN H1, Meta Title, Meta Description, image ALT and product identity.
- Verify variant dimensions, container size, price and stock presentation against published Sanity data.
- Add cross-links to relevant planting/care services where helpful.

**Deliverable:** species-page QA report and approved corrections, with published read-back evidence if any Sanity writes occur.

### Days 36–50 — Local authority and topical depth

- Verify the existing localized category guide and FAQs are rendered correctly; add no new long-form blocks unless a specific gap is found.
- Review product/category image relevance and image accessibility text.
- Review GBP palm/olive category relevance, services, photos and website link; propose changes separately before applying them.
- Decide whether a cold-hardy palm subcategory is justified by assortment and observed search demand.

**Deliverable:** local content and category expansion recommendation; no thin location pages.

### Days 51–65 — Secondary-domain strategy (conditional)

- If the owner confirms access, obtain URL inventory and inspect robots, sitemap, canonicals, redirects, language versions and analytics.
- If the domain is retained, define distinct lead-generation content and clear links into the primary store.
- If retired, prepare a one-to-one redirect map, test plan and rollback plan; wait for explicit approval before applying redirects.
- If owner access is not available, keep the domain unchanged and record the limitation.

**Deliverable:** final secondary-domain strategy and, if applicable, a separate implementation proposal.

### Days 66–90 — Measurement and refinement

- Compare weekly GSC clicks, impressions, CTR, average position and query-to-page mapping for palm-related terms.
- Monitor category and product pages separately; identify cannibalization or query migration.
- Compare BG performance first, then RU/EN once enough data accumulates.
- Track local queries around Nessebar and nearby service areas where the data supports it.
- Recheck indexing/canonical status after Google recrawls; do not treat a request for indexing as proof of indexation.
- Update the keyword map and 90-day plan based on measured results.

**Deliverable:** 90-day SEO review with measured changes, unresolved technical issues and next-quarter priorities.

## 5. Measurement rules

Use the connected Search Console property `sc-domain:florial-bg.com`. Because the current Windsor trial limits history to 30 days, use consistent weekly snapshots until a longer history is available.

Track these page groups separately:
1. Palm category: `/category/palmi-yuki`.
2. Species pages: Trachycarpus, Washingtonia, Phoenix canariensis, Phoenix dactylifera, Phoenix roebelenii, Chamaerops, Brahea, Butia and Sabal.
3. Yucca rostrata: product page, separate from true palms.
4. Cycas: exotic plant page, separate from true palms.

For each group, monitor:
- Organic clicks and impressions.
- CTR and average position (as directional metrics, not fixed ranks).
- Actual query strings and the URL receiving each query.
- Country and device where sample sizes are meaningful.
- Google-selected canonical and indexing state where URL Inspection data is available.

Do not define numeric traffic targets until a stable baseline exists. The current 28-day species sample has small impression counts and cannot support reliable forecast percentages.

## 6. Dependencies and approval gates

- Sanity content writes: backup affected documents, review the exact draft and obtain owner approval before publishing.
- New categories or product changes: separate owner approval after the assortment and URL strategy are confirmed.
- Second-domain redirects/canonicals/DNS: owner confirms registrar and hosting access; explicit approval required before any change.
- Google Business Profile changes: read current values, present proposed values and obtain confirmation before applying.
- Cloudflare, domain, DNS, secrets and Production infrastructure remain out of scope for this planning report.

## 7. Current unknowns

- Search volumes and keyword difficulty for BG/RU/EN.
- Search Console history older than 30 days in the connected Windsor trial.
- Live initial HTML and canonical/hreflang of the palm category.
- Whether the two Washingtonia records represent distinct offers.
- Legal/technical ownership and access to `palmandolivetrees.com`.
- Second-domain Search Console performance and full URL inventory.
- Google recrawl and ranking impact of the recent Sanity SEO corrections.

No work described in this calendar is considered completed merely because it appears in the plan.
