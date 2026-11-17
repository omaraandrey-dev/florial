# Капково напояване за градини — редакционна переработка

Дата: 2026-11-17  
Статус: опубликовано в Sanity Production; runtime PR #374 merged; Cloudflare Production deployment успешен; DOM QA BG/RU/EN завершён.

## Объект

- Sanity project: `bxvcy0qs`
- Dataset: `production`
- Тип: `service`
- Document ID: `bbdb6864-f4b5-4969-ae31-62fc2043a25c`
- Slug: `avtomatizirano-kapkovo-napoyavane`
- URL: `https://florial-bg.com/services/avtomatizirano-kapkovo-napoyavane`
- Источник редакционной переработки: `https://www.drop.od.ua/bg/microdropirrigation`
- Исходная опубликованная ревизия: `CSxh3cFbcDVp859mktrIZM`
- Опубликованная Sanity revision: `CSxh3cFbcDVp859mku2NdQ`

## Backup

Полный JSON snapshot исходного документа сохранён до Sanity write:

`docs/backups/sanity/2026-11-17-kapkovo-napoyavane-before-editorial-refresh.json`

Backup commit: `f9f3be874413d5fa8d58c11ff0513ff081a3f4c2`.  
Sanity dataset backup listing перед работой вернул `No backups found`; поэтому создан точный документный backup в GitHub.

## Изменение контента

- Болгарский текст заменён структурированным Portable Text: 48 блоков, заголовки H2/H3, списки, контекстные внутренние ссылки.
- Русский и английский тексты подготовлены как самостоятельные естественные Markdown-версии; H1 остаётся в Hero, дублирующий H1 в описании удаляется существующим frontend.
- Содержание переработано по исходному материалу DROP: капельное и микрокапельное орошение, планирование по водоисточнику/давлению/дебиту/растениям, Rain Bird XFS Dripline и Copper Shield™, JET SPIKE, контроллеры RZX/WPX, применение для деревьев/кустарников/живых изгородей/цветников, укладка, монтаж и обслуживание.
- Точные значения расхода и расстояния эмиттеров не обещаются без сверки с паспортом конкретной модели.
- Внутренние ссылки: категории капельного оборудования, деревьев и кустарников, цветов и роз; услуги посадки растений и автоматического полива.
- Related content: три опубликованные статьи о монтаже полива, оборудовании Rain Bird и стоимости системы; две существующие категории полива.
- SEO заполнено отдельно для BG/RU/EN, `noIndex=false`.
- ALT BG/RU/EN заполнен для hero, gallery и трёх inline product images.
- Форма подготовлена для BG/RU/EN с техническими полями `name`, `phone`, `email`, `location`, `details`; используется существующий endpoint `/api/service-leads`. API, D1 и Resend не менялись. Реальная заявка не отправлялась.

## Inline images

В `src/pages/ServicePage.tsx` добавлена обработка только для slug `avtomatizirano-kapkovo-napoyavane`:

- gallery: `gallery1` и `49e8b9ec3359` → `design`; `gallery4` → `watering`; `gallery5` → `flowerbeds`;
- contentBlocks: XFS → `pipeline`; JET SPIKE → `equipment`; controller → `automation`;
- изображения не выводятся общей галереей под Hero и не повторяются в нижнем legacy image-text разделе;
- добавлены локализованные heading mappings BG/RU/EN.

Регрессионный тест: `tests/drip-irrigation-service.test.mjs`.

## Неизменённые данные и сервисы

- Сохранены document ID, slug/URL, основное изображение, исходные image assets, serviceCategory, serviceLayout, sortOrder и isActive.
- Не изменялись Sanity schema, Header, navigation, Footer, Manager API, D1, Resend, Cloudflare settings/secrets.
- Не создавались новые услуги или статьи блога.
- Публичный документ опубликован; URL и document ID сохранены.

## Проверки

- Sanity published read-back: успешно; 48 BG Portable Text blocks, локализованные RU/EN тексты, SEO и lead forms; все пять related references разрешаются.
- PR #374 merged в main: `a5f4b2877b4cdc60cef1a712da59c62878c032c3`. Preview deployment `4fe6b1d5-bc66-439e-b7f6-3975b273ccbf` и Production deployment `451901ca-8d36-450e-a134-79561382d154` завершились успешно.
- Production Browser Rendering BG/RU/EN: HTTP 200; локализованные title/meta/H1/H2, canonical и index/follow; 15 изображений на странице, все с ALT; формы и related-content section присутствуют.
- Hreflang cross-language неполный из-за текущей projection в service detail query; зафиксировано в `docs/AI/OPEN_QUESTIONS.md`, в этом изменении не менялось.
- Cloudflare Pages metadata содержит legacy `VITE_SUPABASE_*` variables; не изменялись, использование не подтверждено, см. open questions.
- Реальная отправка заявки, PageSpeed/Lighthouse, formal mobile overflow и Google recrawl/indexing не выполнялись. GitHub workflow/status lookup не вернул CI runs; regression test добавлен, но отдельный запуск не подтверждён.

