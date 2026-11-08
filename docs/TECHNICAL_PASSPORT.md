## 2026-11-08 — Обновлён фирменный шаблон клиентского email по заявкам

- Изменён только `functions/api/service-leads.ts`: общий helper `buildCustomerConfirmationHtml` формирует локализованное BG/RU/EN HTML-письмо с логотипом, названием садового центра, фирменной палитрой и контактами.
- Логотип: существующий опубликованный Sanity photo asset `oficialno-logo-florial-gradinski-centar`, CDN URL `https://cdn.sanity.io/images/bxvcy0qs/production/4d6d94ce99f3e210ba0b649dda236ee7e0ce522c-1547x581.png`; Sanity document не изменялся.
- Контакты в письме: BG `+359 876 777 902`; RU/UA/EN `+359 885 834 860`; WhatsApp `+380 67 480 7486`. Телефоны и WhatsApp оформлены кликабельными ссылками.
- Helper вызывается для первоначального клиентского подтверждения и повторной отправки после idempotency conflict; текст письма с номером заявки и услугой сохранён.
- Не менялись owner notification, форма, D1, Sanity documents/schema, Cloudflare secrets/settings, Manager, checkout, email заказов, Header, меню и Footer. Тестовое письмо и Production API submission не выполнялись; Resend delivery остаётся непроверенной.
- PR #125 merged squash commit `75ea099147714174e303e727cf67d091c05fb5dd`; Cloudflare Pages Production deployment `42cfb190-b961-4f6b-8883-2d9d78eab222` (2026-11-08 10:53 UTC) опубликован для `main`, build/deploy stages `success`, command `npm run build`, aliases `florial-bg.com` и `www.florial-bg.com`.
- CI: PR website + Studio validation run `42471440144` — success; PR D1 migration validation run `42471440098` — success; post-merge D1 validation run `42473330879` — success.
- Live read-only smoke после deploy: `/services/avtomatichno-napoyavane` (BG), тот же URL с `?lang=ru` и `?lang=en`: HTTP 200, `html lang` соответственно bg/ru/en, `robots=index, follow`; форма присутствует в HTML. POST заявки не отправлялся.
- Реальное письмо не отправлялось; Production API и Resend delivery не тестировались. Поэтому шаблон встроен в опубликованный Worker, но фактическая отправка клиенту остаётся НЕ ПРОВЕРЕНА.

---

## 2026-11-08 — Production D1 migration 0011_service_leads применена

- Владелец явно разрешил применение миграции 08.11.2026.
- Production D1: `5fbb0e47-8439-493c-821a-6945eef7d8b2`; перед применением последняя версия была `0010_public_api_rate_limits`.
- Исходный файл: `functions/migrations/0011_service_leads.sql`, blob SHA `c9a15f971a0deeb764884c440c8fd380d35a92ff`, из `main` commit `c47c9d0033007c5fbe02a023efdd7851d34a03a0`.
- Marker `0011_service_leads` записан в `schema_migrations` с `applied_at=2026-11-08 10:16:39`.
- Созданы `service_leads` (24 колонки), `service_lead_events` (11 колонок), 6 индексов и 2 triggers: `trg_service_lead_events_no_update`, `trg_service_lead_events_no_delete`.
- Read-only verification после применения подтвердила marker, обе таблицы, все индексы/triggers и нулевое количество строк в обеих таблицах. Batch применён успешно, ошибок нет.
- Изменены только новые объекты service-leads и marker migration; существующие orders/catalog/Manager данные не менялись.
- Не выполнялись Production API submission и тестовое письмо Resend; секреты не читались. Автоматическое retention cleanup отсутствует. API/email end-to-end не объявлять готовыми до отдельных проверок.
- Новая инструкция: `/Florial/ИНСТРУКЦИЯ(2)_FLORIAL_АКТУАЛЬНАЯ_08-11-2026_rev17.md`; rev16 сохранена.

---

## 2026-11-08 — Выпущена основная инструкция MD2 rev16

- В Library проекта Florial загружена новая редакция `/Florial/ИНСТРУКЦИЯ(2)_FLORIAL_АКТУАЛЬНАЯ_08-11-2026_rev16.md`.
- Rev16 создана на основе rev15 с сохранением всей предыдущей инструкции и истории целиком; добавлена контрольная точка после merge PR #124 и Production deployment.
- Зафиксированы merge commit `53ee65d6970dd3d3849853e6241cff652d1220a2`, Production deployment `ccae6acc-3e39-47f3-8192-c4110240c080`, live smoke BG/RU/EN и текущий blocker: D1 migration `0011_service_leads` не применялась.
- Rev15 и более ранние редакции не перезаписывались и не удалялись.
- Последний подтверждённый `main` commit перед записью этой строки: `9cbd9928800044d37f9998656d99509e3a0389bf`.

## 2026-11-08 — PR #124 объединён и опубликован: заявочная форма с уведомлением об обработке

- PR #124 объединён в `main` squash-commit `53ee65d6970dd3d3849853e6241cff652d1220a2`; PR закрыт со статусом merged.
- Cloudflare Pages Production deployment `ccae6acc-3e39-47f3-8192-c4110240c080` для этого commit завершился успешно: queued, initialize, clone_repo, build и deploy — success. Build command подтверждена как `npm run build`; aliases `https://florial-bg.com` и `https://www.florial-bg.com`.
- На странице услуги добавлено небольшое уведомление BG/RU/EN: менеджер Florial получит и обработает заявку; при необходимости команда свяжется с клиентом по указанным контактам. Checkbox согласия и ссылка на privacy policy не добавлялись.
- Live smoke test страницы `/services/avtomatichno-napoyavane` на BG, RU и EN: HTTP 200, `robots=index, follow`, локализованная строка уведомления отображается во всех трёх версиях. Проверка выполнена после ожидания клиентского рендеринга.
- CI на PR HEAD `6d8a6eb80159137b316670b8b79311fd1108c0c3`: D1 migration validation run `42469920216` — success; Blog and Studio validation run `42469920217` — success; Sanity Studio validate run `42469920287` — success.
- **Важно: Production D1 migration `0011_service_leads` НЕ применялась.** В Production D1 до миграции отсутствуют таблицы `service_leads` и `service_lead_events`; API формы не готов к приёму реальных заявок до применения миграции и отдельного безопасного smoke test. Не считать форму рабочей end-to-end.
- Sanity schema deploy не выполнялся, Sanity documents не изменялись. Resend test email не отправлялся; секреты не читались.
- Автоматическое удаление/обезличивание по retention 365 дней не реализовано. Процедуру нужно определить до полноценного запуска приёма заявок.
- Фотозагрузка через сайт отложена: фото при необходимости клиент отправит через WhatsApp или другой мессенджер; Sanity Media Library и R2 не создавались.
- Не менялись Manager, orders, checkout, Header, меню, Footer и глобальная оболочка.
- **Статус Этапа 4: КОД ОБЪЕДИНЁН И FRONTEND ОПУБЛИКОВАН; ПРИЁМ ЗАЯВОК НЕ ГОТОВ К ПРОДАКШН-ЭКСПЛУАТАЦИИ до применения migration 0011, проверки email и согласования retention.**

---

## 2026-11-08 — ЭТАП 4: заявочная форма без согласия и без фото (в работе)

- Проверенная база: `main` commit `50d91be629bd1d31dd861896732cdd43fb5ea91b`; реализация находится в `feat/service-leads-stage-4`, PR #124.
- Production D1 `5fbb0e47-8439-493c-821a-6945eef7d8b2` до начала работ read-only проверена: последняя migration `0010_public_api_rate_limits`; таблиц `service_leads` / `service_lead_events` не было.
- Подготовлена additive migration `functions/migrations/0011_service_leads.sql` с отдельными таблицами `service_leads` и append-only `service_lead_events`. Содержит idempotency, notification states и `retention_until` на 365 дней. Поля согласия и URL политики не включены. Migration не применена к Production.
- `functions/api/service-leads.ts` проверяет same-origin, JSON/body limit, rate limit, honeypot, активную Sanity service, поля/контакты и idempotency. Нет проверки checkbox, `consentText` или `privacyPolicyUrl`; запись в D1 и best-effort email сохраняются.
- Email повторно использует существующий `sendOrderEmail` и Pages variables `RESEND_API_KEY`, `EMAIL_FROM`, `ORDER_NOTIFICATION_EMAIL`; наличие имён проверено без чтения значений. Тестовая отправка не выполнялась.
- `src/pages/ServicePage.tsx` показывает форму BG/RU/EN без checkbox согласия и без ссылки на privacy policy. Клиент описывает проблему; если потребуется фотография, команда Florial свяжется с ним и предложит отправить её через WhatsApp или другой удобный мессенджер.
- **Фотозагрузка через сайт исключена из текущего объёма по решению владельца.** Не создавать Media Library, не подключать R2, не использовать Sanity dataset assets для клиентских фото и не добавлять file fields/endpoints. Вопрос будущего приватного хранения остаётся открытым.
- Из Sanity Studio schema и `src/types.ts` удалены поля `consentText` и `privacyPolicyUrl`, добавлявшиеся в этой ветке; schema deploy и Sanity document writes не выполнялись.
- Для клиентского запроса на расчёт/оказание услуги применимость GDPR Art. 6(1)(b) оценивается как преддоговорные действия по просьбе клиента, если фактическая цель запроса соответствует этому основанию. Art. 13 GDPR сохраняет отдельную обязанность информирования; она не требует checkbox согласия и не является техническим gate формы. Наличие и содержание privacy notice вне формы требуют отдельной правовой проверки; не заявлять о полной GDPR-compliance без неё.
- Срок хранения заявок задаётся 365 дней; автоматическое удаление/обезличивание не реализовано. Перед запуском требуется отдельно согласовать и проверить процедуру retention.
- Production D1, Sanity documents, Cloudflare secrets/settings, Manager, orders, checkout, Header, меню, Footer не изменялись. Нет merge и Production deployment. Этап 4 не завершён.
- Выпущена и проверена Library-инструкция `ИНСТРУКЦИЯ(2)_FLORIAL_АКТУАЛЬНАЯ_08-11-2026_rev15.md` (08.11.2026, rev15); предыдущая rev14 сохранена целиком.



## 2026-11-08 — ЭТАП 3: Sanity delivery zones подключены в коде; Production ожидает согласования

- Базовый `main`: `a021f637f7ea2850a57673c0560f4e82fe3146fc`. Реализация подготовлена в PR #120: https://github.com/omaraandrey-dev/florial/pull/120; кодовые commits `cb2c92d566228bed31c1fc1bd5a96f87d4746c4b` и `7e2296b2f54eafb93265f402856e1099773172a0`.
- Runtime изменён в `src/App.tsx`, `src/pages/IrrigationSupportPage.tsx` и `src/lib/servicesOrder.ts`: страница загружает активные `deliveryZone` через существующий публичный `sanityClient`, сортирует по `sortOrder` и показывает локализованные BG/RU/EN названия, расстояния и EUR тарифы; `App.tsx` выбирает специальную страницу по сохранённому URL или `serviceLayout=delivery`; helper отключает временную отдельную карточку доставки, когда опубликована Sanity-услуга с layout/category delivery.
- Добавлены локализованные состояния загрузки, ошибки и отсутствия активных зон. Существующий URL `/services/dostavka-poliv`, тексты страницы, CTA, изображения, контакты, breadcrumbs и SEO fallback сохранены.
- Sanity Production `bxvcy0qs/production`: все 30 существующих `deliveryZone` документов проверены (уникальные slug, числовые distanceKm/feeEUR, заполненные обязательные поля), активированы и опубликованы. Создан и опубликован один документ `service` для доставки (`slug=dostavka-poliv`, `serviceCategory=delivery`, `serviceLayout=delivery`, `sortOrder=90`) с BG/RU/EN названием, кратким описанием, SEO и существующим изображением. Дубликаты не создавались.
- Перед публикацией у двух подтверждённых зон обновлены только флаги активности и удалены устаревшие предупреждения в RU/EN примечаниях: Поморие — 15 EUR, Кошарица — 10 EUR. Все остальные тарифы, расстояния, названия и sortOrder сохранены.
- GitHub Actions PR #120: `Blog and Studio validation` run #477 — success (lint, website utility tests, Vite build, syntax checks, Studio build); `Florial D1 migration validation` run #483 — success. D1 не изменялась.
- Live smoke до публикации кода: production страница BG/RU/EN проверена; H1/тексты и текущая таблица доступны. Canonical и hreflang BG/RU/EN/x-default подтверждены на каждой локали. После публикации delivery service в Sanity live sitemap содержит ровно 3 `<loc>` для `/services/dostavka-poliv` (BG/RU/EN), без дублирующих URL; alternate hreflang присутствуют. Это проверка текущей production версии до merge PR, не доказательство работы нового frontend query.
- Последний Production deployment на момент проверки: `e1161649-dc9a-46be-be28-d7989c917a40`, commit `a021f637f7ea2850a57673c0560f4e82fe3146fc`, build/deploy `success`. Это документационный deploy предыдущего этапа; код PR #120 в нём отсутствует.
- Header, меню, Footer, global shell, `HomePage.tsx`, `ServicesListPage.tsx`, Sanity schema, D1, Manager, orders, checkout, Resend, secrets и Cloudflare settings не менялись. Старый fallback JSX карточки доставки сохранён, но helper не добавляет его при наличии Sanity delivery service.
- **Статус этапа: В РАБОТЕ — код и данные готовы, PR #120 открыт; merge/Production deployment не выполнялись.** Production deployment требует отдельного согласования владельца. После публикации обязательно проверить BG/RU/EN, 30 строк, тарифы, canonical/hreflang, sitemap и изменение тарифа из Sanity без изменения кода.

## 2026-11-08 — ЭТАП 2 ЗАВЕРШЁН: публичные страницы услуг

- PR #116 merged: `f05d52f2bf81c80e103c337f5332dbf3c13af81c`; PR #117 merged: `2f94935645025441be931dceeb047701d9e0ea28`; PR #118 merged: `f23e80dc78910657547a996ff87c85b5075d6ac8`.
- Финальный main commit: `f23e80dc78910657547a996ff87c85b5075d6ac8`.
- Изменены: `src/App.tsx` (GROQ fields sortOrder/category/layout/Hero/gallery); `src/types.ts`; `src/lib/servicesOrder.ts` (Sanity sortOrder); `src/pages/ServicePage.tsx` (Hero, gallery, advantages, steps, CTA, UI-only leadForm, duplicate suppression, localized headings and form labels).
- `HomePage.tsx` и `ServicesListPage.tsx` используют единый helper и сортируются по Sanity sortOrder. Отдельная карточка доставки остаётся фиксированной позицией 90 до Этапа 3.
- Production smoke test: BG/RU/EN service pages и `/services` — HTTP 200; robots `index, follow`; Hero image не дублируется в gallery; совпадающий Hero H1 не повторяется как H2; преимущества/этапы/CTA не дублируются, если уже присутствуют в description; подписи формы локализованы, phone/email/details получают tel/email/textarea.
- Все 8 опубликованных service документов имеют RU/EN description и SEO metaTitle/metaDescription. Структурированные `translations.ru/en.advantages`, `steps`, `leadForm` не заполнены; соответствующие разделы уже присутствуют в локализованных descriptions, UI избегает повторов. Для формы используются локализованные frontend fallback labels; Sanity данные не менялись.
- Sitemap smoke test: 24 service URL entries (8 услуг × BG/RU/EN). SEO source helper `applyPageSeo` сохраняет self-canonical и hreflang alternates; `robots` подтверждён как `index, follow`.
- CI: PR #116/#117/#118 lint/tests/Vite build/Pages Functions syntax/read-only migration dry-run/Studio build — success. Main D1 validation run `42448148467` — success. Отдельного npm script для standalone TypeScript `tsc --noEmit` в проекте нет.
- Cloudflare Pages Production deployment: `407cef61-bc67-444f-ba84-48d46d99fcfa`, build и deploy success; aliases `https://florial-bg.com`, `https://www.florial-bg.com`.
- Sanity read-only: 8 published active service documents; 14 contentBlocks услуги монтажа в Несебре сохранены. Никакие Sanity documents не изменялись. 30 deliveryZone drafts, 0 published.
- Владелец подтвердил тарифы: Поморие 15 €, Кошарица 10 €. Обе draft-записи пока `isActive=false`; на Этапе 3 активировать обе и сохранить эти суммы. Расстояния взяты из текущей страницы и не были независимо проверены.
- Не менялись D1, Manager, Resend, заказы, checkout, доставка, Header, меню, Footer, глобальная оболочка и Cloudflare secrets. Заявочная форма — только UI; серверная отправка, email, фото и Manager интеграция остаются следующими этапами.
- Related services/products не добавлялись: соответствующих полей в текущей схеме service нет.
- Этап 3 не начат. Продолжать его в отдельном новом чате после проверки последней MD2 и актуального main.

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

## 2026-11-08 — Этап 1: расширение модели услуг и зон доставки Sanity (PR в работе)

- Текущий GitHub main перед этапом: `3a58b1412c949a6c4f9bd8bda33214b78045ced9`; рабочая ветка: `feature/services-sanity-model-2026-11-08`.
- Источник схемы — существующий `studio/schemaTypes/index.ts`; workspace `florial-admin` в dataset `production`. Используется существующая Studio `florial-admin-bg.sanity.studio`, appId `fdy0ldwl717qtp5pikl7715l`; новую Studio не создавать.
- В тип `service` добавлены необязательные поля `sortOrder`, `serviceCategory` (landscaping/planting/irrigation/lawn/maintenance/delivery) и `serviceLayout` (standard/delivery; initialValue только для новых документов).
- В существующие RU/EN translations добавляются локализованные `advantages`, `steps` и `leadForm` (title, submitLabel, successMessage, consentText, fields с name/type/label/placeholder/required). Корневая BG leadForm получает successMessage, consentText, placeholder и type поля. Существующие поля не переименовываются и не удаляются.
- Добавлен новый документный тип `deliveryZone`: BG name, string slug, RU/EN names and notes, distanceKm, feeEUR, BG note, isActive, sortOrder. Денежное поле явно хранит EUR; расстояние в километрах от Слънчев бряг.
- Live Sanity schema до этого изменения не содержала `sortOrder`, `serviceCategory`, `serviceLayout` в service и не содержала `deliveryZone`. Восемь опубликованных service documents найдены в published perspective; все активны. Поля/значения существующих документов не мигрировались.
- Специальная услуга монтажа в Несебър сохранена: документ `7ead4133-8f63-4381-bafe-493499fff5b8` содержит 14 существующих `contentBlocks`; никакие документы не редактировались.
- Сверка действующей страницы `src/pages/IrrigationSupportPage.tsx`: 30 зон/населённых пунктов с расстояниями и тарифами. Совпадают с ранее сообщёнными владельцем значениями Sunny Beach 0 €, Nessebar 10 €, Ravda 10 €, Sveti Vlas 10 €, Kableshkovo 15 €. Расхождения: текущий код Pomorie 15 € (владелец ранее указал 20 €); текущий код Kosharitsa 10 € (владелец ранее указал 15 €). Не исправлять автоматически. Дополнительные населённые пункты из текущего кода также должны быть сохранены при переносе. Расстояния берутся из текущей страницы и требуют подтверждения владельцем до публикации тарифов.
- В workflow `.github/workflows/sanity-studio.yml` PR validation только собирает два workspace; `.github/workflows/deploy-sanity-studio.yml` выполняет production schema deployment при push в main или ручном запуске. После merge требуется проверить оба workflow/deployment и фактический `get_schema`.
- На момент этой записи изменения ещё не объединены в main и deployed schema не обновлена. Sanity documents, D1, Cloudflare settings/secrets, Resend, frontend/runtime, Header/menu/Footer и Production content не менялись.

# Правило поиска и версионирования основной инструкции Florial (обязательно для каждого нового чата)

**Дата фиксации правила: 07.11.2026. История договорённости: 21.10.2026; подтверждение сохранения отдельных редакций: 03.11.2026.**

- Основная оперативная инструкция проекта хранится отдельными Markdown-файлами в Library проекта ChatGPT. Используется формат MD2 — файл семейства `ИНСТРУКЦИЯ(2).md`; «AMD» в устной формулировке означает именно MD/Markdown, не отдельный формат.
- В начале каждого нового чата и до любой технической работы обязательно найти все доступные редакции этой инструкции в Library, проверить метаданные `created_at` (дату создания) и номер `revN` в имени/заголовке. Выбрать редакцию с самой поздней датой создания; если дата совпадает — с наибольшим номером rev. Дата изменения файла сама по себе не заменяет дату создания. Не полагаться на историю чатов или память вместо проверки Library.
- Прочитать выбранную редакцию целиком либо все разделы, относящиеся к задаче, включая самый верхний блок актуальной контрольной точки и обязательный порядок работы. Проверить, нет ли более новой редакции или дополнения.
- После каждой существенной технической работы создавать **новый отдельный Markdown-файл** на основе последней редакции: `ИНСТРУКЦИЯ(2)_FLORIAL_АКТУАЛЬНАЯ_YYYY-MM-DD_revN.md`. В имени указывать фактическую дату создания новой редакции и следующий последовательный номер rev. Добавлять сверху новый блок контрольной точки и сохранять ниже всю предыдущую историю/разделы. Не перезаписывать и не удалять старые редакции.
- Новую редакцию сохранять в Library проекта. В GitHub не дублировать всю Library-инструкцию без необходимости: в `docs/TECHNICAL_PASSPORT.md` поддерживать это правило и актуальные технические факты; в `CHANGELOG.md` фиксировать факт выпуска новой редакции и кратко перечислять добавления.
- Если Library недоступна, дата создания или последовательность редакций не подтверждаются, прямо указать «НЕ ИЗВЕСТНО — нужно уточнить» и запросить нужный файл/доступ. Не выбирать редакцию только по догадке.
- После сохранения проверить фактическое имя, дату создания/путь и успешность загрузки новой редакции. В ответе сообщать номер rev, дату, место сохранения, GitHub commit и какие файлы изменены.

