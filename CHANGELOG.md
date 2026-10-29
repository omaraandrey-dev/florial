## Unreleased — Consolidate Sanity Studio and schema deployment
- Confirmed the cause of the recurring schema mismatch: the existing workflow's `sanity deploy --no-prompt` opened an interactive hostname chooser and did not complete the hosted Studio upload, despite the job appearing successful.
- Corrected the Sanity CLI command to the project's installed v3 syntax (`sanity schema deploy`) for both `florial-admin` and `plants` workspaces.
- The workflow deploys the Studio app ID already configured in `studio/sanity.cli.ts`, so it does not depend on an invented hostname or create a new canonical app.
- After successful deployment, the workflow removes the obsolete duplicate catalog app and the separate plants app; the canonical app contains both catalog/services and plants workspaces.
- No Sanity Content Lake documents are changed by these workflow updates. The hosted Studio deployment is not complete until `SANITY_STUDIO_HOST` is set to the verified existing hostname and the workflow succeeds.

## Unreleased — First-party analytics
- Add `public.site_events` migration draft with strict event/language constraints, service-role-only table privileges, RLS enabled, and timestamp/event indexes.
- Add `POST /api/track` with an allowlist, request body size limit, and server-side Supabase credentials; the handler does not log event payloads or request metadata.
- Add a client tracking helper using `sendBeacon` with a `fetch(keepalive)` fallback; analytics failures do not interrupt site actions.
- Track distinct route/language page views and phone/WhatsApp clicks in the footer, contacts page, and irrigation delivery/support page.
- Add an SQL report and unpublished BG/RU/EN privacy notice draft.
- The migration has not been applied to Supabase. Cloudflare production variables, rate limiting, deployment, and live event insertion remain to be verified.
## Unreleased — Repair Sanity schema deployment for service translations
- Update the existing Studio workflow to deploy the `florial-admin` schema and the existing Florial Studio application after a successful build on changes to `studio/**`.
- Fail clearly when `SANITY_AUTH_TOKEN` is not configured; do not create a new Studio or workspace.
- No Sanity Content Lake documents are modified by this workflow change.

## Unreleased — About page sales sections
- Add localized plant-sales and irrigation-equipment sections after the automatic-irrigation service block on the About page.
- Link section headings and category images to the existing Sanity catalog roots for plants and irrigation equipment; use existing category images with localized geographic alt/title text.
- No Sanity or Supabase documents were modified.

## Unreleased
- Fix About page routing by rendering `/about` before other route and not-found checks.

## 2026-10-28 — Уточнение страницы «За нас» и категорий

- Расширена страница «За нас» на болгарском, русском и английском: добавлены полные тематические разделы о ландшафтном проектировании, посадке растений и озеленении, автоматическом поливе, рулонном газоне, этапах работы и географии услуг.
- Дублирующая верхнеуровневая категория «Електромагнитни клапани» исключена из отображаемых категорий каталога и меню. Документ Sanity и связанные товары не удаляются; подкатегории «Електромагнитни клапани 24 V» и «Електромагнитни клапани 9 V» остаются под «Клапани».
- Изменения не затрагивают данные Sanity и Supabase.


## Unreleased — Fix `/about` middleware routing
- Allow `/about` through the Cloudflare Pages middleware instead of returning the edge-generated 404 page.
- Add localized Bulgarian, Russian, and English SEO metadata and canonical/hreflang URLs for the About page.

## Unreleased — About page service navigation
- Link the five About page service headings and matching service images to their published `/services/<slug>` pages.
- Load service images from the existing Sanity service records and add localized image `alt`/`title` text with relevant Black Sea coast locations.
- No Sanity or Supabase data was modified.
