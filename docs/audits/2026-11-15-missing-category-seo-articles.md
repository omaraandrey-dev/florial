# Missing category SEO articles — 2026-11-15

## Scope and audit method
- Sanity project: `bxvcy0qs`.
- Plant catalogue dataset: `plants`; irrigation/equipment catalogue dataset: `production`.
- Read all published `category` documents in both datasets and checked `seoContent`, `translations.ru.seoContent` and `translations.en.seoContent`.
- Total categories checked: 17 plant categories + 54 irrigation/equipment categories = 71.
- Initial result: 8 categories had no SEO article in one or more of the three locales. After publication, a repeat query returned zero categories missing BG, RU or EN `seoContent` in either dataset.

## Categories completed

### Plants — dataset `plants`
All six documents were missing the article in BG/RU/EN before the update:
- `plants-broadleaf` — `shirokolistni-darveta` — Широколистни дървета. One linked product at audit time. Article covers selection, mature size, shade, coastal wind/heat, planting, irrigation and pruning.
- `plants-citrus` — `tsitrusi` — Цитруси. Eight linked products. Article covers citrus types, container growing, light, substrate, watering, feeding, repotting and winter care.
- `plants-exotic` — `ekzotichni-rasteniya` — Екзотични растения. Four linked products. Article covers species-specific selection, light, drainage, watering and differing winter protection needs; examples reflect catalogue plants such as cycad, banana plant and Yucca rostrata.
- `plants-flowering-shrubs` — `tsaftyashti-hrasti` — Цъфтящи декоративни храсти. One linked product. Article covers flowering periods, mature size, site selection, coastal conditions, planting, pruning and compositions.
- `plants-indoor` — `interiorni-rasteniya` — Интериорни растения. Zero linked products. Article is educational and does not claim a current assortment or availability.
- `plants-trees-shrubs` — `darveta-i-hrasti` — Дървета и декоративни храсти. One linked product. Article covers evergreen/deciduous groups, mature dimensions, site planning, coastal conditions, planting, irrigation and pruning.

### Irrigation/equipment — dataset `production`
- `90ab6b0d-7b56-4cf2-946e-129c60ab204f` — `troynik-90-plastmasov-vatreshna-rezba` — ТРОЙНИК 90˚ - ПЛАСТМАСОВ ВЪТРЕШНА РЕЗБА. Zero linked products. Article explains the 90° female-thread tee's role, thread sizing, compatibility, sealing, installation, pressure specifications and inspection. It explicitly avoids inventing product dimensions or pressure ratings and notes that current linked product availability must be confirmed.
- `25a5e3e5-b937-4beb-882c-b6708337c81d` — `electromagnetic-valves` — Електромагнитни клапани. Zero direct product references. Article covers zone control, solenoid operation, 24 V AC versus 9 V DC latching compatibility, flow/pressure/connection sizing, valve boxes, wiring, maintenance and diagnosis. It does not treat the voltage variants as interchangeable.

## Published content structure
- Each of the 8 categories has 27 Portable Text blocks in each locale: 9 H2 headings and 18 paragraphs.
- BG uses root `seoContent`; RU and EN use `translations.ru.seoContent` and `translations.en.seoContent`.
- All articles are distinct, localized and tailored to their category. Local context is limited to the Florial service area around Nessebar and nearby settlements; Sozopol is not used.
- Product stock, prices, product descriptions, category metadata and availability were not invented or changed.

## Backup and publication
- Seven full published-document snapshots captured before writing: `docs/backups/sanity/2026-11-15-all-categories-before-seo-content.json`.
- The additional solenoid-valve category snapshot: `docs/backups/sanity/2026-11-15-solenoid-valves-category-before-seo-content.json`.
- All eight documents were patched using revision guards and published to Sanity Production.
- Published read-back confirmed 27 blocks and 9 H2 headings in BG/RU/EN for all eight documents.
- Validation tool status: seven documents reported `valid` but `complete=false` because custom validation callbacks were not run. The solenoid-valve category reported pre-existing unknown root fields `seoTitle` and `seoDescription` against the currently resolved category schema; these fields existed before the change, were preserved, and were not edited. Publication nevertheless succeeded. Do not remove those legacy fields without a separate source/schema and frontend-use audit.

## Verification and limitations
- Source inspection on GitHub `main` commit `dd7e8021173d3790a5751e84ecc4ec4ceb276b73`: `src/pages/CategoryPage.tsx` selects localized category SEO content and renders it with `RichText`; `src/lib/categorySeoContent.mjs` returns BG root content and the matching RU/EN translation when renderable blocks exist.
- Live browser rendering was attempted for all eight BG routes but Firecrawl returned an insufficient-credits error before any page request ran. Therefore live rendered-page verification is **not confirmed**.
- Google recrawl, indexing and ranking changes are **not confirmed**.

## Not changed
No H1, Meta Title, Meta Description, short descriptions, localized descriptions, help blocks, slugs, images, category hierarchy, product records, product-category references, schema, application code, sitemap/RSS, analytics, Cloudflare settings, D1, Resend or Production deployment were changed.

## Remaining follow-ups
- Recheck live BG/RU/EN rendering when Firecrawl credits are available.
- Confirm Google recrawl/indexing separately in Search Console.
- Review the empty direct-product categories `plants-indoor`, `troynik-90-plastmasov-vatreshna-rezba` and `electromagnetic-valves`; no catalogue relationships were changed as part of this content task.
