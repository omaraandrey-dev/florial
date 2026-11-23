# Комплексный SEO-аудит Florial — 23.11.2026

## 1. Резюме

Проведён read-only аудит по методике Agent Skill `seo-audit` Corey Haines с адаптацией к правилам Florial. Проверены исходники GitHub `main`, опубликованные документы Sanity в двух datasets, Search Console, GA4 property, конфигурация Cloudflare Pages и часть Cloudflare Zone rules.

**Главный вывод:** базовая SEO-архитектура Florial выглядит системной: серверная генерация начального HTML, локализованные метаданные, H1, canonical/hreflang, sitemap, Product/Service/BlogPosting/CollectionPage JSON-LD и локальные GardenStore сущности реализованы. В опубликованных Sanity каталогах хорошее покрытие SEO-полей.

При этом обнаружено одно приоритетное расхождение, которое требует live-проверки: Google Search Console сообщает `noindex` и в трёх случаях выбирает canonical на совершенно другие карточки товаров, хотя текущие опубликованные данные Sanity и текущая логика middleware не объясняют такой результат. До проверки фактического Production HTML нельзя объявлять проблему исправленной или считать эти URL гарантированно индексируемыми.

Вторая существенная проблема — подключённое GA4 property не имеет Web Data Stream и key events, а в HTML/клиентском коде не обнаружен Google tag. Собственная аналитика Florial через D1 и PostHog существует, но GA4-сбор не подтверждён.

**Изменения не выполнялись:** код, Sanity, Cloudflare settings/secrets, D1, Resend, Google settings и Production data не менялись. Browser connector не использовался.

## 2. Версия и источники доказательств

- Repository: `omaraandrey-dev/florial`, branch `main`.
- GitHub main на момент проверки: `1489ab1911f5168bbca45d06e9576906eefceb94`.
- SEO Audit Skill: `.agents/skills/seo-audit/SKILL.md`, upstream Corey Haines, imported 23.11.2026.
- Cloudflare Pages project: `florial`, production branch `main`.
- Последний Production deployment на момент проверки: `c108d5f0-9075-400d-92d5-d48a3be494e8`, status `success`, source commit `1489ab1911f5168bbca45d06e9576906eefceb94`. Это deployment установки skill/документации; runtime-код сайта не менялся.
- Active domains: `florial-bg.com`, `www.florial-bg.com`; оба имеют статус active.
- Sanity project: `bxvcy0qs`, datasets `production` и `plants`, perspective `published`.
- Google Search Console resource: `sc-domain:florial-bg.com`.
- GA4 property: `properties/557273710` (`florial-29eac`).

### Ограничения

- Search Analytics period: 25.10.2026–19.11.2026; сравнение с равным предыдущим периодом 29.09.2026–24.10.2026.
- GSC URL Inspection отражает сохранённое состояние последнего Google crawl, а не гарантированно текущий ответ сервера.
- Полный внешний crawl всех 1 372 URL не выполнялся.
- Browser permission владельца не получено; raw Production HTML/response headers в этой сессии не проверялись. Web reader не предоставил надёжный доступ к страницам.
- Lighthouse, PageSpeed Insights, CrUX/Core Web Vitals и backlink index не были доступны в проверенных источниках.
- Google Rich Results Test после последних Production изменений не запускался. GSC rich-result сведения относятся к сохранённым более ранним crawl.
- Локальные профили Google Business Profile и внешние citations не проверялись.

## 3. Техническое SEO

### 3.1. Что подтверждено по исходникам

