# Florial — дорожная карта Google Shopping и расширенной SEO-видимости

Дата создания: 2026-11-18  
Исходная ветка: `main`  
Базовый commit: `6a99bb802c49cfadc2d32bbd90fb3106c7abb7ff`  
Рабочая ветка: `audit/google-shopping-seo-roadmap-2026-11-18`  
Основной домен: https://florial-bg.com

## Обязательное правило использования дорожной карты

Эта дорожная карта является единым планом выполнения задачи «Google Shopping и расширенная SEO-видимость Florial».

**При каждом последующем обращении к этой задаче ИИ и разработчик обязаны сначала открыть актуальную версию этого файла из GitHub `main` (либо текущей согласованной рабочей ветки до merge), сверить текущий этап и продолжить работу по нему.** Не начинать независимый параллельный план и не пропускать этапы без решения владельца.

После каждого завершённого существенного подэтапа:
1. Обновить статус, дату, доказательства и оставшиеся ограничения непосредственно в этой дорожной карте.
2. Сослаться на неё из audit/release-записи и, при необходимости, CHANGELOG / Technical Passport / OPEN_QUESTIONS.
3. В PR и commit явно указать, какой этап дорожной карты выполнен.
4. Не отмечать этап завершённым без соответствующего доказательства (код/тест/CI/live service/Google report).
5. После merge перечитать дорожную карту из актуального `main` и продолжить со следующего незавершённого пункта.

Ни один последующий чат не должен считать эту работу новой задачей или заново планировать её с нуля.

## Цель

Повысить обнаруживаемость каталога Florial в Google Search и Google Shopping за счёт достоверной Product-разметки, синхронизированного товарного фида, корректного Merchant Center и контроля фактической индексации. Основные каталоги: растения (dataset `plants`) и оборудование/полив (dataset `production`). Основная локаль — BG, дополнительные — RU/EN, валюта — EUR.

## Принципы и границы

- Не переписывать уже работающий SEO-фундамент без подтверждённой причины.
- Источник товаров, цен, вариантов, наличия и изображений — опубликованные документы Sanity; передача и серверная проверка остаются на стороне Florial.
- Значения фида должны совпадать с фактическим предложением на странице и в корзине.
- Не выдумывать GTIN, MPN, бренд, наличие, доставку, возвраты, отзывы или рейтинги.
- Не включать товары «по запросу» или без цены в Shopping, пока не подтверждено соответствие требованиям Google и корректная модель предложения.
- Не менять опубликованные Sanity документы, схему, Cloudflare settings/secrets, DNS, D1 или Production без отдельного согласования и требуемого backup.
- Не менять Header, меню, Footer и глобальную архитектуру.
- Владелец должен подтвердить реальные правила доставки/возврата и коммерческие условия до добавления соответствующих structured data.
- Не заявлять, что URL индексирован, только по факту HTTP 200, sitemap или наличия JSON-LD.

## Этапы и критерии приёмки

### Этап 1. Инвентаризация и исходный аудит — В РАБОТЕ

**Цель:** установить, что уже реализовано, какие structured-data возможности поддерживаются текущей моделью каталога и какие подтверждённые пробелы мешают Merchant Listings / Shopping.

Подэтапы:
- [x] 1.1 Проверить актуальный `main`, открытые PR и обязательную документацию.
- [x] 1.2 Проверить генерацию Product JSON-LD в серверном middleware, клиентском ProductPage, общем helper и тестах.
- [x] 1.3 Проверить подключение Google Search Console и получить актуальные агрегированные показатели.
- [x] 1.4 Проверить доступность Google Merchant Center connector через Windsor.ai и уточнить статус аккаунта у владельца.
- [x] 1.5 Проверить по исходникам, как формируется initial HTML/SSR Product JSON-LD и как клиентская разметка синхронизируется с ним. Получение отдельной копии сырого HTML не является обязательным предварительным условием для анализа и исправления генератора; runtime HTML остаётся отдельным live QA доказательством.
- [ ] 1.6 После исправления Product Schema и доступного Preview/Production deployment выполнить Google Rich Results Test / Schema Markup Validator для репрезентативных страниц.
- [ ] 1.7 Сверить актуальный sitemap report и выполнить доступные URL Inspection проверки в Google Search Console.
- [ ] 1.8 Завершить audit report, зафиксировать результаты валидаторов, ограничения и подтверждённые решения.

