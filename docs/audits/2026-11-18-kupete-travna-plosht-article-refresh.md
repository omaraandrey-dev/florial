# 2026-11-18 — Refresh blog article “Купете качествена тревна площ в Слънчев бряг”

## Scope and approval

- Owner explicitly approved the exact Sanity Production document and fields before the write.
- Existing document: `blogPost-kupete-travna-plosht`; slug `kupete-travna-plosht`; public URL `/blog/kupete-travna-plosht`.
- Sanity project `bxvcy0qs`, dataset `production`.
- Published document revision after update: `4wsk3P4LWpbmPrrSdsLAZ6`.
- Document ID, slug, publication date, root title, sourceUrl, tags and cover asset were preserved. The cover ALT values were localized; the existing cover image was not replaced.
- The `gallery` field remains unchanged. Five images are embedded in each localized Portable Text body.

## Backup

- Exact pre-edit Sanity Production JSON snapshot: `docs/backups/sanity/2026-11-18-kupete-travna-plosht-before-editorial-refresh.json`.
- Backup commit on main: `51fbea466e4eedf6af26d0341602d2fcbded6ed8`.
- Snapshot revision: `qvVg1luYRxJZnxaWi1OfUN`.
- Backup was committed before the Sanity draft was patched.

## Content delivered

- BG/RU/EN are now complete Portable Text articles with 76 blocks each:
  - BG: 11,324 characters from `pt::text`
  - RU: 10,168 characters
  - EN: 10,321 characters
- Added sections covering seasonality, site assessment and ground preparation, delivery coordination, laying technique, watering and establishment, aftercare, FAQ and enquiry path.
- Retained the Florial technical specifications from the previous published article; no DROP dimensions were imported:
  - roll 0.4 × 1.25 m; 0.5 m² coverage; approximately 2 cm thick;
  - 15–25 kg per roll depending on soil moisture;
  - pallet 1 × 1.2 m; approximately 25 m² / 50 rolls; 750–1,300 kg.
- Retained the Florial experience statements from the existing page (work in the region since 2006; more than 1,000 projects; examples from 30 m²).
- The three irrigation kits were verified against current published Sanity product documents and integrated as example configurations, not universal recommendations:
  - Super Economy: 242.32 EUR incl. VAT; manual three-zone operation using ball valves, no automatic controller/solenoid valves.
  - Economy: 478.32 EUR incl. VAT; ESP-TM2-4i, three valves, 3504-PC rotors, US-400 bodies and VAN-12 nozzles.
  - Standard: 631.42 EUR incl. VAT; ESP-TM2-4i, three zones, 12 × 1804, 12 × R-VAN-18 and six 3504-PC rotors.
  - The example layout in the product descriptions is three lawn areas of approximately 8 × 20 m, 8 × 5 m and 3 × 16 m. Water supply requirement is approximately 3 m³/h at 3.5 bar. PE Ø25 mm pipe is excluded; electrical cable is also excluded from the automatic kits. Product status is `onRequest`.
- Contextual links point to the lawn service and its enquiry form, automatic irrigation service and category, trees/shrubs, flowers/roses, all plants, all three kits and relevant blog articles.
- The BlogPost page automatically renders related article cards after the body based on tags; the existing tag `Тревни площи` was preserved.
- User-facing copy is localized naturally for Bulgarian, Russian and English. SEO title, description and cover ALT are localized for all three languages.

## Imported images

Three static images from the owner-provided DROP article were uploaded to Sanity Production and embedded inline alongside the two existing article images. Source attribution metadata records DROP.

- `image-a20664f455ca911cce5a2f0c773f8809c0fbddcf-1600x1200-jpg`
- `image-45485b405e22c40e972068f75d9782582c5ba31a-1200x1600-jpg`
- `image-786386ad655f863d8206dd611056a4336ed53954-1200x1600-jpg`

All inline images have localized ALT values in BG/RU/EN. Production article fetches returned nine images per locale (cover, five inline images and three related-article card images).

## Verification

- Sanity published query confirms `isPublished=true`, unchanged slug, revision `4wsk3P4LWpbmPrrSdsLAZ6`, 76 Portable Text blocks per locale, five inline images per locale and localized SEO fields.
- Sanity beta document validation: `valid`; `complete=false` because custom validation callbacks were not executed by the validator. This limitation is retained rather than reported as a complete validation.
- Production fetches of:
  - `https://florial-bg.com/blog/kupete-travna-plosht`
  - `https://florial-bg.com/blog/kupete-travna-plosht?lang=ru`
  - `https://florial-bg.com/blog/kupete-travna-plosht?lang=en`
  returned localized article content and metadata. Each returned nine images and 16 links. The checks confirmed the localized roll dimensions and all three kit prices in each locale, plus irrigation and plant-category links.
- The existing service page `/services/rulonna-treva` was fetched successfully; the article links to that page and its existing enquiry form. No test enquiry was submitted.
- Live Production page content was fetched after publication; a separate Pages build/deployment was not required because no application code or schema changed.

## Not changed / limitations

- No Sanity schema, frontend code, routes, Header, navigation, Footer, Cloudflare Pages configuration, D1 data/schema, Resend configuration or Production secrets were changed.
- No new product, category, service or blog documents were created.
- No Google recrawl/indexing, Lighthouse/PageSpeed, mobile screenshot, or real enquiry submission was performed.
- Product/category links are confirmed in the published article output; a separate click-through audit of every destination was not performed.
