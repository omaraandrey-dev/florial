# Florial — sitemap и структурированные данные Google
Дата аудита: 13.11.2026
Статус: Production audit и CI/Preview validation завершены; PR #257 открыт, merge и Production deployment ещё не выполнены.

## Метод и источники

- Firecrawl не использовался: лимит Firecrawl исчерпан.
- Исходная точка кода: GitHub `main`, commit `4a0147450821bc37257e0bdc1d00e3f9190e1104`.
- Live sitemap прочитан через Cloudflare Browser Rendering, без выполнения JavaScript: `https://florial-bg.com/sitemap.xml`, HTTP 200.
- Live HTML товара проверен через Cloudflare Browser Rendering с отключённым JavaScript.
- Опубликованные документы Sanity прочитаны read-only из datasets `production` и `plants`.
- Схемы Studio прочитаны read-only через Sanity.
- Никаких записей в Sanity, D1 или Cloudflare settings/secrets не выполнялось.

## 1. Live sitemap.xml

Результат чтения Production XML:

- HTTP status: 200.
- Всего URL entries: **1 312**.
- Уникальных URL: **1 312**.
- Основных URL (без `?lang=`): **438**.
- Локализованных URL: **874**.
- Повторяющихся URL: **0**.
- 437 основных URL имеют RU и EN варианты; `/terms` представлен только BG URL, что соответствует текущему состоянию юридического текста и предупреждению о непроверенных переводах.

Распределение основных URL:

| Тип | Количество |
|---|---:|
| Товары (полив + растения) | 325 |
| Категории (полив + растения) | 71 |
| Активные услуги | 21 |
| Статьи блога | 14 |
| Главная блога | 1 |
| Главная, контакты, о компании, privacy, terms, services index | 6 |

Итого: 438 основных URL.

Sitemap использует apex-домен `https://florial-bg.com`, абсолютные адреса, языковые alternate links и x-default. В XML не обнаружены URL корзины, поиска, Manager или withdrawal.

## 2. Published Sanity inventory

Read-only counts:

| Dataset / type | Опубликовано / активно |
|---|---:|
| `production` products (irrigation) | 275 |
| `plants` products | 50 |
| `production` categories (irrigation) | 54 |
| `plants` categories | 17 |
| `production` active services | 21 |
| `production` published blog posts | 14 |
| **Всего объектов каталога и контента** | **431** |

Сопоставление с sitemap:
- Выполнено точное сравнение наборов URL, построенных из опубликованных Sanity slugs, с основными URL живого XML (не только сравнение количества).
- Товары: 325 Sanity документов / 325 sitemap URL; **missing 0, extra 0, duplicate slugs 0**.
- Категории: 71 / 71; **missing 0, extra 0, duplicate slugs 0**.
- Услуги: 21 / 21; **missing 0, extra 0, duplicate slugs 0**.
- Статьи: 14 / 14; **missing 0, extra 0, duplicate slugs 0**. Страница /blog присутствует отдельно.
- Все 325 активных товаров имеют slug.
- Все 50 растений имеют productType из набора, который учитывает plant sitemap query.
- Все товары, категории, услуги и статьи имеют опубликованные RU/EN названия и основные описания, необходимые текущим условиям добавления языковых URL в sitemap.

### Категории без активных товаров

В опубликованных документах есть четыре категории без прямых товаров и без дочерних категорий:

- `electromagnetic-valves`
- `troynik-90-plastmasov-vatreshna-rezba`
- `interiorni-rasteniya`
- `pochvopokrivni`

Сейчас все четыре включены в sitemap. Они не удалялись и не скрывались: SEO-поля заполнены, а решение об исключении из индексации должно быть отдельным решением владельца. Категории с дочерними разделами и без прямых товаров не считаются пустыми, если у них есть товары в дочерних категориях.

## 3. Localization and SEO fields

