# Florial — единый реестр дорожных карт и текущих приоритетов

**Срез:** 25.11.2026  
**Production main HEAD на момент обновления:** `7465914b61f859768b073d1f678f9d22161e9ba6`  
**Единая ветка развития:** `develop` (создана от указанного main SHA; последующие документационные handoff-коммиты находятся в develop).  
**Назначение:** единая точка сверки статусов между самостоятельными дорожными картами. Этот индекс не заменяет подробные планы; он устраняет противоречия в статусах и определяет ближайший рабочий поток. После каждого существенного этапа обновлять соответствующую дорожную карту и этот реестр.

## 1. Главный активный поток — SEO Florial (7 последовательных этапов)

Подробный план: [SEO remediation roadmap](SEO_AUDIT_REMEDIATION_ROADMAP_2026-11-23.md).

| № | Направление | Актуальный статус на 23.11.2026 |
|---|---|---|
| 1 | Индексация, noindex, canonical, Production HTML | **НЕ БЛОКИРУЕТ дальнейшую работу.** Проверенная выборка Production initial HTML и hydrated DOM показывает `index, follow`, self-canonical, без `X-Robots-Tag`; robots/sitemap доступны, sitemap 1,372 URL, GSC сообщает 0 errors/warnings. Исторические URL Inspection anomalies (11 noindex и 3 canonical mismatch) остаются на отдельную read-only перепроверку примерно через месяц. Не ждать её для продолжения SEO-плана и не менять код/Sanity без нового доказательства. |
| 2 | Google Rich Results / Schema.org | **ЗАВЕРШЁН ПО ПОДТВЕРЖДЕНИЮ ВЛАДЕЛЬЦА в предыдущем чате;** отдельный отчёт/скриншот результата ещё не сохранён в GitHub. Не смешивать это с незавершёнными специальными Google Shopping проверками ниже. |
| 3 | GA4 ecommerce | **ИНТЕГРАЦИЯ ЗАВЕРШЕНА, ПРИЁМ СОБЫТИЙ НАБЛЮДАЕТСЯ.** PR #488 merged; Production deployment подтверждён. В Realtime сразу после релиза событий не было. Владелец проверит реальные события при посещении с согласием. Не создавать заказ ради проверки без отдельного согласования. |
| 4 | Контент и SEO-поля Sanity | **ЧАСТИЧНО ВЫПОЛНЕНО; ЭТАП ОСТАЁТСЯ ОТКРЫТЫМ.** В отдельной согласованной партии опубликованы и read-back проверены BG/RU/EN metaTitle двух Irritec Connecto elbows и Rotor Sprinklers category, а также ALT изображения Nipel-mufa category. Остаток этапа — read-only аудит опубликованных значений, frontend fallback и подготовка предложений. Никаких новых Sanity writes без точного списка IDs/fields и отдельного approval. Страницы с нерешённой Google indexability anomaly не переписывать. Подробности: [partial remediation audit](../audits/2026-11-23-sanity-seo-partial-remediation.md). |
| 5 | Возможности Google Search Console | **ПРЕДВАРИТЕЛЬНЫЙ DESKTOP-АНАЛИЗ ВЫПОЛНЕН.** За 24.10–20.11.2026: 392 показа, 10 кликов, CTR 2,55%, средняя позиция 22,9. Query/page строки неполные, выборка пока мала; изменения сайта не назначаются. Повторить анализ примерно 23.12.2026 на свежих 28 финализированных днях. Отчёт: [desktop GSC review](../audits/2026-11-23-gsc-desktop-preliminary-analysis.md). |
| 6 | Local SEO | **READ-ONLY АУДИТ ЗАВЕРШЁН 23.11.2026; УТОЧНЕНИЯ ВЛАДЕЛЬЦА ЗАПИСАНЫ.** Равда — действующий садовый центр с посещением покупателей, часы ежедневно 09:00–17:00; болгарские страницы старого DROP перенаправляются на текущий сайт Florial. Открыты подтверждение часов Несебра, телефонов и service areas. Профили/listings не изменялись. |
| 7 | Core Web Vitals | НЕ НАЧАТО в рамках SEO-плана. Измерить Lighthouse/CrUX только по отдельному плану производительности и сопоставимому baseline. |

### Ближайшая рабочая задача

**Этап 6 — Local SEO: read-only аудит завершён; remediation ожидает подтверждения владельца.**

Публичные Google Maps профили, NAP, контакты/расписание сайта, live GardenStore JSON-LD и доступные citations проверены. Ключевые расхождения и точные источники записаны в [Local SEO audit](../audits/2026-11-23-local-seo-readonly-audit.md).

