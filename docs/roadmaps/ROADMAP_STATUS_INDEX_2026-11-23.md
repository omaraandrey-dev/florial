# Florial — единый реестр дорожных карт и текущих приоритетов

**Срез:** 23.11.2026  
**main на начало редакторского цикла:** `7e657dea3093acd83a41ec9a53290bddd6b22a64`
**Базовый GitHub main:** `57b99420eee021bb7081a21b890227ddd5f31a3b`  
**Назначение:** единая точка сверки статусов между самостоятельными дорожными картами. Этот индекс не заменяет подробные планы; он устраняет противоречия в статусах и определяет ближайший рабочий поток. После каждого существенного этапа обновлять соответствующую дорожную карту и этот реестр.

## 1. Главный активный поток — SEO Florial (7 последовательных этапов)

Подробный план: [SEO remediation roadmap](SEO_AUDIT_REMEDIATION_ROADMAP_2026-11-23.md).

| № | Направление | Актуальный статус на 23.11.2026 |
|---|---|---|
| 1 | Индексация, noindex, canonical, Production HTML | **В РАБОТЕ.** В выборке Production initial HTML и hydrated DOM показывают `index, follow`, self-canonical, без `X-Robots-Tag`; robots/sitemap доступны, sitemap 1,372 URL, GSC сообщает 0 errors/warnings. Но сохранённые GSC URL Inspection всё ещё содержат исторические noindex для 11 URL и 3 canonical mismatch. Google live URL Test и post-recrawl пока не подтверждены. Причину менять в коде/Sanity без нового доказательства нельзя. |
| 2 | Google Rich Results / Schema.org | **ЗАВЕРШЁН ПО ПОДТВЕРЖДЕНИЮ ВЛАДЕЛЬЦА в предыдущем чате;** отдельный отчёт/скриншот результата ещё не сохранён в GitHub. Не смешивать это с незавершёнными специальными Google Shopping проверками ниже. |
| 3 | GA4 ecommerce | **ИНТЕГРАЦИЯ ЗАВЕРШЕНА, ПРИЁМ СОБЫТИЙ НАБЛЮДАЕТСЯ.** PR #488 merged; Production deployment подтверждён. В Realtime сразу после релиза событий не было. Владелец проверит реальные события при посещении с согласием. Не создавать заказ ради проверки без отдельного согласования. |
| 4 | Контент и SEO-поля Sanity | **СЛЕДУЮЩИЙ ЭТАП.** Начать с read-only проверки опубликованных документов и полей, сверить список из SEO-аудита, подготовить BG/RU/EN предложения. Никаких Sanity writes без точного списка IDs/fields, backup и отдельного approval. Страницы с нерешённой Google indexability anomaly не переписывать. |
| 5 | Возможности Google Search Console | ОЖИДАЕТ подтверждения этапа 1 и накопления сопоставимых данных. После этого — запросы/страницы, CTR, позиции, интент и приоритеты. |
| 6 | Local SEO | НЕ НАЧАТО. Нужен read-only аудит реальных Google Business Profile, NAP, service areas и citations; не создавать doorway pages. |
| 7 | Core Web Vitals | НЕ НАЧАТО в рамках SEO-плана. Измерить Lighthouse/CrUX только по отдельному плану производительности и сопоставимому baseline. |

### Ближайшая рабочая задача

**Этап 4 — Sanity content/SEO fields, только read-only аудит и подготовка предложений.**

Исходные пункты из аудита:
- 13 plant product meta descriptions длиннее 160 символов и 2 plant category descriptions длиннее 160 символов (160 — редакционный ориентир, не лимит Google).
- Полные RU/EN descriptions для 12 irrigation kit products.
- Полные RU/EN descriptions услуги `dostavka-poliv`.
- Explicit ALT BG/RU/EN для 2 equipment products и 2 equipment categories после проверки frontend fallback.
- Развести дублирующиеся локализованные metaTitle двух Irritec Connecto elbows: female SKU `IQ21820F0N25B`, male SKU `IQ21920M0N25B`.
- Отдельно оценить homepage и Rotor Sprinklers snippets на достаточной выборке GSC.

Точные Sanity IDs/slugs находятся в [SEO audit](../audits/2026-11-23-comprehensive-seo-audit.md). В новом чате сначала перечитать аудит и перепроверить опубликованные значения read-only; не полагаться на старый список без live read-back.

### Дополнительный контентный поток — обновление описаний товаров

Подробный план: [Product description refresh roadmap](PRODUCT_DESCRIPTION_REFRESH_ROADMAP_2026-11-23.md).

- Отдельная задача с разрешением владельца на редакторские Sanity writes; не смешивать с SEO Step 4, где остаётся отдельный read-only процесс для SEO-полей.
- **Форсунки: ЗАВЕРШЕНО — 26/26 опубликованы и прочитаны обратно** (7 VAN, 4 HE-VAN, 6 MPR strip, 9 R-VAN). Аудит: [nozzle description refresh](../audits/2026-11-23-nozzle-product-descriptions-refresh.md).
- **Готовые комплекты: ЗАВЕРШЕНО — 12/12 опубликованы.** Для набора 10 × 5 m владелец подтвердил практическую совместимость ESP-BAT-BT1 с производственными версиями 100-HV-9V от 01.01.2026 при подходящем соленоиде 9 V DC; более ранние версии не заявляются совместимыми. Карточки клапана H01040 и контроллера ESP-BAT-BT1 синхронизированы на BG/RU/EN. Состав и количества комплекта не менялись. Аудит: [kit refresh](../audits/2026-11-23-irrigation-kit-descriptions-refresh.md), [compatibility copy follow-up](../audits/2026-11-23-esp-bat-bt1-100-hv-9v-compatibility-copy.md).
- Контроллеры: live Sanity показывает 23 активных товара, тогда как аудит 15.11.2026 указывает 24; расхождение нужно устранить до редактирования. Дождеватели: 20 активных товаров.
- Humanizer connector в доступном каталоге не найден; текущая партия отредактирована вручную.

