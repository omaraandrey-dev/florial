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


## 6. Florial Manager — закрытая приёмка товаров (проектирование, 01.11.2026)

- Подготовлен отдельный архитектурный документ `docs/FLORIAL_MANAGER_ARCHITECTURE.md` в ветке `feature/florial-manager-architecture`.
- Цель: закрытая панель сотрудников для черновиков новых товаров и предложений об изменении существующих карточек; окончательное одобрение и публикация — владельцем.
- Поддерживаются два направления: Sanity dataset `plants` и `production`; рекомендуемый первый эксплуатационный пилот — растения.
- Предусмотрена изоляция панели на уровне `src/main.tsx`, без публичного Header/Footer и без ссылок в меню. Публичная оболочка и маршрутизация не менялись.
- Предложены таблицы заявок и аудита в Supabase, закрытое временное хранилище, Supabase Auth, RLS, серверные Cloudflare Pages Functions и публикация в Sanity после одобрения.
- Контрольная точка проектирования: GitHub main commit `466a9e7913455a3ede5ddb86db2a3cbd637be16a`.
- Проверка 01.11.2026: Supabase project `shzbflgqfffgzzgpwjxt` активен; workflow-таблицы не обнаружены; в списке Storage buckets нет записей. Sanity `plants` содержит 17 категорий; тип опубликованного товара — `product`.
- На этом этапе не изменялись код, SQL, Supabase Auth/Storage, Sanity schemas/documents/assets, Cloudflare configuration/Secrets и production.
- До реализации проверить Supabase Auth/redirects, Cloudflare variables/secrets (без вывода значений), Sanity write token, Resend sender, список сотрудников и сроки хранения файлов.


### Дополнительная проверка Cloudflare Pages для Florial Manager — 01.11.2026

- Проверены только имена и типы переменных проекта Pages `florial`; секретные значения не читались и не выводились.
- Production содержит `RESEND_API_KEY` (secret), `EMAIL_FROM`, `ORDER_NOTIFICATION_EMAIL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (secret) и публичные `VITE_*` настройки.
- В production не обнаружены `SANITY_WRITE_TOKEN` и `CATALOG_REVIEW_EMAIL`; их наличие/значения не предполагаются.
- Preview содержит только публичные `VITE_*` настройки; server secrets и Resend bindings не обнаружены.
- Перед preview-тестом Manager необходимо отдельно подготовить необходимые preview secrets/variables. Не копировать production-секреты автоматически.
- Конфигурация Supabase Auth (провайдеры, redirect URLs, MFA, пользователи) остаётся непроверенной.


## Florial Manager — первая версия (01.11.2026)

- Изолиран вътрешен интерфейс `/manager` се монтира в `src/main.tsx`, извън публичния Header/Footer.
- Frontend използва съществуващия `VITE_SUPABASE_URL` и `VITE_SUPABASE_PUBLISHABLE_KEY`; service-role key остава само в Cloudflare Pages Functions.
- Таблици за служители, заявки и audit events са описани в `supabase/migrations/20261101080000_create_florial_manager.sql`; всички имат RLS.
- Private bucket `florial-manager-intake` е предвиден за временни снимки; достъпът е ограничен чрез Storage RLS и папка с user UUID.
- `functions/api/manager/notify.ts` проверява Supabase Auth access token и staff role, след което изпраща известие през вече конфигурирания Resend.
- `ORDER_NOTIFICATION_EMAIL` е fallback адрес за известия; нова променлива не е задължителна. Preview secrets не се добавят.
- Първата форма създава нови растения с един вариант за продажба. Собственикът може да одобри, мениджърът — да върне за корекция. Публикацията в Sanity не е част от тази версия.
- Миграцията не е приложена, роли и Auth users не са създадени, production deployment не е изпълнен. Публичните Header, меню, Footer, checkout, Sanity documents и production база не са променяни.
- Подробности и bootstrap процедура: `docs/FLORIAL_MANAGER_SETUP.md` и `docs/FLORIAL_MANAGER_ARCHITECTURE.md`.