Подтверждено владельцем:
- Равда — новый действующий садовый центр, куда покупатели могут приезжать; сохранять отдельную физическую локацию и профиль.
- Часы Равды: ежедневно 09:00–17:00.
- Болгарские страницы старого DROP перенаправляются на текущий болгарский сайт Florial; точные destination URL/redirect chain пока не проверены независимо.

До любых изменений остаётся подтвердить:
1. Фактические часы работы Несебра.
2. Основной телефон для каждой точки и актуальные service areas (включая Burgas/Varna), отдельно от доставки.
3. Официальный статус `palmandolivetrees.com` и канонические социальные профили.

Профили Google, внешние каталоги и сайт не изменялись. Не создавать doorway pages. Core Web Vitals остаётся отдельным следующим этапом; широкая performance-оптимизация по-прежнему приостановлена.

**Повторный GSC-анализ:** ориентировочно 23.12.2026, последние 28 финализированных дней; текущая контрольная выборка ограничена DESKTOP. Отдельно повторить read-only URL Inspection по индексации примерно в тот же срок. Эти проверки не блокируют завершённый read-only аудит Local SEO.

### Дополнительный контентный поток — обновление описаний товаров

Подробный план: [Product description refresh roadmap](PRODUCT_DESCRIPTION_REFRESH_ROADMAP_2026-11-23.md).

- Отдельная задача с разрешением владельца на редакторские Sanity writes; не смешивать с SEO Step 4, где остаётся отдельный read-only процесс для SEO-полей.
- **Форсунки: ЗАВЕРШЕНО — 26/26 опубликованы и прочитаны обратно** (7 VAN, 4 HE-VAN, 6 MPR strip, 9 R-VAN). Аудит: [nozzle description refresh](../audits/2026-11-23-nozzle-product-descriptions-refresh.md).
- **Готовые комплекты: ЗАВЕРШЕНО — 12/12 опубликованы.** Для набора 10 × 5 m владелец подтвердил практическую совместимость ESP-BAT-BT1 с производственными версиями 100-HV-9V от 01.01.2026 при подходящем соленоиде 9 V DC; более ранние версии не заявляются совместимыми. Карточки клапана H01040 и контроллера ESP-BAT-BT1 синхронизированы на BG/RU/EN. Состав и количества комплекта не менялись. Аудит: [kit refresh](../audits/2026-11-23-irrigation-kit-descriptions-refresh.md), [compatibility copy follow-up](../audits/2026-11-23-esp-bat-bt1-100-hv-9v-compatibility-copy.md).
- Контроллеры: live Sanity показывает 23 активных товара, тогда как аудит 15.11.2026 указывает 24; расхождение нужно устранить до редактирования. Дождеватели: **ЗАВЕРШЕНО — 20/20 опубликованы** с добавленным локализованным блоком доставки и услуг; read-back подтвердил 20 карточек и 0 drafts. Существующие описания и технические данные сохранены. Аудит: [sprinkler delivery refresh](../audits/2026-11-23-sprinkler-delivery-refresh.md).
- **Растения — отдельный редакторский пилот приостановлен по решению владельца.** 13 карточек «Палми и юки» были опубликованы с новыми BG/RU/EN описаниями, но владелец не принял результат; дальнейшая редактура растений остановлена. Карточки «Маслини» не изменены. Не смешивать этот пилот с SEO Step 4 и irrigation product-description roadmap. См. [plant editing stop record](../audits/2026-11-23-plant-description-editing-stop.md).
- Humanizer connector в доступном каталоге не найден; текущая партия отредактирована вручную.

## 2. Активный инженерный поток — SSR публичных страниц и каталога

Подробная последовательность: [SSR Content v1 roadmap](SSR_CONTENT_V1_ROADMAP_2026-11-24.md).

