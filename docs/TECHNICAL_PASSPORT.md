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
5. Изменения делать в отдельной ветке/PR; запускать релевантные проверки и build; проверять Preview, если окружение безопасно и корректно настроено.
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