## 2026-11-07 — Усиление безопасности публичных API (Production опубликован)

### Публикация и инфраструктура
- PR #110 объединён в `main`; merge commit: `aa514f8997a3f4faeba35483e86d0ef558a061f5`.
- Cloudflare Pages project: `florial`; Production deployment: `1651e652-2ff5-45d4-a89e-b53addfb07e4`; deployment commit совпадает с merge commit. Все стадии `queued`, `initialize`, `clone_repo`, `build`, `deploy` завершились `success`.
- Production D1: `5fbb0e47-8439-493c-821a-6945eef7d8b2`. По явному разрешению владельца применена migration `0010_public_api_rate_limits`; marker в `schema_migrations` подтверждён (`2026-11-07 15:12:54`).
- Созданы `api_rate_limits(bucket_key, window_start, request_count, expires_at)` и индекс `idx_api_rate_limits_expires(expires_at)`. Migration аддитивная, существующие `orders`, `order_events`, `site_events` не изменяла.
- CI перед merge: workflow runs `42379786803` и `42379786810`; все jobs/steps завершились `success`. Cloudflare Production build `npm run build` и компиляция Pages Functions успешны.

### Публичные endpoints
- `POST /api/orders`: strict same-origin, JSON Content-Type, `Sec-Fetch-Site` validation, body limit 64 KiB, rate limit 5 requests / 15 minutes / IP.
- `POST /api/track`: те же проверки, body limit 4 KiB, rate limit 90 requests / minute / IP.
- Rate limiting хранит дневной SHA-256 digest значения `CF-Connecting-IP`, а не исходный IP. Digest — псевдонимизированный идентификатор, не считать его полной анонимизацией.
- При превышении лимита возвращается 429 с `Retry-After`; при отсутствии IP или недоступности D1 действует fail-closed (503). Случайная best-effort очистка просроченных bucket rows не должна блокировать запрос.
- API responses используют `Cache-Control: no-store`; размер тела ограничен до чтения/парсинга.

### HTTP headers и static assets
- `functions/_middleware.ts` добавляет `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`; HSTS `max-age=31536000` устанавливается для HTTPS.
- `public/_headers` задаёт security headers для статических ответов и `Cache-Control: public, max-age=31536000, immutable` для `/assets/*`.
- Данные правила конфигурации вошли в production deployment. Сырые HTTP response headers live-домена не удалось независимо получить используемым web-reader; фактический ответ каждого заголовка помечен как НЕ ПРОВЕРЕНО до проверки обычным HTTP-клиентом.

### Ограничения и последующие проверки
- Главная страница `https://florial-bg.com` открывается через доступный web-reader. Web-reader не предоставляет raw response headers и не выполняет безопасные POST-запросы к API; негативные проверки `/api/orders` и `/api/track` поэтому не выполнялись. Не создавать тестовые заказы/события в Production.
- Production build выдал warning о размере основного JS chunk: 789.57 kB до gzip / 201.36 kB gzip. Build успешен; code splitting — отдельная задача.
- CSP не включён до инвентаризации реальных внешних скриптов, изображений, шрифтов и API.
- Turnstile не включён: Cloudflare widget/sitekey/secret не настроены. При последующем внедрении хранить secret только в Cloudflare Pages secret, не в GitHub и не в клиентском bundle.
- Для полного закрытия аудита нужно проверить raw response headers и безопасные negative POST tests с заведомо неверным Origin без создания заказов/аналитических событий; отдельно выполнить проверку H1–H4 на страницах, затронутых изменениями от 05.11.2026.

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

## 2026-11-07 — Отключение Preview и стабилизация npm-сборки (PR #106)

- GitHub PR #106 `build: stabilize npm dependency installation` объединён методом squash; merge commit: `6cb33769641d91589772086bd9d78b1ada24bfa2`.
- Добавлены корневой `package-lock.json` и `studio/package-lock.json`, оба формата lockfileVersion 3. Lock-файлы сформированы в GitHub Actions из соответствующих `package.json`; исходные manifest-файлы не менялись.
- Добавлен корневой `.nvmrc` со значением `22`. Cloudflare build logs подтвердили Node.js `22.23.4` и npm `10.9.9`.
- В GitHub Actions `.github/workflows/blog-studio.yml`, `deploy-sanity-studio.yml`, `sanity-studio.yml`, `validate-d1-migration.yml` заменён `npm install` на `npm ci` в соответствующих корневых и Studio рабочих каталогах.
- Все три PR validation checks завершились `success`: D1 migration validation (npm ci, lint, Vite build, Pages Functions syntax); Sanity Studio validation (npm ci и build двух workspace); Blog and Studio validation (lint, unit tests, Vite build, syntax checks, read-only migration dry-run, Studio npm ci и build).
- Cloudflare Pages project `florial`: Production branch осталась `main`, Production deployments включены. Последний Preview deployment `bd5be887-9f69-4d29-b3b7-a005b012d28c` удалён; его alias относился только к ветке `fix/about-in-sitemap-2026-11-05`. Установка `preview_deployment_setting` изменена на `none`, поэтому новые Preview deployments автоматически не создаются. Старые исторические Preview deployments не удалялись массово.
- Cloudflare Pages build command изменена на `npm run build`; папка результата остаётся `dist`. Pages автоматически устанавливает зависимости до пользовательской build command. Build log deployment `1737c6de-8ab5-4180-9797-66a94e700a49` показал штатный install step `npm clean-install --progress=false`, но этот deployment был начат до обновления build command и затем выполнил старую пользовательскую команду. Поэтому он подтверждает успешную сборку merge commit, но **не является проверкой нового пользовательского build command**. Проверить новый command на следующем Production deployment.
- В build log остался предупреждающий duplicate object key `nipel-reduktiven-plastmasov-vanshna-rezba` в `src/lib/categorySeo.ts` (строки 184 и 211). Сборка успешна; код не менялся, предупреждение вынесено в отдельную задачу.
- Runtime-код сайта, Header, меню, Footer, корзина, checkout, D1 schema/data, Sanity schema/documents, заказы и секреты не менялись. Production deployment `1737c6de-8ab5-4180-9797-66a94e700a49` для commit `6cb33769641d91589772086bd9d78b1ada24bfa2` завершился `success`; это deployment merge commit до окончательной проверки новой build command.

### Открытые пункты после стабилизации

1. Подтвердить в следующем Production deployment, что Cloudflare использует пользовательскую команду `npm run build` после автоматического `npm clean-install`.
2. Отдельно решить, нужно ли удалять исторические Preview deployments; сейчас автоматическое создание новых Preview отключено.
3. Разобрать предупреждение duplicate key в `src/lib/categorySeo.ts` отдельным точечным изменением после проверки обоих значений и их назначения.
4. Legacy variable names в Cloudflare не удалялись. Supabase не использовать и не подключаться к нему; любой анализ старых упоминаний выполнять только статически в текущем GitHub source/config.

## 2026-11-07 — Read-only аудит GitHub, Cloudflare, D1 и Sanity (контрольная точка rev6)

- GitHub `main`: `730285f75d0ed049ab9b2ee210544eab5942d12d`; Cloudflare Pages Production deployment `ac8f035c-b4e7-4fc4-bc53-ec4e41329a42`, status `success`, deployed commit совпадает с main. Последние 10 Production deployments — success.
- С предыдущей контрольной точки `f40ab75e9cb5888891337e73b683aadde5e402d9` было 9 commits, все документационные; runtime-код не менялся.
- Sanity `production`: 275 products, 54 categories, 3 brands, 8 services, 22 blog posts. H1 BG/RU/EN заполнен у 82/275 products; BG Meta Title/Description — у 274/275. Это расходится с историческим snapshot rev5 (0 новых H1); источник заполнения 82 карточек НЕ ИЗВЕСТНО — нужно уточнить. Не запускать массовый apply автоматически. Category SEO 54/54 на BG/RU/EN.
- Sanity `plants`: 35 products, 17 categories; product SEO H1/Meta Title/Meta Description BG/RU/EN — 35/35. Portable Text descriptions BG 35/35, RU 34/35, EN 34/35. Отсутствующие переводы описания одной карточки не генерировать без решения владельца. Plant category SEO 17/17. Всего категорий 71/71.
- D1 database `5fbb0e47-8439-493c-821a-6945eef7d8b2`: фактический SQL catalogue содержит 11 application tables; применено 9 migrations `0001`–`0009`. Trigger `trg_orders_order_created` соответствует исправленной migration 0009. Сводные counts: orders 7 (3 non-test, 4 test), order_events 26, catalog_staff_profiles 2, catalog_submissions 8, catalog_stock_events 2, site_events 662. Non-test orders — 3 со статусом `new`; тестовые — `new`/`ready`. Один активный owner и один manager. Не читались персональные данные.
- Cloudflare D1 metadata API возвращает `num_tables=0`, хотя SQL catalogue показывает 11 application tables; для числа таблиц использовать SQL catalogue, а расхождение оставить как диагностическое.
- Legacy Supabase variable names всё ещё присутствуют в Cloudflare Production/Preview (включая `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`); значения секретов не раскрывались. Не удалять до полного статического аудита source, workflows и Cloudflare config и отдельного плана. Supabase не открывать и не использовать.
- Статический поиск в текущем repo не обнаружил активной Supabase SDK dependency, `src/lib/supabase.ts` или runtime references; текущий Sanity client — `src/lib/sanity.ts`, checkout/Manager работают через D1. Это не доказывает отсутствие косвенного/CI использования.
- Preview не эквивалентен Production: не обнаружены D1 binding `DB`, server secrets orders, Sanity API token, AI binding и Workflow service binding. Не копировать Production credentials в Preview; при необходимости проектировать изолированную тестовую среду.
- Pages build command: `rm -f package-lock.json && npm install && npx vite build`; корневой `package-lock.json` отсутствует. Текущая установка не фиксирует dependency graph. Воспроизводимость сборки требует отдельного плана; в рамках аудита pipeline не менялся.
- Все проверки были read-only. Код, настройки Cloudflare, D1 migrations/data, Sanity schemas/documents и Production не изменялись.

### Вопросы и отдельные задачи

1. Установить, каким процессом были заполнены H1 у 82 equipment products.
2. Завершить статический аудит legacy Supabase variable names в source, GitHub Actions и Cloudflare config; только затем рассматривать безопасное удаление переменных.
3. Решить, нужен ли изолированный Preview с отдельными D1/Sanity credentials и workflow bindings.
4. Отдельно диагностировать D1 metadata `num_tables=0`.
5. Подготовить отдельный план lockfile/build reproducibility.
6. Пометить старые документы с Supabase-инструкциями как исторический архив; не удалять их и не удалять migration files.
7. Live sitemap XML, фактическая индексация поисковиками и полный end-to-end Preview checkout этим аудитом не подтверждены: НЕ ИЗВЕСТНО — нужно уточнить.

## 2026-11-06 — Состояние SEO карточек растений после ручного заполнения

- Dataset Sanity `plants`: вручную подготовленные SEO-поля опубликованы для 35/35 карточек, на BG/RU/EN: корневые `seo.h1`, `seo.metaTitle`, `seo.metaDescription`; локализованные `translations.ru.seo.*` и `translations.en.seo.*`.
- Принцип ручного SEO: H1 — локализованное название и подтверждённый сорт/научное имя при необходимости, без географии и рекламных формул; Meta Title — название, одна разрешённая геолокация и бренд Florial, максимум 70 символов; Meta Description — коммерческая формулировка продажи, подтверждённая характеристика/применение, бренд и одна локация. BG/RU/EN — самостоятельные естественные локализации. Не использовать Созопол.
- Перед публикацией строковые поля `description` и `translations.*.description` преобразованы в Portable Text по существующему типу `richDescription` (обычный block + span). Исходный текст сохранён без редакторских изменений. Преобразованы только существовавшие строковые значения; отсутствующие RU/EN descriptions карточки «Маслина 3» не создавались.
- Published perspective подтвердил 35 карточек, полный набор SEO-полей на трёх языках, Meta Title до 70 символов и отсутствие черновиков этих документов. Это не меняло схему Sanity и не требовало frontend/Pages deployment.
- При последующих правках описаний растений использовать Portable Text структуру типа `richDescription`; не записывать строку напрямую в эти поля. Перед массовой публикацией проверять published perspective и сохранять исходные тексты при миграциях.

## 2026-11-06 — Сводная актуализация технической структуры и инструкции MD2 (rev5)

- Создана новая Library-редакция основной инструкции: `ИНСТРУКЦИЯ(2)_FLORIAL_АКТУАЛЬНАЯ_06-11-2026_rev5.md`. Предыдущая rev4 сохранена как историческая версия, не перезаписывалась.
- Главный актуальный источник структуры: этот файл `docs/TECHNICAL_PASSPORT.md`; журнал всех изменений: `CHANGELOG.md`; изменения схем Sanity: `studio/SCHEMA_CHANGELOG.md`.
- Репозиторий `omaraandrey-dev/florial`, branch `main`. Последний подтверждённый Production code deployment на контрольной точке: commit `f40ab75e9cb5888891337e73b683aadde5e402d9`, Cloudflare deployment `29bcf868-2447-4902-8f00-8a6158b696c7`, status success, aliases `https://florial-bg.com` и `https://www.florial-bg.com`. После синхронизации документов rev5 main commit `0e067562c14f4c24ee1b62e56ed6f77aa101d164` также прошёл Cloudflare Pages build/deploy: deployment `6231673f-cf91-4c73-9ca0-8ba5f93cbf26`, status success, те же production aliases. Этот последний commit содержит только документационные изменения; runtime-код не менялся.
- В Production опубликован единый product SEO код и schema для equipment (`production`) и plants (`plants`), BG/RU/EN. Sanity schema подтверждена read-only в обеих workspace. В Manager есть owner-only preview/apply, серверная запись защищена revision guard и явным подтверждением.
- Массовое заполнение новых product H1/Meta Title/Meta Description не выполнялось; документы Sanity не изменялись. Текущий этап заполнения — только после preview и отдельного подтверждения владельца.
- SEO категорий и локализованные helpBlock опубликованы для всех 71 категорий (54 equipment + 17 plants); 213 локализованных SEO-наборов BG/RU/EN подтверждены. Это отдельный процесс от product SEO.
- Внесены и задокументированы: локализованные title/ALT изображений категорий и полное отображение изображений через `object-contain`; единая структура заголовков главной и Footer; crawlable DOM бургерного меню после запуска React; локализованная About в sitemap; исправление BG noIndex источника для plant products.
- Ограничения проверки: live XML sitemap и фактическая переиндексация поисковиками не подтверждены. Наличие ссылок в DOM меню не означает их присутствие в исходном HTML до запуска JavaScript.
- Supabase остаётся полностью запрещённым для любых подключений и операций. Использовать только Cloudflare D1, Sanity, Pages Functions/Workers и Resend по их текущей роли.

---
## 2026-11-05 — Исправлен источник BG noIndex в plant sitemap query (main; Production deployed)

- В `functions/sitemap.xml.ts`, GROQ query `plantProducts`, болгарский флаг исключения URL из sitemap читается из корневого поля `seo.noIndex`. Это соответствует текущей модели данных товара и использованию SEO на публичной странице.
- RU/EN условия не менялись и продолжают читать локализованные `translations.ru.seo.noIndex` и `translations.en.seo.noIndex`.
- Изменение точечное: только источник поля в проекции sitemap. Никакие Sanity документы, товары, категории или другие данные не изменялись.
- Кодовый commit: `a6e0b33a09d181f59c2e1b6500199074964d193a`; CHANGELOG commit: `3b5795f23e5d9a52588cc8564a7d28aba155e0aa`.
- GitHub Actions run `42079947210` для итогового commit `d820577ed675f684d38b18b186e93d4fe5b4bb89` завершился `success`: Install dependencies, Lint, Build website и Syntax-check Pages Functions — все шаги успешны. Cloudflare Pages Production deployment `d435d877-77de-44ef-96eb-19fa1dcb797f` для этого commit завершился `success`; aliases включают `https://florial-bg.com` и `https://www.florial-bg.com`. Прямое чтение `https://florial-bg.com/sitemap.xml` доступным web-инструментом завершилось ошибкой доступа, поэтому фактическое содержимое live XML и количество URL НЕ ПОДТВЕРЖДЕНЫ.
- Тестового набора для sitemap в репозитории не обнаружено; имеющиеся unit tests покрывают product SEO и rich text utilities. Production deployment latest main подтверждён; фактическое содержимое live XML и количество URL остаются НЕ ПОДТВЕРЖДЕНЫ из-за ошибки чтения sitemap внешним инструментом.

## 2026-11-05 — Страница About добавлена в XML sitemap (main; Production deployed)

- В `functions/sitemap.xml.ts` в статический список включён маршрут `/about`.
- Используется существующий `addLocalizedUrls`: BG `/about`, RU `/about?lang=ru`, EN `/about?lang=en`; для вариантов генерируются hreflang alternates и x-default.
- Изменён только генератор sitemap. Страница About, маршрутизация приложения, Header, меню, Footer, Sanity, D1 и другие данные не менялись.
- Изменение внесено непосредственно в `main`: кодовый commit `8fb68fafb52a0d0fb582ddd99b6b185eacf4e391`; запись CHANGELOG — `b3688a7145722e558b500fdb7527add2b779ae91`.
- Production deployment подтверждён: latest main commit `f40ab75e9cb5888891337e73b683aadde5e402d9`, deployment `29bcf868-2447-4902-8f00-8a6158b696c7`, aliases `https://florial-bg.com` и `https://www.florial-bg.com`.
- PR #105 создан ошибочно в feature-ветке и не объединён; маршрут `/about` уже находится в main. Не объединять PR #105 как повтор без проверки его diff.
- Содержимое live XML и фактическое количество URL отдельно не подтверждены: доступный инструмент не смог прочитать `https://florial-bg.com/sitemap.xml`; требуется отдельная проверка HTTP/XML и hreflang.

## 2026-11-05 — Единый SEO-стандарт карточек товаров (PR #104 merged; Production deployed; массовое заполнение pending)

- Feature branch: `feature/product-seo-standard-2026-11-05`; изменения подготовлены отдельно от `main`. PR #104 объединён в `main` commit `4d1957f190f1676b1de688c376698043c3d1978e`. Cloudflare Pages Production deployment `22e6631b-af13-4818-97df-22317c83c816` завершился успешно; production aliases `https://florial-bg.com` и `https://www.florial-bg.com`.
- Стандарт действует для обоих каталогов: поливочное оборудование (`production`) и растения (`plants`), для языков BG/RU/EN.
- Meta Title: формат `Название товара | Геолокация | Градински център Флориал`; максимум 70 символов. Если полный бренд не помещается, используется короткое «Флориал» / «Florial». При необходимости длинное название сокращается только по границе целого слова; H1 и Meta Description сохраняют полное название.
- Meta Description начинается с сообщения о продаже (BG «Продажба на», RU «Продажа:», EN «For sale:»), включает краткую подтверждённую характеристику, локализованное название садового центра Florial и одну географическую привязку. География: Несебър, Равда, Слънчев бряг, Свети Влас, Поморие, Бургас, Ахелой, Каблешково, Кошарица. Созопол/Sozopol исключён из генератора.
- Добавлен отдельный тип Sanity `productSeoFields`: H1, Meta Title, Meta Description, noIndex и keywords. Он используется только в карточках товаров и их языковых версиях; общий `seoFields` других типов документов и `categorySeoFields` не изменяются. Поля растений `seo.title` и `seo.description` сохранены как скрытые legacy-поля; значения не удаляются и не перезаписываются.
- `src/lib/productSeo.mjs` — общий детерминированный генератор активных полей. Он сначала ищет разрешённую геолокацию в описаниях товара и существующих SEO-текстах, выбирает первое упоминание; если географии нет, распределяет города по стабильному порядку документов. В Meta Description удаляются дублирующие геофразы, но сохраняются характеристики товара; предложения с исключённым Созополом не переносятся. Переводы генерируются только там, где есть локализованное название товара.
- `src/pages/ProductPage.tsx` выводит заданный локализованный H1; до заполнения H1 используется название товара. Существующие plant SEO title/description остаются fallback для метатегов.
- `src/App.tsx` добавляет `seo` в проекцию plant product. `functions/_middleware.ts` выводит product H1 в серверном HTML до запуска React и сохраняет существующий fallback metaTitle/metaDescription.
- В Florial Manager добавлена вкладка «SEO товаров», доступная только роли owner. API `functions/api/manager/product-seo.ts` использует D1-backed Manager auth, читает опубликованные товары из Sanity и записывает активные поля партиями с `ifRevisionID`; `SANITY_API_TOKEN` используется только на сервере Cloudflare. Новых D1 migrations и разрешений не требуется.
- Сначала Manager показывает preview. Массовая запись выполняется только после отдельного нажатия владельцем и подтверждения в браузере; она заменяет текущие H1/Meta Title/Meta Description, но сохраняет legacy SEO растений, noIndex и keywords. Текущая разработка не записывала документы Sanity.
- Read-only проверка Content Lake до изменений: `production` — 275 товаров, у 274 были metaTitle/metaDescription, H1 отсутствовал у всех; `plants` — 35 товаров, у 34 были legacy title/description, новых metaTitle и H1 не было. EN/RU названия и краткие описания: equipment 275/275, plants 34/35.
- В каталоге оборудования есть названия длиной до 77 символов; для Meta Title генератор сохраняет модель/начало названия, сокращая хвост только по границе слова, если иначе невозможно уложиться в 70 символов. Полный H1 и Meta Description не сокращаются по этому правилу.
- Затронутые файлы: `src/lib/productSeo.mjs`, `src/lib/productSeo.d.ts`, `tests/product-seo.test.mjs`, `functions/api/manager/product-seo.ts`, `src/manager/ProductSeoManager.tsx`, `src/manager/ManagerApp.tsx`, `studio/schemaTypes/index.ts`, `src/types.ts`, `src/App.tsx`, `src/pages/ProductPage.tsx`, `functions/_middleware.ts`, `docs/TECHNICAL_PASSPORT.md`, `CHANGELOG.md`, `studio/SCHEMA_CHANGELOG.md`.
- CI: GitHub Actions workflow #437 успешно выполнил lint, unit tests, Vite build, Pages Functions syntax, read-only migration dry-run и Studio build; Sanity Studio validation workflow #100 успешно собрал обе workspace. D1 validation workflow #392 завершился успешно; D1 schema не менялась.
- Read-only `get_schema` после merge подтвердил `productSeoFields` в обоих активных workspace: dataset `production` / workspace `florial-admin` (schemaId `_.schemas.florial-admin`) и dataset `plants` / workspace `plants` (schemaId `_.schemas.plants`). В типе подтверждены `h1`, `metaTitle` с warning max 70, `metaDescription`, а legacy `title`/`description` сохранены hidden/readOnly. Используется существующая Studio; третья Studio не создавалась.
- Sanity documents не изменялись; массовая запись новых SEO-полей не запускалась.
- Read-only D1 check: `catalog_staff_profiles` содержит 1 активный `owner` и 1 активный `manager`; owner-only вкладка SEO доступна существующему владельцу.
- На этом этапе не затронуты Header, меню, Footer, категории, URL, sitemap, корзина, checkout, заказы и D1-схема. `productSeoFields` опубликован в обеих существующих workspace; подтверждены `h1`, `metaTitle`, `metaDescription`, `noIndex`, `keywords` и скрытые read-only legacy `title`/`description`. PR #104 объединён и Production deployment выполнен. Документы Sanity не изменялись; массовая генерация/запись новых SEO-полей остаётся отдельным действием владельца через Manager после preview и явного подтверждения.
- Read-only контрольная точка до массового заполнения: `production` — 275 товаров, `plants` — 35. Старые metaTitle/metaDescription имелись у 274/275 товаров оборудования; legacy title/description — у 34/35 растений. RU/EN локализованные названия и shortDescription доступны у 275/275 equipment и 34/35 plants. H1 не заполнены; массовая запись не выполнялась.