- **Главная `/`: RELEASED.** PR #533/#534 merged; Production release и raw HTTP smoke для homepage зафиксированы в PR #533.
- **Каталог услуг `/services`: RELEASED.** PR #535 merged; desktop/mobile подтверждены владельцем.
- **Детальные услуги `/services/{slug}`: RELEASED.** PR #539 merged; Production smoke 25 услуг × 3 локали (75 ответов) прошёл.
- **Индекс блога `/blog`: MERGED TO MAIN.** PR #540 merged; Preview smoke прошёл для 19 публикаций × 3 локали. Отдельный Production raw HTTP smoke требуется подтвердить.
- **Статьи `/blog/{slug}`: MERGED TO MAIN.** PR #541 merged; Preview smoke прошёл 19 статей × 3 локали (57 ответов). Отдельный Production raw HTTP smoke требуется подтвердить.
- **Каталог оборудования и категории:** PR #531 и расширение PR #542 находятся в текущем main baseline. Для PR #542 подтверждён Preview smoke 54 категории × 3 локали (162 ответа); отдельный Production smoke требуется подтвердить.
- **Отдельные товары оборудования:** PR #543 MERGED в `main` коммитом `7465914b61f859768b073d1f678f9d22161e9ba6`. Cloudflare Production deployment `25504afc-2b42-4a90-9595-501c7fa08fe8` успешен. Exact-main workflow `45576362238` прошёл 535/535 tests, type-check, lint и build; Production raw HTTP smoke подтвердил все 275 активных товаров × BG/RU/EN (825/825), а отсутствующий/неопубликованный товар возвращает 404 noindex. Владелец визуально принял страницы на desktop/mobile. Подробности: [product SSR audit](../audits/2026-11-25-equipment-product-ssr-v1.md).
- **Следом:** этап 7 SSR `/contacts`: read-only discovery существующих источников, структуры, локализаций и подтверждённых контактных данных; затем этап 8 `/about`; затем этап 9 — общая SSR/SEO регрессия BG/RU/EN.

Не считать Preview-доказательства Production-релизом. Не менять Sanity-контент/схему, D1, Cloudflare settings/secrets или Production без соответствующего разрешения.

## 3. Отдельный поток — Google Shopping

Подробный план: [Google Shopping roadmap](GOOGLE_SHOPPING_SEO_ROADMAP_2026-11-18.md).

- Этапы 1–2: Product Offer implementation и синхронизация серверной/клиентской разметки выполнены в коде и опубликованы; brand parity исправлена позднее. Production HTML выборка проверена в отдельном live indexability audit. **Специальные Google Rich Results / URL Inspection доказательства для Shopping остаются незакрытыми**, поэтому исторические стадии 1–2 не отмечать полностью завершёнными до сохранения точных результатов.
- Этап 3: Merchant Center account Florial владелец подтвердил как ещё не зарегистрированный (18.11.2026); создание аккаунта и согласование коммерческих правил — отдельная будущая задача.
- Этапы 4–5: товарный feed и подключение Merchant Center не начинались.
- Этап 6: продолжать URL Inspection / recrawl после live Google test по этапу 1 SEO.
- Этапы 7–8: local/commercial signals и мониторинг после появления аккаунта и достаточных данных.

Не выдумывать GTIN/MPN/variant SKU, отзывы, ratings, shipping/return terms или availability.

## 4. Отдельный поток — Manager Web Push

Подробный план: [Manager Push roadmap](MANAGER_PUSH_NOTIFICATIONS_ROADMAP_2026-11-21.md).

- Реализация PR #450, диагностика PR #455 и сетевой TypeError fix PR #457 merged; Production release подтверждён в соответствующих записях.
- **Открыто:** владелец должен выполнить Owner self-test и реальную Android/Chrome проверку subscribe/persistence/push delivery/click/unsubscribe/re-subscribe для нужных ролей.
- Не создавать реальные Production orders/leads ради теста без согласованного безопасного сценария.

## 5. Отдельный поток — производительность

Подробный план: [Performance optimization roadmap](../ROADMAP_PERFORMANCE_OPTIMIZATION.md).

- Оптимизация остаётся **ПРИОСТАНОВЛЕННОЙ**; предыдущие исправления кода не являются доказательством улучшения Core Web Vitals.
- Следующий измерительный шаг при возобновлении: Network waterfall для homepage/category/product/search/service в BG и RU/EN, затем Lighthouse mobile/desktop и CrUX при наличии данных.
- Не заявлять LCP/INP/CLS улучшение без сопоставимого baseline и повторного измерения.
- Не возобновлять широкие performance изменения без отдельного решения владельца.

## 6. Документы, которые не следует смешивать

- [Manager Plants roadmap](../ROADMAP_MANAGER_PLANTS.md) и [Services & Leads roadmap](../ROADMAP_SERVICES_AND_LEADS.md) — самостоятельные продуктовые потоки; этот SEO-порядок их не переопределяет.
- [Irrigation engineering guides](../engineering/IRRIGATION_ASSISTANT_PERIMETER_FIRST_IMPLEMENTATION_V1.md) и [balanced zones / PDF guide](../engineering/IRRIGATION_ASSISTANT_BALANCED_ZONES_AND_ORDER_PDF_V1.md) — отдельная инженерная задача с утверждёнными ограничениями; не возобновлять приостановленные этапы без прямого поручения.

## 7. Устаревшие PR и evidence

