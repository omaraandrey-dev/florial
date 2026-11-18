# Florial — Google Shopping / SEO visibility: stage 1 audit

Дата: 2026-11-18  
Дорожная карта: [GOOGLE_SHOPPING_SEO_ROADMAP_2026-11-18.md](../roadmaps/GOOGLE_SHOPPING_SEO_ROADMAP_2026-11-18.md)  
Базовый GitHub main SHA: `6a99bb802c49cfadc2d32bbd90fb3106c7abb7ff`  
Рабочая ветка: `audit/google-shopping-seo-roadmap-2026-11-18`  
Домен: `https://florial-bg.com`

## 1. Итог

Этап 1 начат. Кодовая инвентаризация и чтение Search Console выполнены. Полное закрытие этапа пока невозможно: свежий первоначальный HTML Production и Google Rich Results validation не получены из-за недоступности браузерного источника в этой сессии.

Подтверждено:
- Product JSON-LD уже реализован на сервере и на клиенте.
- Для растений сервер использует цены `saleVariants`, а не устаревшую корневую `priceEUR`.
- Search Console property `sc-domain:florial-bg.com` подключён к Windsor.ai.
- Последний sitemap report: 1,327 submitted URLs, 0 errors, 0 warnings, last downloaded 2026-11-16.
- Google Merchant Center connector существует в Windsor.ai, но подключённого аккаунта не возвращено.

Не подтверждено:
- Наличие или отсутствие отдельного Google Merchant Center аккаунта Florial.
- Текущее содержимое первоначального Production HTML для представительных страниц.
- Результаты Rich Results Test / Schema Markup Validator.
- Google-selected canonical и URL Inspection для приоритетных страниц.

## 2. Проверенная версия проекта и scope

- Репозиторий: `omaraandrey-dev/florial`.
- Текущий `main` на момент старта: `6a99bb802c49cfadc2d32bbd90fb3106c7abb7ff`.
- Открытые PR: 0.
- Обязательные документы прочитаны: `AI_INSTRUCTIONS.md`, `docs/AI/START_HERE.md`, `docs/AI/WORK_PROTOCOL.md`, `docs/AI/MASTER_SPEC.md`, `docs/TECHNICAL_PASSPORT.md`, `CHANGELOG.md`, `docs/AI/OPEN_QUESTIONS.md`, `docs/AI/CURRENT_STATE.md`.
- Архитектура остаётся GitHub + Sanity + Cloudflare Pages/Functions + Cloudflare D1 + Resend. В рамках аудита ничего в live сервисах не изменялось.

## 3. Product structured data — проверено по коду

### 3.1 Серверный HTML / middleware

Файлы:
- `functions/_middleware.ts`
- `functions/_lib/productJsonLd.mjs`

Серверный `makeProductJsonLd` формирует `Product` с:
- `name`, `description`, `url`;
- `image`, если изображение доступно;
- `sku`, если SKU доступен;
- `brand`, если Sanity содержит brandName;
- `offers`, если helper может сформировать предложение.

Helper `buildProductOffer`:
- для обычного оборудования использует `priceEUR`;
- для растений берёт цены из `saleVariants[].priceEUR`;
- для одного уникального варианта формирует `Offer`;
- для нескольких вариантов формирует `AggregateOffer` с lowPrice/highPrice/offerCount;
- использует EUR и NewCondition.

Это хорошая существующая основа. Историческая ошибка корневой цены кума-квата была исправлена предыдущей работой и подтверждена Production smoke в историческом аудите PR #257. Этот исторический smoke не заменяет свежую проверку текущего Production.

### 3.2 Найденный кодовый пробел: availability parity

В текущем helper `functions/_lib/productJsonLd.mjs`:
- обычные товары получают availability только для `inStock` и `outOfStock`;
- `onRequest` не получает availability;
- предложения растений не получают availability вообще, хотя запрос middleware выбирает `saleVariants[].stockStatus`.

В клиентском `src/pages/ProductPage.tsx`:
- `inStock` → `InStock`;
- `outOfStock` → `OutOfStock`;
- `onRequest` → `PreOrder`.

Следовательно, по исходникам серверная и клиентская Product-разметка потенциально расходятся по availability. Для растений клиент использует статус выбранного варианта, а серверный helper не передаёт статус вариантов. Требуется свежая Production HTML проверка, затем единый контракт и тесты на этапе 2. Не считать `onRequest` равным `PreOrder` до проверки фактических коммерческих условий и политики Google.

### 3.3 Другие поля

