# 2026-11-18 — Installation stages blog article refresh

## Scope

- Project: `bxvcy0qs`
- Dataset: `production`
- Document ID: `blogPost-etapi-montazh-avtomatichna-polivna-instalatsiya`
- Slug / route: `etapi-montazh-avtomatichna-polivna-instalatsiya` / `/blog/etapi-montazh-avtomatichna-polivna-instalatsiya`
- Original published revision: `wShFcTvKnRduO9ho4JbXhm`
- Final published revision after the Bulgarian length correction: `4wsk3P4LWpbmPrrSds1QnC`
- Existing ID, slug, public URL, publication date (`2024-08-22T13:35:50.217Z`), published state and cover asset were preserved.

## Backup

- Complete pre-edit published document snapshot: `docs/backups/sanity/2026-11-18-installation-stages-before-editorial-refresh.json`\n- Complete snapshot of the first refreshed published revision before the Bulgarian length correction: `docs/backups/sanity/2026-11-18-installation-stages-before-bg-length-correction.json`
- Backup was created and read back from GitHub before any Sanity document write.
- Backup includes project, dataset, published perspective, document ID, original revision and the complete original Sanity document.

## Editorial changes

- Rebuilt all three language bodies as Portable Text, including real H2 blocks, paragraphs, bullet lists, inline link annotations and image blocks. Final counts: BG 50 blocks / 1,249 words; RU 44 blocks / 760 words; EN 44 blocks / 934 words. The pre-edit article had 1,142 BG words, 417 RU words and 476 EN words, so every language version is now at least as long as its previous version.
- BG is the primary editorial version. RU and EN are independently adapted, not literal translations.
- Content now covers site survey, plant-specific watering needs, measured flow and dynamic pressure, zoning, equipment selection, site marking, trench routing, pipe/cable installation, solenoid valves, sprinklers, drip irrigation, controller/pump/water source, commissioning and adjustment.
- Trench depth is deliberately not presented as a universal fixed value. It is determined by the project, pipe/cable type, surface, loading, soil and site conditions.
- No DROP-specific geography, unsupported company history, installation-time promises, warranty promises or unsupported hydraulic values were carried over.
- Existing title and localized SEO/short-description/cover-alt fields were updated in all three languages. The article remains indexable; no schema or frontend changes were required.

## Imported source images

Five original photographs from the DROP article were successfully imported from Wix static asset URLs into the Florial Sanity Production dataset. Source attribution is stored in Sanity asset metadata.

- Site marking: `image-70320c74cfe1d241060a6049339dd385f1c9e340-1920x3412-jpg`
- Equipment delivery: `image-2a5051b732d5b19e26627b06dae35fdac6d5d0a2-1920x3412-jpg`
- Components delivery/preparation: `image-57a153738a5cdeca7e46fac307f1c147433b2945-1920x3412-jpg`
- Equipment assembly: `image-99fdd7e27dedb3f2d72d33fab5252fb2db4098f3-1920x3412-jpg`
- Controller installation: `image-a19fd10cac27f8cf7e24780c21785c10598ef01f-1920x3412-jpg`

All five images are embedded inline at relevant article stages, with BG/RU/EN ALT text and localized captions. The original hero/cover image was preserved. The old duplicated inline image sequence was replaced by these five contextual images.

## Verified catalogue and internal links

- Published and active product documents were checked in Sanity Production; all three are VAT-inclusive and currently marked `onRequest`:
  - Super Economy Kit — 242.32 EUR; three lawn zones with manual taps instead of a controller.
  - Economy Kit — 478.32 EUR; three lawn zones with Rain Bird ESP-TM2-4i, three valves, 3504-PC rotors, US-400 bodies and VAN-12 nozzles.
  - Standard Kit — 631.42 EUR; three lawn zones with Rain Bird ESP-TM2-4i, three valves, twelve 1804 bodies with R-VAN-18 nozzles and six 3504-PC rotors.
- The article clearly distinguishes kit prices from a complete design-and-installation quotation. It notes that Ø25 mm PE pipe and valve cable are not included in the Economy and Standard kits, and that additional materials depend on the site.
- Published category routes were verified in the equipment dataset: `/category/vsichko-za-polivane`, `/category/sprinklers`, `/category/controllers`, `/category/kapkovo-napoyavane`.
- Plant category routes were verified in dataset `plants`: `/category/darveta-i-hrasti` and `/category/tsvetya-i-rozi`.
- Existing service `avtomatichno-napoyavane` is active and its enquiry form was read-only checked in BG/RU/EN. The article links to this service page instead of introducing an unsupported blog-specific form field or changing the existing API.
- The article tag remains `Автоматично напояване`; the existing related-post renderer returns up to three dynamically selected articles. Production HTML showed links to the price article, misting article and Rain Bird equipment article.

## Validation and live verification

- Sanity document validation: status `valid`; result is incomplete because the validation tool does not execute custom validation callbacks. Built-in schema checks ran.
- Published Sanity read-back confirmed final revision `4wsk3P4LWpbmPrrSds1QnC`, 50 BG / 44 RU / 44 EN body blocks, five inline images in each language, localized title/SEO/short description, preserved cover, slug, publication date and published state. The second write was preceded by a separate full snapshot of the first refreshed revision and the additional BG paragraphs were validated before publishing.
- Fresh Production HTML retrieval (`maxAge=0`) succeeded for BG, RU and EN:
  - `<html lang>` correctly reports bg/ru/en.
  - Each page renders its localized H1.
  - All five imported Sanity image assets are present in each locale.
  - All six category links, three product links and the service link are present.
  - The published kit price content and enquiry-form service link are present.
- Existing service page fresh HTML retrieval succeeded in BG/RU/EN; localized H1 and enquiry form fields (including telephone and email) were present.
- No actual lead form was submitted. No Lighthouse/PageSpeed, formal mobile overflow measurement or Google recrawl/indexing test was performed. Metadata in the HTML head was not independently inspected by the scrape output.

## Scope boundaries

- No frontend code, Sanity schema, Header, navigation, Footer, routes, form/API, Cloudflare Pages settings, D1, Resend or secrets were changed.
- No changes were made to the separate pricing article or any other blog/service document.
- This branch contains only the unique Sanity backup and this audit. Shared `CHANGELOG.md`, `docs/TECHNICAL_PASSPORT.md` and `docs/AI/OPEN_QUESTIONS.md` are deferred to a single conflict-aware documentation integration pass because other open PRs already touch shared documentation.
