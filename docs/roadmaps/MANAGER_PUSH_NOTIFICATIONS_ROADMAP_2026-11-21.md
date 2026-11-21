# Manager — дорожная карта уведомлений и Web Push

Дата актуализации: 2026-11-21  
Рабочий PR: [#450](https://github.com/omaraandrey-dev/florial/pull/450)  
Рабочая ветка: `feature/manager-order-notifications`  
Последний подтверждённый commit реализации: `b87df49b954712641ffa44e0845f4ef4ddd05728`  
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

### Этап A — восстановить Cloudflare-доступ и выполнить безопасный preflight

- [ ] Владелец переподключает Cloudflare connector в ChatGPT.
- [ ] Повторно проверить валидность Cloudflare credentials и доступ к нужному аккаунту.
- [ ] Убедиться, что разрешён как минимум D1 Read; не расширять scopes без необходимости.
- [ ] Выполнить только read-only Production D1 проверки: `sqlite_master`, migration ledger, наличие и структура `catalog_staff_profiles(user_id)`, foreign-key check, integrity check.
- [ ] Сверить фактическую Production-схему с migration 0017 и проверить, что migration ещё не применена.
- [ ] Если ledger/schema не подтверждают безопасное состояние — остановиться, ничего не применять и описать расхождение.

**Текущая блокировка:** предыдущая проверка Cloudflare завершилась `401 Invalid API Token`; SQL read-only запросы завершились `SQLITE_AUTH`. Поэтому Production D1 состояние не подтверждено. Cloudflare Production account/project и D1 database ID, ранее прочитанные из metadata: account `785978ccc2764d18d17b85fd4ad10cc1`, database `florial-db`, ID `5fbb0e47-8439-493c-821a-6945eef7d8b2`. Metadata не заменяет проверку живой схемы.

### Этап B — подготовить Production D1

- [ ] Только после успешного read-only preflight применить additive migration 0017 к подтверждённой Production D1 database.
- [ ] Прочитать migration ledger и структуру таблицы обратно после применения.
- [ ] Проверить индексы, unique endpoint и foreign-key constraint.
- [ ] Не менять существующие заказы, заявки, профили сотрудников или сессии.

Разрешение владельца на Production rollout уже получено в рамках этой задачи. Оно не отменяет обязательный preflight и остановку при любой неопределённости.

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

- Production migration 0017 **не применена**.
- VAPID public/private/subject **не настроены** в Cloudflare Pages.
- Реальная Production subscription и доставка push **не проверены**.
- Android/Chrome permission, push delivery, notification click и unsubscribe **не протестированы**.
- Production код PR #450 **не выпущен**: PR открыт и Draft; Production продолжает работать на `main`.
- Состояние live D1 migration ledger/schema **не подтверждено** из-за ошибки доступа Cloudflare.
- Нельзя считать Preview-тест доказательством работы push в Production.

## 5. Ограничения scope

В рамках этой задачи не изменять:
- документы, переводы, ссылки и Sanity schema/data;
- существующие Production заказы и заявки;
- права редактирования/удаления заказов и существующую систему разрешений заявок;
- DNS, общие Cloudflare bindings, Resend и unrelated secrets;
- online-only поведение Manager и Service Worker.

Любое расширение scope согласовать отдельно.

## 6. Текущий статус и следующий шаг

**Статус: реализация и Preview-проверки завершены; Production rollout заблокирован восстановлением Cloudflare connector и ещё не начат.**

Следующий шаг владельца: переподключить Cloudflare connector в ChatGPT и сообщить, что доступ восстановлен. Затем продолжить с read-only D1 preflight — без повторного запроса уже данного разрешения на rollout, но с обязательной остановкой при неполной или противоречивой проверке.

## 7. История обновления

- 2026-11-21: дорожная карта собрана по PR #450, CI/Preview evidence и последнему известному состоянию Cloudflare доступа. Проверка PR issue подтвердила, что PR открыт; актуальный commit реализации и результаты CI сверены с handoff. Live D1 schema и Cloudflare credentials на этой дате не подтверждены.