- `brand` и `sku` условные — выводятся только при наличии данных.
- В просмотренном Product builder нет `gtin` / `mpn`.
- В просмотренном Offer builder нет `shippingDetails` и `hasMerchantReturnPolicy`.
- Наличие реальных GTIN/MPN в Sanity в этом этапе не перепроверялось.
- Точные правила доставки и возврата для разных типов товаров не подтверждены как единая структурированная политика.

Отсутствие необязательного поля само по себе не является ошибкой. Не добавлять фиктивные значения ради расширения разметки.

### 3.4 Client-side ProductPage

`src/pages/ProductPage.tsx` формирует отдельный клиентский `Product` JSON-LD и `Offer`. Это отдельная реализация от server helper. Client-side offer включает `PreOrder` для `onRequest`, тогда как server helper этого не делает. На этапе 2 предпочтительно унифицировать общую логику, а не поддерживать два расходящихся набора правил.

### 3.5 Тесты

`tests/google-seo-schema.test.mjs` покрывает:
- цену растений по saleVariants;
- Offer и AggregateOffer;
- дублирующиеся цены вариантов;
- отсутствие цены у первого варианта и fallback display price;
- цену и InStock для оборудования;
- наличие ключевых server/client schema hooks.

В тестах пока нет явного покрытия:
- availability для plant variants;
- `onRequest` / PreOrder parity;
- OutOfStock plant variant;
- полной эквивалентности SSR и client Product JSON-LD;
- GTIN/MPN и дополнительных merchant fields.

## 4. Search Console — live read через Windsor.ai

Подключённый account/property:
- Connector: `searchconsole`
- Account: `sc-domain:florial-bg.com`

За preset `last_28d` на дату запроса 18.11.2026:
- 336 URL rows;
- 1,171 impressions;
- 66 clicks.

Это агрегированные page rows connector report. Эти цифры нельзя трактовать как число пользователей, количество индексированных URL или полный набор всех запросов. Отдельный query-level report не использовался для полного анализа поисковых фраз в этом этапе.

### 4.1 Примеры приоритетных растительных страниц

| Страница | Impressions | Clicks | CTR | Avg. position |
|---|---:|---:|---:|---:|
| Yucca rostrata | 24 | 1 | 4.17% | 10.33 |
| Washingtonia | 16 | 2 | 12.50% | 7.56 |
| Brahea armata | 11 | 2 | 18.18% | 10.18 |
| Phoenix canariensis | 10 | 0 | 0% | 12.90 |
| Butia capitata | 10 | 0 | 0% | 14.30 |
| Chamaerops humilis | 9 | 1 | 11.11% | 7.78 |
| Phoenix dactylifera | 6 | 1 | 16.67% | 16.17 |
| Citrus japonica / kumquat | 4 | 0 | 0% | 41.50 |

Категория `/category/palmi-yuki`:
- BG URL: 15 impressions, 0 clicks;
- RU URL: 6 impressions, 0 clicks;
- EN URL: 3 impressions, 0 clicks.

Эти значения показывают, что Google уже показывает часть растительных страниц по отдельным запросам. Это не доказывает полный индексный статус каждой страницы. Небольшие выборки и средняя позиция не являются стабильным рейтингом.

### 4.2 Sitemap report

Последняя доступная запись в connector:
- Sitemap: `https://florial-bg.com/sitemap.xml`;
- submitted: 1,327;
- errors: 0;
- warnings: 0;
- last submitted: 2026-11-14 11:22:37 UTC;
- last downloaded: 2026-11-16 14:11:08 UTC;
- is sitemap index: false.

Предыдущая запись:
- submitted: 1,306;
- last submitted: 2026-10-25;
- errors/warnings: 0.

Это live connector report, но не URL Inspection. Значение submitted не равно числу реально индексированных страниц.

### 4.3 Ограничения доступа

Windsor.ai trial отказал в чтении истории старше последних 30 дней; использован допустимый период last_28d для Search Analytics и last_30d для Sitemap report. В рамках этапа 1 не запрашивались данные за более длительный период.

## 5. Google Merchant Center

- Windsor.ai connector slug `google_merchant` доступен в каталоге.
- В списке подключённых аккаунтов `google_merchant` не вернул аккаунт.
- Это означает только, что Google Merchant Center не подключён к Windsor.ai в доступной интеграции.
- Наличие/отсутствие самостоятельного Merchant Center аккаунта Florial, ownership, domain verification, feed status и diagnostics — **НЕ ИЗВЕСТНО — нужно уточнить**.

