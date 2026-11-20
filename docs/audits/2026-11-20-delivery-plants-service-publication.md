# 2026-11-20 — Delivery of large specimen plants: publication closeout

## Published Sanity document

- Project: `bxvcy0qs`
- Dataset: `production`
- Published document ID: `df7893e8-902e-4265-921c-3cb0fd270cc8`
- Type: `service`
- Public URL: https://florial-bg.com/services/dostavka-na-edrorazmerni-rasteniya
- Slug: `dostavka-na-edrorazmerni-rasteniya`
- Final category: `planting` (existing Gardener direction: BG `Градинар`, RU `Садовник`, EN `Gardener`)
- Layout: `standard`; sort order: `85`; `isActive=null` is compatible with the current frontend GROQ condition `isActive != false`.
- Publication completed with revision guard from draft revision `mglMMQKM2LB1EsvjWVc7JD`; Sanity returned published ID above. Published read-back returned revision `lnbesCk3yRtXTdkFzzUEJi`.

## Content and SEO delivered

- Reworked the source into complete localized BG/RU/EN commercial service content.
- Localized name, hero H1/subtitle, meta title, meta description, keywords and indexability (`noIndex=false`) are populated for all three locales.
- Localized CTA and the five-field enquiry form (name, phone, email, location, details) are present.
- Preserved both original image assets and added localized ALT text. The second image is embedded in the crane unloading section using the existing gallery marker mechanism.
- Added an internal link to the existing planting service: `/services/zasazhdane-na-rasteniya`.
- Delivery and planting remain clearly distinguished. Crane reach and final positioning are conditional on site access and operating conditions; delivery price/date are confirmed individually.
- No schema or frontend code change was needed.

## Category correction

- The Sanity schema has no dedicated `gardener` category. The existing `planting` value is the supported mapping to Gardener in all three languages.
- `landscaping` maps to Landscape Architect and was therefore not selected.
- The category correction was saved to the draft before publication and confirmed by Sanity read-back.

## Backups

- Original pre-editorial snapshot: `docs/backups/sanity/2026-11-20-service-df7893e8-before-delivery-plants-editorial.json` (created and verified before the editorial write).
- Exact pre-publication snapshot, including final category and localized content: `docs/backups/sanity/2026-11-20-service-df7893e8-before-publish.json` (fetched back from GitHub and checked for document ID, revision and category before publishing).

## Verification

- Sanity published-perspective read-back confirmed the published document, category, slug, image references, localized hero and SEO fields.
- Public production page returned HTTP 200 in a live fetch:
  - BG: https://florial-bg.com/services/dostavka-na-edrorazmerni-rasteniya
  - RU: https://florial-bg.com/services/dostavka-na-edrorazmerni-rasteniya?lang=ru
  - EN: https://florial-bg.com/services/dostavka-na-edrorazmerni-rasteniya?lang=en
- The three fetched pages exposed the expected localized title/description, `robots=index, follow`, and the correct localized article text. The BG fetch confirmed both images in the intended positions and the internal planting-service link.
- Sanity validator before publication returned `valid`, but `complete=false` because custom validation callbacks were not executed. Do not interpret it as a full custom-validator pass.
- The enquiry form was rendered in the fetched page, but no Production form submission was made to avoid creating a live lead. End-to-end form submission remains untested.
- The connected Humanizer tool was unavailable; Bulgarian copy was edited manually. No Humanizer use is claimed.

## Scope

- Changed only the target Sanity service document and documentation/backups in GitHub.
- No existing published service, blog post or portfolio document was modified.
- No Sanity schema, website runtime, Cloudflare Pages/Functions configuration, D1, Resend, secrets or Production deployment was changed.
