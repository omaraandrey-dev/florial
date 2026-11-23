## Актуальный статус — 23.11.2026 (синхронизация дорожных карт)

**Текущий статус семи шагов определяется единым [реестром дорожных карт](ROADMAP_STATUS_INDEX_2026-11-23.md).** Ниже сохранены первоначальные findings и историческая последовательность. Более ранние статусы в этом файле не являются актуальными после синхронизации.

- Step 1 — в работе: live Production sample показывает index/follow и self-canonical, но Google live URL Test и post-recrawl ещё не подтверждены; GSC saved state содержит исторические noindex/canonical anomalies. См. [live indexability audit](../audits/2026-11-23-production-indexability-live-check.md).
- Step 2 — владелец подтвердил в предыдущем чате успешную Rich Results проверку без замечаний; отдельный артефакт результата пока не сохранён здесь.
- Step 3 — GA4 ecommerce integration PR #488 merged и Production deployment подтверждён; фактическое поступление событий остаётся на наблюдении владельца.
- Step 4 — частично выполнен: 23.11 опубликованы и read-back проверены локализованные metaTitle двух Irritec Connecto elbows и Rotor Sprinklers category, а также ALT BG/RU/EN изображения Nipel-mufa category. Подробности: [partial remediation](../audits/2026-11-23-sanity-seo-partial-remediation.md). Остальные descriptions ждут отдельного prompt владельца; Buddha's hand citron исключён до разрешения indexability anomaly.
- Steps 5–7 — выполнять по зависимостям, как указано в общем реестре.

---

# Florial — SEO remediation roadmap (23.11.2026)

Статус: read-only audit завершён; ограниченная remediation metaTitle/ALT выполнена и опубликована 23.11.2026. Полные descriptions отложены до отдельного prompt владельца. Основной отчёт: [Комплексный SEO-аудит 23.11.2026](../audits/2026-11-23-comprehensive-seo-audit.md).

## Принципы

- Сначала подтверждаем причину, затем предлагаем исправление.
- Не менять опубликованные услуги, blogPost и portfolio без отдельного явного approval владельца.
- Не менять опубликованные Sanity product/category SEO-поля без точного списка document IDs, полей и последствий, а также отдельного подтверждения. Перед write — backup.
- Не создавать doorway pages, не добавлять Sozopol, не выдумывать GTIN/MPN/reviews/ratings/shipping/availability.
- Не использовать Browser connector без предварительного разрешения владельца.
- Все результаты фиксировать в GitHub main; PR #409 остаётся открытым, его не закрывать и не изменять в рамках этого аудита.

## Phase 0 — P1: разрешить noindex/canonical расхождение

<badge>BLOCKING</badge>

Повторная выборка 17 URL (23.11.2026): 11 исключены по noindex, три BG product URL имеют Google-selected canonical на другие товары. Три страницы, выбранные Google как canonical, при отдельной проверке сами тоже noindex. Текущие опубликованные Sanity данные и middleware не объясняют результат.

- [ ] Получить разрешение владельца на Browser-проверку.
- [ ] Сравнить raw HTTP status и response headers для Washingtonia, Brahea, Rakat na Buda, Rain Bird 200-PGA, а также контрольных URL Yucca, Kumquat и Rain Bird 100-PGA.
- [ ] Проверить meta robots, X-Robots-Tag, canonical, hreflang, Product JSON-LD и начальный H1.
- [ ] Проверить, что фактический Production deployment соответствует текущему main и что cache не отдаёт устаревший HTML.
- [ ] Сверить все 17 сохранённых URL Inspection результатов и повторить выборочную проверку после подтверждённого исправления; сейчас 11/17 noindex, 3 canonical mismatch.
- [ ] Сопоставить live HTML с текущими опубликованными Sanity noIndex и кодом middleware.
- [ ] Если проблема подтверждена — подготовить точный технический план и показать владельцу до изменения кода/данных.
- [ ] После одобренного исправления проверить exact-SHA CI/Preview/Production и запросить повторный crawl через GSC.

**Критерий закрытия:** нет необъяснимого noindex; self-canonical корректен; Google canonical совпадает с выбранным URL после повторного crawl; sitemap и robots согласованы.

## Phase 1 — P2: GA4 measurement decision

- [ ] Подтвердить, что `florial-29eac` — целевое GA4 property.
- [ ] Согласовать Web Data Stream, measurement ID, currency EUR, timezone Europe/Sofia (сейчас property стоит на fixed Etc/GMT-3) и consent model.
- [ ] Согласовать события: `view_item`, `add_to_cart`, `begin_checkout`, `purchase`, `generate_lead`.
- [ ] Сопоставить GA4 с существующими D1/PostHog событиями, не создавая двойной учёт.
- [ ] Реализовать только после approval; затем проверить реальные события и key events.

**Критерий закрытия:** GA4 receives events from Production after consent rules, currency EUR, event mapping and key events verified.

## Phase 2 — P2: Product rich results validation