Не предпринимались попытки авторизации, создания аккаунта, изменения Merchant Center или Google settings.

## 6. Production HTML и внешняя валидация — pending

Запланированные representative URLs:
- `/product/rain-bird-100-pga-9v` — equipment Offer;
- `/product/citrus-japonica-kumquat` — plant price / variants;
- `/category/palmi-yuki` — CollectionPage / ItemList / canonical / robots;
- `/sitemap.xml` — XML response.

Попытка получить эти URL через Firecrawl не выполнилась: connected Firecrawl account сообщил об исчерпании доступного credit allowance. Повторять запрос с другими параметрами в рамках той же сессии не следует. Публичный web reader также сообщил, что страницы недоступны для чтения. Поэтому свежий HTML, фактические HTTP headers и JSON-LD payload не извлечены в этой проверке.

Google Rich Results Test и Schema Markup Validator не запускались. Предыдущий audit PR #257 содержит исторические Production smoke результаты, но не считается свежим доказательством на 18.11.2026.

## 7. Подтверждённые выводы

1. Product JSON-LD уже реализован и не требует разработки с нуля.
2. Серверный helper для цен растений уже использует saleVariants; это важная корректная реализация.
3. Server/client availability parity — подтверждённый по коду потенциальный дефект, требует live confirmation и затем исправления.
4. Merchant Center не подключён через Windsor.ai; реальный account status неизвестен.
5. Search Console подключён; актуальная выборка за 28 дней показывает 1,171 impressions и 66 clicks по 336 URL rows.
6. Sitemap report показывает 1,327 submitted URLs и ноль errors/warnings; это не доказательство индексации.
7. Google Rich Results / URL Inspection и свежий Production HTML ещё не проверены.

## 8. Следующие действия для закрытия этапа 1

1. Повторить fetch исходного HTML representative URLs после восстановления browser access / Firecrawl credits или использовать иной разрешённый read-only HTTP источник.
2. Извлечь JSON-LD из первоначального HTML без JavaScript и сравнить с клиентским результатом после hydration.
3. Запустить Google Rich Results Test на equipment и plant URL; сохранить статус/предупреждения.
4. В Search Console проверить sitemap status и URL Inspection для BG/RU/EN palms category и выбранных plant/equipment products. Зафиксировать Google-selected canonical и last crawl.
5. Уточнить у владельца, существует ли Merchant Center account Florial, и получить доступ только через безопасный официальный OAuth flow.
6. Обновить эту дорожную карту и закрыть этап 1 только после выполнения критериев приёмки.

## 9. Изменения и безопасность

- В этом этапе не изменялись runtime source, Sanity data/schema, Cloudflare settings/secrets, D1, Resend, DNS, Google Merchant Center или Google Search Console settings.
- Использовались read-only GitHub, Windsor.ai Search Console reads и source inspection.
- Результаты не доказывают, что Google одобрил товарные расширенные результаты или проиндексировал все URL.


## Дополнение 2026-11-18 — Preview deployment и попытка чтения HTML

- Cloudflare PR comment подтверждает успешный Preview deployment для commit `3c529439fcd1ffeb90c186831f0aa824e3a42128`: deployment ID `a2375a36-2745-4a0d-adb3-06900da114bc`, Preview URL `https://a2375a36.florial.pages.dev`.
- Это подтверждение публикации Preview, но не проверка HTML, Product JSON-LD, SSR/client parity или Production.
- Web reader не смог открыть Preview URL для оборудования, кума-квата и категории пальм/юкк. Прямой сетевой fetch из доступной среды не разрешил домен. Firecrawl live balance: 0 credits, поэтому повторный scrape не выполнялся.
- Подэтапы 1.5–1.6 остаются открытыми. Для их закрытия требуется доступный read-only HTML источник или ручной просмотр исходного HTML/результатов Rich Results Test владельцем с передачей результатов.
- Никакие runtime-код и live-сервисы не менялись.


## 10. Повторная оценка Product Schema — 18.11.2026

### 10.1 Решение владельца о последовательности

Владелец указал сначала повторно проверить и при необходимости исправить Product Schema, а Google Rich Results Test выполнять после исправлений. Получение отдельной копии исходного HTML не является обязательным предварительным условием для анализа кода генератора. При этом анализ исходников не подменяет проверку того, что Google получает от реально опубликованного URL.

### 10.2 Проверка требований Google

Проверены актуальные документы Google Search Central:

