# Редактура услуги «Рулонна трева» — 2026-11-17

## Scope

- Sanity Production document: `ea332108-42e7-444f-9632-08111c6fda90`.
- Existing slug/URL preserved: `rulonna-treva` / `/services/rulonna-treva`.
- Category, active status, service layout, sort order, document ID and hero asset preserved.
- Source article reviewed: https://www.drop.od.ua/bg/grass.
- Pre-write backup: `docs/backups/sanity/2026-11-17-rulonna-treva-before-editorial-refresh.json`.
- Backup source revision: `iNPCLSoXm0d2UNhS8TvO0J`.

## Content changes prepared in Sanity draft

- Rewritten Bulgarian Portable Text article and complete Russian/English Markdown translations.
- H1 uses `hero.title`: «Полагане на рулонен тревен чим». The current service schema has no separate H1 field; no unsupported field was added.
- Localized SEO title, description, keywords and `noIndex=false` for BG/RU/EN.
- Internal links to automatic irrigation, irrigation equipment, trees/shrubs, flowers/roses and landscaping.
- Three related published resources: two relevant turf articles and the existing turf-replacement service.
- Localized lead form labels, placeholders, submit/success copy; technical field names remain `name`, `phone`, `email`, `location`, `details`. Existing `/api/service-leads` integration is unchanged.
- Existing gallery assets retained. Three original content-block images are assigned to preparation, delivery and initial watering groups. Six process photos from the existing gallery are assigned to the inline lawn group. Hero image is excluded from the inline gallery.
- ALT BG/RU/EN populated for the service hero, gallery images and content-block images.

## Runtime changes

- `src/pages/ServicePage.tsx`: map six existing gallery asset keys to the `lawn` inline group for `rulonna-treva`; support `[[gallery:lawn]]` in Portable Text; suppress the top legacy gallery and lower legacy image-text blocks for this service.
- `tests/service-rulonna-treva-inline-gallery.test.mjs`: regression coverage for asset mapping and placement.
- `docs/SERVICE_CONTENT_PLAYBOOK.md`: document the service-specific inline-gallery convention.

## Safety and limits

- No Sanity schema, API, D1, Resend, Cloudflare settings/secrets, Header, navigation or Footer changes.
- No price, turnaround, guarantee, certification or supplier claim was added.
- The requested Humanizer connector was not available among connected tools in this session; wording was edited directly for natural BG/RU/EN rather than claiming an external Humanizer pass.
- Sanity edits are currently a draft only. Publication and Production rollout remain pending until runtime CI and localized page QA are completed.
- The five newly uploaded process photographs were grouped by their existing asset keys and the owner's description of their role; the image binaries were not independently viewable through the available inspection tools in this session. Their alt text is therefore kept at the level of the stated turf-installation process, not unsupported specific actions.
