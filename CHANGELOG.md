## 2026-10-30 — Поддержка вложенных категорий любой глубины

- В src/App.tsx видимость категорий теперь вычисляется с подъёмом от назначенных товаров по всей цепочке родителей; категории с товарами в потомках не исчезают из каталога.
- В src/pages/CategoryPage.tsx вложенные категории выводятся рекурсивно; на странице категории в первую очередь показываются её собственные дочерние ветки, а для конечной категории сохраняются ссылки на соседние категории.
- Изменения ограничены отображением дерева каталога; документы Sanity и общие элементы сайта не изменялись.

## 2026-10-29 — Restore additional image-and-text blocks on service pages
- Render regular Sanity `contentBlocks` with an image, title and/or text at the bottom of the service page, after the existing call-to-action section.
- Respect each block's image position and Bulgarian/Russian/English title and text fields; retain localized image alt text and responsive layout.
- Keep special `__gallery:...` marker blocks in their existing article sections so the irrigation installation photo groups are not duplicated or moved.
- No Sanity documents, site-wide header, menu, footer, or unrelated pages were changed.

## 2026-10-29 — Related product recommendations on product pages
- Extended the existing Sanity product query to fetch each product's `relatedProducts` references and the fields required for recommendation cards.
- Added a localized “Често купувани заедно” / “С этим товаром покупают” / “Frequently bought together” card section to the product detail page only, with product image, name, SKU, VAT-inclusive price, product link, and add-to-cart action.
- Kept the existing “Съвместими продукти” block separate. No header, navigation, footer, or other page layouts were changed.
- Automatically populated `relatedProducts` references for existing irrigation products in Sanity using category/subcategory and product-name heuristics as an editable first pass; review and refine manually.

## 2026-10-29 — Automatic irrigation installation service gallery and localized SEO
- Imported 14 original photos from the Bulgarian DROP installation page into the existing Sanity production dataset, preserving source attribution and adding Bulgarian, Russian and English alt text.
- Grouped the photos as intro, trench excavation, pipework, sprinkler/drip equipment, and automation/controller sections. The service renderer places each photo group within the corresponding part of the article instead of appending unrelated images at the end.
- Kept the existing service copy intact; improved BG/RU/EN meta titles, descriptions and keywords, with indexability enabled for all three translated versions.
- Updated the service query to fetch localized image alt text and gallery metadata, and ensured translated section titles render as semantic H2 headings.
- No header, navigation structure, footer, catalog, orders or unrelated Sanity documents were changed.

## 2026-10-29 — Consistent service ordering and delivery-page breadcrumbs
- Added one shared service-ordering rule for the homepage, the All Services page, and the navigation menu: landscape design, planting, automatic irrigation, rolled turf, site landscaping, drip irrigation, irrigation repair and maintenance, automatic irrigation installation in Nessebar, then equipment delivery and engineer consultation.
- Added the custom delivery/engineer page as the ninth service entry in all three places. Future service records are placed after the nine prioritized services and use a stable alphabetical fallback order.
- Added visible localized breadcrumbs to the delivery/engineer page: Home → All services → current service.
- No Sanity or Supabase documents were changed.

## 2026-10-29 — Localize navigation labels
- Use the existing `localize()` helper for service names, irrigation equipment categories, and plant categories in the mobile navigation menu.
- Preserve Bulgarian source names as a fallback when a translation is missing; links, menu structure, styling, and open/close behavior remain unchanged.
- No Sanity or Supabase data was modified.

## 2026-10-29 — Normalize service slugs for Sanity Studio
- Standardized the service schema on Sanity's native `slug` type to match the active Studio schema and most existing service documents.
- Converted the two published service slugs that were plain strings into Sanity slug objects, preserving their exact URL values. Full document snapshots were saved before editing; comparisons confirmed no other fields changed.
- Verified the latest hosted Studio build and deployment workflow succeeded on commit `4e3980e2bcbda7923733024e2244eb6630b4c6e1`.
- The Studio schema API still omits six service fields present in source, so the unknown-field warnings require further investigation; deployment success is not treated as proof that the schema snapshot synchronized.

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

## 2026-10-29 — Make phone destinations explicit in analytics reports
- Updated the analytics SQL report to label phone-click counts with the exact destination number (`+359 876 777 902` or `+359 885 834 860`) and the WhatsApp number, grouped by day and interface language.
- Added a compact report comparing the two phone numbers over the last 30 days. The number is derived from the existing event type, so no database schema change or additional visitor data is required.

## 2026-10-29 — Enable first-party analytics storage
- Applied the `site_events` schema to the production Supabase project `florial-shop` using the reviewed migration: event types and languages are constrained, page paths are limited to 200 characters, and indexes support time/event reports.
- Enabled RLS and confirmed that `anon` and `authenticated` cannot read or write analytics events; `service_role` can insert events for the server-side `/api/track` function.
- Confirmed the Cloudflare Pages production configuration has `SUPABASE_URL` pointing to the intended Supabase project and that `SUPABASE_SERVICE_ROLE_KEY` is configured. Secret values were not displayed.
- Existing first-party client tracking, `/api/track`, SQL reporting query, and unpublished BG/RU/EN privacy draft remain in place. A live POST from the public site and rate-limit configuration are still pending verification.
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
