# Lawn irrigation article — publication audit

**Date:** 2026-11-23  
**Sanity project/dataset:** bxvcy0qs / production  
**Document:** 59ceef70-59e0-4b73-a99d-8a6a37f80ef8  
**Draft before editing:** drafts.59ceef70-59e0-4b73-a99d-8a6a37f80ef8  
**URL:** https://florial-bg.com/blog/polivane-na-treva-razprskvachi-dyuzhi  
**Status:** Published in Sanity Production; public visual QA not independently completed.

## Scope and preservation

- Updated the owner's existing draft, not a new document.
- Preserved the supplied cover image asset: image-bbcb5e72ebd05feb223eacfce5d8ebeef735a9e7-1200x896-jpg.
- Preserved the document ID and used the existing `blogPost` schema and localized `translations.bg / ru / en` objects.
- The original Russian-language copy had been entered in the BG locale. It was rewritten as Bulgarian editorial content; the Russian and English versions were then prepared as full localized translations.
- Set Bulgarian root title, BG/RU/EN titles, short descriptions, Portable Text bodies, cover ALT, SEO title and SEO description, plus the slug and publication status.
- Slug: `polivane-na-treva-razprskvachi-dyuzhi`.
- `isPublished=true`; publishedAt set to 2026-11-23.
- No schema, frontend code, renderer, category, product, database or infrastructure changes.

## Article structure

Each locale contains 43 Portable Text blocks, including:
- static spray sprinklers and fan-shaped Spray nozzles;
- rotary nozzles, including Rain Bird R-VAN and Hunter MP Rotator as technical product-family examples;
- rotor sprinklers for larger open areas;
- nozzle radius and arc selection;
- head-to-head spacing and square/triangular layouts;
- matched precipitation and why Spray and rotary nozzles should not be mixed casually in one zone;
- dynamic pressure, available flow, pressure losses and zone sizing;
- low-head drainage on sloping sites and the limits of built-in check valves;
- troubleshooting dry patches and puddles;
- commissioning checks and irrigation schedule adjustments;
- Florial catalogue and Irrigation Assistant guidance.

The article explicitly distinguishes geometric layout assistance from hydraulic sizing. It does not claim that the online Irrigation Assistant measures the water source or hydraulically sizes the system.

## Technical corrections and source basis

The original draft contained several claims that needed qualification. The final copy:
- removed the unsupported general claim that R-VAN requires less pressure than Hunter MP;
- states the manufacturer-published R-VAN operating range of 2.1–3.8 bar and recommended 3.1 bar;
- states 2.8 bar as the usual optimal operating pressure for Hunter MP Rotator, while requiring the exact model's data to be checked;
- avoids saying that every rotary nozzle from different product families has a matched precipitation rate;
- explains head-to-head coverage without presenting a staggered layout as automatically cheaper or technically equivalent;
- describes check valves as a remedy for low-head drainage within the model's rated elevation limit, not as a guarantee against every puddle;
- explains that standing water can also result from excessive run time, compacted soil or poor drainage.

Manufacturer references reviewed:
- Rain Bird R-VAN product information and specifications: https://www.rainbird.com/products/r-van-rotary-nozzles
- Rain Bird R-VAN metric technical specification: https://www.rainbird.com/sites/default/files/media/documents/2021-06/r-van-productfamilytechspec-metric.pdf
- Rain Bird R-VAN installation guide, including spacing and maintenance: https://www.rainbird.com/sites/default/files/media/documents/2018-02/man_R-VAN-InstallationGuide_au.pdf
- Hunter MP Rotator design guide: https://www.hunterindustries.com/sites/default/files/2024-10/LIT-461-RevJ-DG-MPR-RU-web.pdf
- Hunter support information on low-head drainage and sprinkler check valves: https://www.hunterindustries.com/support/valves

Hunter MP Rotator is described as a technical comparison only. No matching Hunter MP product SKU was confirmed in the queried Florial catalogue; the article does not claim current Florial stock or availability for that family.

## Category images and internal links

Four existing published category image assets are reused in each locale. Each image is followed by a standard text link.

| Category | Destination | Published category ID | Image asset |
|---|---|---|---|
| Static sprinklers | /category/static-sprinklers | 2a2b54f2-7181-4e7d-848a-77199a9c6ada | image-a589cbb1db71a0c77cf6c7e3450921647e55c3dd-600x600-jpg |
| Spray nozzles | /category/spray-nozzles | 6534adc5-78f7-4276-bbdd-2843ef30420e | image-ed0288c49e7d490a5e32262df6abcc50a5fe580f-1327x1185-png |
| Rotary nozzles | /category/rotator-nozzles | 6690848d-a4a5-4386-b9ae-5f63604914b1 | image-a5812130c0bfcd4e72acef31f2a0658437754da9-1280x853-png |
| Rotor sprinklers | /category/rotorni-razprskvachi | 0732d410-0843-4d43-8fe4-c79913845b5b | image-7b5c39649eb3a49b9c5b9d01ac5adb63df571c7f-1254x1254-png |

All four category documents and their image references were read from Sanity Production before use. The category paths were verified against the published documents.

## Localization and SEO

- BG title: Поливане на тревата: как да изберем разпръсквачи и дюзи
- RU title: Полив газона: как выбрать дождеватели и форсунки
- EN title: Lawn Irrigation: How to Choose Sprinklers and Nozzles
- Each locale has its own short description, 43-block body, cover ALT, SEO title and SEO description.
- Each locale contains 4 category images and 4 internal category links.
- No new schema fields were added.

## Humanizer

The installed Humanizer skill was read and applied to the supplied draft and localized editorial copy. The text was revised for natural phrasing and varied sentence structure while preserving supported claims. Technical changes were limited to statements checked against the manufacturer sources above; no unsupported stock, performance or service guarantees were added.

## Backup and verification

- Full pre-write target-document snapshot: `docs/backups/sanity/2026-11-23-lawn-irrigation-article-before-edit.json`.
- Snapshot includes the original draft metadata, cover reference and all 19 original BG Portable Text blocks.
- Backup file was read back from the task branch; original first block key `2ac742b3899a` was present.
- Sanity write used the draft revision guard `13df0525-ffb9-4403-be2c-af39e7329bc6`.
- Draft read-back before publication confirmed 43 blocks, 4 images and 4 internal links in each locale.
- Sanity validator reported valid; complete=false because custom validation callbacks, including custom slug isUnique callbacks, were not executed. Built-in slug uniqueness validation ran; a separate raw-perspective query found no existing document with the chosen slug.
- Published Sanity read-back confirms `isPublished=true`, unchanged cover asset, slug `polivane-na-treva-razprskvachi-dyuzhi`, and 43 blocks / 4 images / 4 links in each of BG, RU and EN.
- Public URL fetch was attempted but the web fetcher returned an access error. Therefore public page rendering, image loading, language switching and click-through are not independently confirmed.

## Files and services

- Sanity Production: one existing blogPost draft updated and published.
- GitHub task branch: `content/lawn-irrigation-article`.
- Backup and audit are unique files; shared documentation files are not edited in this branch because other documentation PRs are open.
- No Sanity schema, Studio, application code, category, product, Cloudflare Pages/Functions/D1, Resend, DNS or Production configuration changes.
- No application deployment was required for this content-only publication.
