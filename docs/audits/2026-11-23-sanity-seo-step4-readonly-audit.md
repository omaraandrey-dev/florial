# Florial — SEO Step 4: Sanity content and SEO fields (read-only checkpoint)

**Date:** 23.11.2026  
**Repository baseline:** `omaraandrey-dev/florial`, `main` at `6c34d4797dac2a15ce2b2e291af5711fb86e0b5f`  
**Sanity:** project `bxvcy0qs`; published perspective; datasets `plants` and `production`  
**Search Console:** `sc-domain:florial-bg.com`; period 25.10.2026–19.11.2026  
**Scope:** read-only revalidation of the SEO Step 4 handoff; no Sanity writes, code changes, Google setting changes, Browser session or Production changes.

## 1. Executive summary

The published catalogue is broadly complete for core descriptions, localized SEO fields and plant-category images. The new read-only pass found:

1. Thirteen plant product BG meta descriptions exceed the 160-character editorial guideline; six RU and seven EN versions among those same records also exceed 160 characters.
2. Two plant categories exceed 160 characters in BG; the broadleaf category also exceeds 160 in RU and EN.
3. Two plant products share identical RU and EN meta titles (garden carnation / white garden carnation). Their BG meta titles differ.
4. Three plant main images have empty ALT values in all three locales. The frontend data projection substitutes the localized product name, so this does not produce an empty alt attribute, but the fallback is less descriptive than the approved image-SEO convention.
5. Two equipment products and one equipment category have no main image asset. These are missing-image records, not missing ALT values.
6. All 12 irrigation kits have full BG/RU/EN descriptions. The 10 × 5 m kit uses a shorter block structure, but the published copy covers its intended area, controller/valve compatibility condition, water requirements, included diagrams and exclusions.
7. The Sanity service record `dostavka-poliv` has no full description fields, but its public route is rendered by the independent localized `IrrigationSupportPage` component, which supplies its own body copy and SEO fallback metadata. This is not a missing-page-content defect and does not justify editing the Sanity service record.
8. Previously published partial SEO fixes remain present: the two Irritec elbow titles are distinct in BG/RU/EN, the Rotor Sprinklers category title is updated, and the Nipel-mufa category image ALT is populated in BG/RU/EN.

The 160-character threshold is an editorial review guideline, not a Google limit or ranking penalty. No text was rewritten and no Sanity documents were changed.

## 2. Published Sanity checks

### 2.1 Plant product descriptions and images

Live published read-only counts in dataset `plants`:

- Products: 60.
- Full descriptions: BG 60/60, RU 60/60, EN 60/60.
- Main images: 60/60.
- Three main-image ALT objects have empty BG/RU/EN values; the frontend projection in `src/App.tsx` uses localized product name as fallback.
- Plant categories: 17/17 have an image and localized BG/RU/EN ALT values.

The three records with empty localized main-image ALT values are:

| Sanity ID | Slug | Name |
|---|---|---|
| `163a6616-5431-49f9-8011-07b115d7a406` | `evropeyska-vetriloobrazna-palma` | Европейска ветрилообразна палма |
| `5c670c5a-9e15-4df4-a6a4-efe3590d4c73` | `hrizantema` | Хризантема |
| `d6460a04-4731-45a9-9576-1fc7d589af2f` | `maslina-ob` | Маслина |

**Frontend evidence:** `src/App.tsx` projects `imageAlt`, `imageAltRu` and `imageAltEn` with localized product-name fallbacks. `src/pages/ProductPage.tsx` uses the resulting image alt value. This is a non-empty but generic fallback, not the richer location-specific image text.

### 2.2 Plant product meta descriptions over 160 characters

The following 13 published BG values exceed the editorial guideline. The table records BG/RU/EN character counts as returned by the current published Sanity values.

| Sanity ID | Slug | BG | RU | EN |
|---|---|---:|---:|---:|
| `163a6616-5431-49f9-8011-07b115d7a406` | `evropeyska-vetriloobrazna-palma` | 167 | 152 | 134 |
| `923e6c6f-a3a2-4182-bf89-7461cd594f99` | `zerium-oleandarat` | 163 | 148 | 161 |
| `a5f65135-51e1-4597-aee2-ae3a206932e5` | `lavrovishnya` | 165 | 154 | 157 |
| `ac827be4-bf57-46f6-b15c-ca412a17b2d4` | `karamfil-byal` | 164 | 126 | 137 |
| `b4f7638d-8c5a-469c-8ed1-af6eadae2243` | `maslina-bonsay-4` | 161 | 153 | 158 |
| `citrus-buddha` | `rakat-na-buda` | 166 | 184 | 185 |
| `citrus-lemon` | `citrus-limon` | 164 | 179 | 172 |
| `citrus-lime` | `citrus-aurantiifolia` | 166 | 174 | 182 |
| `olive-specimen` | `edrorazmerna-maslina-soliter` | 192 | 181 | 179 |
| `palm-banana` | `musa-banana` | 170 | 171 | 168 |
| `plant-b0e4396c-49b8-4a10-a608-ff248b95cc46` | `smarch-ela` | 163 | 136 | 141 |
| `shrub-cypress` | `kiparis-cupressus` | 182 | 150 | 156 |
| `tree-laurel` | `laurus-nobilis` | 169 | 179 | 172 |

