# Рулонный газон: редакционное обновление статьи BG/RU/EN

**Дата:** 2026-11-18  
**Sanity:** project `bxvcy0qs`, dataset `production`  
**Документ:** `blogPost-prodavane-traven-chim`  
**Slug:** `prodavane-traven-chim`  
**URL:** `/blog/prodavane-traven-chim`  
**Финальная опубликованная ревизия после связанной статьи:** `4wsk3P4LWpbmPrrSds85Io`

## Согласование и резервные копии

Владелец явно подтвердил обновление существующей статьи по утверждённому плану.

Резервные копии созданы до соответствующих Sanity-записей:

- Исходный документ до полного обновления: `docs/backups/sanity/2026-11-18-blogPost-prodavane-traven-chim-before-editorial-refresh.json`.
- Полный опубликованный документ после основного обновления и до корректировки related-article link: `docs/backups/sanity/2026-11-18-blogPost-prodavane-traven-chim-after-publication-before-related-link-correction.json`.

Обе копии включают полный набор локализованных Portable Text блоков и исходные метаданные. Backup второй версии создан отдельными GROQ-снимками, чтобы не превышать лимит размера ответа одного запроса.

## Что обновлено в Sanity

- Существующий документ обновлён на месте; ID, slug, URL, `publishedAt`, обложка и статус публикации сохранены.
- Локализованы BG/RU/EN title (H1), short description, SEO title, SEO description и cover ALT.
- Основной текст переведён на единый Portable Text формат.
- Опубликовано по 66 блоков на язык; текстовое содержимое после публикации: BG 11,997; RU 11,380; EN 11,380 символов по `pt::text`. Исходные объёмы до обновления: BG 3,415; RU 2,312; EN 2,259 символов.
- В каждую языковую версию встроено шесть inline-фотографий; ALT и подписи локализованы.
- Старые цены DROP в гривнах и устаревший калькулятор цен не переносились.
- Добавлены этапы подготовки участка, доставки, укладки, укоренения, первого полива и ухода; отдельный раздел о прибрежном климате и подборе автоматического полива.
- Добавлены три опубликованных irrigation kits с актуальными ценами и описанием различий:
  - Super Economy — 242.32 EUR, ручное управление тремя шаровыми кранами, без контроллера/соленоидных клапанов;
  - Economy — 478.32 EUR, Rain Bird ESP-TM2-4i, три последовательные зоны, 3504-PC / US-400 / VAN-12;
  - Standard — 631.42 EUR, Rain Bird automatic control, три последовательные зоны, 1804 / R-VAN-18 / 3504-PC.
- Для всех трёх комплектов подтверждены VAT included и stock status `onRequest`. В статье отражено, что цены включают ДДС, а комплекты поставляются по заявке. Проверены ориентиры по воде: около 3 m³/h при 3.5 bar; PE Ø25 mm и электрический кабель в комплекты не входят.
- Добавлены ссылки на категории `vsichko-za-polivane`, `darveta-i-hrasti`, `tsvetya-i-rozi`, три комплекта, две связанные статьи и действующую услугу `/services/rulonna-treva` с существующей формой заявки.
- Related article link, который пересекался со slug услуги замены старого газона, заменён на действующую статью `/blog/etapi-montazh-avtomatichna-polivna-instalatsiya`.

## Импортированные фотографии DROP

Шесть изображений импортированы из Wix CDN в Sanity Production. Asset IDs:

- `image-8f31c5d59bbd04a7faacf2fe4b5e76c8ab4f12f8-942x1107-jpg`
- `image-7cb8ec6e768297c2a39842f2f98be6270bcc72f7-2368x4208-jpg`
- `image-d3ba3023591868448c3330bd877f623463683069-2368x4208-jpg`
- `image-faae4ebb57f54500bb3eaecd3f249427dbdc7aa6-2368x4208-jpg`
- `image-ff3124446f6e871f3ae58d9763da3a37a5d57d36-960x1280-jpg`
- `image-4cfa8effd8f8458f43ee1d9d11a1b911840ec369-1600x1200-jpg`

Последний исходный калькулятор с ценами 2023 года не импортировался.

## Проверка

- Sanity validation: документ reported `valid`; `complete=false` только потому, что валидатор не исполняет custom callbacks (включая custom slug uniqueness callbacks). Built-in validation прошла.
- Published read-back подтвердил slug, ID, публикацию, локализованные поля, 66 блоков и шесть inline images в каждой локали.
- Live browser: BG/RU/EN страницы открываются с HTTP 200, корректным `html lang`, локализованным H1/title/description и `index, follow`.
- Проверка DOM на BG подтвердила H1, десять изображений (обложка, шесть inline и три related cards), двенадцать ссылок в статье/навигации.
- В трёх локалях изображения имеют локализованные ALT; три product links, три category links, related-article links и service CTA присутствуют в DOM.
- Product/category/service target pages были открыты в live browser; у трёх product pages, трёх category pages, двух blog articles и service page отображаются ожидаемые H1. У service page присутствуют поля заявки `name`, `phone`, `email`, `location`, `details`.
- Реальная заявка не отправлялась. Google recrawl/indexing не проверялись. Не выполнялись Lighthouse/PageSpeed измерения или formal visual/mobile audit.

## Границы изменений

- Изменены только содержимое одного опубликованного blogPost и шесть Sanity image assets.
- Не менялись Sanity schema, service document/form, products, categories, frontend code, routes, Cloudflare Pages configuration/deployment, D1, Resend, Header/menu/Footer.
- Wix DROP использовался только как read-only источник статьи и фотографий; Wix-контент не менялся.
- Humanizer connector не вызывался; текст подготовлен и локализован вручную.
- Shared project logs (`CHANGELOG.md`, Technical Passport, Open Questions) отложены: открытые PR #334, #281, #274 и другие уже изменяют эти общие файлы. Не создавать конфликтующие параллельные версии; синхронизировать shared logs отдельным интеграционным проходом после reconciliation открытых PR.
