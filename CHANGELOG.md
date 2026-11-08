## 2026-11-08 — Этап 6: аудит прав Seller и тарифов доставки

- Подтверждена владельцем ручная приёмка Manager после этапа 5.
- Sanity dataset `production`: опубликован `feeEUR=10` для Каблешково (предыдущее значение 15 EUR); обновлён только документ `43fdc359-0e28-4410-83b3-a1902270345e`. Это приводит публичную страницу доставки к уже существовавшим 10 EUR в корзине и серверной проверке заказов. Поморие остаётся 15 EUR.
- В ветке `fix/stage-6-seller-permissions-delivery-fee` в `functions/api/manager/staff.ts` добавлена очистка `canManageCategorySeo`, `canViewServiceLeads`, `canManageServiceLeads` при переводе в Seller; запрет на назначение этих прав добавлен в создание и обновление Seller.
- В `tests/service-leads-manager.test.mjs` добавлены регрессионные проверки seller permission cleanup и соответствия тарифа Каблешково 10 EUR в корзине и серверной проверке.
- Production D1 не изменялась; существующие заявки/события/заказы/профили не изменялись. Автоматическая очистка заявок 365 дней не добавлялась. CI/PR ещё ожидаются; production deployment не выполнялся.
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