## 2. Отдельный поток — Google Shopping

Подробный план: [Google Shopping roadmap](GOOGLE_SHOPPING_SEO_ROADMAP_2026-11-18.md).

- Этапы 1–2: Product Offer implementation и синхронизация серверной/клиентской разметки выполнены в коде и опубликованы; brand parity исправлена позднее. Production HTML выборка проверена в отдельном live indexability audit. **Специальные Google Rich Results / URL Inspection доказательства для Shopping остаются незакрытыми**, поэтому исторические стадии 1–2 не отмечать полностью завершёнными до сохранения точных результатов.
- Этап 3: Merchant Center account Florial владелец подтвердил как ещё не зарегистрированный (18.11.2026); создание аккаунта и согласование коммерческих правил — отдельная будущая задача.
- Этапы 4–5: товарный feed и подключение Merchant Center не начинались.
- Этап 6: продолжать URL Inspection / recrawl после live Google test по этапу 1 SEO.
- Этапы 7–8: local/commercial signals и мониторинг после появления аккаунта и достаточных данных.

Не выдумывать GTIN/MPN/variant SKU, отзывы, ratings, shipping/return terms или availability.

## 3. Отдельный поток — Manager Web Push

Подробный план: [Manager Push roadmap](MANAGER_PUSH_NOTIFICATIONS_ROADMAP_2026-11-21.md).

- Реализация PR #450, диагностика PR #455 и сетевой TypeError fix PR #457 merged; Production release подтверждён в соответствующих записях.
- **Открыто:** владелец должен выполнить Owner self-test и реальную Android/Chrome проверку subscribe/persistence/push delivery/click/unsubscribe/re-subscribe для нужных ролей.
- Не создавать реальные Production orders/leads ради теста без согласованного безопасного сценария.

## 4. Отдельный поток — производительность

Подробный план: [Performance optimization roadmap](../ROADMAP_PERFORMANCE_OPTIMIZATION.md).

- Оптимизация остаётся **ПРИОСТАНОВЛЕННОЙ**; предыдущие исправления кода не являются доказательством улучшения Core Web Vitals.
- Следующий измерительный шаг при возобновлении: Network waterfall для homepage/category/product/search/service в BG и RU/EN, затем Lighthouse mobile/desktop и CrUX при наличии данных.
- Не заявлять LCP/INP/CLS улучшение без сопоставимого baseline и повторного измерения.
- Не возобновлять широкие performance изменения без отдельного решения владельца.

## 5. Документы, которые не следует смешивать

- [Manager Plants roadmap](../ROADMAP_MANAGER_PLANTS.md) и [Services & Leads roadmap](../ROADMAP_SERVICES_AND_LEADS.md) — самостоятельные продуктовые потоки; этот SEO-порядок их не переопределяет.
- [Irrigation engineering guides](../engineering/IRRIGATION_ASSISTANT_PERIMETER_FIRST_IMPLEMENTATION_V1.md) и [balanced zones / PDF guide](../engineering/IRRIGATION_ASSISTANT_BALANCED_ZONES_AND_ORDER_PDF_V1.md) — отдельная инженерная задача с утверждёнными ограничениями; не возобновлять приостановленные этапы без прямого поручения.

## 6. Устаревшие PR и evidence

- PR #486 содержит старые статусы (GA4 not started, Rich Results waiting) и базируется на старом main SHA; **не объединять без синхронизации**.
- PR #487 содержит полезный уникальный live indexability audit, но основан на устаревшем base и GitHub отмечает его как not mergeable. Аудит сохранён отдельным файлом в этой синхронизации; сам PR не использовать как основу новой работы.
- PR #409 остаётся открытым и не затрагивается этой синхронизацией.
- Исторические записи внутри подробных roadmap-файлов сохраняются; актуальный status snapshot в начале каждого файла и этот индекс имеют приоритет над старой датированной записью.

## 7. Правила следующего чата

1. Получить свежий HEAD `main`; прочитать `AI_INSTRUCTIONS.md`, `docs/AI/START_HERE.md`, `WORK_PROTOCOL.md`, `MASTER_SPEC.md`, `TECHNICAL_PASSPORT.md`, верх `CHANGELOG.md`, `OPEN_QUESTIONS.md` и этот индекс.
2. Продолжить SEO этап 4: read-only Sanity audit, сверить точные IDs/slug/локали/поля и frontend fallback.
3. Подготовить конкретные BG/RU/EN варианты текста/ALT и перечень затрагиваемых документов, ничего не публиковать.
4. Отдельно сохранить GA4 как наблюдение: проверить события при реальном визите после analytics consent; не создавать заказ.
5. Не менять Production, Sanity, Merchant Center, D1, Cloudflare settings/secrets или Google настройки без требуемого отдельного разрешения.

## Журнал синхронизации

- 23.11.2026 — объединены статусы SEO 7-step plan, Google Shopping, Manager Web Push и Performance в один реестр; добавлена live indexability audit запись из PR #487. Код, Sanity, Cloudflare, D1, Resend и Google settings не менялись.
