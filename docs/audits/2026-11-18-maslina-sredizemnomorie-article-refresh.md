# Аудит редакционного обновления статьи об оливе

Дата: 2026-11-18  
Репозиторий: `omaraandrey-dev/florial`, base `main` SHA `0efaf75494c591708986f9b9b378e9a982848487`  
Sanity project: `bxvcy0qs`  
Dataset: `production`  
Документ: `blogPost-maslina-sredizemnomorie`  
Slug / URL: `maslina-sredizemnomorie` / `https://florial-bg.com/blog/maslina-sredizemnomorie`  
Published revision: `LtPyN36JxI5SIUpVnhPu66`

## Согласование и scope

Владелец подтвердил конкретный план редакционного обновления существующей статьи 2026-11-18. Обновлён только один защищённый опубликованный документ блога. Сохранены document ID, slug, публичный URL, cover asset, дата публикации, `isPublished=true`, `sourceUrl` и схема Sanity.

## Резервная копия

До первой Sanity write создан полный snapshot опубликованного документа:

- `docs/backups/sanity/2026-11-18-maslina-sredizemnomorie-before-editorial-refresh.json`
- Backup commit: `a10d5f86015e8aa784d8e01a73d23853834ef7d9`
- Исходная published revision: `qvVg1luYRxJZnxaWi1OfUN`

Snapshot содержит исходный документ целиком: все три локали, Portable Text, изображения и references, SEO, slug, cover, tags и системные поля.

## Редакционный результат

Все три локали полностью переработаны в самостоятельный Portable Text; Markdown-переводы и старые смешанные форматы удалены из целевых полей.

| Locale | Portable Text blocks | Text characters | Inline images | Internal links |
|---|---:|---:|---:|---:|
| BG | 79 | 12,856 | 8 | 15 |
| RU | 79 | 11,740 | 8 | 15 |
| EN | 79 | 12,042 | 8 | 15 |

Исходный текст до обновления: BG 2,859; RU 2,225; EN 2,167 знаков. Все три версии существенно длиннее исходных.

Новые разделы охватывают декоративную ценность Olea europaea, выбор молодого дерева / бонсай / крупномерного солитера, зимнее планирование сада, место посадки и микроклимат Южного Черноморья, сочетание с другими деревьями и цветами, профессиональную посадку, полив и капельное орошение, сезонный уход, проектные этапы и FAQ.

Текст позиционирует Florial как «градински център Флориал» / «садовый центр Florial» / «Florial Garden Centre». Выражение «ландшафтная студия» и неподтверждённые обещания не используются. Удалено старое обобщённое утверждение о морозостойкости до −15 °C; статья объясняет зависимость зимних рисков от сорта, возраста, микроклимата, ветра, почвы и ухода. Не перенесены неподтверждённые украинские климатические пороги, цены, сроки доставки или наличие конкурентов.

## Изображения

Cover asset сохранён. В каждой локали размещено восемь inline-изображений с локализованными ALT и подписями:

- три фотографии опубликованных товаров Florial: обычная маслина, маслина бонсай, едроразмерна маслина-солитер;
- изображения категорий деревьев и декоративных кустарников, хвойных, цветущих кустарников и цветов;
- существующая фотография маслины из прежней статьи.

Восемь уже опубликованных изображений из dataset `plants` скопированы в dataset `production` как Sanity image assets; семь из новых копий используются в Portable Text body. Один дополнительный category asset сохранён в Production, но не вставлен в текст. Старые нерелевантные inline-изображения рулонного газона, кипариса Тотем и юкки удалены из body. Чужие изображения конкурентов не копировались.

## Каталог, услуги и внутренние ссылки

Проверены опубликованные категории plants dataset:

- `/category/maslini`
- `/category/darveta-i-hrasti`
- `/category/igol_listni`
- `/category/tsaftyashti-hrasti`
- `/category/tsvetya-i-rozi`
- `/category/palmi-yuki`
- `/category/rastenia`

Проверены опубликованные irrigation categories:

- `/category/vsichko-za-polivane`
- `/category/kapkovo-napoyavane`

Проверены активные services и формы:

- `/services/landshaften-dizain` — активна; поля заявки: name, phone, email, location, details.
- `/services/profesionalno-zasazhdane-na-maslini` — активна; форма для посадки маслин с полями name, phone, email, location, details.
- `/services/avtomatichno-napoyavane` — активна; форма заявки доступна.

В статье 15 контекстных внутренних ссылок на каждую локаль. Реальная production-заявка не отправлялась.

## Похожие статьи

Существующий tag-based related-card renderer не менялся. Теги статьи: `Озеленяване`, `Ландшафтно проектиране`. Повторный запрос к опубликованным документам подтвердил три результата:

1. `podroben-landshaften-proekt-gradina` — подробный ландшафтный проект, растения и полив.
2. `landshaften-proekt-zima-burgas` — зимнее планирование сада.
3. `landshaften-dizain-proekt-zasazhdenie` — проектирование и озеленение в Несебре.

## Внешние источники исследования

Использованы как тематические ориентиры, без копирования текста и без переноса цен/ассортимента:

- https://www.priroda.kiev.ua/tovar/olyva-maslyna-1/
- https://idea-sad.com.ua/ua/catalog/olivkovoe-derevo

Сопоставлены темы Olea europaea, декоративной формы ствола и листвы, контейнерного выращивания, солнечного места, дренажа, умеренного полива, бонсай и крупномерных деревьев. Указанные на сайтах конкурентов характеристики, сортовые обещания, цены, климатические пороги и доставка не объявлялись характеристиками Florial.

## Проверки и ограничения

- Sanity Production published read-back: документ опубликован, slug и ID сохранены; все три локали имеют 79 Portable Text blocks, 8 inline images и 15 внутренних ссылок; SEO title/description и cover ALT заполнены.
- Sanity beta validator: `valid`, `complete=false`; custom validation callbacks (включая custom slug uniqueness callbacks) не запускались. Built-in validation прошла.
- Published categories and active service documents were checked directly in Sanity Production.
- Related-post query returned the three articles listed above.
- Rendered live HTML for BG/RU/EN не подтверждён. Firecrawl connected-app credits were exhausted; direct web open could not access the Florial production URL. Не заявлять browser/HTTP 200 verification до отдельного live fetch.
- No website code, Studio schema, Cloudflare Pages, D1, Resend, secrets, forms/API, Header/menu/Footer or routes were changed. Content-only change; no build or deployment was required or performed.
- Open item: live rendered-page check in BG/RU/EN when an available browser/fetch connection can access the Production site.

## Итог

Статья опубликована в Sanity Production. Существующий URL сохранён. Изменения ограничены целевым blogPost и восемью image assets, созданными в Production из ранее опубликованных plant assets.