- Все 275 irrigation products имеют RU/EN name и shortDescription.
- У **143 из 275** irrigation products отсутствует как минимум одно из четырёх полей RU/EN `seo.metaTitle` / `seo.metaDescription`.
- Остальные 132 irrigation products имеют полный набор этих локализованных meta-полей.
- Все 50 plant products имеют BG/RU/EN H1, name, shortDescription и SEO meta title/description.
- У 54 irrigation и 17 plant categories заполнены BG/RU/EN H1, name/description и SEO meta title/description.
- У 21 активной услуги не найдено пропусков RU/EN name, shortDescription и SEO meta title/description.
- У **193/275 irrigation products** отсутствует отдельное поле H1 во всех трёх языках; сервер/клиент используют fallback на имя товара. Это не блокирует индексирование, но не соответствует принятому требованию хранить H1 отдельно.
- У **143/275 irrigation products** (включены в эти 193) отсутствует как минимум одно RU/EN metaTitle/metaDescription. У одного irrigation product отсутствуют оба BG meta-поля: `irritec-iq20120f0n20b`.
- У трёх активных услуг отсутствует `hero.title` во всех трёх локалях: `avtomatizirano-kapkovo-napoyavane`, `dostavka-poliv`, `montaj-avtomatichni-polivni-sistemi-nesebar`; страницы используют fallback на название услуги.
- У 14 опубликованных статей не найдено пропусков RU/EN title, shortDescription, seoTitle, seoDescription и body.

Для 143 irrigation products сайт может использовать корректный fallback title/description из локализованных названия и краткого описания. Массовая запись SEO-полей в Sanity не выполнялась. Подготовить отдельный контентный список для заполнения meta-полей следует после согласования владельца и резервного копирования Sanity.

## 4. Live HTML / structured data baseline

### Проверенный товар полива

`/product/rain-bird-100-pga-9v`:
- HTTP 200.
- `robots=index, follow`.
- self-canonical на apex URL.
- первоначальный HTML содержит `Product`, `Offer`, `BreadcrumbList`, `Organization`.
- Offer price 141.27 EUR совпадает с опубликованной ценой Sanity.

### Проверенное растение

`/product/citrus-japonica-kumquat`:
- HTTP 200.
- первоначальный HTML содержит корневую цену **3 000 EUR**.
- Product JSON-LD Offer также содержит **3 000 EUR**.
- опубликованный первый sale variant имеет цену **25 EUR**.

Дополнительная read-only выборка показала, что у **19 из 50 растений** корневой `priceEUR` отличается от цены первого ценового варианта. Клиентская карточка после JavaScript выбирает цену sale variant, но исходный HTML/JSON-LD мог содержать неверную корневую цену.

## 5. Выявленные проблемы кода и изменения PR #257

Ветка: `feat/google-seo-schema-audit`
PR: https://github.com/omaraandrey-dev/florial/pull/257

Подготовлено:

1. Вынесены тестируемые helpers `getServerProductPrice` и `buildProductOffer`. Для растений сервер использует saleVariants, а не потенциально устаревший root `priceEUR`; при нескольких вариантах формируется `AggregateOffer` с корректными low/high price и offerCount.
2. Первоначальный HTML карточки растения теперь показывает цену первого доступного варианта, согласованную с начальным выбором в React.
3. Middleware больше не выставляет `noIndex=false` безусловно; он учитывает SEO-поле выбранной локали. ProductPage и ServicePage на клиенте также сохраняют `noIndex`.
4. Условия product/service hreflang выровнены с реальными переводами и sitemap: наличие локализованных name/shortDescription достаточно, если локаль не помечена noIndex. Отсутствие необязательных meta-полей больше не разрывает alternate links.
5. RU/EN версии `/terms` содержали болгарский юридический проект с предупреждением о непроверенном переводе, но оставались indexable. Теперь server middleware и TermsPage ставят для RU/EN `noindex, nofollow`; BG остаётся индексируемой и единственной языковой версией в sitemap.
5. Добавлена Schema.org `Service` для страниц услуг и статической страницы доставки.
6. Добавлена `BlogPosting` для статей с headline, description, published/modified dates, image, publisher/author и inLanguage.
7. Добавлена `CollectionPage` + `ItemList` для категорий полива и растений, а также для списков услуг и блога. Структурированные данные восстанавливаются на клиенте после `applyPageSeo`, который очищает page-specific JSON-LD.
8. Для equipment category query failure страница остаётся доступной; ItemList пропускается как необязательное обогащение. Существующее fail-closed поведение plant category SSR сохранено.
9. Добавлены unit/static tests для цен вариантов и наличия структурированных данных.

