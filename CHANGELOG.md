## Unreleased — First-party analytics
- Added anonymous site event tracking endpoint and SQL migration draft. Migration is not applied to the database.

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