**Критерий завершения:** есть кодовый аудит, единый контракт Product Schema, тесты и CI, проверка Google Rich Results после публикации доступной версии, актуальные Search Console показатели, статус Merchant Center (аккаунт не создан — подтверждено владельцем), список подтверждённых дефектов и ограничений. Сырой HTML не считается обязательным входным артефактом для кодового аудита, но фактический runtime/Google fetch не объявляется проверенным без соответствующего live результата.

**Первичный результат 18.11.2026:** см. [аудит этапа 1](../audits/2026-11-18-google-shopping-seo-stage-1-audit.md). Кодовый аудит и чтение Search Console завершены. Свежий Production HTML и Rich Results validation пока не подтверждены: Firecrawl подключение не выполнило запрос из-за исчерпанного лимита, а публичный web reader не смог открыть страницы Florial. Google Merchant Center connector в Windsor.ai доступен, но connected account не обнаружен; существование отдельного аккаунта Google Merchant Center этим не опровергается и не подтверждается.

### Этап 2. Исправление и унификация Product Schema — В РАБОТЕ (приоритет изменён по указанию владельца 18.11.2026)

Владелец поручил сначала повторно оценить и при необходимости исправить Product Schema, а Rich Results Test запускать после исправлений. Это осознанное изменение последовательности относительно первоначального плана.

Подтверждённые решения и реализация в рабочей ветке:
- Общая логика Offer вынесена в `src/lib/productJsonLd.mjs`; Cloudflare middleware и клиентский ProductPage используют один и тот же builder.
- Для обычного оборудования сохраняется один `Offer` по корневой цене.
- Для растения описывается только первый вариант — тот, который показывается как начальный вариант в initial HTML. Если у него нет корректной положительной цены, Offer не создаётся; цена другого варианта не подставляется вместо него.
- Для `inStock` / `outOfStock` передаётся соответствующая availability. Для `onRequest` availability не указывается; автоматически превращать его в `PreOrder` нельзя.
- `AggregateOffer` не используется для набора вариантов одного товара: Google прямо не рекомендует такую модель для product variants. Merchant listings требуют `Offer`; корректная расширенная модель вариантов — `ProductGroup` с отдельными вариантами.
- `ProductGroup` пока не реализуется: read-only проверка опубликованного Sanity dataset `plants` показала 50 документов растений с `saleVariants` и 0 документов с непустым SKU хотя бы у одного варианта. В просмотренных данных SKU варианта пустой; кроме того, текущий маршрут не предоставляет отдельный crawlable URL для каждого варианта. Уникальные SKU/GTIN и отдельные URL нельзя выдумывать.
- Добавлены тесты для цены начального варианта, отсутствия ложного fallback на другой вариант, availability и запрета `PreOrder` для `onRequest`.
- CI и Cloudflare Preview для текущего PR head запущены; результат ожидается и не считается успешным до фактического завершения.

Следующие задачи:
- Завершить GitHub CI и Cloudflare Preview для точного head SHA.
- Проверить diff и при необходимости скорректировать реализацию по результатам CI.
- После доступной публикации выполнить Google Rich Results Test / Schema Markup Validator для оборудования и растений.
- Проверить предупреждения/ошибки Google и отдельно зафиксировать будущую готовность ProductGroup.

Критерий завершения: серверная и клиентская разметка используют общий Offer builder; цены и наличие соответствуют начальному предложению страницы; тесты и CI проходят; Google валидатор проверяет доступную опубликованную версию; отсутствующие GTIN/SKU/условия доставки и возврата не выдумываются.

### Этап 3. Merchant Center — готовность аккаунта и бизнес-правил