- [ ] После Phase 0 выполнить Google Rich Results Test на Production equipment и plant pages.
- [ ] Проверить Product, Offer, BreadcrumbList, Organization и GardenStore nodes.
- [ ] Повторно проверить availability для реального stockStatus; `onRequest` не считать PreOrder.
- [ ] ShippingDetails/return policy добавлять только по подтверждённым коммерческим условиям.
- [ ] Не добавлять AggregateRating/Review без фактических отзывов; не придумывать GTIN/MPN/variant SKU.
- [ ] Зафиксировать Google test result, crawl date и URL.

**Критерий закрытия:** актуальные Production результаты сохранены; обязательные ошибки отсутствуют; warnings либо устранены законно, либо документированы как не применимые/неподтверждённые.

## Phase 3 — P2: targeted content improvements

После проверки индексации:

- [ ] Пересмотреть 13 plant product meta descriptions >160 символов и 2 plant category descriptions >160. 160 символов — редакционный ориентир, не жёсткий лимит Google.
- [ ] Выборочно дополнить полные RU и EN descriptions у одних и тех же 12 irrigation kit products; у них уже есть короткие RU/EN descriptions. Точные Sanity IDs и slugs перечислены в аудите.
- [ ] Проверить полные RU/EN descriptions услуги `dostavka-poliv` (Sanity ID `9e4efe1b-e434-4cfe-a646-1cc9d9c93bce`); короткие описания есть.
- [ ] Заполнить explicit ALT BG/RU/EN для 2 equipment products и 2 equipment categories после проверки frontend fallback; exact IDs приведены в аудите.
- [ ] Развести дублирующиеся BG/RU/EN metaTitle у двух Irritec Connecto elbows (female thread SKU IQ21820F0N25B / male thread SKU IQ21920M0N25B), сохранив утверждённый формат и точные отличия товара.
- [ ] Проверить заголовки/сниппеты homepage и category Rotor Sprinklers на основе большего набора запросов, не переписывать метаданные по единичным impressions.
- [ ] Каждое Sanity изменение — отдельный список IDs/fields + backup + owner approval.

**Критерий закрытия:** только согласованные документы изменены; Published read-back подтверждён; нет дубликатов/потери переводов.

## Phase 4 — P2: search opportunity pages

Приоритет после разрешения индексации:

1. Yucca rostrata — индексируется; 33 impressions, 1 click, average position 12,5.
2. Rotor sprinklers category — индексируется; 36 impressions, 0 clicks; mobile average position 36,7. Проверить интент и содержимое категории.
3. Сильные service pages по автоматическому поливу — homepage/service visibility уже есть.
4. Buddha's hand citron — только после разрешения noindex/canonical anomaly (28 impressions, position 9,6 в page report).
5. Brahea armata — только после разрешения noindex/canonical anomaly (11 impressions, position 10,2).
6. Washingtonia — только после разрешения noindex/canonical anomaly (16 impressions, position 8,8).

Не проводить контентные изменения на страницах с noindex/canonical anomalies до Phase 0.

Для каждой страницы проверить query intent, CTR, title/snippet, content depth, product availability, internal links и conversion path. Не считать одну позицию GSC гарантией стабильного рейтинга.

## Phase 5 — P3: local SEO and authority

GSC geo-filtered Bulgarian queries дали только 3 impressions / 0 clicks за период; данных пока недостаточно для выводов о локальном спросе.

- [ ] Проверить фактические Google Business Profile для Несебра и Равды.
- [ ] Сверить NAP, реальные часы, категории, URL, фотографии, service areas и соответствие GardenStore JSON-LD.
- [ ] Проверить локальные citations и backlinks через доступный авторитетный индекс.
- [ ] Оценить локальные запросы после накопления достаточных impressions.
- [ ] Не создавать thin doorway pages и не обещать позиции по конкретным городам.

## Phase 6 — P3: Core Web Vitals and performance

- [ ] Измерить Lighthouse/PageSpeed для homepage, category, product и service templates.
- [ ] Получить CrUX field data, если достаточный объём данных существует.
- [ ] Сравнить mobile и desktop; проверить LCP, INP, CLS и image loading.
- [ ] Составить отдельный план исправлений с привязкой к шаблонам и метрикам.

## Контрольные KPI

- Indexability: доля indexable canonical URLs; noindex anomalies = 0.
- Sitemap: submitted URLs без errors/warnings; исключения соответствуют намерению.
- GSC: clicks, impressions, CTR, position по BG/RU/EN, стране, устройству, типу страницы.
- GA4 (после подключения): sessions, key events, ecommerce funnel и leads.
- Content: 100% обязательных SEO полей и локализаций; описания соответствуют правилам Florial.
- Rich results: актуальный Google validation evidence.
- Performance: CrUX/Lighthouse mobile and desktop, без неподтверждённых обещаний.

## Change log

- 23.11.2026 — создана дорожная карта по результатам первого аудита SEO Audit Skill. Никаких runtime/Sanity/Cloudflare/Google changes не выполнялось.
- 23.11.2026 — уточнены результаты повторной проверки 17 URL, canonical-target URLs, Sanity full-description/ALT gaps и приоритеты. PR #409 остаётся открытым.
