## 2026-10-23 — Уравнивание путей workspace Sanity

- Следующий запуск CI выявил дополнительное требование CLI: у всех workspace должно быть одинаковое количество сегментов `basePath`. Пара `/` и `/plants` не проходила проверку.
- Заданы пути одинаковой глубины: `florial-admin` → `/admin`, `plants` → `/plants`.
- Это изменение конфигурации маршрутов Studio; документы и данные Sanity не затрагивались. После успешного schema deploy нужно проверить доступность обеих секций в существующей hosted Studio по соответствующим путям.

## 2026-10-23 — Исправление multi-workspace basePath

- GitHub Actions достиг команды schema deploy, но Sanity CLI остановился, потому что оба workspace в `studio/sanity.config.ts` не имели обязательного `basePath`.
- Добавлены явные пути: `florial-admin` остаётся корневым workspace (`/`), а `plants` использует `/plants`. Это сохраняет каталог и услуги в корневом маршруте существующего Studio и задаёт отдельный путь для растений.
- Исправлен npm script `schema:deploy`: команда Sanity CLI должна быть `schema deploy`, а не `schemas deploy`.
- Изменены только конфигурация и документация репозитория. Sanity Content Lake документы не изменялись; развёртывание схемы и Studio ожидает повторного запуска GitHub Actions и проверки deployed schema.

## 2026-10-23 — Исправление ошибки Sanity CLI в GitHub Actions

- Лог CI показал, что `npx sanity@latest` скачивает Sanity CLI 6.20.0, хотя Studio в `studio/package.json` использует Sanity v3 (`^3.99.0`). Ошибка `Cannot read properties of null (reading 'edgesOut')` возникла при запуске этой отдельно установленной latest-версии.
- Workflow переведён на Node.js 22. Для развёртывания схемы используется поддерживаемая Sanity команда `npx sanity@latest schema deploy` (единственное число), как указано в официальной документации; прежний вызов `schemas deploy` заменён. Развёртывание hosted Studio оставлено на CLI проекта (`npx sanity deploy --yes`).
- Исходник категории `category` уже содержит поле `helpBlock` и переводы EN/RU. Развёртывание ещё не подтверждено; после следующего запуска нужно проверить build, оба шага schema deploy и Studio deploy, затем перечитать deployed schema через Sanity API.
- Документы категорий пока не публиковать до подтверждения deployed schema и проверки draft payloads.

## 2026-10-23 — Необязательный локализуемый блок помощи в категориях полива

- В исходную схему `category` добавлено необязательное поле `helpBlock`: болгарские `title`, `text`, `buttonLabel` и вложенные переводы `en`/`ru`.
- Поле не имеет `initialValue` и не является обязательным, поэтому существующие документы остаются валидными без миграции.
- Изменение затрагивает только схему категорий оборудования в `studio/schemaTypes/index.ts`; схема категорий растений не менялась.
- Ни один документ Sanity не обновлялся, миграция не запускалась, production Studio не развёртывалась. Перед наполнением нужно согласовать точный список категорий и значения.

# Sanity schema changelog

## 2026-10-22 — Локализованные SEO-поля товаров и категорий

- В исходную схему добавлены редактируемые переводы и SEO-поля RU/EN для категорий оборудования, товаров оборудования и переводы SEO для категорий/растений.
- Для перевода товара предусмотрены имя, краткое/полное описание, SEO title/description/noIndex/keywords и переведённые технические характеристики.
- Для категорий предусмотрены переведённые названия, описания и SEO-поля.
- Изменения внесены только в исходник `studio/schemaTypes/index.ts`; активная Studio не развёртывалась, данные Sanity не менялись.
- Для product/category/brand/page/plant в исходнике `slugField` восстановлен как Sanity `slug` с `source: name` и `maxLength: 96`, чтобы совпадать с хранимыми объектами slug. Для service поле `slug` оставлено обычной строкой, поскольку именно строковое значение вызвало ошибку в Studio. Deployed `florial-admin` всё ещё ожидает для service тип `slug`, поэтому это расхождение устранится только после согласованного deployment существующей Studio schema. Перед deployment нужно проверить остальные отличия схем; данные не мигрировались и workflow автоматически не запускался.

## 2026-10-22 — Безопасный режим deployment

- Оба workflow переведены на ручной deployment: обычный push в `main` собирает Studio, но не развёртывает схему или приложение.
- Это необходимо, поскольку в проекте есть несколько существующих Studio и исходная схема пока отличается от активной схемы `florial-admin`.
- Проверка Sanity API подтвердила наличие тех же трёх существующих Studio; новую Studio создавать не нужно.
- Перед ручным deployment требуется отдельно проверить поля `translations` и совместимость данных; изменение схемы не следует считать опубликованным только по успешной сборке.

## 2026-10-22 — Локализованные SEO-поля услуг

- В исходную схему `translationText()` добавлен вложенный объект `seo` для языков `en` и `ru` с полями `metaTitle`, `metaDescription`, `noIndex` и `keywords`.
- Это нужно, чтобы SEO-метаданные услуг редактировались отдельно на каждом языке, а не наследовали болгарский заголовок.
- Схема в GitHub обновлена, но не развёрнута в существующем Studio. Перед deployment нужно согласовать расхождение между исходной схемой и активной схемой `florial-admin`; не создавать новую Studio и не перезаписывать приложение без проверки.
- Шесть опубликованных документов услуг в dataset `production` получили региональные метаданные BG/RU/EN. Публикация данных и deployment схемы — разные операции.

## 2026-10-21 — Initial version-controlled Studio source