## 2026-11-05 — Семантическая иерархия заголовков главной страницы и Footer

- На главной странице сохранять иерархию: H1 — главный заголовок сайта; H2 — подзаголовок о профессиональном ландшафтном дизайне, растениях и поливной технике; H3 — «Профессионални решения за градината», «Растения за вашата градина», «Продажба на поливно оборудване» и «Блог и портфолио».
- Под заголовками секций H3 использовать H4 для карточек категорий растений, категорий оборудования и заголовков отдельных публикаций блога. Категории оборудования уже размечены H4 и должны оставаться H4.
- Заголовки карточек услуг в секции «Профессионални решения за градината» остаются H4.
- Общий Footer отображается на всех страницах: «За нас» — H2; «Контакти» и заголовок социальных сетей («Последвайте ни» / локализованные варианты) — H3. Заголовок верхнего CTA-блока контактов остаётся H3.
- При локализации BG/RU/EN менять только текст, не уровень заголовка. Не использовать уровни заголовков ради размера шрифта; визуальный размер задаётся CSS-классами.
- Это семантическая правка HTML без изменения внешнего вида, текста, порядка блоков, ссылок, стилей, меню, Header или данных Sanity.

## 2026-11-05 — SEO-доступность ссылок бургерного меню

- В `src/components/Header.tsx` основная навигация и панели четырёх групп («Растения», «Поливни системи», «Услуги», «Портфолио») должны постоянно присутствовать в React DOM после монтирования Header; не оборачивать их в условный рендеринг по `isMenuOpen` или состояниям раскрытия групп.
- Видимость меню и каждой панели управляется нативным атрибутом `hidden`, а интерактивное состояние остаётся управляемым существующими React state. Это сохраняет закрытый вид меню, не меняет дизайн и позволяет анализаторам DOM находить ссылки без клика по бургеру и аккордеонам.
- Для кнопки бургера и кнопок групп используются согласованные `aria-controls` и стабильные ID соответствующих контейнеров; `aria-expanded` отражает реальное состояние. Ссылки остаются обычными `<a href>` с текущими обработчиками SPA-навигации.
- Не менять порядок, подписи, маршруты, правила сортировки, локализацию `localizedHref` (BG без параметра, RU/EN с `?lang=ru` / `?lang=en`), обработчики переходов и визуальные классы при последующем расширении меню.
- Категории, услуги и последние публикации загружаются динамически; ссылки появляются после получения соответствующих данных. При проверке дождаться загрузки Sanity-категорий/услуг и списка публикаций, затем проверять DOM до открытия меню.
- Важно: Florial использует клиентский React SPA. Это изменение обеспечивает наличие ссылок в DOM после выполнения React-кода, но не добавляет навигацию в исходный серверный HTML до запуска JavaScript. Для требования доступности ссылок в сыром HTML без JS потребуется отдельная архитектурная задача SSR/prerender; не решать её в рамках правки Header.
- При проверке всех локалей использовать BG, RU и EN; проверить DOM до клика, видимость/раскрытие меню, клавиатурную доступность, обычные и модифицированные клики, а также сохранение адресов ссылок.
- Область изменения: только `src/components/Header.tsx`, `docs/TECHNICAL_PASSPORT.md` и `CHANGELOG.md`. Не менялись Header CSS, Footer, App routing, Sanity, Cloudflare D1, middleware, sitemap, товары или данные.
- Проверка Cloudflare Pages Preview для commit `f481c6eac45ffec184116e24d48884204ed33168`: build и deploy завершились успешно; Preview URL `https://480e6a1c.florial.pages.dev` (deployment `480e6a1c-7f1b-451a-88cb-1db8159487fe`).
- После ожидания загрузки данных HTML/DOM Preview содержал 45 ссылок внутри nav до открытия меню: 17 plant-category, 11 irrigation-category, 10 service, 4 blog, плюс Начало/За нас/Контакти. Проверка повторена для BG/RU/EN: HTTP 200 и 45/45 ссылок на каждой версии; все RU-ссылки имеют `?lang=ru`, все EN-ссылки — `?lang=en`, BG-ссылки без языкового параметра.
- Первая Preview-сборка выявила лишний закрывающий JSX `div`; ошибка исправлена в commit `f481c6e`, после чего Preview build/deploy прошли успешно. Локальные `npm run lint` и `npm test` отдельно не запускались; Cloudflare Pages build command выполнял `npm install` и `npx vite build`.
 
## 2026-11-05 — SEO категорий и Manager (PR #92 merged; Production deployed; редакционные данные опубликованы)

- Feature branch: `feature/category-seo-generator-manager-2026-11-05`.
- Общий модуль `src/lib/categorySeo.ts` формирует предложения H1, Meta Title и Meta Description для BG/RU/EN. Для болгарского Meta Title используется бренд «Флориал», для RU/EN — «Florial». Словарь включает реальные slug категорий из Sanity: 54 категории оборудования в dataset `production` и 17 категорий растений в dataset `plants`.
- Функция `resolveCategorySeo` выбирает только утверждённые live SEO-поля; предложения `suggested` не используются на публичных страницах до отдельного утверждения.
- `CategoryPage.tsx` и `functions/_middleware.ts` используют общий resolver, поэтому React DOM и серверный HTML показывают один и тот же утверждённый H1/Meta Title/Meta Description. URL, canonical и hreflang-логика не меняются.
- Manager получает вкладку «Категории» и два режима: `all` — обновить предложения для всех категорий; `missing` — создать только те поля, где одновременно пусты утверждённое значение и сохранённое предложение.
- `functions/api/manager/category-seo.ts` обрабатывает по четыре категории за запрос, читает опубликованные категории из двух Sanity datasets и записывает только вложенные поля `seo.suggested` / `translations.ru.seo.suggested` / `translations.en.seo.suggested`. Для записи используется `SANITY_API_TOKEN` только на сервере Cloudflare и `ifRevisionID` для защиты от параллельного изменения документа.
- Добавлено разрешение `canManageCategorySeo` в серверный список разрешений и интерфейс назначения прав. Владелец имеет полный доступ; менеджер — только после назначения права; продавец не получает это право. D1 schema migration не нужна.
- Генератор первой версии — детерминированный локальный словарь/правила, не внешний AI API. Подтверждённая конфигурация AI binding для SEO не обнаружена; платные интеграции не добавлялись.
- Read-only запрос Sanity подтвердил: dataset `production` — 54 категории; dataset `plants` — 17 категорий. Никакие документы Sanity не записывались этим этапом.
- Предложения просматриваются и редактируются в Sanity Studio (`https://florial-admin-bg.sanity.studio/`) в объекте `seo.suggested` для каждой языковой версии. После проверки редактор вручную переносит одобренные значения в активные поля `h1`, `metaTitle`, `metaDescription`; изменение `suggested.status` само по себе не публикует SEO. Публичный сайт использует только активные поля.
- В Manager заголовок раздела локализован на болгарский: «Работа с категории».
- CI (lint, tests, website build, Pages Functions syntax, migration dry-run и Studio build) и Cloudflare Pages Preview завершились успешно. PR #92 объединён в `main`; код включён в Production deployment `29bcf868-2447-4902-8f00-8a6158b696c7` для commit `f40ab75e9cb5888891337e73b683aadde5e402d9`.
- Редакционные SEO-данные опубликованы для всех 71 категорий: 54 оборудования и 17 растений, 213 наборов BG/RU/EN с H1, Meta Title, Meta Description и keywords. Переиндексация Google и отдельный live HTML audit не подтверждены.
- Не затронуты Header, меню, Footer, маршруты, каталог, товары, цены, корзина, checkout и Cloudflare D1 данные.

## 2026-11-05 — Публикация схемы SEO категорий

- PR #91 объединён в main, merge commit: `64249cdf595f2bb9b9ca25bbe0b35ba8f8f41eae`.
- Существующая Studio опубликована штатным GitHub Actions workflow `.github/workflows/deploy-sanity-studio.yml` с помощью Sanity CLI и настроенного в `studio/sanity.cli.ts` appId.
- Workflow завершился успешно; CLI подтвердил публикацию обеих рабочих областей: `Deployed 2/2 schemas`, затем `Success! Studio deployed`.
- Действующий URL: https://florial-admin-bg.sanity.studio/
- `categorySeoFields` проверен через Sanity schema API в dataset `production` и dataset `plants`. Общий `seoFields` товаров и услуг сохранён без изменений.
- Публикация схемы не записывала и не мигрировала документы Sanity. Значения H1/Meta Title/Meta Description для категорий пока не генерировались и не заполнялись.
- `.github/workflows/sanity-studio.yml` выполняет только валидацию/сборку; production deployment остаётся в единственном штатном `deploy-sanity-studio.yml`.

## 2026-11-05 — Единая схема SEO категорий (этап 1)

- Добавлен отдельный тип `categorySeoFields`, используемый только категориями оборудования в dataset `production` и категориями растений в dataset `plants`. Общий `seoFields` для товаров, услуг и других документов не менялся.
- Для каждой языковой версии категории предусмотрены утверждаемые поля `h1`, `metaTitle`, `metaDescription`; сохранены существующие `noIndex` и `keywords`.
- Добавлен отдельный объект `suggested` для чернового предложения: H1, Meta Title, Meta Description, дата генерации, версия генератора и статус `needsReview/approved`. Предложения не подменяют действующие SEO-поля.
- Схема аддитивная по структуре данных: документы Sanity не мигрировались и не записывались. Публикация Studio и массовое заполнение категорий не выполнялись.
- Для этой проверки в `.github/workflows/sanity-studio.yml` добавлена валидация сборки Studio при открытии/обновлении PR в `main`; workflow только собирает обе Studio и не выполняет deployment.
- Не затронуты frontend, middleware, URL категорий, Header, меню, Footer, каталог товаров, корзина, checkout и Cloudflare D1.


## 2026-11-05 — Корневое SEO для категорий растений (BG)

- Для Sanity dataset plants в schema plant category добавлено корневое поле seo типа seoFields, чтобы редактор мог задавать SEO болгарской страницы. SEO английской и русской версий по-прежнему хранится в translations.en.seo и translations.ru.seo.
- GROQ-запрос plantCategoryQuery выбирает root seo; CategoryPage уже выбирает root SEO для BG и локальный SEO-объект для EN/RU. Существующие документы не менялись и не мигрировались.

## 2026-11-05 — Метаданные изображений категорий и локализованный SEO

- Для двух типов Sanity category (оборудование в dataset production и растения в dataset plants) в исходной Studio schema добавлены image.title/titleEn/titleRu. Поля image.alt/altEn/altRu сохранены; другие типы изображений не расширялись.
- Frontend GROQ projections передают шесть локализованных полей изображения в CategoryItem. Общий helper src/lib/categoryImageSeo.ts выбирает значение текущего языка: ALT использует редакторское значение или локализованное имя категории; title остаётся пустым, пока редактор его не заполнит.
- Homepage category cards и subcategory cards используют локализованные ALT/title. Для внешнего URL изображения категории растений метаданные по-прежнему задаются в объекте image документа категории.
- CategoryPage использует root SEO для BG и translations.en/ru.seo для EN/RU; noIndex также берётся из SEO объекта выбранной локали. В последующем дополнении для plant categories добавлено корневое поле seo, поэтому BG-страницы растений также могут иметь полноценные редакторские meta title/description и noIndex.
- Изменение кода не записывает документы Sanity. После merge требуется проверить workflow публикации существующей Studio и deployed schema обоих datasets. Не запускать массовое заполнение ALT/title без отдельного решения владельца.
- Не затронуты Header, меню, Footer, каталог товаров, корзина, checkout, D1 и заказы. Файл ИНСТРУКЦИЯ(2).md в корне GitHub main отсутствует; использован актуальный docs/TECHNICAL_PASSPORT.md.
## 2026-11-04 — Уточнение имени типа документа Sanity для растений

- Read-only get_schema для dataset plants подтвердил, что зарегистрированный тип документа — product, а не plantProduct. Имя plantProduct в исходнике является названием переменной схемы, не значением _type.
- Скрипт миграции скорректирован: _type == product для dataset production и dataset plants. Никакие Sanity документы не записывались; dry-run не запускает mutations.

## 2026-11-04 — Уточнение совместимости richDescription и Studio preview

- В production schema для product.translations.en/ru.description сохранён legacy тип text; новое Portable Text поле называется formattedDescription. Существующие опубликованные документы и drafts с RU/EN строками остаются валидными без миграции.
- src/pages/ProductPage.tsx сначала использует translations[language].formattedDescription, затем обычный локализованный description, обеспечивая постепенное заполнение нового поля.
- В plants workspace schema тип документа также называется product; поле product.translations.bg/ru/en.description остаётся richDescription. Миграционный скрипт использует _type == "product" для обоих datasets.
- Для production migration пишет Portable Text только в translations.en/ru.formattedDescription и не перезаписывает исходные legacy strings. Для plants она преобразует legacy strings в существующие richDescription fields. Dry-run остаётся режимом по умолчанию; live write требует отдельного подтверждения владельца, экспорта backup и флагов скрипта.
- kitComponent preview schema явно выбирает product._ref, quantity, unit; preview component читает их из верхнеуровневых selected props. Значение quantity в документе не изменяется.
- На момент этого коммита исправленная схема ещё не опубликована. Публикация будет выполнена отдельно в уже существующее Studio florial-admin-bg после успешных CI/build и проверки целевой конфигурации.
- Никакие Sanity документы/assets, цены, D1 records или заказы не изменялись. PR #85 остаётся отдельной feature branch; main и production storefront не меняются.

## 2026-11-04 — Sanity: форматированные описания и состав готовых комплектов

- В `studio/schemaTypes/index.ts` добавлен общий тип `richDescription` для описаний оборудования и растений; корневые BG-описания и локализованные RU/EN (а для растений BG/RU/EN) поля используют Portable Text. Старые значения в документах не мигрированы и продолжают поддерживаться frontend-кодом.
- Для оборудования добавлено необязательное `product.kitComponents`: ссылка на обычный товар, положительное дробное quantity, единица `pcs` или `m`, заметка BG/RU/EN. Поле Studio скрывается вне категории готовых комплектов.
- 04.11.2026 опубликованы обе схемы через GitHub Actions run `41837585278` в существующее Studio `florial-admin-bg` (App ID `fdy0ldwl717qtp5pikl7715l`). Sanity schema API после публикации подтвердил `kitComponents` в `production` и `richDescription` в обоих workspace.
- Никакие Sanity документы/assets/цены не записывались и не удалялись. Миграция описаний оставлена на отдельный этап с экспортом backup, dry-run и отдельным разрешением владельца.
- Frontend-код проверен владельцем на Cloudflare Preview, но PR #85 ещё не объединён в `main`. Для включения новой логики на `florial-bg.com` требуется отдельное согласование merge/production deployment.
- PR: https://github.com/omaraandrey-dev/florial/pull/85. Studio deployment run: https://github.com/omaraandrey-dev/florial/actions/runs/41837585278.

## 2026-11-04 — Компактная desktop-шапка (PR в проверке)

- В отдельной ветке `fix/desktop-header-compact-2026-11-04` подготовлена точечная настройка только для viewport шириной от 1025 px.
- Desktop header row: min-height 72 px, vertical padding 6 px; логотип 64 px с автоматической шириной и сохранением пропорций.
- Поисковый контейнер — 42 px; корзина и кнопка меню — 40 px; иконки корзины/меню — 20 px. Текстовый вариант логотипа также уменьшается.
- Сохранены существующий grid-порядок элементов, поиск, корзина, меню и sticky header. CSS-правила мобильной портретной и альбомной ориентации не меняются; Footer, Sanity, Cloudflare D1 и API не затрагиваются.
- PR/Preview и production deployment: ожидаются. Ручная визуальная проверка владельцем ещё не выполнена.

---

> **Дополнение от 04.11.2026 — Manager: редактирование состава заказа и документы (feature branch, ещё не опубликовано).**
>
> - Внутренняя форма Manager позволяет удалить позицию вводом количества 0 или кнопкой удаления; сервер сохраняет только позиции с количеством 1–999 и не допускает полностью пустой заказ.
> - Изменения состава пишутся в существующую D1 таблицу `order_events`: добавление/удаление позиции, изменение количества и цены. Для добавления/удаления сохраняется snapshot товара в metadata события. Для изменения цены/количества сохраняются старое и новое значения.
> - Добавлен защищённый Sanity search endpoint для добавления оборудования из dataset `production` и растений из dataset `plants`; растения выбираются на уровне конкретного варианта `saleVariants`. Сохранённые позиции заказа содержат snapshot наименования/SKU/варианта/цены, поэтому изменения каталога не должны менять историческую цену заказа.
> - Добавлен Manager endpoint для скачивания PDF, отправки обновлённого состава клиенту без PDF-вложения и отправки PDF на `ORDER_NOTIFICATION_EMAIL`. PDF/Resend helpers вынесены в общий серверный модуль `functions/api/_lib/order-documents.ts`, который повторно используется checkout.
> - Источник истины денежных сумм остаётся в D1 cent fields; миграция не нужна, так как `order_events` уже существует в Production.
> - Feature branch: `feature/manager-order-editing-documents-2026-11-04`. Код ещё требует автоматической сборки/проверок, ручной проверки на тестовом заказе и согласования перед merge/deploy. Production и реальные заказы не изменялись.
> - Не меняются Header, меню, Footer, публичный каталог и обычный checkout.
>
> ---
>
> **Дополнение от 04.11.2026 — SEO-защита внутренней панели Manager.**
>
> - В `functions/_middleware.ts` для `/manager` и всех вложенных маршрутов сохранён Cloudflare Pages SPA fallback, но ответ теперь получает `X-Robots-Tag: noindex, nofollow, noarchive`.
> - Для HTML Manager серверно устанавливается/заменяется `<meta name="robots" content="noindex, nofollow, noarchive">` до запуска клиентского JavaScript. Защита действует также при отключённом JavaScript за счёт HTTP-заголовка.
> - `public/robots.txt` оставлен без запрета обхода: `Allow: /`. Это намеренно — поисковый робот должен иметь возможность получить noindex. Публичные страницы и общий `index.html` не менялись.
> - `functions/sitemap.xml.ts` формирует карту сайта из опубликованных документов Sanity (категории, товары, услуги, статьи); `/manager` не является источником sitemap.
> - Проверен `functions/api/manager/orders.ts`: чтение/изменение заказов требует `requireUser`, активную D1-сессию и соответствующее разрешение. `functions/api/manager/_lib.ts` проверяет cookie-сессию `florial_manager_session` по хешу в D1.
> - Важно: `noindex` управляет поисковой индексацией, но не защищает данные. Доступ к панели и API обеспечивается серверной авторизацией и проверками разрешений.
> - Изменение ограничено middleware и документацией. Header, меню, Footer, публичный `index.html`, `robots.txt`, sitemap-генератор, Sanity и данные Cloudflare D1 не менялись.
>
---

