## 2026-10-29 — Sanity Studio: устранение ложноположительного деплоя

- В run `40828538433` сборка прошла, но CLI v4 показал интерактивный выбор hostname; в CI это не приводило к фактической загрузке Studio, хотя workflow получил статус success.
- Исправлен `.github/workflows/deploy-sanity-studio.yml`: deployment задаёт существующий hostname явно (`--url florial-admin-bg`).
- Убраны шаги `undeploy`, которые завершались `Nothing to undeploy` и не удаляли записи из Sanity Manage. Очистка приложений считается завершённой только после проверки списка Studios.
- Целевой вариант — существующая Studio `Florial — Каталог и настройки` с двумя workspace: `florial-admin` (dataset `production`) и `plants` (dataset `plants`). Не создавать новые datasets и не удалять документы.
- Каталог, растения, услуги, переводы, медиа и заказы в этой операции не изменялись. Следующий шаг — проверить новый запуск и фактические активные схемы.

## Unreleased — Consolidate Sanity Studio and schema deployment
- Verified that the latest schema-only workflow run completed successfully but wrote legacy schema records (`_.schemas.florial-admin` and `_.schemas.plants`); it did not update the active Studio-deployed schema snapshots.
- Updated `.github/workflows/deploy-sanity-studio.yml` to build the existing multi-workspace Studio, deploy the canonical app identified by `studio/sanity.cli.ts` using the current Sanity CLI, and only after successful deployment undeploy the two verified duplicate hosted app IDs.
- The canonical app deployment must succeed before duplicate removal begins. If build/deploy fails, the workflow stops before removal, preserving the previous hosted apps as rollback options.
- Hosted Studio removal does not delete Sanity datasets or Content Lake documents. No catalog, service, plant, order, or customer documents are intentionally modified by this workflow.
- Final completion is conditional on the latest GitHub Actions result and a fresh Sanity API check confirming one remaining app and the expected active schema fields. Do not treat the workflow's success alone as proof of schema synchronization.

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