Задачи:
- Уточнить, существует ли Google Merchant Center аккаунт Florial, кто владелец/администратор и подтверждён ли домен.
- Получить доступ через безопасный OAuth/connector flow; не запрашивать пароль или токены в чате.
- Проверить целевую страну Болгария, язык BG, валюту EUR, налоговую модель и способы доставки.
- Зафиксировать политики доставки, возврата, контактные сведения и условия продажи растений.
- Определить правила допуска товара в Google Shopping: фиксированная цена, варианты, stock, onRequest, сезонные товары, ограничения по доставке живых растений.
- Подготовить карту атрибутов Sanity → Merchant Center для обоих datasets и локалей.

Критерий завершения: подтверждённый аккаунт/доступ, верифицированный домен, документированные коммерческие правила и утверждённая карта полей. Не менять Merchant Center настройки без согласованного плана.

### Этап 4. Разработка автоматического товарного фида

Предпочтительный вариант — динамический feed endpoint на Cloudflare Pages Functions, который читает опубликованные данные Sanity и формирует фид без ручных Excel-выгрузок.

Задачи:
- Выбрать поддерживаемый Google формат и способ обновления после изучения требований Merchant Center.
- Разделить товары на допустимые и исключённые с прозрачными причинами.
- Поддержать оборудование и растения, варианты размеров/цен, BG как основной язык.
- Передавать корректные id, title, description, link, image_link, additional_image_link, price, availability, brand, gtin/mpn при наличии, google_product_category и condition.
- Согласовать ID и группировку вариантов (`item_group_id`) с реальной моделью Sanity и товарной страницы.
- Исключить товары без цены, неактивные товары, noIndex/непубличные документы и неподдерживаемые предложения по согласованным правилам.
- Защитить endpoint от некорректных запросов и обеспечить кеширование/логирование без утечки данных.
- Добавить тесты фида на репрезентативных товарах и крайних случаях.

Критерий завершения: фид возвращает валидный формат, содержит только допустимые предложения, данные совпадают с Sanity и storefront, ошибки/исключения диагностируются.

### Этап 5. Подключение и проверка Merchant Center

- Добавить фид в Merchant Center и настроить расписание/обновление.
- Проверить первичную обработку и диагностику товаров.
- Исправить ошибки/предупреждения, не обходя правила Google.
- Проверить цены, валюту, язык, изображения, availability, landing page и shipping settings.
- Убедиться, что изменения в Sanity отражаются в фиде и Merchant Center в ожидаемые сроки.

Критерий завершения: Merchant Center успешно обработал согласованный набор товаров; известны approved / limited / disapproved counts и причины; нет критических несоответствий цены/наличия.

### Этап 6. Индексация и Google Search Console

- Проверить Sitemap report, submitted/read counts, ошибки и предупреждения.
- Провести URL Inspection для выборки BG/RU/EN: главная категория растений, пальмы/юкки, приоритетные виды, товары полива и локализованные URL.
- Записать user-declared и Google-selected canonical, indexing state, last crawl и причины исключения.
- Проверить www → apex исторические URL и query-based локали; не менять canonical/redirect без подтверждённого дефекта.
- Отправлять запрос на индексацию только при необходимости и в пределах разумного объёма.
- Сравнивать динамику после повторного обхода.

Критерий завершения: есть актуальный URL Inspection sample, понятные причины исключения и список исправлений/ожиданий. Индексацию всего сайта не обещать.

### Этап 7. Усиление коммерческих и локальных сигналов

- Проверить Google Business Profile для фактических локаций и соответствие Name/Address/Phone/Hours сайту.
- Проверить локальные Organization / GardenStore данные, адреса и телефоны; изменения — только по подтверждённым фактам владельца.
- Проверить внутренние ссылки категорий → товары → услуги и актуальность хлебных крошек.
- Выделить приоритетные категории и растения по фактическим показам Search Console.
- Не добавлять гео-спам и не использовать Созополь в новых SEO-текстах без решения владельца.