- Product snippet: https://developers.google.com/search/docs/appearance/structured-data/product-snippet
- Merchant listing: https://developers.google.com/search/docs/appearance/structured-data/merchant-listing
- Product variants: https://developers.google.com/search/docs/appearance/structured-data/product-variants

Важные требования:
- Google прямо указывает не использовать `AggregateOffer` для описания набора вариантов одного товара.
- Для merchant listing требуется `Offer`; `AggregateOffer` не является подходящей моделью для merchant listings.
- Для полноценного описания вариантов Google предусматривает `ProductGroup`, связанные `Product` и отдельные `Offer`.
- Для variant markup требуются уникальные идентификаторы вариантов и crawlable URL, позволяющие выбрать каждый вариант.
- Availability — рекомендуемое поле Offer; значения должны соответствовать фактическому статусу. Нельзя автоматически считать `onRequest` предзаказом.

### 10.3 Read-only проверка опубликованного Sanity plants dataset

Источник: Sanity project `bxvcy0qs`, dataset `plants`, perspective `published`; deployed schema type `plantSaleVariant`.

- GROQ count: 50 опубликованных документов `product` содержат `saleVariants`.
- GROQ count: 0 документов имеют хотя бы один вариант с непустым `saleVariants[].sku`.
- Поле `sku` предусмотрено в schema `plantSaleVariant`, но не является обязательным.
- Просмотренная выборка подтверждает наличие variant name, saleHeightCm, containerVolumeL, priceEUR и stockStatus; значения SKU вариантов в выборке пустые.
- В текущем приложении `initialSaleVariantKey` — внутреннее состояние SPA. Отдельный crawlable URL для каждого варианта в текущем маршруте не подтверждён.

Следствие: ProductGroup для всех plant variants сейчас нельзя реализовать без добавления реальных уникальных идентификаторов и URL. Не использовать Sanity `_key` как выдуманный SKU/GTIN и не генерировать MPN.

### 10.4 Изменения Product JSON-LD в рабочей ветке

Изменения ограничены GitHub source; Production и live Sanity не менялись.

- Добавлен общий helper `src/lib/productJsonLd.mjs`.
- `functions/_lib/productJsonLd.mjs` экспортирует функции из общего helper; middleware продолжает использовать тот же интерфейс.
- `src/pages/ProductPage.tsx` импортирует тот же `buildProductOffer`, чтобы сервер и клиент не реализовывали Offer независимо.
- Equipment: один Offer по опубликованной корневой цене; availability добавляется только для `inStock` и `outOfStock`.
- Plants: один Offer только для первого/default варианта, который показывается при начальной загрузке. Если у этого варианта нет корректной положительной цены, Offer не формируется; цена следующего варианта не подставляется.
- Plants: availability отражает статус первого/default варианта только для `inStock` / `outOfStock`; для `onRequest` поле опускается.
- `PreOrder` для `onRequest` удалён. До отдельного подтверждения коммерческой политики эти состояния не считаются эквивалентными.
- `AggregateOffer` больше не используется для saleVariants.

### 10.5 Тесты и текущая проверка CI

В `tests/google-seo-schema.test.mjs` обновлены и добавлены проверки:
- Offer первого/default plant variant;
- отсутствие fallback на цену другого варианта, если у первого нет цены;
- запрет AggregateOffer для набора plant variants;
- корректные InStock / OutOfStock / onRequest;
- общий builder используется и в ProductPage, и через middleware helper.

Текущий проверяемый кодовый head до последующего документационного коммита: `871315e178e7a0654d820cee66c243e00c75f4c3`.
На момент записи:
- GitHub Actions Blog and Studio validation: run `44355221560`, `in_progress`;
- GitHub Actions D1 migration validation: run `44355221606`, `pending`;
- Cloudflare Pages PR Preview для commit `871315e`: Build in progress.
Эти статусы не являются доказательством успешной сборки. После обновления roadmap и audit необходимо повторно получить актуальные head SHA и результаты CI/Preview.

### 10.6 Что остаётся открытым

- Дождаться и проверить CI и Cloudflare Preview для точного актуального head.
- Выполнить Google Rich Results Test / Schema Markup Validator после доступного deployment; сохранить фактические результаты.
- Проверить Search Console sitemap и доступные URL Inspection сведения.
- Этапы 1 и 2 не закрыты.
- ProductGroup остаётся будущей отдельной задачей после подготовки реальных уникальных SKU/GTIN и crawlable URL для каждого варианта.

Production, Sanity schema/documents, Cloudflare settings/secrets, D1, Resend, Merchant Center и Search Console settings не изменялись. PR #407 открыт, не merged.