> **АКТУАЛЬНОЕ СОСТОЯНИЕ НА 03.11.2026 — ИСПОЛЬЗОВАТЬ В ПЕРВУЮ ОЧЕРЕДЬ.** Рабочая архитектура Florial: GitHub `omaraandrey-dev/florial` (ветка `main`) + Cloudflare Pages/Functions + Cloudflare D1 для серверных данных/заказов/сотрудников/аудита + Sanity для каталога и контента. **Supabase полностью исключён из текущей архитектуры: не использовать, не подключать, не читать и не записывать.** Все более старые упоминания Supabase ниже — только исторические записи предыдущей реализации, они не являются инструкциями для текущей разработки. Текущие подтверждённые сведения по панели Manager и релизу от 03.11.2026 приведены сразу ниже.

## Текущая контрольная точка — Manager plant workspaces + stock control (03.11.2026)

- PR #73 объединён в `main`; squash commit: `a07d0e54240b9ac86df51925e2988d35bb3e4f0a`. GitHub Actions validation checks завершились успешно.
- Production Cloudflare Pages deployment: `a70924e3-3e85-43a6-a2e5-e1b70ffa9ea6` (short ID `a70924e3`), build и deploy stages — success; aliases включают `https://florial-bg.com` и `https://www.florial-bg.com`.
- Production Cloudflare D1 migration `0007_plant_stock_events` применена. Проверено наличие migration marker и таблицы `catalog_stock_events`. Migration additive; существующие профили сотрудников не удалялись.
- В `catalog_staff_profiles.permissions` добавлено `canEditPlantStock`; для существующих профилей значение по умолчанию — `false`. Новые сотрудники также получают все разрешения выключенными, если владелец явно не назначит их.
- Read-only проверка Production D1 после релиза показала: активный профиль manager имеет `canEditPlantStock=true`; профиль owner имеет `false`, но owner bypass сохраняет полный доступ независимо от этого флага. Идентификаторы сотрудников в документацию не записываются.
- Owner всегда имеет полный доступ. Менеджер/продавец может менять количество растений только при явном `canEditPlantStock=true`, назначенном владельцем. Не-owner не может самостоятельно выдавать это право другим.
- В Manager есть отдельное рабочее действие изменения количества растений. Каталог поддерживает поиск по имени, латинскому имени и SKU, включая SKU вариантов, а также фильтры категории/подкатегории. Каждый `saleVariants` вариант отображается отдельной строкой со своим остатком; растение без вариантов использует общий `stockQuantity`.
- После выбора растения/варианта каталог скрывается; сотрудник вводит абсолютное целое неотрицательное количество. Запись выполняется напрямую в соответствующий Sanity document без approval workflow.
- Сервер проверяет разрешение, валидирует количество и использует Sanity `_rev` / `ifRevisionID` для защиты от параллельных изменений. Конфликт revision возвращается как conflict, а не перезаписывает чужое изменение.
- D1 audit table `catalog_stock_events` хранит инициатора, растение, SKU/вариант, старое/новое количество, результат `pending/success/failed`, ошибку и временные отметки. Если Sanity update завершился, но аудит не удалось финализировать, UI должен показывать pending audit, а не ложное подтверждение полного успеха.
- Sanity project: `bxvcy0qs`; plant dataset: `plants`. Существующие Sanity документы/товары в рамках PR #73 не редактировались; Sanity schema не менялась.
- Изменения ограничены внутренней Manager UI/API, разрешениями и D1 audit migration. Публичные Header, меню, Footer, каталогные страницы, корзина, checkout и существующие заказы не менялись.
- Владелец сообщил после публикации, что панель «вроде бы всё работает». Это пользовательская первичная проверка, но не следует представлять её как полную формальную матрицу тестов всех ролей, всех ошибок и параллельных revision-конфликтов.

### Ключевые файлы изменения остатков
- `src/manager/ManagerApp.tsx` — отдельная кнопка/workspace и отображение доступных действий по правам.
- `src/manager/PlantStockChangeForm.tsx` — поиск, фильтры, выбор растения/варианта и форма абсолютного количества.
- `functions/api/manager/plant-catalog.ts` — GET каталога и защищённый `action: updateStock`, Sanity revision check и D1 audit.
- `functions/api/manager/_lib.ts` — permission key и серверная модель разрешений.
- `functions/api/manager/staff.ts` — безопасные defaults и owner-only управление новым разрешением.
- `functions/api/manager/auth/bootstrap.ts` — owner bootstrap access.
- `functions/migrations/0007_plant_stock_events.sql` — additive D1 migration.
- `CHANGELOG.md` — история изменений и production rollout.

### Правила для последующей работы
1. Перед изменениями сверять актуальный GitHub `main`, релевантные файлы и нужные данные Cloudflare D1/Sanity read-only.
2. Текущая серверная база — Cloudflare D1. **Не использовать Supabase ни для новых функций, ни как fallback.** Если старый код/документ ссылается на Supabase, сначала выяснить, является ли это ещё активным путём; не восстанавливать его автоматически.
3. Каталог растений и оборудования остаётся в Sanity. Не менять документы/товары и не выполнять массовые операции без отдельного согласования.
4. Не менять Header, меню, Footer, глобальную навигацию, публичные страницы, корзину или checkout без предварительного подробного плана и согласия владельца.
5. Не удалять/перезаписывать production D1 или Sanity данные без явного согласия. Не раскрывать секреты и не помещать их в клиентский код или Git.
6. После существенных изменений обновлять `CHANGELOG.md` и этот технический паспорт; schema changes Sanity дополнительно фиксировать в `studio/SCHEMA_CHANGELOG.md`.
7. Успешная сборка/деплой не равны полной ручной приёмке. Чётко различать автоматические проверки, состояние production и тесты, выполненные владельцем.

---


# Florial — технический паспорт
## Контрольная точка: 01.11.2026, после PR #36 и сквозной проверки заказа

> Этот документ фиксирует архитектуру и подтверждённые состояния. Перед каждой задачей сверять актуальный `main`, код и относящиеся к задаче данные Sanity/Supabase/Cloudflare. Различать проверку кода, статус инфраструктуры и ручную проверку владельцем.

## 1. Проект и архитектура

- Сайт: https://florial-bg.com (основной домен).
- Репозиторий: https://github.com/omaraandrey-dev/florial; основная ветка: `main`.
- Frontend: React + TypeScript + Vite + Tailwind CSS.
- CMS и каталог: Sanity project `bxvcy0qs`; dataset `production` для оборудования, категорий, брендов, услуг, блога и основного контента; dataset `plants` для растений.
- Заказы: Supabase project ref `shzbflgqfffgzzgpwjxt`; запись заказов выполняется серверной Cloudflare Pages Function, не клиентским приложением.
- Hosting и серверные функции: Cloudflare Pages project `florial`.
- Не использовать Wix или Lovable как основу проекта.
- Header, menu, footer и глобальную навигацию не менять без предварительного плана и согласия владельца.

## 2. Sanity Studio

- Studio URL: https://florial-admin-bg.sanity.studio/
- Workspace `florial-admin` использует dataset `production`; workspace `plants` использует dataset `plants`.
- Sanity project ID: `bxvcy0qs`.
- Зарегистрированная Studio ID, подтверждённая ранее Sanity API: `fdy0ldwl717qtp5pikl7715l`.
- Схемы: `studio/schemaTypes/index.ts`; конфигурация workspace: `studio/sanity.config.ts`.
- Для любых schema changes дополнительно вести `studio/SCHEMA_CHANGELOG.md`. PR #36 схем Sanity не менял.

## 3. Корзина и каталог растений

### Коммерческие варианты растений (PR #34)
- PR #34: https://github.com/omaraandrey-dev/florial/pull/34
- Merge commit: `e112825c5f1e4b8e9c4172c2dff085d88b1b928e`.
- В dataset `plants` поддерживаются `plantSaleVariant` и массив `plantProduct.saleVariants` (до 30 вариантов).
- Поля варианта: локализованные названия BG/RU/EN, SKU, высота продажи, объём контейнера, цена/старая цена EUR, статус наличия и количество.
- Старые корневые поля цены растения не считать подтверждённой ценой продажи без проверки конкретного документа и варианта.

### Добавление растений в общую корзину (PR #36)
- PR: https://github.com/omaraandrey-dev/florial/pull/36
- Merge commit в `main`: `6bc3ee305cc1f50a23d3df036cf628af54704556`.
- Production deployment Cloudflare Pages: `1ae5a537-6628-4ce0-bf02-97171a5df490`; URL deployment: https://1ae5a537.florial.pages.dev; aliases включают https://florial-bg.com и https://www.florial-bg.com.
- На странице растения сохранена существующая WhatsApp-заявка; под ней добавлена кнопка добавления выбранного варианта в общую корзину.
- Строки растений в корзине различаются по product ID и ключу sale variant; разные варианты одного растения не объединяются. Оборудование сохраняет прежнюю идентификацию строк.
- Для растения в корзине показываются вариант, высота, объём контейнера и цена выбранного варианта.
- Корзина с растениями предлагает самовывоз либо индивидуальное согласование доставки с Florial. Для смешанной корзины (оборудование + растения) доставка также согласовывается индивидуально. Корзина только с оборудованием сохраняет существующие способы доставки и тарифы.
- В payload заказа для позиции передаются catalog (`production` или `plants`) и `variantKey`, когда применимо.

## 4. Оформление заказа — серверный процесс

- Клиентский код: `src/pages/CartPage.tsx`, `src/services/orderService.ts`.
- Endpoint: `POST /api/orders`, Cloudflare Pages Function в `functions/api/orders.ts`.
- Сервер повторно получает товарные данные из Sanity. Оборудование проверяется в dataset `production`; растения — в `plants` с проверкой конкретного `saleVariants[_key == variantKey]`.
- Сервер не доверяет клиентской цене: проверяет цену и доступность по Sanity и сравнивает с ожидаемой ценой из корзины.
- Заказ записывается в существующую таблицу Supabase `public.orders`; состав заказа хранится в JSONB `items`. PR #36 не требовал миграции схемы Supabase.
- Генерируется номер вида `FL-YYYYMMDD-XXXXXX`.
- Растительные позиции сохраняют метаданные варианта (ключ, название, высота, объём контейнера и SKU) в составе заказа.
- PDF — проформа/подтверждение заказа, не налоговая фактура. Для растений с индивидуальной доставкой в документе указывается, что доставка будет уточнена.
- Письма отправляются через Resend; серверные настройки включают `RESEND_API_KEY`, `EMAIL_FROM`, `ORDER_NOTIFICATION_EMAIL`, а PDF может использовать `PROFORMA_FONT_URL`. Значения секретов не документировать и не публиковать.
- Критические серверные переменные Supabase: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. Секреты должны быть только в Cloudflare server environment, не в клиентском коде.
- Отправка email в текущем коде best-effort после сохранения заказа: сбой почтового провайдера не отменяет сохранённый заказ. Ошибки отправки логируются сервером.

## 5. Подтверждённая сквозная проверка production — 01.11.2026

Владелец сайта вручную сообщил, что после публикации PR #36 проверил оформление заказов на нескольких языках:
- заказ оформляется успешно на болгарском, русском и английском;
- PDF-файл формируется;
- письмо приходит на административный адрес;
- письмо с подтверждением приходит клиенту.

Это подтверждение владельца по реальному production-тестированию. Не записывать тестовые персональные данные, email клиентов или номера заказов в документацию.
Успешная проверка относится к состоянию сайта после PR #36 и deployment `1ae5a537-6628-4ce0-bf02-97171a5df490`.

## 6. Переменные окружения и безопасность

- Все секреты — только в Cloudflare Pages Functions environment/secrets.
- Не выводить, не копировать в Git и не передавать в frontend значения Supabase service key, Resend API key или Sanity tokens.
- Для Production ранее были настроены `SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY`. Preview environment ранее не имел этих двух переменных, поэтому checkout на Preview возвращал сообщение о не настроенном сервере заказов. Production test был выбран вместо Preview и успешно завершён владельцем.
- Не считать Preview checkout настроенным, пока отдельно не проверены Preview environment variables и безопасная тестовая БД.
- Не отправлять тестовый заказ на production без явного разрешения владельца: это создаёт реальную запись заказа.

## 7. Ключевые файлы

- `src/App.tsx` — приложение и URL-навигация.
- `src/lib/sanity.ts` — клиент Sanity.
- `src/lib/supabase.ts` — клиент Supabase (не использовать для обхода серверной проверки заказа).
- `src/pages/ProductPage.tsx` — карточка товара/растения.
- `src/pages/CartPage.tsx` — корзина и checkout.
- `src/services/orderService.ts` — отправка заказа.
- `functions/api/orders.ts` — серверная проверка и сохранение заказа, PDF и email.
- `studio/schemaTypes/index.ts` — схемы Sanity.
- `CHANGELOG.md` — история изменений.
- `studio/SCHEMA_CHANGELOG.md` — история схем Sanity.

## 8. Рабочие правила

1. Перед изменениями сверять актуальные файлы GitHub и необходимые данные Sanity/Supabase.
2. Не выдумывать идентификаторы, пути, функции, настройки, статусы и содержимое баз.
3. Не удалять и не перезаписывать данные Sanity/Supabase без отдельного явного подтверждения.
4. Не менять header, menu, footer или глобальную навигацию без предварительного подробного плана и согласия.
5. По текущему указанию владельца изменения сайта вносить непосредственно в `main`; не создавать feature/preview branches и не публиковать Preview. Перед каждым commit сверять актуальный HEAD `main`; после изменений запускать релевантные проверки/build и подтверждать production deployment отдельно.
6. Не считать успешную сборку доказательством сквозной работы production. Ручные проверки фиксировать отдельно с указанием кто/что проверил.
7. После существенных изменений обновлять `CHANGELOG.md`; при изменениях схем — также `studio/SCHEMA_CHANGELOG.md`.
8. Не раскрывать секреты. Не создавать production-заказы для теста без явного разрешения.
9. Основной рынок — Болгария; основной язык BG, дополнительные RU/EN; валюта EUR; цены каталога включают ДДС согласно настройке товара.
10. Не переводить проект на Wix или Lovable.

## 9. Открытые вопросы / НЕ ИЗВЕСТНО — нужно уточнить

- Preview checkout: нужны ли отдельные Preview secrets и отдельный тестовый Supabase project; до этого Preview checkout считать не подтверждённым.
- Econt и другие автоматические интеграции доставки: наличие действующей интеграции и тарифного расчёта не подтверждено этим релизом.
- Платёжные онлайн-шлюзы: фактическая интеграция и статус не подтверждены.
- Полная проверка резервного копирования и восстановления Sanity/Supabase остаётся отдельной задачей.
- Успешный заказ, PDF и email проверены владельцем вручную; мониторинг доставки писем и автоматические повторные попытки отправки в рамках PR #36 не добавлялись.

## Журнал контрольных точек

### 01.11.2026 — PR #36: растения в общей корзине и успешный production checkout
- Объединён PR #36, merge commit `6bc3ee305cc1f50a23d3df036cf628af54704556`.
- Cloudflare Pages production deployment `1ae5a537-6628-4ce0-bf02-97171a5df490` завершён успешно.
- Добавлена покупка выбранного варианта растения через общую корзину без нарушения прежней логики оборудования.
- Серверная функция валидирует растения и варианты по dataset `plants`, оборудование — по `production`; сохраняет состав в существующий Supabase orders JSONB.
- Владелец подтвердил production checkout на BG/RU/EN, формирование PDF и получение email как администратором, так и клиентом.
- Изменения не затрагивали Sanity schemas/documents, Supabase schema/data, header, menu и footer.


## 10. Florial Manager — первая версия приёмки растений (01.11.2026)

- Код внутренней панели находится в `src/manager/ManagerApp.tsx`; маршрут `/manager` выбирается в `src/main.tsx` до монтирования публичного App, поэтому Header/Footer не подключаются.
- Supabase Auth используется для входа; роли `seller`, `manager`, `owner` хранятся в серверно управляемой `public.catalog_staff_profiles`.
- Заявки и история действий: `public.catalog_submissions`, `public.catalog_submission_events`; схема и политики RLS определены в `supabase/migrations/20261101080000_create_florial_manager.sql`.
- Временные фотографии хранятся в закрытом bucket `florial-manager-intake`; Storage RLS ограничивает доступ по user UUID и роли.
- `functions/api/manager/notify.ts` отправляет уведомление владельцу через существующие Resend bindings. Адрес берётся из `CATALOG_REVIEW_EMAIL` или fallback `ORDER_NOTIFICATION_EMAIL`.
- Первая версия принимает новые растения и один вариант продажи. Предложения об изменении существующих карточек и публикация в Sanity ещё не реализованы; одобрение означает только решение владельца.
- PR #38 столкнулся с расхождением base branch; релиз переносится на актуальную ветку `feature/florial-manager-release` и отдельный PR, чтобы не делать force merge.
- На момент подготовки релизной ветки миграция не применена, Auth users/roles не созданы, bucket не создан, production Cloudflare/Sanity не изменялись. Preview secrets не добавляются.
- Проверки Supabase 01.11.2026: project ref `shzbflgqfffgzzgpwjxt` (`florial-shop`) ACTIVE_HEALTHY; схемы `private`, таблиц Manager, bucket и одноимённых Storage policies ещё не было; в истории миграций присутствовали только `20261005133504` и `20261029172232`.
- Подробная инструкция запуска: `docs/FLORIAL_MANAGER_SETUP.md`.


## 11. Florial Manager — production rollout (01.11.2026)

- PR #39 объединён в `main`; merge commit: `7d13d25ad7f8f1396d1033a221813058bef28f6b`. PR #38 закрыт как устаревший/расходящийся.
- GitHub Actions validation run `41287365219`: lint, website build, migration script syntax check и Sanity Studio build — все шаги успешны.
- Cloudflare Pages production deployment `98ba0318-dfc6-419a-9906-62e90f7980de`, URL `https://98ba0318.florial.pages.dev`, статус deploy `success`; deployment использует merge commit и production branch `main`. Основной домен включён в aliases.
- Supabase production project `shzbflgqfffgzzgpwjxt` — migration `create_florial_manager`, version `20261101080656`, применена успешно.
- Read-only post-migration check подтвердил: 3 таблицы Manager; 6 table RLS policies; private bucket `florial-manager-intake`; 4 Storage policies; helper `private.has_catalog_role`; RPC `public.manager_request_catalog_changes`.
- Счётчики `catalog_staff_profiles`, `catalog_submissions`, `catalog_submission_events` — 0. Auth users и роли ещё не создавались. Поэтому панель опубликована, но войти в неё пока некому.
- В Cloudflare production присутствуют нужные для уведомления существующие bindings `RESEND_API_KEY`, `EMAIL_FROM`, `ORDER_NOTIFICATION_EMAIL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`; адрес получателя берётся из `ORDER_NOTIFICATION_EMAIL` как fallback. Секретные значения не читались и не менялись; Preview secrets не добавлялись.
- Security Advisor после миграции показывает 2 INFO findings о RLS без policy на существующих `orders` и `site_events` (ожидаемая deny-by-default модель) и 1 WARN по SECURITY DEFINER RPC. Последний RPC намеренно доступен authenticated для вызова из Manager UI, но внутри проверяет роль `manager` или `owner`; прямой доступ seller блокируется проверкой.
- Email delivery и вход владельца ещё не проверялись end-to-end. Supabase Auth provider/signup/redirect settings остаются **НЕ ИЗВЕСТНО — нужно уточнить**. Перед пилотом создать Auth пользователя владельца и назначить ему роль `owner` по инструкции `docs/FLORIAL_MANAGER_SETUP.md`.


## 10.1 Florial Manager — direct route handling (01.11.2026)

- `src/main.tsx` selects `ManagerApp` for `/manager` and `/manager/*` before mounting the public `App`.
- The public SEO middleware previously intercepted unknown paths and returned its custom 404 before the Manager SPA could load. The targeted fix in `functions/_middleware.ts` explicitly passes `/manager` and nested Manager paths to Cloudflare Pages' SPA fallback.
- This route exception does not add Manager links to the public Header/menu/Footer and does not alter public-site routing, database data, or environment variables.
- Production runtime verification must be recorded separately after deployment; a successful build alone does not prove successful login or Manager API operation.


## 2026-11-01 — Florial Manager: owner staff administration

- GitHub branch: `feature/florial-manager-staff-admin-2026-11-01`.
- Добавлен owner-only раздел сотрудников в `src/manager/ManagerApp.tsx`.
- Серверный endpoint `functions/api/manager/staff.ts` использует существующие production bindings `SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY`; секреты не передаются в frontend.
- Создание Auth users, установка пароля, смена роли и отключение/восстановление доступа разрешены только при проверке активной серверной роли `owner`.
- Отключение реализовано как `is_active=false`, а не физическое удаление, чтобы сохранить ссылки заявок на `auth.users` и историю.
- Новая SQL migration не требуется; используются существующие таблицы и RLS без изменения.
- Preview secrets, Sanity, публичные Header/menu/Footer, корзина, checkout и `orders` не менялись.
- Supabase Auth ограничение: пользователь технически может вызвать стандартный endpoint обновления собственного пароля напрямую. Manager не показывает self-service UI, но строгая блокировка прямого Auth API в этой версии не реализована.
- PR #41 открыт: https://github.com/omaraandrey-dev/florial/pull/41; актуальный head `7bdd676ae7c314e20d87e188fcf305efa24e8db4`, base `main` (`f73b03b17d5bc3cf8d14b96364677b245ab042b2`), branch не отстаёт от main, GitHub сообщает `mergeable=true`.
- GitHub Actions run/status для актуального head пока не возвращён инструментами проверки; успешная сборка не подтверждена. PR не объединён и production deployment не выполнялся.