Критерий завершения: документированный read-only аудит локальных сущностей, приоритетные категории/страницы и согласованный план контентных улучшений.

### Этап 8. Мониторинг и цикл улучшения

- Вести ежемесячный baseline Search Console: clicks, impressions, CTR, position, queries, page groups, countries/devices.
- Отслеживать Merchant Center diagnostics и число активных/ограниченных/отклонённых товаров.
- Отдельно использовать PostHog для поведения на сайте; не смешивать события PostHog с поисковыми метриками Search Console.
- После значимых изменений фиксировать commit/deployment и сравнимый период данных.
- Пересматривать roadmap только на основании результатов и новых решений владельца.

Критерий завершения: повторяемая ежемесячная отчётность и backlog улучшений, привязанный к данным.

## Журнал выполнения

### 2026-11-18 — Создание дорожной карты и начало этапа 1
- Подтверждён актуальный GitHub `main`: `6a99bb802c49cfadc2d32bbd90fb3106c7abb7ff`; открытых PR — 0.
- Создана рабочая ветка `audit/google-shopping-seo-roadmap-2026-11-18` от этого SHA.
- Проверен код Product JSON-LD: серверный helper `functions/_lib/productJsonLd.mjs`, middleware `functions/_middleware.ts`, клиентский `src/pages/ProductPage.tsx`, тесты `tests/google-seo-schema.test.mjs`.
- Подключён Search Console property `sc-domain:florial-bg.com` через Windsor.ai. За последние 28 дней connector вернул 336 URL rows, 1,171 impressions и 66 clicks. Это агрегированный connector report, не URL Inspection и не полный экспорт всех запросов.
- Sitemap report: последняя доступная запись — 1,327 submitted URLs, 0 errors, 0 warnings; last submitted 2026-11-14, last downloaded 2026-11-16. Предыдущая запись — 1,306 URLs (2026-10-25).
- В выборке страниц приоритетные растительные URL включают Brahea armata (11 impressions / 2 clicks), Washingtonia (16 / 2), Yucca rostrata (24 / 1), Chamaerops humilis (9 / 1), Phoenix dactylifera (6 / 1), а категория palms & yuccas BG/RU/EN суммарно имеет 24 impressions и 0 clicks в агрегированных page rows.
- Владелец подтвердил 18.11.2026: отдельный аккаунт Google Merchant Center для Florial ещё не зарегистрирован. Статус аккаунта уточнён; этап 3 должен включать создание аккаунта с нуля после завершения первичного технического аудита и подготовки корректного товарного фида. Не считать отсутствие connector connection доказательством аккаунта — теперь это подтверждено владельцем.
- Выявлено по коду: серверный `buildProductOffer` не передаёт `availability` для растений и для irrigation onRequest; клиентский ProductPage передаёт `PreOrder` для onRequest. Это потенциальное SSR/client structured-data расхождение, которое нужно подтвердить свежим Production HTML на этапе 1 и исправить на этапе 2 при необходимости.
- В текущем Firecrawl подключении запросы не выполнились из-за исчерпанного лимита; web reader также не смог открыть публичные товарные URL. Production HTML и Google Rich Results Test поэтому остаются неподтверждёнными.
- Никакой runtime-код, Sanity, Cloudflare, Merchant Center или Google настройки не изменялись.

- Документационная дорожная карта и audit включены в PR #407: https://github.com/omaraandrey-dev/florial/pull/407. PR открыт, mergeability после повторного чтения GitHub — true; combined status пока не содержит CI checks. Не считать PR объединённым.