Localization observations for later editorial review (not changed):
- `maslina-bonsay-4`: the RU meta description contains the Bulgarian place name `Слънчев бряг` rather than the Russian form.
- `smarch-ela`: the RU meta description contains the misspelling `Несебыре`.
- `zerium-oleandarat`: the EN meta description uses `Nesebar`; the site's other English copy generally uses `Nessebar`.
- Several longer descriptions are over 160 characters in all three locales; the counts above identify them without treating length alone as an error.

### 2.3 Plant category meta descriptions over 160 characters

| Sanity ID | Slug | BG | RU | EN |
|---|---|---:|---:|---:|
| `plants-broadleaf` | `shirokolistni-darveta` | 175 | 166 | 190 |
| `plants-solitaires` | `soliteri-edrorazmerni` | 162 | 155 | 157 |

All 17 plant categories have images and localized ALT values. No category image-ALT gap was found in the published read-back.

### 2.4 Duplicate localized plant Meta Titles

The current published plant dataset contains one duplicate pair in each of RU and EN:

- Product `karamfil`, ID `673b63a2-6bd7-43ce-9c78-1d228eec88de`.
- Product `karamfil-byal`, ID `ac827be4-bf57-46f6-b15c-ca412a17b2d4`.

Identical RU value:
`Купить садовую гвоздику в Несебре | Флориал`

Identical EN value:
`Buy Garden Carnation in Nessebar | Florial`

The Bulgarian meta titles differ. No duplicate plant-category meta titles were found in BG/RU/EN. The two Irritec Connecto equipment elbow titles previously identified as duplicates have already been separated and published; current read-back confirms distinct female-thread and male-thread values in all three locales.

### 2.5 Irrigation kits — full localized descriptions

Published read-back of the 12 kit IDs listed in the comprehensive audit confirms:

- BG root `description`: 12/12 populated.
- RU `translations.ru.formattedDescription`: 12/12 populated.
- EN `translations.en.formattedDescription`: 12/12 populated.
- RU/EN short descriptions: 12/12 populated.

Eleven kits have ten content blocks in each locale. The 10 × 5 m kit (`69d2ba37-c628-4378-b1dc-a98d856e30c6`) has nine BG blocks and four RU/EN blocks. Read-back of that record confirms the localized descriptions still cover the area range, ESP-BAT-BT1 controller, 100-HV-9V compatibility limited to production from 01.01.2026, required water supply, approximate flow/pressure, layout diagrams and excluded PE pipe/cable. This is a shorter presentation, not an identified missing-description defect.

### 2.6 Delivery service record — Sanity versus frontend

Sanity service `dostavka-poliv`, ID `9e4efe1b-e434-4cfe-a646-1cc9d9c93bce`, has no full `description` body in BG/RU/EN; localized short descriptions and SEO fields exist.

However, `src/App.tsx` routes `/services/dostavka-poliv` and `serviceLayout === 'delivery'` to `IrrigationSupportPage`. That component contains full BG/RU/EN localized page copy and applies its own localized title and intro as SEO fallbacks. Therefore, the missing Sanity body is not an omission from the rendered page and must not trigger a Sanity content write in this SEO step.

### 2.7 Equipment images and previous partial remediation

Current published read-back confirms the following records have no main image asset:

- Product `fitting-3112-1620`, ID `0fd0565a-e2d8-4aeb-bc68-92e3b26020a5`.
- Product `fitting-3112-16202`, ID `582265a9-944e-4928-aee2-577cbe34e774`.
- Category `troynik-90-plastmasov-vatreshna-rezba`, ID `90ab6b0d-7b56-4cf2-946e-129c60ab204f`.

The Nipel-mufa category (`ed408215-944e-45df-a967-55f2c9f1d7bd`) now has BG/RU/EN ALT values, as recorded in the earlier partial-remediation audit. The Rotor Sprinklers category title and both Irritec elbow titles also match the previously published fixes.