- Cloudflare `functions/_middleware.ts` генерирует initial HTML для продуктовых, категорийных, сервисных и blog-страниц: title, meta description, H1, canonical, hreflang и JSON-LD добавляются до клиентской гидратации.
- Продуктовые страницы используют явный локализованный `seo.h1`; категории используют явный H1 и server-side collection rendering.
- Hreflang формируется для BG/RU/EN при наличии соответствующей локализации; добавляется `x-default`.
- Canonical для языковых вариантов учитывает `?lang=ru` и `?lang=en`; язык не должен сводиться к canonical другой локали.
- Sitemap строится из опубликованных активных товаров, категорий, услуг и статей, с учётом `noIndex` и наличия локализаций.
- `public/robots.txt` разрешает crawl и указывает основной sitemap.
- Manager получает server-side `X-Robots-Tag: noindex, nofollow, noarchive`; irrigation assistant, cart/search, withdrawal и legal routes имеют отдельные noindex-правила по назначению.
- `public/_headers` не задаёт глобальный noindex.
- В Cloudflare Zone нет Page Rules; активное redirect rule — 301 с `www` на apex с сохранением query string. Response-header transform entrypoint ruleset не найден.
- В Cloudflare Pages production domains активны.

### 3.2. Sitemap и индексация

Google Search Console сообщает:
- 1 372 submitted URLs;
- 0 sitemap errors;
- 0 warnings;
- последний download: 22.11.2026.

Это положительный технический сигнал. Однако наличие URL в sitemap не гарантирует индексацию.

### 3.3. P1 — противоречие URL Inspection и текущего кода/Sanity

В целевой выборке из 17 уникальных URL Google URL Inspection вернул 11 результатов `Excluded by ‘noindex’ tag`. В трёх BG-страницах Google выбрал canonical на другой товар:

| Проверенный URL | Google-selected canonical | Сохранённый результат |
|---|---|---|
| `/product/washingtonia` | `/product/krasula` | noindex, canonical mismatch; crawl 21.11 |
| `/product/brahea-armata` | `/product/irritec-ivvee2700n160` | noindex, canonical mismatch; crawl 16.11 |
| `/product/rakat-na-buda` | `/product/komplekt-avtomatizatsiya-6-zoni` | noindex, canonical mismatch; crawl 18.11 |
| `/product/rain-bird-200-pga-24v` | self | BG noindex; EN variant reports indexed |

Три Google-selected canonical URL (`krasula`, `irritec-ivvee2700n160`, `komplekt-avtomatizatsiya-6-zoni`) при отдельной проверке также вернули noindex с self-canonical. Для Washingtonia/Brahea/Rakat языковые URL RU/EN также имеют сохранённый noindex status. При этом EN URL Rain Bird 200-PGA в той же выборке возвращает `Submitted and indexed`.

**Проверка источника противоречия:**
- В текущем опубликованном Sanity у Washingtonia, Brahea, Rakat и Rain Bird 200-PGA `isActive=true`, `seo.noIndex=null`.
- Read-only aggregate query: среди 275 активных equipment products и 60 активных plant products нет документов с `seo.noIndex == true`.
- Текущий middleware устанавливает noindex для product только при `seo.noIndex === true`; client ProductPage также использует явное сравнение `=== true`.
- Текущий `public/_headers` не задаёт noindex; Page Rules пусты, response-header transform ruleset не найден.

**Статус:** причина НЕ УСТАНОВЛЕНА. Сохранённый GSC crawl может отражать прежний ответ, но для Washingtonia дата последнего crawl 21.11 позднее опубликованного обновления Sanity 20.11. Поэтому нельзя списывать всё на старые данные. Требуется проверить фактический HTTP status, `X-Robots-Tag`, meta robots, canonical и HTML в Production с разрешения владельца. Не менять Sanity и код до этого сравнения.

## 4. Google Search Console — органическая видимость

### 4.1. Ресурсные показатели

За 25.10–19.11.2026 (агрегация byProperty):
- Clicks: 64;
- Impressions: 904;
- CTR: 7,08%;
- Average position: 15,3.

Предыдущий равный период:
- 8 clicks;
- 36 impressions;
- CTR 22,22%;
- average position 18,7.

