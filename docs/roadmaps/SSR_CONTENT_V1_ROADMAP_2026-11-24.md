# SSR Content v1 — дорожная карта серверной выдачи основных страниц Florial

**Создано:** 24.11.2026  
**Базовый main при создании плана:** `f4e04913a2876bf863deef9fa1b7774b5c416a47`  
**Базовый main для реализации Phase 1:** `07b99481571ca079a06eb5f6e44e9d903f9dc304`  
**Рабочая ветка документации:** `docs/ssr-content-v1-roadmap`  
**Статус:** план утверждён владельцем; этап 1 — главная страница — первый в очереди.  
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

### Этап 7 — контакты `/contacts`

- Вывести фактические опубликованные контактные сведения, адреса двух действующих садовых центров, телефоны, часы работы, ссылки на карты и способы связи.
- Перед включением данных в SSR read-only сверить страницу, Sanity/код и подтверждённые владельцем сведения; расхождения вынести на согласование.
- Согласовать GardenStore/LocalBusiness JSON-LD с реальными данными и видимым содержимым. Не исправлять NAP/часы без подтверждения владельца.

### Этап 8 — «О нас» `/about`

- Вывести полный существующий текст о компании, направлениях деятельности, опыте и релевантные изображения/ссылки.
- Не придумывать стаж, географию, объём выполненных проектов или сертификаты.
- Проверить локализации и корректность Organization/LocalBusiness связей.

### Этап 9 — общая SEO/SSR регрессия

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

## 5. Текущий статус

- Этап 1 (главная): **IMPLEMENTATION VERIFIED — draft PR #533** ([PR](https://github.com/omaraandrey-dev/florial/pull/533), branch `feat/ssr-homepage-content-v1`). Code-bearing head `0276d4d99256a92c500487f94a501da57b36ca21`. The dedicated renderer covers hero/category image CTAs, the four value propositions, services, plant categories, featured plants, irrigation categories, featured equipment and blog teaser.
- Selection parity: the SSR renderer mirrors `App.tsx` populated-category visibility and ancestor retention, excludes `plants-*` IDs and legacy `electromagnetic-valves`, then applies the existing root-category order/six-card limit. It reuses shared featured-equipment and service-order helpers, plant price/stock rules and pinned/latest blog ordering.
- Image parity: initial HTML uses the same Sanity URL transformation and responsive candidate list as `getSanityImageProps` (src/srcset/sizes/width/height/loading priority). Product-card aspect ratios and responsive sizes are aligned to current React cards. Plant unknown-stock fallback and localized display-name fallback are covered by tests.
- Homepage commercial identity: `OnlineStore` and `WebSite` JSON-LD are emitted on the homepage; existing Nessebar/Ravda `GardenStore` entities remain. Product/category links remain crawlable. The cart itself remains `noindex, nofollow`; a visible Header anchor is a separate owner-approval decision.
- **Verification passed on code head `0276d4d99256a92c500487f94a501da57b36ca21`:** Preview deployment `5206776a-6a44-459e-9f5c-89a33f83dbff` succeeded. Raw first-response smoke run `45514703501` passed BG/RU/EN without JavaScript. Blog and Studio validation run `45514716263` passed app/Pages type-check, lint, 493/493 tests, website build, migration syntax and read-only dry-run, Studio type-check/build. D1 validation run `45514716029` passed. The raw smoke checked localized H1/value proposition, index/follow robots, crawlable category/service/blog links and OnlineStore/WebSite JSON-LD. No Production release is claimed.
- **Architecture caveat:** `src/main.tsx` currently uses `createRoot`, so React replaces the initial server markup inside `#root`; this is first-response SSR, not React hydration. The client transition/CLS must be evaluated separately. Do not change the app bootstrap/global shell without owner approval.
- **Cart discovery finding:** `Header.tsx` currently renders the cart control as a `<button>`, not an anchor with `href`; `/cart` is already correctly `noindex`. No Header change is included; a visible semantic anchor conversion awaits separate owner approval. No hidden link.
- Этапы 2–9: **NOT STARTED**.
- Sanity writes: **не выполнялись и не входят в общий scope**.
- Production/Cloudflare settings, secrets, D1: **не изменялись**.
