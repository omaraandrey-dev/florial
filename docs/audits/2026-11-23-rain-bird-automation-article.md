# Rain Bird irrigation automation article — publication audit

**Date:** 2026-11-23  
**Sanity project/dataset:** `bxvcy0qs` / `production`  
**Document ID:** `3b42c9bd-58a1-4c64-8c11-adf9c2bc77e8`  
**Original draft ID:** `drafts.3b42c9bd-58a1-4c64-8c11-adf9c2bc77e8`  
**Slug:** `avtomatika-za-polivane-rain-bird-kontroleri`  
**Intended public URL:** https://florial-bg.com/blog/avtomatika-za-polivane-rain-bird-kontroleri  
**Sanity status:** Published; public visual QA not independently completed.

## Scope and preservation

- Updated the owner's existing unpublished blog draft; no existing published blog article was modified.
- Preserved the supplied cover asset: `image-5631c483a9dabe0df0a093f34154f6ce631fa5b6-1200x896-jpg`.
- Preserved the document ID and used the deployed `blogPost` schema and existing `translations.bg / ru / en` fields.
- The source article had Russian text in the BG locale. It was rewritten as a complete Bulgarian article; full Russian and English versions were added.
- Filled localized title, short description, Portable Text body, cover ALT, SEO title and SEO description for BG/RU/EN.
- Set the Bulgarian root title, slug, publication status and publication date.
- No schema, frontend code, renderer, categories, products, database, Cloudflare configuration or infrastructure changes.

## Article structure and localized content

Each locale contains **50 Portable Text blocks**, including:
- fixed wired controllers and the distinction between ESP-TM2 and ESP-RC2;
- optional LNK2 Wi-Fi module on compatible LNK Ready ESP-TM2 versions;
- built-in Wi-Fi and weather-based seasonal adjustment on ESP-RC2;
- battery-powered ESP-9V and Bluetooth ESP-BAT-BT;
- local one-zone hose-end timers, including Rain Bird 1ZEHTMR;
- the difference between a local rain sensor and online weather-based adjustment;
- valve, solenoid, cable and installation compatibility;
- choosing station count and the limitations of station count as a substitute for hydraulic sizing;
- the Florial Irrigation Assistant, accurately described as preliminary layout/equipment guidance rather than a hydraulic calculator.

Every locale contains **4 existing category images and 4 internal category links**. The supplied cover image remains unchanged.

## Technical editorial corrections

The original draft treated all Wi-Fi automation as broadly interchangeable and described weather adjustment and sensor savings too generally. The final article distinguishes the product families and avoids implying that every Rain Bird fixed controller has built-in Wi-Fi.

- **ESP-TM2:** fixed-station controller family with 4/6/8/12-station variants. The article says Wi-Fi requires a compatible LNK Ready controller and separately purchased LNK2 module; it does not imply that every TM2 has Wi-Fi built in. LNK2 network requirement is 2.4 GHz.
- **ESP-RC2:** built-in Wi-Fi fixed controller, available in Florial's catalogue as indoor 4/6/8-station variants. The article describes remote app management and automatic seasonal adjustment using local weather information and forecast, with a stable 2.4 GHz Wi-Fi connection required.
- **ESP-9V:** conventional battery-operated controller with on-device programming and waterproof/IP68 housing; no Wi-Fi remote management claim is made.
- **ESP-BAT-BT:** battery-operated 1/2/4/6-station controller controlled locally through Bluetooth and the Rain Bird 2.0 app. Bluetooth is not described as remote access over the internet.
- **1ZEHTMR:** described as a one-zone hose-end timer for a tap, hose-end sprinkler or drip line, not as a multi-zone valve-box controller.
- **Rain sensor vs weather data:** the article separates local rainfall detection from online weather-based seasonal adjustment and does not suggest that a Wi-Fi controller always eliminates a physical rain sensor.
- **100-HV-9V compatibility:** Rain Bird's general ESP-BAT-BT product information lists 100-HV-9V as not compatible. The article therefore does not state universal compatibility. It separately attributes a narrow compatibility case to Florial's field experience: production versions from 01.01.2026 with the correct bonnet revision and a suitable 9 V DC latching solenoid. This is owner-confirmed field experience, not a new manufacturer approval; exact valve revision and coil must be checked before purchase.

## Manufacturer sources reviewed