- PR #486 содержит устаревшие статусы и старую базу; его SEO roadmap не использовать как основу — актуальный порядок сохранён в `main` и синхронизирован в этом индексе.
- Уникальный live indexability audit из PR #487 уже сохранён в `main` как `docs/audits/2026-11-23-production-indexability-live-check.md`; сам отставший PR не использовать как интеграционную основу.
- PR #490: уникальный audit частичной Sanity SEO remediation перенесён в этот интеграционный набор; статус Step 4 отражён выше.
- PR #493 и #494: sprinkler close-out и финальный kit/compatibility close-out интегрированы вместе, чтобы не перезаписывать общие документы параллельно.
- PR #491: его ранний общий snapshot/узкий spray-nozzle audit не переносится отдельно, поскольку последующий PR #492 содержит актуальный 26-product audit и семейные snapshots.
- PR #468: актуальная документация закрытия Plant Editor UX включена в этот интеграционный набор.
- PR #409: уникальные выводы Google Shopping audit уже были перенесены в `main` отдельной синхронизацией PR #424; старый PR не использовать повторно и не переносить его устаревшую общую документацию.
- Исторические записи внутри подробных roadmap-файлов сохраняются; актуальный status snapshot в начале каждого файла и этот индекс имеют приоритет над старой датированной записью.

## 8. Правила следующего чата

1. Получить свежие HEAD `develop` и `main`; `develop` — единая ветка развития, `main` — Production. Прочитать `AI_INSTRUCTIONS.md`, `docs/AI/START_HERE.md`, `WORK_PROTOCOL.md`, `MASTER_SPEC.md`, `TECHNICAL_PASSPORT.md`, верх `CHANGELOG.md`, `OPEN_QUESTIONS.md` и этот индекс.
2. Если владелец продолжает текущий SSR поток, сначала закрыть PR #543 по актуальному аудиту и визуальному подтверждению, затем двигаться по SSR roadmap. SEO этап 6 — Local SEO вести как отдельный поток, read-only и по отдельному поручению.
3. Не менять профили, внешние listings или сайт без отдельного согласования.
4. Повторить desktop-only GSC анализ примерно 23.12.2026 на последних 28 финализированных днях; это не блокирует текущую работу.
5. Повторно проверить сохранённые URL Inspection anomalies примерно через месяц; не менять код/Sanity без нового подтверждения.
6. Не менять Production, Sanity, Merchant Center, D1, Cloudflare settings/secrets или Google настройки без требуемого отдельного разрешения.

## Журнал синхронизации

- 25.11.2026 — PR #543 принят владельцем, squash-merged в `main` (`7465914b61f859768b073d1f678f9d22161e9ba6`) и подтверждён в Production: 275 × 3 локали (825/825) raw HTTP pages; deployment `25504afc-2b42-4a90-9595-501c7fa08fe8`. `develop` синхронизирован с `main` merge-коммитом `04a615d3f8f19d7ab36a0ea0f3926aae5a14b762`. Следующий SSR этап — `/contacts`. PR #409 не изменялся; общие документы из его diff оставлены нетронутыми.

- 23.11.2026 — объединены статусы SEO 7-step plan, Google Shopping, Manager Web Push и Performance в один реестр; добавлена live indexability audit запись из PR #487. Код, Sanity, Cloudflare, D1, Resend и Google settings не менялись.
- 23.11.2026 — интеграционный проход по PR #493, #494, #490 и #468: обновлены статусы kit 12/12, sprinklers 20/20, частичной SEO remediation и Manager Plant Editor; добавлены связанные аудиты. Растительный редакторский пилот зафиксирован как остановленный по решению владельца. Исторические/устаревшие PR не объединялись вслепую.


- 23.11.2026 — этап 1 снят с блокирующей зависимости; исторические URL Inspection anomalies оставлены на отдельную повторную проверку примерно через месяц. Этап 5 выполнен как предварительный анализ только DESKTOP: 392 impressions, 10 clicks, CTR 2,55%, position 22,9 за 24.10–20.11.2026; из-за малого срока работы сайта и неполных query/page строк дальнейшие SEO-выводы отложены до повторного среза примерно 23.12.2026. Следующий активный этап — 6 Local SEO. Детали: [desktop GSC audit](../audits/2026-11-23-gsc-desktop-preliminary-analysis.md).


- 23.11.2026 — по отдельному разрешению владельца выполнена scoped performance remediation страницы /blog: PR #510 merged в main (f0913f3d379c718bc140d539e5b66beb7411a8f2), CI/Preview/Production успешны; BG/RU/EN Production HTML smoke пройден. Общая performance-оптимизация остальных страниц остаётся приостановленной. Для блога открыты только сопоставимый повторный PSI/Lighthouse и screenshot/interaction QA; численное улучшение пока не подтверждено. Аудит: docs/audits/2026-11-23-blog-performance-remediation.md.
