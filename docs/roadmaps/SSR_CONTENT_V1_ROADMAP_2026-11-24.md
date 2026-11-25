# SSR Content v1 — дорожная карта серверной выдачи основных страниц Florial

**Создано:** 24.11.2026  
**Базовый main при создании плана:** `f4e04913a2876bf863deef9fa1b7774b5c416a47`  
**Базовый main для реализации Phase 1:** `07b99481571ca079a06eb5f6e44e9d903f9dc304`  
**Рабочая ветка документации:** `develop`  
**Статус:** этапы 1–8 приняты и выпущены; следующий этап — SSR `/about`.  
**Цель:** обеспечить, чтобы поисковые роботы и другие клиенты, не исполняющие JavaScript, получали в первом HTTP HTML-ответе основное содержимое публичных страниц Florial, а не только SEO head и краткий резервный H1/абзац.

## 1. Принципы и границы

1. Работать последовательно: главная → услуги → блог → портфолио → контакты → о нас. Не начинать следующий этап до проверки и закрытия предыдущего.
2. Использовать существующие Sanity опубликованные документы и те же бизнес-правила/порядок, что и клиентское приложение. Не создавать альтернативный источник контента и не дублировать вручную тексты, цены, URL или список документов.
3. Сначала read-only изучить текущие GROQ projections, локализацию, fallback, сортировку, отбор featured-контента, изображения и текущую структуру компонентов. SSR должен использовать совместимые projections и правила.
4. Существующие опубликованные `service`, `blogPost` и portfolio-документы — защищённый контент. В рамках этой дорожной карты не выполнять Sanity writes и не менять их тексты, переводы, SEO, slug, изображения, ссылки, публикацию или порядок. Любое такое изменение требует отдельного точного плана и отдельного подтверждения владельца.
5. Не менять Header, основное меню, Footer, глобальную оболочку, маршрутизацию, Cloudflare settings/secrets, D1 и Sanity schema. Изменения этих компонентов не входят в SSR Content v1.
6. Сохранить текущий клиентский React UI, интерактивность, визуальный порядок, адаптивность и переходы. SSR добавляет полезный initial HTML, но не заменяет клиентское приложение.
7. Не ухудшать производительность: не загружать полные каталоги без необходимости, ограничивать количество карточек, выбирать только нужные поля, корректно задавать размеры изображений и избегать двойной загрузки hero/LCP изображений после hydration.
8. Для BG/RU/EN проверять локализованные title, description, H1, тексты, ссылки, alt, canonical и hreflang. Основной язык — BG; RU/EN — полноценные версии. Не добавлять Созополь и неподтверждённые бизнес-утверждения.
9. При ошибке Sanity не выдавать ложную пустую страницу или выдуманный контент. Поведение ошибок и HTTP status должно быть явным и согласованным с существующими middleware-паттернами.
10. Все доказательства должны быть привязаны к точному commit SHA и Production/Preview deployment. Гидратированный DOM и браузерный просмотр не считаются доказательством initial HTML.

## 2. Общие критерии готовности каждого этапа

Для каждого маршрута и каждой локали:

- Первый HTTP response получен обычным HTTP fetch без запуска JavaScript.
- HTTP status, content type, cache policy и redirect chain соответствуют ожидаемому маршруту.
- В исходном HTML есть основной H1 и значимый текстовый контент страницы.
- В HTML присутствуют основные индексируемые ссылки на дочерние товары/категории/услуги/статьи/проекты, если они являются частью страницы.
- Ключевые изображения имеют реальный URL, корректный alt (где изображение несёт смысл), width/height или responsive sizing; декоративные изображения не получают искусственный alt.
- Title, meta description, robots, canonical, hreflang и JSON-LD согласованы с содержимым и локалью.
- JSON-LD отражает фактический контент и URL, не содержит выдуманных рейтингов, отзывов, цен, дат, адресов или услуг.
- Ссылки ведут на существующие локализованные маршруты и сохраняют текущие правила навигации.
- Корзина магазина обнаруживается через обычную crawlable-ссылку; сама `/cart` остаётся `noindex` и не должна индексировать персональное содержимое.
- После hydration нет дублированных карточек/текста, скачков layout или повторной загрузки крупных изображений.
- Проверены BG/RU/EN, desktop/mobile на уровне исходного HTML и доступных функциональных тестов.
- Есть регрессионные тесты, защищающие SSR, locale parity, контентный порядок и отсутствие нежелательных изменений.
- Exact-SHA CI, Preview и Production release/smoke подтверждены отдельно. Merge/Production выполняются только в пределах явно одобренного этапа.