## 12. Florial Manager — мобильная приёмка и проверка растений (PR #44, 01.11.2026)

- Статус: PR #44 объединён в `main`, merge commit `60890351509b1a4c7916596adc2bb573eccd7484`; Cloudflare Pages production deployment `ba4845b0-5846-480b-9b22-74e380bf6ec6` завершился успешно.
- Владелец подтвердил ручной тест на телефоне: ввод данных растения и добавление двух фотографий работают. Проверка полного цикла публикации в Sanity относится к следующему этапу.
- `src/manager/plantCategories.ts` получает категории из Sanity project `bxvcy0qs`, dataset `plants`; корневая категория `plants-root` не предлагается как категория товара. Форма сохраняет `categoryId` (Sanity document ID) и `categoryName` (BG) в payload заявки.
- `src/manager/ManagerApp.tsx` показывает выпадающий список категорий, миниатюры выбранных файлов, удаление файла до загрузки и статус загрузки. На заявку допускается до 8 фото, каждое до 10 MB.
- Фотографии остаются в private bucket `florial-manager-intake`. После загрузки каждого файла его Storage path добавляется в payload заявки. Перед отправкой заявки проверяется отсутствие ожидающих загрузки файлов.
- `src/manager/SubmissionDetails.tsx` отображает детали заявки и подписанные временные ссылки на фотографии; ссылки создаются из текущей авторизованной сессии, bucket остаётся закрытым.
- Владелец подтверждает одобрение; отклонение требует причины. Менеджер/владелец могут вернуть заявку на исправление с комментарием. Одобрение по-прежнему не публикует растение автоматически в Sanity.
- Изменения не требуют SQL migration или изменения схем Sanity; существующие товары, категории, заказы и записи заявок не удалялись и не переписывались. Header/menu/Footer, checkout и публичная навигация не менялись.
- Владелец уже проверил добавление двух фотографий на телефоне. Полную проверку статусов, сохранности фотографий после повторного входа и нового процесса публикации следует вести отдельно по `docs/FLORIAL_MANAGER_MOBILE_QA.md`.

## 13. Финальная проверка и публикация растений из Manager — PR #45

- Статус кода: отдельная ветка `feature/florial-manager-plant-publication-2026-11-01`; PR #45 открыт и ожидает решения владельца. Актуальный head `6aae07ed2ea22770579f2c4ddcb8982624b4a262`; не объединён и не опубликован в production.
- GitHub Actions run `41300128784` завершился success: lint, website build, migration syntax и Studio build. Cloudflare Pages Preview deployment `14e50c12-9a71-448a-8ffd-69c763d4248a` завершился success. Preview env не содержит server-side Supabase secrets; функциональный тест Manager в Preview не выполнялся.
- `src/manager/PlantPublicationEditor.tsx` предоставляет владельцу отдельную форму финальной карточки для заявок со статусом `approved` или `publish_failed`. Исходный payload сотрудника сохраняется; подготовленные значения хранятся отдельно в `payload.publication`.
- Поддерживаются название BG, ботаническое имя, slug, productType, категория Sanity, SKU, короткое/полное описание, один вариант продажи, высота, контейнер, цена EUR с ДДС, наличие, количество, выбор главного фото, BG alt-тексты, необязательные переводы EN/RU и SEO.
- `functions/api/manager/publish-plant.ts` проверяет Supabase bearer-сессию и активную роль owner на сервере. Только серверный `SUPABASE_SERVICE_ROLE_KEY` читает private Storage; только серверный `SANITY_API_TOKEN` записывает assets и документ в dataset `plants`.
- Публикация создаёт Sanity document type `product`, связывает фактический документ категории через reference и переносит фотографии в Sanity Assets. После создания сервер перечитывает документ и проверяет ключевые поля перед переходом заявки в `published`.
- Существующая схема Sanity используется без изменений. Существующие таблицы Supabase используются без миграции. Sanity document ID и asset IDs сохраняются в `payload.publication`; `target_document_id` не используется для create, поскольку действующий CHECK constraint разрешает его только для operation=update.
- Проверка Cloudflare Pages API 01.11.2026: Production `SANITY_API_TOKEN` присутствует как `secret_text` (зашифрованный Secret); значение намеренно не читается и не раскрывается. Владелец подтвердил, что токен менять не нужно. `SUPABASE_SERVICE_ROLE_KEY` также хранится как `secret_text`.
- Endpoint публикации использует существующий серверный `SANITY_API_TOKEN`; ручное сквозное тестирование публикации в production отдельно не подтверждено. Публичные `VITE_SANITY_*` переменные являются настройками браузерного клиента и не дают права записи.
- Не затрагиваются Header/menu/Footer, публичные страницы, каталоги оборудования, checkout, заказы и существующие документы Sanity.

## 11. Автоматическая подготовка карточек растений — Stage 1 (PR #47 merged, 01.11.2026)

- Реализуемый поток: владелец открывает одобренную заявку в Florial Manager и запускает «Подготви с ИИ». Серверная функция `functions/api/manager/enrich-plant.ts` проверяет Supabase session и роль owner, читает фотографии из приватного bucket `florial-manager-intake`, формирует черновик и сохраняет его отдельно в `catalog_submissions.payload.aiDraft`.
- Исходные данные продавца сохраняются в `payload`; утверждённая владельцем версия хранится в `payload.publication`. Генерация ИИ не должна перезаписывать ни один из этих источников.
- ИИ готовит BG/RU/EN имя и описания, SEO, ALT для каждого изображения на трёх языках, структурированные подсказки по уходу и краткое руководство BG. Цена, SKU, высота при продаже, объём контейнера, наличие и количество берутся только из исходной заявки.
- Минимальная зимняя температура, высота взрослого растения и пригодность для Черноморского побережья не генерируются как подтверждённые факты: значения оставляются пустыми/needsVerification и требуют проверки.
- Публикация остаётся отдельным действием владельца через существующий `/api/manager/publish-plant`. Публичный сайт и checkout не меняются.
- **Инфраструктурный prerequisite на 01.11.2026:** Cloudflare Pages project `florial` пока не имеет Workers AI binding `AI` в Production и Preview. Лицензия Meta для `@cf/meta/llama-3.2-11b-vision-instruct` принята; прямой тест inference через Cloudflare API успешен. План остаётся Workers Free: не подключать Workers Paid, не добавлять платёжную карту и не включать платный биллинг. При исчерпании бесплатной дневной квоты генерация должна остановиться до её сброса.
- CI для head commit `8f2ff911b142fbe7ab15a1023704dbaf331f5b59` завершился success (run `41311051449`: lint, website build, migration syntax check, Studio build). Добавлена защита от повторного использования уже созданного AI-черновика и исправлена транслитерация slug.
- PR #47 объединён в `main` squash-коммитом `3718bf9e47727bf561d7ad9e6d8e3d054ac480fe`. Cloudflare Pages production deployment `5331f7a7-206d-4fd2-ab0a-b62d66f0ec5e` завершился успешно; все этапы `queued`, `initialize`, `clone_repo`, `build`, `deploy` имеют статус `success`. Production aliases: `https://florial-bg.com` и `https://www.florial-bg.com`.
- Проверка Cloudflare Pages API после deployment: `AI` binding отсутствует в Production и Preview. Поэтому интерфейс опубликован, но `/api/manager/enrich-plant` пока отвечает 503 до добавления Workers AI binding с именем `AI` в Production. Модель доступна, Meta terms accepted и direct inference test successful.
- Billing guardrail: владелец подтвердил Workers Free only; не подключать Workers Paid, не добавлять платёжную карту и не активировать платный биллинг. При исчерпании бесплатной дневной квоты запросы должны останавливаться до сброса.
- Production `SANITY_API_TOKEN` остаётся действующим Cloudflare `secret_text`; владелец подтвердил, что ротация не нужна.


## 14. Проверка характеристик растений и коммерческих вариантов — 01.11.2026

- Публичная карточка растения читает название выбранного коммерческого варианта, `saleHeightCm` и `containerVolumeL` из `saleVariants`; legacy `plantCare.saleFormat` используется только как fallback для старых документов.
- Отдельная функция `POST /api/manager/enrich-plant-care` выполняет owner authorization через существующие серверные Supabase bindings и проверяет научное имя через GBIF Species API.
- AI-предложения по уходу запускаются только после точного принятого совпадения GBIF на уровне `SPECIES`. Если идентичность не подтверждена, характеристики не генерируются; владелец уточняет латинское название.
- GBIF подтверждает таксономию, но не агротехнические характеристики. AI confidence — самооценка модели. Все значения проверяются владельцем; `blackSeaCoast` всегда остаётся `needsVerification`.
- Результат отдельного исследования хранится в `catalog_submissions.payload.plantCareResearch`, отдельно от seller payload, `aiDraft` и `publication`. Основная AI-подготовка и смена набора фотографий сбрасывают устаревший результат.
- Реализуется без SQL migration и Sanity schema change. В Sanity публикуются только проверенные владельцем `plantCare` и коммерческие `saleVariants`; сведения об исследовании остаются в Manager payload.
- PR #54 объединён в `main`; head `fb8ed042edcbe0492a74981399b6d769bf23836d`, merge commit `735f85bbbee74d071d98e2fa2b2087db92648c0d`.
- GitHub Actions run `41328095983` завершился success: lint, website build, migration syntax check и Sanity Studio build.
- Cloudflare Pages production deployment `c795cd8c-c0da-4d6f-9672-f0fc29706769` завершился success; URL `https://c795cd8c.florial.pages.dev`; deployment triggered by `main` commit `735f85bbbee74d071d98e2fa2b2087db92648c0d`. Production aliases `florial-bg.com` и `www.florial-bg.com` подтверждены конфигурацией проекта.
- Workers AI binding `AI` присутствует в Production. Server secrets для Manager остаются настроенными; значения секретов не читались и не менялись.
- Ручной end-to-end запуск новой ботанической проверки владельцем ещё не выполнен. Никакие существующие документы Sanity и заявки Supabase массово не изменялись.

## 15. Обязательные поля продавца и фото-проверка ботанической идентичности — 01.11.2026

- Продавец обязан заполнить фото, цену в EUR, высоту при продаже, объём контейнера, категорию, тип растения и количество. Неполные черновики разрешено сохранять; отправка на проверку блокируется.
- Migration `20261101173649_require_complete_plant_submission.sql` добавляет серверный trigger на перевод новой заявки в `submitted`. Он проверяет поля и наличие загруженного фото в приватном Storage bucket. Существующие записи не обновляются и не удаляются.
- Endpoint `/api/manager/enrich-plant-care` использует Workers AI Vision `@cf/meta/llama-3.2-11b-vision-instruct` для независимого предварительного анализа до трёх фото, затем сверяет имя продавца и визуального кандидата через GBIF.
- Агротехнические предложения создаются только по точному GBIF accepted `SPECIES` совпадению. Если имя продавца не подтверждено, но визуальный кандидат имеет точный видовой GBIF match и visual confidence не low, предложения могут быть показаны как предварительные.
- `Plantae`, fuzzy/higher-rank и совпадения выше уровня вида не подтверждают идентичность. Фото-распознавание вероятностное; GBIF подтверждает таксономию, а не уход. Все решения остаются за владельцем.
- Результат хранится отдельно в `payload.plantCareResearch`. Исходная заявка, публикация и коммерческие поля AI не перезаписывает. Фото-проверка поддерживает JPG, PNG и WebP; лицензия Meta для Vision может потребовать предварительного согласия в Cloudflare.
- Production migration применена 01.11.2026: Supabase migration version `20261101173649`. Read-only проверка подтвердила активный trigger `catalog_submission_validate_plant_before_submit` на `public.catalog_submissions`; количество заявок осталось 6, данные не обновлялись.
- PR #56 объединён в `main`: merge commit `4da94c347fb89d7de48a9e2c3e9063a383b79e52`. GitHub Actions run `41332093561` успешно завершил lint, site build, migration syntax check и Sanity Studio build. Cloudflare Pages production check успешен; deployment ID `807cec79-44f1-4532-8a19-8307360d42bd`.
- Ручной end-to-end тест с реальной новой заявкой и фотографиями остаётся pending. До такого теста нельзя считать распознавание изображения и генерацию характеристик полностью проверенными в production.


## 16. Уточнение процесса приёмки растений — 01.11.2026

- Черновик продавца можно сохранить без названия и категории; все обязательные поля проверяются при отправке на проверку. Поля, обязательные для отправки: фотография, тип растения, категория, положительная цена EUR, высота при продаже, объём контейнера и целое количество от 0.
- Фронтенд валидирует форму до отправки, а production PostgreSQL trigger `catalog_submission_validate_plant_before_submit` повторно проверяет payload и наличие фотографии в приватном Storage. Триггер активен; production migration version `20261101173649` подтверждена через Supabase API.
- Для исключения подсказки/якорения модель Vision анализирует фото без передачи ей латинского имени продавца. Результат визуального распознавания и имя продавца проверяются раздельно через GBIF. GBIF подтверждает таксономию, не уход за растением; рекомендации AI остаются предварительными.
- Последние уточнения опубликованы в production: commit `e57f214ebc0d4477d12f11b7f7b61bc9c30931f6`, Cloudflare deployment `c7042ff6-04fb-4d47-ae75-d9450cc27883`, build/deploy stages `success`, aliases включают основной домен.
- Предыдущий deployment после PR #56 — `807cec79-44f1-4532-8a19-8307360d42bd`; он был заменён более поздними production публикациями. Текущий подтверждённый deployment для последнего кода — `c7042ff6-04fb-4d47-ae75-d9450cc27883`.
- Ручной end-to-end тест с новой заявкой, несколькими фотографиями и проверкой владельцем ещё не выполнен. До него корректность визуального распознавания на реальных растениях не считать подтверждённой.


## 17. Ручное принятие AI-рекомендаций владельцем — 01.11.2026

- Результаты `plantCareResearch.plantCare` отображаются отдельно от полей финальной карточки и не переносятся в черновик автоматически.
- Владелец принимает или отклоняет каждую рекомендацию отдельно. Принятая величина переносится в редактируемую карточку; отклонённая не применяется. После этого владелец проверяет и сохраняет финальную карточку, а публикация остаётся отдельным действием.
- Ранее введённые вручную и сохранённые значения не перезаписываются новым исследованием.
- Production deployment первого rollout ручного принятия: `efb8572c-f64d-49c2-85c9-60b947ff8223`, commit `d65920914b01ba46c5e8a1c1202c5d3f1c4c8a30`, build/deploy success.
- Последующее уточнение статуса уже принятых полей после сохранения опубликовано в production: commit `84492e36aeac8b1d10942c9aa419ca5c2ae0331c`, Cloudflare deployment `83f95518-b2df-41dd-b82a-47897bbad149`, build/deploy success; aliases `florial-bg.com` и `www.florial-bg.com`.

## 18. Выбор ботанического имени и диагностика Workers AI — 01.11.2026

- Текущая production-конфигурация Cloudflare Pages project `florial` проверена через API: production branch `main`, Workers AI binding `AI` присутствует. Preview binding отдельно не добавлялся и не менялся.
- Выполнен прямой тест Workers AI через Cloudflare API без обращения к данным заявок: текстовая модель `@cf/meta/llama-3.3-70b-instruct-fp8-fast` вернула JSON; Vision модель `@cf/meta/llama-3.2-11b-vision-instruct` описала синтетическое пустое тестовое изображение. Оба inference-запроса завершились успешно. Это подтверждает доступность binding и моделей, но не заменяет сквозной тест Manager с реальной фотографией и авторизованной заявкой.
- Первая AI-подготовка предлагает до трёх вариантов латинского биноминального имени, используя только название, тип, категорию и описание продавца. Визуальные наблюдения фото не используются для генерации этих вариантов. Поле `scientificName` не заполняется предположением автоматически.
- Владелец выбирает один вариант или вводит латинское имя вручную. Выбранное имя передаётся вместе с фотографиями в `POST /api/manager/enrich-plant-care`; функция независимо анализирует до трёх фотографий и проверяет имя через GBIF Species API.
- GBIF проверяет таксономический статус и принятое видовое имя, а не агротехнические свойства. Фотораспознавание остаётся вероятностным. Несовпадение фотографии и выбранного имени явно показывается владельцу; имя не заменяется молча.
- Добавлен верхнеуровневый обработчик неожиданных исключений в ботанической функции с request ID, этапом выполнения, безопасным JSON-ответом и серверным `console.error`. Секреты, bearer-токен и base64 фотографий не логируются.
- Не менялись Supabase schema/data, Sanity schema/documents, коммерческие данные заявок, публичный каталог, Header/menu/Footer или checkout. SQL migration не требуется.
- После push в `main` требуется подтвердить GitHub validation и Cloudflare Pages production deployment; затем владелец выполняет повторный тест ботанической проверки на своей заявке.
- Для уже созданных до обновления AI-черновиков предусмотрен отдельный owner action для генерации вариантов ботанического имени. Он сохраняет только `aiDraft.scientificNameCandidates` с проверкой `updated_at`, не запускает повторную полную генерацию и не заменяет существующие поля.


## 19. Durable botanical inspection — Cloudflare Workflows (01.11.2026)

- The owner-facing POST /api/manager/enrich-plant-care no longer performs photo inference in the browser request lifecycle. It validates the authenticated owner, validates the plant submission and selected photos, stores a plantCareJob object with a random one-job token and starts a Cloudflare Workflow through the Pages service binding PLANT_CARE_WORKFLOW.
- The endpoint returns HTTP 202 with a workflow ID. The Manager polls the owner-authenticated GET /api/manager/enrich-plant-care?submissionId=...&workflowId=... endpoint. When the Workflow completes, the UI reloads the existing submission and renders the saved plantCareResearch.
- A separate private Worker is stored in workers/plant-care-workflow/ and deployed as florial-plant-care-workflow. It exposes only the /start and /status handlers through the Pages service binding; its workers.dev subdomain is disabled. The Workflow calls /api/manager/enrich-plant-care/process on the Pages app.
- The process route requires the per-job token stored in the corresponding submission payload, verifies the workflow ID and requester, and re-checks that the requester is an active owner. The token is cleared when the inspection result is successfully saved. The workflow retries a failed processing step once.
- The existing AI Vision, GBIF taxonomy, AI care-generation, optimistic-lock save and audit event logic remain in the Pages function. The workflow does not bypass owner authorization and does not publish plant data.
- Placeholder display labels are not treated as plant names. If the submitted name is a known UI placeholder, the server uses the saved AI draft/submission name. A non-Latin value in the botanical-name field is not sent to GBIF as a binomial; common-name candidate generation is used instead.
- No SQL migration or Sanity schema change. No existing seller submission fields, image objects, prices, publication data or published catalog documents are intentionally deleted or overwritten. The job metadata is stored in the existing catalog_submissions.payload.
- Cloudflare Workflows is included in Workers Free limits; no Workers Paid plan, card, or billing upgrade was enabled. Free-plan usage limits still apply.
- Production validation required: test the actual submission in Manager, confirm the Workflow status becomes complete, inspect the plantCareResearch object in the same submission, and verify that the manager UI reloads the suggestions. Until this manual test passes, end-to-end success remains unconfirmed.

- Retry safety: the Workflow normalizes object/string event payloads and the Pages process route returns the saved botanical result idempotently if a retry arrives after the first successful save.
- Deployment note: the Pages site auto-deploys from main. The auxiliary Worker and its Workflow are separate Cloudflare resources; this initial Worker version was deployed through the Cloudflare API and must be redeployed separately when workers/plant-care-workflow/src/index.js changes. The Worker has no workers.dev public subdomain; Pages reaches it through the service binding.


## 2026-11-01 — Botanical Workflow follow-up: main-photo-only AI and Pages routing

- First plant AI preparation (`/api/manager/enrich-plant`) and second botanical verification (`/api/manager/enrich-plant-care`) send only the first selected image (the main photo) to Workers AI Vision. Additional submitted photos remain stored and available for the product; they are not passed to Vision. Diagnostics record the selected-photo count separately from the AI image count.
- The Cloudflare Workflow now calls the verified Pages project hostname `https://florial.pages.dev` for its protected processing endpoint. The previous call to the custom domain `https://florial-bg.com` returned plain HTTP 502 during both real test runs, before the Pages handler returned its structured JSON diagnostics.
- The actual production Workflow must be tested after both the Pages deployment and separate Worker redeployment. Until the test completes and `plantCareResearch` is saved, end-to-end success remains unconfirmed.
- No SQL/Sanity migration or existing photo/data deletion is involved.


### 01.11.2026 — Проверка исправленного Worker → Pages соединения

- Auxiliary Worker `florial-plant-care-workflow` повторно опубликован отдельно; deployment ID `ec92531b847f489e973f21c78696103f`, version tag `d7e658388df34ab594d00d1a889b2fc6`. workers.dev и preview subdomains остались отключены.
- Синтетический Workflow probe вызвал `https://florial.pages.dev/api/manager/enrich-plant-care/process` и получил ожидаемый структурированный HTTP 403 `Owner access required`. Это подтверждает, что Worker достигает Pages Function через проектный hostname. Тестовый caller отклонён проверкой роли до чтения заявки и любых записей; тестовый Workflow instance удалён.
- Production Pages deployment для commit `1f8a97da5ef0473463832eaf25549a79c7b0a492` после временной внутренней ошибки публикации был повторён и завершился успешно: `ee6b8700-99bd-4343-8164-b4a6300496b7`, все этапы success.
- Подтверждено соединение Worker → Pages и успешная публикация. Полный AI/GBIF сценарий ещё не подтверждён: два предыдущих реальных запуска завершились ошибкой; требуется один новый запуск владельцем после обновления Manager. Успехом будет только завершение Workflow и сохранение `plantCareResearch`.
- Синтетический probe не изменял существующие заявки или данные растений.


