# Manager — дорожная карта уведомлений и Web Push

Дата актуализации: 2026-11-21  
Рабочий PR: [#450](https://github.com/omaraandrey-dev/florial/pull/450)  
Рабочая ветка: `feature/manager-order-notifications`  
Последний подтверждённый commit реализации: `b87df49b954712641ffa44e0845f4ef4ddd05728`
Текущий HEAD PR после документационной актуализации: `8b744771018d3a43a7e8e8c149806295d0287b70`  
База PR на момент сверки: `main` = `5d39d0098357ec8b9d12e6b8b0f4e7b1d5cdc96d`

> Этот документ — единая карта текущей задачи. Статус кода/CI/Preview не означает, что Web Push уже работает в Production. Production rollout ещё не выполнен.

## 1. Цель и утверждённые правила

| Роль | Новые реальные заказы | Новые заявки на услуги |
|---|---:|---:|
| Owner | Да | Да |
| Manager | Да | Нет |
| Seller | Да | Нет |

- Уведомление о заказе должно вести в раздел заказов Manager; уведомление о заявке — в раздел заявок на услуги.
- Просмотр заказов не даёт автоматически право редактировать или удалять: существующие `canViewOrders`, `canEditOrders` и `canDeleteTestOrders` остаются раздельными.
- Доступ к заявкам определяется существующими правами просмотра; push по заявкам отправляется только активному Owner.
- Тестовые заказы (`is_test=1`) не уведомляют.
- В push payload не передаются телефон, email, адрес и другие контактные данные клиента.
- Подписка включается/отключается сотрудником явным действием на устройстве. Offline caching не добавляется; Manager остаётся online-only.
- Список/счётчик заказов обновляется сразу при открытии Manager, затем не чаще одного раза в 15 минут. Push — отдельный механизм и не зависит от polling.

## 2. Что уже сделано

### Реализация в PR #450

- [x] Seller и Manager могут просматривать заказы; права редактирования и удаления тестовых заказов не расширены.
- [x] Polling списка/счётчика заказов ограничен интервалом 15 минут, включая возврат приложения в фокус.
- [x] Добавлена D1 migration `0017_manager_push_subscriptions.sql` для хранения подписок устройств по staff user ID.
- [x] Добавлены API регистрации и удаления подписок; владелец подписки определяется из авторизованной Manager session, а не из данных браузера.
- [x] Добавлена проверка HTTPS endpoint, допустимых push-provider доменов, ключей подписки и запрет передачи endpoint между сотрудниками.
- [x] Добавлена отправка push после успешной записи заказа/заявки в D1: реальные заказы — Owner/Manager/Seller; заявки — только активный Owner.
- [x] Тестовые заказы исключаются; ошибки push не должны ломать оформление заказа или отправку заявки; запрос к provider ограничен таймаутом и не следует redirect.
- [x] Истёкшие endpoints с ответами 404/410 удаляются.
- [x] В Manager добавлены болгарские controls «Включи известия» / «Изключи известия» с запросом разрешения только после явного клика.
- [x] Service Worker показывает push и обрабатывает переход по нажатию в соответствующий раздел Manager.
- [x] Добавлены регрессионные тесты и SQLite-проверка D1 migration 0017.
- [x] Документация реализации, архитектуры и release prerequisites присутствует в PR-ветке.

### Проверки реализации

Последний подтверждённый SHA: `b87df49b954712641ffa44e0845f4ef4ddd05728`.

- [x] GitHub Actions Blog and Studio validation: run `44794576684` — success; включая typecheck, lint, 357 тестов, website build, Studio typecheck/build и migration dry-run.
- [x] GitHub Actions D1 migration validation: run `44794576517` — success; включая SQLite-проверку migration 0017.
- [x] Cloudflare Pages Preview deployment `bf7acd17-23ce-4180-821c-54063866f68e` — все стадии успешны для указанного SHA; Preview: https://bf7acd17.florial.pages.dev.
- [x] PR #450 открыт, Draft, не объединён; mergeable=true на последней зафиксированной проверке в предыдущем handoff. Перед следующим решением повторно проверить метаданные PR и CI.

## 3. Что ещё требуется сделать

### Этап A — Cloudflare-доступ и безопасный Production D1 preflight

**Завершено 2026-11-21**

- [x] Cloudflare connector авторизован; read-only D1 API доступен.
- [x] Выполнены только read-only запросы к Production D1.
- [x] Migration ledger прочитан: последняя применённая версия — `0016_remove_legacy_submission_permissions`; версия `0017_manager_push_subscriptions` отсутствует.
- [x] В `sqlite_master` подтверждено отсутствие таблицы `manager_push_subscriptions`; это ожидаемо до применения migration 0017.
- [x] Подтверждена родительская таблица `catalog_staff_profiles`; `user_id TEXT PRIMARY KEY`.
- [x] `PRAGMA foreign_key_check` выполнен успешно, нарушений не найдено.
- [x] Сверены существующие таблицы и индексы, относящиеся к родительской таблице сотрудников.
- [x] Migration 0017 проверена в изолированной SQLite-базе; отдельный GitHub Actions migration workflow на текущем HEAD завершился успешно.

**Ограничение проверки:** `PRAGMA integrity_check` через Cloudflare D1 API возвращает `SQLITE_AUTH`. Это означает, что данный PRAGMA недоступен через используемый API-контекст; это не доказательство повреждения базы и не ошибка общего доступа к D1. Другие read-only запросы выполняются успешно.

**Итог этапа:** preflight не выявил конфликтов миграции с текущей Production-схемой. Migration 0017 не применялась; Production D1 schema/data не изменялись.

### Этап B — подготовить Production D1

- [x] Read-only preflight завершён; текущая схема совместима с additive migration 0017 по проверенным объектам.
- [ ] Применить migration 0017 к Production D1 — **не выполнено**.
- [ ] После применения перечитать migration ledger и структуру таблицы.
- [ ] Проверить индексы, уникальность endpoint и foreign-key constraint после применения.
- [ ] Не менять существующие заказы, заявки, профили сотрудников или сессии.

**Контроль безопасности:** перед фактическим Production write требуется отдельное подтверждение владельца именно на применение migration 0017. До него никаких изменений Production D1 не выполнять.

### Этап C — настроить VAPID в Cloudflare Pages

- [ ] Сверить имена переменных и ожидаемый формат по текущему коду PR #450.
- [ ] Создать VAPID key pair.
- [ ] Настроить `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` в правильном Production runtime scope.
- [ ] Private key хранить только как Cloudflare secret; не выводить в чат, GitHub, commit, документацию или логи.
- [ ] Public key и subject размещать в соответствующем типе configuration согласно требованиям кода/Cloudflare; не угадывать формат subject.
- [ ] Проверить конфигурацию безопасным read-only способом, не раскрывая private key.

**Важно:** D1 migration и VAPID config сами по себе не включат push на Production, пока код PR #450 не попадёт в Production через merge и deployment из `main`.

### Этап D — принять решение по выпуску

- [ ] Перед merge получить свежий SHA `main`, актуальный head PR #450, mergeability и статусы CI.
- [ ] Проверить, что PR не содержит посторонних изменений и документационные SHA синхронизированы с фактическим head.
- [ ] Отдельно получить команду владельца на снятие Draft/merge. До неё PR остаётся Draft и не объединяется.
- [ ] После разрешённого merge проверить Production deployment по точному merge SHA и наличие нужных endpoints.

### Этап E — реальный тест на Android/Chrome

После выпуска кода и настройки Production:

- [ ] Войти в Manager под Owner и включить уведомления на Android/Chrome.
- [ ] Проверить регистрацию подписки и сохранение её за правильным staff user ID.
- [ ] Создать согласованный тестовый реальный по типу заказ (без реального клиента) и проверить push Owner, Manager и Seller.
- [ ] Отдельно убедиться, что тестовый заказ `is_test=1` push не вызывает.
- [ ] Создать согласованную тестовую заявку и проверить, что push получает Owner.
- [ ] Убедиться, что Manager и Seller не получают уведомление о заявке.
- [ ] Проверить открытие правильного раздела по нажатию уведомления.
- [ ] Проверить выключение уведомлений, удаление подписки и повторное включение.
- [ ] Зафиксировать фактические результаты по каждой роли и устройству.

## 4. Что сейчас НЕ сделано / не подтверждено

- Production migration 0017 **не применена**; таблица `manager_push_subscriptions` отсутствует.
- VAPID public/private/subject **не настроены** в Cloudflare Pages.
- Реальная Production subscription и доставка push **не проверены**.
- Android/Chrome permission, push delivery, notification click и unsubscribe **не протестированы**.
- Production код PR #450 **не выпущен**: PR открыт и Draft; Production продолжает работать на `main`.
- `PRAGMA integrity_check` не удалось выполнить через Cloudflare API из-за `SQLITE_AUTH`; остальные указанные read-only D1 запросы успешны.
- Успешный Pages Preview и CI не доказывают реальную работу Push в Production.

## 5. Ограничения scope

В рамках этой задачи не изменять:
- документы, переводы, ссылки и Sanity schema/data;
- существующие Production заказы и заявки;
- права редактирования/удаления заказов и существующую систему разрешений заявок;
- DNS, общие Cloudflare bindings, Resend и unrelated secrets;
- online-only поведение Manager и Service Worker.

Любое расширение scope согласовать отдельно.

## 6. Текущий статус и следующий шаг

**Статус: реализация, CI, Preview и read-only Production D1 preflight подтверждены. Production rollout ещё не начат.**

Последний проверенный кодовый/Preview HEAD `cb19924f35f451fcc399f753aafee4e7c902a52e` прошёл оба GitHub Actions workflow. После него в ветку внесены только документационные commits, текущий HEAD: `8b744771018d3a43a7e8e8c149806295d0287b70`.
- Blog and Studio validation: run `44854697815` — success.
- D1 migration validation: run `44854697868` — success.

Cloudflare Pages Preview deployment `4280bdb7-f9f0-4b0c-9a02-56ec10574cd4` успешно завершён из точного code/docs HEAD `cb19924f35f451fcc399f753aafee4e7c902a52e`; URL: https://4280bdb7.florial.pages.dev.

**Следующий шаг:** подготовить VAPID key pair и план настройки runtime configuration, не публикуя private key. Перед применением migration 0017 и записью Production secrets получить отдельное подтверждение владельца на эти конкретные изменения. PR остаётся Draft и не объединяется до отдельного решения.

## 7. История обновления

- 2026-11-21: актуализирован статус после повторной проверки Cloudflare. Доступ к Cloudflare и Production D1 подтверждён read-only запросами; миграция 0017 не применена; migration ledger остаётся на 0016; `catalog_staff_profiles(user_id)` подтверждена; foreign-key check без нарушений. `PRAGMA integrity_check` недоступен через API (`SQLITE_AUTH`). GitHub Actions и Pages Preview подтверждены для HEAD `cb19924f35f451fcc399f753aafee4e7c902a52e`; после него были только документационные commits, последний — `8b744771018d3a43a7e8e8c149806295d0287b70`. Production migration, VAPID secrets и Android push QA остаются незавершёнными.