### 2026-11-18 — Продолжение этапа 1: проверка Preview
- GitHub PR #407 подтверждает успешный Cloudflare Pages Preview для commit `3c529439fcd1ffeb90c186831f0aa824e3a42128`: deployment `a2375a36-2745-4a0d-adb3-06900da114bc`, URL `https://a2375a36.florial.pages.dev` (комментарий Cloudflare в PR). Это подтверждает успешную сборку/публикацию Preview, но не содержимое HTML и не Production.
- Попытка открыть три представительные Preview URL (оборудование, растение, категория) через публичный web reader завершилась ошибкой недоступности URL. Прямой сетевой fetch из доступной среды также не смог разрешить домен. Firecrawl account на момент проверки сообщает `remainingCredits: 0`; повторный scrape не запускался.
- Поэтому подэтапы 1.5 и 1.6 остаются незавершёнными: фактический initial HTML/JSON-LD и Google Rich Results validation не получены. Preview deployment не подменяет эти доказательства.
- Никакие runtime-файлы, Sanity, Cloudflare settings/secrets, Google accounts/settings или Production не изменялись.


### 2026-11-18 — Повторная оценка Product Schema и решение владельца о последовательности

- Владелец поручил не блокировать исправление схемы ожиданием отдельного HTML-файла: сначала проверить и исправить генератор Product JSON-LD, затем запускать Google Rich Results Test.
- Кодовая проверка подтвердила server/client mismatch: server helper не указывал availability для plant variants и irrigation onRequest; client ProductPage указывал PreOrder для onRequest. Также server использовал AggregateOffer для нескольких plant saleVariants, тогда как client формировал Offer только для выбранного варианта.
- Сверка с актуальными Google Search Central: AggregateOffer не следует использовать для описания набора product variants; для полноценной разметки вариантов предусмотрен ProductGroup. Для merchant listing Google требует Offer. См. официальные документы: Product snippet, Merchant listing и Product variant structured data.
- Read-only Sanity Production (`bxvcy0qs`, dataset `plants`, perspective `published`): 50 документов содержат saleVariants; ни у одного документа не найден непустой SKU хотя бы у одного варианта. Поэтому ProductGroup пока нельзя реализовать без выдумывания идентификаторов. Текущая навигация не предоставляет отдельные crawlable URL для каждого варианта.
- В рабочей ветке добавлен единый helper `src/lib/productJsonLd.mjs`, общий для middleware и ProductPage. Растения используют один Offer для первого/default варианта; невалидная/отсутствующая цена первого варианта не заменяется ценой другого размера. onRequest не преобразуется в PreOrder. Оборудование продолжает использовать root price и достоверный stockStatus.
- Добавлены тесты на эти правила и общий builder. На текущем head `871315e178e7a0654d820cee66c243e00c75f4c3` GitHub CI запущен (Blog and Studio validation in_progress; D1 migration validation pending), Cloudflare Pages Preview сообщил Build in progress. Результаты пока не подтверждены.
- Production, Sanity documents/schema, Cloudflare settings/secrets, Merchant Center и Search Console settings не менялись. PR #407 остаётся открытым; merge и Production deployment не выполнялись.


### 2026-11-18 — Product Schema remediation: CI and Preview verification

- Functional implementation and corrected tests are present in commit `92da3ecdb8d06b51de72ae87a5ed495030bc439d`. The subsequent current branch head `8fd67042f41746b09f66f014734790131ff54e76` adds only an explanatory source comment documenting that the client Offer remains tied to the default variant.
- GitHub Actions for commit `92da3ec`:
  - Blog and Studio validation run `44355682859`: success. TypeScript typecheck, lint, all website utility tests, website build, migration syntax, read-only migration dry-run, Studio install, Studio typecheck and Studio build all succeeded.
  - D1 migration validation run `44355682858`: success.
- Cloudflare Pages PR Preview for `92da3ec` deployed successfully: `https://9ba37c43.florial.pages.dev`. This Preview contains the Product Offer implementation; it is not Production. Current branch head `8fd6704` differs only by the source comment noted above; its separate CI run was still in progress at the last read.
- Google Rich Results Test was not completed in this assistant session: the interactive Google testing application and the Preview URLs were not accessible through the available web reader. This is a tool-access limitation, not evidence of a site failure. Prefilled Google test URLs are provided to the owner for a browser run:
  - Equipment: `https://search.google.com/test/rich-results?url=https%3A%2F%2F9ba37c43.florial.pages.dev%2Fproduct%2Frain-bird-100-pga-9v`
  - Plant: `https://search.google.com/test/rich-results?url=https%3A%2F%2F9ba37c43.florial.pages.dev%2Fproduct%2Fcitrus-japonica-kumquat`