Показы выросли на 868, переходы на 56; средняя позиция улучшилась на 3,4. CTR снизился на фоне расширения охвата и появления новых запросов. Предыдущая выборка очень мала, поэтому это ранний сигнал, а не устойчивый прогноз роста.

При агрегации byPage GSC возвращает 66 clicks, 1 250 impressions, CTR 5,28%, average position 17,5. Это другая схема агрегации; значения не складывать с byProperty.

### 4.2. Страна и устройства

- Bulgaria: 59 clicks / 657 impressions / CTR 8,98% / position 14,3.
- Mobile: 54 clicks / 523 impressions / CTR 10,33% / position 9,6.
- Desktop: 10 clicks / 370 impressions / CTR 2,70% / position 22,9.
- Tablet: 0 clicks / 11 impressions / position 30,4.

Разница Mobile/Desktop заметная, но не доказывает техническую ошибку. На отдельных URL картина отличается: у `/category/rotorni-razprskvachi` mobile position 36,7 (29 impressions), desktop position 14,8 (4 impressions). Нужен разбор запросов и страниц по устройствам, а не автоматический редизайн.

### 4.3. Страницы и возможности роста

Положительные примеры:
- Homepage: 161 impressions, 16 clicks, position 3,0.
- `/services/avtomatichno-napoyavane`: 19 impressions, 4 clicks, position 3,7.
- `/product/washingtonia`: 16 impressions, position 8,8.
- `/product/brahea-armata`: 11 impressions, position 10,2.
- `/product/rakat-na-buda`: 28 impressions; GSC opportunity view показывает среднюю позицию около 11–12.
- `/product/yucca-rostrata`: 33 impressions; query/page opportunities показывают потенциал около первой-второй страницы.
- `/category/rotorni-razprskvachi`: 39 impressions в выборке, но слабая мобильная позиция.

**Важно:** Washingtonia, Brahea и Rakat на Буда одновременно имеют noindex/canonical anomalies в сохранённом URL Inspection. Их контентную оптимизацию отложить до разрешения проблемы индексации.

Локальные запросы за этот период в BG дали всего 3 impressions в отфильтрованной выборке: `свети влас` и `градински център бургас`. Данных недостаточно для выводов о локальном спросе или создания новых геостраниц.

## 5. Sanity — SEO-поля и контент

Проверены только опубликованные документы; записи не выполнялись.

### 5.1. Полнота SEO-полей

- Equipment products: 275 активных документов; BG/RU/EN metaTitle, metaDescription и H1 — 275/275.
- Plant products: 60; BG/RU/EN metaTitle, metaDescription и H1 — 60/60.
- Equipment categories: 54; BG/RU/EN metaTitle, metaDescription и H1 — 54/54.
- Plant categories: 17; BG/RU/EN metaTitle, metaDescription и H1 — 17/17.
- Services: 25 активных; SEO title/description присутствуют в BG/RU/EN.
- Published blog posts: 16; локализованные SEO title/description и body присутствуют в BG/RU/EN.

Отдельный H1 для товара/категории сохранён как явное поле, а не вычисляется из названия. Это соответствует действующему требованию Florial.

### 5.2. Длина и уникальность метаданных

- Equipment product titles: 29–67 символов; найдена одна дублирующаяся пара BG/RU/EN Title: коляно Irritec Connecto 25 × ½″ с внутренней резьбой и коляно с наружной резьбой (SKU IQ21820F0N25B и IQ21920M0N25B). H1 и descriptions различаются, но metaTitle одинаковы.
- Plant product titles: 34–66; duplicate titles не обнаружены.
- Equipment category titles: 33–69; duplicate titles не обнаружены.
- Plant category titles: 44–69; duplicate titles не обнаружены.
- Meta descriptions equipment products: 74–158 символов.
- Plant products: 13 из 60 описаний длиннее 160 символов (максимум 192).
- Plant categories: 2 из 17 длиннее 160 символов (максимум 175).