## 2026-11-02 — обработка невалидного JSON в ботанической Vision-проверке

- В `functions/api/manager/enrich-plant-care.ts` парсер Vision-ответа теперь сначала пробует полный JSON, затем извлекает первый сбалансированный JSON-объект, корректно учитывая строки и escape-последовательности.
- Если Vision-модель возвращает текст, который нельзя разобрать как JSON, выполняется форматная нормализация через поддерживаемую JSON Mode текстовую модель `@cf/meta/llama-3.3-70b-instruct-fp8-fast`. Это не новый ботанический вывод: текстовая модель только приводит уже полученный ответ Vision к согласованной структуре и не должна добавлять новые факты.
- Повторная отправка изображения не выполняется. В AI отправляется одна главная фотография; остальные изображения остаются в заявке.
- При успешном восстановлении в диагностике отмечается этап `vision_json_repair`. При неуспехе запрос завершается контролируемой ошибкой до записи результата.
- Влияние на данные: SQL/Sanity migrations не выполнялись; содержимое существующих заявок, изображений и опубликованных растений не изменялось этим коммитом. Header/menu/Footer, checkout и вспомогательный Workflow Worker не затронуты.
- Статус проверки production deployment и реального AI/GBIF end-to-end запуска фиксируется отдельно после завершения публикации и ручного теста.


## 20. Права сотрудников и изменение вариантов растений — 02.11.2026

- В `catalog_staff_profiles.permissions` хранятся независимые флаги `canCreatePlant`, `canAddPlantVariant`, `canEditPlantPrice`. Значения по умолчанию: `true/false/false`; дополнительные права владелец включает отдельно.
- Владелец управляет каждым правом в Manager. Серверный endpoint повторно проверяет активный профиль и разрешение; UI не является единственной границей безопасности.
- Plant catalog находится в Sanity project `bxvcy0qs`, dataset `plants` (отдельный dataset того же проекта, не `production`). Список вариантов загружает только опубликованные активные документы `_type == product` с `saleVariants`; drafts исключаются.
- Добавление варианта и изменение цены оформляются как заявки `catalog='plants'`, `operation='update'` с `target_document_id` и `target_revision`. До одобрения владельцем Sanity-документ не меняется.
- При одобрении endpoint сверяет текущую `_rev`. При конфликте запись не перезаписывается. Добавление дописывает один элемент `saleVariants`; изменение цены меняет только `priceEUR` выбранного варианта, сохраняя остальные поля.
- Публичная карточка показывает только заполненные ботанические характеристики; `needsVerification` не считается подтверждённой характеристикой. Коммерческие данные вынесены в отдельный блок.
- Диагностические сведения AI остаются в серверных логах; интерфейс показывает безопасное сообщение.
- Supabase migrations `20261102030602` и `20261102031318` применены; политика для каталога production сохранена. Cloudflare Pages deployment выполняется по `main`.


## 21. Завершение Manager: проверка прав и удаление клиентской диагностики — 02.11.2026

- Повторно проверены production Supabase project `shzbflgqfffgzzgpwjxt`, активные миграции `20261102030602` и `20261102031318`, столбец `catalog_staff_profiles.permissions` и действующие RLS-политики. В профилях владельца и продавца сохранены текущие значения прав; строки не обновлялись.
- Исправлен `GET /api/manager/staff`: ответ теперь содержит `permissions` каждого сотрудника. Это необходимо для корректного отображения независимых переключателей прав в Owner Manager.
- Из `PlantPublicationEditor` удалены клиентские состояния и блок с полным JSON-ответом ботанического Workflow. Обычный интерфейс показывает результат/ошибку, а серверные диагностические журналы сохраняются.
- Проверено по коду: пустые ботанические характеристики не отображаются; `needsVerification` не показывается как подтверждённое свойство; коммерческий вариант продажи остаётся отдельным блоком.
- Поток добавления варианта и изменения цены использует заявки `operation='update'`, одобрение владельцем и проверку Sanity `_rev`. Существующие документы Sanity и заявки в этой работе не изменялись.
- Изменения выполняются непосредственно в `main` по указанию владельца. Header, menu, footer, корзина, checkout и публичная навигация не затрагиваются.
- Сборка и production deployment после последнего commit должны быть зафиксированы по фактическим результатам GitHub Actions/Cloudflare; до этого они считаются неподтверждёнными.

## 22. Сохранение корзины покупателя — 02.11.2026

- Общая корзина оборудования и растений восстанавливается при запуске приложения из браузерного localStorage через src/lib/cartStorage.ts.
- Ключ хранилища версионирован: florial:shopping-cart:v1; формат содержит версию и массив позиций. При загрузке проверяются обязательные поля товара, целое положительное количество и структура выбранного варианта растения; некорректные позиции пропускаются.
- В src/App.tsx состояние корзины инициализируется из локального хранилища, а изменения автоматически записываются обратно. В хранилище попадает компактный снимок товара, достаточный для отображения корзины и подготовки заказа.
- Разные варианты одного растения сохраняются отдельными позициями через существующий getCartItemKey; текущие обработчики добавления, изменения количества и удаления не менялись по логике.
- Корзина очищается существующим CartPage только после успешного ответа POST /api/orders. Серверная повторная проверка актуальных цен/наличия в Sanity остаётся обязательной; сохранённая в браузере цена не является источником истины.
- Если браузер запрещает localStorage, данные повреждены или хранилище переполнено, приложение продолжает работать в рамках текущей сессии без ошибки для покупателя.
- Область действия: один браузер/профиль на одном устройстве. Серверная синхронизация между устройствами не реализована. Sanity, Supabase, Cloudflare environment, Manager, header, menu и footer не менялись.
- Сборка и автоматические проверки фиксируются по результатам GitHub Actions для PR; реальное production-поведение требует отдельного ручного теста владельца после публикации.

## 23. Checkout: способы получения, оплаты и доставка — 02.11.2026

- Активные способы получения: `pickup` (самовывоз), `courier` (курьерская доставка оборудования инженером Florial) и `agree` (индивидуальное согласование доставки растений).
- `courier` отображается только если корзина содержит исключительно оборудование. Покупатель выбирает населённый пункт из прежнего фиксированного списка тарифов и указывает обязательный адрес. Тарифы в EUR: Слънчев бряг — 0; Несебър, Свети Влас, Тънково, Равда, Кошарица, Ахелой, Александрово, Оризаре, Гюльовца, Медово, Порой, Каблешково — 10; Поморие, Каменар, Лъка, Баня, Бата, Гълъбец, Габерово — 15; Дъбник — 17; Горица, Белодол, Емона, Страцин, Обзор — 20; Приселци, Козичино, Раковсково, Паницово — 25. Солнечный Берег — бесплатная доставка.
- `courier` — именно доставка оборудования инженером Florial. Это не означает, что интеграция Econt подключена.
- Если в корзине есть хотя бы одно растение (включая смешанную корзину), `courier` недоступен; показывается `agree`, доставка и окончательная стоимость согласуются с Florial. Населённый пункт обязателен, адрес необязателен.
- API повторно проверяет тип корзины, город из списка и обязательный адрес для `courier`; прямой запрос с растениями и `courier` отклоняется. Сервер рассчитывает тариф самостоятельно, не доверяя клиентской сумме.
- `public.orders.delivery_fee` и `public.orders.total` — nullable numeric EUR. Самовывоз: `delivery_fee=0`, `total=subtotal`; courier: подтверждённый тариф и `subtotal + delivery_fee`; доставка растений до согласования: оба значения NULL.
- Письмо и PDF показывают доставку и окончательный итог согласно выбранному способу: тариф для courier либо ожидающее согласования значение для `agree`.
- Активный способ оплаты не менялся: только `pay_in_store`; наложенный платёж, банковский перевод и онлайн-карта не разрешены API.
- Применённая миграция: `supabase/migrations/20261102190000_add_order_delivery_fee_and_total.sql`. Последняя проверка структуры подтвердила оба столбца, комментарии и default `payment_method='pay_in_store'`; в таблице было 18 существующих заказов.
- Не запускать реальные тестовые заказы без согласования владельца. Header, menu, Footer, Manager, Sanity schema/documents и существующие строки заказов не изменялись.

### 23.1. Восстановление courier для оборудования — 02.11.2026

- После уточнения владельца восстановлен прежний пользовательский тарифный список и форма адреса для доставки инженером Florial.
- Правило выбора взаимоисключающее: только оборудование → pickup/courier; есть растения → pickup/agree.
- В Supabase схема не менялась.



## 24. Переход Florial с Supabase на Cloudflare D1 — 02.11.2026

### Подтверждённая инфраструктура

- Создана Cloudflare D1 database: имя `florial-db`, database UUID `5fbb0e47-8439-493c-821a-6945eef7d8b2`, jurisdiction `eu`.
- Созданная база расположена в EU jurisdiction. Cloudflare API подтвердил регион обработки EEUR при тестовом запросе.
- К базе применены миграции `0001_initial.sql`, `0002_login_rate_limit.sql`, `0003_integrity_triggers.sql` и `0004_order_money_cents.sql`; таблица `schema_migrations` содержит эти версии. Миграция `0005_single_owner.sql` применена; уникальный индекс `idx_catalog_staff_single_owner` подтверждён запросом к D1.
- Проверено наличие таблиц: `orders`, `site_events`, `catalog_staff_profiles`, `manager_sessions`, `manager_login_attempts`, `catalog_submissions`, `catalog_submission_events`, `schema_migrations`.
- D1 database не содержит перенесённых тестовых заказов, аналитики, заявок, профилей или пользователей.
- В Cloudflare Pages project `florial` настроена production binding `DB` → эта D1 database. После merge PR #60 production deployment `6d823f6b-4d1c-487c-b89d-b12c28c2d906` завершился успешно на commit `f1ff703025b5d60538c0d9c3b6050d36b458964a`; канонический deployment включает `https://florial-bg.com` и `https://www.florial-bg.com`.
- Production runtime переключён на D1 после merge PR #60. Preview D1 binding не настроен намеренно, чтобы preview не писал в production database.

### Целевая архитектура

- D1 — заказы, аналитика, учётные записи и сессии сотрудников, заявки растений, статусы и история.
- Sanity project `bxvcy0qs`, dataset `plants` — каталог растений и фотографии. Новые фото сразу загружаются в публичные Sanity Assets.
- Допустимые фотоформаты: JPEG, PNG, WebP; сервер проверяет MIME type и сигнатуру файла. Предельный размер одного файла — 10 MB.
- Resend — уведомления и письма.
- Cloudflare Pages Functions — API, проверка прав, авторизация и запись в D1.
- Существующий Cloudflare Workflow и Workers AI сохраняются; Supabase Storage для новых фото не используется, R2 для фотографий не нужен.
- Тестовые данные Supabase не мигрируются и не удаляются. После cutover Supabase не должен получать новые записи; его отключение — только после согласованного rollback-периода.

### Авторизация

- Сотрудник входит по email и постоянному паролю; одноразовые коды на email не используются.
- Владелец создаёт сотрудников, назначает роли и задаёт пароль.
- Пароли сохраняются как PBKDF2-SHA-256 хеш с индивидуальной солью; открытый пароль не сохраняется.
- Браузерная сессия — HttpOnly, Secure, SameSite=Strict cookie; сессионный токен в localStorage не хранится.
- Срок сессии скользящий, до 30 дней; деактивация сотрудника и смена его пароля отзывают действующие сессии.
- Вход ограничивается по сочетанию хеша email/IP: 8 неудачных попыток за 15 минут, затем временная блокировка.
- Первичный owner создаётся однократным bootstrap endpoint; требуется отдельный secret `MANAGER_BOOTSTRAP_SECRET`. На момент записи secret ещё не установлен, owner в D1 ещё не создан.

### Незавершённые действия и ограничения

1. PR #60 объединён squash merge; GitHub Actions run `41411916368` и `41411916380` завершились успешно (lint, Vite build, Pages Functions syntax, Studio build). Cloudflare Pages production deployment `6d823f6b-4d1c-487c-b89d-b12c28c2d906` завершился success.
2. После deployment нужно установить production secret `MANAGER_BOOTSTRAP_SECRET`, создать первого owner через страницу первичной настройки и проверить вход. Это только защита одноразового первичного создания владельца; сотрудники далее входят email и постоянным паролем без одноразовых email-кодов.
3. Провести end-to-end проверки: сотрудник, пароль, роли, черновик, загрузка Sanity Asset, AI-обработка, проверка владельцем, публикация, заказ, email/PDF и аналитика.
4. Убедиться, что все manager endpoints используют D1 и не обращаются к Supabase; затем оставить старый Supabase без записей на rollback-период.
5. Настроить независимые резервные копии D1 и проверить восстановление. Time Travel не считать единственной резервной копией.
6. После периода наблюдения отдельно согласовать удаление старых Supabase variables и отключение Supabase. Не удалять старый Supabase project или его данные без отдельного подтверждения.
7. Проверить фактический тариф Cloudflare и CPU time при входе/генерации PDF; не утверждать, что production полностью остаётся на Free, пока не измерены реальные лимиты.

## 25. Диагностика первичного создания владельца Manager — 02.11.2026

- Первичный owner создаётся только через `POST /api/manager/auth/bootstrap`; интерфейс не обращается к D1 напрямую.
- Серверный bootstrap теперь присваивает каждому запросу `requestId` и отслеживает безопасный этап: `configuration`, `origin_check`, `owner_lookup`, `request_body`, `password_hash`, `owner_insert`.
- При неожиданной серверной ошибке Cloudflare Pages возвращает HTTP 500 с `requestId` и `stage`. Клиент отображает HTTP-статус, этап и код проверки. В серверный журнал не передаются пароль, одноразовый секрет, соль или хеш.
- Ожидаемые отказы сохраняют собственные статусы: 400 — проверка формы, 403 — источник запроса или одноразовый секрет, 409 — owner уже существует, 503 — отсутствует D1 или production secret.
- Ограничение постоянного пароля: 12–128 символов; длина явно показана рядом с полем, клиент и сервер проверяют оба предела.
- Перед созданием владельца проверять `GET /api/manager/auth/bootstrap-status`; после успешной записи endpoint возвращает `201`. Если запись прошла, но автоматический вход не удался, повторный bootstrap не запускать — использовать обычную форму входа.
- На 02.11.2026 последняя read-only проверка D1 показала 0 профилей и 0 owner; схема и пять миграций присутствуют. Эти сведения относятся к моменту проверки и не заменяют повторную проверку перед новым bootstrap.
- Данные D1 и Cloudflare secrets не изменяются этим кодовым изменением. Production secret `MANAGER_BOOTSTRAP_SECRET` существует как secret binding; его значение не читается и не хранится в Git.
- Проверка после merge/deploy: GitHub Actions lint/build/Pages Functions validation, Cloudflare Pages Production deployment, затем проверка статуса bootstrap. Само успешное развертывание не считается доказательством успешного создания owner.

## 26. PBKDF2 в Cloudflare Workers — ограничение runtime — 02.11.2026

- Cloudflare Workers Web Crypto поддерживает PBKDF2-SHA-256, но отклоняет derivation с числом итераций выше 100 000. Вызов с прежним значением 310 000 завершался исключением на этапе `password_hash` при первичном создании owner.
- Для новых паролей используется 100 000 итераций — верхняя граница текущего runtime; соль остаётся случайной, индивидуальной, 16 байт. Формат полей `password_salt`, `password_hash`, `password_iterations` не меняется.
- `verifyPassword` использует число итераций, сохранённое для соответствующего хеша. Перед использованием параметр проверяется на целое значение в диапазоне 1–100 000.
- Read-only запрос к production D1 от 02.11.2026 до исправления показал отсутствие строк в `catalog_staff_profiles`; следовательно, хешей с прежними 310 000 итераций нет, перенос или сброс паролей не нужен.
- Это ограничение платформы и вынужденный компромисс. При переходе на runtime с большим лимитом либо на другой проверенный password-hashing KDF следует повторно оценить параметры; не увеличивать итерации выше лимита Workers без изменения реализации.
- Не менялись D1 schema/data, production secrets/bindings, Supabase, Sanity, публичный интерфейс, Header, menu, Footer и checkout.

## 27. Manager — сохранение и повторное использование фотографий растений — 03.11.2026

- Причина ошибки `Invalid return columns`: клиентский `QueryBuilder` по умолчанию отправляет `select: "*"`, а endpoint D1 проверяет список `RETURNING` только по allowlist. При UPDATE wildcard преобразуется в безопасный `RETURNING id`; остальные явно запрошенные поля продолжают проходить allowlist-проверку.
- `GET /api/manager/image-library` требует активную Manager-сессию и серверный `SANITY_API_TOKEN`. Endpoint читает image assets только из Sanity project `bxvcy0qs`, dataset `plants`; токен остаётся только в Cloudflare server environment.
- Форма продавца отображает общую библиотеку активов dataset `plants`, поиск по имени файла/ID и возможность добавить существующий актив к новой или редактируемой заявке. Можно объединять выбранные библиотечные снимки с новыми загрузками; лимит — 8 фотографий на заявку.
- Выбранные активы сохраняются в прежнем формате `payload.images` с `assetId`, CDN URL, именем, размером и MIME type. Текущий процесс AI-подготовки и публикации продолжает использовать тот же формат.
- У Sanity Assets нет подтверждённого в текущей схеме поля, связывающего все старые фотографии с конкретным сотрудником. Поэтому библиотека общая для dataset `plants`; нельзя подписывать старые активы как личные загрузки продавца.
- D1 schema/data, Sanity schema/documents/assets, Supabase, секреты, публичный каталог, Header, menu, Footer и checkout не изменялись. Новые D1 таблицы и миграции не добавлялись.
- Production deployment и реальная проверка продавцом (загрузка новой фотографии, выбор старой, сохранение черновика, повторное открытие и AI-подготовка) фиксируются отдельно после выполнения.


## 28. Обязательное исключение Supabase и актуальная модель полномочий Manager — 03.11.2026

### 28.1. Supabase запрещён для дальнейшей работы

- Supabase больше не является частью рабочей архитектуры Florial. Запрещены любые подключения к Supabase через ChatGPT-коннекторы, API, CLI, SDK, Dashboard или прямые запросы.
- Не проверять состояние старого проекта Supabase, не читать его данные и не использовать его для тестов, аналитики, заказов, авторизации, фотографий, резервного копирования или восстановления.
- Не добавлять Supabase SDK, импорты, переменные окружения, secrets, bindings, миграции, SQL-файлы или новые интеграции.
- Единственная рабочая база приложения — Cloudflare D1, доступная серверным кодом через Cloudflare binding `DB`. Не подключать D1 напрямую из браузера.
- Заказы, аналитика, учётные записи/сессии сотрудников, заявки растений, статусы и журнал действий используют D1. Каталог и изображения растений/оборудования — Sanity. Файлы и медиа не переносить в Supabase Storage.
- Исторические упоминания Supabase в разделах 1–27, старых миграциях, changelog и архивных документах не означают, что сервис разрешено использовать. Для текущих решений приоритет имеют этот раздел и актуальные исходники на `main`.
- НЕ ИЗВЕСТНО — нужно уточнить: остались ли в Cloudflare production/preview variables или bindings старые Supabase URL/keys, в GitHub Secrets, в локальных окружениях или в иных внешних настройках. Не проверять их через Supabase. Их безопасное удаление выполняется только после статического аудита кода и согласованного плана отключения.
- Не удалять старый Supabase проект и его данные автоматически. Отключение приложения и физическое удаление проекта — разные действия; удаление данных требует отдельного решения владельца.

### 28.2. Безопасное техническое отключение старой интеграции

1. Выполнить статический поиск по GitHub-репозиторию (без обращения к Supabase): `supabase`, `SUPABASE_`, `VITE_SUPABASE_`, `createClient`, старые supabase imports, SQL migrations и прежние Storage/Auth helpers.
2. Проверить, что production-код заказов, Manager, аналитики, авторизации, фотографий и API использует только D1/Sanity/Cloudflare/Resend.
3. Удалить из активного кода неиспользуемые Supabase SDK/client и зависимости, старые Supabase API endpoints и неиспользуемые переменные из `.env.example`. Исторические миграции/архивные заметки не исполнять и не удалять автоматически; пометить их как архив.
4. После проверки сборки и production smoke tests удалить старые Supabase URL/API key variables из Cloudflare Pages production и preview, GitHub Actions Secrets/Variables и локальных env-файлов. Не показывать значения секретов в логах или чате.
5. После подтверждения, что ни один production/worker/job не зависит от этих переменных, отозвать/ротировать старые API keys у провайдера и/или приостановить старый проект через его панель — только если владелец отдельно решит выполнить этот внешний шаг. Для текущей разработки вход в Supabase не нужен.
6. Не использовать старую базу как rollback. Rollback выполнять через проверенные GitHub commits/deployments и Cloudflare D1 backups/restore procedure.

### 28.3. Полномочия сотрудников Manager — утверждённая целевая модель