Никаких Sanity documents, схем Studio, Cloudflare variables/secrets, D1, Resend, Header/Footer или глобальной архитектуры не менялось.

## 6. CI и Preview validation

Для runtime commit `dd83b76db47012e2d0a3f781fb15c6afdc9d5b72` оба GitHub Actions workflow завершились success:

- Blog and Studio validation run `43431627121` (#1102): lint, npm test, website build, migration syntax/dry-run и Sanity Studio build — success.
- Florial D1 migration validation run `43431627266` (#1416): lint, website build, Pages Functions syntax, additive plant audit migration validation и contract withdrawals migration validation — success.

Cloudflare Pages Preview deployment для этого runtime commit:
- deployment `bffc1ed8-6d73-4157-9541-d41f97daf56f`, URL `https://bffc1ed8.florial.pages.dev`, status success.
- Production не менялся.

Raw HTML smoke на Preview, JavaScript отключён:
- Kumquat: HTTP 200, `robots=index, follow`; initial HTML price 25.00 EUR; Product Offer 25.00 EUR (вместо 3 000 EUR в Production baseline).
- Conifer on standard: HTTP 200; initial HTML price 40.00 EUR; Product JSON-LD AggregateOffer lowPrice 40.00, highPrice 50.00, offerCount 3.
- Irrigation root category `/category/vsichko-za-polivane`: HTTP 200; CollectionPage + ItemList, 20 entries; first item URLs use canonical apex domain.
- Plant root category `/category/rastenia`: HTTP 200; CollectionPage + ItemList, 20 entries; localized Bulgarian names and canonical product URLs.
- Service `/services/avtomatichno-napoyavane`: HTTP 200; Service schema with serviceType, Organization provider and areaServed city entities.
- Blog article `/blog/cena-sistema-avtomatichno-napoyavane-burgas`: HTTP 200; BlogPosting schema with headline, publication/modification dates, image, publisher and `inLanguage=bg`.

## 7. Что ещё не подтверждено

- После merge необходим Production deployment и повторная проверка sitemap.
- После Production deployment нужно повторить raw HTML smoke без JavaScript для товара полива, категории полива, категории растений, услуги, статьи, /services и /blog. Preview проверка категорий/услуг/статей ещё ожидает завершения rate limit Cloudflare Browser Rendering.
- Не выполнялась проверка Google Search Console и фактической индексации URL. Наличие URL в sitemap не означает, что Google уже проиндексировал страницу.
- Google Rich Results Test / Schema Markup Validator не запускались; проверены исходный JSON-LD в live/preview HTML и код генерации.
- Firecrawl не использовался; Cloudflare Browser Rendering имеет отдельный rate limit.
- Не выполнялась проверка Google Search Console и фактической индексации URL. Наличие URL в sitemap не означает, что Google уже проиндексировал страницу.
- Google Rich Results Test / Schema Markup Validator не запускались; проверены исходный JSON-LD в live HTML и код генерации.
- В Cloudflare Browser Rendering действует отдельный rate limit; повторные запросы выполнялись с паузами, Firecrawl не использовался.

## 7. Открытые решения владельца

1. Заполнить SEO metaTitle/metaDescription для 143 irrigation products в RU/EN. Нужен отдельный backup Sanity и согласование массовой записи.
2. Решить, оставлять ли четыре опубликованные пустые категории индексируемыми и в sitemap. В PR они сохранены.
3. После исправления кода решить, нужно ли отдельно нормализовать 19 root `priceEUR` у растений в Sanity. Сейчас пользовательская цена и JSON-LD берутся из saleVariants; сами документы не изменялись.

## Итог

Sitemap Production покрывает все 431 опубликованный объект каталога и контента, имеет 1 312 уникальных URL с языковыми вариантами и не содержит повторов. Полнота URL-карты подтверждена. Основные пробелы находятся не в количестве URL, а в структурированных данных некоторых типов страниц, в локализованных SEO-полях 143 irrigation products и в исходной цене 19 plant documents. Исправления кода находятся в PR #257 и не считаются опубликованными до успешного CI, merge и Production smoke.