- Added `studio/sanity.config.ts` with two workspaces pointing to the existing Sanity project `bxvcy0qs`: `production` for irrigation products/services/content and `plants` for the plant catalogue.
- Added `studio/schemaTypes/index.ts` to centralize schema definitions in GitHub.
- Added the six service fields that were reported as unknown in Studio documents: `advantages`, `callToAction`, `hero`, `leadForm`, `steps`, `translations`.
- Changed the service `slug` field in the source schema to plain `string`, without auto-generation or slug validation, as requested.
- Included irrigation products, brands, categories, pages, photos/media, site settings, SEO, and plant categories/products.
- Matched the deployed `productSpec` field names (`name`, `value`) to avoid changing the existing data shape.

### Not yet done

- No schema was deployed to Sanity in this change.
- No documents or dataset contents were changed.
- The existing deployed Studio apps were not replaced, deleted, or redeployed.
- Existing service slug values may still be stored as Sanity slug objects. Converting the schema field to string requires a reviewed migration/compatibility plan; a schema definition alone does not convert stored document values.
- A local Studio build has not been run in this environment. Build and inspect this source before deploying it to the intended existing Studio.

## 2026-10-21 — Plain-text slug fields

- Updated the shared `slugField()` helper in `studio/schemaTypes/index.ts` to use a plain `string` field with no generator, max-length rule, or slug validation. This covers irrigation products, irrigation categories, brands, pages, plant products, and plant categories in the version-controlled Studio source.
- The service and photo slug fields were already plain strings in the source.
- This is a source-code change only. The deployed Studio schemas and existing Content Lake documents have not yet been changed. Do not deploy the type change until the existing slug objects have been safely converted to their string values and the deployed website compatibility has been verified.
- The project inventory shows three hosted Studio apps and the available connected actions do not provide a confirmed delete operation. No Studio app or dataset was deleted.
- Added a compatibility normalization in `src/App.tsx` so slug values are projected to the existing `{ current: string }` shape whether the stored Sanity field is still a slug object or becomes a plain string. This includes product/service/category slugs, category references, and the logo lookup. Commit: `751ab216672622399e5593031e54981d39e9708a`.
- Still pending: applying the schema to the already deployed Studio, then migrating and publishing the existing slug values in both datasets. No Content Lake document values have been modified by this step.

## 2026-10-21 — Cloud Studio deployment pipeline

- Added `studio/sanity.cli.ts` pointing to the existing hosted Studio application ID `owtr7mlnn6xm33qah9z2wop6`. The multi-workspace configuration remains in `studio/sanity.config.ts`.
- Added `.github/workflows/sanity-studio.yml` to build the Studio and deploy it from GitHub Actions when Studio source changes or when manually dispatched.
- The workflow uses the GitHub Actions secret `SANITY_AUTH_TOKEN`; it never stores credentials in source. If the secret is missing, the deploy step stops with a clear error instead of silently creating another Studio.
- The connected GitHub tools cannot inspect or create repository Actions secrets, nor start a workflow run. The first successful cloud deployment therefore depends on the repository having `SANITY_AUTH_TOKEN` configured with Sanity Studio deployment permission.
- This pipeline does not migrate Content Lake documents. Existing slug object values must be converted separately, with a verified idempotent migration, before deploying schema changes that require plain strings.

## 2026-10-22 — Workflow CLI compatibility fix

- The first workflow run failed because `sanity schemas validate` is not a command in the repository's Sanity CLI version (`sanity@^3.99.0`).
- Removed the unsupported validation subcommands. The workflow now uses `npm run build` to compile and validate the configured Studio workspaces before attempting deployment.
- The workflow has been updated in GitHub. It still needs a fresh run to confirm build and deployment results.


## 2026-10-22 — Declare Studio runtime dependencies

- The next CI build failed because `sanity build` could not resolve `react/jsx-runtime`; the project manifest did not declare React, React DOM, or styled-components.
- Added explicit `react` and `react-dom` 18.x dependencies compatible with this Sanity v3 Studio, and declared `styled-components@^6.1.15` so the CLI does not try to modify package.json during the build.
- No dataset documents or content were changed. The workflow must run again to verify the fix.
- The build log also reported an engine warning for a transitive package requiring Node.js >=22. It was a warning, not the immediate failure. If it becomes a hard failure, update the CI Node version after checking Sanity CLI compatibility.


## 2026-10-22 — CI Node.js runtime update

- Updated GitHub Actions `checkout` and `setup-node` to v5 and selected Node.js 22 for the Studio build. This addresses the runner warning about Node.js 20 deprecation and satisfies the logged transitive dependency engine requirement of Node.js >=22.
- This is a CI configuration change only; no Sanity documents or datasets were modified.
- Awaiting the next workflow run to verify build and deployment.


## 2026-10-23 — Fix missing SEO object type in plants workspace

- Added the already-defined `seoFields` object type to `plantSchemaTypes`, because plant category/product translation fields reference it.
- This is a schema-source registration fix only. No Content Lake documents were changed.
- Pending: rerun the schema deployment workflow and confirm both workspace deployments and the hosted Studio routes.

## 2026-10-24 — Преводи на категориите

- Потвърдено е разминаване между изходния код и публикуваната схема: изходната схема съдържа `category.translations.en/ru.name` и `description`, но deployed workspace `florial-admin` не ги показва.
- Обновено е заглавието на полето в Studio, за да е ясно, че трябва да се попълват и името, и описанието на категорията.
- След този commit трябва да се провери автоматичното schema deploy преди публикуване на преводите. Не са променяни оригинални описания, цени, SKU или изображения.
