## 2026-11-12 — RSS-лента услуг опубликована в Production (PR #229)

- PR #229 объединён squash в `main`: merge commit `d9f8ded8a10ba3f477026e2ba04affeb427e5480`; GitHub PR: https://github.com/omaraandrey-dev/florial/pull/229.
- Cloudflare Pages project `florial`: production branch `main`; Production deployment `c1e03dc4-3b28-4575-920e-dae1e152ef02`, commit `d9f8ded8a10ba3f477026e2ba04affeb427e5480`, URL `https://c1e03dc4.florial.pages.dev`; stages queued/initialize/clone_repo/build/deploy — все `success`; deployment aliases включают `florial-bg.com` и `www.florial-bg.com`.
- CI по точному PR head `5e6dfdcb3d697e91c592f248a74eaa1047023c8a`: Blog and Studio validation run `43176887544` — success (lint, utility tests, website build, migration dry-run, Sanity Studio build); D1 validation run `43176887495` — success. Post-merge D1 validation для main commit `d9f8ded8a10ba3f477026e2ba04affeb427e5480`, run `43177889083` — success.
- Live Production smoke test через Firecrawl, maxAge=0: `https://florial-bg.com/feeds/services-bg.xml` вернул HTTP 200, `Content-Type: application/rss+xml; charset=utf-8`; тело — корректно сформированный RSS 2.0 с `bg-BG`, Atom self-link, абсолютными service URLs, описаниями и датами. В ленте присутствуют опубликованные активные услуги, исключая документы с `seo.noIndex=true`.
- Live homepage `https://florial-bg.com/` вернул HTTP 200 и содержит `<link rel="alternate" type="application/rss+xml" title="Florial — Услуги" href="https://florial-bg.com/feeds/services-bg.xml">`.
- Данные Sanity читались только через GROQ; Sanity documents/schema, D1, Cloudflare settings/secrets не изменялись. RSS-каталоги/агрегаторы ещё не регистрировали; это следующий отдельный шаг.

## 2026-11-12 — Перенос коммерческих статей блога в услуги завершён (PR #226)

- В Sanity Production опубликованы 8 специализированных услуг в четырёх существующих направлениях: системы полива (включая maintenance), услуги садовника и услуги газонщика. Ландшафтный дизайн использует существующую общую услугу.
- Девятая статья `landshaften-dizain-proekt-zasazhdenie` оставлена опубликованной в блоге как проектный материал; дублирующая услуга и редирект не создавались.
- В 99 товарах заменены ссылки `relatedContent` с четырёх старых blogPost IDs на соответствующие service IDs: 46 дождеватели, 23 программаторы, 17 клапаны, 13 ремонт/модернизация. Проверка после публикации: 99 товаров со ссылками на услуги, 0 старых ссылок на эти четыре blogPost.
- Восемь старых коммерческих blogPost получили `isPublished=false` после включения и проверки 301. Документы и IDs сохранены; физического удаления нет. Landscape case study остаётся `isPublished=true`.
- PR #226 объединён squash: merge commit `7acdc09e0ea01739bb69eca1ee4a2711a8fbe75f`. Добавлены middleware HTTP 301 для восьми URL, сохранение query string, тесты и исправление OG image для service pages.
- CI по точному PR head: Blog and Studio run `43170398802` — success; D1 validation run `43170398659` — success.
- Cloudflare Pages Production deployment `f22c3b8f-6d75-4228-b764-5bf32bbce497`, commit `7acdc09e0ea01739bb69eca1ee4a2711a8fbe75f` — build/deploy success; aliases `florial-bg.com` и `www.florial-bg.com`.
- Live Firecrawl smoke: все 8 legacy blog URL разрешаются на соответствующие service URL, конечный HTTP 200; query `lang` сохраняется. Landscape case study отдельно проверен: остаётся на blog URL, HTTP 200. Метаданные service pages локализованы, robots index/follow.
- Live sitemap.xml: HTTP 200; содержит все восемь новых service URL, не содержит восемь деактивированных blog URL и сохраняет landscape case-study URL.
- Backups: 9 исходных blogPost, 5 существующих service и field-level snapshot `relatedContent` 100 документов (99 товаров + одна услуга) сохранены в `docs/backups/`; это целевые snapshots, не полный dataset export.
- Sanity validation: 8 услуг и 99 товаров — `valid`; инструмент не выполняет custom validation callbacks, поэтому validation отмечена как incomplete. Ручной визуальный осмотр hosted Studio BG/RU/EN остаётся дополнительной QA-проверкой.
- Sanity schema, D1, Manager, Cloudflare secrets/settings, Header, меню и Footer не менялись.

## 2026-11-12 — Интерактивная фильтрация страницы услуг (PR #225 merged)

- PR #225 объединён в main методом squash; merge commit: a8db72ffda86e8d678cfe233a92ae88b0f82a892. Base main до merge: b82fedb92ab30042bcd8ef7d41b25936aae5de72; PR head: d51a04b53f2393b824a78b7affe2700ac75f7014.
- На /services добавлены четыре фото-карточки направлений специалистов: ландшафтный архитектор (landscaping), инженер по поливным системам (irrigation + maintenance + delivery), садовник (planting), специалист по газонам (lawn).
- Multi-select фильтрует услуги по объединению категорий. При первом открытии активны все четыре направления; снятие последнего выбора автоматически возвращает отображение всех услуг.
- Мобильная сетка — четыре колонки в одну линию, квадратные изображения и подписи снизу. Карточки доступны с клавиатуры, используют aria-pressed.
- Четыре изображения и локализованные ALT/title читаются read-only из опубликованных Sanity photo documents по slug. Проверены документы и asset URL; визуальный просмотр содержимого фотографий отдельно не выполнен.
- Существующая сортировка услуг, карточки, URL, SEO title/description, canonical/hreflang и локализация BG/RU/EN сохранены. Sanity documents/schema, D1, API, Header, меню, Footer и Cloudflare settings не изменялись.
- CI по точному PR head SHA: D1 migration validation run 43165329360 — success; Blog and Studio validation run 43165329362 — success. Подтверждены website lint, utility tests, website build, Pages Functions syntax, D1 migration validation/dry-run и Sanity Studio build.
- Cloudflare Pages Production deployment точного merge commit a8db72ffda86e8d678cfe233a92ae88b0f82a892 завершился success: deployment 6a9c87fd-a424-4ab8-8895-9c560a0e2336. Последующие Production deployments c37d0aefd88a1044c00f7150b4c729e9ba98824b (deployment f720893b-efa4-4194-9afd-95ec0d36dca1) и e55f2b67f45cc9e9c93d8323f6872e56af4ff89d (deployment 3668cab2-5e1a-4e74-8bea-8632c7e6f267) также завершились success; deployment c37d получил aliases florial-bg.com и www.florial-bg.com. Новейшие документационные commits 73558316217c5105a0b40e1958038dd573bc8b9f, 3156707e4bbf435dee8af5148c86a52ff2cb9acc и 7eb600ef356070bce1e6467eb13cede223d750b1 всё ещё проходят Production build; код приложения в этих commits не менялся. Мобильный визуальный QA ожидает подтверждения владельца.

---

## 2026-11-12 — Android visual QA: зимний индикатор и мобильная загрузка изображения категории

- После Production deployment PR #222 владелец проверил сайт на физическом Android-устройстве и сообщил, что результат отображается корректно («всё получилось отлично»). Визуальную проверку считаем пройденной по подтверждению владельца.
- Проверяемые изменения находятся в merge commit `79e96ce419b4be6513a112deee7c48bb3b0564e5`: индикатор зимостойкости расположен отдельно над фотографией; desktop-only hero image категории подключён через `<picture>` с media source от 1024 px и fallback `img` без `src/srcSet`.
- CI и Cloudflare Pages Production deployment для PR #222 уже подтверждены в предыдущей записи/проверке; deployment ID `4113830f-e8ff-4eba-bfc7-263818f8f287`, commit `79e96ce419b4be6513a112deee7c48bb3b0564e5`, aliases `florial-bg.com` и `www.florial-bg.com`.
- Ограничение доказательств: проверка владельца подтверждает визуальный результат на Android, но отдельная запись Network/DevTools с доказательством отсутствия HTTP-запроса category hero не получена. Отсутствие запроса следует из responsive HTML-механизма в коде, но не маркируется как независимо измеренное. Остаточный CLS и его источники не переоценивались.
- Изменения документационные: Sanity, D1, сайт, настройки Cloudflare и Production deployment не изменялись.

---

## 2026-11-12 — Уточнение зимнего индикатора и отключение мобильной загрузки hero image категории

- Base main: `6d41f82414676f8121ed1c374c77c0ad1258b211`; implementation branch: `fix/winter-indicator-card-position-and-responsive-category-image`.
- `src/pages/CategoryPage.tsx`: индикатор минимальной зимней температуры вынесен из области фотографии в отдельную строку в верхней части карточки растения. Снежинка уменьшена до `text-xs`; размер текста температуры `text-[10px]` сохранён.
- `src/pages/ProductPage.tsx`: индикатор вынесен из overlay основной фотографии в отдельную строку над изображением. Основная фотография товара остаётся загружаемой и использует существующий responsive `srcSet`; скрытых дублирующих desktop-only изображений в блоке основной галереи не обнаружено.
- Hero image категории теперь передаётся через `<picture>` с единственным `<source media="(min-width: 1024px)">`; fallback `<img>` не имеет `src`/ `srcSet`. При мобильном viewport ни один source не совпадает, поэтому браузер не должен запрашивать это desktop-only изображение. CSS-класс `category-page-hero-image` сохранён для предотвращения отображения контейнера на мобильном.
- Sanity, D1, Manager, API, Header, меню, Footer, Cloudflare settings/secrets и Production data не затрагивались.
- Визуальная проверка на физическом Android и CI по PR должны быть записаны после выполнения; до этого поведение на устройстве считается не подтверждённым.

---

## 2026-11-12 — Индикатор зимней температуры на карточке товара и мобильное изображение категории (PR #221 merged + Production deploy)

- PR #221 успешно объединён в `main` методом squash. Implementation branch: `fix/plant-winter-indicator-and-mobile-category-flash`; head: `c4225fa3eb7898c4f2b1a5963c45e6f48b94b746`; merge commit: `96cc7508301485b81856981d010f506ea7b5ebe0`.
- `src/pages/CategoryPage.tsx`: индикатор зимней температуры уменьшен; удалены белая подложка, рамка, тень и внутренние отступы. Оставлены синяя снежинка и синяя температура, позиция — левый верхний угол (4 px).
- `src/pages/ProductPage.tsx`: такой же компактный индикатор добавлен поверх основного изображения растения. Используется существующее поле `plantCare.minWinterTempC`; Sanity schema и документы не менялись.
- Мобильное изображение категории: для `.category-page-hero-image` добавлено критическое правило в `index.html` — скрыто по умолчанию и показывается только при viewport шириной от 1024 px. Компонент категории использует этот класс вместо Tailwind-only `hidden lg:block`, чтобы скрытие применялось до загрузки основного CSS.
- PR изменил только `index.html`, `src/pages/CategoryPage.tsx`, `src/pages/ProductPage.tsx`. Header, меню, Footer, App/router, Sanity, D1, Manager, API и Production settings не менялись.
- GitHub Actions по PR head `c4225fa3eb7898c4f2b1a5963c45e6f48b94b746`: D1 migration validation run `43157810821` — success; Blog and Studio validation run `43157810867` — success. Проверены website lint, utility tests, website build, Pages Functions syntax, read-only migration dry-run и Sanity Studio build.
- Cloudflare Pages Production deployment `edd10fd4-75b4-4c23-8631-0016395b767e` для merge commit `96cc7508301485b81856981d010f506ea7b5ebe0` завершился `success` 12.11.2026. Deployment URL: `https://edd10fd4.florial.pages.dev`; aliases включают `https://florial-bg.com` и `https://www.florial-bg.com`.
- Ограничение проверки: автоматическая проверка build/deploy пройдена; визуальная проверка первого кадра и фактического поведения на Android владельца не выполнялась. Остаточный CLS страницы категории и подтверждение исчезновения вспышки на реальном мобильном устройстве остаются отдельной визуальной QA задачей.

---

## 2026-11-12 — Индикаторы наличия и зимней температуры на карточках растений (merged + Production deploy)

- PR #220 успешно объединён в `main` (squash merge commit `4ab09c5737b1d271042bdb64ffe658176f8e78cc`), ветка создана от main `84052cee404edd572448d0f58fa058889fe7b9df`. Изменение в `src/pages/CategoryPage.tsx`.
- Индикатор наличия теперь предусматривает три состояния: `inStock` — зелёный, `onRequest` — синий, `outOfStock` — красный. Неизвестный/неуказанный статус по-прежнему не отображает точку.
- Для карточек растений при числовом `plantCare.minWinterTempC` добавляется синяя снежинка и температура. Поле уже входит в существующую plant detail/category projection и тип `PlantCare`; Sanity schema и документы не менялись.
- Изменение ограничено отображением карточек категории. Цены, наличие на сервере, варианты, корзина, checkout, Manager, Header, меню, Footer, D1 и Cloudflare settings не затрагиваются.
- Коммит реализации: `d6f2f8cd12a080c1edab52005846341d133df5c2`; merge commit: `4ab09c5737b1d271042bdb64ffe658176f8e78cc`.
- GitHub Actions для PR head `7151fc277f7fd88b6126d4dbf3761497bac248e7`: `Florial D1 migration validation` run `43156657696` и `Blog and Studio validation` run `43156657647` завершились `success`. Успешны website lint/build, utility tests, Pages Functions syntax, D1 migration validations, Sanity Studio build.
- Cloudflare Pages Production deployment `be092504-d800-4007-832b-c5bb86690cb3` для commit `4ab09c5737b1d271042bdb64ffe658176f8e78cc` завершился `success` 12.11.2026; deployment URL `https://be092504.florial.pages.dev`. Домен привязан к проекту `florial`; deployment trigger — push в `main`.
- Live browser visual QA карточек на мобильном и desktop отдельно не выполнялся; код/CI/Production deployment подтверждены, визуальное поведение требует просмотра сайта.

- Отдельно отмечено наблюдение владельца о скачке изображения на мобильной странице категории. Текущий код скрывает заглавное изображение категории на ширине ниже Tailwind `lg`; существующий CLS-аудит после PR #156 зафиксировал остаточный сдвиг категории около 0.34385 без определённого source node. Совпадение с наблюдаемым изображением пока НЕ ПОДТВЕРЖДЕНО. Shared layout/App.tsx и Header/Footer не менялись; требуется отдельный controlled mobile capture.

---

## 2026-11-12 — Длинный SEO-контент категорий (подготовка к публикации)

- В ветке `feat/category-long-seo-content`, созданной от main `d72b9bfdd7036359e1eb2d13f819d24a8bb6c388`, подготовлено необязательное поле Portable Text `seoContent` для обеих схем категорий: оборудование (`production`) и растения (`plants`), включая локали BG/RU/EN.
- Разрешённые элементы соответствуют текущему `RichText`: normal/H2/H3, bullet/number, strong/em и ссылки только на внутренние пути `/` (кроме `//`) или HTTPS без userinfo. H1/H4+, blockquote, underline и прочие marks/styles не разрешены.
- Длинный текст выбирается только для активной локали и выводится после сетки/пагинации перед существующим `helpBlock`. При отсутствии валидных блоков секция не рендерится. Внутренние ссылки используют SPA navigation.
- Добавлены unit tests для BG/RU/EN и пустых/отсутствующих/невалидных значений. Компактные category index queries не расширялись; detail queries получили `seoContent`, `translations` остаётся полной выборкой.
- Изменение аддитивное. В рамках этой задачи документы Sanity не записывались и не публиковались; поле не заполнялось ни у одной категории. Никакая миграция контента не выполнялась.
- Важно: merge в `main` при изменении `studio/**` автоматически запускает `.github/workflows/deploy-sanity-studio.yml` и `npx sanity deploy`. Schema deployment и merge не выполнялись; ожидается отдельное разрешение владельца.
- GitHub Actions для implementation commit `e9fbbf25b5279102226ec9d7c6ea4856e6b80442`: Blog and Studio validation run #908 (`43153746750`), D1 validation run #1133 (`43153746827`) и Sanity Studio validation run #147 (`43153746938`) завершились `success`. Подтверждены website lint/tests/build, Pages Functions syntax, существующие migration validations и Studio build обеих workspaces.
- PR #219 остаётся открытым и не объединённым. Sanity deployment workflow на PR не запускался; live Sanity schema не проверялась.

---

## 2026-11-11 — Production D1 read-only audit, CI confirmation and current-state guide

- Read-only live audit of Cloudflare D1 database `florial-db` (region `EEUR`; approximately 1.9 MB). No SQL writes, migrations, schema changes or data changes were performed.
- Direct `sqlite_master` inspection returned 17 application tables. The Cloudflare database-list response simultaneously reported `num_tables: 0`; this API discrepancy is recorded and must not be silently treated as resolved.
- Live `schema_migrations` ledger contains a continuous sequence from `0001` through `0014`; latest recorded migration is `0014_contract_withdrawals`.
- Observed row counts: orders 7; order_events 26; catalog_staff_profiles 2 (one Owner and one Manager, both active); manager_sessions 2 (0 expired); catalog_submissions 15; catalog_submission_events 57; catalog_stock_events 60; manager_product_audit 120 (60 started + 60 success, 0 failed); service_leads 2; contract_withdrawals 1 (confirmation status `sent`). `api_rate_limits` contained 5 expired records; code in `functions/api/_lib/public-api-security.ts` performs best-effort probabilistic cleanup (1% per eligible request), so this alone is not evidence of a fault.
- Read-only relationship checks found zero orphan rows in permission events, stock events, submission events, manager sessions, product audit and order events. No negative order amounts were found.
- Full SQLite `PRAGMA integrity_check` and `PRAGMA foreign_key_check` were not reliably confirmed through the API invocation; do not claim a full database integrity check passed. Table-count discrepancy remains a follow-up observation.
- GitHub Actions run `43099079700` on main commit `2dba36582e8e19079eef6ad80108d882bd85c218` completed with conclusion `success`. Job `validate` passed dependency installation, lint, website build, Pages Functions syntax, additive plant audit migration validation and contract withdrawals migration validation.
- Older run `43095667280` for commit `6c65e01e7c8d99994669158fe0aeb120136bebfa` remains queued without jobs/conclusion. The later successful run is on a newer main commit and passed; the old queued run was not cancelled or rerun.
- Added `docs/AI/CURRENT_STATE.md` as a concise handoff snapshot. It is a dated snapshot, not a replacement for live service checks or the detailed passport.
- No application runtime, Sanity, D1, Cloudflare settings/secrets, DNS or Resend changes were made.

## 2026-11-11 — Read-only Cloudflare legacy-variable audit and post-merge CI

- Live Cloudflare Pages project `florial` was read without exposing variable values. Production contains legacy names `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`; Preview contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Static scan of 115 tracked application source, Pages Functions, GitHub workflow and key configuration files at commit `6c65e01e7c8d99994669158fe0aeb120136bebfa` found no Supabase references in `src/**`, `functions/**` or `.github/workflows/**`. `package.json` has no Supabase SDK; `.env.example` documents only Sanity public configuration; `src/lib/sanity.ts` reads `VITE_SANITY_*` only.
- Assessment: all six Cloudflare legacy variables appear unused by the current repository code/workflows. Values were not read. No variables were changed or deleted; removal is a Production/Preview configuration change and requires explicit owner approval.
- Cloudflare Pages latest Production deployment for merge commit `6c65e01e7c8d99994669158fe0aeb120136bebfa`: deployment `f2114ff2-9efe-480b-a4c9-ced4d24da3dc`, stage `deploy`, status `success`; aliases `florial-bg.com` and `www.florial-bg.com`.
- GitHub Actions D1 validation run `43095667280` for this exact merge commit remains `queued` with no jobs and no conclusion. Earlier successful CI runs were for a different SHA and are not attributed to this merge commit. The reason for the queue delay is not confirmed.
- No application code, Sanity content/schema, D1 data/schema, secrets or Cloudflare settings were changed during this audit.

## 2026-11-11 — Gemini botanical form review and preliminary Black Sea suitability

- Fixed the Manager review flow: applying Gemini now fills the editable plant form and leaves it open; it no longer saves immediately or closes the editor. The regular Save/Publish action is separate.
- Added a preliminary AI recommendation for Bulgarian Black Sea coastal cultivation with four outcomes: likely suitable, suitable with conditions, likely unsuitable, or insufficient data. Gemini also supplies a short Bulgarian rationale.
- Kept confirmed coastal suitability separate and unchanged by AI (needsVerification until staff review). Public product suitability must rely only on this confirmed status.
- The assessment prompt considers documented frost tolerance, coastal winds/salt exposure, summer drought, drainage, plant maturity, and open-ground versus container cultivation. It must not invent regional temperature thresholds.
- Added the recommendation and rationale to the Sanity plantCare schema and Manager form; bounded/validated the new values on server save.
- Files: functions/api/manager/plants/gemini-test.ts, functions/api/manager/plants/gemini-test-lib.ts, functions/api/manager/plant-direct-lib.ts, src/manager/PlantCatalogManager.tsx, studio/schemaTypes/index.ts, tests/gemini-plant-ai.test.mjs, tests/manager-plant-care-permissions.test.mjs.
- Read-only Sanity check: published document “Маслина бонсай 4” (b4f7638d-8c5a-469c-8ed1-af6eadae2243) currently has plantCare: null and careGuide: null. No Sanity document was modified.
- PR merged into `main` at commit `2b6db5028061c0d27778760b9ac25b59d6629fc6`.
- Cloudflare Pages Production deployment `abc8d826-84e6-4f5e-a433-60f490528c98` completed successfully; all build/deploy stages succeeded; aliases `https://florial-bg.com` and `https://www.florial-bg.com` are attached.
- GitHub Actions status for this exact commit: НЕ ИЗВЕСТНО — нужно уточнить; no passing CI run is claimed here.
- Hosted Sanity Studio deployment/build is not confirmed. No Sanity document was changed.

---

## 2026-11-11 — Gemini: точная диагностика JSON parsing и AI proof signing

- Разделён ранее общий этап `normalizing`: теперь отдельно отображаются `json_parsing`, `normalizing` и `proof_signing`; ошибки возвращают фактический этап.
- Оборванный/невалидный JSON и JSON с корневым типом, отличным от объекта, классифицируются отдельно от ошибок подписи.
- Ошибки сессии Manager и Web Crypto при создании AI proof получают собственные коды вместо общего `GEMINI_PROVIDER_ERROR`.
- Добавлены тесты полного и оборванного JSON. Существующие SSE/finishReason/transport проверки сохранены.
- Файлы: `functions/api/manager/plants/gemini-test.ts`, `functions/api/manager/plants/gemini-test-lib.ts`, `functions/api/manager/plant-direct-lib.ts`, `tests/gemini-plant-ai.test.mjs`.
- PR #213 объединён squash в main: merge commit `91cb388106c554eb0488cd8fdfa1c6b57452d5be`. PR CI #895: lint, 97 tests, website build, Pages Functions syntax, read-only migration dry-run и Studio build — success; D1 validation #1111 — success.
- Cloudflare Pages Production deployment `e4914b63-2ebc-49d9-b753-389df2965148` для main commit `91cb388106c554eb0488cd8fdfa1c6b57452d5be`: build/deploy success; aliases florial-bg.com и www.florial-bg.com активны.
- Повторный реальный Gemini Photo smoke test с авторизованной Manager-сессией ещё не выполнен. Исходная причина ошибки не подтверждена. Sanity, D1 и Cloudflare settings/secrets не изменялись.

---

## 2026-11-11 — Google botanical fields enabled for all plant staff roles

- Removed Owner-only restrictions from applying and saving Google Gemini plantCare/careGuide results.
- Manager product GET now includes `plantCare` and `careGuide` for Owner, Manager and Seller.
- Botanical care section is visible in Plant Manager for all three roles.
- Unknown values are retained as null/empty arrays; Black Sea Coast remains `needsVerification`.
- Added role coverage test for Owner, Manager and Seller.
- Files: `src/manager/PlantCatalogManager.tsx`, `functions/api/manager/plants/[id].ts`, `functions/api/manager/plant-direct-lib.ts`, `tests/manager-plant-care-permissions.test.mjs`.
- No D1 permission, Sanity schema/data, other staff permissions, order flows or site-wide layout changes.
- GitHub Actions run #1105 (43056763211) on final documentation commit 4442ec129e1d40d04d35531ceace487c97413cae: success (lint, website build, Pages Functions syntax, D1 migration validations).
- Cloudflare Pages Production deployment e4a85088-7572-41f0-8cdc-e6c71e2a98ce: all stages success; production aliases florial-bg.com and www.florial-bg.com.

---

## 2026-11-11 — Google Gemini как единственная основная AI-модель для растений

- Зафиксировано решение владельца: рабочее AI-заполнение растений в Manager использует только Google Gemini; Owner, Manager и Seller должны получать одинаковый набор ботанических характеристик.
- Обязательные поля: освещённость, потребность в воде, минимальная зимняя температура, высота взрослого растения, тип листвы, сезон цветения, сезон посадки, пригодность для Черноморского побережья и руководство по уходу.
- Read-only проверка Production D1: 1 Owner, 1 Manager, 0 Seller. У Manager уже есть `canCreatePlant=true`; отдельного `canUseGoogleAI` permission key нет. Gemini endpoint разрешает роли Owner/Manager/Seller.
- Выявлено: `PlantCatalogManager.tsx` добавляет `plantCare` и `careGuide` при применении/сохранении результата только для Owner. Это ограничение кода, не D1-разрешение.
- В этой записи изменена только документация. Код, D1 schema/rows, Sanity schema/documents/assets и Production settings не изменялись. Для полноценного включения полей всем ролям требуется отдельное согласование изменения кода.

---

## 2026-11-11 — Порядок связанных материалов на карточке растения

- В src/App.tsx для полной plant detail projection добавлено read-only получение category.helpBlock.buttonUrl; целевая услуга/статья разрешается тем же Sanity-запросом, что и индивидуальные связанные материалы растения.
- Категорийный материал теперь ставится первым, затем идут ссылки relatedContentBySlug в исходном порядке Sanity. Повторяющийся документ удаляется; неактивные услуги и неопубликованные статьи исключаются.
- Вынесена чистая функция src/lib/plantRelatedContentUtils.mjs; добавлены тесты tests/plant-related-content-utils.test.mjs.
- Изменения затрагивают только frontend plant detail data resolution и сборку списка карточек. Sanity documents/schema, категории и индивидуальные ссылки не изменялись; D1, Cloudflare settings/secrets, orders, cart, checkout, Header, меню и Footer не затронуты.
- Реализация подготовлена в отдельной ветке; CI/PR и Production deployment ожидают проверки. Merge не выполнялся.

## 2026-11-11 — Карточки связанных материалов в категориях (PR #210)

- PR #210 «feat: показывать карточки связанных материалов в категориях» объединён squash в main после отдельного разрешения владельца: merge commit 38235643054c148c9754428e40403741728735cd.
- В блоке помощи страницы категории вместо текстовой кнопки отображается карточка связанной услуги или статьи: изображение, локализованное название и переход на целевую страницу.
- Целевой путь берётся из category.helpBlock.buttonUrl, если это внутренний путь /services/... или /blog/...; иначе используются fallback-маршруты для категорий растений и оборудования для полива.
- Данные карточки загружаются read-only из Sanity по slug. Поддерживаются документы service и опубликованные blogPost; учитываются активность материала, локализованные названия и alt-тексты изображений. При отсутствии изображения сохраняется нейтральная область карточки.
- Изменён runtime-файл src/pages/CategoryPage.tsx. Данные и схемы Sanity не изменялись.
- Проверка Production: /category/rastenia и /category/vsichko-za-polivane — HTTP 200; карточки «Засаждане на растения» и «Автоматично напояване» содержат изображения и ведут на соответствующие service pages. Обе страницы услуг — HTTP 200.
- Локализация карточки категории растений проверена: BG «Засаждане на растения», RU «Посадка растений», EN «Planting Services». Для RU/EN category pages также получен HTTP 200.
- Cloudflare Pages Production deployment c2b880a6-c301-48e5-a433-60f490528c98, URL https://c2b880a6.florial.pages.dev, trigger github:push на main commit 38235643054c148c9754428e40403741728735cd; build и deploy — success. Production aliases: https://florial-bg.com и https://www.florial-bg.com.
- GitHub Actions: Blog and Studio validation и Florial D1 migration validation — success.
- Sanity documents/schema, D1 schema/data, Cloudflare settings/secrets, API, orders, cart, checkout, Header, основное меню и Footer не изменялись. Миграции не запускались.
- Владелец подтвердил успешный результат после проверки Production. Дополнительные изменения данных не выполнялись.

## 2026-11-11 — Подтверждена работа выбора размера растений в Production

- Пользователь проверил сайт после Production deployment commit `ccb5c9bfd7e2882fe0d72c220fda3d4f6216d879` и подтвердил: «Всё работает, всё прошло успешно».
- Подтверждено корректное поведение PR #209: при переходе внутренней ссылкой на другой товар выбранный размер предыдущего растения сбрасывается; при переходе из карточки категории выбранный вариант передаётся в карточку товара.
- Результат зафиксирован по пользовательской проверке Production; отдельные данные Sanity и D1 не изменялись.

## 2026-11-11 — Сброс выбранного размера при внутренней навигации

- В `src/App.tsx` в `navigateToInternalPath()` добавлен сброс `initialSaleVariantKey` перед открытием маршрута из внутренней ссылки.
- Это предотвращает перенос ключа размера предыдущего растения на другой товар при переходе по внутренней ссылке. Передача размера из карточки категории через `navigateToProduct()` сохранена без изменений.
- URL, маршруты, canonical/SEO, Sanity, D1, корзина, checkout, Header, меню и Footer не изменялись.
- Исправление клиентской навигации не влияет на Cloudflare D1 binding deployment error.

## 2026-11-11 — Отдельные карточки размеров растений (PR #207, ожидает согласования)

- Ветка `feat/plant-catalog-variant-cards`; PR #207 открыт, не объединён. Production не изменён.
- В категории растений каждая запись `saleVariants[]` разворачивается в отдельную карточку предложения. Карточки используют общий Sanity Product и общий URL `/product/{slug}`; отдельные Sanity документы и SEO URL не создаются.
- Каждая карточка показывает локализованное название растения, краткое описание и категорию, но собственные цену/старую цену выбранного варианта. Для варианта с максимальной ценой всегда используется отдельное поле Sanity `mainImage`; остальные варианты получают стабильный псевдослучайный выбор из главного фото и всей галереи (включая main), чтобы изображение не менялось при каждом React rerender. Текст перехода содержит локализованное название/параметры размера: BG `Виж размер:`, RU `Посмотреть размер:`, EN `View size:`.
- При нажатии выбранный `saleVariantKey` передаётся только во внутреннем состоянии SPA. На общей ProductPage этот вариант выбирается автоматически; адрес страницы, canonical, hreflang, sitemap и Product JSON-LD не меняются. При прямом открытии страницы без переданного ключа сохраняется прежнее поведение — выбирается первый вариант.
- Сортировка карточек учитывает статус конкретного варианта: `inStock` → `onRequest` → `outOfStock`; внутри группы применяется выбранная сортировка цены. Без сортировки по цене сохраняется порядок вариантов из Sanity. Варианты без цены размещаются после оценённых внутри своей группы.
- Для товара без `saleVariants` сохраняется одна обычная карточка. Каталог оборудования не меняется. Пагинация и счётчик категории учитывают карточки предложений, а не только родительские документы.
- Изменённые файлы: `src/pages/CategoryPage.tsx`, `src/App.tsx`, `src/types.ts`, `src/pages/ProductPage.tsx`, `src/lib/plantCatalogUtils.ts`, `tests/plant-catalog-utils.test.mjs`.
- Sanity documents/schema, D1, Cloudflare settings/secrets, корзина/оформление заказа, Header, меню и Footer не изменялись.
- CI на code HEAD `ac107a131f758ebd81c112dec6fdec4b2ba0c5c6`: lint, 89 tests, website build — success; D1 validation run #1074 — success. Sanity Studio build остаётся в процессе run #879. Требуется итоговая проверка CI после документационных изменений.
- Не объединять PR и не выполнять Production deployment без отдельного явного разрешения владельца.

---

## 2026-11-11 — Улучшение каталога растений (PR #204)

- В отдельной ветке `fix/plant-category-stock-filters-names` подготовлено исправление отображения названий растений: при пустом переводе используется локализованный SEO H1 (для RU/EN), затем основное название товара и корневой SEO H1.
- В `src/lib/plantCatalogUtils.ts` вынесена единая логика определения наличия по вариантам, приоритета сортировки и минимальной положительной цены.
- `src/pages/CategoryPage.tsx`: карточки растений сортируются по группам `inStock`, `onRequest`, `outOfStock`; статус вариантов имеет приоритет над устаревшим корневым статусом. Удалены фильтры по освещённости, потребности в воде и пригодности для Черноморского побережья. Сохранены фильтры типа и зимостойкости; добавлена сортировка цены по возрастанию/убыванию. Неоценённые по цене растения остаются в конце своей группы наличия.
- Добавлены `tests/plant-catalog-utils.test.mjs` с проверками резервного названия, приоритета статусов вариантов, минимальной цены и сортировки.
- Изменены только frontend-код и тесты. Sanity documents/schema, D1, Cloudflare settings/secrets, cart, checkout, Header, меню и Footer не менялись.
- PR #204 открыт, финальный HEAD: `a1f7b10ab4a56b7a3dd2630859a367ab351cb2e6`. PR не объединён; Production deployment не выполнялся.
- CI run #871 и D1 validation run #1066 успешно завершились на первоначальном PR HEAD `93f8b1c662cf8260e9cd049714010c6329e2033d`; после двух небольших follow-up commits на HEAD `a1f7b10...` требуется повторная CI-проверка.
- Отдельная SEO-архитектура индексируемых страниц для вариантов продажи не включена: требуется отдельное согласование изменения маршрутов, canonical, edge middleware, Product JSON-LD и sitemap.

---

## 2026-11-11 — Ссылка на «Общи условия» добавлена в Footer

- В нижнем блоке юридической информации src/components/Footer.tsx добавлена ссылка на /terms рядом с /privacy-policy и /withdrawal.
- Ссылка локализована: BG «Общи условия», RU «Общие условия», EN «Terms and Conditions»; используется localizedHref.
- Существующее оформление, фон, контакты, CTA и остальные ссылки сохранены.
- Изменён только Footer component; Header, меню, checkout, Sanity, D1, Cloudflare settings/secrets и пользовательские данные не затронуты.
- PR #203 объединён squash merge в main: cb26dcacb0b254c57ac7cc280285516f4c3f3ce7.
- CI PR HEAD 0376b175e76100113da938a06976d00593b5e7a1: Blog and Studio validation #869 — success; Florial D1 migration validation #1062 — success.
- Cloudflare Pages Production deployment 1d09957d-31ad-4753-b8fa-ddf5455e75f8 завершился success; production aliases florial-bg.com и www.florial-bg.com назначены.
- Live smoke: https://florial-bg.com отвечает HTTP 200; HTML подтверждает href https://florial-bg.com/terms и подпись «Общи условия» в Footer.

## 2026-11-11 — Страница «Общи условия» объединена и опубликована (PR #202)

- Добавлены src/content/terms-bg.md с предоставленным владельцем болгарским проектом из 18 разделов и src/pages/TermsPage.tsx с адаптивным отображением.
- В src/main.tsx добавлен отдельный маршрут /terms с существующим LanguageProvider и Footer.
- В functions/_middleware.ts добавлены SEO title/description, canonical и серверный H1 для BG/RU/EN. В functions/sitemap.xml.ts включён болгарский URL; hreflang для RU/EN не заявляются, поскольку перевод текста пока отсутствует.
- Текст не редактировался юридически. Реквизиты, момент заключения договора, доставка, оплата и изключения права на отказ оставлены для проверки юристом.
- Header, меню, Footer, корзина, checkout, Sanity, D1, заказы и реальные данные не менялись; ссылка Footer не добавлялась.
- PR #202 squash-объединён в main: `b66e18b6ee952ff77e07121dcb3d03871f5a6ddc`.
- Финальный PR HEAD `e2a7b913dfef06f5a1e90267d5c66b45d9882c89`: Blog and Studio validation #868 — success; Florial D1 migration validation #1058 — success.
- Cloudflare Pages Production deployment `7a4b4deb-f713-4f37-bbd4-0d11adf62913` завершился success; URL deployment `https://7a4b4deb.florial.pages.dev`, домены проекта `https://florial-bg.com` и `https://www.florial-bg.com`.
- Страница доступна по адресу `https://florial-bg.com/terms`. В RU/EN тексты перевода не заявляются; hreflang ограничен болгарским текстом.

## 2026-11-11 — Footer обновлён и опубликован в Production

- PR #200 объединён squash merge: `ecd2b6f8a0700f864bfe24bfce047a88334a7753`.
- Cloudflare Pages Production deployment: `6225a42e-4904-442a-8937-393db535ac8a`; все стадии завершились success, доменные aliases: `https://florial-bg.com`, `https://www.florial-bg.com`.
- GitHub Actions PR #200: Blog and Studio validation #43012114645 — success (lint, utility tests, website build, migration checks, Studio build); Florial D1 migration validation #43012114952 — success. Main D1 validation #43012265621 — success.
- В `src/components/Footer.tsx` фон подвала изменён на `#F3F5EC` — тот же оттенок, что у нижней информационной секции `src/pages/ServicesListPage.tsx`. Контактный блок использует `#E9EDDB`, рамки — `#DDE3D0`; основной текст — контрастные slate оттенки, ссылки — тёмно-зелёные.
- Сохранены контактные данные, call/WhatsApp actions, Facebook, локализация BG/RU/EN и tracking events.
- Добавлена локализованная постоянная ссылка `/withdrawal` рядом с `/privacy-policy`.
- Изменён только Footer component; Header, меню, checkout, Sanity, D1, Cloudflare settings/secrets и существующие данные не затронуты.
- Ранее объединённый PR #199 (документация D1 migration 0014 и подтверждённого email smoke test) также уже в main; его Production deployment `fc549c5a-262d-4ea8-97d4-bf4a577c3c19` завершился success.

---

## 2026-11-11 — Production D1 migration 0014 применена

- По отдельному прямому разрешению владельца применена additive migration docs/migrations/0014_contract_withdrawals.sql в Production D1 florial-db (5fbb0e47-8439-493c-821a-6945eef7d8b2).
- Перед применением получен D1 Time Travel bookmark 000002bd-00000000-00005120-fb012ce3f8148fe6ae14638b64af462f.
- Зарегистрирована версия 0014_contract_withdrawals, applied_at 2026-11-11 11:11:19; созданы contract_withdrawals, contract_withdrawal_events, 4 индекса и 4 защитных триггера.
- Post-check подтвердил наличие всех объектов. Контрольные количества существующих данных не изменились: 7 orders, 26 order_events, 2 service_leads, 7 service_lead_events.
- Контролируемый end-to-end тест выполнен владельцем после применения миграции: отправлено одно заявление через Production-форму; владелец подтвердил получение письма и заявителем, и администратором.
- Read-only post-test D1: `contract_withdrawals` — 1 запись; `contract_withdrawal_events` — 2 события (`declaration_received` и `confirmation_sent`). Запросы проверки: `rows_written=0`, `changed_db=false`.
- Следовательно, регистрация заявления в D1 и отправка двух подтверждений Resend подтверждены фактическим тестом. Дополнительные authenticated Owner/Manager permission checks и обработка статусов в Manager остаются отдельной приёмкой.
- Юридическая проверка текста/реквизитов/сроков хранения и отдельное согласование постоянной ссылки Footer остаются открытыми. Тестовую запись не удалять без отдельного согласования.
- Runtime code, Sanity, Cloudflare settings/secrets, Header, menu, Footer and checkout were not changed by migration or this documentation update.

---
## 2026-11-11 — PR #198 объединён, Production deployment успешен

- PR #198 объединён с `main` методом squash; merge commit: `1b94b5a749e759ee28197e32daef8733e1b21a3e`.
- Cloudflare Pages автоматически опубликовал Production deployment `8955b559-ce01-4e9a-9292-8da34fa43352`; все стадии сборки и публикации завершились success.
- Live retrieval подтвердил доступность страницы `/withdrawal` на BG и RU, а также обновлённой Privacy Policy.
- Read-only запрос Production D1 показал последнюю миграцию `0013_manager_product_audit`; 0014 не применена. Запрос не менял данные (`rows_written=0`, `changed_db=false`).
- Публичная страница доступна, но подача заявления/обработка через Manager не вводится в эксплуатацию до отдельного согласования и применения migration 0014 и live-проверок.
- Не изменялись Footer, Header, меню, checkout, Sanity, Cloudflare settings/secrets. Footer link отдельно не согласована и не добавлена.
- До полного запуска остаются: юридическая проверка, согласование Footer link, прямое разрешение на migration 0014, Resend test, Owner/Manager live checks и BG/RU/EN smoke после миграции.

---

## 2026-11-11 — CI-проверка миграции онлайн-отказа

- Для `docs/migrations/0014_contract_withdrawals.sql` добавлен отдельный SQLite in-memory тест `tests/contract-withdrawals-migration.test.py`.
- В `.github/workflows/validate-d1-migration.yml` добавлен отдельный шаг `Validate contract withdrawals migration`; тест проверяет структуру таблиц, регистрацию заявления и события, разрешённое изменение рабочих статусов, неизменяемость декларации, JSON metadata, append-only журнал, уникальность idempotency key и удаление PII-записи с сохранением минимального события.
- На code/CI baseline commit `3a8f5b45085e9397f1a1c4a9ccc0d0c711c4bbab`: Florial D1 migration validation run #1040 — success, включая новый шаг; Blog and Studio validation run #854 — success (lint, tests, website build, migration-script checks, read-only dry-run, Sanity Studio build).
- PR #198 остаётся открытым и не объединённым. `main` и PR base — `28c58401c6015033a9c844a1bf92d8d2151ba1d3`.
- Cloudflare Pages preview deployments отключены настройкой проекта; ветка PR не получает рабочего preview. Production остаётся на deployment `d583ec9a-7986-4778-a171-f424c2039bee`; миграция 0014 не применялась.
- До Production остаются legal review, согласование Footer link, тест Resend, Owner/Manager live checks, отдельное одобрение миграции, Production deployment и BG/RU/EN live smoke.

---

## 2026-11-11 — Повторная проверка PR #198 и статуса Cloudflare

- Проверен фактический PR HEAD: `5d5f3d8cbe815f3d11cb552cee6eecd840f2e3ce`; PR #198 открыт, mergeable, не объединён. Ветка: `feat/contract-withdrawal-flow`.
- Текущий `main` остаётся на baseline commit `28c58401c6015033a9c844a1bf92d8d2151ba1d3`; PR base SHA совпадает с ним.
- GitHub Actions на фактическом HEAD: Blog and Studio validation run #847 — success; Florial D1 migration validation run #1033 — success. В run #847 пройдены lint, utility tests, website build, syntax check migration scripts, read-only description migration dry-run и Sanity Studio build. В run #1033 все шаги workflow завершились success; его job step называется «Validate additive plant audit migration», поэтому этот workflow не является самостоятельным подтверждением CI-проверки новой migration 0014.
- SQL `docs/migrations/0014_contract_withdrawals.sql` отдельно проверена в SQLite in-memory ранее: создание таблиц/индексов/триггеров, insert декларации и события, обновление статуса, immutability декларации, append-only event и удаление PII-записи при сохранении минимального event log. Production D1 не изменялась.
- Cloudflare Pages project `florial`: preview deployments глобально отключены (`preview_deployment_setting=none`). Deployment `48859ea7-7b07-4165-a823-4a67faba679a` для текущего HEAD помечен `skipped`, причина `preview_deployments_disabled`; preview URL не является работающим тестовым окружением.
- Последний Production deployment остаётся `d583ec9a-7986-4778-a171-f424c2039bee`, commit `28c58401c6015033a9c844a1bf92d8d2151ba1d3`, все стадии завершились success. Нового Production deployment для PR не выполнялось.
- Не изменялись Production D1, заказы, Sanity, Cloudflare project settings/secrets, Header, меню, Footer и checkout. Footer link, юридическая проверка, тест Resend, Owner/Manager live-проверки, применение migration и Production release остаются блокерами.
- Статус: CI для текущего HEAD пройден; функция не опубликована; preview недоступен из-за настройки проекта. Не заявлять о юридической готовности или Production-приёмке.

---

## 2026-11-11 — Черновая реализация функции онлайн-отказа от договора

- Создана отдельная ветка `feat/contract-withdrawal-flow` от актуального `main` commit `28c58401c6015033a9c844a1bf92d8d2151ba1d3`.
- Добавлены локализованная страница `/withdrawal`, двухэтапное заявление и явная кнопка подтверждения; ссылка на стандартный формуляр Приложение № 6 ведёт на официальный PDF Министерства экономики и индустрии.
- Добавлен публичный `POST /api/withdrawals` с same-origin проверкой, ограничением тела, rate limit, валидацией и сохранением декларации/времени в D1; отправка подтверждения использует существующий Resend.
- Добавлены additive D1 migration `0014_contract_withdrawals.sql`, таблица заявлений и append-only журнал событий. Production D1 не изменялась.
- Добавлен Manager API и UI для просмотра/обработки заявлений и повторной отправки подтверждения с использованием существующих прав заказов.
- Privacy Policy BG/RU/EN дополнена информацией об обработке заявлений и подтверждений.
- Добавлены unit tests для валидации, локализации декларации, статусов и HTML escaping.
- Header, меню, Footer, checkout, Sanity, существующие заказы, Cloudflare settings/secrets и Production D1 не изменялись.
- CI/PR/merge/Production deployment/live smoke ещё не выполнены. Функция не опубликована; постоянная ссылка в Footer требует отдельного согласования, а юридический текст/retention — проверки болгарским юристом.

---

## 2026-11-11 — Исправление серверного маршрута страницы конфиденциальности

- Live smoke после первого релиза обнаружил HTTP 404 на /privacy-policy и локализованных URL.
- Найдена причина в явном allowlist статических страниц Cloudflare Middleware: путь не передавался SPA fallback.
- В отдельной ветке добавлен route /privacy-policy с SSR fallback H1/intro, локализованными SEO metadata, canonical и hreflang.
- Изменён файл: functions/_middleware.ts. CI/Production deployment повторной правки ещё не подтверждены.

---
## 2026-11-11 — Страница «Политика за поверителност» подготовлена в отдельной ветке

- Создана локализованная страница /privacy-policy на BG/RU/EN.
- В Footer добавлена локализованная ссылка после Copyright; в Sitemap добавлены три языковых URL и hreflang.
- Указаны текущие поставщики Sanity, Cloudflare и Resend; Supabase исключён как неиспользуемый runtime.
- Описаны категории данных заказов/заявок, техническая статистика, rate-limit hash IP, localStorage, права GDPR и контакт администратора.
- В тексте честно обозначено отсутствие автоматического удаления service leads при предусмотренном сроке пересмотра до 365 дней.
- Ветка: feat/privacy-policy-page. Изменённые файлы: src/pages/PrivacyPolicyPage.tsx, src/main.tsx, src/components/Footer.tsx, functions/sitemap.xml.ts.
- PR/CI/Production deployment/live smoke: ожидают выполнения; не считать публикацию завершённой до подтверждения.
- Юридическая проверка болгарским юристом остаётся обязательной до окончательного утверждения текста.

---
## Дополнение rev75 — аудит локализованных H1, SEO, изображений, архива заявок и AI-потоков

Дата: 11.11.2026

### Три карточки растений
- В Sanity dataset `plants` подготовлены только отдельные H1:
  - `plant-3b1f30e9-51e5-4020-847d-bdea5a403dec` — BG `Испанска ела (Abies pinsapo)`, RU `Испанская пихта (Abies pinsapo)`, EN `Spanish fir (Abies pinsapo)`.
  - `plant-dfa442af-261b-4f3b-a0c3-71686132a7e2` — BG `Кавказка ела (Abies nordmanniana)`, RU `Пихта Нордмана (кавказская пихта, Abies nordmanniana)`, EN `Nordmann fir (Caucasian fir, Abies nordmanniana)`.
  - `plant-b0e4396c-49b8-4a10-a608-ff248b95cc46` — BG `Обикновен смърч (Picea abies)`, RU `Ель европейская (Picea abies)`, EN `Norway spruce (Picea abies)`.
- Поля записаны в draft: корневое `seo.h1` (BG) и `translations.ru.seo.h1` / `translations.en.seo.h1`. Названия товаров, SEO title/description, описания, цены, варианты, категории и изображения не изменялись.
- Перед записью создан полный снимок трёх документов: `docs/backups/sanity-plant-h1-before-2026-11-11.json`.
- Публикация не выполнена: Sanity validation показывает для каждой из трёх карточек четыре ошибки типа данных — `description` и `translations.bg/en/ru.description` имеют тип String, а deployed schema ожидает Portable Text Array (`richDescription`). Validation beta сообщает, что custom callbacks не запускались. Опубликованные документы остались без изменений; H1 остаются в draft до отдельного решения по безопасному представлению старых описаний.
- В опубликованном каталоге plants найдено 43 документа: 40 уже используют Portable Text для корневого и трёх локализованных описаний и имеют новые SEO metaTitle/metaDescription; ровно эти три карточки остаются legacy исключениями.

### SEO, категории и внутренние связи
- Для трёх карточек `seo.metaTitle` и `seo.metaDescription` отсутствуют; frontend использует legacy fallback `seo.title` и `seo.description`. Локализованные названия `translations.ru.name` и `translations.en.name` заполнены, но RU для Abies pinsapo («Испанский Пихта») и RU/EN для Picea abies («Ель Смурч» / «Spruce Fir») некорректны или неестественны. До публикации новых H1 страница использует эти локализованные названия как fallback.
- Найдены ошибки локализации legacy SEO: для испанской пихты RU Title/Description содержат неграмматичное название и ошибочное написание Несебър; для Picea abies используются неестественные/неверные названия «Смърч Ела», «Ель Смурч», «Spruce Fir». Для кавказской пихты RU также используется транслитерация Несебыр вместо Несебър/Несебар. SEO поля не менялись.
- Все три товара имеют `productType=conifer` и корректную цепочку категорий: `Всички растения` → `Дървета и декоративни храсти` → `Иглолистни дървета и храсти`. `relatedProducts` и `relatedContentBySlug` пусты.
- Метаданные изображений подтверждают наличие основной и дополнительной фотографии у каждого товара. Разрешения: Abies pinsapo 2000×2000 + 1149×2002; Abies nordmanniana 2000×2000 + 1044×1309; Picea abies 1352×1484 + 748×547. Визуальная проверка содержимого файлов не выполнялась.
- ALT дополнительных изображений сейчас являются шаблонными «снимка 2» и местами оставлены на болгарском в RU/EN. ALT основной фотографии Picea abies содержит сомнительное описание «пълзящ ела с бяла пънка», не соответствующее нормальному описанию Norway spruce. ALT не изменялись.

### Архив заявок и D1
- В Cloudflare D1 `florial-db` таблица `catalog_submissions` содержит 15 записей и `catalog_submission_events` — 57 событий: 9 published, 3 draft, 2 submitted, 1 changes_requested.
- Отдельной archive-таблицы нет: owner-only вкладка «Архив заявок» в `ManagerApp` читает `catalog_submissions` (до 100 записей, сортировка по updated_at). Это отдельный legacy workflow; новый прямой каталог растений работает через Sanity Pages Functions и отдельный D1 audit.
- Таблица `service_leads` отдельно содержит 2 заявки на услуги; `orders` — 7 записей, archived_at установлен у 0. Данные D1 не изменялись.

### Разделение Google и Cloudflare AI
- Текущий Google-путь в `PlantCatalogManager`: `POST /api/manager/plants/gemini-test`, модель `gemini-3.5-flash-lite`, секрет `GEMINI_API_KEY`. UI вызывает именно этот endpoint.
- Legacy вкладка заявок использует `PlantPublicationEditor`, который по-прежнему вызывает `/api/manager/enrich-plant` и `/api/manager/enrich-plant-care`. Эти endpoints используют Cloudflare Workers AI (`@cf/meta/llama-3.3-70b-instruct-fp8-fast` и `@cf/meta/llama-3.2-11b-vision-instruct`) и GBIF для отдельной ботанической проверки.
- Cloudflare Production по-прежнему имеет binding `AI` и service binding `PLANT_CARE_WORKFLOW`; workflow `florial-plant-care-workflow` существует. Проверены 3 экземпляра: 2 complete и 1 errored. Ошибка заявки «Кавказка ела»: этап care_generation завершился невалидным JSON; диагностический кандидат `Abies concolor` не был сохранён в товар. В D1 для этой и ещё трёх заявок остались статусы plantCareJob=queued, хотя один workflow errored, а три соответствующих workflow instance возвращают 404. Это устаревшие статусы, не подтверждение работающих задач.
- `functions/api/manager/plants/ai-enrich.ts` остаётся резервным неиспользуемым endpoint; актуальная инструкция rev66 указывает, что основной UI его не вызывает. Ничего из Workers AI, workflow и Cloudflare bindings не отключалось и не удалялось.
- В Pages Production остаются legacy переменные `SUPABASE_*` и `VITE_SUPABASE_*`; текущий `managerApi` — собственный клиент Cloudflare D1, `sanity.ts` использует Sanity, Supabase SDK/runtime references в текущем коде не обнаружены. Переменные не удалялись и значения секретов не читались.

### Изменения и проверки
- Изменён только Sanity draft трёх H1 и добавлен backup JSON в GitHub. Sanity published documents, D1 rows/schema, Cloudflare settings/secrets/bindings и frontend/backend код не менялись.
- Cloudflare Pages Production deployment после backup commit `d3346733-9165-4dff-8470-8650397e9e22` завершился success; deployment commit `f7b0aa5f68b1e22339a897518dca0262c99febc1`. Документация отражает фактический статус draft-only и не заявляет публикацию H1.
- Следующее безопасное решение для Owner: разрешить или отклонить техническое преобразование 12 legacy description string fields (по 4 в каждой карточке: корневое описание и BG/RU/EN) в Portable Text blocks с сохранением исходного текста дословно; без этого Sanity не публикует H1.

---

## Дополнение rev74 — подтверждение фактической записи размера растения

Дата: 11.11.2026

- Для POST /api/manager/plants/:id/add-variant после Sanity mutation выполняется read-back целевого документа с полями saleVariants и проверкой нового элемента по _key, name, priceEUR, stockStatus=inStock и stockQuantity.
- API возвращает ok=true и variantVerified=true только после совпадения всех значений в повторно прочитанном Sanity документе. Отсутствующий/несовпадающий вариант возвращает безопасный код SANITY_VARIANT_NOT_CONFIRMED и не отображается в Manager как успешное сохранение.
- Idempotent replay теперь также проверяет фактический вариант в Sanity; повтор операции после временного сбоя проверки может подтвердить уже записанный вариант без добавления дубликата. Конфликт совпадающего _key с другими данными не считается успехом.
- UI PlantDuplicatePicker дополнительно требует ok, variantVerified, ожидаемый documentId и непустую revision перед закрытием окна и показом уведомления об успехе.
- Добавлены unit tests для полного совпадения и частичных/несовпадающих вариантов. D1 audit фиксирует отдельный код ошибки проверки read-back; секреты, содержимое фото и данные пользователя не логируются.
- Изменения ограничены add-variant API, helper/типами, PlantDuplicatePicker, тестами и документацией. Sanity schema, существующие документы и изображения не меняются; D1 schema/rows не мигрируются и не редактируются вручную; Cloudflare secrets/settings, каталог оборудования, заказы, Header/menu/Footer не затрагиваются.
- PR #194 объединён squash в `main`; merge commit `95375b28d913eb9321f4309c52df76f489492a21` (PR head `7b17a08057b5d23484cf60e3b365919e8baed429`).
- GitHub Actions: Blog and Studio validation run #832 — success (lint, tests, website build, migration syntax/read-only dry-run и Sanity Studio build); Florial D1 migration validation run #1010 на PR и #1011 после merge в main — success (lint, build, Pages Functions syntax и additive plant audit migration validation).
- Cloudflare Pages Production deployment `aecbfaf1-aa72-4ae3-aac4-bbf7365b2b0e`, URL `https://aecbfaf1.florial.pages.dev`, commit совпадает с merge commit. Стадии queued, initialize, clone_repo, build и deploy — success; aliases `https://florial-bg.com` и `https://www.florial-bg.com` назначены.
- Авторизованный live-тест добавления нового размера владельцем после публикации остаётся обязательной приёмкой; он не выполнялся автоматически, так как требует действующей Manager-сессии и осознанного production catalog write.

---

## Дополнение rev73 — очистка устаревшей старой цены при изменении цены растения

Дата: 10.11.2026

- Удалена блокирующая проверка, требовавшая, чтобы `oldPriceEUR` всегда была выше `priceEUR`. Обычное повышение текущей цены растения теперь разрешено.
- Необязательная старая цена сохраняется только если она строго выше текущей цены (то есть действительно обозначает скидку). Если старое значение отсутствует, равно текущей цене или ниже неё, оно автоматически исключается из варианта при следующем сохранении.
- Это устраняет блокировку редактирования категории/наличия/прочих полей из-за устаревшего значения старой цены, не выполняя массовую запись или миграцию Sanity.
- Добавлен изолированный helper и unit tests для реальной скидки, равной/меньшей старой цены и обычного повышения цены.
- Серверная логика прав ролей, текущей цены, вариантов, складских остатков, Sanity optimistic revision, D1 audit и другие проверки не меняются. Поля старой цены по-прежнему могут передаваться в рамках текущей формы продавца/менеджера; эта правка не расширяет права на изменение других полей.
- Затронуты: `functions/api/manager/plant-direct-lib.ts`, новые `functions/api/manager/plant-old-price-lib.mjs` и `functions/api/manager/plant-old-price-lib.d.mts`, новый `tests/plant-old-price.test.mjs`, а также документация.
- GitHub Actions PR-triggered runs/check statuses для merge commit в доступном ответе не представлены; отдельно не заявлять их как success. Cloudflare Pages production deployment `431d0604-871e-4672-8276-fd8b2dccdc14` (`https://431d0604.florial.pages.dev`) для commit `56546d921c0d3327e33054031be6185567147616` завершился success на всех стадиях queued, initialize, clone_repo, build и deploy; aliases `https://florial-bg.com` и `https://www.florial-bg.com` назначены.
- Sanity documents/assets/schema, D1 schema/rows, Cloudflare secrets/settings, оборудование, заказы и глобальные компоненты не изменялись.

---

## Дополнение rev72 — безопасная диагностика PATCH-запроса при редактировании растения

Дата: 10.11.2026

- Для `PATCH /api/manager/plants/:id` введена отдельная тестируемая проверка контракта запроса: JSON body, UUID `idempotencyKey`, объект `product` и непустая строка `expectedRevision`.
- Вместо общего `Invalid product update request` Manager API возвращает код `INVALID_PRODUCT_UPDATE_REQUEST` и только список некорректных/отсутствующих полей с болгарскими пояснениями. Значения карточки, ревизии, UUID, AI proof, фотографии и секреты не возвращаются.
- Существующие проверки авторизации, роли, same-origin, AI proof (если передан), Sanity optimistic revision, idempotency, D1 audit и сама логика записи не меняются.
- Добавлены unit tests для валидного UUID `crypto.randomUUID()`, корректного PATCH payload, невалидного JSON body и каждого обязательного поля.
- Причина исходной ошибки по конкретному сохранению пока `НЕ ИЗВЕСТНО — нужно уточнить`: после публикации диагностический ответ покажет, какой элемент запроса фактически отсутствовал/не прошёл проверку.
- Изменения ограничены `functions/api/manager/plants/[id].ts`, новым `functions/api/manager/plant-update-request-lib.mjs` и его типами, новым тестом `tests/plant-update-request.test.mjs` и документацией. Sanity schema/documents/assets, D1 schema/rows, Cloudflare secrets/settings, прочие категории и глобальные компоненты не затрагиваются.
- Unit tests для нового валидатора: 4/4 passed локально. GitHub Actions Florial D1 migration validation run #1001 завершился со статусом `cancelled`; при этом все перечисленные шаги job — Checkout, Setup Node.js, Install dependencies, Lint, Build website, Syntax-check Pages Functions и Validate additive plant audit migration — имели `success`. Не обозначать итог run как success.
- PR #192 объединён squash в `main`; merge commit `60f345650d51253e2a7d3695e507038d2ea91537`.
- Cloudflare Pages Production deployment `4b574ecd-5f9c-4b8f-9c61-cc431a53e434`, URL `https://4b574ecd.florial.pages.dev`; deployed commit совпадает с merge commit. Все стадии queued, initialize, clone_repo, build и deploy завершились `success`; production aliases `https://florial-bg.com` и `https://www.florial-bg.com` назначены.
- Авторизованный live тест редактирования растения и добавления категории после публикации остаётся обязательной приёмкой Owner. Причина прежнего запроса будет установлена по `invalidFields` нового ответа; до такого теста она остаётся `НЕ ИЗВЕСТНО — нужно уточнить`.
- Production Sanity documents/assets/schema, D1 rows/schema, Cloudflare secrets/settings, каталог поливочного оборудования, заказы, Header/menu/Footer не изменялись; production catalog writes не выполнялись.
- Изменены только `functions/api/manager/plants/[id].ts`, новые `functions/api/manager/plant-update-request-lib.mjs` и `functions/api/manager/plant-update-request-lib.d.mts`, `tests/plant-update-request.test.mjs`, `docs/TECHNICAL_PASSPORT.md` и `CHANGELOG.md`.

---

## Дополнение rev71 — автоматические повторы при временной перегрузке Gemini

Дата: 10.11.2026

- Для Gemini HTTP 502/503/504 добавлены максимум два автоматических повтора того же read-only запроса анализа с задержками 900 и 1800 мс. На каждом повторе Manager получает SSE progress; промежуточное тело ответа Google отменяется и не логируется.
- HTTP 429 (квота/лимит), 4xx, ошибки доступа, неверный запрос и ошибки потока не повторяются этой логикой. Модель `gemini-3.5-flash-lite`, endpoint, prompt, response schema, параметры генерации, API key, формат результата и AI proof не меняются.
- Если после двух повторов Google продолжает отвечать 5xx, Manager получает исходную безопасную диагностику, HTTP status, provider status, request ID и число повторов. Автоматические повторы не выполняют запись в Sanity/D1.
- Добавлены unit tests для разрешённых retry статусов, исключения 429/4xx и фиксированных задержек.
- Blog and Studio validation run #828 — success: website lint, utility tests, website build, migration syntax/dry-run и Sanity Studio build. Florial D1 migration validation run #998 — success.
- PR #191 объединён squash в `main`; merge commit `68d9b1980b1dbde0e97c1e567dd9d26e5ef2bbda`.
- Cloudflare Pages Production deployment `4870b7b6-ed1a-4a19-9901-41c4eaaea475`, URL `https://4870b7b6.florial.pages.dev`; deployed commit совпадает с merge commit. Все стадии queued, initialize, clone_repo, build и deploy завершились `success`; production aliases `https://florial-bg.com` и `https://www.florial-bg.com` назначены.
- Авторизованный live Gemini request с реальной фотографией после deployment остаётся обязательной приёмкой Owner; реальный Google 503 является временной ошибкой провайдера и не гарантирует, что повторная попытка обязательно пройдёт.
- Production Sanity documents/assets, D1 schema/rows, Cloudflare secrets/settings, каталог оборудования, заказы, Header/menu/Footer не изменялись.
- Изменены только `functions/api/manager/plants/gemini-test.ts`, `functions/api/manager/plants/gemini-test-lib.ts`, `src/manager/PlantCatalogManager.tsx`, `tests/gemini-plant-ai.test.mjs`, `docs/TECHNICAL_PASSPORT.md` и `CHANGELOG.md`.

## Дополнение rev70 — исправление UUID при добавлении варианта растения

Дата: 10.11.2026

- Причина `Invalid add-variant request.` установлена и исправлена: серверный UUID regex был неверным — не соответствовал стандартной структуре UUID `8-4-4-4-12`, поэтому отклонял `crypto.randomUUID()` браузера. Теперь проверяется полный стандартный UUID.
- Ранняя валидация запроса возвращает безопасный код `INVALID_ADD_VARIANT_REQUEST` и имена отсутствующих/неверных полей (`body`, `idempotencyKey`, `expectedRevision`, `variant`, `image`), а Manager показывает болгарские названия полей. Значения запроса, токены, AI proof и изображения не раскрываются.
- Сохранены проверки роли, same-origin, Google AI proof, Sanity asset, optimistic revision, idempotency и D1 audit. Формат Sanity и логика append варианта не меняются.
- Unit tests проверяют стандартный UUID, точный контракт запроса и диагностирование отсутствующих полей. Blog and Studio validation run #827 — success: 60 tests passed, lint, website build, migration syntax/dry-run и Sanity Studio build. Florial D1 migration validation run #993 — success.
- PR #190 объединён squash в `main`; merge commit `19f18b63d2132d5b18c334056808a314c203fee3`.
- Cloudflare Pages Production deployment `0ed7d8d2-cedb-4b76-b237-dddf4c35aad2`, URL `https://0ed7d8d2.florial.pages.dev`; deployed commit совпадает с merge commit. Стадии queued, initialize, clone_repo, build и deploy завершились `success`; production aliases `https://florial-bg.com` и `https://www.florial-bg.com` назначены.
- Live homepage fetch вернул страницу Florial с основным содержимым. Авторизованный сценарий сохранения варианта в Manager после deployment ещё должен быть проверен владельцем; Sanity production documents/assets и D1 rows/schema не изменялись.
- Изменены только `functions/api/manager/plant-duplicate-lib.mjs`, его `.d.mts`, `functions/api/manager/plants/[id]/add-variant.ts`, `src/manager/PlantDuplicatePicker.tsx`, `tests/plant-duplicates.test.mjs`, `docs/TECHNICAL_PASSPORT.md` и `CHANGELOG.md`.

---

## 2026-11-10 — PR #189: Gemini SSE parser и диагностика (merged and deployed)

Дата: 10.11.2026

- Обработчик Gemini SSE переведён на отдельный тестируемый parser с поддержкой LF, CRLF, CR, BOM, нескольких data lines, произвольного разбиения сетевых чанков и последнего события без завершающего пустого разделителя.
- Некорректное SSE JSON-событие учитывается и пропускается; последующие корректные события продолжают обрабатываться.
- В диагностике Manager показываются число SSE-событий, число некорректных событий, пропущенные строки и безопасное описание синтаксической ошибки JSON с позицией. Полный provider body и содержимое ответа в Cloudflare logs не записываются.
- Модель gemini-3.5-flash-lite, API endpoint, prompt, response schema, maxOutputTokens=8192, API key, Sanity и D1 не изменялись.
- Изменены только функции Gemini, Manager diagnostic display, unit tests и документация.
- Добавлены unit tests для BOM, LF/CRLF/CR, фрагментов чанков, EOF без пустой строки, malformed SSE event и диагностики JSON.
- PR #189 объединён squash в main; merge commit: 1bd2d62e1e386b3293bf386cd75bfe301e49d8cf.
- Blog and Studio validation #822 — success: lint, 58 tests passed / 0 failed, website build, migration syntax/dry-run и Sanity Studio build.
- Florial D1 migration validation #982 — success: lint, website build, Pages Functions syntax и additive migration validation.
- Cloudflare Pages Production deployment b0732d5d-a83b-474b-af09-8c2dfa9555ae, URL https://b0732d5d.florial.pages.dev; deployed main commit 1bd2d62e1e386b3293bf386cd75bfe301e49d8cf. Все стадии queued, initialize, clone_repo, build и deploy завершились success; aliases https://florial-bg.com и https://www.florial-bg.com назначены.
- Live smoke: главная florial-bg.com и /manager вернули HTTP 200; /manager показывает штатную болгарскую страницу входа. Авторизованный Gemini Photo/Text test после deployment остаётся обязательным и ещё не выполнен.
- Sanity schema/documents/assets, D1 schema/rows/migrations и Cloudflare secrets/settings не изменялись; production catalog writes не выполнялись.

---

## 2026-11-10 — PR #188: Manager растений и диагностика Gemini (merged and deployed)

- PR #188 squash merged в `main`; merge commit: `4e53815028d45ea22958ce4feadd1585e90f461f`.
- Cloudflare Pages Production deployment: `2c9a2e6e-67ce-4cba-8056-a84983db7621`; URL `https://2c9a2e6e.florial.pages.dev`; aliases `https://florial-bg.com` и `https://www.florial-bg.com`. Все стадии queued, initialize, clone_repo, build и deploy завершились success.
- Ботанический кандидат Google предварительно переносится в scientificName при любом confidence, только если поле не заполнено вручную; предупреждение о ручной проверке сохраняется.
- Обычный PATCH существующей карточки больше не требует Google proof; POST создания новой карточки продолжает требовать proof. Если proof передан при PATCH, он проверяется.
- Новые варианты по умолчанию имеют статус inStock. Для новых inStock вариантов требуется целое количество >0; legacy варианты без количества остаются редактируемыми без изменения существующих данных.
- Duplicate picker принимает размер, цену EUR и количество; API сохраняет inStock и stockQuantity. Google proof и проверка asset для сценария добавления варианта сохранены.
- Gemini streaming сохраняет finishReason, prompt block reason, token usage summary, bytes/chars и JSON parse status; MAX_TOKENS, safety termination и invalid JSON различаются. Секреты и полный текст ответа не логируются.
- Модель gemini-3.5-flash-lite, prompt, response schema и maxOutputTokens=8192 не менялись.
- Добавлены/обновлены тесты: plant duplicate variants, in-stock quantity validation, Gemini completion diagnostics.
- Sanity schema/data/assets, D1 schema/rows, Cloudflare secrets/settings, заказы, оборудование полива и глобальные компоненты не изменялись. Production writes и migrations не выполнялись.
- GitHub Actions Blog and Studio validation #819 — success; Florial D1 migration validation #975 — success. Lint, website tests/build, Studio build, Pages Functions syntax и additive migration validation прошли.
- Ручная приёмка Owner/Manager/Seller в живом Manager после Production deployment остаётся обязательной и ещё не подтверждена.

---

## 2026-11-10 — PR #187: обнаружение существующих растений и добавление варианта (merged and deployed)

- PR #187 squash merged в main; merge commit: 26ef412e9cddb61bea0c9d73ce2bd5dfc9aa0ddd.
- Cloudflare Pages Production deployment 02f1e592-440c-49ef-a611-234a42e60cf0 завершился success; URL https://02f1e592.florial.pages.dev, aliases https://florial-bg.com и https://www.florial-bg.com.
- Все стадии production deployment (queued, initialize, clone_repo, build, deploy) завершились success. Последующий docs-only deployment 805e66ac-80d4-4970-af6c-2b4a7ccfe2ba также завершился success.
- CI: Blog and Studio validation #807 — success; Florial D1 migration validation #957 — success. Локальные Node tests: 7/7 passed; TypeScript declaration resolution checked.
- Read-only GROQ запрос по «Цикас» / Cycas revoluta вернул две опубликованные карточки. Sanity documents/assets/schema не изменялись.
- Read-only Cloudflare D1 проверка подтвердила manager_product_audit и migration 0013_manager_product_audit. D1 rows/schema не изменялись.
- После ответа Gemini Manager проверяет опубликованные растения по основному имени, BG/RU/EN translations, scientificName и legacy plantDetails.scientificName; drafts исключены, выдача ограничена 12 карточками.
- Возле предложенного имени показывается кликабельная красная точка. Список совпадений показывает фото, название, латинское имя, категорию и существующие варианты.
- Сотрудник может выбрать существующую карточку и добавить только свободный текст размера и цену EUR. Повторяющиеся высоты/названия разрешены; отдельное поле количества стволов не создаётся.
- Проверенная Google фотография добавляется в общую gallery карточки, если её там ещё нет и общий лимит Manager в 10 фотографий (mainImage + gallery) не превышен. Главная фотография и прежние снимки не заменяются. При заполненной галерее размер и цена всё равно добавляются без фото.
- Новый вариант использует существующий plantSaleVariant: _key, name, priceEUR, stockStatus=onRequest, stockQuantity=null. Никаких новых Sanity fields, schema changes, Sanity migrations или D1 migrations.
- Append API защищён Manager session/role, same-origin, Google aiProof, проверкой asset, Sanity ifRevisionID, idempotency и D1 audit log.
- Ручная приёмка Owner/Manager/Seller в Manager остаётся pending. Изображения можно удалять/заменять через существующий редактор общей галереи.

---

## 2026-11-10 — Gemini Flash-Lite переведён в основной процесс заполнения растений

- PR #186 объединён squash в `main`; merge commit: `756784c51ada295732ee8c05b29200da5ac468a9`.
- Основной AI-процесс Manager растений теперь использует Google Gemini `gemini-3.5-flash-lite`; изолированный Owner-only test endpoint переведён в рабочий поток для ролей owner/manager/seller с проверкой `requirePlantRole`.
- В редакторе растений доступны два режима: Photo (основная фотография передаётся Google) и Text (только название; фотография и её содержимое не отправляются).
- Результат Google открывается в окне проверки. Кнопка «Да, приложи и запази» применяет AI-поля и сразу запускает существующее создание/обновление Sanity-документа. При успешной проверке не требуется второе ручное сохранение.
- Для записи endpoint выдаёт подписанный сервером `aiProof`, связанный с asset ID текущей основной фотографии. Существующие same-origin/auth проверки, проверка роли, idempotency key, optimistic revision, audit log и Sanity mutation/verification сохранены.
- AI-поля: название, тип, категория, краткое и полное описание BG/RU/EN, SEO BG/RU/EN, ALT основной фотографии в Photo режиме, а для Owner — plantCare и careGuide. Высоко-уверенный первый ботанический кандидат может быть предложен в scientificName, но UI предупреждает, что кандидат не подтверждён независимой ботанической базой.
- Коммерческие поля не генерируются и сохраняются из текущей карточки: SKU, цена, старая цена, размеры, варианты, количество и статус наличности, фотографии/галерея, isActive и isFeatured. При неполных обязательных коммерческих данных Sanity mutation не выполняется; пользователь получает ошибки валидации.
- Старый `functions/api/manager/plants/ai-enrich.ts` сохранён в репозитории для безопасного отката, но основной Manager UI больше не вызывает Workers AI. Cloudflare AI binding и секреты не изменялись.
- Runtime-файлы: `src/manager/PlantCatalogManager.tsx`, `functions/api/manager/plants/gemini-test.ts`, `functions/api/manager/plants/gemini-test-lib.ts`; тест: `tests/gemini-plant-ai.test.mjs`.
- GitHub Actions Blog and Studio validation #774 — success; Lint, website build, 41 tests (41 passed, 0 failed), Studio build, migration dry-run — success. Florial D1 migration validation #921 — success, включая Pages Functions syntax check и additive migration validation.
- Cloudflare Pages Production deployment: `2499b1ad-1ecc-402c-8d18-2f6c913c4447`; URL `https://2499b1ad.florial.pages.dev`; deployed commit совпадает с merge commit. Стадии queued, initialize, clone_repo, build и deploy завершились success; aliases `https://florial-bg.com` и `https://www.florial-bg.com` назначены.
- Существующий Production secret `GEMINI_API_KEY` не читался и не изменялся.
- Фактическая авторизованная приёмка полного сценария «Photo/Text → окно проверки → прямое сохранение в Sanity» после Production deployment, включая роли Manager/Seller, остаётся pending и должна быть выполнена в Manager.

## 2026-11-10 — Gemini Photo/Text: переход на Gemini 3.5 Flash-Lite для изолированного теста

- После повторяющихся ответов Google HTTP 503 UNAVAILABLE на модели gemini-3.8-flash тестовый Owner-only endpoint переключён на стабильную модель `gemini-3.5-flash-lite`.
- Google указывает для Gemini 3.5 Flash-Lite поддержку мультимодального ввода (включая изображения) и структурированных ответов; модель выбрана для проверки обоих режимов Photo и Text.
- Изменение ограничено только тестовым endpoint `POST /api/manager/plants/gemini-test` и отображаемой подписью модели в Owner Manager.
- Сохранены два режима Photo/Text, prompts, response schema, потоковый SSE, 300-секундный timeout, Owner-only guard, same-origin check и read-only поведение.
- Основная Workers AI кнопка, Sanity/D1, данные и схемы, Cloudflare secrets/settings, заказы, Header/menu/Footer не менялись.
- API key не читался и не заменялся. HTTP 503 UNAVAILABLE сам по себе указывает на временную недоступность/перегрузку Google, а не подтверждает ошибку ключа. Проверка ключа остаётся отдельной задачей при получении 401/403 либо другого auth error.
- PR #185 объединён squash в `main`: merge commit `8a42398c908b2dd0f0acc32121ead7fa85477b7e`.
- Blog and Studio validation #766 и Florial D1 migration validation #911 завершились success.
- Cloudflare Pages Production deployment `ce6ed89e-0d90-4ab2-bb9a-8779079cac85`, URL `https://ce6ed89e.florial.pages.dev`; все стадии queued, initialize, clone_repo, build и deploy завершились success; aliases `https://florial-bg.com` и `https://www.florial-bg.com` назначены.
- Live Owner tests Gemini Text и Gemini Photo после публикации ещё не выполнены; функциональная приёмка новой модели остаётся pending.

## 2026-11-10 — Gemini Photo/Text: диагностика обрыва потока опубликована в Production

- Добавлены heartbeat SSE события каждые 3 секунды, пока Owner тест ожидает Google или читает ответ. Они содержат только Request ID, режим, этап и прошедшее время.
- Разделены transport failures при установлении соединения Cloudflare → Google, прерывании upstream stream и обрыве SSE в браузере.
- Manager показывает последний этап, безопасный error code, Request ID, Google HTTP status/content type и счётчики полученных bytes/chars, если соответствующие данные доступны.
- Добавлены структурированные Cloudflare logs: mode, stage, HTTP status, content type, counters, stable error code и exception type. API key, auth headers, image bytes, raw provider body и raw exception messages не логируются.
- Сохранены модель gemini-3.8-flash, prompt, response schema, Owner-only guard, same-origin проверка, 300-секундный provider timeout и read-only режим.
- PR #184 объединён squash в main: merge commit 9e24b416b142cbc7f9d0373bb737c7dc72f10dbe.
- Blog and Studio validation #764 и Florial D1 migration validation #906 завершились success.
- Cloudflare Pages Production deployment 98eff424-0b8e-4ec4-8301-50891d2d99d4 для merge commit завершился success; aliases florial-bg.com и www.florial-bg.com назначены.
- Реальный авторизованный Owner тест Photo и Text после деплоя ещё не выполнен. Функциональная приёмка Gemini и фактическая причина предыдущих network error остаются НЕ ИЗВЕСТНО — нужно проверить оба режима.
- Sanity/D1 данные и схемы, каталог, основная Workers AI функция, заказы, Header/menu/Footer и Cloudflare secrets/settings не изменялись.

## 2026-11-10 — Gemini Photo/Text: потоковый Owner test опубликован в Production

- Добавлен режим Gemini Text без фотографии; запрос принимает введённое название растения (например, «лавровишня») и формирует видоспецифичный тестовый результат на BG/RU/EN.
- Gemini Photo остаётся отдельным режимом и отправляет выбранное основное изображение из Sanity plants CDN.
- Оба режима используют Google `streamGenerateContent`; Owner видит стадии, потоковые фрагменты ответа, request ID, время и структурированный итог/диагностику.
- Увеличен лимит ожидания генерации до 5 минут; отдельно различаются ошибка загрузки фото и timeout модели.
- Не затронуты основная Workers AI кнопка, Sanity/D1 данные, схема каталога, заказы и общая структура сайта.
- PR #181 merged squash в `main`: `06583f5cbdcc5e7a35d696f052e5c091f8e76c03`.
- Blog and Studio validation #757 и Florial D1 migration validation #892 завершились success.
- Cloudflare Pages Production deployment `89324a26-7360-44cd-bf42-8c1688905861` успешно завершён; aliases `florial-bg.com` и `www.florial-bg.com` назначены.
- Фактический авторизованный тест Gemini Photo/Text в Owner Manager после публикации остаётся pending.
- После фиксации документации в main: docs-sync commit `a72bbae328061730b5a6b1e3888a948950ecf037`; финальный Cloudflare Pages deployment `e55f6549-0e2d-423f-8326-d6fde198c04b` — success.

## 2026-11-10 — Gemini: диагностика ошибок Google API

- В изолированном Owner-only тесте Gemini добавлена безопасная классификация ошибок Google API: неверный запрос/response schema (400), отказ доступа или API key (401/403), модель/endpoint не найдены (404), квота (429), timeout (408/504) и временная недоступность Google (5xx).
- При ошибке Manager теперь показывает код Florial, HTTP status Google, стабильный provider status и request ID.
- Необработанное тело ответа Google, API key, заголовки и содержимое изображения не возвращаются в браузер и не записываются в логи.
- Модель gemini-3.8-flash, prompt, response schema, формат изображения, Owner-only guard и read-only поведение теста сохранены.
- Добавлены unit tests для классификации основных provider ошибок.
- CI на итоговом кодовом commit `b01bfd422ca8b97f586975b3165182cbaf955f51`: Blog and Studio validation run #740 — success (39 tests passed, lint, website build, migration dry-run, Sanity Studio build); Florial D1 migration validation run #878 — success (lint, build, Pages Functions syntax, additive migration validation). PR #180 merged squash в main: `4a26ddbb454b9c8e35b39f7d815ef1bfbff7950c`. Cloudflare Pages Production deployment `d25aad28-0a15-42d0-9ca9-6f5b394d280c` (`https://d25aad28.florial.pages.dev`) для этого commit завершился со статусом success; queued, initialize, clone_repo, build и deploy — success. Авторизованный live Gemini запрос Owner остаётся pending. Проверка HTTP через внешний web fetch в этом сеансе не состоялась.

## 2026-11-10 — Gemini plant AI test: PR #178 опубликован в Production

- PR #178 объединён squash в `main`: merge commit `ab63351def7a844f2337702c8515912e8f8724e4`; PR head `fd61e0db9c6596e17fb14f0f49fad3bf1c702323`.
- CI на PR head: Blog and Studio validation run #732 — success (lint, utility tests, website build, migration syntax/dry-run, Sanity Studio build); Florial D1 migration validation run #868 — success (lint, website build, Pages Functions syntax, additive migration validation).
- Cloudflare Pages Production deployment `2af39055-e508-491b-8670-fe2ed9ac827b`, URL `https://2af39055.florial.pages.dev`, branch `main`, deployed commit совпадает с merge commit; build и deploy — success.
- Live smoke: `https://florial-bg.com/` — HTTP 200; `https://florial-bg.com/manager` — HTTP 200, закрытая форма входа отображается, `noindex,nofollow,noarchive` сохранено.
- Cloudflare Pages project `florial` Production config содержит `GEMINI_API_KEY` типа `secret_text`. Значение скрыто Cloudflare, не считывалось и не выводилось. Конфигурация переменной подтверждена; валидность Google key, квота и доступ к модели ещё не подтверждены авторизованным запросом.
- Owner-only кнопка «Тест Gemini 3.8 Flash» и endpoint `POST /api/manager/plants/gemini-test` опубликованы. Workers AI path и основная кнопка не заменялись.
- Авторизованный live Gemini request, проверка ролей Owner/Manager/Seller и сравнение 10–15 фотографий остаются pending. Не переключать основную AI кнопку без отдельного решения Owner.
- Sanity schema/documents/assets, D1 schema/data, checkout/orders, Header/menu/Footer и глобальная структура не менялись; Gemini test не записывает данные в Sanity или D1.

## 2026-11-10 — Gemini: изолированный тест AI-заполнения растений

- Подготовлена отдельная ветка feat/gemini-plant-ai-test от актуального main commit f29fba24ae8d9db7231d3a71a8dd5dc2d381cd5e.
- Добавлен отдельный owner-only endpoint POST /api/manager/plants/gemini-test для модели gemini-3.8-flash; вызов выполняется серверным REST API Google, без SDK в браузере и без новой зависимости.
- Gemini получает только выбранную фотографию Sanity и сведения, введённые в форме Manager; результат нормализуется и возвращается только для просмотра.
- Добавлена кнопка Тест Gemini 3.8 Flash в редакторе растений Owner. Результат не подставляется в форму и не записывается в Sanity; Workers AI и текущая кнопка Попълни с ИИ остаются без изменений.
- Сервер проверяет Manager-сессию, роль Owner, same-origin, Sanity image host/project/dataset, MIME и размер фотографии; один запрос без автоматического повтора, timeout 120 секунд.
- Добавлен серверный секрет GEMINI_API_KEY в тип ManagerEnv. Сам секрет не записывался в GitHub и не менялся в Cloudflare; требуется добавить его вручную в Cloudflare Pages Production.
- Добавлены unit tests для извлечения Gemini response, нормализации JSON и валидации категорий/ботанических кандидатов.
- Sanity documents/schema/assets, D1 schema/data, Workers AI configuration, storefront, orders, Header/menu/Footer и прочие Manager sections не менялись.
- Статус: код подготовлен в feature branch; CI, PR, Production deployment и live тест Gemini ожидают завершения проверок. Ключ в Cloudflare пока не подтверждён.

## 2026-11-10 — Manager растений: обработка неопределённого визуального распознавания (PR #177)

- PR #177 объединён squash в main: `7b4bae535f17627530f06a0b72b907dc0faae61b`.
- Cloudflare Pages Production deployment: `b7eb0c58-9922-4e9f-8f60-2772c27d4de6`, URL `https://b7eb0c58.florial.pages.dev`; build/deploy success 2026-11-10 05:37:52 UTC; production aliases `florial-bg.com` и `www.florial-bg.com`.
- CI на исходном PR head: D1 migration validation #858 — success; Blog and Studio validation #726 — success. Cloudflare Pages build/deploy на итоговом merge commit также завершился success. GitHub Actions connector не предоставил отдельный run для поздних коммитов PR; это отмечено как ограничение проверки.
- Если Vision не вернул коммерческое имя, AI enrichment больше не прекращается только по этой причине. Используется временная метка «Растение за идентификация», а генерация продолжается в осторожном режиме без видоспецифичных утверждений.
- При неустановленной идентичности кандидаты из одного визуального предположения не используются для автоматического подтверждения научного имени через GBIF.
- Manager предупреждает продавца и блокирует сохранение до замены временной метки реальным названием растения.
- Runtime файлы: `functions/api/manager/plants/ai-enrich.ts`, `src/manager/PlantCatalogManager.tsx`.
- Обновлены `docs/TECHNICAL_PASSPORT.md`, `CHANGELOG.md`, создана актуальная инструкция rev56.
- Sanity documents/schema/assets, D1 data/schema, dataset `production`, checkout/orders, global Header/menu/Footer, Cloudflare settings/secrets не изменялись.
- Авторизованный live photo acceptance остаётся открытым: нужно проверить результат на реальной фотографии в Manager после деплоя.

- В AI enrichment устранён ранний отказ `AI_PLANT_IDENTITY_UNCLEAR`, который прерывал весь процесс, если Vision не возвращал коммерческое имя, даже при наличии полезного визуального описания/кандидатов.
- При отсутствии уверенного имени используется только временная метка «Растение за идентификация». Генерация продолжается в осторожном режиме: модель не должна выдавать вид и видоспецифичный уход как установленные факты.
- Ботанические кандидаты при неустановленной идентичности не отправляются на автоматическое подтверждение GBIF; научное имя не заполняется на основании одного неуверенного визуального предположения.
- Manager показывает предупреждение и требует заменить временную метку реальным названием перед сохранением. Публикация/сохранение с временной меткой блокируется.
- Изменены только `functions/api/manager/plants/ai-enrich.ts` и `src/manager/PlantCatalogManager.tsx`.
- Санити-документы, схемы и assets, D1, dataset `production`, заказы, общая структура сайта, Header/menu/Footer, Cloudflare settings/secrets не изменялись.
- CI workflows на PR head initial commit: D1 migration validation #858 — success; Blog and Studio validation #726 — success. Последние два комментарных/логических изменения после запуска workflow не были отдельно подтверждены отдельным workflow run на их SHA; требуется финальная проверка CI для итогового PR head до merge.
- Live authenticated photo acceptance не выполнена; реальный результат модели нужно проверить в Manager после production deployment.

## 2026-11-10 — Manager растений: надёжность AI и индикация ожидания (PR #175)

- PR #175 merged by squash: `d76cf69a315aac6c688732922b2539ed97445dcb`.
- Production Cloudflare Pages deployment: `97ac4255-c6ec-4fe2-876c-4bab2d6cacac`, URL `https://97ac4255.florial.pages.dev`; build and deploy success at 2026-11-10 05:22:31 UTC; aliases `https://florial-bg.com` and `https://www.florial-bg.com`.
- CI: Blog and Studio validation #724 success; Florial D1 migration validation #854 success. Website lint, utility tests, website build, Pages Functions syntax, read-only migration dry-run and Sanity Studio build passed.
- Изменены только `src/manager/PlantCatalogManager.tsx` и `functions/api/manager/plants/ai-enrich.ts`.
- Workers AI vision and text model per-call timeout increased from 20 to 45 seconds; one bounded retry remains. Sanity image fetch increased 10→15 seconds; GBIF lookup 8→10 seconds; browser request timeout 150→300 seconds. Aborted browser requests are not retried.
- Manager now displays a compact elapsed-time counter and progress bar next to the photo AI button. The bar estimates elapsed request time and explicitly does not claim to represent the model's actual completion percentage.
- Failed AI responses now expose actionable Bulgarian messages, error code, processing stage and request ID. Vision timeout is distinguished from an inconclusive plant identification; text-generation timeout and invalid model JSON have separate messages.
- The earlier user-visible generic failures were consistent with the 20-second per-call cap being too aggressive for a multi-stage request (photo vision, optional botanical candidate lookup, three-language content generation and possible quality retry). Per-request runtime details for the user's earlier attempts were not present in retained telemetry, so the exact underlying provider error remains unconfirmed.
- No Sanity records/schema, D1 schema/data, irrigation catalogue, checkout/orders, global header/menu/footer, or Cloudflare settings/secrets changed.
- Authenticated live acceptance with a new plant photo is still pending. Owner/seller should retry after deployment and report the request ID if an error remains.

## 2026-11-10 — Manager растений: PR #173 опубликован в Production

- PR #173 merged by squash: `87048514d0ee5f73980b8ddf450ae0358bd76812`.
- Изменены только:
  - `src/manager/PlantCatalogManager.tsx`
  - `functions/api/manager/plants/ai-enrich.ts`
  - `functions/api/manager/plant-direct-lib.ts`
  - `functions/api/manager/plants.ts`
  - `functions/api/manager/plants/[id].ts`
- Production Cloudflare Pages deployment: `445cf59b-f019-471f-b567-d0758bf0b15e`, URL `https://445cf59b.florial.pages.dev`, build/deploy success 2026-11-10 05:04:16 UTC; aliases `https://florial-bg.com` and `https://www.florial-bg.com` assigned.
- CI on latest PR head: Blog and Studio validation #721 success (lint, utility tests, website build, Pages Functions syntax, migration dry-run, Sanity Studio build); Florial D1 migration validation #849 success.
- AI button `Попълни с ИИ` moved to the plant image area and becomes available after a main photo is added. A seller-entered name is no longer required.
- Cloudflare Vision model `@cf/meta/llama-3.2-11b-vision-instruct` now proposes a Bulgarian common name, likely botanical candidates, an allowed `productType`, and a category selected only from actual category IDs supplied by Manager. Low/medium visual confidence is explicitly warned; the seller can correct the name, type and category after AI completion.
- `scientificName` remains conservative: it is automatically populated only after an exact accepted GBIF species match with the existing high-confidence rules. A visual suggestion by itself is not scientific confirmation.
- The AI completion proof is HMAC-signed with the authenticated HttpOnly Manager session and bound to the selected main-image asset. It is valid for two hours. Create and edit APIs reject a save without a valid proof; changing the main image requires a new AI run. Manual correction of the suggested name/type/category after AI does not invalidate the proof.
- AI request waits are bounded: model calls 20 seconds each with one server retry, image fetch 10 seconds, GBIF lookup 8 seconds, browser request 150 seconds. The browser no longer repeats a full server AI timeout response; it shows a clear error instead of spinning indefinitely.
- Save/publish is enabled only after a successful AI run and at least one real size is entered (positive sale height or container volume). The same size requirement is checked by the server for both create and edit.
- On explicit save only, root legacy `priceEUR` is set to the minimum current `saleVariants[].priceEUR`; root `oldPriceEUR` is set to the minimum populated `saleVariants[].oldPriceEUR`, or null when no variant has an old price. Variant prices remain canonical for storefront/cart/order. Root `stockQuantity` is not aggregated or changed. No mass migration or existing Sanity document update was performed.
- No Sanity schema/documents/assets, D1 schema/data, irrigation dataset, checkout/orders, global header/menu/footer, or Cloudflare settings/secrets were changed.
- Manual authenticated end-to-end acceptance of a fresh plant photo by a seller/Owner is still pending. CI and production deployment are confirmed; a live Manager session test is required to confirm the model's real response for a sample photo.

## 2026-11-10 — PR #172 merged: восстановлено полноценное AI-заполнение растений

- PR #172 merged by squash: 6b10b44f999f2dbf40a46e447bbd9c1175a9756d.
- Runtime-файлы: functions/api/manager/plants/ai-enrich.ts, src/manager/PlantCatalogManager.tsx.
- Восстановлена генерация содержательных BG/RU/EN описаний с практическими разделами по освещению, почве, дренажу, поливу, подкормке, обрезке, посадке, сезонным особенностям и использованию в озеленении. Добавлена проверка полноты ответа и повтор генерации, если тексты слишком короткие.
- Ботанические кандидаты определяются по введённому названию, типу, категории и описанию продавца; фотографии не используются для определения вида. scientificName автоматически заполняется только при высокой уверенности AI и точном подтверждении GBIF: matchType=EXACT, rank=SPECIES, status=ACCEPTED, confidence >=95. Иначе научное имя остаётся пустым, кандидаты показываются Owner для проверки.
- Улучшен ALT основной фотографии: Vision ориентируется на выбранное растение, а не фон/ряд других товаров; пустой результат Vision повторяется один раз. ALT создаётся на BG/RU/EN только по видимым деталям.
- Возвращены Owner-only структурированные plantCare и careGuide; для Manager/Seller эти поля не возвращаются и не отправляются в API. Черноморская пригодность всегда остаётся needsVerification, пока Owner не проверит её.
- Добавлены серверный retry для временных/невалидных ответов модели, client retry для retryable ошибок и понятные stage/code диагностики. Все непустые ручные значения сохраняются.
- CI на итоговом PR head: Blog and Studio validation #714 — success; Florial D1 migration validation #840 — success. Проверены lint, utility tests, website build, Pages Functions syntax, migration regression и Sanity Studio build.
- Cloudflare Pages Production deployment bcca7c97-928f-4db5-a5e8-001314d23502, URL https://bcca7c97.florial.pages.dev, commit 6b10b44f999f2dbf40a46e447bbd9c1175a9756d: build и deploy success 2026-11-10 04:18:56 UTC; aliases florial-bg.com и www.florial-bg.com активны.
- Sanity schema/documents/assets, D1 schema/data, irrigation dataset production, checkout/orders, Header/menu/Footer, Cloudflare settings/secrets не изменялись. AI enrichment формирует черновик в форме; запись в Sanity происходит только после явного сохранения/публикации пользователем.
- Открытая приёмка: проверить AI в авторизованном Owner и Manager интерфейсе на новом/черновом растении. Реальный end-to-end запрос Workers AI + GBIF с авторизованной сессией ещё не выполнялся. Опубликованная карточка «Лавровишня храсти» не изменялась; её уже заполненные текстовые поля не будут автоматически перезаписаны текущим режимом заполнения только пустых полей. Для её исправления требуется отдельное согласованное действие.

## 2026-11-10 — PR #171 merged: упрощённый Manager растений опубликован в Production

- PR #171 (`feat(manager): simplify plant editor for Seller and Manager`) успешно объединён методом squash. Merge commit: `40b695821736b6499e58140337e8169d71f14279`.
- GitHub Actions прошли успешно на итоговом коде: Florial D1 migration validation run #831 и Blog and Studio validation run #707. Проверены lint, website utility tests/build, Pages Functions syntax, migration regression checks и Sanity Studio build.
- Cloudflare Pages Production deployment `ef7e07a9-09b3-4b9a-948d-0454ff05dbc5`, URL `https://ef7e07a9.florial.pages.dev`, commit `40b695821736b6499e58140337e8169d71f14279`: build success и deploy success (2026-11-10 03:37:28 UTC). Aliases `florial-bg.com` и `www.florial-bg.com` активны.
- PR scope: упрощение формы Seller/Manager; Owner сохраняет полный доступ к ALT, SKU, slug, переводам и SEO. Выбор только конечных категорий; автогенерация имени размера; проверка уникальности slug в опубликованных и draft документах; AI заполняет пустые описания, переводы, SEO и ALT основной фотографии.
- Изменены только `src/manager/PlantCatalogManager.tsx`, `functions/api/manager/plants.ts`, `functions/api/manager/plants/[id].ts`, `functions/api/manager/plants/ai-enrich.ts` и техническая документация.
- Не изменялись Sanity documents/schema/assets, D1 schema/data, irrigation dataset `production`, checkout/orders, Header/menu/Footer, Cloudflare settings/secrets. Live Sanity write operations не выполнялись.
- Открытая приёмка: проверить авторизованные Owner и Manager на реальном интерфейсе; Seller profile отсутствовал в последнем D1 audit, Seller-session QA остаётся pending. Дополнительные тестовые товары в Sanity не создавались.


- `src/manager/PlantCatalogManager.tsx`: Seller и Manager больше не показывают ALT, SKU товара/размера, slug, ручные переводы и SEO; Owner сохраняет полный доступ. Существующие скрытые значения остаются в состоянии формы и передаются при сохранении, чтобы не очищать уже заполненные данные.
- Категории в форме выбора и фильтре ограничены конечными категориями без родительских пунктов; при сохранении в payload остаются только выбранные конечные категории.
- Имя варианта автоматически формируется при пустом поле: высота → диапазон ±5% с округлением до целых и префиксом «Размер», объём контейнера → `C{литры}`. Автоимя обновляется при изменении высоты/контейнера до ручного редактирования. Внутренний флаг автоимени не передаётся в API.
- `functions/api/manager/plants.ts` и `functions/api/manager/plants/[id].ts`: при создании и ручном изменении Owner система проверяет slug в опубликованных и draft документах Sanity dataset `plants`; для новых товаров при совпадении добавляет суффикс `-2`, `-3` и т. д.; существующие URL не меняются без действия Owner.
- `functions/api/manager/plants/ai-enrich.ts`: AI response теперь возвращает ALT основной фотографии на BG/RU/EN; SEO H1/metaTitle/metaDescription возвращается для BG/RU/EN с безопасным локальным fallback, если модель не вернула обязательное значение.
- AI enrichment в UI заполняет пустые поля и сохраняет уже заполненные вручную значения: описания, переводы, SEO и ALT основной фотографии.
- Не изменялись Sanity документы/схема/assets, D1 данные/схема, irrigation dataset `production`, checkout/orders, Header/menu/Footer и Cloudflare settings/secrets.
- Проверки CI, PR review, merge и Production deployment — ожидают выполнения. Live Sanity write operations не выполнялись.

## 2026-11-10 — PR #170 merged, D1 0013 applied, Production deployment successful

- PR #170 (feat/manager-plants-direct-editor-final) was marked ready and merged into main.
- Merge commit: 24c90b929692fa6b7a306caf31a31803128ab203.
- Before merge, both GitHub workflows completed successfully on synchronized PR head 741ac6bffca48406fe6eaf28d64d87ee944bacd7: Florial D1 migration validation and Blog & Studio validation (including Sanity Studio build).
- Applied additive migration docs/migrations/0013_manager_product_audit.sql to Cloudflare D1 florial-db (database UUID 5fbb0e47-8439-493c-821a-6945eef7d8b2, EU jurisdiction). Verified schema_migrations contains 0013_manager_product_audit, table manager_product_audit, and append-only UPDATE/DELETE triggers. Existing tables and rows were not deleted or rewritten.
- Cloudflare Pages project florial automatically deployed merge commit to Production: deployment 832b9bbc-2777-4b48-96ed-5af252591a06, URL https://832b9bbc.florial.pages.dev, build and deploy stages success (2026-11-10 02:33 UTC).
- Custom domains florial-bg.com and www.florial-bg.com both report active in Pages.
- New Manager code is live. Scope: plant catalogue dataset plants; irrigation dataset production, Sanity schema/documents/assets, orders/checkout, public Header/menu/Footer and Cloudflare secrets/settings were not changed by this release.
- Live D1 still has active Owner and Manager profiles; Seller profile was not found. Seller-session QA and hands-on mobile/role acceptance remain pending. Pages Preview deployments remain disabled.
- No claim of end-to-end Manager CRUD against Sanity is made yet; production deployment success confirms build/deploy, not authenticated runtime acceptance.

## Точное подтверждение Cloudflare Pages deployments

- Commit `fb1d440251415fc31acfa31b216e82968aa2928c` → Production deployment `4d48f564-8845-4912-bbb3-723cebaebbc7`, status `success`, 2026-11-09 20:01 UTC.
- Commit `52f7192b4a1cbe37359f56de72e300e8fc1f7823` → Production deployment `0f1d33bb-739d-4758-9cb7-edb5a972ede1`, status `success`, 2026-11-09 20:06 UTC.
- Оба commit изменяли только пока не подключённый `src/manager/PlantCatalogManager.tsx`; `src/manager/ManagerApp.tsx` в main не импортировал его.
- Preview deployments для соответствующих feature branches были skipped с `preview_deployments_disabled`.

## 2026-11-09 — final CI result for plant Manager implementation

- Code commit `d53ba337c855e906873a1a7e27276e575e07559c` passed both GitHub workflows:
  - Blog & Studio validation: success — website lint, utility tests, website build, migration syntax/dry-run, Sanity Studio install/build.
  - Florial D1 migration validation: success — lint, website build, Pages Functions syntax, SQLite migration 0013 test.
- Later commit `b29803843eee4e2ded9e82705fad9320e5147718` contains documentation updates only; runtime code is unchanged from the fully validated code commit.
- CI does not validate live Sanity writes or live D1 migration; no Production data was changed.
- Preview deployment remains disabled and mobile acceptance remains open.

## Дополнение 2026-11-09 — UI media и AI ALT

- Редактор поддерживает выбор существующих Sanity assets через `PlantImageLibrary` и загрузку новых фотографий; обе операции доступны Owner/Manager/Seller.
- Поддерживается множественный выбор категорий и подкатегорий; основная категория задаётся отдельно, все ссылки сохраняются.
- При обычном редактировании неизменённый Portable Text сохраняет исходное форматирование; при ручном изменении текста он преобразуется в обычный Portable Text блок.
- AI использует Workers AI text model для описаний/переводов/SEO и Vision model для визуального ALT только основной фотографии. Остальные фотографии получают ALT вручную. Vision не определяет вид растения и не генерирует биологические свойства.
- Live D1 migration не применялась; изменения остаются в Draft PR #170.

## 2026-11-09 — PR #170 validation and deployment audit

- GitHub Actions at `495b873856202d9ab19e31d765bbe351dd66e16e`: Blog & Studio validation success; D1 migration validation success. Lint, website tests/build, Pages Functions syntax, SQLite migration test and Studio build passed.
- SQL test ran in isolated SQLite memory DB only. Live Cloudflare D1 `0013_manager_product_audit` remains unapplied.
- Pages Preview for PR branch is skipped because `preview_deployments_disabled`; no real preview/mobile acceptance.
- Two main commits `fb1d440251415fc31acfa31b216e82968aa2928c` and `52f7192b4a1cbe37359f56de72e300e8fc1f7823` changed only the currently unconnected `PlantCatalogManager.tsx` component. Both Pages Production deployments completed successfully; main `ManagerApp.tsx` does not import it, so the Manager UI/public behavior did not change. Full integration remains in Draft PR #170.
- Pages project still contains legacy environment variable names `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`. New code does not read them; they were not modified. Separate runtime usage audit is required before removal.
- No Seller profile found in live D1; Seller-session QA remains pending.

## 2026-11-09 — Manager растений: первая реализация в Draft PR #169

- В отдельной mainline-based feature branch подготовлен новый mobile-first Manager для dataset Sanity `plants`.
- Новые Pages Functions: `GET/POST /api/manager/plants`, `GET/PATCH /api/manager/plants/:id`, `POST /api/manager/plants/ai-enrich`, Owner-only `GET /api/manager/plant-audit`; общие функции — `plant-direct-lib.ts`.
- UI: `src/manager/PlantCatalogManager.tsx`; ManagerApp направляет все три роли в каталог, старый submissions workflow оставлен Owner-only архивом.
- Owner/Manager/Seller используют существующую D1 cookie session. Роли берутся из D1 profile; новая система не создаёт параллельную авторизацию.
- Sanity mutations ограничены dataset `plants`; создание idempotent, PATCH использует `ifRevisionID`; root legacy price/stockQuantity автоматически не переписываются.
- AI заполняет текст/переводы/SEO, не создаёт цены, SKU, варианты, остатки или ботанические сведения.
- Добавлена аддитивная SQL migration `0013_manager_product_audit` и SQLite regression test. Live D1 на момент read-only аудита остановлена на `0012_service_leads_manager`; migration 0013 не применялась.
- В live D1 обнаружены 1 активный Owner и 1 активный Manager; Seller profile не обнаружен. Реальные профили и данные не менялись.
- CI для PR #169 выполняется; Preview deployment настройкой Pages помечен как отключённый. Production rollout не выполнялся.
- Не затронуты Sanity schema/documents/assets, orders/checkout, irrigation dataset `production`, Header/menu/Footer, staff permissions, Cloudflare secrets/settings.

## 2026-11-09 — завершён read-only аудит цены/наличия растений

- `CategoryPage.tsx`: цена карточки растения — минимальная положительная `saleVariants[].priceEUR`; root price не используется. Наличие сначала берётся из root `stockStatus` (inStock/onRequest), затем из вариантов.
- `ProductPage.tsx`: цена и скидка выбранного размера берутся из варианта; статус/количество — вариант с root fallback.
- `CartPage.tsx`: цена варианта приоритетна, root price — fallback.
- `functions/api/orders.ts`: для plants обязателен `variantKey`; сервер проверяет цену по `saleVariants[].priceEUR`, отклоняет `outOfStock`, допускает `onRequest` с положительной ценой; фактический `stockQuantity` сейчас не проверяется. Order items сохраняют snapshot.
- `functions/api/manager/order-products.ts`: варианты растений выдаются отдельными selectable позициями; цена/наличие берутся из saleVariant.
- Спецификация уточнена: variant price — canonical; root price не синхронизировать автоматически; root stockStatus должен быть агрегатом для согласованности CategoryPage, но root stockQuantity не суммировать; mixed status в Manager list показывать отдельно.
- Дробный stockQuantity для растений не подтверждён; заказное количество integer 1–999.
- Это read-only аудит; runtime, Sanity, D1 и Production не менялись.

## 2026-11-09 — спецификация прямого мобильного Manager для растений

- Создана `docs/ROADMAP_MANAGER_PLANTS.md`: только Sanity dataset `plants`, роли Owner/Manager/Seller с direct create/edit/publish, Owner-only history и botanical fields, AI-enrich для всех ролей.
- Проверены текущие Manager files/API, D1 migrations, Sanity schema `product` / `plantSaleVariant`; read-only count: 36 опубликованных растений и 17 категорий.
- Зафиксировано, что текущий Manager ещё использует `catalog_submissions` и отдельный approval/publish workflow; текущий publish endpoint ограничен Owner/Manager и ровно одним sale variant; AI endpoint привязан к submission и не разрешает Seller.
- Отдельно отмечено несоответствие root `priceEUR` и variant prices в части legacy документов; storefront/cart/order price contract должен быть проверен до реализации.
- Это документационная работа в branch `docs/manager-plants-direct-management`; runtime, Sanity, D1 data/schema, staff permissions, orders и Production не изменялись. CI/deployment для этой ветки не заявляются.

## 2026-11-09 — приостановка CLS-оптимизации и возврат к предыдущему route layout (PR #163)

- PR #163 merged squash; merge commit `a12068bc3a8a4707f70e19abc76ecf382d98eabe`.
- Отменён только route-content height reservation из PR #156 в `src/App.tsx`.
- Отменён только SEO fallback image dimension helper из commit `9bd5d3f`: исходный fallback HTML возвращён к прежней разметке; helper и его изолированный тест удалены.
- Сохранены responsive images, Sanity API CDN, lazy route chunks, Hero LCP, исправление Manager PR #161 и все прочие функции.
- GitHub Actions D1 validation run `42652345312` и Blog/Studio validation run `42652345147` — success; lint, utility tests, website build, Pages Functions syntax, migration syntax/read-only dry-run и Sanity Studio build прошли.
- Cloudflare Pages Production deployment `6cab6c9b-7490-4b1e-8bb2-57fcc9c53070` — build/deploy success; aliases `florial-bg.com` и `www.florial-bg.com`.
- Browser Rendering вернул HTML главной; дальнейшие route requests были ограничены HTTP 429, поэтому полная browser route regression не подтверждена. Новые CLS/Lighthouse/INP измерения не проводились.
- Header, меню, Footer, Sanity, D1, API, Manager, checkout и Cloudflare configuration не изменялись. Заказы, оплаты и реальные заявки не создавались.

## 2026-11-09 — исправление отправки заявок на растения из Manager (PR #161)

- Исправлен серверный переход `draft → submitted` для роли `owner`: владелец теперь может отправить собственную новую заявку на проверку.
- Для `seller` сохранена и дополнительно проверена возможность отправлять только собственную заявку; продавец не может отправлять чужие заявки, переводить их в review/approval/rejection или публиковать.
- Матрица статусов вынесена в `canSetCatalogSubmissionStatus` в `functions/api/manager/_lib.ts`; endpoint `functions/api/manager/data.ts` использует единый helper. Права менеджера по-прежнему зависят от индивидуальных permissions.
- Добавлен `tests/catalog-submission-status.test.mjs`: шесть сценариев для owner, seller, manager и защищённых статусов публикации.
- PR #161 merged squash; merge commit `3f8a363ee60b6355209c36d821d50ab80267d806`.
- GitHub Actions: Blog and Studio validation run `42649059860` — success; D1 migration validation run `42649059911` — success. Проверки: lint, `npm test` (34 passed, 0 failed), Vite production build, Pages Functions syntax, read-only description migration dry-run, Sanity Studio build и D1 migration validation.
- Cloudflare Pages Production deployment retry `35abbc66-d88a-4492-8783-87f827642441` для merge commit завершился `success`; aliases `florial-bg.com` и `www.florial-bg.com` назначены. Первичная попытка `b60516f3-3980-403e-b499-37c13f60360d` завершилась transient `Unknown internal error occurred` на публикации Function; retry прошёл успешно.
- Не выполнялись D1 migrations или записи в Production D1; реальные заявки, профили сотрудников и события не изменялись. Sanity documents/assets/schema не изменялись. Не затрагивались Header, меню, Footer, корзина, checkout, заказы и публичный каталог.
- Отдельные авторизованные browser sessions Owner/Seller не использовались; фактический role matrix подтверждён unit tests, но не live submit тестовой заявкой. Тестовые заявки не создавались.

## 2026-11-09 — PR #156: reserve shared route content height and post-release CLS verification

- PR #156 merged into `main`: merge commit `70335b7064e6c61c9d53b4c3f3769fd91c8f5ee2`; changed only `src/App.tsx` (+8 lines).
- Added `shouldReserveRouteContentHeight` for category, product, service-detail, search and blog routes; the existing Suspense boundary now sits inside a shared `flex-grow min-h-screen` content wrapper for those routes. This keeps the Footer outside the initial viewport while route chunks/data resolve.
- Header, menu, Footer component, individual page components, page content, routes, SEO, product/cart/checkout/order/Manager logic, Sanity documents/schemas, D1, APIs, Cloudflare settings/rules/secrets and environment variables were not changed.
- CI passed: Florial D1 migration validation and Blog and Studio validation. Website lint/build, Pages Functions syntax, utilities tests, D1 read-only dry-run and Sanity Studio build all succeeded.
- Production deployment `5658ac34-ce79-440a-ac9b-57262ef13ba3` from `main` commit `70335b7064e6c61c9d53b4c3f3769fd91c8f5ee2` succeeded and owns aliases `florial-bg.com` and `www.florial-bg.com`.
- Controlled mobile CLS retest (390×844, CPU 4×, 150 ms, 10/1.5 Mbps, cache disabled, 3 runs): homepage median `0.0002`; irrigation category `0.3441`; product `0.0002`; blog `0.0002`; article `0.0143`. Before PR #156: `0.0002`, `1.0443`, `0.7005`, `0.6124`, `0.7805` respectively. Footer-driven shifts on product/blog/article are effectively eliminated; category improved by about 67%, but retains a separate `0.34385` shift in two of three runs whose source node is not exposed by the browser Performance API. Do not claim category CLS is fixed.
- Post-release smoke: all tested routes returned HTTP 200; zero failed images. Category plants 29/28 responsive srcsets; search 45/44; planting service 9/8; about 8/7; contacts 3/0; cart 1/0; irrigation category 32/31; product 4/3; blog 23/22; article 5/4. SPA category → product → Back → Forward navigation succeeded.
- Short pages `/about`, `/contacts`, `/cart` do not receive the `min-h-screen` route wrapper; the wrapper applies only to dynamic/long routes. Their page content and route rendering remain intact.
- Remaining: investigate category-specific CLS residual; repeat desktop CLS/INP and Lighthouse/field CrUX when available. This PR does not claim overall site speed or Core Web Vitals are fully optimized.

---
## 2026-11-09 — Controlled route CLS audit and stale-base deployment root cause

- Repeated controlled mobile route CLS capture on current Production (`390×844`, CPU 4×, 150 ms latency, 10 Mbps down / 1.5 Mbps up, browser cache disabled; 3 runs per route). Session-window grouping: 1-second gap, 5-second maximum window.
- Median session CLS: homepage `0.0002`; irrigation category `/category/vsichko-za-polivane` `1.0443`; product `/product/musa-banana` `0.7005`; blog `/blog` `0.6124`; article `/blog/montazh-podmyana-remont-razpruskvachi-nesebar` `0.7805`. Values reproduced in all three runs per route in this lab browser. These are lab measurements, not field CrUX data.
- The dominant layout-shift source is the `FOOTER` element on category, product, blog and article routes. Category also has an earlier shift from unidentified nodes. The repeated pattern is consistent with short route loading placeholders being replaced by full asynchronous page content in `src/App.tsx`, causing the Footer to move. Do not edit Footer.
- Confirmed the earlier Pages alias mismatch was caused by stale-base commits being deployed from `main`: commit `51ef6b56...` (MD2 rev35) has parent `612b4713...` and its tree predates PR #148–#152; commit `6a4eea12...` (MD2 rev41) has parent `2f35bf31...` and predates PR #152. Their successful Pages builds served older runtime bundles. This was not a browser cache issue.
- Current main chain is `a88ce6ca...` (PR #152 runtime) → `859dfb10...` (MD2 rev42) → `81114ccd...` (PR #154 documentation recovery). Current Production deployment `28d3d2c0-6046-4c75-8a2c-723b4e89c9eb` is successful and aliases `florial-bg.com` and `www.florial-bg.com`; it serves `index-DFmXNYJ3.js` with the correct PR #148–#152 runtime.
- No application code, Sanity documents/schemas, D1 data, order APIs, Manager, Header/menu/Footer, Cloudflare cache rules/settings/secrets or environment variables were changed during this CLS audit. The shared loading-area fix in `src/App.tsx` requires explicit user approval under MD2 rev42.
- Detailed report: `docs/performance/POST_OPTIMIZATION_ROUTE_CLS_2026-11-09.md`.

---
## 2026-11-09 — Production deployment recovery after Pages alias mismatch

- Audit found that `florial-bg.com` was serving deployment `2ea7f7f0-3340-4cea-b64d-0bd5e20c7fb2` from commit `51ef6b56f475232275dceb0a5ad94310cee9d768`, whose published bundle was the older `index-DVSEkUpQ.js` (742,368 B). The correct build from current `main` commit `859dfb10c75108d9a4609de424b420fa622bac68` was already available as deployment `146a68ed-b69b-46c8-b470-ff58ba1ae201` but did not hold the production aliases.
- Compared deployment assets: the correct deployment serves `index-DFmXNYJ3.js` (357,247 B), containing route-level chunks, responsive image helper widths including 160w/240w and the PR #152 Hero image implementation.
- Used the Cloudflare Pages deployment rollback operation to restore deployment `146a68ed-b69b-46c8-b470-ff58ba1ae201` to production. Rollback completed successfully; aliases now include `https://florial-bg.com` and `https://www.florial-bg.com`.
- Production smoke at 390×844: `/`, `/category/rastenia`, `/category/vsichko-za-polivane`, `/product/musa-banana`, `/search?q=контролер`, `/blog`, `/blog/montazh-podmyana-remont-razpruskvachi-nesebar`, `/services/zasazhdane-na-rasteniya` all HTTP 200.
- Responsive image checks: homepage 23 images/22 srcsets; plant category 29/28; irrigation category 32/31; product detail 4/3; search 45/44; blog 23/22; article 5/4; planting service 9/8. Zero failed images and zero browser JavaScript page errors. Homepage Hero has an eager high-priority Sanity image.
- No application source files, Sanity documents/schemas, D1 data, order APIs, Manager, Header/menu/Footer, Cloudflare settings, cache rules, secrets or environment variables were changed. Only the existing Pages deployment alias was rolled back to a previously successful build.
- Remaining: investigate why the later deployment from commit `51ef6...` produced an older runtime bundle; repeat controlled CLS capture on internal routes. The proposed shared loading-area change in `src/App.tsx` remains blocked pending explicit user approval under MD2 rev42. No shared layout or Footer changes made.

---
## 2026-11-09 — Homepage Hero LCP (PR #152)

- PR #152: [optimize homepage Hero LCP image](https://github.com/omaraandrey-dev/florial/pull/152), merge commit `a88ce6ca513abcad4b7ee107c441fa62ec570ec3`, Production deployment `6cad50d7-291a-4004-ae15-b77786f3d292` — success.
- Controlled PerformanceObserver capture confirmed the actual HomePage LCP element was the CSS Hero background PNG (1518×957, 2,704,931 B).
- Replaced only the background image with a decorative responsive `img` using the existing Sanity helper; `srcSet`, `sizes=100vw`, `auto=format`, `fit=max`, `q=75`, eager loading and `fetchPriority=high`. Same centered cover crop, same `rgba(247,248,241,0.68)` overlay and unchanged Hero section/content.
- Mobile profile 390×844, CPU 4×, 150 ms, 10/1.5 Mbps, cache disabled, 3 runs: LCP median 3,620→696 ms (−80.8%); image 2,704,931→17,439 B (−99.4%); CLS 0.00025→0.00025.
- Desktop profile 1440×900, same network/CPU profile, 3 runs: LCP median 3,908→912 ms (−76.7%); image 2,704,931→141,597 B (−94.8%); CLS 0.01417→0.01417.
- Browser selected 480w AVIF on mobile and 1518w AVIF on desktop. No preload hint added.
- CI: website/Studio validation `42604050648` and D1 validation `42604050707` — success.
- Additional regression finding: homepage CLS remains low, but category/product/blog/article routes show large shifts while async route content replaces short loading states. Category source inspection shows the Footer moving from the viewport to below the fold. Likely shared loading-area reservation issue in `src/App.tsx`; no fix applied because it affects shared layout and requires explicit approval. Report: `docs/performance/POST_OPTIMIZATION_HERO_LCP_2026-11-09.md`.
- Header logo (~656 KB), Header/menu/Footer, Cart/checkout, Manager, Sanity documents/schemas, D1 data, API/order logic and Cloudflare settings were not changed.

---

## 2026-11-09 — Sanity CDN и адаптивные изображения (PR #148–#150)

- PR #148: [responsive Sanity images](https://github.com/omaraandrey-dev/florial/pull/148), merge commit `0b72d45021230e7d286b42dfb116acd6ca47ee80`, Production deployment `113205bf-630b-4586-a873-223dac8a9140` — success. Общий helper `src/lib/sanityImage.ts` применён к HomePage cards, BlogSection, BlogPage, BlogPostPage/Portable Text, ServicePage и AboutPage.
- PR #149: [Sanity API CDN split](https://github.com/omaraandrey-dev/florial/pull/149), merge commit `606d7c8c26daee641a1890a786b54b1decda5340`, Production deployment `6b84da59-f2a8-4d8b-90a1-ed415d2272b9` — success. Public published content uses `sanityClient` / `publicPlantsClient` with `useCdn: true` and `perspective: 'published'`. Product/plant product price-stock queries, product search/details, delivery tariffs, Manager reads and order validation remain live via `sanityLiveClient` / `plantsClient` or direct server API.
- PR #150: [catalog and product images](https://github.com/omaraandrey-dev/florial/pull/150), merge commit `2f35bf3151f68ecb64288ba861b97b084d21b1c9`, Production deployment `100ac60e-28b9-4da3-8dc1-7197743844c4` — success. Responsive images added to CategoryPage, ProductPage and public product search; below-first-four category cards are lazy-loaded.
- Production helper uses Sanity responsive widths 160–1600w, `srcSet`, `sizes`, intrinsic dimensions, `fit=max`, `auto=format`, `q=75`. No Sanity documents/schema or data changed.
- Controlled `/category/rastenia` mobile profile: 390×844, CPU 4×, latency 150 ms, 10/1.5 Mbps, browser cache disabled, 3 runs. Median FCP 428→408 ms; DCL 575→562 ms; load event 691→691 ms. Do not interpret these small timing differences as a large page-speed gain.
- Category initial image-response capture: approximately 17.9 MB before PR #150 versus 1,081,732 B after (about 94% lower). Before: 26 original image responses/no srcSet. After: 28 of 29 DOM images have responsive srcSet; 17 images load initially, all 29 load after scroll, zero failed images. The post capture includes the untouched Header logo and an original social-preview image request. Details: `docs/performance/POST_OPTIMIZATION_CDN_AND_IMAGES_2026-11-09.md`.
- Read-only Sanity comparison: CDN cache policy 60 seconds; repeated simple query cache hits about 10–12 ms versus 116–140 ms against live API in the same browser session. Browser network confirms public content via `apicdn.sanity.io` and price/stock/delivery queries via live `api.sanity.io`.
- Cloudflare audit: hashed JS/CSS are `HIT` with year-long immutable cache; HTML remains `DYNAMIC` despite `s-maxage=300`. No custom Cache Rules/Page Rules found. No Cloudflare settings/rules/secrets changed.
- SPA mobile regression after PR #147: Home → Services → planting service; Back/Forward and scroll restoration within 20 px; no JS page errors or failed images. Product detail `/product/musa-banana` and public content routes render with no failed images.
- CI: PR #148 Blog/Studio runs `42600383444`, `42600375484` and D1 run `42600375557` — success; PR #149 Blog/Studio `42601448043` and D1 `42601447670` — success; PR #150 Blog/Studio `42602177767`, `42602171310` and D1 `42602171428` — success.
- Header logo (1547×581 PNG, about 656 KB) and HomePage Hero background intentionally remain unchanged; Header/menu/Footer layout was not touched. Header logo optimization requires separate approval.
- Lighthouse/CrUX, LCP, INP and CLS are still unmeasured. Public HTML edge caching remains a separate task; do not enable broad cache rules without path-specific exclusions for Manager, API, cart, checkout, orders and personalized routes.

---

## 2026-11-09 — Отложенная загрузка публичных страниц (PR #147)

- PR #147: https://github.com/omaraandrey-dev/florial/pull/147 — squash merge в `main`; merge commit `b35b5e499700d0330a7ea43ca1ca09e4f6cad7e8`.
- Изменён только `src/App.tsx`.
- `HomePage` остаётся в initial bundle. Десять остальных page components переведены на React.lazy named-export imports: AboutPage, CartPage, ContactsPage, ServicesListPage, ServicePage, CategoryPage, ProductPage, BlogPage, BlogPostPage, IrrigationSupportPage.
- Добавлена одна Suspense boundary вокруг route content. Header и Footer остаются снаружи; fallback использует существующую локализуемую строку `Зареждане на страницата...`. Route predicates, callbacks, state, Sanity fetches, props и SEO в самих страницах не менялись.
- CI Blog and Studio validation run `42592562970` — success (lint, utility tests, website build, migration syntax, read-only migration dry-run, Studio install/build). D1 validation run `42592563158` — success.
- Production Cloudflare Pages deployment `20836dfd-7536-4379-be50-2c865800c814` — success; deployed commit совпадает с merge commit; aliases `florial-bg.com`, `www.florial-bg.com`.
- Live direct-route smoke: homepage BG/RU/EN; /about; /cart (пустая корзина); /contacts; /services; planting service; irrigation delivery support; plant/equipment category roots; Rain Bird valve product; Trachycarpus product; /blog; Rain Bird article; search Rain Bird (130 results). Все 16 адресов отрендерили содержимое; Suspense/loading placeholders не остались.
- Production build chunks: `index` 388.90 kB raw / 106.91 kB gzip против предыдущего PR #146 `index` 620.15 kB raw / 163.82 kB gzip. Main entry уменьшился на 231.25 kB raw и 56.91 kB gzip (≈34.74% gzip). Отдельные lazy chunks: BlogPage 3.67/1.68 kB, ContactsPage 7.23/2.48 kB, BlogPostPage 8.67/3.27 kB, ServicesListPage 12.21/4.28 kB, CartPage 23.14/6.16 kB, IrrigationSupportPage 24.19/7.31 kB, ServicePage 26.27/8.35 kB, AboutPage 35.76/9.59 kB, ProductPage 46.80/12.52 kB, CategoryPage 47.41/12.60 kB (raw/gzip). Это build artifact gzip comparison, не live wire transfer и не общий page speed result.
- Полная SPA navigation/scroll restoration regression и post-release browser resource list после PR #147 не завершены; Firecrawl interaction в момент проверки вернул concurrency limit. Direct route rendering проверен.
- No Sanity schema/documents, D1, API, Manager, cart/checkout logic, Header/menu/Footer layout, Cloudflare settings/secrets changed. No real order created.

---

## 2026-11-09 — Отложенная загрузка Manager (PR #146)

- PR #146: https://github.com/omaraandrey-dev/florial/pull/146 — squash merge в `main`; merge commit `eef48358030cc04c7c8105f66b74013cfc20997a`.
- Изменён только `src/main.tsx`.
- Static import `ManagerApp` заменён на `lazy(() => import('./manager/ManagerApp'))`. Компонент загружается только при первоначальном URL `/manager` или `/manager/*`; добавлен небольшой Bulgarian Suspense fallback `Зареждане на панела за управление…`.
- Public branch `LanguageProvider + App`, точная route detection, Manager auth/session/API logic, permissions и интерфейс не менялись.
- CI Blog and Studio validation run `42591541092` — success (lint, utility tests, website build, migration syntax, read-only migration dry-run, Studio install/build). D1 validation run `42591541240` — success.
- Production Cloudflare Pages deployment `5ae924f2-29ba-446b-ab8c-be44e121eabb` — success; deployed commit совпадает с merge commit; aliases `florial-bg.com`, `www.florial-bg.com`.
- Live smoke: `/` BG и `/?lang=ru` рендерятся; `/manager` и `/manager/` показывают существующий болгарский экран входа. На public homepage loaded JS assets: `index-yNnEwJtM.js` и runtime; ManagerApp chunk отсутствует. На `/manager` загружается отдельный `ManagerApp-BJhBJlxh.js` (47,518 B transfer) и вызывается auth bootstrap endpoint. Вход не выполнялся, реальные данные не менялись.
- Single unthrottled remote-browser JS timing sample, viewport 1920×993: до изменения один main JS asset — 209,165 B transfer; после на public route index 160,495 B + runtime 656 B = 161,151 B, на 48,014 B (22.96%) меньше. Manager chunk 47,518 B загружается только на /manager. Это один desktop sample без CPU/network throttling и cache control, не controlled mobile baseline и не измерение общей скорости страницы.
- No changes to ManagerApp source, API, D1, Sanity, cart/checkout, Header/menu/Footer, Cloudflare settings/secrets.

---

## 2026-11-09 — Компактные карточки блога и устранение повторной загрузки (PR #145)

- PR #145: https://github.com/omaraandrey-dev/florial/pull/145 — squash merge в `main`; merge commit `6897cb1ad4ef4bb8429838c83f11c515ad9fec80`.
- Runtime files: `src/lib/blog.ts`, `src/components/Header.tsx`, `src/components/BlogSection.tsx`, `src/pages/BlogPage.tsx`, `src/pages/BlogPostPage.tsx`.
- Введена compact blog-card GROQ projection: `_id`, slug, publishedAt, cover URL/ALT/caption, BG/RU/EN title, shortDescription, coverAlt. Из list projection исключены Portable Text body, gallery, SEO и tags.
- Полная detail projection оставлена для одной статьи по slug; сохраняет все локализованные body, SEO, tags, cover и gallery.
- `fetchBlogPosts(limit)` использует in-memory promise cache на 60 секунд с отдельными ключами для top-3 и полного списка. Header и BlogSection запрашивают один и тот же top-3 promise; ошибки удаляют соответствующую запись cache, устаревший запрос не может удалить более новую запись.
- `/blog` и related articles используют compact cards. `BlogPostPage` загружает полный текст только для открытой статьи, а список похожих статей получает из compact projection.
- Sanity read-only: top-3 compact projection вернула 3 документа (ответ инструмента 4,668 символов); полный список — 22 документа (29,597 символов). Это длина вывода read-only query, не encoded network transfer.
- Full detail projection проверена на опубликованных статьях: `montazh-podmyana-remont-razpruskvachi-nesebar` — 47,544 символа; `rain-bird-oborudvane` — 35,000 символов. BG/RU/EN Portable Text, cover, gallery и SEO поля сохраняются; Sanity dataset `production`, project `bxvcy0qs`. Никаких Sanity writes/schema changes.
- CI Blog and Studio validation run `42590188304` — success: lint, utility tests, website build, migration syntax, read-only migration dry-run, Studio install/build. D1 validation run `42590188234` — success.
- Cloudflare Pages Production deployment `1f9145d2-7aeb-46e7-840d-e79af9e70a68` — success; deployed commit совпадает с merge commit; aliases `florial-bg.com` и `www.florial-bg.com`.
- Live rendered smoke BG/RU/EN: homepage — 3 article cards; `/blog` — 22 article links; Rain Bird article detail — full localized content, cover/gallery and related links; no blog loading placeholders. Header Portfolio menu was opened and displayed 3 recent article links plus full blog CTA.
- No visual/layout changes to Header/menu/Footer; no cart/checkout, Manager, D1, API, Sanity content/schema or Cloudflare configuration changes.
- Live PerformanceResourceTiming check after release: 8 Sanity API URLs, all distinct; one compact top-3 blogPost query (158 ms). Previous diagnostic had 9 Sanity requests including duplicate blog query. This confirms one duplicate request was removed. Cross-origin transferSize/encodedBodySize/decodedBodySize are 0; this is not a byte measurement or controlled baseline capture. Lighthouse/LCP/INP/CLS not measured; do not claim an overall speed percentage.

---

## 2026-11-09 — Post-release Sanity diagnostic after PR #142–#144

- Создан отчёт `docs/performance/POST_OPTIMIZATION_SANITY_DIAGNOSTIC_2026-11-09.md`.
- Remote browser не поддержал viewport 390×844, cache disable и throttling; Performance API cross-origin `transferSize=0` не подходит для подсчёта полного transfer.
- Дополнительные read-only Sanity fetch с `cache:no-store` измерили 1,077,038 B decoded response bodies across 9 requests. Не сравнивать с baseline encoded transfer и не указывать процент ускорения.
- Два одинаковых blogPost-запроса по 145,912 B каждый всё ещё выполняются при загрузке главной; обе проекции включают body и gallery. Следующий этап — единая compact blog-card projection.
- Lighthouse/LCP/INP и controlled CDP post-release measurement остаются открытыми.

---

## 2026-11-09 — Компактная загрузка категорий по требованию (PR #144)

- PR #144: https://github.com/omaraandrey-dev/florial/pull/144 — squash merge в `main`; merge commit `dd129898f207018e5124f7fa2604ff9a727ccd9a`.
- Изменён только `src/App.tsx`.
- Первоначальные equipment и plant category GROQ projections теперь возвращают компактный индекс: ID, name, локализованные имена, slug, sortOrder, parentId, image URL/ALT/TITLE и флаг типа каталога. Убраны полные description, SEO и helpBlock, а также полные переводы категорий.
- При открытии конкретного `/category/:slug` приложение выбирает корректный Sanity dataset (`production` или `plants`) и запрашивает полную запись категории: локализованные descriptions, SEO/H1/noIndex, helpBlock, изображение и иерархию.
- CategoryPage ожидает загрузку деталей до рендера. Добавлены cancellation guard при смене маршрута, защита от показа устаревшей категории и fallback на компактную категорию при ошибке detail-запроса.
- Сохранены данные, нужные Header/menu, HomePage, AboutPage, ProductPage breadcrumbs и CategoryPage subcategory cards: локализованные имена, slug, parentId, sortOrder, image URL/ALT/TITLE, isPlantCategory.
- Sanity read-only GROQ queries compact/detail проверены на project `bxvcy0qs`, datasets `production` и `plants`; обе выборки detail выполнились успешно. Никаких Sanity document/schema writes.
- CI PR #144: Blog and Studio validation run `42588551106` — success (lint, utility tests, website build, migration syntax, read-only migration dry-run, Sanity Studio install/build); D1 validation run `42588551110` — success.
- Cloudflare Pages Production deployment `d93cc80d-1475-49d1-a798-a08587b6b2dd` — success; deployed commit совпадает с merge commit; aliases `florial-bg.com` и `www.florial-bg.com`.
- Live rendered smoke: plant root `/category/rastenia` BG/RU/EN; irrigation root `/category/vsichko-za-polivane` BG/RU/EN; child categories `/category/palmi-yuki`, `/category/klapani`; categories with configured helpBlock `/category/rotorni-razprskvachi` BG/RU and `/category/tsitrusi` BG/EN. Confirmed localized H1/title/descriptions, images, category/product cards and help text; no category loading placeholder remained after client-side load.
- Не менялись Sanity schema/documents, product data/queries, search, cart/checkout, D1, API, Manager, Header/menu/Footer layout, Cloudflare settings/secrets. Real orders were not created.
- Post-release network transfer/Lighthouse/LCP/INP/CLS measurement for PR #144 not yet performed; no percentage improvement claimed.

---

## 2026-11-09 — Компактный каталог, детали товаров по требованию и 6 карточек на главной (PR #143)

- PR #143: https://github.com/omaraandrey-dev/florial/pull/143 — squash merge в `main`; merge commit `e7d33432b134825dc2fb065a8e254b363e73e67d`.
- Runtime-файлы: `src/App.tsx`, `src/pages/HomePage.tsx`.
- Главная: отсортированные категории растений и поливочного оборудования ограничены первыми 6 карточками в каждом блоке. Порядок и приоритет категорий сохранены. Добавлены локализованные CTA в полные каталоги `/category/rastenia` и `/category/vsichko-za-polivane`.
- Первоначальные GROQ-запросы товаров и растений стали компактными: поля карточек, цены, наличие, артикулы, категории и связи, нужные каталогам; для растений сохранены saleVariants и только четыре plantCare-поля, необходимые фильтрам. Из начальной загрузки убраны описания, галереи, SEO, manuals/catalog PDFs, спецификации, compatibility, care guides и связанные материалы.
- Полные записи оборудования и растений запрашиваются только при открытии detail route. Detail-запросы сохраняют поля ProductPage, включая галереи, Portable Text, SEO, характеристики, совместимые данные, состав комплектов, related products/content, plant care/care guide и sale variants. Для растений связанные услуги/статьи и рекомендованный irrigation product разрешаются при открытии растения.
- Полнотекстовый поисковый индекс загружается только на /search; сохранён поиск по названиям, описаниям, категориям и характеристикам оборудования. Ошибки отдельных поисковых датасетов и вторичных plant lookups обрабатываются независимо.
- Sanity read-only проверка GROQ: компактные equipment/plant projections, detail queries, kitComponents, recommended irrigation product и plant related-content запросы выполнены успешно на project `bxvcy0qs`, datasets `production` и `plants`. Никакие Sanity documents/schema не изменялись.
- CI PR #143: Blog and Studio validation run `42587640231` — success (lint, utility tests, website build, migration syntax, read-only migration dry-run, Sanity Studio install/build); D1 validation run `42587640149` — success.
- Cloudflare Pages Production deployment `7169a06c-cd7d-4184-b47c-083a9f3cdb2a` — success; deployed commit совпадает с merge commit; aliases `florial-bg.com` и `www.florial-bg.com`.
- Live rendered smoke: homepage BG/RU/EN — ровно 6 plant-category и 6 irrigation-category карточек + соответствующие catalog CTA; оба root catalog routes доступны; equipment product Rain Bird 100-PGA-9V; plant Trachycarpus detail BG/RU/EN и variants; irrigation kit detail и components; plant filters; search `Rain Bird` — 130 results. После ожидания client-side Sanity load промежуточные loading messages отсутствуют.
- Не проверялись реальный add-to-cart click, checkout/order creation, browser console и полная ручная SPA-регрессия. Реальные заказы не создавались.
- Измерение post-release transfer size / Lighthouse / LCP / INP для PR #143 не выполнялось. Не приписывать этому PR конкретный процент ускорения до повторного browser/network capture.
- Не менялись Sanity data/schema, D1, API, Manager, cart/checkout logic, Header/menu/Footer, Cloudflare settings/secrets или environment variables.

---

## 2026-11-09 — Оптимизация загрузки страниц услуг (PR #142)

- PR #142: https://github.com/omaraandrey-dev/florial/pull/142 — squash merge в `main`, commit `e9b49a42ee7cfdfd385cf7fce8706ab71c93b7bb`.
- Изменён только `src/App.tsx`: первоначальный GROQ-запрос услуг теперь загружает компактные поля для меню, главной, списка услуг и About; полные описание, hero, галерею, content blocks, related content, преимущества, этапы, CTA, форму и SEO запрашивает отдельный запрос на странице конкретной услуги.
- Сохранены локализованные имена/краткие описания BG/RU/EN, существующий slug, сортировка и специальный маршрут доставки. Добавлены состояния загрузки деталей и отмена устаревшего запроса при смене маршрута.
- CI PR #142: Blog and Studio validation run `42584605993` — success (lint, utility tests, website build, migration syntax check, read-only migration dry-run, Sanity Studio dependencies/install/build); D1 validation run `42584606037` — success.
- Cloudflare Pages Production deployment `001a7aeb-a6f7-4bd0-b963-d9a1f38f2ca0` — success; deployed commit совпадает с merge commit `e9b49a42ee7cfdfd385cf7fce8706ab71c93b7bb`; aliases `florial-bg.com` и `www.florial-bg.com` назначены.
- Live rendered smoke после ожидания client-side загрузки: услуга посадки открылась на BG/RU/EN с локализованным содержанием; страница `/services` доступна и отображает список услуг. Мгновенный scrape до завершения клиентского запроса показывал промежуточный текст «Зареждане на страницата...»; после ожидания 7 секунд полное содержимое получено. Browser console и ручной SPA-клик-тест в этой проверке не выполнялись.
- Не менялись товары/растения/категории, поиск, фильтры, корзина, checkout, Manager, Header/menu/Footer, Sanity schema/documents, D1 data, API и Cloudflare settings. В initial product/plant queries пока сохраняются тяжёлые поля; оптимизация каталога продолжается отдельным этапом.
- В Cloudflare Pages environment metadata обнаружены legacy-переменные с префиксом `SUPABASE`. Это не доказывает использование Supabase приложением и не относится к PR #142. Ничего не удалялось и не менялось; проверить ссылки в исходниках и согласовать отдельную очистку. Вопрос: разрешить ли отдельную проверку и удаление неиспользуемых legacy env vars после подтверждения отсутствия runtime-зависимостей?

---

## 2026-11-09 — MD2 rev33: homepage image optimization checkpoint

- Published new instruction edition `docs/ИНСТРУКЦИЯ(2)_FLORIAL_АКТУАЛЬНАЯ_09-11-2026_rev33.md`, commit `a4ff4c5652a03ecb282a474a28994e71b18b6dc9`.
- rev33 preserves rev32 and records PR #141, production deployment, CI, before/after mobile network measurements, remaining Lighthouse/LCP/desktop checks and the next Stage 1 consumer-map task.
- Previous MD2 editions remain intact; no historical instruction was overwritten.

## 2026-11-09 — Homepage responsive image optimization (PR #141)

- PR #141 merged squash in `main`: `b635aa4e307da86b11f70595f9da8a3c3d444074`; only `src/pages/HomePage.tsx` changed.
- Added responsive Sanity CDN image URLs for homepage service/plant-category/equipment-category cards (320–1200w), `srcSet`, `sizes`, `fit=max`, `auto=format`, `q=75`, explicit `loading=lazy`, `decoding=async`, and width/height. Existing layout, `object-cover`/`object-contain`, ALT/TITLE, links preserved. Hero CSS background intentionally unchanged.
- Production deployment `81b26460-1c58-408c-9cc3-c485e256ec45` — success; aliases `florial-bg.com` and `www.florial-bg.com`. Live BG/RU/EN home routes return HTTP 200. BG DOM: 38 img, 34 srcSet/sizes, 37 lazy (logo eager).
- Mobile initial-load network capture, 3 runs, same 390×844 / CPU 4× / 150 ms / 10 Mbps profile: total transfer median 12,929,319 bytes vs baseline 42,874,746 (≈−69.8%); image transfer median 8,980,844 vs 38,921,410 bytes (≈−76.9%). Sanity XHR stayed ~3.73 MB, as expected.
- Detailed measurement: `docs/performance/POST_OPTIMIZATION_HOME_IMAGES_2026-11-09.md`; baseline updated with before/after section.
- CI: Blog and Studio validation run `42582485634` success (lint, tests, website build, Sanity Studio build); D1 migration validation `42582485603` success.
- No changes to Sanity schema/documents, D1, API, checkout/cart, Manager, Header/menu/Footer, BlogSection, Cloudflare settings/secrets or production data. Full scroll-through visual review, post-optimization desktop run, Lighthouse/LCP/INP/CrUX remain outstanding.

## 2026-11-09 — Этап 0: первый baseline производительности Florial

- Создан отчёт `docs/performance/BASELINE.md` (commit `90ab9a2d62e5cdbe628f802e7d9a9205e8d5661e`) по реальным browser/network measurements Production главной.
- Mobile 390×844, CPU 4×, latency 150 ms, 10/1.5 Mbps, 3 прогона: медианы TTFB 163 ms, FCP 380 ms, DOMContentLoaded 553 ms, Load 554 ms. Desktop 1365×900, 3 прогона: TTFB 53 ms, FCP 136 ms, DOMContentLoaded 146 ms, Load 147 ms.
- CDP network capture: 42,874,746 bytes (≈40.89 MiB); изображения — 38.92 MB (90.8%), 10 Sanity XHR — 3.73 MB (8.7%), app JS — 207.5 KB, CSS — 12.1 KB.
- Подтверждены 38 image responses, преобладание оригинальных Sanity assets, 34 image elements с loading=auto, только 3 с явным lazy loading; Hero — CSS background PNG около 2.58 MiB.
- Полный equipment-products GROQ query передал около 3.33 MB и выполнялся около 9.8 s в мобильном throttled-профиле. Header и BlogSection дважды запрашивают один и тот же список трёх статей с body/gallery (около 145.9 KB каждый до транспортного сжатия).
- HTML в проверках имел `cf-cache-status: DYNAMIC`; fingerprinted JS/CSS — `HIT`, `max-age=31536000, immutable`.
- BG/RU/EN главные: HTTP 200, корректные lang/title/H1, `robots=index, follow`. Page errors и HTTP 4xx/5xx не обнаружены; тестовый браузер блокировал только Cloudflare Insights beacon.
- Lighthouse API вернул 429 (PageSpeed API quota=0); LCP entry не получен, INP и TBT не измерялись. Stage 0 отмечен как частично завершённый, эти ограничения явно зафиксированы.
- Обновлена `docs/ROADMAP_PERFORMANCE_OPTIMIZATION.md` (commit `10edcd57aef958a4d1d62d1ad611e619e6d65fdf`).
- Изменения только в документации. Runtime-код, Sanity schema/documents, D1, API, Manager, checkout, Cloudflare settings/secrets и Production data не менялись.

## 2026-11-09 — Internal links on five planting-service photos

- Sanity document `cfdbf22c-a7d9-480b-b88b-d1529a9389ef`, slug `zasazhdane-na-rasteniya`: assigned `contentBlocks[].image.linkUrl` for all five inline photos in their existing article order.
- Photo 1 → `https://florial-bg.com/category/rastenia` (plants dataset category `plants-root`).
- Photo 2 → `https://florial-bg.com/category/darveta-i-hrasti` (plants dataset category `plants-trees-shrubs`).
- Photo 3 → `https://florial-bg.com/category/soliteri-edrorazmerni` (plants dataset category `plants-solitaires`).
- Photo 4 → `https://florial-bg.com/category/tsvetya-i-rozi` (plants dataset category `plants-flowers`).
- Photo 5 → `https://florial-bg.com/category/kapkovo-napoyavane` (production dataset category `e577ef6b-d164-488f-b2f0-29ff7e8e7e9b`).
- All five category documents were found in their respective published Sanity datasets. Existing image assets, order, markers, ALT texts, main Hero image, article text and form were preserved.
- Before-write snapshot committed: `docs/backups/sanity-service-zasazhdane-na-rasteniya-before-category-image-links-2026-11-09.json` (GitHub commit `e4d2ee328e0096a48e6dee134238c95db4587744`).
- Draft was verified to contain the five requested URLs, then published. Published Sanity revision: `9Jlb6k9xfgGTkBekNEY2fH`.
- External live page fetch via web cache was unavailable in this run; therefore live click-through is not claimed. Sanity published-data verification passed.

## 2026-11-09 — Стандарт создания и редактирования услуг Florial

- Добавлены `docs/SERVICE_CONTENT_PLAYBOOK.md` (полный операционный стандарт) и `docs/PROMPT_SERVICE_CREATION_AND_EDITING.md` (готовый промпт для нового чата).
- Документы сохранены также в Library: `/Florial/SERVICE_CONTENT_PLAYBOOK.md` и `/Florial/PROMPT_SERVICE_CREATION_AND_EDITING.md`.
- Зафиксированы проверенные поля Sanity service, фактическая логика H1/H2/H3 и Portable Text/Markdown, SEO BG/RU/EN, ALT/linkUrl, inline image markers, relatedContent и service lead form.
- Создана следующая контрольная инструкция MD2 rev25; rev24 и предыдущие версии сохранены.
- Только документационные изменения: код, Sanity schema/documents, D1, API, Manager, checkout и Production не менялись.

---

## 2026-11-09 — Услуги: ссылки на изображения и связанные материалы

- PR #134 объединён в `main` (squash merge commit `627953676e0cef853704a648693e7cf57284bfcc`). Добавлены необязательные поля `linkUrl` к изображениям услуг (основное изображение, Hero, галерея, контентные блоки) и универсальный массив `relatedContent` с ссылками на услуги, статьи, товары и категории.
- Frontend `src/App.tsx`, `src/pages/ServicePage.tsx`, `src/types.ts`: ссылки изображений обрабатываются с локализацией внутренних URL; связанные материалы отображаются компактными адаптивными карточками с изображением слева и текстом справа. Добавлен маркер `__gallery:watering` для размещения фото в соответствующем разделе статьи.
- Sanity Studio schema deployed успешно: GitHub Actions run `42553313954`; проверено через Sanity schema API — поля `service.relatedContent` и `linkUrl` доступны в service/serviceContentBlock. Используется существующий Studio workspace `florial-admin`; новые Studio apps не создавались.
- Перед изменением Sanity опубликованного документа создан JSON snapshot: `docs/backups/sanity-service-zasazhdane-na-rasteniya-2026-11-09.json`. Попытка полного копирования dataset через Sanity CLI недоступна на текущем плане; резервная копия конкретной услуги сохранена в GitHub.
- Новая фотография капельного полива загружена в Sanity asset `image-3bfa49590b6f3271e64a2666411feeacf1f785c4-1152x1536-jpg`. Добавлена в существующую услугу `zasazhdane-na-rasteniya` в разделе «Поливане и грижи след засаждането», с BG/RU/EN ALT и ссылкой на `/services/avtomatizirano-kapkovo-napoyavane`. Основное фото, заменённое пользователем в Studio, сохранено без изменений.
- В опубликованную услугу добавлен локализованный абзац о капельном поливе на BG/RU/EN и блок связанных услуг: `profesionalno-zasazhdane-na-maslini` и `avtomatizirano-kapkovo-napoyavane`. Существующая форма заявки сохранена.
- CI: lint, utility tests, website build, Pages Functions syntax, read-only migration dry-run, Studio build и D1 validation — success. Sanity Studio validate run `42553145922` — success.
- Cloudflare Pages Production deployment `7a53b3b5-0898-48f2-a249-50f71617ae91` для merge commit — success; aliases `florial-bg.com` и `www.florial-bg.com`.
- Live smoke BG/RU/EN подтверждён: новая фотография присутствует, её ссылка открывает страницу капельного полива, обе связанные карточки локализованы, форма заявки присутствует. Header, меню, Footer, D1, Manager, API и URL услуги не менялись.

---


## 2026-11-09 — Выпущена инструкция Florial MD2 rev23

- Новая редакция `docs/ИНСТРУКЦИЯ(2)_FLORIAL_АКТУАЛЬНАЯ_09-11-2026_rev23.md` сохранена в GitHub main и Library `/Florial/ИНСТРУКЦИЯ(2)_FLORIAL_АКТУАЛЬНАЯ_09-11-2026_rev23.md`.
- Rev23 фиксирует переработку услуги посадки растений, PR #132/#133, успешный Production deployment `4b21e8f0-c841-4c7f-8488-f70c92845bef` и live smoke BG/RU/EN. Rev22 сохранена без перезаписи.

## 2026-11-09 — Переработана услуга «Посадка растений»

- Обновлён существующий Sanity document cfdbf22c-a7d9-480b-b88b-d1529a9389ef по адресу /services/zasazhdane-na-rasteniya; URL и категория planting сохранены.
- Существенно расширены BG/RU/EN тексты, H2/H3, bold/strong, списки, преимущества и этапы. Заполнены локализованные SEO title, meta description, keywords, H1, краткие описания и ALT изображений.
- Перенесены внутрь статьи четыре существующие фотографии; Hero оставлен главным изображением. Повторные ссылки на фото в верхней галерее убраны, сами Sanity assets сохранены.
- PR #132 merged d7ee50f55f4df03013f006ef47fe89ae31d56f3d; PR #133 merged c3b0d53d4c395d96881e4ab0f33d641caf10f32a. PR #133 также сохраняет прежние image group mapping услуг оливковых деревьев и автоматического полива.
- CI обеих веток: lint, tests, website build, Pages Functions syntax, read-only migration dry-run, Sanity Studio build — success. D1 validation workflows — success.
- Production deployment 4b21e8f0-c841-4c7f-8488-f70c92845bef — success. Live smoke BG/RU/EN: HTTP 200, H1/SEO, index/follow, изображения, преимущества, этапы и форма заявки проверены.
- Sanity schema, D1, Manager, orders, checkout, Header, меню и Footer не менялись; тестовые заявки не создавались.

## 2026-11-08 — Публикация услуги «Профессиональная посадка маслин»

- Создана и опубликована услуга Sanity `6afc3eff-944c-4085-a48c-38686999b0f3` по адресу `/services/profesionalno-zasazhdane-na-maslini`, категория `planting`, порядок 25.
- Подготовлены естественные BG/RU/EN тексты с H1/H2/H3, агротехнически скорректированной технологией посадки, преимуществами, этапами работы и CTA.
- Загружены четыре оригинальные фотографии; одна используется как Hero, три — внутри статьи. Заполнены локализованные ALT BG/RU/EN и SEO title/description/keywords.
- Настроена существующая форма заявок услуги через `/api/service-leads`; тестовую заявку не отправляли, чтобы не создавать реальный лид.
- PR #130: поддержка Markdown и Portable Text заголовков, выделений и списков в `ServicePage.tsx`; PR #131: более крупное отображение одиночных фотографий без обрезки и без повторного ALT в подписи. Оба PR объединены в `main`.
- GitHub Actions: lint, tests, website build, Pages Functions syntax, D1 read-only validation и Sanity Studio build — success.
- Cloudflare Pages Production deployment `afbaa0c5-3659-46bc-8998-8716f7c09fe7` — success. Live smoke BG/RU/EN: HTTP 200, H1, SEO metadata, index/follow, фотографии и форма заявки проверены.
- Существующие услуги, Sanity schema, D1, Manager, orders, checkout, Header, меню и Footer не изменялись.

## 2026-11-08 — Выпущена основная инструкция Florial MD2 rev22

- Создана новая контрольная редакция `docs/ИНСТРУКЦИЯ(2)_FLORIAL_АКТУАЛЬНАЯ_08-11-2026_rev22.md` и сохранена в Library: `/Florial/ИНСТРУКЦИЯ(2)_FLORIAL_АКТУАЛЬНАЯ_08-11-2026_rev22.md`.
- Rev22 фиксирует merge PR #129 (`01f21becb40d847270c83b12a3f54d37049d5c67`), успешный Production deployment `d0e2791b-401a-4c52-83f1-1e56d5fe5342`, CI, post-deploy smoke и оставшиеся задачи authenticated role matrix / retention. Предыдущая rev21 сохранена без перезаписи.
- Документы `TECHNICAL_PASSPORT.md`, `ROADMAP_SERVICES_AND_LEADS.md` и `CHANGELOG.md` актуализированы после merge; roadmap status дополнительно исправлен, чтобы не оставлять историческую отметку «PR #129 открыт».
- Отдельный аудит legacy Cloudflare environment variable names `SUPABASE_*` / `VITE_SUPABASE_*` остаётся открытым. Переменные не менялись и не удалялись.

---

## 2026-11-08 — Этап 6: PR #129 объединён и опубликован в Production

- PR #129 `fix: align delivery fee and sanitize seller permissions` объединён методом squash в `main`; merge commit: `01f21becb40d847270c83b12a3f54d37049d5c67`. PR закрыт со статусом merged.
- Перед merge актуальный HEAD ветки `fbaa97a4e4b6ace9c35a1a3553c4c07b832ef3e5` прошёл GitHub Actions: Blog and Studio validation run `42494862245` — success; Florial D1 migration validation run `42494837586` — success. В составе CI: 24/24 теста, lint, Vite build, Pages Functions syntax, read-only D1 migration validation, Sanity Studio build.
- Cloudflare Pages Production deployment `d0e2791b-401a-4c52-83f1-1e56d5fe5342` (short ID `d0e2791b`) для merge commit завершился success 08.11.2026 15:43:55 UTC; build и deploy stages — success; aliases `florial-bg.com` и `www.florial-bg.com`.
- Live smoke после deployment: главная, `/manager`, `/cart`, delivery page BG/RU/EN — HTTP 200. `/api/manager/service-leads` без авторизации — HTTP 401. Страница Manager показывает закрытую форму входа. Полная аутентифицированная матрица Owner/Manager/Seller не выполнена: отдельные сессии этих ролей недоступны.
- Delivery page BG/RU/EN показывает Каблешково 10 EUR и Поморие 15 EUR. Sanity опубликованный документ Каблешково `43fdc359-0e28-4410-83b3-a1902270345e` = 10 EUR; корзина и серверная проверка заказа согласованы.
- Изменения кода: `functions/api/manager/staff.ts` очищает manager-only права при переводе в Seller и запрещает выдачу таких прав Seller; `src/manager/ManagerApp.tsx` сбрасывает manager-only permission в форме создания Seller; `tests/service-leads-manager.test.mjs` покрывает регрессии. Изменено 9 файлов в PR.
- Production D1 не изменялась: migrations, профили сотрудников, заявки, события и заказы не затрагивались; новые тестовые заявки не создавались. Sanity schema не менялась; ранее изменён только один опубликованный deliveryZone документ Каблешково. Header, меню, Footer, checkout и глобальная оболочка не менялись.
- Retention: срок `retention_until` = 365 дней; автоматическое удаление/обезличивание не включено. Нужны отдельное решение владельца и правовая проверка. Не выполнять purge или анонимизацию без отдельного подтверждения.
- Cloudflare Pages project config содержит legacy переменные с именами `SUPABASE_*` / `VITE_SUPABASE_*`; статический поиск в репозитории ранее не выявил активного Supabase runtime-кода. Значения не раскрывались, настройки не менялись. Удаление этих переменных требует отдельной проверки workflow/config и отдельного согласования.
- Статус: **код PR #129 объединён и опубликован; техническая часть исправления Seller permissions и выравнивания доставки выполнена. Полное закрытие Этапа 6 остаётся открытым до authenticated role matrix и решения по retention.**

---

## 2026-11-08 — Выпущена инструкция Florial MD2 rev20

- В Library проекта `/Florial/ИНСТРУКЦИЯ(2)_FLORIAL_АКТУАЛЬНАЯ_08-11-2026_rev20.md` создана новая редакция на основе rev19; rev19 и rev18 сохранены без перезаписи.
- Rev20 фиксирует финальный PR HEAD `e96fc6d254dab3d35af7af2c49bdd0679bba5bef`, успешные CI runs `42494229489` и `42494215626`, 24/24 теста, UI/backend очистку manager-only permissions для Seller и тариф Каблешково 10 EUR.
- PR #129 открыт, не объединён; Production deployment кода не выполнялся. Retention cleanup не включён.

---

## 2026-11-08 — Этап 6: аудит прав Seller и тарифов доставки

- Подтверждена владельцем ручная приёмка Manager после этапа 5.
- Sanity dataset `production`: опубликован `feeEUR=10` для Каблешково (предыдущее значение 15 EUR); обновлён только документ `43fdc359-0e28-4410-83b3-a1902270345e`. Это приводит публичную страницу доставки к уже существовавшим 10 EUR в корзине и серверной проверке заказов. Поморие остаётся 15 EUR.
- В ветке `fix/stage-6-seller-permissions-delivery-fee` в `functions/api/manager/staff.ts` добавлена очистка `canManageCategorySeo`, `canViewServiceLeads`, `canManageServiceLeads` при переводе в Seller; запрет на назначение этих прав добавлен в создание и обновление Seller.
- В `tests/service-leads-manager.test.mjs` добавлены регрессионные проверки seller permission cleanup и соответствия тарифа Каблешково 10 EUR в корзине и серверной проверке.
- Production D1 не изменялась; существующие заявки/события/заказы/профили не изменялись. Автоматическая очистка заявок 365 дней не добавлялась. CI на code HEAD `061aa1d96eb7ed5697320a4b0b8bfcbc8205b69c` success: 24/24 теста, lint, Vite build, Pages Functions syntax, read-only D1 migration validation и Sanity Studio build. После синхронизации Manager UI и документации final PR HEAD `7973d5d46e8651d5e3d50faa5ee785f10b6d71f3` проходит повторный CI. Production deployment не выполнялся.
- Smoke: публичные услуги BG/RU/EN и доставка HTTP 200; Manager HTTP 200 с noindex; неавторизованный Manager API HTTP 401. Полный authenticated role matrix ещё не проверен.

---

## 2026-11-08 — Этап 5: подготовка Manager для заявок на услуги (PR #127)

- В отдельной ветке `feat/service-leads-manager-stage-5` создан PR #127 от текущего main commit `2516b3f4c60420e95a8b8a12400c373e9b0f9b16`.
- Добавлен защищённый API `functions/api/manager/service-leads.ts` для просмотра, поиска, фильтрации, карточки заявки, обновления статуса, назначения ответственного и внутренних комментариев. Записи аудируются в append-only `service_lead_events`.
- Добавлен адаптивный болгарский интерфейс `src/manager/ServiceLeadsManager.tsx`, подключён в существующий Manager через `src/manager/ManagerApp.tsx`.
- Добавлены отдельные права `canViewServiceLeads` / `canManageServiceLeads`; Owner имеет доступ по роли, Manager — только при выдаче владельцем, Seller запрещён. Управление требует права просмотра.
- Добавлена additive migration `0012_service_leads_manager` для назначения ответственного и permission JSON schema. Новые права у существующих сотрудников выключены. Существующие заявки и события сохраняются. Назначение ограничено активными профилями Owner/Manager; Seller исключён, так как не имеет доступа к заявкам.
- Добавлены regression tests `tests/service-leads-manager.test.mjs`; CI PR #127 завершился `success`; Production migration 0012 применена, deployment `82ac6348-f42c-4095-b81e-1d2b450d0fc0` завершился `success`.
- Перед началом этапа владелец подтвердил production end-to-end тест заявки: письмо владельцу и клиенту получено, мобильное отображение проверено. Read-only D1: 2 заявки, 4 события. PII не выгружалась.
- Не менялись Sanity, заказы, checkout, Header, меню, Footer, публичная оболочка и Cloudflare secrets/settings. Retention cleanup не включался.

## 2026-11-08 — Подтверждено владельцем: тестирование заявок и email

- Владелец отправил тестовую заявку с публичной страницы услуги.
- Владелец получил уведомление Florial, клиент получил письмо-подтверждение.
- Владелец проверил отображение клиентского письма на телефоне.
- В рамках отдельной read-only проверки Production D1 обнаружено 2 сохранённые заявки и 4 события истории; содержание персональных данных не выгружалось.
- Автоматическое retention cleanup по сроку 365 дней остаётся не реализовано и требует отдельного решения.

---
## 2026-11-08 — Фирменное письмо-подтверждение заявки клиенту

- В `functions/api/service-leads.ts` обновлён только HTML-шаблон клиентского подтверждения: добавлены официальный логотип Florial из существующего Sanity photo asset, локализованное название садового центра, адаптивная email-вёрстка и фирменные зелёные акценты.
- Добавлены кликабельные контакты: болгарский `+359 876 777 902`; русский/украинский/английский `+359 885 834 860`; WhatsApp `+380 67 480 7486`.
- Новый шаблон используется как при первой отправке, так и при повторной обработке idempotent-заявки. Текст подтверждения, номер заявки и название услуги сохранены.
- Уведомление владельцу, форма, D1, Manager, checkout, заказные письма, Header, меню и Footer не менялись. Тестовое Production письмо не отправлялось; доставка через Resend не подтверждена.
- PR #125 объединён squash commit `75ea099147714174e303e727cf67d091c05fb5dd`. Cloudflare Pages Production deployment `42cfb190-b961-4f6b-8883-2d9d78eab222` для этого commit завершился успешно (build/deploy success; `npm run build`); aliases `florial-bg.com` и `www.florial-bg.com` активны.
- После публикации выполнен live read-only smoke: `/services/avtomatichno-napoyavane` и варианты `?lang=ru`, `?lang=en` вернули HTTP 200, соответствующие `html lang=bg/ru/en`, `robots=index, follow`; форма присутствует в HTML. POST не выполнялся.
- CI PR #125: website + Studio validation `42471440144` — success; D1 migration validation `42471440098` — success; post-merge D1 migration validation `42473330879` — success.

---

## 2026-11-08 — Production D1 migration 0011_service_leads применена

- По явному разрешению владельца к Production D1 `5fbb0e47-8439-493c-821a-6945eef7d8b2` применена миграция `0011_service_leads` из `main` commit `c47c9d0033007c5fbe02a023efdd7851d34a03a0`.
- Marker: `0011_service_leads`, время `2026-11-08 10:16:39`.
- Созданы две таблицы, 6 индексов и 2 append-only triggers. Read-only проверка структуры и объектов успешна; обе таблицы пусты.
- Реальные заявки и тестовые данные не создавались; Production API и Resend не тестировались. Retention cleanup не реализован. Приём заявок end-to-end пока не подтверждён.
- Выпущена инструкция MD2 rev17 в Library; rev16 сохранена.

## 2026-11-08 — Выпущена инструкция Florial MD2 rev16

- В Library загружена `/Florial/ИНСТРУКЦИЯ(2)_FLORIAL_АКТУАЛЬНАЯ_08-11-2026_rev16.md`; предыдущая rev15 сохранена.
- Rev16 фиксирует merge PR #124, Production deployment и результаты live smoke BG/RU/EN, а также не применённую Production D1 migration `0011_service_leads`.

## 2026-11-08 — PR #124 объединён и опубликован (этап 4 ещё не готов к приёму заявок)

- PR #124 merged: `53ee65d6970dd3d3849853e6241cff652d1220a2`.
- Cloudflare Pages Production deployment `ccae6acc-3e39-47f3-8192-c4110240c080` — все стадии success; build command `npm run build`.
- В форму добавлено локализованное уведомление, что заявку получает и обрабатывает менеджер Florial; проверено на живой странице BG/RU/EN (HTTP 200, robots index/follow).
- CI на последнем PR HEAD: D1 validation, website + Studio validation, Sanity Studio validation — success.
- Migration `0011_service_leads` не применялась к Production D1; API не готов к реальным отправкам до её применения. Sanity schema/documents не менялись, тестовое письмо Resend не отправлялось.
- Автоматическое retention cleanup не реализовано; фото через сайт отложены, R2/Media Library не создавались.
- Этап 4 остаётся незавершённым до D1 migration, проверки email и retention procedure.

## 2026-11-08 — ЭТАП 4 В РАБОТЕ: заявки без checkbox согласия и без загрузки фотографий

- Рабочая ветка: `feat/service-leads-stage-4`, PR #124. Реализация не объединена и не опубликована.
- Подготовлена аддитивная D1 migration `0011_service_leads`: отдельные `service_leads` и append-only `service_lead_events`; предусмотрены idempotency key, notification states и срок хранения 365 дней. Поля consent/policy не включены. Migration НЕ применялась к Production D1.
- `POST /api/service-leads`: same-origin, ограничение JSON/body, rate limit через существующую `api_rate_limits`, honeypot, проверка активной Sanity-услуги, динамических полей, email/телефона и idempotency. Нет проверки checkbox, `consentText` или `privacyPolicyUrl`. Заказы и `catalog_submissions` не используются.
- `ServicePage.tsx` подключает локализованную форму BG/RU/EN без checkbox согласия и без ссылки на privacy policy; показывает номер заявки и поясняет, что клиент описывает проблему, а фотографию при необходимости отправляет после контакта через WhatsApp или другой мессенджер.
- **Фотографии через сайт отложены по решению владельца.** В форме нет file input/upload API, файлы не сохраняются в D1/Sanity. Будущий способ приватного хранения остаётся открытым; сейчас не создавать Sanity Media Library и не подключать R2.
- Из Sanity Studio schema и `src/types.ts` удалены `consentText` и `privacyPolicyUrl`, которые были добавлены в этой ветке, но не развёртывались. Sanity documents не изменялись.
- Для запроса клиента о расчёте/оказании услуги GDPR Art. 6(1)(b) может применяться как преддоговорные действия по просьбе субъекта, если фактическая цель соответствует этому основанию. Art. 13 GDPR независимо требует предоставить информацию о контролёре и обработке; это не checkbox согласия и не технический gate формы. Наличие/содержание privacy notice вне формы остаётся предметом отдельной правовой проверки; полное соответствие GDPR не заявляется.
- Письма владельцу и клиенту используют существующий `sendOrderEmail` из `functions/api/_lib/order-documents.ts`, переменные `RESEND_API_KEY`, `EMAIL_FROM`, `ORDER_NOTIFICATION_EMAIL`. Наличие имён переменных проверено; значения не раскрывались, реальное тестовое письмо не отправлялось.
- `retention_until` задаётся как 365 дней; автоматическое удаление/обезличивание не реализовано и не включено.
- Последние CI проверки до этих изменений были успешны на предыдущем HEAD; новая серия CI для текущего HEAD ожидается.
- Не менялись Production D1, Sanity documents, Cloudflare secrets/settings, Manager, orders, checkout, Header, меню, Footer. Production deployment не запускался. Этап 4 НЕ ЗАВЕРШЁН.
- Создана и проверена в Library новая инструкция `ИНСТРУКЦИЯ(2)_FLORIAL_АКТУАЛЬНАЯ_08-11-2026_rev15.md` (08.11.2026, rev15); rev14 сохранена без перезаписи.



## 2026-11-08 — Этап 3: перенос тарифов доставки на Sanity (подготовка к публикации)

- PR #120 создан: `feat: load delivery zones from Sanity` — https://github.com/omaraandrey-dev/florial/pull/120.
- `IrrigationSupportPage.tsx` больше не содержит статический список городов/цен: таблица читает активные `deliveryZone` из Sanity, сортирует по `sortOrder`, локализует названия и форматирует расстояния/тарифы. `servicesOrder.ts` использует Sanity delivery service и отключает временную отдельную карточку при наличии документа; `App.tsx` направляет delivery-layout на специальную страницу доставки.
- Существующий URL, тексты, CTA, изображения, контакты и SEO fallback сохранены; добавлены loading/error/empty состояния на BG/RU/EN.
- В Sanity опубликованы все 30 существующих зон. Поморие 15 EUR и Кошарица 10 EUR активированы по подтверждению владельца; устаревшие предупреждения RU/EN удалены. Дополнительно создан и опубликован один `service` с `serviceCategory=delivery`, `serviceLayout=delivery`, slug `dostavka-poliv`, `sortOrder=90`, локализованными названиями/описаниями и существующим изображением.
- Первоначальные CI PR #120: Studio/website validation run #477 — success; D1 migration validation run #483 — success. После добавления helper и документации проверки должны быть подтверждены на актуальном HEAD PR. D1/schema не менялись.
- PR открыт; Production merge/deployment ожидает отдельного согласования. Этап 3 пока не объявлен завершённым до live smoke test после публикации.

## 2026-11-08 — ЭТАП 2 ЗАВЕРШЁН: страницы услуг Sanity

- PR #116/#117/#118 merged в main; финальный commit `f23e80dc78910657547a996ff87c85b5075d6ac8`.
- Frontend query/types расширены Sanity service metadata и Hero/gallery; жёсткий slug ordering заменён на Sanity `sortOrder`.
- Страница услуги получила Hero, галерею, преимущества, этапы, CTA и UI-only форму заявки. Устранены повторы изображения, заголовков и разделов; RU/EN форма имеет локализованные подписи и корректные типы полей.
- CI PR checks (lint/tests/Vite build/Pages Functions syntax/read-only dry-run/Studio build) — success; main D1 validation `42448148467` — success.
- Cloudflare Pages Production deployment `407cef61-bc67-444f-ba84-48d46d99fcfa` — build/deploy success.
- Live smoke: BG/RU/EN service pages и services list HTTP 200, robots index/follow, локализованные headings/forms, 8 услуг в порядке Sanity sortOrder, 24 service URL entries в sitemap.
- Sanity documents не изменялись; 8 active services и 14 contentBlocks монтажа в Несебре сохранены. 30 deliveryZone drafts / 0 published.
- Владелец подтвердил Поморие 15 € и Кошарица 10 €; draft-флаги обеих зон остаются false до Этапа 3, где их следует активировать.
- Этап 2 завершён. Этап 3 (перенос доставки на deliveryZone) не начат.

## 2026-11-08 — Выпущена основная инструкция MD2 rev11

- В Library проекта Florial сохранён отдельный файл `/Florial/ИНСТРУКЦИЯ(2)_FLORIAL_АКТУАЛЬНАЯ_08-11-2026_rev11.md`.
- Фактический `created_at`: `2026-11-08T04:49:15Z`; номер редакции rev11 подтверждён поиском Library.
- Rev11 создана на основе rev10: сверху добавлена контрольная точка после завершения Этапа 2, ниже вся предыдущая редакция rev10 сохранена целиком. Rev10 и более ранние файлы не перезаписывались и не удалялись.
- Зафиксированы main commit `f23e80dc78910657547a996ff87c85b5075d6ac8`, PR #116–#118, Production deployment `407cef61-bc67-444f-ba84-48d46d99fcfa`, финальные smoke tests и подтверждённые владельцем тарифы Поморие 15 € / Кошарица 10 €.
- Документационные изменения GitHub для Этапа 2 подготовлены в PR #119; PR оставлен открытым до отдельного решения владельца о merge, поскольку merge запускает новый Production deployment.

## 2026-11-08 — Выпущена основная инструкция MD2 rev10

- В Library проекта Florial сохранён новый файл `/Florial/ИНСТРУКЦИЯ(2)_FLORIAL_АКТУАЛЬНАЯ_08-11-2026_rev10.md`.
- Редакция создана на основе rev9 с сохранением предыдущей инструкции и истории целиком; сверху добавлена контрольная точка после завершения Этапа 1 модели услуг и зон доставки Sanity.
- В rev10 зафиксированы GitHub main commit `938cdb132909106e5ff2a93407c81b8461fd265d`, PR #111–#114, результаты CI/Studio/Cloudflare Pages, 8 опубликованных service metadata и 30 deliveryZone drafts (0 published).
- Зафиксированы тарифные расхождения Поморие и Кошарица; обе зоны оставлены неактивными до решения владельца.
- В Library проверено фактическое создание файла: `created_at=2026-11-08T04:04:32Z`, номер редакции rev10. Старые файлы rev9 и ранее не перезаписывались и не удалялись.

## 2026-11-08 — ЭТАП 1 ЗАВЕРШЁН: модель услуг и deliveryZone в Sanity

- GitHub main base commit: `1de4822d54366ca8b38b750bf9cf979a087bc1b1`. Реализация схемы: PR #112 (merge `bc7ed03040a0639962c031508196062092f151bc`); совместимость существующих content blocks: PR #113 (merge `1de4822d54366ca8b38b750bf9cf979a087bc1b1`).
- GitHub Actions: Sanity Studio validation, Blog and Studio validation, D1 migration validation и Deploy Florial Sanity Studio run #89 завершились `success`. Cloudflare Pages check для текущего main commit также завершился `success`.
- Проверка Sanity Schema API подтвердила, что в действующей workspace `florial-admin` опубликованы поля service `sortOrder`, `serviceCategory`, `serviceLayout`; локализованные RU/EN `advantages`, `steps`, `leadForm`; расширенная BG leadForm; новый тип `deliveryZone`; локализованное `serviceContentBlock.translations.en/ru.imageAlt`.
- Все 8 существующих опубликованных услуг получили additive metadata и опубликованы: порядок 10–80, категории landscaping/planting/irrigation/lawn/maintenance, layout standard. Остальные поля не заменялись.
- Услуга монтажа в Несебър проверена после публикации: 14 `contentBlocks` сохранены.
- В Sanity Production созданы 30 draft-документов `deliveryZone` из действующей страницы доставки: локализованные BG/RU/EN названия, расстояния (км), текущие тарифы EUR, активность и sortOrder. Все 30 записей находятся в drafts; 0 опубликованных deliveryZone, поэтому текущая публичная страница не меняется.
- Две зоны намеренно оставлены `isActive=false` до подтверждения расхождений: Поморие — текущий код 15 €, ранее названо владельцем 20 €; Кошарица — текущий код 10 €, ранее названо владельцем 15 €. Другие текущие зоны и тарифы сохранены как в коде. Расстояния перенесены из текущей страницы и пока не являются независимо проверенными дорожными расстояниями.
- Обнаруженная ранее схема-несовместимость существующего `contentBlocks[].translations.en/ru.imageAlt` устранена аддитивным добавлением полей в `serviceContentBlock`; данные не удалялись.
- Runtime/frontend, публичные страницы услуг, `IrrigationSupportPage.tsx`, Header, меню, Footer, D1, заказы, checkout, Resend и Cloudflare secrets не менялись. Страница доставки остаётся на прежней реализации до Этапа 3.
- Следующий этап — Этап 2 (визуальные компоненты и страницы услуг). Этапы 2–6 остаются не начатыми.

## 2026-11-08 — Совместимость существующих переводов serviceContentBlock

- После аддитивного добавления новых полей в service и deliveryZone подготовка draft-изменений восьми услуг выявила существующее поле `contentBlocks[].translations.en/ru.imageAlt`, которое присутствует в документах, но отсутствовало в определении `serviceContentBlock`.
- Чтобы сохранить старые данные и разрешить публикацию drafts без потери информации, в `studio/schemaTypes/index.ts` добавлено необязательное локализованное поле `imageAlt` для EN/RU.
- Никакие значения `imageAlt` не удалялись и не переписывались. Drafts восьми услуг содержат только новые поля `sortOrder`, `serviceCategory`, `serviceLayout`; опубликованные документы пока не менялись.
- Изменение схемы аддитивное; PR ожидает validation и deployment существующей Studio.

## 2026-11-08 — Этап 1: модель услуг и зон доставки Sanity (в работе)

- В отдельной ветке расширен `service`: sortOrder, категория, layout, локализованные преимущества/этапы/форма заявки и расширенные настройки BG-формы.
- Добавлен документный тип `deliveryZone` для населённых пунктов, расстояний в км, тарифа EUR, локализованных названий/примечаний, активности и порядка.
- Подтверждено read-only: 8 опубликованных активных услуг; 14 contentBlocks у услуги монтажа в Несебър; live schema пока без новых полей и типа deliveryZone.
- Сверка действующих delivery rows выявила расхождения с ранее указанными владельцем тарифами: Pomorie 15 € в коде против 20 € от владельца; Kosharitsa 10 € в коде против 15 € от владельца. Значения не исправлялись.
- Изменения ожидают CI/PR review; публикация схемы и создание deliveryZone documents пока не выполнялись. Существующие Sanity documents не изменялись.

## 2026-11-08 — Создана дорожная карта системы услуг и заявок

- Добавлен `docs/ROADMAP_SERVICES_AND_LEADS.md`: шесть автономных промптов и последовательность этапов от модели услуг Sanity до сквозного тестирования.
- Зафиксированы решения владельца по доступам Owner/Manager, уведомлениям email, подтверждению клиенту, приватным фотографиям, отдельной модели delivery zones и сроку хранения заявок 365 дней.
- Адрес получателя уведомлений не включён в публичный документ; его следует задавать в серверной конфигурации.
- Обновлён технический паспорт. Изменения только документационные: runtime-код, Sanity, D1, Cloudflare configuration/secrets, Resend, заказы, checkout и публичные глобальные компоненты не менялись.
- Все шесть этапов имеют статус «НЕ НАЧАТ»; реализация не запускалась.

## 2026-11-07 — Зафиксировано правило выбора и выпуска редакций инструкции MD2

- Уточнено, что «инструкция AMD» в устной формулировке означает основную Markdown-инструкцию MD2 — семейство `ИНСТРУКЦИЯ(2).md`, а не отдельный формат AMD.
- История договорённости: исходное правило ведения `ИНСТРУКЦИЯ.md` зафиксировано 21.10.2026; 03.11.2026 подтверждено создание новой отдельной редакции без перезаписи старой.
- Для каждого нового чата обязательно искать редакции в Library и выбирать последнюю по метаданным даты создания (`created_at`), при совпадении даты — по наибольшему номеру `revN`.
- После каждой существенной технической работы создавать новый файл `ИНСТРУКЦИЯ(2)_FLORIAL_АКТУАЛЬНАЯ_YYYY-MM-DD_revN.md`, сохранять предыдущие редакции и обновлять технический паспорт/журнал.
- Обновлена только документация; runtime-код, Sanity, D1, Cloudflare configuration, заказы и Production не изменялись.

## 2026-11-07 — Публикация защиты публичных API и HTTP-заголовков (PR #110)

- PR #110 `security: harden public order and analytics APIs` объединён в `main` методом squash; merge commit: `aa514f8997a3f4faeba35483e86d0ef558a061f5`.
- GitHub Actions перед merge: run `42379786803` — lint, production build сайта и syntax-check Pages Functions; run `42379786810` — website lint/tests/build, migration syntax/dry-run и Sanity Studio build. Все job steps обоих runs завершились `success`.
- Production D1 `5fbb0e47-8439-493c-821a-6945eef7d8b2`: после явного разрешения владельца применена migration `0010_public_api_rate_limits`. Проверены таблица `api_rate_limits`, индекс `idx_api_rate_limits_expires`, четыре поля таблицы и marker в `schema_migrations` (applied_at: `2026-11-07 15:12:54`). Изменение аддитивное; существующие заказы и события не переписывались.
- Cloudflare Pages Production deployment `1651e652-2ff5-45d4-a89e-b53addfb07e4` для commit `aa514f8997a3f4faeba35483e86d0ef558a061f5` завершился: queued, initialize, clone_repo, build и deploy — `success`. Build command: `npm run build`; Vite build и компиляция Pages Functions завершились успешно. Live-домен `https://florial-bg.com` доступен для чтения.
- В production build выведено предупреждение Vite о размере основного JS chunk (789.57 kB до gzip, 201.36 kB gzip); сборка успешна. Code splitting — отдельная оптимизационная задача, не включённая в PR #110.
- Включены same-origin/JSON проверки, bounded request body (64 KiB orders; 4 KiB track), D1-backed rate limits (orders 5/15 min; track 90/min), общие security headers и immutable cache policy для `/assets/*`. В D1 сохраняется дневной SHA-256 digest IP, не исходный IP.
- Ограничения пострелизной проверки: доступный web-reader подтвердил открытие главной страницы, но не предоставляет сырые HTTP response headers и не выполняет безопасные POST-запросы к API. Поэтому фактические значения заголовков на ответах live-домена и негативные тесты `/api/orders` / `/api/track` отмечены как НЕ ПРОВЕРЕНО; не создавать тестовые заказы или события ради проверки. Требуется отдельный HTTP-клиент/проверка после релиза.
- CSP и Turnstile не включались. Turnstile требует создания widget и безопасной настройки sitekey/secret; CSP — предварительной инвентаризации реальных внешних источников.
- Затронутые файлы PR: `functions/api/_lib/public-api-security.ts`, `functions/api/orders.ts`, `functions/api/track.ts`, `functions/_middleware.ts`, `public/_headers`, `functions/migrations/0010_public_api_rate_limits.sql`, `CHANGELOG.md`, `docs/TECHNICAL_PASSPORT.md`.

## 2026-11-07 — Удалён дублирующий ключ category SEO

- В `src/lib/categorySeo.ts` удалено второе повторное объявление ключа `nipel-reduktiven-plastmasov-vanshna-rezba` из `additionalTerms`.
- Обе записи имели полностью идентичные значения `phrase.bg`, `phrase.ru`, `phrase.en`; оставлена первая запись. Отдельный ключ `nipel-plastmasov-vanshna-rezba` не изменялся.
- Проверена логика: `generateCategorySeo` получает локализованные термины через `TERMS[category.slug]`; затем использует существующие H1 или fallback, строит Meta Title и Meta Description. `Object.assign(TERMS, additionalTerms)` ранее повторно присваивал тому же slug то же значение, поэтому удаление второй записи не меняет SEO-вывод ни для BG, ни для RU, ни для EN.
- Sanity categories/documents, опубликованные SEO-поля, URL/slug, sitemap, D1, Cloudflare variables/secrets, Header, меню и Footer не менялись.
- Добавлен регрессионный тест `tests/category-seo.test.mjs`: проверяет BG/RU/EN генерацию для slug и подтверждает, что объявление slug встречается в `categorySeo.ts` ровно один раз.
- PR validation завершилась успешно: `Florial D1 migration validation` run `42376470863` — `npm ci`, lint, `npm run build`, Pages Functions syntax; `Blog and Studio validation` run `42376470827` — lint, unit tests, `npm run build`, migration syntax, read-only migration dry-run, Studio `npm ci` и build. Все шаги обоих workflow завершились `success`. Production не менялся: проверки выполнены в PR, merge и Production deployment не запускались.
- Изменение подготовлено в отдельной ветке; `main` и Production не изменяются до отдельного согласования merge.

## 2026-11-07 — Подтверждена новая Cloudflare Pages build command в Production

- Проверяемый GitHub main commit: `8aa11542feccde8fc8963f0840323da5795deec5`.
- Cloudflare Pages Production deployment: `dbdd20b5-02c5-4ee9-a019-13e63a9d978a`; все стадии `queued`, `initialize`, `clone_repo`, `build`, `deploy` — `success`.
- Build log подтвердил Node.js `22.23.4`, npm `10.9.9`, автоматическую установку по lockfile командой `npm clean-install --progress=false` и фактическую пользовательскую build command `npm run build`.
- Vite build завершился успешно (`built in 669ms`), затем Pages успешно опубликовал сайт. Это первая подтверждённая Production-сборка после переключения Cloudflare build command; lockfile не удалялся и повторный `npm install` не выполнялся.
- Остаётся предупреждение о дублирующемся ключе `nipel-reduktiven-plastmasov-vanshna-rezba` в `src/lib/categorySeo.ts:184` и `:211`. Сборка прошла; исправление отложено до отдельного сравнения обоих значений.
- Preview deployments отключены (`preview_deployment_setting=none`); последний Preview deployment удалён. Production branch `main` и Production deployments включены.
- Runtime-код, Sanity, D1, заказы, checkout, Header, меню, Footer и секреты не менялись.

## 2026-11-07 — Отключён автоматический Preview и стабилизирована сборка

- PR #106 объединён в `main` (squash commit `6cb33769641d91589772086bd9d78b1ada24bfa2`). Добавлены root `package-lock.json` и `studio/package-lock.json` (lockfileVersion 3), корневой `.nvmrc` со значением Node.js 22.
- Четыре существующих GitHub Actions переведены с `npm install` на `npm ci`: `blog-studio.yml`, `deploy-sanity-studio.yml`, `sanity-studio.yml`, `validate-d1-migration.yml`.
- Все три PR checks прошли успешно: D1 validation; Sanity Studio build; Blog and Studio validation с lint, tests, Vite build, Pages Functions syntax, read-only migration dry-run и Studio build.
- Cloudflare Pages project `florial`: `preview_deployment_setting=none`; последний Preview deployment `bd5be887-9f69-4d29-b3b7-a005b012d28c` удалён. Production branch `main` и Production deployments остались включены. Исторические Preview deployments массово не удалялись.
- Cloudflare build command установлена в `npm run build`, output directory `dist`. Cloudflare Pages автоматически выполняет `npm clean-install --progress=false` при наличии lockfile; в логах подтверждены Node.js 22.23.4 и npm 10.9.9. Новый build command требуется подтвердить следующим Production deployment.
- Deployment `1737c6de-8ab5-4180-9797-66a94e700a49` для merge commit `6cb33769641d91589772086bd9d78b1ada24bfa2` прошёл все стадии успешно, но его пользовательская build command ещё была старой, так как деплой стартовал до её переключения.
- Build выдал предупреждение о повторяющемся ключе `nipel-reduktiven-plastmasov-vanshna-rezba` в `src/lib/categorySeo.ts:184` и `:211`. Сборка успешна; предупреждение не исправлялось в рамках этой задачи.
- Не менялись runtime-код, Sanity, D1, заказы, корзина, checkout, Header, меню, Footer и секреты.

## 2026-11-07 — Read-only аудит состояния Florial и актуализация документации (rev6)

- Повторно проверены GitHub `main`, Cloudflare Pages Production, D1 и published perspective обоих Sanity datasets.
- GitHub HEAD: `730285f75d0ed049ab9b2ee210544eab5942d12d`. Production deployment: `ac8f035c-b4e7-4fc4-bc53-ec4e41329a42`, `success`; deployed commit совпадает с main. Последние 10 Production deployments успешны.
- Между checkpoint `f40ab75e9cb5888891337e73b683aadde5e402d9` и HEAD было 9 documentation-only commits; runtime source не менялся.
- Sanity `production`: 275 products, 54 categories, 3 brands, 8 services, 22 blog posts; product H1 BG/RU/EN заполнен у 82/275, BG Meta Title/Description — у 274/275; category SEO — 54/54 на BG/RU/EN.
- Sanity `plants`: 35 products, 17 categories; product SEO BG/RU/EN — 35/35; Portable Text descriptions BG 35/35, RU/EN 34/35; category SEO — 17/17. Всего 71 категории.
- D1: 11 application tables по SQL catalogue, 9 применённых migrations; 7 orders (3 non-test, 4 test), 26 order_events, 2 staff profiles, 8 submissions, 2 stock events, 662 site events. Личные данные не читались. D1 metadata API `num_tables=0` расходится с SQL catalogue.
- Найдены legacy Supabase variable names в Cloudflare Production/Preview. Активных Supabase SDK/runtime references статический поиск в текущем source не выявил, но это не абсолютное доказательство отсутствия косвенного/CI использования. Ничего не удалялось.
- Preview не имеет набора bindings/secrets, эквивалентного Production. Production credentials в Preview не переносились.
- Корневой `package-lock.json` отсутствует; build command удаляет lockfile и выполняет `npm install`. Рекомендовано отдельное планирование воспроизводимой сборки; pipeline не менялся.
- Создана Library-инструкция `ИНСТРУКЦИЯ(2)_FLORIAL_АКТУАЛЬНАЯ_07-11-2026_rev6.md` с новой контрольной точкой; исторический текст rev5 сохранён.
- Все проверки read-only; код, конфигурации, D1, Sanity и Production не изменялись. Live sitemap XML и поисковая индексация не подтверждены.

## 2026-11-06 — Ручное заполнение и публикация SEO карточек растений (Sanity plants)

- По прямому подтверждению владельца вручную подготовленные SEO-поля опубликованы для всех 35 карточек растений в dataset `plants`: BG `seo.h1/metaTitle/metaDescription`, RU и EN `translations.ru/en.seo.h1/metaTitle/metaDescription`.
- Для одной карточки «Маслина 3» дополнены отсутствовавшие локализованные названия: RU «Оливковое дерево 3», EN «Olive tree 3». Другие названия не менялись.
- Перед публикацией старые строковые значения полей `description` и `translations.*.description` преобразованы в Portable Text по текущему типу `richDescription`: один обычный текстовый блок со span; исходное содержимое каждого существовавшего поля сохранено дословно. Отсутствовавшие RU/EN описания карточки «Маслина 3» не создавались.
- Все 35 документов прошли доступную проверку Sanity со статусом valid; beta validator сообщает `complete=false`, поэтому часть custom checks им не выполняется. Публикация выполнена двумя партиями: 25 + 10 документов.
- Контроль published perspective: 35/35 карточек опубликованы; все 9 SEO-полей BG/RU/EN присутствуют; все Meta Title не длиннее 70 символов; у всех 35 карточек есть RU/EN названия; черновиков этих карточек не осталось. У 34 карточек подтверждены Portable Text описания BG/RU/EN; у «Маслина 3» опубликовано BG description, а RU/EN descriptions остались отсутствующими, как и до миграции.
- Проверка карточки «Ръката на Буда» подтвердила, что исходный болгарский текст описания сохранился дословно внутри Portable Text. Публичный frontend и Cloudflare Pages не менялись; это публикация контента Sanity, а не deployment сайта.
- Не менялись цены, изображения, характеристики растений, категории, slug, ассортимент, Header, меню, Footer, код приложения, Sanity schema, Cloudflare, D1 и интеграции. Документы оборудования в dataset `production` не затронуты.

## 2026-11-06 — Сводная контрольная точка документации и Production

- На момент первичной технической сверки latest code commit был `f40ab75e9cb5888891337e73b683aadde5e402d9`; после обновления документов latest documentation commit `0e067562c14f4c24ee1b62e56ed6f77aa101d164` прошёл Cloudflare Pages Production deployment `6231673f-cf91-4c73-9ca0-8ba5f93cbf26` со статусом `success`; runtime-код не менялся.
- Последний Cloudflare Pages Production deployment: `29bcf868-2447-4902-8f00-8a6158b696c7`, commit `f40ab75e9cb5888891337e73b683aadde5e402d9`, статус `success`; aliases: `https://florial-bg.com` и `https://www.florial-bg.com`.
- Этот deployment включает актуальный код product SEO, category SEO, sitemap/About/noIndex, навигацию и иерархию заголовков; после него в main выполнялись только документационные commits.
- Создана новая Library-версия основной инструкции: `ИНСТРУКЦИЯ(2)_FLORIAL_АКТУАЛЬНАЯ_06-11-2026_rev5.md`; rev4 сохранена без перезаписи. В `docs/TECHNICAL_PASSPORT.md` добавлена сводная контрольная точка и уточнены статусы публикации product/category SEO, About sitemap и plant noIndex. `studio/SCHEMA_CHANGELOG.md` обновлён: productSeoFields опубликован в обеих workspace.
- Live XML sitemap и фактическая переиндексация поисковыми системами остаются отдельными непроверенными пунктами.
- Массовое заполнение H1/Meta Title/Meta Description карточек товаров не выполнялось; не запускать без владельца, preview и отдельного подтверждения в Manager.

## 2026-11-05 — Исправлен источник noIndex для болгарской версии растений в sitemap (Production deployed)

- В запросе `plantProducts` файла `functions/sitemap.xml.ts` поле `noIndex` теперь читается из корневого `seo.noIndex`, как это предусмотрено схемой и публичной страницей товара.
- Проверки переводов RU и EN оставлены без изменений: `translations.ru.seo.noIndex` и `translations.en.seo.noIndex`.
- Исправление устраняет риск, при котором включённый болгарский noIndex мог не учитываться генератором sitemap. Опубликованные документы Sanity не изменялись.
- Изменён только генератор sitemap; Header, меню, Footer, маршрутизация, товары, категории, услуги, статьи, корзина, checkout и базы данных не затронуты.
- Кодовый commit в `main`: `a6e0b33a09d181f59c2e1b6500199074964d193a`. GitHub Actions run `42079947210` для итогового commit `d820577ed675f684d38b18b186e93d4fe5b4bb89` завершился `success`: Install dependencies, Lint, Build website и Syntax-check Pages Functions — все шаги успешны. Cloudflare Pages Production deployment `d435d877-77de-44ef-96eb-19fa1dcb797f` для того же итогового commit завершился `success`; aliases: `https://florial-bg.com` и `https://www.florial-bg.com`. Прямое чтение `https://florial-bg.com/sitemap.xml` через доступный web-инструмент завершилось ошибкой доступа, поэтому содержимое live XML и фактическое количество URL не подтверждены.

## 2026-11-05 — Страница About добавлена в XML sitemap (Production deployed)

- В статический список URL генератора `functions/sitemap.xml.ts` добавлен маршрут `/about`.
- Используется существующий `addLocalizedUrls`: sitemap формирует BG `/about`, RU `/about?lang=ru`, EN `/about?lang=en`, hreflang alternates и x-default.
- Изменён только генератор sitemap; содержимое страницы About, маршруты приложения, Header, меню, Footer, Sanity и D1 не затронуты.
- Прямой commit в `main`: `8fb68fafb52a0d0fb582ddd99b6b185eacf4e391`. Изменение включено в успешный Production deployment latest main commit `f40ab75e9cb5888891337e73b683aadde5e402d9`, deployment `29bcf868-2447-4902-8f00-8a6158b696c7`.
- PR #105 был создан ошибочно в feature-ветке и не объединён; маршрут `/about` уже находится в main. Не объединять PR #105 как повтор без проверки diff.
- Содержимое live sitemap и фактическое количество URL отдельно не подтверждены: доступный инструмент не смог прочитать XML; требуется отдельная проверка HTTP/XML и hreflang.

## 2026-11-05 — Единый SEO-стандарт карточек товаров (PR #104 merged; Pages and Sanity schema deployed; SEO data pending)

- Добавлен общий генератор H1, Meta Title и Meta Description для товаров двух каталогов Florial: поливочное оборудование и растения; BG/RU/EN.
- Meta Title использует `|`, ограничение 70 символов и локализованное имя садового центра; длинные названия сокращаются только по границе слова. Геолокация сначала определяется по описанию товара и существующим SEO-текстам, а при отсутствии упоминания распределяется детерминированно. География ограничена Несебър, Равда, Слънчев бряг, Свети Влас, Поморие, Бургас, Ахелой, Каблешково и Кошарица; Созопол исключён.
- В Sanity schema добавлен отдельный `productSeoFields`; существующие plant `seo.title/description` сохранены как legacy. Категорийные и общие SEO-схемы не менялись.
- ProductPage и Cloudflare middleware используют локализованный H1; plant GROQ projection теперь получает корневое SEO.
- Добавлен owner-only раздел Manager с предварительным просмотром и явным подтверждением массовой записи активных SEO-полей. Серверная запись идёт через Sanity API с revision guard; секрет остаётся на сервере.
- Добавлены тесты генератора `tests/product-seo.test.mjs`.
- Read-only аудит Sanity: 275 товаров оборудования и 35 растений. На момент проверки старые metaTitle/metaDescription имелись у 274/275 товаров оборудования; legacy title/description — у 34/35 растений. RU/EN названия и shortDescription доступны у 275/275 equipment и 34/35 plants. Новые H1 не заполнены; Sanity documents не изменялись.
- PR #104 объединён в `main` commit `4d1957f190f1676b1de688c376698043c3d1978e`. GitHub Actions workflow #437 завершился успешно: lint, unit tests, Vite build, Pages Functions syntax, read-only migration dry-run и Studio build; Sanity Studio validation workflow #100 также успешно собрал обе workspace. D1 validation workflow #392 прошёл успешно; D1 schema не менялась.
- Cloudflare Pages Production deployment `22e6631b-af13-4818-97df-22317c83c816` успешно завершён для commit `4d1957f190f1676b1de688c376698043c3d1978e`; production aliases: `https://florial-bg.com` и `https://www.florial-bg.com`.
- Read-only Sanity schema verification после merge подтвердила `productSeoFields` в обоих активных workspace: `production` / `florial-admin` и `plants` / `plants`. В типе присутствуют `h1`, `metaTitle` (warning при длине более 70), `metaDescription`, а legacy `title`/`description` сохранены скрытыми и read-only. Существующая Studio не заменялась и новое приложение не создавалось.
- Schema `productSeoFields` опубликована в обеих workspace. Документы Sanity не изменялись; массовая запись H1/Meta Title/Meta Description не запускалась. Её можно выполнить только владельцу из Manager после просмотра preview и отдельного подтверждения.

## 2026-11-05 — Исправлена иерархия заголовков главной страницы и Footer

- На главной странице секции растений, оборудования для полива и блога/портфолио переведены с H2 на H3; заголовки категорий растений и карточек статей переведены с H3 на H4.
- Заголовок секции профессиональных решений остаётся H3; карточки услуг остаются H4; категории оборудования остаются H4.
- В общем Footer «За нас» изменён с H4 на H2, «Контакти» и заголовок социальных сетей — с H4 на H3. CTA-заголовок контактов оставлен H3.
- Изменены только уровни HTML-заголовков и документация; тексты, CSS-классы, внешний вид, порядок, ссылки, Header, меню, Sanity и базы данных не менялись.
- Файлы: `src/pages/HomePage.tsx`, `src/components/BlogSection.tsx`, `src/components/Footer.tsx`, `docs/TECHNICAL_PASSPORT.md`, `CHANGELOG.md`.
- Требуются Preview build и проверка структуры заголовков в BG/RU/EN; production не обновлялся.

## 2026-11-05 — Ссылки бургерного меню доступны в DOM без клика

- В `src/components/Header.tsx` убран условный mount основного меню и четырёх accordion-панелей; элементы остаются в DOM после монтирования Header, а закрытое состояние задаётся атрибутом `hidden`.
- Добавлены связанные `aria-controls` и ID для основного меню и групп навигации. Существующие `aria-expanded`, обработчики кликов, классы, тексты, порядок и локализованные href сохранены.
- Динамические ссылки категорий, услуг и последних статей по-прежнему появляются после загрузки соответствующих данных; для проверки DOM нужно дождаться загрузки.
- Зафиксировано ограничение SPA: навигация доступна в DOM после выполнения React, но не появляется в сыром HTML до запуска JavaScript. SSR/prerender не входит в эту правку.
- Не изменялись Header.css, Footer, маршруты, Sanity schema/documents, Cloudflare D1, middleware, sitemap, каталог, корзина и checkout. Production deployment не выполнялся.
- Cloudflare Pages Preview build и deploy завершились успешно после исправления выявленного первой сборкой лишнего JSX closing `div`. Preview: `https://480e6a1c.florial.pages.dev`, deployment `480e6a1c-7f1b-451a-88cb-1db8159487fe`, commit `f481c6eac45ffec184116e24d48884204ed33168`.
- Проверка Preview после ожидания динамической загрузки: до открытия меню в nav обнаружено 45 ссылок; BG/RU/EN — по 45 ссылок, HTTP 200. Все RU href содержат `?lang=ru`, EN href — `?lang=en`, BG href не содержат языковой query.
- `npm run lint` и `npm test` отдельно не запускались. Production deployment не выполнялся.

## 2026-11-05 — Полное отображение изображения категории

- Исправлен фотоблок верхней части страницы категории в `src/pages/CategoryPage.tsx`: `object-cover` заменён на `object-contain`, чтобы изображение категории оборудования или растения отображалось целиком без обрезки.
- Пропорции фотоблока и desktop-компоновка 2/3 + 1/3 сохранены; если пропорции исходной фотографии отличаются, допускаются свободные поля внутри блока.
- В `docs/TECHNICAL_PASSPORT.md` закреплено правило: изображения верхнего блока всех категорий должны использовать `object-contain`; не путать с отдельными правилами изображений карточек подкатегорий, товаров и услуг.
- Sanity documents/assets, D1, Cloudflare settings, Header, меню и Footer не менялись. Изменение кода включено в Production deployment latest main `f40ab75e9cb5888891337e73b683aadde5e402d9`.

## 2026-11-05 — Уточнение единого стандарта всех каталогов

- Уточнено в `docs/TECHNICAL_PASSPORT.md`, что единая семантика H1/H2/H3 и desktop/mobile-компоновка обязательны для всех страниц категорий Florial: оборудование (`production`) и растения (`plants`), во всех локалях BG/RU/EN.
- Зафиксировано: H2 только у реально отображаемых непосредственных подкатегорий; H3 — у карточек товаров и растений; desktop — текст около 2/3 и изображение справа около 1/3; mobile — изображение скрыто, текст на всю ширину.
- При отсутствии изображения пустая колонка не создаётся; для изображения используются локализованные ALT/title. Новые шаблоны должны переиспользовать единый стандарт.
- Изменены только `docs/TECHNICAL_PASSPORT.md` и `CHANGELOG.md`. Код сайта, Sanity schema и документы, D1, Cloudflare, Header, меню и Footer не менялись.

## 2026-11-05 — Завершение локализованных helpBlock для всех категорий

- Повторная сверка Sanity выявила, что предыдущая запись о завершении массовой публикации была преждевременной: на момент начала этой операции в dataset `production` существовало 40 черновиков из 54 категорий оборудования, ещё 2 пилотные категории уже были опубликованы; в dataset `plants` все 17 категорий были опубликованы, но отдельных черновиков для них не было.
- Созданы недостающие черновики для 12 категорий оборудования и 17 категорий растений. Для новых черновиков изменялись только `helpBlock.title`, `helpBlock.text` и соответствующие поля локализаций `en` и `ru`; существующие CTA-подписи и `buttonUrl` не перезаписывались.
- По прямому поручению владельца опубликованы все 52 черновика оборудования и все 17 черновиков растений. Две пилотные категории оборудования были опубликованы ранее. Всего подтверждено 54/54 опубликованных категорий оборудования и 17/17 категорий растений; черновиков категорий не осталось.
- Проверка опубликованной перспективы Sanity подтвердила наличие BG/RU/EN title и text у всех 71 категорий, наличие локализованных CTA-подписей у всех 71 категорий и географическое упоминание целевого региона в каждом языке.
- География текстов ограничена зоной обслуживания от Бургаса до Свети Власа: Бургас, Несебър, Равда, Слънчев бряг, Свети Влас, Ахелой, Поморие, Кошарица, Каблешково и ближайшие населённые пункты. Упоминания Созополя/Sozopol/Созополя отсутствуют в опубликованных helpBlock всех 71 категорий.
- Проверки после публикации: 54 категории оборудования и 17 категорий растений доступны в perspective `published`; отсутствуют категории без BG/RU/EN title/text; отсутствуют категории без географии в любом из трёх языков; отсутствуют упоминания Созополя; отсутствуют оставшиеся черновики категорий.
- В рамках этой операции не менялись товары, цены, изображения, slug, SEO metadata, иерархия и порядок категорий, схема Sanity, frontend, Header, меню, Footer, корзина, checkout, D1 и серверные функции. Публикация Sanity-контента не является frontend deployment.
- Предыдущая запись о якобы завершённой публикации заменена этой фактической записью после повторной проверки живых данных Sanity.

## 2026-11-05 — Пилотная редакционная переработка helpBlock: растения и локальное SEO

- В Sanity опубликованы новые оригинальные тексты BG и смысловые адаптации RU/EN для четырёх категорий: «Маслини», «Палми и юки», «Роторни разпръсквачи» и «Електромагнитни клапани».
- Для растительных категорий содержание стало предметным: выбор вида и сорта, условия болгарского Черноморского побережья, ветер, зимняя защита, дренаж, посадка и первоначальный уход.
- Для оборудования раскрыты конкретные технические факторы: радиус, сектор, расход и давление для роторных дождевателей; тип клапана, 24 V AC / 9 V DC, направление потока, мембрана, катушка и управляющая проводка для электромагнитных клапанов.
- В тексты естественно включена география фактического обслуживания: Несебър, Равда, Слънчев бряг, Свети Влас, Поморие, Кошарица, Ахелой, Каблешково и Бургас. Географические упоминания распределены по релевантным категориям, без механического списка в каждом блоке.
- Проверены и сохранены релевантные CTA: статья о маслинах, услуга посадки растений, статья о монтаже/ремонте дождевателей и статья об электромагнитных клапанах.
- Read-only проверка опубликованной перспективы Sanity подтвердила все четыре блока и поля BG/RU/EN, включая buttonUrl. Изменялись только поля helpBlock этих четырёх документов.
- Не изменялись SEO-поля категорий, товары, цены, изображения, slug, noIndex, маршруты, схема Sanity, Header, меню, Footer, корзина, checkout, D1 и серверные функции.
- Это пилотный этап на четырёх категориях. Массовая переработка остальных 67 блоков не выполнялась и требует оценки владельцем качества примеров.

## 2026-11-05 — Редакционная SEO-генерация и публикация всех категорий

- Выполнена редакционная генерация и публикация SEO для 71 категории: 54 категории оборудования в Sanity dataset `production` и 17 категорий растений в dataset `plants`.
- Подготовлено 213 локализованных наборов BG/RU/EN. Для каждой локали заполнены H1, Meta Title, Meta Description и keywords.
- Активные SEO-поля и редакционные `suggested` сохранены в соответствующих локализованных объектах Sanity; версия редакционного генератора — `assistant-editorial-v1`.
- После публикации read-only проверка опубликованной перспективы подтвердила полноту всех 71 категорий по трём языкам и всем четырём SEO-полям. Meta Title: 14–58 символов; Meta Description: 57–153 символа.
- Существующие legacy-поля и другие данные категорий не удалялись и не изменялись. В процессе были отдельные schema validation warnings на старых полях; они не использовались как основание для удаления данных.
- Зафиксирован редакционный стандарт: BG как исходная коммерческая версия; EN/RU — смысловая адаптация; анализ реального ассортимента и брендов; естественная терминология; уникальность; ограниченное и обоснованное использование географии; отсутствие выдуманных характеристик.
- Отличие от программного генератора PR #92: текущая редакционная версия не тождественна детерминированному словарю `src/lib/categorySeo.ts`. Для будущего развития Manager рекомендованы режимы полной генерации, заполнения пропусков и сравнения с редакционным эталоном; стандартный запуск должен сохранять предложения в `seo.suggested` и не публиковать активные поля автоматически.
- Не выполнялись отдельная проверка live HTML meta-тегов и проверка переиндексации Google. Не затронуты Header, меню, Footer, маршруты, товары, цены, slug, noIndex, корзина, checkout и заказы.

## 2026-11-05 — Единый генератор SEO категорий и Manager

- Добавлен общий модуль `src/lib/categorySeo.ts`: локализованные правила BG/RU/EN, словарь терминов по фактическим категориям полива и растений, генерация H1/Meta Title/Meta Description, резервные формулировки и ограничение длины Meta Description.
- Для страниц категорий подключено утверждённое поле H1: React CategoryPage и Cloudflare Middleware используют общий resolver. Варианты из `seo.suggested` публичной страницей не используются.
- В Manager добавлен раздел «Категории» с двумя режимами: полная генерация предложений для всех категорий и заполнение только тех SEO-полей, где пусты и утверждённое значение, и прежнее предложение.
- Добавлен защищённый Cloudflare endpoint `/api/manager/category-seo`: авторизация через существующую D1 Manager session, проверка права `canManageCategorySeo`, чтение Sanity datasets `production` и `plants`, пакетная запись только в `seo.suggested` с revision guard.
- Добавлено новое право `canManageCategorySeo`; владелец имеет доступ через owner bypass, менеджер получает доступ только после назначения права владельцем. D1 migration не требуется: разрешения хранятся в JSON и нормализуются сервером.
- Проверочный read-only запрос Sanity подтвердил 54 категории в `production` и 17 категорий в `plants` (включая корневую категорию растений). Данные категорий не изменялись.
- Генератор работает по локальным языковым правилам и словарю; внешняя AI-служба не подключалась. Массовая генерация не запускалась.
- Предложения просматриваются и редактируются в существующей Sanity Studio в поле «Предложение за SEO». Для публикации редактор вручную переносит проверенные значения в утверждённые поля H1/Meta Title/Meta Description соответствующего языка; одного изменения статуса предложения недостаточно для публикации. Публичный сайт использует только утверждённые поля.
- Проверки GitHub Actions (lint, tests, build, Pages Functions syntax, migration dry-run и Studio build) завершились успешно; Cloudflare Pages Preview опубликован успешно. PR #92 объединён в `main`. Production deployment подтверждается отдельной проверкой после merge.
- Исправлен заголовок Manager на болгарский: «Работа с категории». Header, меню, Footer, маршруты, товары, цены, корзина, checkout и опубликованные SEO-поля не изменялись.

## 2026-11-05 — Публикация единой схемы SEO категорий

- PR #91 объединён в main (merge commit `64249cdf595f2bb9b9ca25bbe0b35ba8f8f41eae`).
- Существующая многорабочая Sanity Studio успешно опубликована штатным workflow `.github/workflows/deploy-sanity-studio.yml`: сборка прошла, CLI подтвердил `Deployed 2/2 schemas` и `Success! Studio deployed`.
- Адрес действующей Studio: https://florial-admin-bg.sanity.studio/
- Read-only проверка подтвердила тип `categorySeoFields` в datasets `production` и `plants`, включая H1, Meta Title, Meta Description и блок `suggested`.
- Документы категорий не изменялись; SEO-значения не генерировались и не заполнялись. Массовая миграция не запускалась.
- Workflow `.github/workflows/sanity-studio.yml` оставлен только для проверки сборки; публикация выполняется единственным штатным workflow `deploy-sanity-studio.yml`.

## 2026-11-05 — Единая схема SEO категорий (этап 1)

- Добавлен отдельный тип `categorySeoFields`, используемый только категориями оборудования в dataset `production` и категориями растений в dataset `plants`. Общий `seoFields` для товаров, услуг и других документов не менялся.
- Для каждой языковой версии категории предусмотрены утверждаемые поля `h1`, `metaTitle`, `metaDescription`; сохранены существующие `noIndex` и `keywords`.
- Добавлен отдельный объект `suggested` для чернового предложения: H1, Meta Title, Meta Description, дата генерации, версия генератора и статус `needsReview/approved`. Предложения не подменяют действующие SEO-поля.
- Схема аддитивная по структуре данных: документы Sanity не мигрировались и не записывались. Публикация Studio и массовое заполнение категорий не выполнялись.
- Для этой проверки в `.github/workflows/sanity-studio.yml` добавлена валидация сборки Studio при открытии/обновлении PR в `main`; workflow только собирает обе Studio и не выполняет deployment.
- Не затронуты frontend, middleware, URL категорий, Header, меню, Footer, каталог товаров, корзина, checkout и Cloudflare D1.

## 2026-11-05 — SEO-поля болгарской версии категорий растений

- В schema категории растений dataset plants добавлено корневое поле seo типа seoFields для основной болгарской версии. SEO EN/RU остаётся в translations.en.seo и translations.ru.seo.
- GROQ-запрос категорий растений теперь также выбирает seo; CategoryPage использует его для BG и локальные SEO-объекты для EN/RU. Документы Sanity не изменялись.

## 2026-11-05 — Локализованные метаданные изображений категорий и SEO категорий

- Для изображений категорий оборудования и растений добавлены необязательные поля title BG/EN/RU; существующие ALT BG/EN/RU сохранены. Изменение ограничено двумя типами category и не расширяет метаданные всех остальных изображений.
- GROQ-запросы обеих Sanity datasets передают ALT/title в тип CategoryItem. Главная (карточки растений и оборудования) и карточки подкатегорий используют локализованный ALT; если он не заполнен, используется локализованное имя категории. Title показывается только при наличии редакторского значения, без дублирования имени.
- Для страниц категорий подключены SEO-поля текущего языка: корневой SEO для BG и translations.en/ru.seo для соответствующего языка. Учитывается локальный noIndex.
- Для plant categories SEO EN/RU берётся из translations.en/ru.seo; отдельным дополнением в этом же изменении добавлено корневое поле seo для BG.
- Новые поля схемы требуют публикации существующей Sanity Studio. Документы категорий не изменялись и ALT/title автоматически не заполнялись. Header, меню, Footer, товары, корзина, checkout и D1 не затронуты.

## 2026-11-04 — Полное отображение изображений категорий поливочного оборудования на главной

- В фотоблоке карточек раздела «Продажба на поливно оборудване» для изображений установлен режим `object-contain` на мобильных и desktop-экранах: исходная фотография показывается целиком без обрезки.
- Фон фотоблока изменён на белый, чтобы свободное пространство вокруг фотографий выглядело нейтрально. Увеличение изображения при наведении убрано, чтобы края не обрезались.
- Высота фотоблока, карточки, сетка и поведение изображений в секциях растений и услуг не менялись. Изменён только блок категорий поливочного оборудования в `src/pages/HomePage.tsx` и этот журнал.

## 2026-11-04 — Порядок и плотность блока продажи поливочного оборудования на главной

- Витрина категорий на главной странице отсортирована по коммерческому приоритету: «Всичко за поливане», готовые комплекты, контролери, разпръсквачи, дюзи, клапани, шахти, капково напояване, филтри, тръби и фитинги, други компоненти. Остальные категории автоматически остаются после приоритетного списка и сохраняют прежнюю сортировку.
- На широких desktop-экранах сетка категорий расширена с четырёх до пяти колонок; мобильная сетка из трёх колонок и промежуточная сетка из четырёх колонок сохранены.
- Уменьшен отступ под заголовком блока примерно на треть. Нижнее свободное пространство после карточек сокращено примерно наполовину.
- Изменены только `src/pages/HomePage.tsx` и `CHANGELOG.md`. Header, меню, Footer, страницы каталога, Sanity-документы, D1, корзина, checkout и API не затрагивались.

## 2026-11-04 — Уточнение Sanity document type в migration script

- Проверка фактически опубликованных схем Sanity подтвердила, что тип документа называется product и в dataset production, и в dataset plants (в коде Studio переменная-константа plantProduct описывает plant workspace schema, но schema name — product).
- Исправлен migration script: он ищет _type == product в обоих datasets. Live migration не запускалась; Sanity документы не менялись.

## 2026-11-04 — Исправления preview комплектов и обратной совместимости описаний

- Исправлен preview kitComponent: Sanity custom preview получает значения через поля preview.select, поэтому явно выбираются productRef, quantity и unit; компонент читает эти props напрямую. Сохранённые значения количества не меняются.
- Для переводов оборудования RU/EN возвращено прежнее поле description типа text; добавлено отдельное поле formattedDescription типа Portable Text. Старые строки и drafts сохраняются без преобразования, поэтому schema validation больше не ожидает массив в legacy-поле.
- Карточка товара предпочитает formattedDescription, а при его отсутствии показывает старый description. Plant translations остаются на прежней Portable Text схеме.
- Скрипт миграции использует Sanity document type product в обоих datasets (production и plants). В production он записывает только новое formattedDescription, не перезаписывая RU/EN legacy strings; в plants преобразует старые строковые описания в существующие Portable Text поля. Режим по умолчанию остаётся read-only dry-run.
- Изменения ограничены PR #85. Sanity documents/assets и D1 не изменялись; миграция не запускалась; main и production сайта не обновлялись.

## 2026-11-04 — Форматированные описания и состав готовых комплектов (Studio schema опубликована)

- Добавлены общий рендерер Portable Text для карточек оборудования и растений с обратной совместимостью строковых описаний, безопасными ссылками и сохранением языка при SPA-переходах.
- Добавлена общая Sanity-схема richDescription для BG/RU/EN; существующие поля сохранены. Миграция данных оформлена отдельным скриптом с dry-run по умолчанию и двойным подтверждением для live-записи после экспорта резервных копий.
- Добавлена модель kitComponents для товаров категории «Готови комплекти за автоматично поливане»: ссылка на обычный товар, положительное дробное количество, единица pcs/m и локализованная заметка.
- Состав запрашивается отдельным GROQ detail-запросом только при открытии карточки комплекта; каталожные, поисковые и связанные выборки не расширялись. Цены и расчёт стоимости комплекта не менялись.
- Изменения frontend и схем находятся в ветке `feature/rich-descriptions-kit-components-2026-11-04`; владелец проверил обе карточки на Cloudflare Preview. Studio schema опубликована 04.11.2026 через GitHub Actions run `41837585278` в существующее приложение `florial-admin-bg` (Studio App ID `fdy0ldwl717qtp5pikl7715l`), подтверждено `Deployed 2/2 schemas`.
- После публикации read-only Sanity schema API подтвердил `richDescription` в обоих workspace и `product.kitComponents` только в `production`; дробное quantity допускается. В проекте по-прежнему зарегистрировано одно Studio-приложение.
- Sanity документы, assets, цены и dataset содержимое не изменялись; миграция описаний не запускалась. `main` пока не обновлён; frontend-код остаётся в preview PR.
- Добавлены unit-тесты на конвертацию, plain text, безопасность ссылок, дробные количества и обработку отсутствующих/неактивных компонентов. Website lint/build, 6 тестов, Studio build и read-only migration dry-run прошли успешно.

## 2026-11-04 — Локализация заголовка продажи оборудования на главной странице

- Заголовок блока поливочного оборудования заменён с каталожного на коммерческий: BG «Продажба на поливно оборудване», RU «Продажа оборудования для полива», EN «Irrigation Equipment Sales».
- Изменение ограничено заголовком блока на главной странице в `src/pages/HomePage.tsx` и этой записью журнала. Карточки категорий, другие секции, Header, меню, Footer и остальные страницы не менялись.
- Изменение находится в ветке `design/homepage-hero-garden-background`; `main` и Production не обновлялись.

## 2026-11-04 — Упрощение карточек и заголовков главной страницы Florial

- В hero-блоке главной страницы светлая маска фонового фото снижена с 78% до 68%, чтобы изображение было заметнее. Абзац о Florial сделан почти чёрным (`#11150F`) и полужирным для контраста.
- Подпись над блоком услуг заменена на болгарское «Извършваме дейности» (для русской и английской локализаций предусмотрены соответствующие подписи). Заголовок «Професионални решения за градината» и ссылка «Всички услуги» сохранены.
- Карточки услуг упрощены: оставлены изображение и название услуги; удалены нижняя строка, разделитель, цена/«По оферта», пояснение о бесплатной доставке и кнопка «Детайли».
- Удалена кнопка «Разгледайте всички растения» из секции растений; карточки категорий растений и их ссылки сохранены.
- Удалена кнопка «Всички продукти за напояване» из блока каталога; заголовок и карточки категорий оборудования сохранены.
- Заголовок блог-секции изменён на «Блог и портфолио» (EN: «Blog & Portfolio»).
- Изменены только `src/pages/HomePage.tsx`, `src/components/BlogSection.tsx` (компонент используется на главной странице) и этот журнал. Header, меню, Footer, другие страницы, Sanity, API и базы данных не затрагивались.
- Требуются CI/build и визуальная проверка Preview на desktop/mobile. `main` и Production не обновлялись.

## 2026-11-04 — Доработка дизайна главной страницы Florial

- В hero-блоке главной страницы усилена видимость фоновой фотографии: непрозрачность светлой маски уменьшена с 88% до 78%; текст описания сделан более контрастным.
- В блоке услуг уменьшены верхний и нижний вертикальные отступы примерно вдвое; подпись «Нашите услуги и готови комплекти» уменьшена и выровнена слева, кнопка «Всички услуги» размещена справа на той же строке; заголовок «Професионални решения за градината» оставлен по центру.
- В секции растений удалена вспомогательная подпись «Градински център Флориал».
- Заголовок каталога заменён на болгарский «Каталог за поливно оборудване» и выровнен по центру; вспомогательная надпись «Изберете категория» удалена. Кнопка перехода ко всему оборудованию сохранена.
- Удалена надпись «Florial» над заголовком блога. Поиск по репозиторию подтвердил, что `BlogSection` используется только на главной странице.
- Изменения затрагивают только `src/pages/HomePage.tsx`, `src/components/BlogSection.tsx` (компонент используется только на главной) и этот журнал. Header, меню, Footer, остальные маршруты, каталог, данные Sanity и API не менялись.
- Требуются CI/build и визуальная проверка Preview на desktop/mobile; `main` и production не обновлялись.

## 2026-11-04 — Ненавязчивый фон первого блока главной страницы

- В первый hero-блок `src/pages/HomePage.tsx` добавлено фоновое изображение садового проекта, загруженное в Sanity dataset `production`.
- Для сохранения читаемости текста используется светлый слой поверх изображения (88% непрозрачности); изображение остаётся едва заметным фоном.
- Изменение ограничено первым блоком `HomePage`: H1, подзаголовок, описание и кнопка остаются поверх фона. Остальные секции, маршруты, общие стили, Header, меню и Footer не менялись.
- Проверить production build и визуально оценить первый блок на компьютере и телефоне после preview deployment.

## 2026-11-04 — Компактная шапка для компьютеров

- Для широких экранов (от 1025 px) высота строки шапки уменьшена: min-height 72 px и вертикальные отступы 6 px вместо прежних 120 px и 16 px.
- Логотип уменьшен до 64 px по высоте с сохранением пропорций; текстовый fallback также уменьшен.
- Поиск выровнен по высоте 42 px, кнопки корзины и меню — 40 px; иконки уменьшены до 20 px.
- Изменения ограничены desktop media query в Header.css и CSS-классами для двух вариантов иконки меню/текстового логотипа в Header.tsx. Мобильные правила, порядок и функции элементов, содержимое меню и Footer не меняются.
- Требуется CI/build, Cloudflare Preview и ручная проверка владельцем на компьютере; production не обновляется до отдельного согласования merge.

## 2026-11-04 — Выравнивание логотипа в мобильной шапке

- В портретной и альбомной мобильной ориентации логотип садового центра увеличен до высоты 40 px — вровень с корзиной и кнопкой меню.
- Сохранено естественное соотношение сторон изображения: ширина логотипа теперь рассчитывается автоматически по высоте, без сжатия в узкой фиксированной колонке.
- Логотип сдвинут немного левее, а расстояние до поиска уменьшено; поиск, корзина, меню и структура шапки не менялись.
- Изменения ограничены мобильными правилами src/components/Header.css и этой записью журнала.

## 2026-11-04 — Выравнивание высоты мобильного поиска и удаление крестика очистки

- В портретной и альбомной мобильной ориентации внешний блок поиска установлен на высоту 40 px — вровень с блоком корзины и кнопкой меню.
- Поле ввода и кнопка запуска поиска выровнены по высоте внутреннего контейнера; сохранены ввод текста, отправка по Enter и запуск по зелёной кнопке.
- Поле изменено с type=search на type=text, чтобы браузер не показывал встроенный крестик очистки, отнимавший место у запроса.
- Изменены только Header.tsx, Header.css и CHANGELOG.md; структура шапки, поиск на уровне приложения, меню, корзина, Footer и данные не менялись.
- Требуется повторная проверка CI/build и визуальная проверка на мобильном устройстве.

## 2026-11-04 — Адаптивная шапка: мобильный поиск и горизонтальная ориентация

- Увеличена полезная ширина поля поиска на узких мобильных экранах: уменьшены боковые отступы поисковой иконки, внутренние отступы поля и ширина зелёной кнопки со стрелкой.
- Для компактного мобильного ряда уточнены пропорции логотипа, поиска, корзины и кнопки меню без изменения их функций и порядка.
- Добавлены отдельные CSS-правила для мобильной горизонтальной ориентации (ширина до 1024 px, высота viewport до 600 px): шапка возвращается к компактным мобильным размерам независимо от срабатывания breakpoint md; текстовая кнопка поиска остаётся иконкой.
- Изменения ограничены src/components/Header.tsx, новым src/components/Header.css и этим журналом. Структура меню, поведение поиска/корзины, Footer, desktop layout, данные Sanity/D1 и API не меняются.
- Требуются production build, проверка GitHub Actions и ручная проверка на телефоне в портретной и альбомной ориентации; до этих проверок изменение не считать опубликованным.

## 2026-11-04 — Приоритет серий форсунок в витрине поливочного каталога

- В очереди категории «Дюзи» установлена последовательность Rain Bird: сначала все R-VAN, затем HE-VAN, затем VAN, после них остальные форсунки.
- Существующее чередование шести приоритетных категорий в каталоге «Всичко за поливане» сохранено; внутри очереди форсунок применяется только дополнительная сортировка по серии.
- Сортировка распознаёт обозначения в названии товара и SKU, не изменяет документы Sanity и не затрагивает цены, наличие, карточки, пагинацию или главную страницу.
- Изменён только алгоритм формирования порядка товаров в `src/pages/CategoryPage.tsx`.

## 2026-11-04 — Исправление конфигурации каталога товаров в Manager

- Причина `Sanity catalogue is not configured.` подтверждена в production Pages project: код Manager требовал server-side `SANITY_PROJECT_ID`, тогда как в конфигурации присутствовал `VITE_SANITY_PROJECT_ID`.
- `ManagerEnv` и `GET /api/manager/order-products` теперь поддерживают `SANITY_PROJECT_ID` как приоритетный источник и безопасный fallback на уже существующий `VITE_SANITY_PROJECT_ID`; `SANITY_API_TOKEN` по-прежнему читается только на сервере.
- Не менялись значения секретов, Sanity документы/Assets, D1, роли/права, заказы, checkout, корзина и публичные компоненты сайта.
- Проверка production API и ручной выбор товара владельцем/менеджером фиксируются отдельно после публикации.

## 2026-11-04 — Manager: редактирование состава заказа, замены и документы

- В форме редактирования заказа количество 0 трактуется как удаление позиции. В сохранённом составе остаются только позиции с положительным количеством; пустой состав не допускается, чтобы случайно не превратить заказ в заказ без товаров.
- При сохранении состава `order_events` фиксирует добавленные/удалённые позиции, изменение количества и согласованной цены с item snapshot в metadata. Исходная запись заказа и его номер/дата/статусы/оплата сохраняются; текущие суммы пересчитываются в целых EUR центах.
- Добавлен защищённый поиск товаров для заказа в Sanity datasets `production` (оборудование) и `plants` (растения/варианты). Для растений выбор выполняется по конкретному `saleVariants` варианту. Согласованная цена записывается в snapshot заказа и далее не зависит от последующих изменений каталога.
- В карточке заказа предусмотрены скачивание PDF, отправка актуального состава клиенту отдельным письмом без вложения и отправка копии PDF на рабочую почту Florial.
- PDF и Resend helpers вынесены в общий серверный модуль `functions/api/_lib/order-documents.ts`; checkout использует тот же модуль. Не создаётся отдельная почтовая инфраструктура.
- Добавлены события истории `order_item_added`, `order_item_removed`, `order_item_qty_changed`, `order_item_price_changed`, `pdf_downloaded` и `order_email_sent`.
- Изменения находятся в отдельной feature-ветке; Production deployment, отправка реальных писем и ручная проверка с тестовым заказом ещё не выполнялись. D1 schema/data не изменялись; migration не требуется. Header, меню, Footer, публичный каталог и checkout-процесс оформления заказа не менялись.

## 2026-11-04 — SEO: серверная защита Florial Manager от индексации

- Для `/manager` и всех вложенных маршрутов middleware сохраняет SPA fallback, но добавляет HTTP-заголовок `X-Robots-Tag: noindex, nofollow, noarchive`.
- В HTML Manager серверно устанавливается/заменяется meta robots с `noindex, nofollow, noarchive` до запуска JavaScript; публичный `index.html`, robots.txt и SEO публичных страниц не меняются.
- Проверено по коду: `public/robots.txt` разрешает обход сайта, а sitemap генерируется только из документов Sanity (категории, товары, услуги и публикации); маршрут Manager в генератор не включён.
- Проверена серверная защита Manager API: защищённые endpoints используют `requireUser` и сессию в Cloudflare D1. SEO-директивы не являются заменой авторизации.

## 2026-11-03 — Manager: управление заказов Florial

- Создан отдельный адаптивный экран заказов с поиском, фильтрами по статусу, оплате, тестовым заказам и датам, пагинацией и подробной карточкой.
- Добавлены редактирование данных клиента и позиций, пересчёт в целых EUR центах, отдельные статусы обработки и оплаты, внутренние заметки, отмена и архивирование.
- Физическое удаление ограничено явно помеченными тестовыми заказами; сервер запрещает удаление реальных заказов. Только четыре согласованных FL-TEST-20261103-01…04 получают `is_test=1`.
- Добавлены разрешения `canViewOrders`, `canEditOrders`, `canDeleteTestOrders`; owner имеет полный доступ, активный manager получает утверждённые права, seller исключён.
- Добавлены D1 migration `0008_manager_orders` и независимый журнал `order_events`. Публичные страницы, Header, меню, Footer, checkout, Sanity и реальные заказы не меняются.

## 2026-11-03 — Manager: директно управление на количеството растения

- Добавено е отделно разрешение `canEditPlantStock` („Промяна на количеството на растенията“); по подразбиране то е изключено и може да бъде назначено от собственика. Собственикът винаги има достъп.
- В Manager добавен самостоятелен екран за наличности: търсене по име, латинско име и SKU, филтър по категории/подкатегории; всеки вариант на продажба се показва отделно с текущото количество.
- След избор на позиция каталогът се скрива и остава форма за въвеждане на ново цяло неотрицателно количество. Записът променя остатъка директно в Sanity без workflow за одобрение.
- API проверява разрешение на сървъра, актуалната Sanity revision и целостта на количества; паралелни изменения приводят к конфликту вместо перезаписи устаревшего документа.
- Добавлена аддитивная D1 migration `0007_plant_stock_events.sql` и журнал pending/success/failed для фиксации инициатора, растения/варианта и старого/нового количества.
- Не изменялись публичные страницы, Header, меню, Footer, checkout, заказы и существующие записи Sanity. PR #73 объединён, Production D1 migration применена, Production deployment завершён успешно.
- Владелец после публикации сообщил, что панель в целом работает. Это первичная пользовательская проверка; полная формальная матрица всех ролей и конфликтов `_rev` отдельно не фиксировалась.

## 2026-11-03 — Упрощение рабочих экранов Manager для растений

- После выбора растения в форме добавления высоты или изменения цены каталог выбора скрывается; остаётся только выбранное растение и соответствующая форма. Кнопка «Избери друго растение» возвращает к каталогу.
- Для owner/manager организованы отдельные рабочие действия: заявки на растения, добавление растения, добавление высоты и изменение цены. Заявки показываются единым списком без разбиения на три фильтра.
- Сохранена отдельная навигация к заказам, сотрудникам и аналитике. Публичные Header, меню, Footer, каталог, checkout, данные Sanity и записи D1 не изменялись.
- Доступ к просмотру и обработке заявок остаётся под контролем действующих разрешений; права существующих сотрудников не расширялись.
- PR #73 объединён в `main` (squash commit `a07d0e54240b9ac86df51925e2988d35bb3e4f0a`); GitHub Actions checks завершились успешно.
- Production D1 migration `0007_plant_stock_events` применена и проверена: marker присутствует в `schema_migrations`, таблица `catalog_stock_events` создана. Существующие профили сохранены; `canEditPlantStock` добавлено с выключенным значением по умолчанию.
- Cloudflare Pages Production deployment `a70924e3-3e85-43a6-a2e5-e1b70ffa9ea6` (short ID `a70924e3`) завершился успешно; commit `a07d0e54240b9ac86df51925e2988d35bb3e4f0a` опубликован на `florial-bg.com`.
- Владелец сообщил 03.11.2026, что после публикации всё выглядит работающим. Полная формальная матрица тестов всех ролей и сценария конфликта `_rev` отдельно не фиксировалась.

## 2026-11-03 — Исправление загрузки каталога растений в Manager

- Исправлена GROQ-проекция в `functions/api/manager/plant-catalog.ts`: вычисляемое поле категории теперь задаётся корректным строковым ключом `"categoryId": category->_id`.
- Причина подтверждена Cloudflare Real-time Logs: Sanity возвращал HTTP 400 `queryParseError` (`string literal expected`) на поле `categoryId`; Pages Function преобразовывала эту upstream-ошибку в HTTP 502 для интерфейса.
- Изменение ограничено синтаксисом запроса чтения каталога. D1, разрешения сотрудников, документы Sanity, варианты и цены растений не изменяются.
- Требуется сборка, проверка production endpoint и ручное подтверждение загрузки каталога в Manager.

## 2026-11-03 — Диагностика ответа Sanity в Manager plant catalogue API

- Для запросов к Sanity dataset `plants` добавлено безопасное серверное логирование неуспешного upstream-ответа: HTTP status/statusText, content-type и ограниченный фрагмент тела ответа.
- Перед логированием фрагмент ограничивается 600 символами; распространённые формы Bearer/API-токенов и полей token/secret/password/authorization маскируются. Сессионные cookie, заголовки запроса, данные растений и фотографии не логируются.
- Ошибка загрузки каталога остаётся JSON HTTP 502, теперь содержит `requestId` и этап `sanity_catalog_query`; подробности ответа Sanity доступны только в Cloudflare Real-time Logs по requestId.
- Логирование охватывает все вызовы Sanity query внутри plant-catalog endpoint; stage выставляется непосредственно перед upstream-запросом.
- Не менялись D1 schema/records, роли и права, Sanity документы/assets, публичный каталог и другие страницы сайта. Изменён только диагностический путь API и документация.
- Commit: `2bafb18a668da4d1d79e79586dd8fa4fca4057ce`. Production deployment и ручная проверка причины ожидаются.

## 2026-11-03 — Manager plant catalogue API 502 diagnostics

- Wrapped the complete plant-catalog Pages Function handler so unexpected D1, session, permission, Sanity, and request-processing exceptions return a JSON error with a request ID and processing stage instead of Cloudflare's HTML 502 response.
- Added safe server-side diagnostics with the request ID, stage, error type, and a bounded error message; no session tokens, passwords, plant payloads, or image contents are logged.
- Added explicit stage markers for origin validation, session authentication, staff permission lookup, and Sanity catalogue loading.
- Hardened the internal D1 session-identity endpoint so database/authentication exceptions are converted to a controlled JSON response.
- No staff permissions, D1 schema or records, Sanity documents, plant catalogue data, or public storefront behavior were changed.

## 2026-11-03 — Каталог за избор на растение в Manager

## 2026-11-03
- Improved Manager plant catalogue loading errors: detect non-JSON API responses and avoid showing a false empty-catalogue message when loading fails.

- Вместо автоматично да се избира първото растение, екранът за промяна първо показва каталог за избор.
- Добавено е търсене по име, латинско име и SKU; показват се всички съвпадащи растения като отделни карти.
- Добавена е навигация по йерархията на категориите и подкатегориите от Sanity с разгъване и сгъване.
- Едва след избор на конкретна карта се показва формата за добавяне на размер или промяна на цена.
- Общият компонент за избор се използва от Seller, Manager и Owner според техните съществуващи права.
- API на каталога връща научното име и основната категория и включва активни растения без варианти, за да може към тях да се добави първи размер.
- Интерфейсът на новия поток за избор и промяна е на български. Данните, процесът на одобрение/публикуване и публичният каталог не се променят.

## 2026-11-03 — Миниатюры фотографий в Manager

- В форме продавца объединён просмотр сохранённых фотографий, выбранных из библиотеки Florial/Sanity и добавленных с устройства.
- Добавлены счётчик выбранных фотографий из лимита 10 и крестик на каждой миниатюре.
- Снятие сохранённой фотографии сначала отмечается локально; изменение применяется к черновику только после сохранения. Отправка заявки блокируется при несохранённых изменениях фотографий.
- В карточке проверки владельца/менеджера фотографии отображаются компактными миниатюрами с крестиком; выбор главного изображения и ALT-поля сохранены.
- Исключение фото из заявки/карточки не удаляет исходный Sanity Asset.
- Изменены только внутренние компоненты Manager и документация. Публичный каталог, Header, меню, Footer, checkout, права и D1 schema/data не затрагивались.

## 2026-11-03 — Полная расшифровка результатов ботанической проверки

- Диагностическое окно после GBIF/AI теперь показывает не только итоговые характеристики, но и данные идентификации: название продавца, таксономическое совпадение GBIF, кандидатов по фотографии и названию, результаты анализа фото, ранг, уверенность, источник и предварительный характер определения.
- Отображаются предложенные характеристики растения, руководство по уходу, уверенность ИИ по отдельным полям и предупреждение об ограничениях данных.
- Полный объект результата проверки доступен в раскрываемых технических подробностях.
- Предыдущие исправления обработки успешного `workflow.output` и вложенного JSON из `workflow.error.message` сохранены.
- Публичный сайт, права, D1 данные, Sanity документы и изображения не изменялись.

## 2026-11-03 — Исправление диагностики Cloudflare Workflow

- В PlantPublicationEditor исправлено чтение результата успешной ботанической проверки: данные извлекаются из workflow.output, где Cloudflare Workflow возвращает careDraft и diagnostics.
- Исправлена обработка ошибки Workflow: интерфейс раскрывает JSON, вложенный в error.message, и показывает исходный HTTP-код, тип ошибки, этапы AI/GBIF, модель, выбранный таксон и подробности каждого этапа.
- Ключи диагностических полей отображаются понятными русскими подписями вместо необработанных имён полей API.
- Публичные страницы, роли и права, записи D1, документы и assets Sanity не менялись.
- Production build/deployment для commit ba750d0c27eeba0e30a6e482d22ac47529e7d291 завершены успешно; deployment ID 4a921314-46c2-4b9f-acde-2b8e63464923.

## 2026-11-03 — Упрощение Manager для продавца и владельца; диагностические окна AI/GBIF

- В src/manager/ManagerApp.tsx кабинет продавца организован как стартовый экран с тремя действиями: добавить растение, изменить размер/вариант, изменить цену. Формы отображаются только после выбора соответствующего действия.
- Форма создания растения больше не открывает общую библиотеку изображений автоматически. Кнопка «Избери от галерията Florial» монтирует библиотеку только по запросу; локальные фотографии можно выбрать с устройства, включая мобильную камеру/системный picker.
- Для владельца/уполномоченного менеджера заявки разделены на три фильтра: новые растения, изменение размеров/вариантов и изменение цен. Подробности выбранной заявки и история действий показываются только после выбора заявки.
- functions/api/manager/enrich-plant.ts возвращает структурированные диагностические этапы при успешной подготовке AI-черновика; при ошибке сохраняется диагностический код, этап, модель и техническое пояснение.
- functions/api/manager/enrich-plant-care.ts сохраняет этапы ботанической проверки в plantCareResearch.diagnostics и возвращает результат проверки вместе с состоянием Workflow.
- PlantPublicationEditor.tsx показывает закрываемое диагностическое окно после AI-подготовки и ботанической проверки: этапы, модель, результаты GBIF/фото, сформированные характеристики и технические детали. Ошибки не скрываются за одним общим сообщением.
- Не изменялись публичные страницы, header, меню, footer, корзина, checkout, роли/права сотрудников, D1-схема/данные, Sanity-документы и изображения. Изменения ограничены Manager UI и диагностическими ответами API.
- Требуется production build/deployment confirmation и ручная проверка под реальными seller/owner сессиями.

## 2026-11-03 — Manager: разграничение прав в редакторе растений

- В `src/manager/PlantPublicationEditor.tsx` редактор теперь учитывает `canEditPlantCard`: без этого права поля формы блокируются, действия AI/GBIF-подготовки и удаления фото недоступны.
- Для профиля с `canPublishPlant`, но без `canEditPlantCard`, отображается пояснение на болгарском: такой сотрудник может проверять/публиковать уже подготовленную и одобренную карточку, но не редактировать её и не запускать AI/GBIF.
- Публикация остаётся отдельным действием и доступна вне заблокированной формы при наличии соответствующего права.
- Технические этапы AI-диагностики в `functions/api/manager/enrich-plant.ts` переведены на болгарский язык.
- Назначенные ранее права менеджера не менялись. В частности, `canEditPlantCard=false` сохранено; D1 и Sanity не изменялись.

## 2026-11-03 — Завършена локализация на ботаническите резултати в Manager

- Преведени са останалите руски фрагменти в резултатите от AI/GBIF: алтернативно предположение по снимка, резултат при потвърдена таксономия и неубедителна снимка, етикет на анализа и липсващо име.
- Диагностичният етап за анализ на снимка и примерът за ботаническо обяснение в AI prompt са приведени на български.
- Направена е повторна проверка на основните Manager UI компоненти и AI/GBIF endpoint-и за известни руски остатъчни фрази; не са открити съвпадения от проверявания набор.
- Не са променяни права, бизнес логика, AI/GBIF критерии, данни в D1/Sanity или публичните компоненти.
- Финалната Production build/deploy проверка се очаква за последния code commit.

## 2026-11-03 — Последни езикови корекции в Manager

- Довършена е локализацията на диагностичния етап за зареждане на снимка от хранилището в `functions/api/manager/enrich-plant.ts`.
- Съобщението за предварителното условие за ботаническа проверка в `functions/api/manager/enrich-plant-care.ts` е изцяло на български.
- Предупреждението за визуализация на снимките в `src/manager/PlantPublicationEditor.tsx` е редактирано на естествен български.
- Не са променяни алгоритми, права, статуси, данни в D1/Sanity или публични компоненти на сайта.
- Последващата Production build/deploy проверка се проследява по последния commit след тези корекции.

## 2026-11-03 — Финална проверка на лимита снимки и текстовете на Manager

- Добавена е клиентска проверка за максимум 10 снимки в редактора на публикуваната растителна карта; ограничението вече се проверява както в UI, така и при сървърното обогатяване, ботаническата проверка и публикуването.
- Остатъчните съобщения на руски/английски от AI/GBIF endpoint-ите, които могат да се покажат на служителя, са приведени към български език.
- Проверена е Production D1 таблицата `orders` само чрез агрегирана заявка: има 1 поръчка със статус `new`. Данните на клиента не са прочетени или променяни.
- Панелът за поръчки остава read-only: текущият checkout създава статус `new`, но няма утвърден работен процес и набор от последващи статуси. Не са добавяни произволни действия за промяна на статуса.
- Не са променяни записи в D1/Sanity, роли и права, checkout или публичните части на сайта.

## 2026-11-03 — Довършена българска локализация на AI/GBIF диагностиката в Manager

- Съобщенията за грешки от AI подготовката и ботаническата проверка са приведени към български език, включително липсваща AI конфигурация, невалидна/изтекла сесия, липсваща заявка, ограничения на снимките, недостъпност на GBIF и изискване за приемане на лиценз на модел за изображения.
- Променени са само текстове на съобщенията; логиката на AI, GBIF, разрешенията и обработката на заявките не е променяна.
- Не са променяни записи в D1 или Sanity.

## 2026-11-03 — Дополнение Manager: постраничная загрузка библиотеки изображений

- Общая библиотека Sanity Assets теперь загружается страницами по 100 изображений.
- В Manager добавлена кнопка «Зареди още снимки»; поиск выполняется по уже загруженным изображениям, список можно расширять следующими страницами.
- Endpoint `GET /api/manager/image-library` принимает проверенный числовой `offset`; чтение остаётся ограниченным активной сессией и правами каталога.
- Удаление или изменение исходных Sanity Assets не выполняется.

## 2026-11-03 — Manager: лимит фотографий, AI-проверка и просмотр заказов

- Лимит изображений растения увеличен с 8 до 10 на уровне формы Manager и серверных проверок AI-подготовки, ботанической проверки и публикации. Лимит размера одного файла остаётся 10 MB; допустимые форматы — JPEG, PNG и WebP.
- Русские фрагменты в интерфейсе ботанической проверки заменены болгарскими; подсказки для AI-кандидатов ботанического имени теперь запрашивают пояснения на болгарском языке.
- Добавлена вкладка «Поръчки» для owner и manager. Она показывает последние до 100 заказов из Cloudflare D1, включая контактные данные покупателя, позиции, доставку, оплату и суммы.
- Добавлен защищённый read-only endpoint `GET /api/manager/orders`. Доступ ограничен активными профилями owner/manager; endpoint не изменяет заказ и не меняет его статус. Изменение статусов заказов не реализовано.
- Данные D1 и Sanity не изменялись. Новые миграции не добавлялись. Header, публичное меню, Footer, каталог и checkout не затрагивались.
- Сквозная проверка вкладки под реальной owner/manager-сессией ещё требуется; Production-заказ для теста не создавался.

## 2026-11-03 — Назначены дополнительные права действующему менеджеру

- По явному подтверждению владельца в Production D1 обновлён существующий активный профиль менеджера; роль не менялась, новый сотрудник не создавался.
- Включены `canManageStaff`, `canDelegatePermissions`, `canReviewPlantSubmissions`, `canApprovePlantSubmission`, `canPublishPlant`.
- Сохранены прежние права на создание растений, варианты и цены. `canEditPlantCard` и `canViewAnalytics` оставлены выключенными.
- Изменение проверено повторным чтением профиля и записано в `catalog_staff_permission_events` с владельцем как инициатором.
- Делегирование ограничено собственным набором прав менеджера; управление персоналом — созданными им профилями.

## 2026-11-03 — Manager: модель прав, одобрение/публикация и проверка интерфейса

- Завершена серверная модель из 10 независимых разрешений для ролей owner, manager и seller. Владелец имеет полный доступ; manager действует только в пределах персональных прав.
- Разделены полномочия управления сотрудниками и делегирования прав. Менеджер может управлять созданными им профилями; создавать других менеджеров и назначать им права может только при наличии `canDelegatePermissions`, причём только в пределах собственных разрешений.
- Одобрение заявок и окончательная публикация в Sanity выполняются разными действиями с отдельными серверными проверками. Для изменений вариантов и цен существующих растений также разделены approval и publication; повторная публикация защищена от дублирования.
- В интерфейсе Manager обновлены болгарские подписи и сообщения. Исправлен фильтр формы создания продавца: права `canEditPlantCard` и `canReviewPlantSubmissions`, как и остальные manager-only права, больше не предлагаются роли seller.
- Production D1 проверена только чтением: migration marker `0006_manager_permissions` присутствует; таблица журнала разрешений и текущие профили доступны. Существующие профили не изменялись. У действующего manager новые права проверки, одобрения, публикации, управления персоналом и делегирования пока выключены — владелец должен назначить их отдельно.
- Cloudflare Pages build и deployment commit `c0de678185067715f15c52c2c32188762c552fbd` завершились успешно; deployment ID `f24b2b66-d386-476c-989f-38be085b67fc`, production aliases `florial-bg.com` и `www.florial-bg.com`.
- Ручной end-to-end тест с отдельными owner/manager/seller учётными записями остаётся необходимым. В ходе этой работы данные сотрудников, заявки, заказы и документы Sanity не менялись.

## 2026-11-03 — Устранено кратковременное отображение главной при прямом переходе

- Маршрут из текущего URL теперь определяется до первого рендера React, а не после него в `useEffect`; прямые ссылки на категории, услуги, товары, корзину, контакты и поиск больше не должны сначала показывать главную страницу.
- Пока каталог и услуги загружаются, для прямых переходов на динамические страницы показывается состояние загрузки вместо главной страницы.
- Обработчик `popstate` использует тот же разбор URL, сохраняя навигацию браузера «Назад» и «Вперёд».
- Изменён только `src/App.tsx`; Header, меню, Footer, данные Sanity, D1 и интеграции не затрагиваются.
- Сборка и production deployment подлежат проверке после PR.

## 2026-11-03 — Ссылка на Facebook в подвале сайта

- В Footer добавлена отдельная компактная ссылка на официальную страницу Florial в Facebook: https://www.facebook.com/share/19guUXVgFC/.
- Заголовок блока локализован на болгарский, русский и английский; ссылка открывается в новой вкладке с безопасными атрибутами.
- Изменён только компонент Footer; Header, меню, контакты, навигация, каталог, базы данных и интеграции не затрагивались.
- Сборка, проверки GitHub Actions и production deployment должны быть подтверждены после PR.

## 2026-11-03 — Supabase исключён из рабочей архитектуры; утверждена целевая модель прав Manager

- Технический паспорт обновлён: Supabase полностью запрещён для дальнейшей разработки, проверок, чтения данных, тестов, резервирования и rollback. Единственная рабочая база — Cloudflare D1 через binding `DB`; каталог/медиа — Sanity; серверная логика — Cloudflare Pages Functions/Workers; email — Resend.
- Исторические Supabase references в старых разделах/миграциях обозначены как архив предыдущей реализации, а не как разрешённая инструкция.
- Зафиксирован безопасный план отключения старой интеграции: статический аудит исходников и конфигурации, удаление неиспользуемого SDK/кода, проверка сборки и production, затем удаление старых variables/secrets и отдельное решение о pause/delete старого внешнего проекта. Никаких обращений к Supabase при этом не выполнять.
- Зафиксирована целевая модель Manager: владелец назначает индивидуальные права; менеджер может создавать растения, утверждать заявки продавцов и окончательно публиковать растения в открытый каталог в пределах выданных прав; менеджер может создавать другого менеджера и делегировать только подмножество собственных делегируемых прав, включая аналитику только при наличии соответствующего права.
- Это изменение документации. Код, D1, Sanity, Cloudflare bindings/secrets и публичный сайт не менялись. Реализация новой матрицы прав и физическое отключение старых переменных — отдельные следующие этапы.

## 2026-11-03 — Manager: исправление сохранения фотографий и библиотека изображений

- Исправлена причина `Invalid return columns`: D1 endpoint преобразует стандартный клиентский `select: "*"` в безопасный `RETURNING id`; явные неизвестные столбцы по-прежнему отклоняются.
- Добавлен авторизованный GET endpoint `/api/manager/image-library`, который читает до 100 изображений из Sanity dataset `plants` и возвращает только безопасные метаданные и CDN URL.
- В форме приёмки растений продавец может искать и выбирать существующие фотографии из общей библиотеки Sanity либо загружать новые. Для заявки действует общий предел 8 фотографий.
- Выбранные из библиотеки активы сохраняются в обычном `payload.images`; публикация продолжает использовать существующий формат `assetId`/URL. Новые таблицы, D1 migrations и изменения Sanity schema не требуются.
- Авторство старых Sanity assets не хранится, поэтому библиотека общая для dataset `plants`, а не персональная по сотрудникам. Файлы Sanity не удаляются при исключении фотографии из заявки.
- Не изменялись существующие записи D1/Sanity, каталог, корзина, оформление заказа, Header, menu и Footer. Production end-to-end проверка выполняется после deployment и ручного теста продавцом.

## 2026-11-02 — Исправление первичного создания owner в Cloudflare Workers

- Причина сбоя на этапе `password_hash`: Web Crypto в Cloudflare Workers отклоняет PBKDF2 с числом итераций выше 100 000; прежнее значение 310 000 приводило к исключению до записи профиля.
- Для новых паролей установлено 100 000 итераций PBKDF2-SHA-256 — максимальное значение, поддерживаемое текущим runtime Cloudflare Workers. Индивидуальная случайная соль 16 байт и формат хранения не изменены.
- Добавлена серверная проверка допустимого диапазона итераций, чтобы неподдерживаемое значение не приводило к неясному сбою Web Crypto.
- `verifyPassword` продолжает использовать число итераций, сохранённое рядом с конкретным хешем; существующие хеши не перезаписываются.
- Read-only проверка production D1 перед исправлением показала 0 профилей сотрудников и 0 owner, поэтому миграция/перехеширование существующих паролей не требуются.
- Изменения затрагивают только серверную функцию вычисления хеша и документацию. D1, Cloudflare secrets/bindings, Supabase, Sanity, каталог, Header, menu, Footer и checkout не изменяются.
- Ограничение безопасности: 100 000 — компромисс из-за лимита runtime, а не универсальная рекомендация для новых платформ. При смене runtime или KDF следует отдельно пересмотреть параметры хеширования и совместимость.

## 2026-11-02 — начало миграции операционных данных с Supabase на Cloudflare D1

- Добавлена D1-схема для заказов, аналитики, сотрудников, сессий, заявок растений и аудита.
- Добавлены серверные Pages Functions для D1-авторизации сотрудников по email и постоянному паролю, создания/управления сотрудниками и одноразовой первичной настройки owner.
- Пароли обрабатываются PBKDF2-SHA-256 с индивидуальной солью; сессии хранятся в D1, cookie HttpOnly/Secure/SameSite=Strict; вход имеет rate limiting.
- Заказы и события аналитики переведены на D1; Sanity остаётся источником актуальных цен и каталога.
- Фотографии заявок переводятся в Sanity Assets dataset plants; проверяются JPEG/PNG/WebP и сигнатура файла.
- Добавлен D1 compatibility adapter для существующих manager workflows, чтобы сохранить optimistic locking, статусы и audit events при поэтапной миграции.
- Существующие тестовые записи Supabase не копируются и не удаляются. Supabase не должен получать новые записи после production cutover; отключение оставлено на отдельный rollback-период.
- Создана EU D1 database florial-db (UUID 5fbb0e47-8439-493c-821a-6945eef7d8b2), применены SQL-миграции 0001–0005, включая ограничение одной owner-учётной записи, production Pages binding DB добавлен без изменения существующих secrets.
- Добавлена первая настройка owner в интерфейсе; MANAGER_BOOTSTRAP_SECRET ещё не установлен, owner пока не создан.
- PR #60 объединён в `main` (commit `f1ff703025b5d60538c0d9c3b6050d36b458964a`); Cloudflare Pages Production deployment `6d823f6b-4d1c-487c-b89d-b12c28c2d906` завершился успешно, aliases включают основной домен.
- GitHub Actions подтвердил lint, Vite build, синтаксис Pages Functions и сборку Sanity Studio. Первичный owner ещё не создан; `MANAGER_BOOTSTRAP_SECRET` нужно добавить перед первичной настройкой.
- Изменения выполняются без правок Header, menu, Footer, публичной навигации и Sanity schemas.

## 2026-11-02 — Checkout: способы получения, оплаты и расчёт доставки

- В публичной корзине активны самовывоз из магазина и, для заказов с растениями, доставка с обязательным указанием населённого пункта и согласованием способа/стоимости по телефону.
- Курьерская доставка оборудования и Econt отображаются как будущая возможность и не могут быть выбраны. Устаревшие фиксированные тарифы населённых пунктов удалены из интерфейса и API; после интеграции стоимость должна рассчитываться по тарифам перевозчика.
- Единственный активный способ оплаты — `pay_in_store` (оплата в магазине). Наложенный платёж, банковский перевод и онлайн-оплата картой показаны как неактивные будущие варианты. API отклоняет неизвестные/неактивные способы оплаты.
- API принимает только `pickup` и `agree`; согласование доставки доступно только если в заказе есть растения. Сервер повторно проверяет эти ограничения независимо от интерфейса.
- В `public.orders` добавлены nullable-поля `delivery_fee` и `total`. Для самовывоза сохраняются 0 и подтверждённая сумма; для доставки растений до согласования тарифа оба поля остаются NULL, чтобы не выдавать стоимость товаров за окончательную сумму.
- Письмо заказа и PDF-подтверждение разделяют стоимость товаров и доставку; при согласовании доставки итог обозначен как ожидающий подтверждения.
- SQL migration: `supabase/migrations/20261102190000_add_order_delivery_fee_and_total.sql`; владелец выполнил её в Supabase, структура таблицы проверена после применения. Существующие заказы не переписывались.
- Header, меню, Footer, Manager, Sanity и существующие записи заказов не менялись.

## 2026-11-02 — Сохранение покупательской корзины

- Корзина публичного магазина теперь автоматически восстанавливается из localStorage при запуске приложения и сохраняется после каждого изменения.
- Сохраняются товары оборудования, растения и выбранные варианты продажи растений; добавление, изменение количества, удаление и очистка продолжают использовать существующую общую корзину.
- В браузере хранится версионированный снимок минимально необходимых данных товара. Ошибки доступа к хранилищу, переполнение и повреждённый JSON не блокируют работу магазина.
- Очистка корзины после оформления заказа остаётся привязанной к успешному ответу /api/orders; при ошибке отправки содержимое остаётся в корзине.
- Серверная проверка актуальных цен и наличия через Sanity не менялась. Supabase, Sanity, Cloudflare secrets, Manager, header, menu и footer не затрагивались.
- Ограничение: localStorage сохраняет корзину в том же браузере и профиле устройства; синхронизация между разными устройствами и браузерами не входит в эту реализацию.

## 2026-11-02 — Управление на растений и права сотрудников

- Карточка растения показывает только заполненные ботанические характеристики; пустые значения и статус пригодности «нужна проверка» скрыты. Коммерческие характеристики выбранного варианта продажи отображаются отдельно.
- В Manager добавлены независимые права сотрудника на создание растения, добавление варианта и изменение цены. Для новых сотрудников по умолчанию разрешено только создание растения.
- Добавлен серверный поток заявок на добавление размера/варианта и изменение цены существующего растения. Изменения применяются только после одобрения владельцем и проверки актуальной ревизии Sanity-документа. Владелец видит параметры нового варианта или сравнение старой и новой цены; продавец может искать растение по названию или SKU.
- Технические подробности диагностики AI остаются на сервере и не выводятся в обычном интерфейсе Manager.
- Существующие документы Sanity не изменяются автоматически; каталог меняется только по одобренной заявке. Существующие сценарии каталога production сохранены в RLS.
- Header, меню, footer, корзина и checkout не затрагиваются.
- Дополнительно исправлен ответ owner-only endpoint управления сотрудниками: API теперь возвращает все три флага `permissions`, которые использует интерфейс переключателей. Без этого сервер сохранял права, но экран не получал их для отображения и изменения.
- Удалено хранение и отображение полного JSON-ответа ботанического Workflow в браузере. Клиент показывает обычный статус/ошибку; серверная диагностика остаётся в Cloudflare Functions logs.


## 2026-11-01 — Verify Workflow-to-Pages route and production deployment

- Updated Worker `florial-plant-care-workflow` was deployed separately (deployment ID `ec92531b847f489e973f21c78696103f`, version tag `d7e658388df34ab594d00d1a889b2fc6`); workers.dev and preview subdomains remain disabled.
- A synthetic Workflow probe called the new `https://florial.pages.dev/api/manager/enrich-plant-care/process` route and received the expected structured HTTP 403 `Owner access required`. This confirms the Worker can reach the Pages Function through the project hostname; the fake owner was rejected before submission lookup or data writes. The probe instance was deleted.
- Production Pages deployment for main commit `1f8a97da5ef0473463832eaf25549a79c7b0a492` initially hit a Cloudflare internal publish error; the same deployment was retried and completed successfully as `ee6b8700-99bd-4343-8164-b4a6300496b7` (all stages success).
- This validates Worker-to-Pages routing and deployment, not the full AI/GBIF flow. The two earlier real runs remain errored; a new owner-triggered run is still required to confirm AI Vision, GBIF, care generation and saving `plantCareResearch`.
- No existing submission or plant data was changed by the synthetic probe.

## 2026-11-01 — Reduce plant AI photo input and route Workflow to Pages project hostname

- Both plant AI stages now send only the first selected photo (the main image) to Workers AI Vision. Additional seller photos remain preserved in the submission/product and are not sent for AI analysis.
- Diagnostic metadata distinguishes the one image sent to AI from the total number of selected photos.
- The background Workflow now calls the confirmed stable Pages project hostname `https://florial.pages.dev` instead of the custom domain `https://florial-bg.com`, avoiding the custom-domain route that returned plain HTTP 502 from the Worker. The project hostname is confirmed by the Cloudflare Pages project configuration.
- No Supabase SQL migration, Sanity schema/document change, photo deletion, or changes to Header/menu/Footer were made.
- End-to-end botanical processing must be re-tested after deployment; the route change is intended to resolve the Worker-to-Pages 502 but is not considered proven until a real Workflow reaches completion.

## 2026-11-01 — Временная диагностика ботанической проверки растений

- В редакторе растения добавлен временный диагностический блок под кнопкой «Проверить и предложить характеристики»: отображаются endpoint, безопасные параметры запроса, HTTP-статус и полный JSON-ответ сервера; токен авторизации в блок не попадает.
- Ответ можно скопировать для дальнейшего разбора. Если HTTP-ответ не получен, интерфейс показывает клиентскую ошибку и отмечает, что серверный ответ отсутствует.
- Endpoint возвращает диагностические этапы фотоанализа, подбора кандидатов по обычному названию, проверки GBIF, генерации ухода и сохранения заявки. Для ошибок AI/GBIF показываются этап и техническая причина без вывода секретов.
- Диагностика не меняет правила принятия ботанических значений, публикации или коммерческие поля. Схемы Sanity, таблицы Supabase и данные заявок не мигрируются.
- Блок временный; после установления причины его можно удалить или заменить компактным журналом ошибок.
 
## 2026-11-01 — Seller plant intake validation and photo-based botanical cross-check

- В форме продавца обязательны фотография, цена в EUR с ДДС, высота растения при продаже, объём контейнера, категория, тип растения и количество. Черновики можно сохранять неполными; отправка на проверку блокируется до заполнения всех обязательных данных.
- Добавлена серверная проверка PostgreSQL trigger перед переходом новой заявки растения в `submitted`: проверяются тип, категория, числовые значения и наличие фактически загруженного файла в закрытом Storage bucket. Клиентская проверка дублирует серверную; обход интерфейса не позволяет отправить неполную заявку.
- AI-ботаническая проверка анализирует до трёх фотографий независимо от латинского имени продавца, предлагает вероятный вид/кандидатов и сравнивает результат с названием продавца. Кандидаты проверяются через GBIF; `Plantae`, higher-rank и fuzzy-совпадения не считаются подтверждением вида.
- Если имя продавца не подтверждено, но визуальный кандидат получил точное принятое совпадение GBIF, AI может предложить агротехнические характеристики по этому кандидату с явной пометкой о предварительном характере. При противоречии имени и фото владелец видит предупреждение и может вручную принять предложенное латинское имя.
- Владелец остаётся единственным лицом, принимающим/отклоняющим ботаническое имя и агротехнические предложения. Фото-распознавание и AI confidence не являются независимым подтверждением; GBIF подтверждает таксономию, но не агротехнические свойства.
- Добавлена возможность запустить ботаническую проверку по фото даже без латинского имени продавца. Коммерческие поля и публикация не изменяются ботаническим AI.
- Добавлена SQL migration `20261101173649_require_complete_plant_submission.sql`; она только добавляет trigger и функцию валидации, не переписывает существующие заявки или товары. Применена к Supabase production: migration version `20261101173649`; активный trigger подтверждён read-only запросом. Число заявок `catalog_submissions` после применения — 6; строки не изменялись.
- PR #56 объединён в `main`, merge commit `4da94c347fb89d7de48a9e2c3e9063a383b79e52`. CI run `41332093561` (lint, build, migration syntax, Studio build) и Cloudflare Pages production check завершились успешно; deployment ID `807cec79-44f1-4532-8a19-8307360d42bd`.
- После проверки формы уточнено поведение черновиков: продавец может сохранить заявку без имени, категории и остальных обязательных полей. Все семь обязательных полей проверяются только при отправке на проверку — и на клиенте, и PostgreSQL trigger.
- Финальная версия с обязательными полями продавца, фото-ботанической проверкой и ручным принятием/отклонением каждой агротехнической рекомендации опубликована в production: commit `84492e36aeac8b1d10942c9aa419ca5c2ae0331c`, Cloudflare deployment `83f95518-b2df-41dd-b82a-47897bbad149`; build/deploy успешны, production aliases включают `florial-bg.com` и `www.florial-bg.com`.
- Агротехнические предложения не переносятся в карточку автоматически. Владелец выбирает «Приеми» или «Отхвърли» отдельно для каждого поля; принятые значения сохраняются только после проверки и сохранения финальной карточки. Публикация остаётся отдельным действием.
- Ручной сквозной тест владельцем (загрузка заявки → распознавание фото → сверка GBIF → проверка/отклонение характеристик) ещё не выполнен.

## 2026-11-01 — Plant sale details and separate botanical research

- Исправлено отображение коммерческих параметров растения: публичная карточка теперь читает название выбранного варианта, высоту продажи и объём контейнера из `saleVariants`; сохранён fallback на legacy `plantCare.saleFormat`.
- Добавлен отдельный owner-only endpoint `/api/manager/enrich-plant-care`: проверяет научное название через GBIF Species API и только при точном принятом совпадении вида запускает отдельный AI-запрос для предложений по уходу.
- Результат сохраняется отдельно в `catalog_submissions.payload.plantCareResearch`; исходная заявка, основной AI-черновик и сохранённая публикация не перезаписываются. При отсутствии точного таксономического совпадения агротехнические поля не генерируются.
- В Manager добавлена отдельная кнопка проверки, статус таксономии, ссылка/URL записи GBIF и самооценка уверенности AI. Уверенность AI не считается независимым ботаническим подтверждением.
- GBIF используется только для таксономической проверки; его API не содержит надёжных садоводческих рекомендаций. Черноморская пригодность всегда остаётся `needsVerification` до проверки владельцем.
- При изменении набора фото или создании нового основного AI-черновика устаревший результат ботанического исследования сбрасывается. Сохранённая владельцем публикация имеет приоритет и не перезаписывается исследовательскими подсказками.
- Нет SQL migration, Sanity schema change, Sanity document migration, изменений данных Supabase вне JSONB payload заявки, Header/menu/Footer, корзины или checkout.
- PR #54 merged: `735f85bbbee74d071d98e2fa2b2087db92648c0d`; CI run `41328095983` success; Cloudflare production deployment `c795cd8c-c0da-4d6f-9672-f0fc29706769` success.

## 2026-11-01 — AI для растений: подробные описания и локальное SEO Florial

- Расширен промпт генерации: подробные ботанические и практические описания на BG/RU/EN с естественной языковой адаптацией.
- Зафиксирована география: Несебър — основная локальная привязка; Равда, Слънчев бряг, Свети Влас, Кошарица, Поморие и Бургас — зона обслуживания; Созопол исключён.
- Добавлены отдельные SEO title и meta description для болгарского, русского и английского языков. Существующая Sanity-схема уже поддерживает локализованные SEO-поля; миграция не требуется.
- Лимит JSON-ответа увеличен с 4096 до 8192 токенов для более объёмного трёхъязычного результата.
- AI может предложить параметры взрослой высоты, зимостойкости и пригодности для Черноморского побережья только при достаточной уверенности; эти предложения остаются обязательными для проверки владельцем.
- Не меняются цены, SKU, коммерческие варианты, наличие, исходная заявка, SQL, Sanity-документы и публичные страницы. Нет миграций Supabase или изменений Sanity schema.

## 2026-11-01 — Исправление AI-модели и отбор фотографий в Manager

- Текстовая генерация переведена на активную модель Workers AI `@cf/meta/llama-3.3-70b-instruct-fp8-fast`; JSON Mode и лимит `max_tokens: 4096` сохранены. Модель проверена прямым запросом Cloudflare с `response_format: { type: 'json_object' }`.
- Владелец может исключать отдельные или все фотографии из карточки растения. Исходный `payload.images` продавца и файлы в приватном Storage остаются нетронутыми; выбранный набор хранится отдельно в `payload.reviewImages`.
- При изменении набора фотографий прежние AI-черновик и финальная карточка сбрасываются, чтобы ALT и главный индекс не относились к старому набору.
- AI может подготовить текстовую карточку без фото; сохранение черновика без изображений допускается, публикация по-прежнему требует хотя бы одну фотографию.
- Нет SQL migration, Sanity schema change, удаления Storage-файлов или изменений публичного каталога.

## 2026-11-01 — Надёжный JSON-ответ AI при подготовке карточки растения

- Текстовая генерация переведена на модель Workers AI с поддержкой JSON Mode; ответ запрашивается в режиме `json_object`.
- Для длинной карточки задан явный лимит `max_tokens: 4096` вместо низкого значения по умолчанию, чтобы JSON не обрывался посреди объекта.
- Vision-анализ фотографий и текстовая генерация используют отдельные модели; диагностика записывает соответствующую модель для этапа сбоя.
- Коммерческие поля, исходная заявка, SQL-схема, Sanity и публичный каталог не меняются.

## 2026-11-01 — Устойчивый разбор ALT по фотографиям в Manager

- Vision-модель теперь получает запрос на одно короткое описание на болгарском обычным текстом, без обязательного JSON в ответе.
- Текстовая модель формирует BG/RU/EN ALT-массивы на основе видимых наблюдений по фотографиям.
- Это устраняет остановку процесса на этапе разбора изображения, если vision-модель возвращает обычный текст вместо JSON.
- Коммерческие данные, исходная заявка, SQL-схема и Sanity не меняются.

## 2026-11-01 — Диагностика ошибок AI в Manager

- Владелец теперь получает этап сбоя AI-подготовки: загрузка фотографии, анализ конкретной фотографии, разбор ответа модели, генерация текстов, разбор JSON или сохранение черновика.
- Для сбоя возвращаются диагностический ID, машинный код ошибки, понятное пояснение и ограниченный технический ответ модели.
- Ошибки AI записываются в существующий журнал `catalog_submission_events` как `ai_draft_failed`; при успешной подготовке остаётся существующее событие `ai_draft_generated`.
- В журналах не сохраняются фотографии, base64, токены доступа или значения секретов. Записываются только этап, номер фотографии, имя модели, код ошибки и ограниченный текст ошибки.
- Повторная генерация не запускается автоматически. Исправление не меняет исходную заявку продавца, карточку публикации, схему Supabase, Sanity или публичный каталог.

## 2026-11-01 — Owner review before AI preparation

- Restored a full editable plant-card review for the owner while a seller submission is still submitted or in_review; the owner can inspect and correct seller-provided fields before any AI request.
- The owner explicitly starts AI preparation with the button in the review editor. The reviewed name, botanical name, category, SKU, description and sale-variant data are sent as authoritative input; AI drafts product copy, translations, SEO, image ALT text and cautious care suggestions.
- AI remains opt-in and is never called when a seller saves or submits a form, when the owner opens a request, or when a page is refreshed. An existing AI draft is reused and the UI prevents accidental regeneration.
- AI output is stored separately in payload.aiDraft; the seller payload is preserved. The owner saves the reviewed final card separately in payload.publication; approval is enabled only after this card is saved.
- The publication endpoint now allows saving the prepared card during owner review, but publishing remains restricted to approved / publish_failed. The owner must approve first; the public catalog is not changed by AI generation or card preparation.
- Price, SKU, sale height, pot volume, stock status and stock quantity are copied from owner-reviewed input and are not generated by AI. No SQL migration, Sanity schema change, public-site change or existing data migration is required.

## 2026-11-01 — AI preparation of plant product drafts (Stage 1) — merged to main

- Added an owner-only Cloudflare Pages endpoint `/api/manager/enrich-plant`. It reads the seller's private submission photos from the existing Supabase Storage bucket and uses a Cloudflare Workers AI vision model to draft Bulgarian, Russian and English product text, localized image alt text, SEO and suggested care characteristics.
- The AI result is stored separately as `catalog_submissions.payload.aiDraft`; the seller's original submission payload and any owner-reviewed `publication` remain separate. Generation is limited to approved plant submissions and records an audit event.
- Extended the existing owner publication editor to generate, inspect and edit localized alt text, plant care values and a Bulgarian care note. Existing plant schema already supports `plantCare`, `careGuide`, and localized image alt fields; no Sanity schema migration or content migration is required.
- Extended the existing publish endpoint to write localized image alt fields, `plantCare`, and `careGuide` to the plant document. Price, SKU, sale height, pot volume, stock status and stock quantity are copied from the seller submission and are not generated by AI.
- The model is instructed to leave minimum winter temperature, mature height and Black Sea suitability for manual verification. AI output is a draft only; owner review and the existing explicit publish action remain mandatory.
- **Deployment prerequisite:** Cloudflare Pages project `florial` still requires the Workers AI binding `AI` in Production before the endpoint can run. The model license has now been accepted and a direct inference test succeeded. The account remains on Workers Free: no paid plan, payment card, or billing upgrade is authorized. If the free daily allowance is exhausted, requests must stop/fail until the allowance resets; do not enable paid usage.
- PR #47 was merged into `main` as commit `3718bf9e47727bf561d7ad9e6d8e3d054ac480fe`. Cloudflare Pages production deployment `5331f7a7-206d-4fd2-ab0a-b62d66f0ec5e` completed successfully and is aliased to `https://florial-bg.com` and `https://www.florial-bg.com`.
- The Workers AI model license was accepted and a direct inference test succeeded. The Pages project still has no `AI` binding in Production or Preview, so the deployed enrichment endpoint returns a configuration error until the binding is added. Remain on Workers Free; do not enable paid billing or add a payment card.
- No Supabase migration, Sanity document mutation, public Header/menu/Footer, public catalogue layout, cart, checkout or order changes were included.

## 2026-11-01 — Sanity category keys and analytics period “Today”

- Added a unique `_key` to every category reference generated by the owner plant-publication endpoint, preventing Sanity Studio's “Missing keys” warning on newly published plants.
- Repaired the already-published “Маслина 3” document by adding stable unique keys to its two existing category references. Category references and all other product fields were preserved; the updated document was published and re-read successfully.
- Added the owner Analytics period “Today”. It uses the current Bulgaria calendar day from 00:00 in `Europe/Sofia`, while the existing rolling 7/30/90-day periods remain unchanged.
- Added an additive Supabase migration to update the owner-only aggregate RPC. It reads the existing `site_events` table and returns aggregate results only; no event rows, RLS policies, or visitor data are changed.
- Changes are isolated to Manager analytics, the plant-publication endpoint, documentation, and one additive SQL migration. Public Header/menu/Footer, public catalogue, cart, checkout, and orders are not changed.
- The new SQL migration must be applied to production Supabase after the code PR is reviewed and merged. Production deployment and end-to-end verification remain pending.

## 2026-11-01 — Florial Manager: финальная карточка растения и публикация в Sanity (PR #45, ожидает ревью)

- Добавлена owner-only форма окончательной проверки одобренной заявки: название, ботаническое имя, URL slug, тип и категория растения, описание, SKU, вариант продажи, цена EUR с ДДС, наличие и количество.
- Владелец может выбрать главную фотографию, проверить все фотографии из закрытого Supabase Storage и задать BG alt-текст. Добавлены необязательные поля переводов EN/RU и SEO.
- Финальная версия сохраняется отдельно в `payload.publication`; исходные данные сотрудника и его фотографии не перезаписываются.
- Добавлен серверный endpoint `POST /api/manager/publish-plant`: он проверяет bearer-сессию и активную роль owner, переносит фотографии в Sanity Assets, создаёт документ `product` в dataset `plants`, перечитывает его и только затем ставит `published`.
- Повторная публикация использует сохранённый Sanity document ID и asset IDs. При ошибке заявка получает `publish_failed`; исходные фото остаются в Supabase для повторной попытки.
- Используются существующие поля таблицы `catalog_submissions` и JSONB payload; SQL migration не требуется. Sanity schema не меняется. Sanity document ID хранится в `payload.publication.sanityDocumentId`, поскольку действующее ограничение БД резервирует `target_document_id` для заявок типа update.
- Проверка Cloudflare Pages project `florial` (01.11.2026): в Production env bindings присутствуют `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` и публичные `VITE_SANITY_*`, но отсутствует серверный Secret `SANITY_API_TOKEN`. Подключённый Sanity management connector позволяет работать с dataset из административного инструмента, однако не предоставляет токен серверной функции сайта. До добавления отдельного Cloudflare Production Secret публикация безопасно вернёт 503 и оставит статус `approved`. Preview secrets не добавляются.
- PR #45: https://github.com/omaraandrey-dev/florial/pull/45. GitHub Actions run `41300128784` завершился success (lint, website build, migration syntax, Studio build). Cloudflare Pages Preview deployment для актуального head `6aae07ed2ea22770579f2c4ddcb8982624b4a262` завершился success (`https://feature-florial-manager-plan.florial.pages.dev`). Preview не содержит server-side Supabase secrets, поэтому функциональный Manager smoke test не выполнялся. PR не объединён; production deployment не выполнялся. Публичные страницы, Header/menu/Footer, checkout и заказы не менялись.

## 2026-11-01 — Florial Manager: мобильная приёмка и проверка растений (PR #44, объединён в main)

- Категория растения выбирается из актуального списка Sanity dataset `plants`; корневая категория «Всички растения» исключена. В payload сохраняются ID категории и её болгарское название.
- В форме сотрудника добавлены предварительный просмотр выбранных фотографий, удаление снимка до загрузки и понятный статус загрузки. Допускается до 8 изображений размером до 10 MB каждое.
- После успешной загрузки путь каждой фотографии сохраняется в payload заявки отдельно; отправка на проверку недоступна, пока остаются несохранённые фотографии.
- Добавлена карточка просмотра заявки с основными полями растения, варианта продажи, цены, наличия, описания и фотографиями из закрытого Supabase Storage.
- Одобрение требует подтверждения; владелец может отклонить заявку с обязательной причиной; менеджер/владелец могут вернуть её на исправление.
- PR #44: https://github.com/omaraandrey-dev/florial/pull/44; merge commit `60890351509b1a4c7916596adc2bb573eccd7484`. Cloudflare Pages production deployment `ba4845b0-5846-480b-9b22-74e380bf6ec6` завершился успешно.
- SQL migration и изменение Sanity schema не требуются. Данные Sanity/Supabase не мигрировались и не удалялись; Header/menu/Footer и публичные страницы не затрагивались.

## 2026-11-01 — Florial Manager: owner-only analytics

- Added owner-only Analytics tab to `/manager`: page views, phone/WhatsApp clicks, language breakdown, popular pages, and daily page-view chart.
- Added 7/30/90-day periods with daily grouping in `Europe/Sofia`.
- Added migration `supabase/migrations/20261101100000_add_owner_site_analytics.sql`; its RPC returns aggregate JSON only and enforces the active owner role.
- Frontend calls the RPC through the current Supabase session. No privileged key is included in browser code and no new Cloudflare bindings are required.
- Reuses existing `public.site_events`; no collection schema or stored events are changed, and no additional visitor data is collected.
- Migration is prepared in the feature branch but has not been applied to production Supabase. The tab needs that migration before data can load.
- Public Header/menu/Footer, catalog, cart, checkout, orders, Sanity, and Cloudflare secrets are unchanged.

## 2026-11-01 — Florial Manager: управление сотрудниками владельцем

- Добавлен отдельный раздел «Сотрудники» внутри закрытого `/manager`; вкладка отображается только для активной роли `owner`.
- Владелец может создавать Auth-учётные записи с email, первоначальным паролем и ролью `seller`/`manager`, просматривать список, менять роль, задавать новый пароль и отключать/восстанавливать доступ.
- Добавлена Cloudflare Pages Function `GET/POST/PATCH /api/manager/staff`: сервер проверяет действующую Supabase-сессию и активный профиль `owner`; административный Auth API вызывается только с серверным `SUPABASE_SERVICE_ROLE_KEY`.
- При отключении сотрудника профиль сохраняется, а RLS helper `private.has_catalog_role` немедленно перестаёт считать его активным. История заявок и ссылки на Auth user не удаляются.
- Физическое удаление учётной записи не выполняется: существующие заявки ссылаются на Auth user, поэтому безопасный вариант — отключить доступ и сохранить аудит.
- Не добавлялись Preview secrets, не менялись существующие Cloudflare bindings, Sanity, публичные Header/menu/Footer, checkout или таблицы заказов. SQL migration не требуется: используются существующие `catalog_staff_profiles` и RLS.
- Ограничение Supabase Auth: стандартный endpoint `auth.updateUser({ password })` остаётся доступен авторизованному пользователю напрямую. В Manager не предоставляется self-service смена/восстановление пароля; строгая блокировка прямого вызова требует отдельной архитектуры авторизации и не считается выполненной этой задачей.
- Изменения подготовлены в PR #41: https://github.com/omaraandrey-dev/florial/pull/41. Ветка основана на актуальном `main` без отставания; GitHub сообщает `mergeable=true`. GitHub Actions run/status для актуального head пока не возвращён; PR не объединён, production deployment не выполнялся.

## 2026-11-01 — Florial Manager: объединение и production rollout

- PR #39 объединён в `main`: merge commit `7d13d25ad7f8f1396d1033a221813058bef28f6b`. Первоначальный конфликтующий PR #38 закрыт без объединения.
- GitHub Actions validation run `41287365219` завершился успешно: lint, website build, migration syntax check, Sanity Studio build.
- Cloudflare Pages production deployment `98ba0318-dfc6-419a-9906-62e90f7980de` завершился успешно; deployment связан с merge commit и production branch `main`.
- Supabase migration `create_florial_manager` применена к production project `shzbflgqfffgzzgpwjxt`, version `20261101080656`.
- Проверено: созданы три таблицы Manager, 6 table RLS policies, 4 Storage policies, helper function, review RPC и один private bucket `florial-manager-intake`.
- Проверено: staff profiles, submissions и audit events пока пусты; Auth users/roles не создавались.
- Production Cloudflare secrets/variables не менялись; Preview secrets не добавлялись. Sanity documents и datasets не изменялись.
- Security Advisor: предупреждения по `orders` и `site_events` без RLS policies соответствуют существующей модели deny-by-default; предупреждение по SECURITY DEFINER RPC ожидаемо, поскольку функция проверяет роль manager/owner внутри себя.
- До фактического входа требуется создать Auth user владельца и назначить ему роль `owner`; email-уведомление и авторизация не прошли сквозной пользовательский тест.
## 2026-11-01 — Florial Manager: первая версия приёмки растений

- Добавлен отдельный закрытый маршрут `/manager`, изолированный от публичной оболочки Header/Footer.
- Реализованы Supabase Auth login, роли `seller`, `manager`, `owner`, форма черновика растений, загрузка фотографий в private Storage и журнал заявок.
- Добавлена Cloudflare Pages Function для уведомления владельца через существующий Resend.
- Добавлена additive SQL migration для staff profiles, submissions, audit events, RLS и private Storage.
- GitHub Actions validation: lint, website build, migration syntax check и Sanity Studio build — успешно.
- Preview secrets не добавлялись. Production Supabase migration будет применена отдельно после merge; пользователи и роли ещё не созданы.
- Автоматическая публикация в Sanity и изменение существующих карточек не входят в первую версию.

## 2026-11-01 — Plant checkout integration and verified production order flow

- Merged PR #36 (`6bc3ee305cc1f50a23d3df036cf628af54704556`) to add plant sale variants to the shared cart while preserving the existing irrigation-equipment cart behavior.
- Added server-side Sanity validation for plant variants in dataset `plants`; irrigation products continue to be validated against `production`.
- Persisted selected plant variant metadata in the existing Supabase `orders.items` JSONB payload; no database schema migration or data rewrite.
- Plant orders use pickup or delivery arranged individually with Florial; equipment-only checkout retains its existing delivery options.
- Production deployment `1ae5a537-6628-4ce0-bf02-97171a5df490` completed successfully.
- Owner manually confirmed production orders on Bulgarian, Russian and English interfaces; PDF generation and delivery of email to both administrator and customer succeeded.
- Updated `docs/TECHNICAL_PASSPORT.md` with the current architecture, order flow, deployment checkpoint, verification scope and remaining unknowns.
- No Sanity schema/document, Supabase schema/data, header, menu or footer changes in PR #36.

## Unreleased — Add plant variants to the shared shopping cart

- Preserve the existing irrigation-equipment cart and checkout flow; extend cart line identity so different sale variants of the same plant remain separate items.
- Add a plant add-to-cart action below the existing WhatsApp enquiry, carrying the selected Sanity sale variant and quantity.
- Display selected plant size, height, container volume and variant price in the shared cart.
- Validate plant product and variant prices server-side against Sanity dataset `plants`; continue validating irrigation equipment against dataset `production`.
- Store catalog and selected variant details in the existing `orders.items` JSONB payload; no Supabase schema or data migration.
- For baskets containing plants, offer pickup or delivery to be agreed with Florial; retain existing courier rates and validation unchanged for equipment-only baskets.
- No changes to header, menu, footer, Sanity documents, Sanity schemas, or existing equipment product pricing logic.

## 2026-11-01 — Коммерческая карточка растения и запрос варианта

- Добавлена аддитивная схема plantSaleVariant: название размера на BG/EN/RU, SKU, высота при продаже, объём контейнера, цена в EUR, старая цена, статус и количество на складе.
- Для растения предусмотрен массив saleVariants; существующие поля plantCare.saleFormat, priceEUR, oldPriceEUR, stockStatus и их значения сохранены.
- Карточка растения показывает выбранный вариант, его размеры, цену и наличие. Устаревшие общие цены растения не используются как цена продажи; если у варианта нет подтверждённой цены, показывается «Цена по запросу».
- Запрос формируется для WhatsApp с названием растения, выбранным размером (или пожеланием к размеру) и количеством. Добавлена локализация BG/RU/EN.
- В списке растений цена выводится от минимальной подтверждённой цены варианта либо «Цена по запросу»; цены оборудования остаются без изменений.
- GROQ-запрос каталога растений расширен полями вариантов и VAT. Данные 30 опубликованных растений, цены, остатки, Sanity/Supabase documents, заказы, header, меню и footer не изменялись.
- Изменения выполняются в отдельной ветке; схема Sanity не развёртывалась и production не публиковался.

## 2026-11-01 — Умные фильтры каталога растений

- Добавлены локальные фильтры на страницах каталога растений: поиск по названию и ботаническому имени, тип растения, освещение, потребность в воде, пригодность для Черноморского побережья и зимоустойчивость.
- Фильтры работают только с заполненными и подтверждёнными значениями; растения с неполными характеристиками остаются в общем каталоге и не исключаются, пока соответствующий фильтр не выбран.
- Для зимоустойчивости используются фактические минимальные температуры из карточек растений; выбор порога показывает растения, выдерживающие эту температуру или более низкую.
- Добавлены счётчик результатов, сброс фильтров, адаптивная раскрывающаяся панель и локализация BG/RU/EN.
- Сохранены существующие карточки, сортировка по названию, категории, SEO, навигация, цены и CTA. Не изменялись Sanity, Supabase, схемы, header, меню, footer и оформление заказа.
- Ценовой фильтр не добавлялся: цены каталога требуют отдельного подтверждения владельца.
- Изменения ограничены `src/pages/CategoryPage.tsx` и этим журналом.

## 2026-11-01 — Plant product detail: structured care profile and cross-links

- Added a responsive plant-care profile to plant product pages, with localized labels and visual indicators for light and water needs, plus frost temperature, mature height, foliage, flowering, planting season, Black Sea coast suitability, and sale format.
- Rendered the Bulgarian Sanity care guide consistently on Bulgarian, Russian, and English product pages, preserving headings, emphasis, lists, and links.
- Added discount percentage and savings display only when the old price is greater than the current price.
- Resolved `relatedContentBySlug` entries to published services and blog posts in the production dataset, preserving optional link labels and localized card content.
- Resolved `recommendedIrrigation.productSlug` to an existing irrigation equipment product when a matching product is present.
- Updated all 30 published plant documents in Sanity dataset `plants`: `oldPriceEUR: 4000`, drip irrigation recommendation linked to `rain-bird-xfd-2333-100`, and related service slug `avtomatizirano-kapkovo-napoyavane`. Existing price, VAT, availability, descriptions, translations, and plant-care values were preserved.
- Header, menu, footer, and global navigation were not modified.

## 2026-11-01 — Расширение модели каталога растений

- Расширена схема dataset plants: plantCare, careGuide, recommendedIrrigation, relatedContentBySlug, isFeatured и oldPriceEUR.
- В productType добавлены значения типов растений при сохранении существующего значения plant и строкового типа поля.
- Существующие mainImage и gallery не изменялись; GROQ теперь передаёт галерею с локализованными alt-полями в уже поддерживаемый ProductPage формат. Карточка использует ALT из Sanity на выбранном языке.
- Frontend распознаёт все поддерживаемые типы растений для каталожной навигации и карточки товара; sitemap также включает новые значения productType.
- plantDetails.scientificName помечено deprecated/hidden/readOnly; поле не удалялось. В GROQ оставлено только plantDetails.availabilityNote.
- Проверка опубликованного dataset plants: 30 товаров, 17 категорий; root scientificName заполнен у всех 30, gallery пока отсутствует у всех 30.
- Контент Sanity не изменялся. Миграция scientificName не запускалась, так как опубликованные документы не нуждаются в переносе.
- Studio build, deployment и production проверка ожидают выполнения на feature-ветке и отдельного подтверждения активной Studio schema. Sanity Manage подтверждает, что `fdy0ldwl717qtp5pikl7715l` — единственное Studio приложение проекта; API пока показывает только legacy schema record для plants, поэтому deployment не запускался.

## 2026-10-31 — Complete RU/EN translations for irrigation kits and category

- Published complete Russian and English localizations for the 13 irrigation products that previously had no translated product names: localized names, short descriptions, full product descriptions, kit contents, component quantities, installation notes, water-flow/pressure requirements where present, and SEO titles, descriptions and keywords.
- Published Russian and English localization for the category `Готови комплекти за автоматично поливане`, including category name, description and SEO metadata.
- Preserved Bulgarian source content, product prices, VAT settings, images, slugs, product/category references and other existing fields. No schema, frontend, Supabase, header, menu or footer changes.
- Verified that all 13 target products have RU/EN names, short descriptions, full descriptions and localized SEO title/description; verified that no equipment category is missing RU/EN names or descriptions.

## 2026-10-31 — Sitemap: indexability and multilingual URL accuracy

- Exclude catalog documents when their Bulgarian/global SEO setting has `noIndex: true`.
- Include RU/EN product, category, service and plant URLs only when the translation exists and that language's SEO setting does not disable indexing.
- Include blog translations only when title, short description, body, SEO title and SEO description are present.
- Add `lastmod` and hreflang alternates only for localized URLs included in the sitemap.
- Sitemap remains dynamic from Sanity `production` and `plants`. No Sanity/Supabase data, header, menu, footer or store structure changed.

## 2026-10-31 — Связанные услуги и статьи на карточках товаров

- В схему товара добавлено отдельное поле Sanity «Свързани услуги и материали» с reference-ссылками на типы `service` и `blogPost`.
- Существующее поле `relatedProducts` («Свързани продукти») оставлено без изменений и продолжает использоваться только для товарных рекомендаций.
- Карточка товара выводит до четырёх выбранных активных услуг и опубликованных статей с локализованными заголовками, описаниями, изображениями и ссылками на соответствующие страницы.
- Существующий программный блок для клапанов/клапанных боксов сохранён как fallback, пока в Sanity не назначены ссылки в новом поле.
- Типа документа `portfolio` в текущей схеме нет; медиатип `photo` не используется как ссылка на страницу.
- Обновлён App ID в CLI на единственное приложение Studio, возвращённое текущим Sanity project; hostname и два workspace сохранены.
- Изменения не мигрируют и не перезаписывают документы Sanity, не меняют товары, `relatedProducts`, header, меню или footer. Schema deployment и production build должны быть подтверждены GitHub Actions и повторной проверкой Sanity API.

## 2026-10-31 — Исправление списка подкатегорий на страницах каталога

- На странице категории отображаются только её непосредственные дочерние категории из дерева Sanity.
- Удалён fallback, который при отсутствии дочерних категорий показывал соседние категории с тем же родителем. Это устраняет посторонние ссылки в «Други компоненти за поливане», «Готови комплекти», «Шахти», «Клапани» и других конечных категориях.
- Рекурсивное отображение настоящих вложенных категорий и список основных категорий на корневой странице «Всичко за поливане» сохранены.
- Изменён только алгоритм подкатегорий в `src/pages/CategoryPage.tsx`; документы Sanity/Supabase, header, меню и footer не затрагивались.
- Проверка сборки будет выполнена GitHub Actions для этой рабочей ветки.

## 2026-10-31 — Упрощение раскрывающегося меню «Поливни системи»

- В меню поливного оборудования теперь отображаются только 10 основных категорий — непосредственные дочерние категории Sanity-корня «Всичко за поливане».
- Убрано рекурсивное раскрытие подкатегорий в Header; вложенные категории по-прежнему доступны на страницах соответствующих категорий.
- Сохранены ссылка «Цялото оборудване за поливане», сортировка, локализация названий и переходы на страницы категорий.
- Фильтр по ID родительской категории исключает категории растений из отдельного dataset и независимые категории без родителя.
- Изменён только Header и этот журнал. Данные Sanity/Supabase, структура каталога, страницы категорий, шапка, footer и остальные разделы меню не изменялись.
- Сборка будет проверена в GitHub Actions после отправки изменений в отдельную ветку.

## 2026-10-31 — Sanity blogPost: исправление валидации ссылок

- Исправлена валидация URL в Portable Text-ссылках: разрешены относительные URL и схемы http, https, mailto, tel.
- Frontend `src/components/BlogContent.tsx` не изменялся: относительные ссылки уже поддерживаются; контактные ссылки по-прежнему исключаются из отображения согласно действующей логике блога.
- Данные статей, идентификаторы документов, каталог и Supabase не изменялись.
- Сборки ожидают выполнения GitHub Actions; production deploy не выполнялся.

## 2026-10-31 — Программная перелинковка клапанов и клапанных боксов с услугами Florial

- Добавлен отдельный компонент `ValveServiceCrosslink`: локализованный информационный блок появляется только на карточках электромагнитных клапанов 24 V/9 V и клапанных шахт.
- Для электромагнитных клапанов добавлена ссылка на статью о монтаже, диагностике, очистке и замене клапанов; для клапанных шахт — ссылка на существующую услугу ремонта и обслуживания поливных систем.
- Тексты и ссылки локализованы на болгарский, русский и английский. Используется существующее изображение обложки статьи.
- Блок размещён на странице товара перед рекомендациями товаров.
- Изменения ограничены frontend-кодом и журналом изменений. Sanity, Supabase, схемы, товары, категории, header, меню и footer не изменялись.

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

## 2026-11-01 — Fix direct access to Florial Manager

- Fixed the Pages middleware route handling so `/manager` and nested `/manager/*` requests pass through to the SPA entry selected by `src/main.tsx` instead of receiving the public site's custom 404 response.
- The change is isolated to `functions/_middleware.ts`; public Header, menu, Footer, public routes, Supabase data, Sanity data and Cloudflare environment variables are unchanged.
- Validation and production deployment status are to be recorded after the pull request checks and merge.


## 2026-11-01 — Plant intake validation and independent photo identification

- Seller plant drafts can now be saved without a name or category; the mandatory-field gate applies only when submitting for owner review.
- Submission requires an uploaded photo, plant type, category, positive EUR price, sale height, container volume, and an explicitly entered integer quantity (0 or greater). The same rules are enforced by the active Supabase trigger.
- Photo Vision analysis no longer receives the seller's Latin name in its prompt, reducing anchoring bias. The visual candidate and seller-entered name are evaluated independently and then checked against GBIF.
- Owner review shows the seller name, visual candidate(s), GBIF match status, and provisional horticultural suggestions. AI-generated botanical values are never published automatically.
- Supabase migration is tracked in Git as `20261101173649_require_complete_plant_submission.sql`, matching the applied production migration version. No existing submissions were changed.
- Production deployment for commit `e57f214ebc0d4477d12f11b7f7b61bc9c30931f6` succeeded: `c7042ff6-04fb-4d47-ae75-d9450cc27883`; aliases include `https://florial-bg.com` and `https://www.florial-bg.com`.
- Manual owner end-to-end verification with a new seller submission and real plant photos remains pending.


## 2026-11-01 — Explicit owner decision for AI care suggestions

- Botanical research results are displayed separately from editable plant-care fields. AI values are no longer copied into the owner draft automatically.
- The owner can accept or reject each proposed care value individually. Accepted values are copied into the editable publication draft; rejected values are not applied. Publishing still requires the normal owner save and separate publish action.
- Existing manually entered/published care fields are preserved and are not overwritten by new research results.
- Production deployment for this refinement: `efb8572c-f64d-49c2-85c9-60b947ff8223`, commit `d65920914b01ba46c5e8a1c1202c5d3f1c4c8a30`, build and deploy stages successful.

## 2026-11-01 — Выбор ботанического имени и устойчивые ошибки проверки

- Первая AI-подготовка теперь возвращает до трёх отдельных вариантов латинского биноминального названия на основе названия, типа, категории и описания продавца. Фотографии не используются для генерации этих вариантов.
- Поле `scientificName` больше не заполняется догадкой текстовой модели. Варианты показываются владельцу отдельно; выбранный вариант передаётся вместе с фотографиями в `/api/manager/enrich-plant-care` для независимого визуального анализа и проверки таксономии через GBIF.
- Подтверждённое GBIF название сохраняется в AI-черновике только после проверки; при несоответствии фотографии и имени выбранное владельцем имя не подменяется автоматически.
- Добавлен общий обработчик неожиданных исключений ботанической функции: этап, безопасная техническая деталь и request ID возвращаются JSON; серверный журнал не содержит токенов или содержимого фотографий.
- Проверены production binding Workers AI и прямой inference-тест обеих моделей. Тест использовал синтетический текст и пустой тестовый пиксель, а не реальное растение; end-to-end Manager workflow требует отдельной проверки владельцем.
- Изменения затрагивают только Manager AI plant preparation/research и документацию. SQL/Sanity migrations, существующие заявки, опубликованные товары, Header/menu/Footer и checkout не менялись.
- Для AI-черновиков, созданных до этого обновления, добавлена отдельная кнопка получения латинских вариантов. Сервер дописывает только `scientificNameCandidates` в существующий `aiDraft` с optimistic lock; описания, фотографии, цены, исходная заявка и финальная публикация не перезаписываются.


## 01.11.2026 — durable botanical inspection workflow

- Replaced the long synchronous Manager request for plant-care inspection with a Cloudflare Workflows job. The Pages endpoint validates the owner, persists a per-job random token and workflow ID in the existing submission payload, then returns HTTP 202.
- Added a private Cloudflare Worker florial-plant-care-workflow with a Workflow entrypoint, retry handling and status endpoint. The Worker is not exposed through workers.dev; it is called through the Pages service binding PLANT_CARE_WORKFLOW.
- The Workflow invokes the protected Pages process route. That route validates the per-job token against the current submission and re-checks the active owner role before running the existing photo, GBIF and Workers AI logic.
- Added owner-authenticated status polling to /api/manager/enrich-plant-care; the Manager UI polls until the Workflow completes or reports an error, then reloads the saved submission.
- Fixed placeholder plant names such as “Эта страница”: the server now falls back to the saved AI draft / submission name. Non-Latin botanical labels are no longer sent to GBIF as if they were Latin binomials; they enter the common-name candidate flow.
- No Supabase SQL migration, Sanity schema/document change, new paid Cloudflare plan, payment method, or public site navigation change. Existing submission data is extended only with a plantCareJob object for the active job/result status; seller payload, prices, publication data and photos are preserved.
- Production Cloudflare Pages binding PLANT_CARE_WORKFLOW was added while preserving existing environment variables and the Workers AI AI binding. Worker source is stored under workers/plant-care-workflow/.
- Validation still required: run a real Manager inspection with the existing Thuja submission and confirm the Workflow completes, the plantCareResearch result is saved, and the UI displays the suggestions. A successful deployment alone does not prove end-to-end AI/GBIF completion.

- Follow-up hardening: Workflow event payload accepts object or JSON-string form; successful processing is idempotent if the Workflow retries after the database save.


## 2026-11-02 — Устойчивый разбор ответа ботанического Vision AI

- В `functions/api/manager/enrich-plant-care.ts` усилен разбор ответа Cloudflare Workers AI Vision: сначала принимается чистый JSON, затем извлекается первый полный JSON-объект с учётом вложенности и кавычек.
- Если Vision-модель всё же возвращает невалидный JSON, её текстовый ответ нормализуется текстовой моделью `@cf/meta/llama-3.3-70b-instruct-fp8-fast` в JSON Mode. Исходный визуальный анализ не повторяется, фотография по-прежнему передаётся только одна — главная.
- Инструкция Vision-модели уточнена: один JSON-объект без Markdown и пояснений; температура снижена до 0.
- В диагностические этапы добавляется `vision_json_repair` при успешном восстановлении формата. При ошибке исходного Vision-ответа данные заявки не изменяются.
- Не менялись Workflow/Worker, UI Manager, Sanity, Supabase, существующие заявки и фотографии, Header/menu/Footer.
- Требуется подтвердить Cloudflare Pages production build/deploy и затем выполнить ручной end-to-end запуск владельцем.


## 2026-11-02 — Восстановлена курьерская доставка оборудования инженером Florial

- В checkout восстановлен активный способ `courier` для заказов, содержащих только оборудование для полива. Покупатель выбирает населённый пункт из прежнего списка, видит прежний тариф и указывает обязательный адрес.
- Восстановлены прежние тарифы: Слънчев бряг — бесплатно; Несебър, Свети Влас, Тънково, Равда, Кошарица, Ахелой, Александрово, Оризаре, Гюльовца, Медово, Порой, Каблешково — 10 EUR; Поморие, Каменар, Лъка, Баня, Бата, Гълъбец, Габерово — 15 EUR; Дъбник — 17 EUR; Горица, Белодол, Емона, Страцин, Обзор — 20 EUR; Приселци, Козичино, Раковсково, Паницово — 25 EUR.
- Курьерская доставка обозначает доставку оборудования инженером Florial, а не интеграцию Econt. Для корзины с растениями (включая смешанную) вместо неё доступно только индивидуальное согласование доставки с Florial; город обязателен, адрес необязателен, стоимость и итог остаются NULL до согласования.
- Серверная функция повторно проверяет тип корзины, населённый пункт и адрес, не доверяя клиентским тарифам. Для courier сохраняет подтверждённый тариф в `delivery_fee` и сумму в `total`; для растений сохраняет NULL до согласования; самовывоз остаётся бесплатным.
- Способы оплаты не менялись: активна только оплата в магазине. Supabase схема и существующие 18 заказов не изменялись. Header, menu, Footer и Manager не затрагивались.

## 2026-11-02 — Диагностика первичного создания владельца Florial Manager

- В `functions/api/manager/auth/bootstrap.ts` добавлена обработка неожиданных исключений с request ID и безопасным этапом выполнения (`configuration`, `origin_check`, `owner_lookup`, `request_body`, `password_hash`, `owner_insert`). В журнал записываются только ID запроса, этап, тип и ограниченное сообщение ошибки; пароль, bootstrap secret, соль и хеш пароля не логируются.
- Ошибки конфигурации, same-origin, неверного одноразового секрета, валидации и уже существующего owner сохраняют отдельные HTTP-ответы; неожиданные сбои возвращают HTTP 500 с кодом проверки и этапом, не раскрывая SQL-детали клиенту.
- В Manager UI добавлен разбор текстового ответа сервера, отображение HTTP-статуса, этапа и request ID; сетевой сбой получает отдельное понятное сообщение.
- Под полем постоянного пароля явно показано ограничение 12–128 символов; клиентское поле теперь также ограничено максимумом 128.
- Не менялись D1 schema/data, Cloudflare secrets/bindings, Sanity, Supabase, каталог, публичные маршруты, Header, menu, Footer и checkout. Owner не создавался автоматически; bootstrap остаётся одноразовым.
- Сборка и Production deployment фиксируются после выполнения GitHub Actions и Cloudflare Pages для этого изменения.

## 2026-11-03 — Визуальные карточки подкатегорий каталога растений

- На страницах категорий растений текстовые ссылки-плашки заменены адаптивной сеткой карточек с фотографией, названием и переходом в соответствующую категорию.
- На мобильных устройствах отображаются две карточки в ряд; на широких экранах сетка расширяется до трёх или четырёх колонок.
- Используются существующие изображения и фактические дочерние категории из Sanity dataset `plants`; порядок категорий и отдельные SEO-страницы сохранены.
- Для оборудования полива внешний вид подкатегорий не меняется. Header, меню, Footer, маршруты, товары, Sanity-документы и база данных не изменяются.

## 2026-11-03 — Granular Florial Manager permissions and staff delegation

- Replaced the three-flag-only Manager permission model with ten independent permissions: plant creation, final-card editing, variant creation, price editing, submission review, approval, Sanity publication, staff management, permission delegation, and analytics.
- Owner role bypasses individual flags and retains full administrative access. Managers receive only explicitly assigned permissions.
- Managers may create staff accounts only when `canManageStaff` is granted. Creating another manager and delegating permissions additionally requires `canDelegatePermissions`.
- Server-side delegation validates every requested permission against the actor's own permissions. Managers can manage only staff accounts they directly created; owner accounts cannot be modified through the staff endpoint.
- Added a staff permission audit table recording the actor, target, action, previous permissions, new permissions and timestamp.
- Added additive D1 migration `0006_manager_permissions.sql`: nullable `created_by`, normalized permission JSON for existing profiles, strict JSON boolean triggers, staff indexes and permission audit table. Existing profiles, passwords, sessions, submissions and published catalog documents were preserved.
- Applied migration `0006_manager_permissions` to Production D1 and verified its migration marker, new column, indexes, triggers, audit table and normalized permissions for both existing profiles.
- Added server-side permission checks to submission queries and transitions, review/return actions, approval, plant-card preparation, botanical AI preparation, catalog changes, analytics and Sanity publication. The UI hides actions without the corresponding permission, but API checks remain authoritative.
- Managers with `canCreatePlant` can create and submit their own drafts. `canApprovePlantSubmission` and `canPublishPlant` remain separate actions; publication still requires an approved submission.
- Staff-management controls now support permission assignment within the manager's own delegated rights. Seller role cannot receive review, final-card editing, approval, publication, staff-management, delegation or analytics permissions.
- No public storefront, navigation, header, footer, cart, checkout, orders, Sanity schemas or existing plant/product documents were changed. Legacy Cloudflare Supabase variables were not modified.
- Production build verification is tracked against the latest main deployment; functional login/role testing still requires an authenticated owner session.

### Permission workflow hardening — 03.11.2026

- Split existing-plant variant/price requests into two server-enforced transitions: `submitted/in_review → approved` requires `canApprovePlantSubmission`; `approved/publish_failed → published` requires `canPublishPlant`.
- Added idempotent retry detection for variant insertion and price updates, so a Sanity write followed by a failed D1 status update can be safely confirmed on retry.
- Editing a previously approved or failed plant publication card now resets the submission to `in_review`, clears prior approval/publication markers and requires a fresh approval before publication.
- Generic Manager data updates can no longer set protected publishing states or approve existing-plant changes outside the dedicated catalog API.
- Central permission evaluation now blocks manager-only permissions for the seller role. Staff demotion from manager to seller automatically removes manager-only permissions and records the change.
- Tightened submission event access, notification ownership, image-library and image-upload permissions; retained owner bypass for all Manager operations.
- Confirmed Production D1 migration 0006 remains additive; no test staff or catalog submissions were created.

### Production release — 03.11.2026

- Cloudflare Pages Production deployment completed successfully for `main` commit `b1ccfe7aeb076118bac5c2924ec95fb9fd89e279` (deployment `dcde054a-b193-42cb-99a9-941bad9b3ae4`); build and deploy stages succeeded and Pages Functions are included.
- Remaining Russian Manager interface and surfaced API error text were translated into Bulgarian.
- Authenticated owner/manager/seller role-matrix tests remain to be completed in the live Manager panel. No test staff or catalog records were created.


## 2026-11-04 — Восстановление checkout и каталог товаров в Manager

- Исправлена структура production D1 trigger `trg_orders_order_created`: в INSERT явно добавлен `actor_name`; состав столбцов и значений теперь совпадает со схемой `order_events`.
- Добавлена аддитивная миграция `0009_fix_order_created_trigger.sql`. Она заменяет только триггер создания события и отмечает миграцию; существующие заказы и события не переписываются.
- В checkout добавлен JSON-обработчик неожиданных серверных исключений с request ID; клиент корректно разбирает не-JSON ответы и HTTP-статус.
- В Manager добавлен каталог для добавления позиций: выбор оборудования/растений, переход по категориям и подкатегориям Sanity, затем выбор конкретного товара или варианта растения.
- Повторное добавление того же товара/варианта увеличивает количество существующей строки.
- Поиск по точному имени или SKU больше не является обязательным действием; API сохраняет защищённый поиск как вспомогательный режим.
- Header, меню, Footer, публичный каталог, корзина и её визуальная структура не менялись.
- Production D1 migration `0009_fix_order_created_trigger` applied 04.11.2026; Pages production deployment `7ad8eeef-8ab7-4abe-b4f8-96cd0ebe4978` succeeded. Manual owner confirmation of checkout and both email deliveries remains pending.


## 2026-11-04 — Компактный мобильный дизайн каталогов

- Для категорий поливочного оборудования и растений введено единое компактное отображение подкатегорий: миниатюра слева, название справа, адаптивная сетка из двух колонок на телефонах.
- Для иерархических подкатегорий оборудования добавлены компактные карточки с существующими изображениями Sanity, если изображение задано; структура и порядок категорий не меняются.
- Сетка товаров на страницах категорий теперь показывает две колонки на мобильных экранах; на широких экранах сохраняется расширение до трёх/четырёх колонок.
- Уменьшены мобильные отступы и высота изображений/типографика карточек для комфортного размещения двух товаров в строке.
- Изменения ограничены `src/pages/CategoryPage.tsx` и этим журналом. Header, меню, Footer, маршруты, поиск, фильтры, сортировка, данные Sanity, корзина, checkout и база D1 не изменялись.

## 2026-11-04 — Иерархия категорий, пагинация и компактные карточки каталога

- На главной странице каталога поливочного оборудования отображаются только категории верхнего уровня; дочерние категории показываются только после открытия родительской категории. Убрано рекурсивное раскрытие всех уровней на одной странице.
- Для непосредственных подкатегорий оборудования и растений используется единый компактный формат: миниатюра слева, название справа, адаптивная сетка.
- Для каталога оборудования добавлена пагинация по 20 товаров с переходом назад/вперёд и диапазоном отображаемых товаров. При смене категории, списка товаров или фильтров растений текущая страница сбрасывается; каталог растений пагинацией не ограничивается.
- Карточки оборудования и растений уплотнены: название сразу под изображением, затем краткое описание, цена, кнопка «Виж детайли» и категория мелким однострочным текстом с обрезкой длинных названий. Строка о включённом ДДС из карточки удалена.
- Статус наличия отображается небольшой точкой: зелёная для inStock, синяя для onRequest; для outOfStock и неизвестных значений точка не выводится. Для растений учитываются статусы вариантов продажи, если статус товара не задан как inStock или onRequest.
- Сохранено отображение старой цены при наличии корректной более высокой oldPriceEUR; логика ценовых вариантов растений и переход к карточке товара сохранены.
- Изменения ограничены src/pages/CategoryPage.tsx и CHANGELOG.md. Header, меню, Footer, схемы и данные Sanity, корзина, checkout, Manager, D1 и серверные функции не изменялись.

## 2026-11-04 — Пагинация растений и приоритетная выкладка каталога

- В каталоге растений убран отдельный текстовый заголовок «Подкатегории»; после названия категории и описания сразу отображаются карточки её дочерних категорий.
- Пагинация по 20 карточек включена для растений и сохранена для оборудования. Диапазон отображаемых позиций и количество страниц рассчитываются после применённых фильтров.
- Переключение «Назад» / «Напред» прокручивает к началу сетки новых карточек, а не к началу всей страницы.
- Основные категории оборудования отсортированы в заданном коммерческом порядке: готовые комплекты, контроллеры, разпръсквачи, дюзи, клапани, шахти, капково напояване, тръби и фитинги, филтри, други компоненти. Новые неизвестные категории остаются после заданных.
- В общей витрине «Всичко за поливане» товары шести приоритетных групп (контроллеры, готовые комплекты, разпръсквачи, дюзи, клапани, шахти) чередуются по кругу, чтобы равномерно попадать на первые страницы. Остальные товары идут после исчерпания приоритетных групп.
- Изменения касаются только src/pages/CategoryPage.tsx и CHANGELOG.md; данные Sanity, схемы, корзина, оформление заказов, Manager, Header, меню и Footer не изменялись.

## 2026-11-04 — Заполнение изображениями карточек каталога

- Карточки подкатегорий оборудования теперь используют изображение на всю ширину и высоту своего визуального блока (`object-cover`), с лёгким скруглением углов; убрана прежняя маленькая миниатюра внутри отдельной серой рамки.
- В карточках товаров оборудования и растений убраны внутренние отступы вокруг изображения. Само изображение занимает всю доступную высоту фотоблока; для сохранения полного вида товара оставлен `object-contain`, поэтому узкие вертикальные изображения масштабируются по высоте без обрезания.
- Изменены только карточки каталога в `src/pages/CategoryPage.tsx` и запись журнала. Данные Sanity и логика магазина не затрагивались.


## 2026-11-04 — Возврат компактных карточек категорий поливочного оборудования

- Исправлено отображение категорий на главной странице каталога поливочного оборудования: вместо крупных фотоплиток снова используется тот же компактный формат, что и в каталоге растений — миниатюра слева, название справа и стрелка перехода.
- Сохранена сетка из двух колонок на мобильных экранах, с адаптивным расширением до трёх и четырёх колонок на более широких экранах. Размер миниатюр, скругления, рамка, интервалы и hover-состояния соответствуют карточкам категорий растений.
- Сохранён заданный коммерческий порядок категорий оборудования; изменён только способ их визуального отображения.
- Карточки товаров растений и оборудования уже формируются одним общим шаблоном в src/pages/CategoryPage.tsx; этот единый шаблон сохранён. Цена растений по вариантам продажи и цена оборудования из карточки товара продолжают рассчитываться по своим типам данных, без изменения бизнес-логики.
- Изменён только src/pages/CategoryPage.tsx и этот журнал. Header, меню, Footer, данные и схемы Sanity, D1, корзина, checkout, Manager и серверные функции не затрагивались.


## 2026-11-04 — Выравнивание блоков главной страницы и единый формат изображений

- В desktop-версии блока услуг подпись «Извършваме дейности», заголовок «Професионални решения за градината» и ссылка «Всички услуги» выстроены в одну горизонтальную линию; мобильное расположение сохранено.
- В заголовке секции растений название остаётся слева, а поясняющий текст на широких экранах выравнивается справа на одной высоте; на мобильных устройствах сохраняется вертикальное расположение.
- Изображения карточек услуг, доставки и категорий поливочного оборудования приведены к принципу карточек растений: полноширинный верхний фотоблок, адаптивная высота и заполнение области через object-cover.
- Изменён только `src/pages/HomePage.tsx` и этот журнал. Header, меню, Footer, данные и схемы Sanity, D1, маршруты, каталог, корзина, checkout и серверные функции не изменялись.


## 2026-11-05 — SEO и локализованные метаданные официального логотипа

- Для документа Sanity типа `photo` предусмотрены локализованные названия `title/titleEn/titleRu` и ALT внутри `image.alt/image.altEn/image.altRu`. Существующее `seoDescription` (BG) сохранено; отдельные SEO description EN/RU не добавляются.
- Запрос логотипа получает локализованные ALT и названия, резервные title/alt из Sanity Asset metadata и реальные размеры изображения.
- Header использует локализованный ALT и title, доступное название ссылки на главную страницу локализовано; добавлены intrinsic width/height и eager loading для небольшого изображения в шапке. Визуальная разметка и CSS шапки не менялись.
- В JSON-LD Organization добавлен logo как ImageObject с подтверждённым абсолютным URL и размерами файла; обновлено описание изображения Open Graph в базовом HTML.
- Изменения ограничены Header.tsx, App.tsx, src/types.ts, схемой photo, middleware, index.html и документацией. Меню, Footer, дизайн шапки, каталог, корзина, checkout, D1 и опубликованные документы Sanity не изменялись.
- Документ официального логотипа заполнен и опубликован: BG/RU/EN title и ALT; существующий BG SEO description сохранён. Опубликованная Sanity-схема подтверждена через schema API.
- Дополнительно проверены метаданные самого Sanity Asset: исходное имя файла `florial-logo-gardencenter.png`, asset title и description на BG заполнены, `altText` пока пуст. GROQ теперь также получает эти asset-level поля как fallback; OG image alt для стандартного логотипа формируется на языке страницы, а для отдельного page image сохраняется title страницы.

- Production release: PR #88 объединён в `main` (commit `9faeef8a9daf60258e3bf59483099d14cb1f8320`); Cloudflare Pages deployment `efa67989-b723-468b-88ea-7036e9b77715` завершился `success`, алиасы включают `https://florial-bg.com` и `https://www.florial-bg.com`.


## 2026-11-05 — Общий блок консультации для категорий оборудования и растений

- Унифицирован нижний блок помощи на страницах обеих веток каталога: поливочное оборудование и растения. Убрано ограничение, скрывавшее блок для plant categories.
- В Sanity `helpBlock` предусмотрены болгарские title/text/buttonLabel, переводы EN/RU и отдельный `buttonUrl` для внутренней страницы услуги или статьи.
- Для plant categories GROQ-запрос теперь также получает `helpBlock`; тип `CategoryItem` расширен полем `buttonUrl`.
- Ссылка допускает только внутренние адреса `/services/*` и `/blog/*`. Если адрес не задан или некорректен, применяется резервная услуга по типу каталога: монтаж автоматического полива для оборудования и засаждане на растения для растений.
- Изменения не затрагивают Header, меню, Footer, карточки товаров, корзину, checkout, Manager, D1 и существующие SEO-поля. Содержимое документов Sanity будет заполняться отдельно после подтверждения опубликованной схемы обоих datasets.


## 2026-11-05 — Публикация блоков помощи для всех категорий каталога

- PR #94 объединён в `main` (commit `d0e526b8361ef860b63f2a5c821b5f39db55eed1`).
- Production deployment Cloudflare Pages `6491a004-a7ea-4810-8b84-607057a2f4f9` завершился со статусом `success`; опубликована версия сайта с изменениями категории.
- В Sanity опубликованы локализованные `helpBlock` для всех 54 категорий оборудования в dataset `production` и всех 17 категорий растений в dataset `plants`.
- Каждый блок содержит BG title/text/buttonLabel, полные переводы EN/RU и внутренний `buttonUrl`. Read-only проверка подтвердила 71/71 полных блока.
- Проверены все 7 уникальных CTA-маршрутов: существующие услуги по автоматическому и капковому поливу, услуга по засаждане на растения и четыре профильные статьи для разпръсквачи, програматори, клапани и маслини.
- Для пальм и остальных категорий растений без профильной статьи пока используется услуга «Засаждане на растения». После публикации статей по отдельным видам достаточно заменить `helpBlock.buttonUrl` соответствующей категории.
- SEO, изображения, цены, описания, товары, Header, меню, Footer, корзина и оформление заказа не изменялись.


## 2026-11-05 — Уникализация заголовков helpBlock категорий оборудования

- В Sanity dataset `production` исправлены заголовки 30 категорий оборудования, для которых ранее повторялись общие формулировки: резьбовые фитинги, контроллеры, компрессионные соединения, капкови компоненти и дюзи.
- Для каждой из 30 категорий заданы отдельные BG/RU/EN заголовки, соответствующие фактическому назначению подкатегории.
- Изменения сохранены как 30 черновиков и затем успешно опубликованы через Sanity. Обновлялись только `helpBlock.title`, `helpBlock.translations.en.title` и `helpBlock.translations.ru.title`.
- Тексты helpBlock, переводы текстов, CTA labels, `buttonUrl`, SEO, изображения, товары, цены и иерархия категорий не изменялись.
- Итоговая read-only проверка Sanity: 54/54 уникальных заголовка оборудования и 17/17 уникальных заголовков растений; все 71 категории имеют BG/RU/EN title/text и внутренний CTA URL.
- Географическая проверка: 71/71 блоков содержит региональное упоминание на каждом из трёх языков; упоминаний Созополя/Sozopol — 0. Регион ограничен Бургасом, Несебром, Равдой, Слънчев бряг, Свети Власом, Ахелоем, Поморием, Кошарицей, Каблешково и ближайшими населёнными пунктами.
- После публикации черновиков не осталось. Изменения относятся только к содержимому Sanity; код сайта, схема, Cloudflare Pages, Header, меню, Footer, каталог товаров, корзина, checkout и D1 не изменялись. Новый frontend deployment не требуется.


## 2026-11-05 — Восстановление CHANGELOG и исправление helpBlock главной категории

- Восстановлено полное содержимое `CHANGELOG.md` из последней полной версии до ошибочной замены файла (commit `5a09cd7b072b5b7642dd0654ed74dea6b41d3525`).
- Добавлена запись о корректировке helpBlock главной категории «Всичко за поливане» в Sanity dataset `production`: обновлены BG/RU/EN title и text; CTA labels, `buttonUrl` и блок подкатегории «Други компоненти за поливане» сохранены.
- Публикация категории подтверждена повторным чтением Sanity perspective `published`. Изменения сайта и Cloudflare Pages deployment не требовались.
- Добавлены обязательные правила заполнения helpBlock новых категорий в технический паспорт: назначение категории, самостоятельные BG/RU/EN тексты, релевантный CTA, проверка иерархии и опубликованного результата.


## 2026-11-05 — SEO-заголовки подкатегорий и изображение категории на desktop

- Названия непосредственных подкатегорий оборудования и растений в карточках каталога размечены семантическим заголовком H2. Заголовки товаров остаются H3, главный заголовок страницы — H1.
- Блок заголовка и краткого описания категории на широких экранах использует сетку 2/3 + 1/3: справа показывается собственное изображение категории из Sanity с локализованными ALT/title через существующий helper getCategoryImageText.
- Изображение категории скрыто на мобильных экранах; при отсутствии изображения сохраняется полноширинный текстовый блок без пустой колонки.
- Используются уже загружаемые поля imageUrl, imageAlt*, imageTitle*; запросы Sanity, документы и схема не изменялись. Header, меню, Footer, товары, корзина, checkout, Manager и D1 не затрагивались.


## 2026-11-09 — Новая услуга «Засаждане на лавандула» опубликована

- В Sanity Production (`bxvcy0qs/production`) создан и опубликован новый документ `service`: ID `4ee02515-24f2-42b7-8fc7-e98d5e75ffcf`, slug `zasazhdane-na-lavandula`, `serviceCategory=planting`, `serviceLayout=standard`, `sortOrder=27`, `isActive=true`. До создания проверено отсутствие документа с таким slug; существующие 10 услуг не изменялись. Для нового документа backup прежней записи не применим; после публикации сохранён отдельный JSON snapshot.
- Созданы BG Portable Text и RU/EN Markdown версии; H1 задан через локализованный `hero.title`. Заполнены краткие описания, преимущества, этапы, CTA, SEO metaTitle/metaDescription/keywords и `noIndex=false` для трёх языков.
- Hero использует существующий Sanity asset `image-ae47127869479bd2d8d0bfd01e7b2a4676923d-896x1195-jpg` (реальный asset ID: `image-ae47127869479bd2d8d0bfd01e7b2a4676923d-896x1195-jpg`); ALT заполнен на BG/RU/EN. Новые изображения не загружались, schema и frontend не менялись.
- `relatedContent` ссылается на существующие услуги `zasazhdane-na-rasteniya` и `avtomatizirano-kapkovo-napoyavane`. Форма локализована BG/RU/EN; технические имена полей `name`, `phone`, `email`, `location`, `details` сверены с `normalizeLeadFields`. Endpoint `/api/service-leads` не менялся.
- Production live smoke через Firecrawl: BG/RU/EN — HTTP 200; локализованные H1, title, description, `robots=index, follow`; hero image, related cards и все поля формы отображаются. Реальная заявка не отправлялась, запись в D1 и email delivery не тестировались.
- Изменения только в Sanity content и документации. GitHub source code, Sanity schema, D1, API, Manager, Cloudflare settings, Header, меню, Footer и Cloudflare Pages deployment не изменялись. Новая сборка/деплой не требовались.

## 2026-11-09 — Новая услуга «Засаждане на палми»

- В Sanity Production (`bxvcy0qs/production`) создана и опубликована новая услуга: document ID `5fd92607-19dd-44ae-b546-01e841f835c9`, slug `zasazhdane-na-palmi`, категория `planting`, layout `standard`, sortOrder 28, active.
- Подготовлены болгарская версия Portable Text и локализованные RU/EN версии Markdown. H1 задан через `hero.title`; заполнены краткие описания, преимущества, этапы, CTA, форма и SEO title/description/keywords для трёх языков; `noIndex=false`.
- Пользовательская фотография использована как главное изображение Hero и карточки услуги. Новый Sanity asset: `image-962060f9e538f42cef2b5ae405a50df59e1d78bf-1536x1147-jpg` (1536×1147); ALT заполнен на BG/RU/EN.
- `relatedContent` ссылается на существующие услуги общей посадки растений `zasazhdane-na-rasteniya` и монтажа автоматической поливной системы в Несебре `montaj-avtomatichni-polivni-sistemi-nesebar`.
- Материал адаптирован к Южному Черноморью: выбор вида по микроклимату и зимним температурам, почва и дренаж, сохранение корневого кома, глубина посадки, позиционирование крупных пальм, временное укрепление, полив, обрезка и зимняя защита. Не добавлялись фиксированные цены, гарантии приживаемости или обещания наличия подъёмной техники.
- Существующий endpoint `/api/service-leads` и имена полей формы `name/phone/email/location/details` сохранены. Реальная заявка не отправлялась; D1 insert и email delivery end-to-end не тестировались.
- Live smoke Firecrawl: BG/RU/EN — HTTP 200; локализованные title/description, `robots=index, follow`, Hero image и содержимое статьи отображаются. Страница `/services` показывает карточку «Засаждане на палми» с правильным изображением и ссылкой.
- JSON snapshot опубликованного документа: `docs/backups/sanity-service-zasazhdane-na-palmi-2026-11-09.json`.
- Изменения только в Sanity content и документации. GitHub application code, Sanity schema, D1, API, Manager, Cloudflare settings, Header, меню, Footer и Cloudflare Pages deployment не изменялись. Новая сборка/деплой не требовались.

## 2026-11-09 — Фотографии внутри статьи «Засаждане на палми»

- В опубликованном Sanity service document `5fd92607-19dd-44ae-b546-01e841f835c9` три ранее добавленных изображения перенесены из верхней галереи в `contentBlocks` с использованием существующего механизма inline image groups.
- Размещение: `trenches` — «Оглед и подготовка на терена»; `equipment` — «Професионално засаждане на палмата»; `watering` — «Първоначално поливане и последващи грижи». Для RU/EN добавлены соответствующие сопоставления заголовков в `src/pages/ServicePage.tsx`.
- Заполнены ALT на BG/RU/EN. Assets сохранены без повторной загрузки: `image-8c4ff55932116280da42f95d3b346d9ead9007f7-3072x4096-jpg`, `image-bd788671f48fd731e23fb193e5f30fba4851991f-995x995-png`, `image-4c5e0022877738ae9339e51226a77e743a5f703e-1243x1243-jpg`.
- Верхняя gallery очищена после переноса ссылок, чтобы не показывать дубликаты; все три asset references сохранены в contentBlocks. Pre-edit JSON backup: `docs/backups/sanity-service-zasazhdane-na-palmi-before-inline-gallery-2026-11-09.json`; post-edit snapshot: `docs/backups/sanity-service-zasazhdane-na-palmi-after-inline-gallery-2026-11-09.json`.
- Schema Sanity не менялась; новые поля Title не добавлялись. Изменён только section-heading mapping существующего inline gallery renderer в `src/pages/ServicePage.tsx`.
- CI/Production результат будет зафиксирован после проверки.
 
## 2026-11-09 — Production deployment inline-фотографий пальм (PR #138)

- PR #138 объединён в `main`: merge commit `b08469b5ee8cc3ee8ae1878865237f03339e83c6`.
- Cloudflare Pages project `florial`: Production deployment `19748523-6a55-4d5e-bb28-bd69b2b131fc`, статус `success`, branch `main`, commit `b08469b5ee8cc3ee8ae1878865237f03339e83c6`; URL deployment `https://19748523.florial.pages.dev`.
- Production smoke на `florial-bg.com/services/zasazhdane-na-palmi`: BG/RU/EN HTTP 200, `robots=index, follow`, локализованные H1/title. Все три фото отображаются в статье после соответствующих разделов, ALT совпадает с языком страницы.
- Mobile smoke 390px: HTTP 200, все три изображения найдены в DOM, три inline image sections; верхняя повторная галерея отсутствует.
- CI: `Florial D1 migration validation` run #636 — success; `Blog and Studio validation` run #594 — success, включая website lint, utility tests, website build, migration syntax/dry-run и Sanity Studio build.
- Production deployment и live HTML подтверждают, что код и Sanity content синхронизированы. Реальные заявки не отправлялись; форма и D1/email end-to-end не тестировались.

## 2026-11-09 — Ограничение блока услуг на главной странице

- `src/pages/HomePage.tsx`: после существующей сортировки `getOrderedServiceEntries(services)` главная страница отображает только первые 6 элементов через `.slice(0, 6)`.
- Кнопка «Всички услуги» без изменений ведёт на `/services`; полная страница услуг и данные Sanity не ограничиваются.
- Сохранены существующий порядок `sortOrder`, fallback-карточка доставки, локализация BG/RU/EN, ссылки и оформление карточек.
- Изменение касается только количества карточек в домашнем блоке. Запрос Sanity и объём загружаемых данных не менялись; это сокращает число рендеримых карточек/изображений, но не объём сетевой загрузки услуг.
- Header, меню, Footer, SEO, Sanity, D1, API, Manager и checkout не затронуты.
- GitHub PR #140 merged squash; main commit `45aa522094420bdae31de47c593a5901a79723ae`.
- CI: Blog and Studio validation run `42577200758` — success (lint, website tests, website build, migration syntax/dry-run, Studio dependency install and Studio build); D1 migration validation run `42577200732` — success (lint, website build, Pages Functions syntax).
- Cloudflare Pages Production deployment `f0130655-d3e3-4695-a22b-717f1fb9e081` for commit `45aa522094420bdae31de47c593a5901a79723ae` completed successfully at `2026-11-09T07:07:42Z`; aliases `florial-bg.com` and `www.florial-bg.com`.
- Code and production deployment are verified. Browser-level live card-count/click-through smoke was not performed in this run.


## 2026-11-09 — Florial performance optimization roadmap v1.0

- Создан основной документ `docs/ROADMAP_PERFORMANCE_OPTIMIZATION.md` (commit `b238f063bae150f21615c6eac66795c736094956`).
- Зафиксированы статические наблюдения исходников: начальные GROQ-запросы App, повторный fetch последних публикаций из Header и BlogSection с избыточной проекцией body/gallery, Sanity clients с `useCdn: false`, статические импорты App/Manager/pages, необходимость измерить изображения и cache headers.
- Определены этапы 0–7: baseline; оптимизация данных главной; карточные GROQ projections/блог; изображения; Sanity CDN/cache; code splitting; остальные страницы; регрессия/Production.
- Baseline Lighthouse/Core Web Vitals, Network waterfall, cache headers и payload ещё не измерены. Статический аудит не является доказательством фактического узкого места.
- Runtime-код, Sanity, D1, API, Cloudflare settings/secrets и Production не менялись. Следующая точка — Этап 0.
- Создана контрольная инструкция MD2 rev31; rev30 и предыдущие редакции сохранены.


## 2026-11-09 — CLS follow-up: intrinsic dimensions for SEO fallback image

- Runtime commit `9bd5d3fb268d7dec9c3dab330e8039987ec78718` on `main`: `perf: prevent SEO fallback image CLS`.
- Changed runtime files: `functions/_middleware.ts` (adds intrinsic dimensions to the SEO fallback image emitted by `documentBody`), new `functions/lib/sanityImageDimensions.ts`, and new `tests/sanity-image-dimensions.test.mjs`.
- The helper accepts only HTTPS URLs on `cdn.sanity.io/images/`, parses the original `-WIDTHxHEIGHT.ext` asset suffix, validates positive safe integers, and returns width/height attributes. It does not infer dimensions for arbitrary URLs or dimensionless assets.
- The test file covers square, landscape and portrait assets, query parameters, non-Sanity URLs, missing dimensions and zero dimensions.
- GitHub Actions run `42635382574` (Florial D1 migration validation) completed successfully. Its steps included dependency installation, lint, website build and Pages Functions syntax check. This push-triggered run did not execute `npm test`; the new unit tests still require the PR validation workflow.
- Cloudflare Pages Production deployment `88fd47db-3990-4447-813e-be6b12a42028` completed with status `success`, from commit `9bd5d3fb268d7dec9c3dab330e8039987ec78718`; aliases `florial-bg.com` and `www.florial-bg.com`.
- This is a targeted image-geometry mitigation, not proof that the category CLS residual is fixed. No new controlled CLS measurement was obtained after this deployment. Desktop CLS, Lighthouse and INP remain unmeasured.
- A live scrape returned HTTP 200 and the client-rendered category shell, but did not expose the pre-JavaScript response needed to verify the fallback image attributes. Do not treat this as raw-HTML or CLS verification.
- Source inspection confirms the mobile CategoryPage category image is hidden below the desktop breakpoint; subcategory/product images use fixed-size containers. The initial server fallback is generated separately by `documentBody`. A browser trace is still required to identify whether the remaining shift comes from the fallback image, the client replacing fallback markup, asynchronous category detail, or another element.
- No Sanity data/schema, D1 data/migrations, Manager, orders, checkout, API contracts, Header, menu, Footer component or Cloudflare settings/secrets were changed by this commit.


## 2026-11-09 — Production browser-rendering diagnostics after SEO image fix

- Cloudflare Browser Rendering was used as an independent browser path after the Firecrawl CDP session quota became unavailable. All observations below are unthrottled lab runs, not Lighthouse or field CrUX.
- With JavaScript disabled, the live category route returned HTTP 200, the SEO fallback H1 was present, the loading placeholder was absent, and the fallback image HTML contained the original `width="1254" height="1254"` attributes. This confirms the middleware fix is present in the initial server HTML.
- Category route, 3 fresh sessions each at mobile 390×844 and desktop 1365×900, cacheTTL=0: mobile CLS `0`, `0.0002631`, `0.0002631` (median `0.0002631`); desktop CLS `0.0148097` in all three runs (median `0.0148097`).
- Homepage: 3 mobile runs CLS `0.0002631` each; 3 desktop runs `0.0148097` each. Blog and service detail: one mobile/desktop run each with the same corresponding values. The known blog article route also returned HTTP 200 and had mobile `0.0002631` / desktop `0.0148097`.
- Mobile shifts were limited to the Header search form changing from x=108.69/w=169.27 to x=119.5/w=158.45 (390 px viewport). Desktop shifts were the shared Header/content geometry: content wrapper y=73/h=827 to y=77/h=823, and Header search form x=323.39/y=15 to x=344.81/y=17. No Footer node appeared among shift sources. This is a small shared desktop shift (CLS < 0.1), not category-specific.
- Browser-rendering LCP medians: category mobile `0.872 s`, category desktop `0.812 s`; homepage mobile `1.692 s`, homepage desktop `1.504 s`. FCP medians: category mobile `0.532 s`, category desktop `0.324 s`; homepage mobile `1.296 s`, homepage desktop `0.836 s`. These values are unthrottled and environment-specific; do not compare directly with the earlier 4× CPU / 150 ms network test or label them Lighthouse scores.
- Event Timing returned no user-interaction entries because the diagnostic did not perform trusted user interactions. INP is therefore not measured. Long Task observations are not a substitute for INP.
- The previous controlled profile (390×844, CPU 4×, 150 ms latency, 10/1.5 Mbps, cache disabled) was not reproducible through this browser-rendering endpoint. Keep the previous controlled post-fix comparison marked pending until repeated with that same profile.
- Docs PR #159 merged as `180a07d356305cc927f185cc748c615c345a48c9`; its Production deployment `9a70fddc-ce74-4743-9cd3-dedc5a9703c8` completed successfully and aliases were assigned.

## 2026-11-11 — Production release и live smoke политики конфиденциальности

- PR #197 успешно объединён в `main`; merge commit `ac03b992cbdd8a7393e39528cc1ceb0594001d6b`.
- GitHub Actions для PR #197: Lint, website tests, website build, migration syntax, read-only D1 dry-run и Studio build — success.
- Cloudflare Pages Production deployment `a8425737-e658-48b2-87a2-c471447a5789` для commit `ac03b992...` завершился со статусом success; aliases `florial-bg.com` и `www.florial-bg.com` назначены.
- Live smoke `maxAge=0`: `/privacy-policy`, `?lang=ru`, `?lang=en` — HTTP 200; языки BG/RU/EN, локализованные H1/title/description, `index, follow`, self-canonical и hreflang BG/RU/EN/x-default подтверждены в HTML.
- Главная страница HTTP 200; ссылка Footer на `/privacy-policy` подтверждена. `/sitemap.xml` HTTP 200 и содержит три локализованных URL политики.
- Ранее полученный HTTP 404 относился к предыдущему deployment до merge middleware fix; после Production deployment повторный smoke успешен.
- Открыто: юридическая проверка текста в Болгарии; подтверждение регистрационного адреса и transfer safeguards; автоматическое удаление service leads в коде не реализовано и не заявляется.

---


## 2026-11-11 — Единый GitHub-центр документации Florial

- Установлена модель: GitHub repository `omaraandrey-dev/florial`, branch `main` — единственное постоянное хранилище технических знаний. ChatGPT Library и параллельные копии исключены.
- Добавлены `AI_INSTRUCTIONS.md`, `docs/AI/START_HERE.md`, `docs/AI/WORK_PROTOCOL.md`, `docs/AI/MASTER_SPEC.md`, `docs/AI/OPEN_QUESTIONS.md`; README указывает единый порядок входа.
- Исторические Supabase migrations и Supabase-only analytics документы архивированы в `docs/archive/supabase/`. Старые Manager setup/mobile QA/architecture документы помечены как исторические.
- Статическая проверка: package.json не содержит Supabase SDK; поиск `@supabase/supabase-js` не дал результатов; `.env.example` содержит только публичные Sanity параметры. Это не live audit Cloudflare variables.
- Runtime-код, Sanity documents/schema, Cloudflare settings/secrets/deployments, D1 schema/data, Resend и глобальные компоненты сайта не менялись.
- Изменения выполняются в отдельной ветке `docs/github-single-source-of-truth`; merge и Production deployment не выполнялись на момент записи.
