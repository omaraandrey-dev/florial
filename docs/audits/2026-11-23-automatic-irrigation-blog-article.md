# Automatic irrigation explainer article — publication audit

**Date:** 2026-11-23  
**Sanity project/dataset:** bxvcy0qs / production  
**Document:** 031de407-90ea-40c2-99d5-701be5d1ad02  
**URL:** https://florial-bg.com/blog/kak-raboti-avtomatichnata-polivna-sistema  
**Status:** Published in Sanity Production; public visual QA not independently completed.

## Scope and preservation

- Updated the owner's existing draft, not a new article.
- Preserved the supplied cover asset: image-cbbf28eaec7e3adb99da26b19765c4f9253761d7-1200x896-jpg.
- The supplied Russian copy was stored in the Bulgarian locale. Replaced that BG text with a complete Bulgarian editorial version while retaining the original technical subject matter.
- Set root title, BG translations.bg.title, slug, publication timestamp, tags, cover ALT, short description, body, SEO title and SEO description.
- Did not add or change any Sanity schema fields. No database migrations, frontend code or renderer changes.

## Article structure

The Bulgarian Portable Text body has 60 blocks, including:
- overview of the underground automatic irrigation system and operating sequence;
- static spray sprinklers and nozzles;
- rotary sprinklers and uniform head-to-head coverage;
- drip irrigation;
- pipes, fittings and distribution;
- solenoid valves and protective valve boxes;
- filtration and pressure regulation;
- water source and pump-selection considerations;
- controllers/programmers, Wi-Fi and autonomous options;
- irrigation zones, hydraulic design boundaries, installation and maintenance;
- equipment selection and Florial contact/help CTA.

No unsupported numerical hydraulic specifications or product compatibility claims were introduced. Pump sizing is explicitly described as dependent on actual source flow, pressure and system losses.

## Category imagery and links

Eight image blocks use existing category image assets. Each image is followed by a regular Portable Text text link, using the existing link annotation. No clickable-image behavior or custom field was introduced.

| Category | Destination | Published category ID |
|---|---|---|
| Static sprinklers | /category/static-sprinklers | 2a2b54f2-7181-4e7d-848a-77199a9c6ada |
| Rotary sprinklers | /category/rotorni-razprskvachi | 0732d410-0843-4d43-8fe4-c79913845b5b |
| Drip irrigation | /category/kapkovo-napoyavane | e577ef6b-d164-488f-b2f0-29ff7e8e7e9b |
| Pipes, fittings and accessories | /category/trabi-fitingi-aksesoari | 7b11a55e-19a1-4fe5-8a94-2df53864aaf0 |
| Valves | /category/klapani | 65742b44-11c2-43ae-9551-e91eb675dc93 |
| Valve boxes | /category/shahti | 6d09232c-4c54-4ba2-b463-1cb61d7345b8 |
| Filters and pressure regulators | /category/filtri-regulatori-nalyagane | 1893467b-642c-4b5f-b6bf-e9d3219c0a2d |
| Controllers | /category/controllers | 587a2ee3-8152-4193-bff1-dfd3838f12c5 |
| All irrigation equipment | /category/vsichko-za-polivane | 7f6eaa30-8085-4fae-be3c-1209a0c50fc6 |

All referenced category documents and image assets were read from Sanity Production. Category image links are text links in separate Portable Text blocks immediately following the images.

## SEO

- Slug: kak-raboti-avtomatichnata-polivna-sistema
- SEO title: Как работи автоматичната поливна система | Florial
- SEO description: Научете как работи автоматичното напояване: разпръсквачи, капково напояване, тръби, клапани, филтри и контролери. Практични насоки за избор, проектиране и поддръжка на поливна система за градината.
- Bulgarian cover ALT: Автоматична поливна система за тревни площи и градини

## Backup and verification

- Full pre-write draft snapshot: docs/backups/sanity/2026-11-23-automatic-irrigation-blog-before-publication.xml.
- Sanity write used revision guards. The content draft was read back before publication.
- Sanity validation: valid; complete=false because custom validation callbacks were not run by the available validator.
- Published read-back confirms: isPublished=true, slug as above, 60 Portable Text blocks, 8 image blocks, 10 link annotations and BG SEO fields.
- Public browser verification was attempted but not completed: Browser Use had insufficient project credits; the web fetcher could not access the URL. Therefore actual public rendering, image loading and click-through are not independently confirmed.
- No production deployment was required because only Sanity content was changed.
- Humanizer was requested but no Humanizer connector/skill was available in the connected plugin directory; no use is claimed.

## Files and services

- Sanity Production: one existing blogPost document updated and published.
- GitHub: backup and audit records.
- No changes to Studio schema, app code, categories, products, Cloudflare Pages/Functions/D1, Resend or DNS.


## 2026-11-23 — RU and EN translations added

The owner approved adding the missing Russian and English translations while preserving the published Bulgarian version.

- Before-write snapshot of the published BG-only document: `docs/backups/sanity/2026-11-23-automatic-irrigation-blog-before-ru-en-translations.xml`.
- Updated only `translations.ru` and `translations.en`; Bulgarian translation, root title, slug, publication timestamp, cover image, tags and publication status were not changed.
- Both RU and EN versions include localized title, short description, full Portable Text body, cover ALT, SEO title and SEO description.
- Each translation contains 60 Portable Text blocks, 8 image blocks and 10 internal link annotations.
- All image blocks reuse the existing published Sanity image asset references. Captions and ALT text are localized. Existing internal category URL paths were preserved.
- Sanity draft was read back and validated before publication. Validator status: valid; complete=false because custom validation callbacks, including custom slug uniqueness callbacks, were not executed.
- Published Sanity read-back confirms: `isPublished=true`; unchanged slug `kak-raboti-avtomatichnata-polivna-sistema`; 60 blocks in each of BG, RU and EN; 8 images and 10 linked paragraphs in each of RU and EN; localized RU/EN SEO titles are present.
- No changes to schema, Studio, frontend code, categories, products, Cloudflare, D1, Resend, DNS or deployment.