- **Владелец:** полный доступ, включая создание сотрудников, назначение и изменение их разрешений, просмотр аналитики, создание/редактирование растений, проверку заявок, окончательную публикацию и управление всеми разделами Manager.
- **Менеджер:** может создавать растения, редактировать разрешённые ему карточки, утверждать заявки продавцов и выполнять окончательную публикацию растения в открытый каталог Sanity, если соответствующие разрешения включены.
- **Менеджер, создающий другого менеджера:** может назначить новому сотруднику только те разрешения, которыми сам обладает и которые ему разрешено делегировать. Нельзя выдать право выше собственного уровня или добавить право, которого нет у создателя.
- **Продавец:** создаёт и редактирует собственные заявки/черновики и отправляет их на проверку; не утверждает и не публикует.
- Права должны быть индивидуальными и проверяться на сервере для каждого endpoint и действия. Скрытие кнопки в интерфейсе не является контролем доступа.
- Разрешения должны включать как минимум отдельные флаги/права на просмотр аналитики, просмотр/управление сотрудниками, создание растений, редактирование карточек, утверждение заявок и окончательную публикацию. Точный набор и названия ключей определяются аудитом текущей D1 schema и кода; не придумывать существующие идентификаторы до проверки.
- Владелец может выдавать менеджеру полный или ограниченный набор прав. Менеджер при создании другого менеджера может делегировать подмножество собственных делегируемых прав, включая просмотр аналитики только если сам имеет это право и политика делегирования его разрешает.
- Менеджер не должен иметь возможность изменить собственные разрешения или повысить собственный уровень доступа. Нельзя удалять/понижать последнего активного владельца.
- Для менеджера, создавшего собственную карточку растения, правило самоутверждения/самопубликации должно быть явно определено в реализации и протестировано. Базовое требование владельца: менеджер имеет право окончательной публикации, поэтому запрет самопубликации не вводить без отдельного согласования.
- **Статус:** это целевая модель, согласованная владельцем 03.11.2026; фактическое соответствие текущего кода ещё требует аудита и реализации. Не считать права уже работающими только по этой записи.

### 28.4. Обязательные правила следующих задач

- Перед работой читать этот технический паспорт и актуальную инструкцию проекта, затем проверять GitHub `main`, Cloudflare D1 schema/migrations/bindings и Sanity только в объёме задачи.
- **Не обращаться к Supabase ни при каких обстоятельствах в рамках работы над Florial.** Если в исходниках обнаружен старый Supabase-код, анализировать его статически в GitHub; не запускать и не подключать его.
- Перед изменениями Manager представить владельцу перечень конкретных изменений UI, API, D1 schema/migrations и прав; не затрагивать публичные Header/menu/Footer без отдельного согласования.
- После изменений проверять матрицу owner/manager/seller и каждое право на серверном уровне, сборку, production deployment и журнал изменений.

## 2026-11-03 — Manager permissions and D1 state

The active Manager authorization model is Cloudflare D1, not Supabase Auth/SDK. Session authentication remains in the existing Cloudflare Manager implementation. The `managerApi` frontend client calls `/api/manager/*`.

### Permission keys

`catalog_staff_profiles.permissions` contains ten boolean keys:
- `canCreatePlant`
- `canEditPlantCard`
- `canAddPlantVariant`
- `canEditPlantPrice`
- `canReviewPlantSubmissions`
- `canApprovePlantSubmission`
- `canPublishPlant`
- `canManageStaff`
- `canDelegatePermissions`
- `canViewAnalytics`

The owner role bypasses these flags and retains all permissions. For managers, all permissions are checked in the server API; client-side visibility is not an authorization boundary.

### Delegation rules

- `canManageStaff` permits management of staff accounts created directly by that manager.
- `canDelegatePermissions` is additionally required to assign or change permissions and to create another manager.
- A manager cannot delegate a permission they do not personally hold.
- Managers cannot modify the owner profile. Existing profiles without `created_by` remain owner-managed.
- Permission grants and changes are recorded in `catalog_staff_permission_events`.

### D1 migration 0006

Applied to Production D1 database `florial-db` (EU jurisdiction) as `0006_manager_permissions`.
- Adds nullable `catalog_staff_profiles.created_by`.
- Normalizes existing permission JSON without changing the legacy three permission values.
- Replaces staff permission triggers to require all ten boolean fields.
- Adds staff-creator indexes and `catalog_staff_permission_events`.
- Existing staff profiles, password hashes, sessions, catalog submissions and published Sanity documents were preserved.

Production verification confirmed migration marker `0006_manager_permissions`, the new column, indexes, triggers and audit table. At verification there were two staff profiles: one owner and one manager. New permission flags on the existing manager default to false until explicitly granted by the owner; legacy permissions are retained.

### Approval and publication workflow

- Plant creation and draft submission are allowed with `canCreatePlant`.
- Final card preparation and botanical AI preparation require `canEditPlantCard`.
- Review, approval and Sanity publication are separate permissions.
- `canApprovePlantSubmission` allows approval only after a final publication payload has been saved.
- `canPublishPlant` allows publication only for an approved submission.
- Existing-plant variant/price operations retain their dedicated permissions; applying those changes to Sanity requires both approval and publication rights.
- Analytics requires `canViewAnalytics`.

### Operational notes

- The D1 migration is applied in Production; Preview still has no D1 binding, as previously observed.
- No changes were made to old Cloudflare Supabase environment variables or to any Supabase data.
- Production build/deployment must be confirmed against the latest `main` commit before treating the release as complete.
- Role-matrix functional tests (owner, manager with partial rights, delegated manager, seller) require an authenticated owner session and should be completed in the Manager UI.

### Additional workflow hardening — 03.11.2026

Existing plant variant/price submissions now use two distinct server transitions. Approval requires `canApprovePlantSubmission` and validates the current Sanity revision without changing the public catalog. Publication requires `canPublishPlant` and applies the approved change. A repeated publish request checks whether the exact variant/price change is already present before retrying, protecting against a Sanity success followed by a D1 status-write failure.

Editing a previously approved or failed new-plant publication card resets its status to `in_review`, clears prior approval/publication markers and requires reapproval. Generic data API status updates cannot bypass the dedicated publication endpoints.

Manager-only permissions are rejected for seller accounts by the central permission helper. Demoting a manager to seller automatically clears manager-only permissions and records the change. Image uploads/library access and submission notifications are permission-scoped. Owner retains full access automatically.

### Production deployment confirmation — 03.11.2026

The latest Manager permission implementation and Bulgarian UI/API copy were included in Production Cloudflare Pages deployment for commit `b1ccfe7aeb076118bac5c2924ec95fb9fd89e279`. Deployment `dcde054a-b193-42cb-99a9-941bad9b3ae4` completed with queued, initialize, clone, build and deploy stages all successful; `uses_functions=true`. The deployment is associated with the Production branch `main`.

No separate GitHub CI status checks were returned for this commit. Pages build/deploy succeeded. Authenticated manual role-matrix testing is still pending because it requires an owner session; no test employees or submissions were created in Production.


### Active manager permission grant — 03.11.2026

Following the owner's explicit approval, the existing active manager profile was updated in Production D1. The role was not changed and no staff account was created.

Enabled: `canManageStaff`, `canDelegatePermissions`, `canReviewPlantSubmissions`, `canApprovePlantSubmission`, `canPublishPlant`.

Preserved: `canCreatePlant`, `canAddPlantVariant`, `canEditPlantPrice` remain true; `canEditPlantCard` and `canViewAnalytics` remain false. The updated profile was read back from Production D1 and the change was recorded in `catalog_staff_permission_events` with the owner as actor. The manager can manage only staff profiles created directly by her and can delegate only permissions she personally holds.


## 2026-11-03 — Manager: фотографии, AI-проверка и просмотр заказов

### Лимит фотографий растений
- На одну заявку/карточку допускается максимум 10 фотографий.
- Ограничение синхронизировано в `src/manager/ManagerApp.tsx`, `functions/api/manager/enrich-plant.ts`, `functions/api/manager/enrich-plant-care.ts` и `functions/api/manager/publish-plant.ts`.
- Размер каждого файла по-прежнему ограничен 10 MB; разрешены JPEG, PNG и WebP.
- Общая библиотека изображений остаётся в Sanity dataset `plants`; выбор существующего asset не удаляет оригинал из Sanity.

- Библиотека Sanity Assets загружает изображения страницами по 100 элементов через `GET /api/manager/image-library?offset=N`; Manager может подгружать следующие страницы кнопкой «Зареди още снимки». Поиск применяется к уже загруженным изображениям.

### AI и ботаническая проверка
- Видимые подписи и сообщения по результатам фотоанализа/GBIF в редакторе Manager приведены к болгарскому языку.
- Генерация предложений латинского имени просит AI возвращать пояснения на болгарском языке.
- AI/GBIF результаты по-прежнему являются подсказками для сотрудника, а не автоматическим подтверждением вида или автоматической публикацией.
- Ботаническая проверка остаётся отдельным процессом; агротехнические значения принимаются вручную по каждому полю.

### Просмотр заказов
- В D1 таблица `orders` подтверждена read-only проверкой; текущая схема включает номер, покупателя, контакты, адрес/город, способ доставки и оплаты, позиции, суммы, статус и дату.
- Добавлен `GET /api/manager/orders` в `functions/api/manager/orders.ts`.
- API использует `requireUser` и допускает только активные роли `owner` и `manager`; возвращает до 100 последних заказов, позиции разбираются из JSON.
- В `src/manager/ManagerApp.tsx` добавлена вкладка «Поръчки» с контактами клиента, товарами, доставкой, оплатой и итоговыми суммами.
- Раздел является только просмотром. API для изменения статуса, оплаты, доставки или содержимого заказа не добавлялся.

### Границы и статус проверки
- D1 проверялась только read-only; подтверждены структура таблицы `orders` и наличие одной записи со статусом `new` без чтения персональных данных.
- Миграции D1 не запускались; записи заказов не создавались и не менялись.
- Требуется ручная проверка вкладки под реальной owner и manager сессиями и production build/deployment confirmation.
- Header, публичное меню, Footer, checkout и публичный каталог не изменялись.


## 2026-11-03 — Локализация на съобщенията AI/GBIF в Manager

- Видимите диагностични съобщения от `functions/api/manager/enrich-plant.ts` и `functions/api/manager/enrich-plant-care.ts` са преведени на български.
- Включени са съобщенията за сесии, заявки, D1/Workers AI конфигурация, GBIF, изображения и ограничения/лицензи на модела.
- Променени са само текстове на съобщенията. Не са променяни алгоритмите, разрешенията, статусите, D1 или Sanity.

## 2026-11-03 — Последна проверка Manager

- `src/manager/PlantPublicationEditor.tsx` проверява максимум 10 снимки преди запис/публикация; сървърните проверки в `enrich-plant.ts`, `enrich-plant-care.ts` и `publish-plant.ts` също ограничават до 10.
- Съобщенията за грешки, които се показват от AI/GBIF endpoint-ите, са локализирани на български.
- `GET /api/manager/orders` и панелът «Поръчки» са read-only. Production D1 показва 1 поръчка със статус `new`; checkout кодът създава поръчки с този статус. Други статуси и правила за тях не са потвърдени, затова мутацията на поръчки не е реализирана.
- Production D1 е проверена само чрез агрегирана SELECT заявка; без промяна на записи. Sanity също не е променян.


### Final Manager localization follow-up — 03.11.2026
- Final visible Russian fragments were corrected in the AI image-diagnostic stage label, botanical-check prerequisite message and plant image-preview warning.
- These were text-only changes. Manager authorization, AI/GBIF algorithms, D1 records, Sanity documents, order data and public storefront components were not changed.
- Production deployment for the final code commit must be checked before closing the work.



### Botanical review localization completion — 03.11.2026
- Remaining Russian result labels in the AI/GBIF review card were translated into Bulgarian, including the alternative photo hypothesis, GBIF-confirmed taxonomy with inconclusive photo, photo-analysis label and missing submitted-name fallback.
- AI diagnostic stage label and sample botanical candidate explanation were localized.
- A targeted source scan across the main Manager UI and AI/GBIF endpoints found no remaining matches for the checked Russian UI/error phrases.
- No authorization rules, data records, Sanity documents, AI/GBIF decision thresholds or public storefront components were changed.


## 2026-11-03 — Manager editor permission safeguards

- `PlantPublicationEditor` receives `canEdit` and `canPublish` independently.
- If `canEditPlantCard=false`, the form controls are disabled, AI draft generation, scientific-name suggestions, botanical/GBIF research and image removal are disabled. The UI explains the missing permission in Bulgarian.
- If `canPublishPlant=true`, the separate publish action remains available outside the disabled fieldset, so an authorized manager can publish an already prepared and approved card without receiving edit permission.
- This preserves the active manager's existing D1 permissions; no permission flags, D1 rows, Sanity documents or assets were changed.
- AI diagnostic stage labels were localized to Bulgarian.



## 25. Manager: разделение рабочих сценариев и диагностика AI/GBIF — 03.11.2026

### Кабинет продавца
- Стартовый экран src/manager/ManagerApp.tsx показывает отдельные действия: создание нового растения, добавление варианта/изменение размера и изменение цены.
- Формы изменения каталога открываются только после выбора соответствующего действия.
- Библиотека PlantImageLibrary не монтируется до нажатия кнопки открытия. Поэтому список всех изображений Sanity не загружается и не отображается при обычном открытии формы.
- Загрузка файлов с устройства остаётся доступной через системный file picker на телефоне и компьютере. Выбор из общей библиотеки Florial является отдельным необязательным действием.

### Кабинет владельца и проверка заявок
- Список заявок разделяется по operation и payload.changeType: create, addVariant, editPrice.
- Владелец/уполномоченный менеджер выбирает тип запроса до просмотра списка; боковая панель с подробностями и историей скрыта, пока не выбрана конкретная заявка.
- Существующие правила approve/publish и текущие permission flags сохранены. Новые права не назначались.

### Диагностика AI и ботанической проверки
- functions/api/manager/enrich-plant.ts возвращает диагностические этапы успешного AI-черновика: валидация входных данных, анализ изображений, генерация текста, перечень созданных полей и сохранение черновика.
- При ошибке AI endpoint возвращает diagnostic stage, code, model, image number, hint и техническое сообщение.
- functions/api/manager/enrich-plant-care.ts сохраняет diagnostics в объекте plantCareResearch и возвращает сохранённый результат вместе со статусом Workflow.
- src/manager/PlantPublicationEditor.tsx отображает закрываемое окно диагностики с понятными названиями этапов, статусом каждого этапа, результатами определения таксона и предложенными характеристиками. Техническое сообщение доступно в раскрываемом блоке.
- Диагностика является информационной: AI/GBIF не публикует растение и не меняет коммерческие поля цены, SKU, размера или количества автоматически.

### Границы изменений и проверка
- Изменены только Manager UI и API диагностических ответов.
- Публичные header/menu/footer, каталог, корзина, checkout, D1 schema/data, Sanity documents/assets и permission flags не изменялись.
- После деплоя требуется ручной тест трёх сценариев продавца, трёх фильтров владельца, выбора фото с телефона и двух диагностических окон на успешном и неуспешном ответах.
- Production build/deployment confirmation: pending at time of this documentation entry.


## 26. Исправление отображения результата AI/GBIF Workflow — 03.11.2026

- Cloudflare Workflow status содержит результат успешного выполнения внутри `status.output`; Manager UI теперь читает `output.careDraft` и `output.diagnostics`, чтобы после успешной проверки показать найденную таксономию и предложенные характеристики.
- При ошибке Workflow исходный JSON может находиться внутри `status.error.message`. UI теперь разбирает этот вложенный JSON и извлекает `httpStatus`, `response.error`, `response.diagnostics`, а также тип ошибки Workflow.
- Диагностические ключи показываются с русскими поясняющими подписями; технические значения модели, выбранного таксона и этапа сохраняются без искажения.
- Исправление ограничено `src/manager/PlantPublicationEditor.tsx`. Данные заявок, права, AI/GBIF алгоритмы и публичные компоненты не изменялись.
- Production build/deployment для commit `ba750d0c27eeba0e30a6e482d22ac47529e7d291` завершены успешно; deployment ID `4a921314-46c2-4b9f-acde-2b8e63464923`.


## 27. Полная расшифровка результата ботанической проверки — 03.11.2026

- В диагностическом окне успешной проверки показываются сведения из `careDraft.identity`: исходное и предложенное латинские названия, статус сопоставления, seller/visual GBIF summaries, визуальные и текстовые кандидаты, результаты анализа фотографии, таксономический ранг, уверенность и источник определения.
- Выводятся все непустые предложенные характеристики, руководство по уходу, уверенность ИИ по каждому полю и предупреждение о пределах достоверности.
- Полный `careDraft` доступен в раскрываемом блоке технических подробностей; это диагностический просмотр, а не публикация и не автоматическое подтверждение характеристик.
- Кодовая правка ограничена `src/manager/PlantPublicationEditor.tsx`; данные D1, документы/assets Sanity, permissions и публичные страницы не менялись.
- Commit `338e42d8a791315c4295fa01b8c108671033ac3d`; production deployment status проверяется.


## Миниатюры фотографий в Manager — 03.11.2026

- Продавец видит единый список фото из сохранённого черновика, библиотеки Sanity и локального выбора устройства; счётчик ограничен 10 фото.
- Каждая миниатюра имеет крестик. Сохранённые изображения отмечаются к исключению из черновика и применяются только при сохранении; новые фото из библиотеки/устройства можно снять до сохранения.
- Отправка заявки блокируется при наличии несохранённых добавлений/удалений фотографий.
- Владелец и менеджер используют общий PlantPublicationEditor с компактными миниатюрами, крестиком, выбором главного изображения и ALT-полями.
- Операции изменяют только ссылки в заявке/карточке; оригинальные Sanity Assets не удаляются.
- Ограничение: внутренний Manager UI и документация; публичные страницы, Header, меню, Footer, корзина, checkout, права и D1 schema/data не меняются.
- Ручные проверки перед production: комбинация 2 фото из библиотеки + 1 с телефона; удаление каждого типа фото; сохранение и повторное открытие черновика; проверка owner и manager.



## 2026-11-03 — Диагностика upstream-ошибок Sanity в Manager plant catalogue API

- `GET /api/manager/plant-catalog` загружает список активных растений из Sanity project `bxvcy0qs`, dataset `plants`.
- Если Sanity отвечает неуспешным HTTP-статусом, Pages Function пишет в Cloudflare Real-time Logs структурированную запись с request ID, этапом `sanity_catalog_query`, HTTP status/statusText, content-type и безопасным фрагментом тела ответа (до 600 символов).
- Фрагмент проходит маскирование распространённых Bearer/API-токенов и значений полей token/secret/password/authorization. Не логируются входные заголовки, cookie, токены, payload растений или изображения.
- Клиенту возвращается JSON HTTP 502 с requestId и stage, чтобы связать сообщение Manager с записью Cloudflare. Технические детали upstream-ответа не передаются клиенту.
- Commit с изменением кода: `2bafb18a668da4d1d79e79586dd8fa4fca4057ce`; последующее обновление документации фиксирует этот диагностический шаг. Production deployment и ручная проверка ещё ожидаются.
- Не изменялись D1 schema/records, роли/права, документы и assets Sanity, публичный каталог или checkout.


## 2026-11-03 — Manager: управление заказами

- API: `functions/api/manager/orders.ts`; UI: `src/manager/OrdersManager.tsx`, подключён из `src/manager/ManagerApp.tsx`.
- Migration `0008_manager_orders` добавляет `is_test`, `payment_status`, `manager_note`, даты изменения/оплаты/архива/отмены и таблицу `order_events`. Только четыре утверждённых тестовых номера помечаются `is_test=1`.
- Права `canViewOrders`, `canEditOrders`, `canDeleteTestOrders`; owner — полный доступ, active manager — три согласованных права, seller — без доступа.
- Денежные поля `*_cents` являются источником истины; legacy decimal поля синхронизируются. Реальные заказы физически не удаляются.


## 14. 2026-11-04 — Checkout trigger и выбор товаров в Manager

- Production SQL source of truth — Cloudflare D1 binding `DB`; Supabase не используется.
- В таблице `order_events` есть поля `actor_id`, `actor_name`, `actor_role`, `event_type`, `from_status`, `to_status`, `note`, `metadata`, `created_at`.
- Проверка production D1 обнаружила, что trigger `trg_orders_order_created` имел несовпадающие списки столбцов и значений при вставке события. Исправление оформлено отдельной additive migration `0009_fix_order_created_trigger.sql`, которая заменяет только trigger. Не запускать повторно вручную, если версия уже присутствует в `schema_migrations`.
- Миграция не обновляет, не удаляет и не переписывает существующие строки `orders` или `order_events`.
- Checkout: `POST /api/orders`; ошибки почты/PDF остаются best-effort после успешной записи заказа. Не считать получение письма доказанным только по успешной записи заказа; проверять отдельно.
- Manager product browser: `src/manager/OrderCatalogBrowser.tsx` и `functions/api/manager/order-products.ts`. Источники — Sanity `production` (оборудование) и `plants` (растения). Категории/подкатегории загружаются из Sanity, растения отображаются отдельными вариантами `saleVariants`.
- Вариант растения сохраняется в snapshot заказа по `variantKey`, SKU, цене и размеру; цена каталога может быть скорректирована менеджером перед сохранением.
- Не изменялись публичные Header/menu/Footer, публичный каталог, корзина, Sanity документы и схема Sanity.
- Production D1 migration `0009_fix_order_created_trigger` applied on 2026-11-04. Cloudflare Pages production deployment `7ad8eeef-8ab7-4abe-b4f8-96cd0ebe4978` for commit `0d4eda429f313e55060536102bde4718ff5293f7` completed successfully. Manual owner confirmation of a real checkout, PDF and both email deliveries is still pending; no production test order was created by the assistant.