- Windsor.ai Search Console connector fields expose Search Analytics, Sitemaps and Search Appearance; no URL Inspection fields are available through this connector. URL Inspection therefore remains pending via Search Console UI/API access.
- Stage 2 code/tests/build are complete for the reviewed implementation, but stage 2 remains open until Google validation is recorded. Stage 1 remains open pending Rich Results and available URL Inspection evidence. No Production, Sanity, Cloudflare settings/secrets, D1, Resend or Google settings were changed.


### 2026-11-18 — Latest PR state after documentation consolidation

- Current PR #407 head: `7bd1cc16d97dccdbdf1797c074a12ba18bc06ad5` (documentation-only commits after the verified source/test change `8fd67042f41746b09f66f014734790131ff54e76`).
- The latest successful Cloudflare Pages Preview is for commit `df414aa`: `https://811f1545.florial.pages.dev`. It includes the Product Offer implementation and the updated roadmap; later commits only update audit/handoff documentation and do not change runtime code.
- Full Blog and Studio validation run `44355759803` passed for source commit `8fd6704`; D1 migration validation run `44355682858` passed. New CI runs for the later documentation-only head were still in progress at the last read.
- Use the latest Preview for owner-run Google Rich Results tests:
  - Equipment: `https://search.google.com/test/rich-results?url=https%3A%2F%2F811f1545.florial.pages.dev%2Fproduct%2Frain-bird-100-pga-9v`
  - Plant: `https://search.google.com/test/rich-results?url=https%3A%2F%2F811f1545.florial.pages.dev%2Fproduct%2Fcitrus-japonica-kumquat`
- Google Rich Results Test and URL Inspection remain pending; no external test result is claimed. PR #407 remains open/unmerged; no Production deployment.


### 2026-11-18 — Schema Markup Validator run and Google Rich Results access result

- Used Cloudflare Browser Rendering (read-only) to open the official Schema.org Validator for the deployed Preview URLs. The validator itself fetched and parsed the rendered page HTML; this is a live remote-page parse, not a hand-built HTML sample.
- Equipment Preview `https://811f1545.florial.pages.dev/product/rain-bird-100-pga-9v`: Schema.org Validator reported 5 detected items, 0 errors, 0 warnings: Organization (1), BreadcrumbList (2), Product (2).
- Plant Preview `https://811f1545.florial.pages.dev/product/citrus-japonica-kumquat`: Schema.org Validator reported 5 detected items, 0 errors, 0 warnings: Organization (1), BreadcrumbList (2), Product (2).
- Investigation of the equipment Preview's fetched HTML showed the two Product objects have different URLs: the server-generated object uses canonical Production URL `https://florial-bg.com/product/rain-bird-100-pga-9v`, while the client-rendered object uses Preview URL `https://811f1545.florial.pages.dev/product/rain-bird-100-pga-9v`. BreadcrumbList is duplicated for the same reason (server canonical and client Preview paths). This is a Preview-host/canonical mismatch and must not be mistaken for the expected Production graph.
- Baseline check on current Production equipment URL `https://florial-bg.com/product/rain-bird-100-pga-9v`: Schema.org Validator reported 3 detected items, 0 errors, 0 warnings: Organization (1), BreadcrumbList (1), Product (1). This Production baseline is the currently deployed version, not the corrected PR Preview.
- Tried official Google Rich Results Test on the corrected Preview URL using a remote browser. Google rendered the tool but showed an alert dialog: “Something went wrong — Log in and try again”, with reCAPTCHA present. No Google Rich Results result was produced. This is an authentication/access limitation; do not claim Google test passed or failed.
- Follow-up required: obtain an authenticated Google Rich Results Test session or run the supplied links in the owner's browser. After PR merge and Production deployment (only with explicit owner approval), rerun Google Rich Results Test against the actual Production URLs, avoiding Preview canonical mismatch. Stage 1 and stage 2 remain open until Google-specific validation and remaining Search Console checks are recorded.


