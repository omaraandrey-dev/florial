## 2026-11-21 — Manager live list refresh correction (PR #453)

- Owner-confirmed real Production plant order and service enquiry were not visible in Manager until manual refresh.
- Main-code review identified the cause in the UI refresh strategy: orders refreshed every 15 minutes and service leads had no periodic refresh.
- PR #453 proposes 20-second polling for both lists while visible, with focus/visibility refresh after a 20-second cooldown and in-flight guards. The initial PR head is `a85ac04562f9d99d05de1dafd0e1bdfa05263d2b`; CI/Preview and deployment are pending.
- The Owner reports the self-test and lifecycle checks 2.1–2.3 as working. This does not independently confirm push delivery from actual order/service-lead events.
- After merge/deployment: confirm both lists update without manual refresh; then record real-event push receipt by role and click navigation separately.

---

## 2026-11-21 — Owner-only self-test endpoint and control (PR validation passed)

- Added a dedicated `POST /api/manager/push/test` endpoint, restricted server-side to an active Owner session and same-origin requests.
- The endpoint queries only subscriptions whose `user_id` equals the authenticated Owner and whose staff profile is active with role `owner`; it cannot target Manager/Seller devices or accept a recipient, payload, URL, order or lead identifier from the client.
- The test payload is fixed and contains only a generic Bulgarian title/body plus `/manager/` destination. It does not create or read orders/leads and contains no customer data.
- Manager displays the test control only for Owner and only after push is enabled on the current browser/device. Provider acceptance is reported separately from confirmed device display.
- Reuses the existing Web Push sender, HTTPS-only endpoints, no redirects, five-second timeout and expired-subscription cleanup. No D1 migration, Production settings/secrets, Sanity, orders, leads or email changes.
- Validation on commit `f4231bf42c6d60b6ee8e2435bba4fbcdb9d3cbd5`: Blog and Studio run `44861125606` — success; D1 validation run `44861125730` — success; Cloudflare Pages Preview deployment `598a1466-17f2-49a1-bd39-58a70033ac65` — all stages success. Preview `/manager/` returned HTTP 200 with `noindex,nofollow`; built Manager JS returned HTTP 200 and contains the Owner test control and endpoint path. This verifies the static build only, not authenticated API behavior or actual device delivery.
- PR #452 remains open for review; no merge or Production deployment is authorized by this change.

---
# Manager — дорожная карта уведомлений и Web Push

Дата актуализации: 2026-11-21  
Реализация: PR #450 merged в main.  
Последний code/test SHA до merge: e373e2f82c5a73b222fa69393f1d3874010540e3.  
Merge commit / текущий runtime SHA: 54026c75030e5f950576cc1b99f7ebf8903006f1.

> PR #450 объединён в main. Blog/Studio CI, D1 validation и Cloudflare Pages Production deployment прошли на точном merge commit. Push-код опубликован в Production; реальные device subscription и push delivery ещё требуют Android/Chrome QA.

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
- Список/счётчик заказов обновляется при открытии Manager; на main до PR #453 polling составлял 15 минут. PR #453 меняет polling заказов и заявок на услуги на 20 секунд при видимой вкладке. Push — отдельный механизм и не зависит от polling.

## 2. Что уже сделано

### Реализация в PR #450

- [x] Seller и Manager могут просматривать заказы; права редактирования и удаления тестовых заказов не расширены.
- [x] На исходной реализации polling списка/счётчика заказов был ограничен интервалом 15 минут, включая возврат приложения в фокус. PR #453 предлагает заменить его на 20 секунд и добавить polling заявок за услуги.
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
- [x] По отдельной команде владельца PR #450 переведён из Draft в Ready и объединён в main.
- [x] Merge commit 54026c75030e5f950576cc1b99f7ebf8903006f1; main обновлён.
- [x] Blog and Studio validation run 44859242349 — success на точном merge SHA.
- [x] D1 migration validation run 44859242327 — success на точном merge SHA.
- [x] Cloudflare Pages Production deployment e80238e2-af1a-4441-8134-4388124accee — все этапы успешны; source SHA совпадает с merge commit; aliases florial-bg.com и www.florial-bg.com.
- [x] Production GET /api/manager/push/subscriptions проверен без сессии: HTTP 401 и JSON Authentication required — endpoint развёрнут и требует авторизацию, как предусмотрено.
- [x] Production /manager/ проверен: HTTP 200, Bulgarian Manager sign-in page, robots noindex/nofollow.
- [ ] Проверить Push UI и GET/POST/DELETE subscription API в авторизованной Owner/Manager/Seller сессии; подписку реального устройства пока не создавали.

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