## 2026-11-04 — Manager order catalogue: fallback Sanity project ID

- Production Cloudflare Pages project `florial` содержит публичную переменную `VITE_SANITY_PROJECT_ID`, но не содержит отдельной server-side переменной `SANITY_PROJECT_ID`. `SANITY_API_TOKEN` присутствует как secret binding; его значение не читалось и не выводилось.
- Причина ответа `Sanity catalogue is not configured.` в `GET /api/manager/order-products`: endpoint проверял только `env.SANITY_PROJECT_ID`, хотя основной frontend project ID уже настроен под именем `VITE_SANITY_PROJECT_ID`.
- `ManagerEnv` дополнен типом `VITE_SANITY_PROJECT_ID`; endpoint использует `SANITY_PROJECT_ID || VITE_SANITY_PROJECT_ID`, сохраняя server-side token requirement. Приоритет остаётся за специальной server-side переменной, если она будет добавлена позднее.
- Изменение ограничено конфигурационным чтением каталога заказов. Не менялись Sanity documents/assets, D1 schema/data, permissions, order records, checkout, cart, public catalogue, Header, menu или Footer.
- После deployment требуется проверить категории и выбор товаров отдельно для datasets `production` и `plants` в Manager; до такой проверки ручной результат считается pending.

 
## 2026-11-05 — SEO-метаданные официального логотипа (подготовка PR)

- Подтверждённый Sanity document: `photo` с slug `oficialno-logo-florial-gradinski-centar`; опубликованный asset PNG имеет размеры 1547 × 581 px.
- Header ранее использовал `siteName` как ALT и не получал локализованные ALT из вложенного поля `image`; PR добавляет чтение `image.alt/altEn/altRu`, локализованные title и intrinsic dimensions.
- Схема `photo` расширяется аддитивно полями `titleEn/titleRu` и `seoDescriptionEn/seoDescriptionRu`; существующие поля и данные не удаляются.
- JSON-LD Organization получает `logo` типа ImageObject с текущим абсолютным URL и размерами. Это горизонтальный файл 1547 × 581; соответствие отдельным требованиям Google к квадратному изображению логотипа не заявляется.
- Текущие тексты Sanity: BG ALT и BG SEO description заполнены; EN/RU ALT пусты, локализованные title/description отсутствуют. Наполнение документа и публикация Sanity остаются отдельным шагом после проверки/согласования PR.
- Дополнительно проверен сам Sanity imageAsset: `originalFilename=florial-logo-gardencenter.png`, asset title и description на BG заполнены, `altText` отсутствует. GROQ запрашивает asset-level title/description/altText; Header использует asset alt/title как fallback, если локализованные поля photo document не заполнены.
- Middleware задаёт локализованный `og:image:alt` для стандартного логотипа; если страница передаёт собственное OG-изображение, используется заголовок этой страницы.
- PR/production deployment и Studio schema deployment не считаются завершёнными до проверки GitHub Actions и фактических статусов сервисов.


## 2026-11-05 — Published photo ALT/title metadata

- Sanity `photo` schema now includes `title` (BG), `titleEn` (EN), `titleRu` (RU), plus nested `image.alt`, `image.altEn`, `image.altRu`. Frontend renders localized logo ALT/title for the active locale.
- Existing BG `seoDescription` remains unchanged; no EN/RU SEO-description fields were added.
- Official Florial logo document `bf2d25a6-cefe-4d25-9145-3b45a206299b` was published with all six localized ALT/title values. Existing BG content was preserved.
- PR #88 merged to `main` at `9faeef8a9daf60258e3bf59483099d14cb1f8320`; Cloudflare Pages production deployment `efa67989-b723-468b-88ea-7036e9b77715` completed successfully.


## 2026-11-05 — Редакционный стандарт SEO категорий BG/RU/EN и массовая публикация

### Подтверждённое состояние Sanity

- Выполнена редакционная генерация SEO для всех опубликованных категорий двух каталогов: 54 категории оборудования в dataset `production` и 17 категорий растений в dataset `plants`.
- Всего обработана 71 категория × 3 языка = 213 локализованных SEO-наборов.
- Для каждой языковой версии заполнены H1, Meta Title, Meta Description и keywords.
- Активные поля опубликованы: BG — `seo.h1`, `seo.metaTitle`, `seo.metaDescription`, `seo.keywords`; EN — `translations.en.seo.*`; RU — `translations.ru.seo.*`.
- Также сохранены редакционные предложения `seo.suggested` и локализованные `translations.en/ru.seo.suggested` с `generatorVersion: "assistant-editorial-v1"` и статусом `approved`.
- Read-only проверка опубликованной перспективы Sanity после публикации подтвердила наличие всех четырёх полей для BG/EN/RU у всех 71 категорий. Незавершённых наборов не обнаружено.
- Проверенные диапазоны: Meta Title — 14–58 символов; Meta Description — 57–153 символа. Это техническая проверка длины, а не гарантия позиций в Google.
- При записи обнаруживались validation warnings на отдельных старых полях документов (например, legacy `seoTitle`, `seoDescription`, `order`). Эти поля не удалялись и не переписывались. Никакие товары, цены, категории, slug, изображения, noIndex или другие бизнес-данные не менялись.
- Примеры проверенных локализованных H1: `rotorni-razprskvachi` — BG «Роторни разпръсквачи за средни и големи тревни площи», EN «Rotor Sprinklers for Medium and Large Lawns», RU «Роторные дождеватели для средних и больших газонов»; `maslini` — BG «Маслинови дървета за градината, двора и терасата», EN «Olive Trees for Gardens, Yards and Terraces», RU «Оливковые деревья для сада, участка и террасы».

### Редакционный стандарт для будущей генерации

1. Болгарский — основной исходный язык и коммерческая версия. Сначала создаётся полноценный естественный болгарский текст, затем EN и RU адаптируются по смыслу, а не переводятся дословно.
2. Перед написанием изучаются фактические данные категории: название, slug, родительская категория, описание, локализованные данные, реальные товары, бренды, характеристики, совместимость и соседние категории. Не придумывать ассортимент, технические свойства, наличие или применение.
3. Для каждой локали готовятся:
   - H1: точное название категории с понятным назначением и естественной поисковой формулировкой;
   - Meta Title: целевой диапазон 45–60 символов, уникальный и ориентированный на запрос;
   - Meta Description: ориентир 120–155 символов, максимум 160, с конкретной пользой и коммерческим намерением без повторов;
   - 5–8 релевантных keywords/ключевых фраз, без механического набора синонимов.
4. Использовать отраслевую терминологию:
   - BG: «автоматични поливни системи», «разпръсквачи», «роторни разпръсквачи», «статични разпръсквачи», «дюзи», «електромагнитни клапани», «контролери», «капково напояване», «тръби и фитинги», «маслинови дървета», «декоративни растения».
   - EN: “automatic irrigation systems”, “rotor sprinklers”, “spray sprinklers”, “solenoid valves”, “irrigation controllers”, “rotary nozzles”, “drip irrigation”, “irrigation fittings”, “olive trees”, “ornamental plants”.
   - RU: «системы автоматического полива», «роторные дождеватели», «статические дождеватели», «форсунки», «электромагнитные клапаны», «контроллеры полива», «капельный полив», «трубы и фитинги», «оливковые деревья», «декоративные растения».
5. Географические слова Болгарии (Бургас, Несебър, Слънчев бряг, Свети Влас, Поморие, Равда, Созопол и другие зоны обслуживания) добавлять только там, где они действительно усиливают релевантность страницы. Не добавлять географию автоматически во все категории.
6. SEO разных категорий должно отличаться по ассортименту и назначению. Не использовать один общий шаблон для всех фитингов или растений, если доступные данные позволяют описать конкретную категорию точнее.
7. Не обещать характеристики, совместимость, профессиональный результат или наличие, если это не подтверждено источником. Если данных недостаточно, писать нейтрально и фиксировать вопрос для владельца.
8. Перед публикацией проверять естественность болгарского, качество адаптации EN/RU, уникальность, соответствие фактическому каталогу, длины метаданных и отсутствие спама.

### Разделение программного и редакционного генераторов

- Программный генератор `src/lib/categorySeo.ts` (PR #92, merge commit `7dbc7e47f22a5f3aa8267fdde52963274ae7614d`) — детерминированный словарь и набор правил. Он предназначен для быстрого создания базовых предложений и заполнения пропусков; сам по себе не эквивалентен полноценному редакционному анализу ассортимента.
- Редакционный процесс `assistant-editorial-v1` использует содержимое категории и доступный контекст каталога, формирует более индивидуальные тексты и адаптации на трёх языках. Результат текущей массовой работы уже опубликован в Sanity; это не означает, что программа автоматически научилась воспроизводить редакционное качество.
- При развитии программного генератора стремиться к контекстной генерации с учётом реальных товаров, брендов, характеристик, категорий-родителей и географии. Не подключать платный AI API и не добавлять секреты/переменные без отдельного решения владельца.
- Для обычного запуска генератора в Manager сохранять результат сначала в `seo.suggested`; активные SEO-поля не перезаписывать. Публикация активных полей выполняется только после явного разрешения владельца и проверки результата. Исключение — массовая публикация 05.11.2026, для которой владелец дал прямое поручение.
- Рекомендуемые рабочие режимы: (1) полная генерация предложений для всех категорий; (2) заполнение только пустых полей; (3) сравнение программного результата с редакционным эталоном. В режиме «пустые поля» нельзя затирать уже существующее активное или предложенное значение.

### Ограничения проверки

- Подтверждено содержимое опубликованных документов Sanity. Отдельная проверка итоговых HTML meta-тегов на live-домене и переобход страниц Google в рамках этой операции не выполнялись.
- Успешная запись Sanity сама по себе не подтверждает завершение нового Cloudflare Pages deployment или обновление поискового индекса.
- Для редакционного контроля приоритетно повторно проверять категории с однотипным ассортиментом (особенно группы фитингов и редких комплектующих), категории без описаний и категории с близкими названиями.

### Правило для следующих чатов

Перед SEO-задачей прочитать этот раздел и актуальные исходники `src/lib/categorySeo.ts`, `src/pages/CategoryPage.tsx`, `functions/_middleware.ts`, Manager endpoint `functions/api/manager/category-seo.ts` и текущие Sanity schema/query. Не полагаться на старые числа категорий: пересчитать опубликованные документы в обоих datasets. Не подключаться к Supabase — действующая SQL-инфраструктура Florial использует Cloudflare D1.


## 2026-11-05 — Локализованный блок консультации на страницах категорий

- Общий `helpBlock` поддерживается для категорий поливочного оборудования в Sanity dataset `production` и категорий растений в dataset `plants`.
- Структура: `title`, `text`, `buttonLabel` на болгарском; `translations.en/ru` для этих трёх полей; `buttonUrl` — единый относительный внутренний адрес услуги или статьи.
- Frontend отображает блок для обоих типов категорий. Для растений используется отдельный резервный маршрут `/services/zasazhdane-na-rasteniya`, для оборудования — `/services/avtomatichno-napoyavane`.
- Разрешённые пользовательские маршруты кнопки: только относительные пути с префиксом `/services/` или `/blog/`; внешние URL не принимаются.
- GROQ-запросы обеих коллекций должны включать `helpBlock`. Новые тексты заполняются отдельно для каждой категории на BG/RU/EN. CTA выбирается по существующей релевантной статье или услуге; если профильная статья ещё не создана, используется общая услуга. Для будущих статей о посадке отдельных видов растений достаточно обновить `helpBlock.buttonUrl` соответствующей категории.
- Массовое заполнение документов выполняется только после проверки schema deploy для обоих datasets. Существующие значения и SEO-поля не должны перезаписываться.


## 2026-11-05 — Текущее состояние локализованных блоков помощи категорий

- PR #94: `d0e526b8361ef860b63f2a5c821b5f39db55eed1`; production Cloudflare Pages deployment `6491a004-a7ea-4810-8b84-607057a2f4f9` — `success`.
- Sanity datasets: `production` — 54 категории оборудования; `plants` — 17 категорий растений. Все 71 опубликованные категории имеют заполненный `helpBlock` на BG/RU/EN.
- Структура блока: BG `title`, `text`, `buttonLabel`; `translations.en/ru` для тех же трёх полей; `buttonUrl` — относительный внутренний адрес `/services/*` или `/blog/*`.
- Frontend отображает блок и для поливочного оборудования, и для растений. Plant categories GROQ projection включает `helpBlock`. Локализация ссылки выполняется через `localizedHref`.
- Проверенные CTA: монтаж/ремонт разпръсквачи, монтаж/настройка програматори, монтаж/обслуживание клапани, капково напояване, общо автоматично напояване, засаждане на растения и статья за маслини.
- Для `palmi-yuki` и других категорий без профильной статьи используется `/services/zasazhdane-na-rasteniya`. После создания статей о технологии посадки конкретных видов заменить `helpBlock.buttonUrl` у соответствующих категорий.
- Проверка published perspective: equipment 54/54, plants 17/17; все обязательные локализованные поля и URL заполнены. Существующие SEO, изображения, цены, описания и продуктовые документы не изменялись.


## 2026-11-05 — Обязательный стандарт заполнения helpBlock новых категорий

### Назначение блока

`helpBlock` — локальный консультационно-информационный блок конкретной категории каталога. Он должен объяснять именно ассортимент и задачу этой категории, помогать выбрать совместимые товары и вести к наиболее релевантной услуге или статье Florial. Это не универсальный рекламный текст, который можно копировать между родительской категорией и подкатегориями.

### Структура данных Sanity

Для категории в соответствующем dataset (`production` — оборудование, `plants` — растения) заполнять:

- `helpBlock.title` — короткий, конкретный заголовок на болгарском (основной язык);
- `helpBlock.text` — уникальный полезный текст на болгарском;
- `helpBlock.buttonLabel` — понятный CTA на болгарском;
- `helpBlock.translations.en.title/text/buttonLabel` — полноценная смысловая локализация на английский;
- `helpBlock.translations.ru.title/text/buttonLabel` — полноценная смысловая локализация на русский;
- `helpBlock.buttonUrl` — единый внутренний относительный маршрут существующей услуги или статьи.

Не создавать дополнительные поля и не менять схему без отдельной необходимости и проверки. Сохранять существующие значения CTA, если они подходят категории.

### Правила написания

1. Сначала определить фактическое назначение категории по её названию, slug, родителю, дочерним категориям и товарам. Не писать текст только по названию, если состав ассортимента показывает более точную специализацию.
2. Для родительской категории описывать весь её ассортимент и ключевые группы дочерних категорий. Не подменять общий смысл одной узкой подкатегорией. Для подкатегории писать только о её собственных товарах и задаче.
3. Заголовок должен быть уникальным и предметным. Избегать одинаковых общих заголовков у соседних и родительских категорий.
4. Текст должен давать практическую пользу: что входит в категорию, для каких задач используется, какие параметры/совместимость учитывать при выборе и когда обратиться за консультацией. Не перечислять товары, которых фактически нет в этой категории, и не обещать неподтверждённые характеристики.
5. Болгарский — естественный исходный коммерческий текст с корректной болгарской терминологией. Английский и русский — отдельные смысловые адаптации, а не дословный машинный перевод.
6. Географию упоминать естественно и только там, где она добавляет пользу. Не вставлять координаты, искусственные SEO-перечни населённых пунктов или не согласованные локации. Не упоминать Созополь/Sozopol.
7. CTA должен вести к реально существующей и релевантной странице. Предпочитать профильную услугу или статью; если её нет — использовать подходящую общую услугу. `buttonUrl` должен быть относительным внутренним путём с разрешённым префиксом `/services/` или `/blog/`; не выдумывать URL и не использовать внешний адрес.
8. Кнопка должна обещать именно то действие, куда ведёт ссылка. Локализовать `buttonLabel` на BG/RU/EN.

### Обязательная проверка перед публикацией

- Прочитать текущий документ и проверить его `_id`, `_rev`, slug, родителя и дочерние категории; сравнить helpBlock с соседними категориями, чтобы исключить копирование чужого текста.
- Проверить заполненность всех девяти локализованных полей: BG title/text/buttonLabel, EN title/text/buttonLabel, RU title/text/buttonLabel, а также единого `buttonUrl`.
- Проверить уникальность заголовков в соответствующем dataset, корректность терминологии и фактическое соответствие текста ассортименту.
- Проверить, что CTA URL реально существует в маршрутах сайта и относится к нужной теме.
- Сначала сохранять draft, перечитать draft и сравнить с ожидаемыми полями; затем публиковать только документ с ожидаемой ревизией. После публикации перечитать `published` perspective и проверить итоговые значения.
- Не перезаписывать SEO, изображения, описание категории, порядок, родителя, товары и другие поля, если они не входят в согласованную задачу. Не удалять и не менять существующие CTA без проверки.
- Для массового заполнения сначала подготовить и проверить все тексты и соответствия категорий, затем публиковать контролируемыми партиями; вести список ID и ревизий.

### Контрольный принцип

Каждый helpBlock отвечает на вопрос: «Что именно покупатель найдёт в этой категории, как правильно выбрать и куда обратиться за профильной помощью?» Для родительской категории ответ должен охватывать весь её раздел; для подкатегории — только её узкий ассортимент.


## 2026-11-05 — Стандарт семантики и desktop-представления категорий

- В src/pages/CategoryPage.tsx названия реально выводимых непосредственных подкатегорий в ссылках-карточках должны иметь тег H2. Заголовок страницы остаётся H1; названия товарных карточек остаются H3. Не использовать H2 для произвольных декоративных подписей и не менять иерархию заголовков товаров.
- На desktop заголовок H1 и краткое описание располагаются в двух третях ширины, справа выводится изображение текущей категории из уже полученного Sanity category.image (imageUrl). Для ALT/title использовать getCategoryImageText(category, language, kind), чтобы применять локализованные редакторские метаданные и fallback по названию категории.
- Блок изображения скрывается на мобильных viewport. Если imageUrl отсутствует, текстовая часть занимает всю доступную ширину — пустой placeholder-колонки не создавать.
- Данные категорий уже загружают imageUrl и локализованные imageAlt/imageAltEn/imageAltRu, imageTitle/imageTitleEn/imageTitleRu в src/App.tsx; не добавлять новые поля, не менять Sanity schema и не записывать документы ради этого интерфейсного изменения.
- При добавлении новых категорий проверять наличие подходящего изображения и локализованных ALT/title в соответствующем dataset (production или plants). Отсутствие изображения не должно ломать layout или добавлять пустую область.

### Область действия: все каталоги Florial

- Этот стандарт обязателен для **всех страниц категорий каталога Florial**: оборудования для полива из Sanity dataset `production` и растений из dataset `plants`, во всех локалях BG/RU/EN. Он действует для родительских категорий и подкатегорий; не создавать отдельные варианты вёрстки без согласования.
- H2 используется только для реально отображаемых непосредственных подкатегорий текущей страницы. Если дочерних категорий нет, фиктивные H2 не создаются. H3 остаётся уровнем названия каждой карточки товара или растения.
- Верхний блок категории имеет единую компоновку на desktop: текстовая часть занимает примерно 2/3 ширины, изображение текущей категории — примерно 1/3 справа. На мобильном изображение скрывается, текст занимает всю ширину. Если изображения нет, место под него не резервируется.
- Изображение верхнего блока категории обязательно выводится целиком: использовать `object-contain`, не `object-cover`. Допустимы свободные поля внутри фотоблока при несовпадении пропорций; нельзя обрезать фотографию ради заполнения рамки. Это правило относится к изображениям категорий оборудования и растений, но не меняет отдельные правила карточек подкатегорий, товаров или услуг.
- При создании новых каталогов, шаблонов или альтернативных страниц категорий переиспользовать этот стандарт, текущую реализацию `CategoryPage.tsx` и helper `getCategoryImageText`; не дублировать и не разводить семантику и responsive-поведение.
- Перед выпуском проверять обе группы каталога на desktop и mobile: H1 страницы, H2 видимых подкатегорий, H3 карточек товаров/растений, локализованные ALT/title и отсутствие пустой колонки без изображения. Header, меню и Footer в рамках такой проверки не менять.


## 2026-11-08 — Дорожная карта модернизации услуг и заявок

- Создан единый план `docs/ROADMAP_SERVICES_AND_LEADS.md` с шестью автономными промптами для последовательной работы в отдельных чатах.
- Зафиксированы решения владельца: управление услугами в Sanity; заявки в D1 и Florial Manager; owner access обязательный, manager access только по отдельному permission; email-уведомление владельцу через серверную конфигурацию; клиентское подтверждение при указанном email; приватные фото; срок хранения заявок 365 дней; зоны и тарифы доставки как отдельные редактируемые данные Sanity.
- Указанный владельцем адрес получателя не записывается в публичную документацию и не должен хардкодиться в frontend или публичном репозитории; использовать только проверенную серверную конфигурацию.
- Расстояния доставки и любые расхождения тарифов с текущим production-кодом требуют проверки; значения не угадывать и не менять без решения владельца.
- Дорожная карта задаёт контрольные зависимости: (1) Sanity model, (2) service pages/UI, (3) delivery migration, (4) leads API/D1/photos/email, (5) Manager, (6) end-to-end QA.
- Все шесть этапов имеют статус NOT STARTED на дату создания плана. Этот документационный change не изменяет runtime, Sanity documents/schemas, D1, Cloudflare settings/secrets, Resend configuration, orders, checkout, Header, menu или Footer.
- См. `docs/ROADMAP_SERVICES_AND_LEADS.md` для полного содержания, автономных промптов, критериев завершения и правил перехода между этапами.