Рекомендация: точечно сократить 15 длинных BG descriptions, сохранив утверждённое начало «Продажба…», естественное описание и географию. Отдельно различить metaTitle двух Irritec Connecto колен по внутренней/наружной резьбе. Не применять универсальный шаблон и не переписывать все карточки.

### 5.3. Полнота описаний и изображений

- Equipment products: полные RU descriptions есть у 263/275 и EN descriptions у 263/275 (по 12 пробелов в каждой локали; пересечение двух наборов не проверялось); shortDescription присутствует.
- Plant products: полные описания BG/RU/EN присутствуют у 60/60.
- Services: полные описания подтверждены у 24/25 в каждой локали.
- Blog: основной текст присутствует во всех трёх языках у 16/16.
- Main image ALT BG/RU/EN: equipment 273/275, plants 60/60.
- Category image ALT BG/RU/EN: equipment 52/54, plants 17/17.
- У двух equipment products и двух equipment categories явные ALT-поля отсутствуют во всех локалях; frontend fallback следует проверить отдельно. Это контентная полнота, не доказанная ошибка HTML accessibility.
- Поиск в опубликованных SEO Title/Description BG/RU/EN не нашёл упоминаний Sozopol в проверенных типах product/category/service/blogPost.

### 5.4. Структура главной

По исходнику HomePage: один H1 «Градински център Флориал», далее H2 с профессиональным ландшафтным дизайном, продажей растений и поливной техники. Основные CTA ведут к растениям и поливному оборудованию. Это соответствует принятому приоритету магазина растений/градинского центра.

## 6. Structured data и Google rich results

### Подтверждено по коду
- Server middleware выдаёт Organization, GardenStore, Product, Offer, BreadcrumbList, Service, BlogPosting и CollectionPage в соответствующих маршрутах.
- Homepage содержит две GardenStore сущности: Несебър и Равда. Адреса/телефоны заданы; у узла Несебър указаны часы Пн–Пт 09:00–17:00, у узла Равда openingHoursSpecification отсутствует. Фактическую актуальность NAP и часов работы необходимо сверить с владельцем и GBP.
- Product Offer использует EUR, цену и URL; SKU/Brand добавляются только при наличии данных.
- `availability` передаётся для `inStock` и `outOfStock`; для `onRequest` намеренно не выдумывается `PreOrder`.
- Organization JSON-LD содержит ссылку на существующие условия возврата. Универсальные shipping conditions не добавлялись без подтверждённых тарифов/сроков.

### GSC URL Inspection
У ранее просканированных страниц Yucca, Kumquat и Rain Bird 100-PGA URL Inspection показывал Product snippets / Merchant listings / Breadcrumbs с verdict PASS. Сохранённые crawl dates: 26.10, 09.11 и 05.11 — до текущего Product Offer релиза/проверки. Это не post-deployment acceptance.

Сохранённые warnings включали:
- `review` и `aggregateRating` — не добавлять без реальных отзывов/рейтингов;
- `availability` — проверять после нового crawl; старые crawl предшествуют текущей Offer логике;
- global identifier (GTIN/MPN), shippingDetails и hasMerchantReturnPolicy на Offer — не выдумывать и не подменять неподтверждёнными условиями.

Google Rich Results Test после текущего Production deployment не выполнен. Merchant Center, по ранее подтверждённому владельцем статусу, ещё не зарегистрирован. ProductGroup остаётся отложенным до реальных SKU вариантов и отдельных crawlable URL.

## 7. GA4 и аналитика

GA4 property `florial-29eac`:
- property ID `557273710`;
- timezone `Etc/GMT-3` (fixed UTC+3, not DST-aware `Europe/Sofia`);
- currency `USD`;
- data streams: 0;
- key events: 0;
- GA4 reports за 25.10–22.11 не возвращают событий/сессий.

В `index.html` отсутствует Google Analytics tag; в текущем client tracking implementation используются PostHog и first-party endpoint `/api/track` → D1 `site_events`. Cloudflare Pages `web_analytics_tag` и `web_analytics_token` не настроены.