- Rain Bird ESP-TM2 series: https://www.rainbird.com/products/esp-tm2-series-controllers
- Rain Bird LNK2 Wi-Fi module technical specification (2.4 GHz and compatible controller list): https://www.rainbird.com/sites/default/files/media/documents/2023-11/d42005-lnk2_tech_spec.pdf
- Rain Bird ESP-RC2 product information: https://www.rainbird.com/products/rc2-smart-controller
- Rain Bird ESP-RC2 technical specification: https://www.rainbird.com/sites/default/files/media/documents/2023-02/d38949heo-intl-rc2-tech_spec.pdf
- Rain Bird app instructions for automatic seasonal adjustment: https://wifi.rainbird.com/articles/how-to-enable-automatic-rain-delay-in-rain-bird-2-0-app/
- Rain Bird ESP-9V series: https://www.rainbird.com/products/esp-9v-series
- Rain Bird ESP-BAT-BT specifications and valve compatibility: https://www.rainbird.com/products/esp-bat-bt
- Rain Bird 1ZEHTMR hose-end timer: https://www.rainbird.com/products/easy-program-hose-end-timer-international

## Category images and internal links

The following published Sanity category documents and image assets were checked before use:

| Category | Destination | Sanity category ID | Image asset |
|---|---|---|---|
| Controllers | /category/controllers | 587a2ee3-8152-4193-bff1-dfd3838f12c5 | image-96fb45bd932636c49078e5240b3d9326679f9e36-1254x1254-png |
| Autonomous controllers | /category/autonomous-controllers | 8f2f6fcf-3294-45ea-82ba-f3b56d13ff77 | image-668812ebac37ab1360a9fee657ab618b10b22031-1254x1254-png |
| Automation sensors | /category/senzori-za-avtomatizatsiya | category-controllers-sensors | image-84ef8ad065182751a8710a4cbc6816013aef594a-1254x1254-png |
| Valves | /category/klapani | 65742b44-11c2-43ae-9551-e91eb675dc93 | image-617cbabe98b2806578a9cb370ed3921afa5384d9-767x618-png |

The article uses standard Portable Text links following each category image. No category documents or assets were edited.

## Localization and SEO

- BG: Автоматика за поливане: как да изберем контролер Rain Bird
- RU: Автоматика для полива: как выбрать контроллер Rain Bird
- EN: Irrigation Automation: How to Choose a Rain Bird Controller
- Each locale has its own 50-block body, short description, cover ALT, SEO title and SEO description.
- Each locale has 4 category images and 4 internal category links.
- Root title is Bulgarian; no new schema fields were added.

## Humanizer

The installed Humanizer skill was read and applied to the supplied Russian draft and the localized article. The copy was rewritten to remove repetitive promotional framing and generic claims, vary sentence rhythm and state technical distinctions directly. No unsupported product specifications, prices, availability or guarantees were added.

## Backup and verification

- Full pre-write target-document snapshot: `docs/backups/sanity/2026-11-23-rain-bird-automation-article-before-edit.json`.
- Snapshot includes original draft metadata, cover reference and all 21 original BG Portable Text blocks.
- Backup file was read back from the task branch; original first block key `adcecda89c84` and cover asset reference were present.
- Sanity write used revision guard `f397c0fa-db8c-44e7-9da3-aca9d444bcba`.
- Draft read-back before publication confirmed 50 blocks, 4 images and 4 link annotations in each locale; link destinations matched the four checked published categories.
- Sanity validator reported valid; complete=false because custom validation callbacks, including custom slug isUnique callbacks, were not executed. Built-in slug uniqueness validation ran, and a separate raw-perspective query found no matching slug before writing.
- Published Sanity read-back confirms `isPublished=true`, the published document ID, slug, unchanged cover asset, and 50 blocks / 4 images / 4 links in each of BG, RU and EN.
- Public URL fetch was attempted but the web fetcher returned an access error. Public rendering, image loading, language switching and click-through are therefore not independently confirmed.

## Files and services

- Sanity Production: one existing blogPost draft updated and published.
- GitHub task branch: `content/rain-bird-automation-article`.
- Unique backup and audit files are added in this branch. Shared documentation files are intentionally not edited because other documentation PRs are open.
- No Sanity schema, Studio source, frontend code, category, product, Cloudflare Pages/Functions/D1, Resend, DNS or Production configuration changes.
- No application build or Production deployment was required for this content-only publication.
