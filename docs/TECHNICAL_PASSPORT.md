# Florial — технический паспорт (контрольная точка 01.11.2026)

> Документ фиксирует подтверждённое техническое состояние проекта. Перед любыми изменениями сверяться с актуальными GitHub, Sanity, Supabase и Cloudflare данными. Не считать неподтверждённое реализованным.

## Проект и архитектура

- Основной сайт: https://florial-bg.com
- GitHub: https://github.com/omaraandrey-dev/florial
- Основная ветка: `main`
- Frontend: React + TypeScript + Vite.
- CMS: Sanity project `bxvcy0qs`; datasets `production` и `plants`.
- Заказы: Supabase project ref `shzbflgqfffgzzgpwjxt`, доступ к таблице заказов — только через серверную Cloudflare Pages Function.
- Hosting/server functions: Cloudflare Pages project `florial`.
- Не использовать Wix или Lovable как основу. Не менять header/menu/footer и глобальную структуру без предварительного плана и согласия владельца.

## Sanity Studio — подтверждённый статус на 01.11.2026

- Канонический URL: https://florial-admin-bg.sanity.studio/
- Workspace основного каталога: `florial-admin`, dataset `production`.
- Workspace растений: `plants`, dataset `plants`; прямой адрес: https://florial-admin-bg.sanity.studio/plants
- Sanity API возвращает одну зарегистрированную Studio: `fdy0ldwl717qtp5pikl7715l`.
- GitHub Actions workflow run `41280176924`, job `124770327812`, завершился успешно; лог подтвердил `Deployed 2/2 schemas` и успешную публикацию Studio.
- Наличие схем подтверждено через Sanity API. Ручное открытие Studio пользователем отдельно не подтверждено.

## Коммерческие варианты растений — PR #34

- PR: https://github.com/omaraandrey-dev/florial/pull/34
- Merge commit: `e112825c5f1e4b8e9c4172c2dff085d88b1b928e`.
- Production deployment Cloudflare Pages: `084dcaad-eff4-4f8a-ab7c-6de0d0c7ece6`, все стадии успешны.
- В схему добавлен тип `plantSaleVariant`: локализованные названия BG/RU/EN, SKU, высота продажи, объём контейнера, цена/старая цена EUR, статус наличия и количество.
- В `plantProduct` добавлено поле `saleVariants` — массив до 30 вариантов.
- Карточка растения показывает выбранный вариант, его параметры, цену и наличие; при отсутствии подтверждённой цены используется запрос цены. Предусмотрена локализованная заявка через WhatsApp.
- Категория растений показывает минимальную цену только из фактических вариантов; без вариантов — «Цена по запросу». JSON-LD Offer не публикуется без подтверждённой цены.
- Sanity документы не изменялись. Фактические варианты продажи пока не заполнены.
- Legacy `priceEUR: 3000` и `oldPriceEUR: 4000` не являются подтверждёнными розничными ценами; не использовать их как цену продажи.

## Последующие действия и ограничения

1. Перед массовым заполнением вариантов получить достоверный прайс/размеры/остатки, подготовить отчёт и запросить подтверждение конкретного объёма записи.
2. Не менять цены и документы Sanity без явного согласия владельца.
3. Не выводить секреты; `SUPABASE_SERVICE_ROLE_KEY`, Resend API key и токены Sanity хранить только на сервере.
4. Не создавать тестовые production-заказы без разрешения.
5. После существенных изменений обновлять `CHANGELOG.md`, а при изменении схем — `studio/SCHEMA_CHANGELOG.md`.
6. Не считать успешный deployment ручной проверкой сайта или Studio.

## Документация

- Подробный рабочий регламент и технический паспорт: библиотечный файл `ИНСТРУКЦИЯ(2).md`.
- История релизов: `CHANGELOG.md`.
- История схем Sanity: `studio/SCHEMA_CHANGELOG.md`.