## 3. Google Search Console — homepage and Rotor category

Period: 25.10.2026–19.11.2026, Web search.

### Homepage

Canonical BG homepage `https://florial-bg.com/`:
- 161 impressions;
- 16 clicks;
- CTR 9.94%;
- average position 3.0.

The RU and EN query-string variants are reported separately by GSC (RU: 1 impression / 0 clicks; EN: 18 impressions / 1 click). The homepage query-dimension response exposed only 27 impressions across 21 query rows against 161 page-level impressions. The visible query sample is incomplete and does not support a confident rewrite of the homepage snippet. The current BG metadata is supplied by `src/pages/HomePage.tsx` and is aligned with the garden-centre / plants-first positioning.

### Rotor Sprinklers category

Canonical BG URL `https://florial-bg.com/category/rotorni-razprskvachi`:
- 36 impressions;
- 0 clicks;
- average CTR 0%;
- average position 34.3.

Visible query rows:
- `роторни разпръсквачи`: 22 impressions, position 34.7;
- `разпръсквачи рейнбърд`: 5 impressions, position 37;
- `разпръсквачи rain bird`: 4 impressions, position 33.8;
- `rain bird`: 3 impressions, position 45;
- `rain bird разпръсквачи`: 2 impressions, position 7.5.

The page is generally ranking too low for CTR to diagnose a snippet defect. The query sample is small; no Meta Title/Description rewrite is recommended from this evidence alone. The current category title was already updated and read back from Sanity.

## 4. Frontend evidence checked in GitHub main

- `src/App.tsx`: plant product GROQ projection uses localized product-name fallbacks for main-image ALT when Sanity ALT is empty.
- `src/pages/ProductPage.tsx`: product detail images use the resolved localized ALT; generated product image text is used where the image ALT value is not supplied.
- `src/lib/productImageSeo.ts`: generated product image title/ALT conventions include localized sale/buy wording and regional place names.
- `src/lib/categoryImageSeo.ts`: category image ALT falls back to the localized category name when an explicit value is absent.
- `src/pages/HomePage.tsx`: homepage title/description are localized in the component and passed to `applyPageSeo`.
- `src/pages/IrrigationSupportPage.tsx`: delivery/support page has its own localized BG/RU/EN copy and SEO fallback title/description.

This is source-code review only. No Browser session or live rendered DOM check was performed in this checkpoint.

## 5. Findings and next actions

| Priority | Finding | Exact scope | Proposed next action |
|---|---|---|---|
| P2 | Duplicate RU/EN Meta Titles | `karamfil` and `karamfil-byal` IDs above | Prepare differentiated RU/EN titles; no write without separate approval |
| P2 | Long localized plant/category descriptions | 13 plant products + 2 plant categories listed above | Editorial review for concision, localization and search intent; do not truncate mechanically |
| P2 | Three generic plant main-image ALT fallbacks | Three IDs in §2.1 | Prepare descriptive BG/RU/EN ALT values if owner authorizes |
| P3 | Missing image assets | Two equipment products + one equipment category in §2.7 | Owner decision on whether suitable source images exist; ALT cannot fix absent assets |
| Monitor | Homepage / Rotor snippet performance | GSC metrics in §3 | Re-evaluate after a larger query sample; do not change snippets on current evidence |
| No action | Delivery service Sanity body absent | `dostavka-poliv` | Custom frontend page already supplies localized body and SEO fallbacks |

**Owner editorial constraint:** the separate plant-description editorial pilot was stopped by the owner. This audit does not resume that work, rewrite plant descriptions, or treat the prior pilot as an approved style standard. Any later Sanity content changes require a precise ID/field plan and separate approval under the repository guardrails.

## 6. Verification and change boundary

- GitHub main files and frontend source were read only.
- Sanity queries used the published perspective for `plants` and `production`.
- Google Search Console queries were read only.
- No Sanity drafts were created, patched, published or unpublished.
- No images were uploaded or replaced.
- No code, schema, Cloudflare settings/secrets, D1, Resend, DNS, Google settings or Production data were changed.
- No Browser connector or Production HTML inspection was performed.
- This is a documentation-only audit artifact. Shared roadmap, CHANGELOG, Technical Passport and OPEN_QUESTIONS updates are deferred to the coordinated documentation integration pass because existing documentation PRs remain open and touch shared files.

**Status:** SEO Step 4 read-only Sanity/GSC revalidation is substantially complete. Final closure requires the owner-approved handling of the editorial findings and the coordinated shared-document integration; no Sanity remediation has been performed.
