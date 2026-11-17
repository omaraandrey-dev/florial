# Редактура услуги «Рулонна трева» — 2026-11-17

## Scope

- Sanity Production document: `ea332108-42e7-444f-9632-08111c6fda90`.
- Existing slug/URL preserved: `rulonna-treva` / `/services/rulonna-treva`.
- Category, active status, service layout, sort order, document ID and hero asset preserved.
- Source article reviewed: https://www.drop.od.ua/bg/grass.
- Pre-write backup: `docs/backups/sanity/2026-11-17-rulonna-treva-before-editorial-refresh.json` (source revision `iNPCLSoXm0d2UNhS8TvO0J`).
- Additional backup before post-publication marker cleanup: `docs/backups/sanity/2026-11-17-rulonna-treva-before-marker-cleanup.json` (source revision `iNPCLSoXm0d2UNhS8U8xz7`).

## Published content

- Rewritten Bulgarian Portable Text article and complete Russian/English Markdown translations.
- H1 uses `hero.title`: «Полагане на рулонен тревен чим». The current service schema has no separate H1 field; no unsupported field was added.
- Localized SEO title, description, keywords and `noIndex=false` for BG/RU/EN.
- Internal links to automatic irrigation, irrigation equipment, trees/shrubs, flowers/roses and landscaping.
- Three related published resources: two relevant turf articles and the existing turf-replacement service.
- Localized lead form labels, placeholders, submit/success copy; technical field names remain `name`, `phone`, `email`, `location`, `details`. Existing `/api/service-leads` integration is unchanged.
- Existing gallery assets retained and visually inspected through Cloudflare Browser Rendering. Two original content-block images show finished lawns and are assigned to `lawn`; the bare-ground/tree image is assigned to `trenches`. Gallery images are split by visible content: rolls/wheelbarrow/stacked rolls to `pipeline`, laying/edge/final lawn to `lawn`. Hero image is excluded from the inline gallery.
- ALT BG/RU/EN populated for the service hero, gallery images and content-block images.

## Runtime changes

- `src/pages/ServicePage.tsx`: map six existing gallery asset keys to the `pipeline` and `lawn` inline groups for `rulonna-treva`; support localized H2 aliases and Portable Text gallery markers; suppress the top legacy gallery and lower legacy image-text blocks for this service.
- `tests/service-rulonna-treva-inline-gallery.test.mjs`: regression coverage for asset mapping and placement.
- `docs/SERVICE_CONTENT_PLAYBOOK.md`: document the service-specific inline-gallery convention.

## Safety and limits

- No Sanity schema, API, D1, Resend, Cloudflare settings/secrets, Header, navigation or Footer changes.
- No price, turnaround, guarantee, certification or supplier claim was added.
- The requested Humanizer connector was not available among connected tools in this session; wording was edited directly for natural BG/RU/EN rather than claiming an external Humanizer pass.
- Runtime PR #376 merged at `c5f4446e48d6f2d554684d198a583313e7e744b6`; photo-group correction PR #377 merged at `684effd6dc9819e21bddd1a5ce49f159c0ccfc7a`. Production deployment `341ad1f8-6ce4-4c71-8271-8922415ee2ae` completed successfully on the final main commit. Sanity document published revision: `iNPCLSoXm0d2UNhS8U8xz7`.
- The original and newly uploaded photo assets were visually inspected using Cloudflare Browser Rendering. Two existing content-block images show completed lawns, one shows bare-ground preparation; gallery photos are grouped into delivery and laying/result sections. ALT text describes visible content in BG/RU/EN.

## Production verification

- Cloudflare Browser Rendering confirmed BG/RU/EN routes return HTTP 200 with localized title, meta description, H1, canonical and `robots=index, follow`.
- Each locale renders 15 image elements; EN check confirmed all 15 have ALT. BG and RU images/ALT are populated in the published Sanity document.
- Localized lead form fields and submit labels are present; related content and contextual internal links are rendered.
- No real lead was submitted; API delivery and Resend notification were not exercised in this task. PageSpeed/Lighthouse and formal mobile overflow checks were not run.
- Existing cross-language hreflang projection limitation remains tracked in `docs/AI/OPEN_QUESTIONS.md`.