- PR #450 объединён; Production deployment точного merge SHA завершился успешно.
- CI подтверждает сайт, Pages Functions, тесты, Sanity Studio build/typecheck и D1 migration validation.
- Подписка реального устройства, запись subscription в D1 и реальная push delivery ещё не проверены.
- Android/Chrome permission, push delivery, notification click, unsubscribe/re-subscribe остаются открытыми.
- Unauthenticated GET /api/manager/push/subscriptions returned HTTP 401 Authentication required; this confirms the route is deployed and protected. Authenticated GET/POST/DELETE and real device subscription remain pending.
- /manager/ returned HTTP 200 with the Bulgarian staff sign-in page and noindex/nofollow.
- PRAGMA integrity_check недоступен через D1 API из-за SQLITE_AUTH; PRAGMA foreign_key_check после миграции выполнен успешно и нарушений не выявил.

## 5. Ограничения scope

В рамках этой задачи не изменять:
- документы, переводы, ссылки и Sanity schema/data;
- существующие Production заказы и заявки;
- права редактирования/удаления заказов и существующую систему разрешений заявок;
- DNS, общие Cloudflare bindings, Resend и unrelated secrets;
- online-only поведение Manager и Service Worker.

Любое расширение scope согласовать отдельно.

## 6. Текущий статус и следующий шаг

**Статус: PR #450 merged и опубликован в Production. Merge CI и Production deployment прошли; реальный device QA остаётся открытым.**

- D1 migration 0017 применена и проверена read-back.
- VAPID public/private/subject сохранены в Pages Production; private key — encrypted secret.
- Production deployment e80238e2-af1a-4441-8134-4388124accee от 2026-11-21 03:04:48Z опубликован с точного merge SHA 54026c75030e5f950576cc1b99f7ebf8903006f1; build и deploy stages — success.
- Blog/Studio run 44859242349 — success; D1 validation run 44859242327 — success на точном merge SHA.
- Code/test SHA e373e2f82c5a73b222fa69393f1d3874010540e3 содержит исправление notification click и регрессионный тест; он вошёл в merge commit.
- PR #450 merged; текущий main на момент проверки — 54026c75030e5f950576cc1b99f7ebf8903006f1.

**Следующий шаг:** авторизованная проверка UI/endpoint и Android/Chrome subscription/delivery/click/unsubscribe для Owner, Manager и Seller. Не создавать реальные Production заказы/заявки ради тестирования без согласованного сценария.

## 7. История обновления

- 2026-11-21: Production D1 export создан; migration 0017 применена batch-запросом и проверена live read-back. Таблица содержит 0 строк; foreign-key check — 0 нарушений. Pages Production получил VAPID public/private/subject; private key хранится как encrypted secret, значения не включены в документацию. Preview settings и Production deployment не изменялись. PR #450 остаётся Draft; live push QA pending.
- 2026-11-21: code/test SHA `e373e2f82c5a73b222fa69393f1d3874010540e3` прошёл Blog/Studio (`44858363243`), D1 (`44858363236`) и Preview (`e92a4372-4d7f-48ef-a04d-3332a3b40795`).
- 2026-11-21: документационный checkpoint `884e4c0ddd361a8109d4d4fa533504092974e635` прошёл Blog/Studio (`44858518911`), D1 (`44858518879`) и Preview (`052ae9af-dd7c-4275-8abc-1141bdc29e03`). PR `mergeable=true`, `mergeable_state=clean`; Draft сохранён.
- 2026-11-21: PR #450 merged в main как 54026c75030e5f950576cc1b99f7ebf8903006f1; Blog/Studio 44859242349, D1 validation 44859242327 и Production deployment e80238e2-af1a-4441-8134-4388124accee завершились успешно. Реальная Android/Chrome push QA остаётся открытой.
- 2026-11-21: исправлен прежний ошибочный статус Cloudflare authorization. Cloudflare API и D1 read-only доступ подтверждены; PRAGMA integrity_check отклоняется как SQLITE_AUTH, не как общий отказ доступа.