## 3. Последовательность этапов

### Этап 1 — главная страница `/` (ПЕРВЫЙ)

**Цель:** сделать серверно доступными основные содержательные секции главной страницы, сохранив текущий дизайн и утверждённый порядок.

Read-only инвентаризация перед кодом:
- Текущие Sanity queries и projections для hero/site settings, категорий растений и поливочного оборудования, featured plants/equipment, services, blog cards и других видимых секций.
- Как формируются curated featured plants (включая `isFeatured`), featured equipment и исключения/приоритеты комплектов.
- Текущий порядок корневых категорий оборудования и растений, service ordering и блоговые pinned slugs.
- Какие секции являются SEO-содержательными, какие чисто декоративными/интерактивными.
- Фактические опубликованные данные и локализации без записи в Sanity.

Объём реализации:
- Серверный HTML для hero: локализованный H1, H2/основное описание и основные ссылки.
- Категории растений и поливочного оборудования, которые реально отображаются на главной, с названиями, ссылками и изображениями.
- Featured plants и featured equipment с существующими условиями публикации, наличия, цены и выбора; не вводить новые правила ранжирования.
- Карточки услуг с существующим порядком, локализованными названиями и краткими описаниями.
- Блок блога/портфолио с теми же закреплёнными публикациями и текущим правилом последней статьи.
- Другие содержательные секции, которые фактически присутствуют на текущей главной странице и нужны для понимания тематики сайта.
- Корректные image alt/title и JSON-LD для главной только там, где это соответствует фактическим сущностям и не дублирует/не противоречит существующей разметке.
- Отдельно проверить обнаруживаемость корзины: `/cart` сохраняет `noindex`; скрытые ссылки не добавлять. Преобразование текущего cart button в обычную ссылку допускается только после отдельного согласования изменения Header.

Ограничения:
- Не менять текст/структуру/порядок секций без отдельного согласования владельца.
- Не менять Header, Footer, меню, общий layout и маршрутизацию.
- Не менять опубликованный Sanity content и схему.
- Не превращать всю страницу в тяжёлый серверный каталог: ограничить выборки и размер HTML.
- Сохранить клиентские компоненты и hydration без визуального/функционального расхождения.

Проверки и критерии закрытия:
- BG/RU/EN raw HTTP first-response smoke без JavaScript.
- В initial HTML присутствуют согласованные hero, секции, тексты, основные карточки и ссылки.
- Featured selection/order совпадает с клиентской версией.
- Нет повторных карточек/дублирующихся изображений после hydration.
- Canonical/hreflang/robots/JSON-LD проверены для каждой локали.
- Проверены HTML size, cache behavior, fallback при ошибке Sanity.
- Tests, type-check, lint, website build, Pages Functions checks, Preview и точный Production smoke успешны.
- Подробный аудит этапа и фактические результаты сохранены в GitHub.

### Этап 2 — общий каталог услуг `/services`

- Серверно вывести список реально опубликованных услуг и их карточки.
- Сохранить текущую сортировку, видимые категории/ролевые изображения, локализацию и переходы.
- Добавить/проверить CollectionPage и BreadcrumbList; не подменять список услуг статичным абзацем.
- Проверить ссылки на все detail routes и отсутствие скрытых/неактивных документов.
- Не менять существующие документы Sanity.

### Этап 3 — отдельные страницы услуг `/services/{slug}`

- Вывести полный индексируемый текст услуги, H1/H2/H3, изображения и содержательные ссылки.
- Сохранить Portable Text форматирование и блоки/секции в фактическом порядке.
- Вывести корректный Service JSON-LD, BreadcrumbList, provider и подтверждённые areaServed.
- Проверить формы/CTA как ссылки или доступные элементы, не создавая реальных лидов в smoke tests.
- Проверить все существующие опубликованные услуги BG/RU/EN; никаких Sanity writes.

### Этап 4 — индекс блога `/blog`

- Серверно вывести опубликованные статьи, локализованные заголовки, краткие описания, даты, cover images и ссылки.
- Сохранить фактический порядок, pagination/ограничения, pinned/featured правила, если они есть на маршруте.
- Добавить/проверить CollectionPage и ItemList с тем же составом и порядком, что и HTML.

### Этап 5 — портфолио

- Сначала read-only определить, является ли портфолио отдельным типом/маршрутом или частью блога/проектных публикаций.
- Сохранить текущую модель контента и публичные URL; не вводить новый маршрут без отдельного согласования.
- Вывести карточки проектов, изображения, описания и ссылки; проверить корректный тип JSON-LD.
- Не менять существующие документы и связи в Sanity.