## 11. Post-merge Production release — 18.11.2026

## 2026-11-18 — PR #407 merged and Product Offer remediation deployed to Production

- PR #407 (Product Offer JSON-LD remediation, Google Shopping roadmap and stage-1 audit) merged into `main`; merge commit / exact `main` HEAD at verification: `458dd9d8e8edb78973a4660f3796f43d4d1c22d2`.
- Pre-merge comparison confirmed PR head `f30af1e940d8bccb627a55265c6fa6468651b520` was 42 commits ahead and 0 behind current `main`; the merge used expected head SHA protection.
- GitHub Actions on exact PR head `f30af1e`: Blog and Studio validation run `44358163151` — success; D1 migration validation run `44358126198` — success. A subsequent Blog and Studio run `44358126185` also succeeded. No workflow runs were returned for the merge commit itself; do not describe those PR-head checks as merge-commit CI.
- Cloudflare Pages Production deployment `3deb2a5d-cd16-4201-821e-7b6d6c7bba09` succeeded at `2026-11-18T18:08:28Z`; source branch `main`, exact source commit `458dd9d8e8edb78973a4660f3796f43d4d1c22d2`. Production aliases are `https://florial-bg.com` and `https://www.florial-bg.com`.
- The shared Product Offer implementation is now in Production. Schema.org Validator evidence in the PR applies to the Preview pages; the previous Production validator result is a pre-release baseline. Google Rich Results Test on Production has not yet been run and is not claimed as passed.
- Owner-run Google Rich Results Test links for Production:
  - Equipment: https://search.google.com/test/rich-results?url=https%3A%2F%2Fflorial-bg.com%2Fproduct%2Frain-bird-100-pga-9v
  - Plant: https://search.google.com/test/rich-results?url=https%3A%2F%2Fflorial-bg.com%2Fproduct%2Fcitrus-japonica-kumquat
- Stages 1 and 2 of the roadmap remain open pending authenticated Google Rich Results evidence and the remaining Search Console URL Inspection checks. Merchant Center account was confirmed by the owner as not yet registered; Merchant Center setup remains a later roadmap stage.
- No Sanity schema/documents, Cloudflare settings/secrets, D1 data/schema, Resend or Google settings were changed. The only Production change was the automatic Pages deployment from the explicitly approved PR merge.



## 2026-11-19 — Product brand parity follow-up (PR #410)

- Code review found that Cloudflare middleware included `brand` from Sanity `brand->name` as `doc.brandName`, while client-side ProductPage omitted the field. Equipment detail GROQ already returned `brand`; plant detail GROQ did not.
- PR #410 adds the same optional Schema.org `Brand` object to client Product JSON-LD and adds `brand->name` to the plant product-detail query. The value is omitted when no brand is present; no brand is invented.
- Regression test covers the client mapping, plant GROQ selection and server middleware mapping.
- Corrected code commit: `6b4c78f8c5438c3cd7493d335958de79bfbf995c`. Blog/Studio CI run `44432432693` succeeded: TypeScript, lint, website tests, website build, migration syntax/dry-run, Studio typecheck and Studio build all passed. D1 validation run `44432432898` succeeded.
- PR #410 merged into `main` at `9b697379c43db5e19a15bd91b48fb8d507da8479`. Cloudflare Pages Production deployment `ed8a8b40-bff1-4e35-948f-6b33970bcfff` succeeded from this exact SHA; aliases `https://florial-bg.com` and `https://www.florial-bg.com` are active. Blog/Studio CI on PR head `8ce3257` and D1 validation on merge commit `9b69737` passed; Blog/Studio CI on merge commit succeeded: run `44432801621`. Google Rich Results Test and URL Inspection remain pending. No Sanity, Cloudflare configuration/secrets, D1, Resend or Google settings changed.
