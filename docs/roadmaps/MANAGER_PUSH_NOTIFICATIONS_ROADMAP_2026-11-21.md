# Manager — дорожная карта уведомлений и Web Push

Дата актуализации: 2026-11-21  
Рабочий PR: [#450](https://github.com/omaraandrey-dev/florial/pull/450)  
Рабочая ветка: `feature/manager-order-notifications`  
Последний code/test SHA: `e373e2f82c5a73b222fa69393f1d3874010540e3`.
Последний полностью проверенный PR checkpoint перед этой документационной актуализацией: `884e4c0ddd361a8109d4d4fa533504092974e635`.  
База PR на момент сверки: `main` = `5d39d0098357ec8b9d12e6b8b0f4e7b1d5cdc96d`

> Этот документ — единая карта текущей задачи. Production D1 migration 0017 и VAPID configuration уже выполнены. Web Push пока не работает в Production, поскольку код PR #450 остаётся в Draft и не развёрнут из main.

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

Последний code/test SHA: `e373e2f82c5a73b222fa69393f1d3874010540e3`; проверки повторно выполнены на documentation-parent SHA `884e4c0ddd361a8109d4d4fa533504092974e635`.

- [x] GitHub Actions Blog and Studio validation: run `44858518911` — success для SHA `884e4c0ddd361a8109d4d4fa533504092974e635`; application/Pages typecheck, lint, utility tests, website build, migration dry-run, Studio dependency install/typecheck/build.
- [x] GitHub Actions D1 migration validation: run `44858518879` — success для того же SHA; включает SQLite migration validation.
- [x] Cloudflare Pages Preview deployment `052ae9af-dd7c-4275-8abc-1141bdc29e03` — все стадии успешны для SHA `884e4c0ddd361a8109d4d4fa533504092974e635`; Preview: https://052ae9af.florial.pages.dev.
- [x] PR #450 открыт, Draft, `mergeable=true`, `mergeable_state=clean`; base `main` SHA `5d39d0098357ec8b9d12e6b8b0f4e7b1d5cdc96d`.

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

**Итог этапа (на момент preflight до этапа B):** preflight не выявил конфликтов миграции с Production-схемой. Затем migration 0017 была применена в рамках этапа B, описанного ниже.

### Этап B — Production D1 migration 0017

**Завершено 2026-11-21 — Production write выполнен по отдельному подтверждению владельца.**

- [x] Перед write создан полный SQL export Production D1 в Cloudflare D1 export storage (compatibility: d1; export завершён успешно).
- [x] Непосредственно перед write повторно подтверждено: migration ledger на 0016, целевой таблицы ещё нет, родительская таблица catalog_staff_profiles доступна.
- [x] Migration 0017 применена одним D1 batch: таблица manager_push_subscriptions, два индекса и запись в schema_migrations.
- [x] Live read-back подтвердил 0017_manager_push_subscriptions, структуру таблицы и оба индекса.
- [x] PRAGMA foreign_key_check после миграции вернул ноль нарушений.
- [x] Новая таблица пуста (0 подписок); существующие заказы, заявки, профили и сессии не изменялись.
- [x] Применение подтверждено D1 API: migration ledger timestamp 2026-11-21 02:38:36.

Backup export filename: 5fbb0e47-8439-493c-821a-6945eef7d8b2-00000640-00000000-0000512a-1d24d8042b1f0a51580e575d21584166.sql. Signed download URL не сохраняется в GitHub и не включается в документацию.
D1 export bookmark: `00000640-00000000-0000512a-1d24d8042b1f0a51580e575d21584166`.

**Ограничение:** PRAGMA integrity_check через D1 API недоступен (SQLITE_AUTH); foreign-key check после миграции выполнен успешно.

### Этап C — VAPID в Cloudflare Pages Production

**Завершено 2026-11-21 — конфигурация сохранена в Production.**

- [x] По PR-коду подтверждены имена VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT.
- [x] Создана новая P-256 VAPID key pair; public key в URL-safe Base64, private key соответствует VAPID raw 32-byte scalar.
- [x] В Pages project florial, только в deployment_configs.production, добавлены три переменные.
- [x] VAPID_PRIVATE_KEY записан как encrypted secret_text; public key и subject — plain_text.
- [x] Без раскрытия значений проверены наличие всех трёх переменных и типы; существующие переменные сохранены.
- [x] Preview configuration не изменялась.
- [x] Production deployment не запускался: текущий Production runtime остаётся на main, где PR #450 ещё не включён.

**Важно:** сохранённые настройки будут использоваться новым Production deployment. Они ещё не проверены работающим endpoint или реальной доставкой, поскольку код PR #450 не выпущен. Private key не сохраняется в GitHub/документации и не выводится в логи/чат.

### Этап D — принять решение по выпуску

- [x] Перед merge сверены актуальные SHA: `main` = `5d39d0098357ec8b9d12e6b8b0f4e7b1d5cdc96d`; PR head перед документационной актуализацией = `884e4c0ddd361a8109d4d4fa533504092974e635`; CI и Preview прошли.
- [x] Проверен PR diff: 21 файл, 681 additions / 28 deletions; изменения относятся к Manager Web Push, тестам, D1 migration validation и документации. Посторонних файлов не обнаружено.
- [x] GitHub подтвердил `mergeable=true`, `mergeable_state=clean`.
- [ ] Получить отдельную команду владельца на снятие Draft/merge. До неё PR остаётся Draft и не объединяется.
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

- PR #450 остаётся открытым Draft; Production runtime ещё не содержит Web Push endpoints/UI/dispatch.
- Реальная Production subscription и доставка push не проверены.
- Android/Chrome permission, push delivery, notification click и unsubscribe не протестированы.
- Проверка работающего API /api/manager/push/subscriptions возможна после выпуска кода.
- PRAGMA integrity_check недоступен через D1 API из-за SQLITE_AUTH; PRAGMA foreign_key_check после миграции выполнен успешно и нарушений не выявил.
- CI и Pages Preview подтверждают PR build, но не реальную работу Push в Production.

## 5. Ограничения scope

В рамках этой задачи не изменять:
- документы, переводы, ссылки и Sanity schema/data;
- существующие Production заказы и заявки;
- права редактирования/удаления заказов и существующую систему разрешений заявок;
- DNS, общие Cloudflare bindings, Resend и unrelated secrets;
- online-only поведение Manager и Service Worker.

Любое расширение scope согласовать отдельно.

## 6. Текущий статус и следующий шаг

**Статус: Production D1 migration 0017 и VAPID Production configuration выполнены. CI и Preview для PR checkpoint прошли успешно. Release и real-device QA остаются открытыми.**

- D1 migration 0017 применена и проверена read-back.
- VAPID public/private/subject сохранены в Pages Production; private key — encrypted secret.
- Существующий Production deployment не изменялся и продолжает обслуживать main SHA 5d39d0098357ec8b9d12e6b8b0f4e7b1d5cdc96d.
- Code/test SHA `e373e2f82c5a73b222fa69393f1d3874010540e3` содержит исправление notification click и регрессионный тест.
- Последний проверенный PR HEAD до этого документационного обновления: `884e4c0ddd361a8109d4d4fa533504092974e635`; Blog/Studio run `44858518911` — success; D1 run `44858518879` — success; Pages Preview `052ae9af-dd7c-4275-8abc-1141bdc29e03` — success.
- PR #450 остаётся Draft и не объединён; `main` не изменён.

**Следующий шаг:** получить отдельную команду владельца на снятие Draft/merge. После разрешённого merge проверить Production deployment по точному merge SHA и провести согласованный Android/Chrome тест по Owner, Manager и Seller. До выпуска не создавать реальные заказы/заявки ради тестирования.

## 7. История обновления

- 2026-11-21: Production D1 export создан; migration 0017 применена batch-запросом и проверена live read-back. Таблица содержит 0 строк; foreign-key check — 0 нарушений. Pages Production получил VAPID public/private/subject; private key хранится как encrypted secret, значения не включены в документацию. Preview settings и Production deployment не изменялись. PR #450 остаётся Draft; live push QA pending.
- 2026-11-21: code/test SHA `e373e2f82c5a73b222fa69393f1d3874010540e3` прошёл Blog/Studio (`44858363243`), D1 (`44858363236`) и Preview (`e92a4372-4d7f-48ef-a04d-3332a3b40795`).
- 2026-11-21: документационный checkpoint `884e4c0ddd361a8109d4d4fa533504092974e635` прошёл Blog/Studio (`44858518911`), D1 (`44858518879`) и Preview (`052ae9af-dd7c-4275-8abc-1141bdc29e03`). PR `mergeable=true`, `mergeable_state=clean`; Draft сохранён.
- 2026-11-21: исправлен прежний ошибочный статус Cloudflare authorization. Cloudflare API и D1 read-only доступ подтверждены; PRAGMA integrity_check отклоняется как SQLITE_AUTH, не как общий отказ доступа.