### Этап 6 — отдельные статьи и проекты

- Серверно вывести полный локализованный Portable Text body, изображения/галереи, подписи, даты, автора/издателя и связанные материалы, если эти поля существуют.
- Проверить BlogPosting либо подходящий тип Schema.org на фактических данных.
- Сохранить текущие URL, ссылки и визуальный порядок после hydration.

### Этап 7 — каталог растений и карточки растений (RELEASED)

**Цель:** обеспечить полноценный initial HTML для корневого каталога растений, всех опубликованных категорий и каждой активной опубликованной карточки растения на BG/RU/EN.

Read-only инвентаризация:
- Опубликованный Sanity dataset `plants`, active product documents, slugs, category tree, локализации и реальные поля изображений/вариантов.
- Сопоставить клиентский порядок каталога, доступность вариантов, пагинацию (20 предложений на страницу), выбор изображений и локализованные подписи.
- Не менять опубликованные товары, цены, описания, фотографии, переводы или схему Sanity.

Объём реализации:
- Отдельный plant product GROQ projection и SSR renderer: H1, botanical name, summary, main image/gallery, sale variants, price/old price, stock, SKU, plant-care fields, Portable Text description/care guide, confirmed irrigation recommendations and related links.
- Product + BreadcrumbList JSON-LD на фактических опубликованных данных; не придумывать цену, availability, ботанические характеристики или географическую пригодность.
- SSR корневого каталога `/category/rastenia` и всех категорий/подкатегорий с реальными названиями, ссылками, изображениями, локализованным SEO content и CollectionPage/ItemList.
- Первые 20 sale offers должны соответствовать клиентскому каталогу: порядок доступности, localized product name, порядок вариантов, цена, размер/высота/контейнер и stock status.
- Сохранить клиентский React UI, фильтры, пагинацию и интерактивность; SSR не должен выводить другой состав/порядок каталога.

Проверки и критерии закрытия:
- Raw HTTP без JavaScript: все активные опубликованные растения × BG/RU/EN и все категории × BG/RU/EN.
- H1, localized content, canonical, hreflang, robots, images, sale variants, price/stock, Product/BreadcrumbList/CollectionPage JSON-LD.
- Missing/unpublished plant product возвращает 404 noindex.
- Проверить root category first page (20 sale offers) и все category links.
- Проверить клиентский handoff/hydration: нет дублирования карточек, повторной загрузки крупных изображений или недопустимого layout shift.
- Exact-SHA type-check, lint, tests, build, Cloudflare Preview и raw HTTP smoke.
- Production release — отдельный шаг после Preview проверки, визуального подтверждения владельца и явного разрешения на merge.

**Статус 25.11.2026 — RELEASED:** PR #545 merged в `main` commit `2b008089e1134dc72bf3b3f592b5102fdd52b6b9`; Cloudflare Pages Production deployment `5fba6345-f886-4eb8-a4b2-154efe326e04` успешен. Preview smoke прошёл 180 plant detail routes + 51 category routes (231/231); exact merge commit прошёл 543/543 tests, type-check, lint, website build и Studio build. Отдельный Production raw HTTP smoke завершён: 231/231 маршрут (180 plant details + 51 categories) в BG/RU/EN; отсутствующий товар возвращает 404 noindex. Подробности: `../audits/2026-11-25-contacts-ssr-discovery.md` и `../audits/2026-11-25-plant-catalog-ssr-v1.md`.

### Этап 8 — контакты `/contacts`: RELEASED

- PR #546 squash-merged в `main` commit `1b18d7ae7db06f8d656d539b28037889f99d8d94`.
- Cloudflare Pages Production deployment `b91055ec-3e33-4a7e-aa3c-8024c02b30fc` собран и опубликован успешно из точного merge commit; Production aliases включают `https://florial-bg.com` и `https://www.florial-bg.com`.
- Exact-PR-head CI для `1319e75169fd4639b102ff6f3b4181891edcdef5`: 10 workflow runs successful; Blog/Studio validation — 548/548 tests, type-check, lint, website build, Studio type-check/build; D1 validation — read-only, без применения миграций.
- Exact Preview raw HTTP smoke прошёл для BG/RU/EN; владелец визуально принял Preview. Production deployment подтверждён, но отдельный Production raw HTTP smoke для `/contacts` ещё не выполнен и не заявляется.
- Часы обеих точек: ежедневно 09:00–17:00 по подтверждению владельца. Существующие адреса, телефоны и ссылки на карты сохранены; Sanity не изменялся.

