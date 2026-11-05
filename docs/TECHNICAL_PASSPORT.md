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
- PR/production deployment и Studio schema deployment не считаются завершёнными до проверки GitHub Actions и фактических статусов сервисов.
