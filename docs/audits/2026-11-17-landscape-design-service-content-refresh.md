# Sanity service content refresh — landscape design

Date: 2026-11-17
Project: `bxvcy0qs`
Dataset: `production`
Document: `c7d2c120-6024-4876-b240-ff6585df91e4`
Slug: `landshaften-dizain`
Public route: `/services/landshaften-dizain`

## Owner approval and safety

The owner explicitly approved the exact field-level plan in the conversation on 2026-11-17. The original published document was backed up before the first Sanity write. Backup file:
`docs/backups/sanity/service-landshaften-dizain-2026-11-17.json`

Original published revision: `qvVg1luYRxJZnxaWi0maKI`
Published revision after update: `0K3ioEX3JkmkckZpKbBLrY`

A first patch attempt was rejected by deployed-schema validation (unknown fields in localized hero/link annotations/content-block translations); Sanity reported 0 successful edits. The payload was corrected to the deployed schema and the subsequent draft patch succeeded. The draft was read back and validated before publication. No schema changes were made.

## Published content changes

- Rewrote Bulgarian `description` as 69 Portable Text blocks with 17 H2/H3 headings, bullet lists, strong and underline marks, and four safe internal links.
- Rewrote Russian and English descriptions as full independent localized Markdown strings (8,739 and 9,020 characters respectively), with bold emphasis, underlined phrases and internal links.
- Updated BG/RU/EN names, short descriptions, hero title/subtitle and SEO title/description.
- Kept `noIndex=false` for all three locales.
- Added the current project tariff: up to 2 dka €250; up to 4 dka €450; up to 6 dka €600; up to 10 dka €750; each additional decare €50; site visit €50; two additional viewpoint sketches €60. VAT/DDS is not mentioned.
- Preserved the original slug, active state, lead form (5 fields), existing image references, and the separate newly published blog article.

## Images

The service gallery now contains 13 images: the original five, three original DROP Wix archive photos uploaded into the Sanity Production dataset, and five existing image assets reused from the new landscape-project blog post. The blog article itself was not modified.

Successful Wix archive uploads:
- `image-5f9f60c45ce15e45c0ae30d5b8eee21a0c84ce34-6065x5791-jpg` — landscape design archive photo (2019).
- `image-cbc1d5bd2e90811abe635201534946d5cce9160a-1600x1200-jpg` — green hedge.
- `image-f4bba9e70a3ef0691d08c5a22542538ea755c837-1601x1118-jpg` — landscape project archive photo (2021).

One additional Wix image upload was rejected by the source fetch and was not retried with the same request key. No failed upload is referenced by the service.

Reused blog image assets: master plan, planting plan/dendroplan, plant schedule, 3D zone visualisations, irrigation layout. These references point to the already-published blog assets; no duplicate uploads were made.

All 13 gallery images have BG/RU/EN alt text.

## Related content

The related-content cards now include:
- Blog post `podroben-landshaften-proekt-gradina` (published 2026-11-17).
- Existing blog post `landshaften-dizain-proekt-zasazhdenie`.
- Services `zasazhdane-na-rasteniya`, `ozelyavane`, `rulonna-treva`, and `proektirane-sistemi-avtomatichno-napoyavane-nesebar`.

A read-only dereference confirmed all six related documents exist and the two blog posts are published; all four related services are active.

## Verification

Verified in live Sanity Production after publication:
- Document ID and slug unchanged; `isActive=true`.
- New revision `kG84M8L0NjpttWhMhrC8yJ`.
- 69 BG Portable Text blocks; 8,739 RU and 9,020 EN characters.
- Strong and underline marks and internal links present in BG Portable Text.
- Gallery count 13; all gallery items have BG/RU/EN alt values.
- All seven agreed price values are present across all three languages.
- No explicit VAT/DDS wording.
- `noIndex=false` for BG/RU/EN.
- Lead form still has five fields.
- Related references dereference successfully.

Public website rendering and live browser visual QA are **not confirmed**: direct public URL checks through the available web reader returned “URL is not accessible via this tool”. This is not evidence of a website outage. No application code or Cloudflare deployment was changed in this task.

## Scope exclusions

- The new blog post `52238416-ea46-4ba0-aa25-31c8b46ed6b8` was not edited.
- No Sanity schema, GitHub runtime code, Cloudflare settings, D1, Resend, Header, navigation or Footer changes.