### Этап 9 — «О нас» `/about`

- Вывести полный существующий текст о компании, направлениях деятельности, опыте и релевантные изображения/ссылки.
- Не придумывать стаж, географию, объём выполненных проектов или сертификаты.
- Проверить локализации и корректность Organization/LocalBusiness связей.

### Этап 10 — общая SEO/SSR регрессия

- Повторно пройти все маршруты этапов 1–8 на BG/RU/EN.
- Проверить raw HTML, robots, canonical, hreflang, JSON-LD, внутренние ссылки, изображения, статусы и redirects.
- Сопоставить HTML до hydration с DOM после hydration.
- Запустить тесты, build, CI и безопасные Production smoke tests.
- Отдельно вести выявленные GSC noindex/canonical anomalies: эта дорожная карта не считает их автоматически исправленными.

## 4. Межчатовый handoff

Каждый этап должен оставлять:
1. Уникальный документ `docs/audits/YYYY-MM-DD-ssr-content-v1-phase-N-*.md` с commit SHA, маршрутом, локалями, исходными HTTP результатами, CI run IDs, Preview/Production deployment IDs, known gaps и точным статусом.
2. Обновлённую эту дорожную карту: статус этапа, фактические решения, незакрытые вопросы и следующий шаг.
3. После интеграции — CHANGELOG, OPEN_QUESTIONS и при необходимости TECHNICAL_PASSPORT.
4. Ссылку на PR/commit и краткий handoff для следующего чата.

Новый чат обязан перечитать актуальные `AI_INSTRUCTIONS.md`, `docs/AI/START_HERE.md`, эту дорожную карту, CHANGELOG, OPEN_QUESTIONS и текущий audit/handoff этапа, затем сверить актуальный `main` SHA. Не продолжать работу по одному лишь тексту предыдущего чата.

## 5. Текущий статус — сверено 2026-11-25

### Основные публичные страницы

- **Этап 1 — главная `/`: RELEASED.** PR #533 merged at `5772a3e567bd77e69854d647fca08a6f3ff732cd`; PR #534 merged at `cc2562194107cf0df2be05b1f13a6b9e10610bb9`. Production release and raw HTTP smoke for homepage were recorded in PR #533. PR #534 adds a controlled client-root handoff; this is not React hydration and does not claim zero CLS.
- **Этап 2 — каталог услуг `/services`: RELEASED.** PR #535 merged as `eb5a8c7ca2a94884f44f367f791800ea35d0749b`. Owner confirmed desktop/mobile behavior. Preview raw HTTP smoke passed BG/RU/EN.
- **Этап 3 — страницы услуг `/services/{slug}`: RELEASED.** PR #539 merged as `28afdf7e895d1b6dbf6d32302e4ffc7dd60b3dab`. Production deployment and smoke passed 25 active service routes × 3 locales (75 responses), plus legacy delivery route.
- **Этап 4 — индекс блога `/blog`: MERGED TO MAIN.** PR #540 merged as `01405cfba21a42f2ca6d92753a8a4e07e08d19de`; Preview smoke passed all 19 published cards in BG/RU/EN. Production-specific raw HTTP smoke is not separately recorded in the available release evidence — do not mark independently verified until checked.
- **Этап 5 — портфолио: CLOSED AS COVERED BY BLOG.** No separate portfolio route/type exists. Project publications are blogPost documents in the combined blog index; inventory recorded in `docs/audits/2026-11-25-portfolio-route-inventory.md`.
- **Этап 6 — статьи и публикации проектов `/blog/{slug}`: MERGED TO MAIN.** PR #541 merged as `f5aa6f899090e859e9b4be1b313ea2056cb58d6c`. Exact Preview raw HTTP smoke passed 19 published articles × 3 locales (57 responses), and CI passed. Separate Production raw HTTP smoke evidence is not recorded here; verify before claiming full Production acceptance.
- **Этап 7 — каталог растений и карточки растений: RELEASED + PRODUCTION SMOKE PASS.** PR #545 merged; Production deployment подтверждён. Exact Preview smoke и отдельный Production raw HTTP smoke прошли по 231/231 маршрутам в BG/RU/EN; отсутствующий товар возвращает 404 noindex. 543/543 tests, type-check, lint, website build и Studio build прошли; владелец визуально принял Preview. Подробности: `../audits/2026-11-25-plant-catalog-ssr-v1.md` и `../audits/2026-11-25-contacts-ssr-discovery.md`.
- **Этап 8 — контакты `/contacts`: RELEASED; Production deployment SUCCESS.** PR #546 squash-merged в `main` commit `1b18d7ae7db06f8d656d539b28037889f99d8d94`; Cloudflare Pages Production deployment `b91055ec-3e33-4a7e-aa3c-8024c02b30fc` успешно завершён с точного SHA, домены `florial-bg.com` и `www.florial-bg.com` привязаны. Exact PR head `1319e75169fd4639b102ff6f3b4181891edcdef5`: 10 CI workflow runs successful; 548/548 tests, type-check, lint, website build, Studio type-check/build и D1 read-only validation прошли. Preview raw HTTP BG/RU/EN smoke и desktop/mobile QA пройдены; владелец подтвердил Preview. Отдельный Production raw HTTP smoke контактов пока не выполнен. Часы: ежедневно 09:00–17:00; телефоны/адреса сохранены. Подробности: `../audits/2026-11-25-contacts-ssr-discovery.md`.
- **Этап 9 — «О нас» `/about`: NOT STARTED.**
- **Этап 10 — общая SEO/SSR регрессия: NOT STARTED.** Must include all previously completed routes and the product/category SSR streams below.