Вывод: GA4 property создано, но подключение сайта к GA4 не подтверждено. D1/PostHog — отдельные механизмы и не означают, что GA4 работает. Если GA4 требуется как источник отчётности, нужно отдельно согласовать Web Data Stream, EUR, consent handling и список key events (view_item, add_to_cart, begin_checkout, purchase, generate_lead). Ничего не подключалось.

## 8. Local SEO, авторитет и performance

- LocalBusiness/GardenStore schema присутствует для Несебра и Равды.
- Организация размечена с areaServed Bulgaria; это не доказывает реальную локальную видимость по всем населённым пунктам.
- GSC локальные запросы в текущем периоде слишком малочисленны для статистических выводов.
- GBP profiles, citations, NAP consistency, reviews и backlinks в этой сессии не проверялись.
- Core Web Vitals, Lighthouse, PageSpeed/CrUX не измерялись. Нельзя утверждать, что мобильная или desktop performance прошла аудит.
- Не рекомендованы doorway pages с простой заменой названия города. Новые геостраницы возможны только с реальным уникальным содержанием и после отдельного согласования.

## 9. Приоритеты

1. **P1 — Разобраться с noindex/canonical расхождением** на затронутых товарах. Нужна проверка фактического Production HTML/headers в Browser с разрешения владельца. Это первый блокирующий этап.
2. **P1 — Определить целевую GA4 архитектуру**: подключать ли GA4 property, создать Web Data Stream, установить EUR и key events с учётом consent.
3. **P2 — После подтверждения индексации** улучшить страницы с поисковым потенциалом: Yucca, Buddha's hand, Brahea, Washingtonia и категорию роторных дождевателей. Не начинать с noindex страниц до проверки.
4. **P2 — Точечная редактура** 15 длинных meta descriptions, по 12 отсутствующих полных описаний RU и EN для equipment (пересечение document IDs не проверено) и 4 набора отсутствующих ALT-полей; перед Sanity write показать точные document IDs/поля и получить отдельное подтверждение.
5. **P2 — Повторить Product Rich Results Test** после live проверки актуального Production HTML; не добавлять фиктивные отзывы, GTIN, availability или shipping.
6. **P3 — Local authority audit**: сверить реальные GBP profiles, NAP, категории, фото, citations и локальные запросы.
7. **P3 — Performance audit**: измерить Lighthouse/CrUX на мобильных и desktop для homepage, category, product и service шаблонов.

## 10. Что не сделано и почему

- Не выполнен полный crawl 1 372 URL: Browser permission не запрошено/не получено.
- Не проверен сырой HTML/HTTP headers затронутых noindex URL.
- Не выполнен Lighthouse/CrUX/backlink/GBP audit.
- Не запускался Google Rich Results Test после последнего Production deployment.
- Не выполнялись Sanity writes, code changes, Cloudflare configuration changes, D1 writes или Google settings changes.
- PR #409 оставлен открытым и не изменялся.

## 11. Артефакты и продолжение

- Навык: [SEO_AUDIT_SKILL.md](../AI/SEO_AUDIT_SKILL.md).
- План исправлений: [SEO_AUDIT_REMEDIATION_ROADMAP_2026-11-23.md](../roadmaps/SEO_AUDIT_REMEDIATION_ROADMAP_2026-11-23.md).
- Предыдущая Product/Shopping дорожная карта: [GOOGLE_SHOPPING_SEO_ROADMAP_2026-11-18.md](../roadmaps/GOOGLE_SHOPPING_SEO_ROADMAP_2026-11-18.md).
- Source snapshot: main `1489ab1911f5168bbca45d06e9576906eefceb94`; audit date 23.11.2026.

**Следующее действие:** получить разрешение владельца на Browser-проверку raw Production HTML/headers для затронутых URL. До этого не менять noindex, canonical или опубликованные документы.