### Каталог поливочного оборудования

- **SSR equipment category catalogue:** PR #531 is part of the main baseline before the current main; its v2 expansion PR #542 merged into `main` at `e8eb2f50e709948f2ccea0b95b0df2bc2cfedeec`. Audit `docs/audits/2026-11-25-equipment-catalog-ssr-v2.md` records Preview raw HTTP smoke for 54 categories × 3 locales (162 routes), 275 linked products and successful validation. The Production-specific smoke for PR #542 must be checked separately before claiming it.
- **SSR equipment product detail: RELEASED.** PR #543 squash-merged into `main` at `7465914b61f859768b073d1f678f9d22161e9ba6`. Cloudflare Pages Production deployment `25504afc-2b42-4a90-9595-501c7fa08fe8` succeeded. Exact-main workflow `45576362238` passed type-check, lint, 535/535 tests, build and raw HTTP smoke for all 275 published equipment products in BG/RU/EN (825/825); missing/unpublished product returned 404 noindex. Owner visually accepted representative pages on desktop/mobile. Details: `docs/audits/2026-11-25-equipment-product-ssr-v1.md`.
- **Inventory:** 275 active published equipment products; all 275 have BG/RU/EN names, short descriptions, localized SEO, positive EUR price and explicit stock status. Detailed inventory is in the product SSR audit. No Sanity writes were made.

### Общие документационные ограничения

PR #409 remains open by owner instruction and is not modified. Its diff overlaps `CHANGELOG.md`, `docs/AI/CURRENT_STATE.md`, `docs/AI/OPEN_QUESTIONS.md`, `docs/TECHNICAL_PASSPORT.md`, and two Google Shopping documents. Do not edit or overwrite these files until the owner separately resolves PR #409. This SSR roadmap and its unique audits are maintained independently; shared changelog/passport/open-question reconciliation remains explicitly pending.

## 6. Следующие шаги

1. **Phase 7 — каталог растений: RELEASED + PRODUCTION SMOKE PASS.** PR #545 merged; Production deployment успешен; отдельный Production raw HTTP smoke прошёл 231/231 маршрутов (180 products + 51 categories, BG/RU/EN), missing product 404/noindex. Owner visual acceptance подтверждена.
2. **Phase 8 — `/contacts`: RELEASED.** PR #546 merged and exact-commit Production deployment succeeded; Preview and CI passed. Production raw HTTP smoke remains a verification follow-up.
3. **Phase 9 — `/about`: NEXT.** Read-only inspect the existing Sanity/source content, identify the exact BG/RU/EN company description and image/link sources, then implement complete first-response HTML without inventing company history, qualifications or services.
4. **Phase 10 — full SSR/SEO regression:** пройти все публичные SSR-маршруты BG/RU/EN, raw HTML, canonical/hreflang/robots, JSON-LD, links, images, redirects и client handoff.
5. Перед каждым этапом сверять текущий `develop`, live Sanity и deployment. Preview не считать доказательством Production.

## 7. Единая модель веток

С 2026-11-25 принята единая модель: `develop` — единственная постоянная ветка развития всего сайта; `main` — Production. Все новые задачи вести последовательно в `develop`, релиз — через PR `develop → main`. PR #543 — завершённое переходное исключение; дальнейшая разработка ведётся только в `develop`. Точная инструкция — `docs/operations/BRANCH_HYGIENE.md`.
