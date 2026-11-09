# Florial — baseline производительности (Этап 0)

**Дата измерений:** 09.11.2026  
**Окно измерений:** примерно 07:34–07:40 UTC  
**Проверяемый сайт:** https://florial-bg.com/  
**GitHub main на момент аудита:** `b51d77a2012edb29b11fdd564138cd4d4004f356`  
**Production deployment:** `184542c7-27ac-4531-9ff9-48ec067bf3d3` (short ID `184542c7`), статус `success`, production branch `main`; deployment собран с commit `6ba2633f4ca7c5af50544319259b970481a3d84a`. Отличие текущего main от deployment — последующие документационные записи; runtime-код не менялся.

## 1. Методика и границы измерения

- Использован удалённый Chromium-браузер с реальным открытием Production сайта, Performance API и Chrome DevTools Protocol Network events.
- Mobile: viewport 390×844, CPU slowdown 4×, network profile — latency 150 ms, download 10 Mbps, upload 1.5 Mbps. Выполнено 3 последовательных прогона.
- Desktop: viewport 1365×900, без искусственного throttling. Выполнено 3 прогона.
- Для сетевого состава дополнительно выполнен отдельный CDP network capture с отключённым browser cache. Размеры — фактически переданные encoded bytes, включая изображения и ответы Sanity.
- Сравнивать эти лабораторные показатели следует только с будущими прогонами в том же профиле. Это не полевые CrUX/Core Web Vitals и не результат Lighthouse.
- Google PageSpeed Insights API вернул HTTP 429: квота `defaultPerDay` для подключённого API-проекта равна 0. Поэтому Lighthouse score и его диагностические audits получить этим API не удалось.
- LCP entry в удалённом браузерном прогоне не был доступен. INP не измерялся реальным пользовательским взаимодействием; TBT Lighthouse не получен. Эти показатели отмечены как неизвестные, а не заменены предположениями.

## 2. Повторяемые показатели главной страницы

### Mobile — 390×844, 4× CPU, 150 ms latency, 10/1.5 Mbps

| Метрика | Прогон 1 | Прогон 2 | Прогон 3 | Медиана |
|---|---:|---:|---:|---:|
| TTFB | 159 ms | 164 ms | 163 ms | **163 ms** |
| First Contentful Paint | 376 ms | 380 ms | 428 ms | **380 ms** |
| DOM Content Loaded | 543 ms | 553 ms | 574 ms | **553 ms** |
| Load event | 544 ms | 554 ms | 575 ms | **554 ms** |
| CLS observer | 0 | 0 | 0 | **0** |

### Desktop — 1365×900, без throttling

| Метрика | Прогон 1 | Прогон 2 | Прогон 3 | Медиана |
|---|---:|---:|---:|---:|
| TTFB | 75 ms | 53 ms | 47 ms | **53 ms** |
| First Contentful Paint | 136 ms | 144 ms | 120 ms | **136 ms** |
| DOM Content Loaded | 146 ms | 134 ms | 238 ms | **146 ms** |
| Load event | 147 ms | 135 ms | 239 ms | **147 ms** |
| CLS observer | 0 | 0 | 0 | **0** |

**Важно:** быстрый FCP не означает быструю полную загрузку. На мобильном профиле браузер продолжает получать десятки мегабайт изображений и несколько мегабайт каталожных данных после появления первого содержимого.

## 3. Сетевой состав загрузки

Отдельный CDP capture главной (без browser cache):

| Тип ресурса | Запросы | Передано |
|---|---:|---:|
| Изображения | 38 | **38,921,410 bytes (90.8%)** |
| Sanity XHR | 10 | **3,726,573 bytes (8.7%)** |
| JavaScript приложения | 1 | 207,540 bytes |
| CSS | 1 | 12,078 bytes |
| HTML | 1 | 6,733 bytes |
| Cloudflare beacon | 1 | 412 bytes |
| **Всего** | **52** | **42,874,746 bytes ≈ 40.89 MiB** |

Это фактические encoded bytes CDP capture, а не оценка по размерам исходных файлов. Объём изображений и запросов Sanity составляет подавляющую часть начальной сетевой загрузки.

### Изображения

- В DOM главной обнаружено 38 элементов `img`; дополнительно используется фоновое Hero-изображение через CSS.
- На viewport 390×844 только логотип и две первые карточки услуг находятся в первом экране; 35 изображений расположены ниже первого экрана.
- В исходной разметке логотип имеет `loading="eager"`; только три изображения явно используют `loading="lazy"`; у большинства карточек остаётся стандартное `loading="auto"`.
- Карточки используют оригинальные Sanity asset URL без адаптации размера под фактическую ширину карточки. Hero — PNG 1518×957, около 2.58 MiB в сетевом capture.
- Крупнейшие полученные изображения:
  - `417669ac484810173f470ab26237af62f1e333f2-1200x1200.png` — около 3.53 MiB;
  - `95a24bbe6e98e8205655e910dac6ab29dd293d96-1536x1024.png` — около 2.69 MiB;
  - `42d08831c6593f935f49339dff8d070519235dab-2500x3750.jpg` — около 2.59 MiB;
  - Hero `6331b4d39fc6539c970c310c48be3a48cb677d61-1518x957.png` — около 2.58 MiB;
  - `27e5e04d0d36c3c4df0d734a157581ee9e9b66e7-1503x1047.png` — около 2.41 MiB.
- Вывод: главный подтверждённый объёмный bottleneck — изображения оригинального размера, в том числе далеко ниже первого экрана.

### Sanity и начальные данные

- За одну загрузку главной выполнено 10 Sanity XHR-запросов суммарно примерно на 3.73 MB encoded transfer.
- Самый крупный — полный запрос оборудования в dataset `production`: около 3.33 MB encoded transfer. В mobile throttled-профиле его длительность составила примерно 9.8 секунды в каждом из трёх прогонов.
- Начальная загрузка включает категории оборудования, полный каталог оборудования, услуги, категории растений, каталог растений, настройки сайта и логотип. Затем выполняется дополнительный запрос связанных материалов растений.
- Проекции каталога содержат поля, не нужные для первого экрана: полные описания, SEO, галереи, характеристики, совместимость, связанные товары/материалы, PDF-ссылки и дополнительные plant-care данные.
- Запрос полного каталога нельзя просто убрать: глобальное состояние App используется поиском, фильтрами, меню, категориями, карточками и страницами товаров. Нужна безопасная схема компактного индекса и полной загрузки деталей по требованию.
- Один и тот же `fetchBlogPosts(3)` выполняется отдельно в `Header.tsx` и `BlogSection.tsx`. Оба запроса возвращают один и тот же список из 3 статей и включают Portable Text body и gallery; каждый ответ в браузерном capture — около 145.9 KB до транспортного сжатия.

## 4. JavaScript, CSS и Cloudflare cache

- Production entry JavaScript: `/assets/index-01_-38mJ.js`, 207,540 encoded bytes.
- Production CSS: `/assets/index-CNuCcNqd.css`, 12,078 encoded bytes.
- Для JS/CSS получены `Cache-Control: public, max-age=31536000, immutable` и `cf-cache-status: HIT` — статические fingerprinted assets корректно кэшируются.
- HTML: `Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=600`, но в проверенных запросах `cf-cache-status: DYNAMIC`. Фактический edge HIT для HTML не подтверждён.
- `public/_headers` содержит годовой immutable cache для `/assets/*` и базовые security headers.
- `src/lib/sanity.ts`: публичные клиенты datasets `production` и `plants` используют `useCdn: false`. CDN нельзя включать автоматически без проверки допустимой задержки публикаций и сценариев немедленного чтения.

## 5. Статический аудит кода, подтверждённый сетевыми замерами

- `src/App.tsx`: при первом открытии выполняется загрузка полных данных оборудования, растений, категорий и услуг; после этого может выполняться запрос связанных материалов растений.
- `src/lib/blog.ts`: projection для списка статей содержит body и gallery.
- `src/components/Header.tsx` и `src/components/BlogSection.tsx`: два независимых одинаковых запроса списка последних трёх статей.
- `src/pages/HomePage.tsx`: карточные изображения в основном используют исходные Sanity URL; многие не имеют явного lazy loading и responsive размеров.
- `src/main.tsx`: статически импортирует `App` и `ManagerApp`; публичный маршрут не должен загружать Manager chunk после безопасного code splitting.
- `src/App.tsx`: статически импортирует страницы маршрутов; route-level splitting требует проверки прямых URL и навигации.
- `src/lib/sanity.ts`: оба клиента настроены `useCdn: false`.

## 6. Доступность, SEO и ошибки

- BG `/`, RU `/?lang=ru`, EN `/?lang=en`: все три главные страницы вернули HTTP 200, правильный `html lang`, локализованные title/H1 и `robots=index, follow`.
- `/bg` вернул 404 и не является маршрутом болгарской локали; не использовать его для baseline.
- В проверке трёх локалей не обнаружены page errors и HTTP-ответы 4xx/5xx. Три ошибки `ERR_BLOCKED_BY_CLIENT` относятся к Cloudflare Insights beacon, заблокированному самим тестовым браузером; это не подтверждённая ошибка приложения.
- Формы, корзина, оформление заказа и Manager не отправлялись/не изменялись в рамках этого диагностического запуска.

## 7. Выводы и приоритеты

1. **P0 — изображения главной.** Около 90.8% переданных байтов приходится на изображения. Нужны responsive Sanity image URLs, правильные `width/height` или aspect ratio, lazy loading ниже первого экрана и отдельная стратегия для LCP Hero. Не ставить Hero на lazy.
2. **P0 — начальный каталог Sanity.** Полный запрос оборудования — около 3.33 MB encoded и около 9.8 s в мобильном throttled-профиле. Следует отделить компактный каталоговый индекс от полных detail projections, сохранив поиск, фильтры, категории, меню и товарные страницы.
3. **P1 — блог.** Убрать дублирующий fetch и разделить карточную проекцию от полной статьи; не загружать body/gallery для карточек.
4. **P1 — JavaScript.** Проверить Vite bundle и внедрить безопасное lazy loading Manager и страниц после анализа маршрутов.
5. **P2 — Sanity CDN / HTML cache.** Отдельно оценить CDN и HTML cache policy; не менять кэширование API, заказов, заявок и персональных данных.

**Рекомендация по порядку первого исправления:** сначала отдельный ограниченный PR для изображений главной (responsive URLs + lazy loading с исключением подтверждённого LCP), затем отдельный PR для лёгких начальных Sanity projections. Это обусловлено тем, что изображения составляют около 91% фактического transfer. Перед каждым PR — точная карта потребителей данных и проверка визуального результата. Header, меню, Footer, Manager, checkout, D1 и API не затрагивать.

## 8. Что осталось неизвестным / незавершённым

- Lighthouse Performance/Accessibility/Best Practices/SEO scores: **НЕ ИЗВЕСТНО — нужно уточнить**; PageSpeed API недоступен из-за quota=0.
- LCP: **НЕ ИЗВЕСТНО — нужно уточнить**; LCP entry не вернулся в текущем remote Chromium capture.
- INP: не измерялся реальным взаимодействием.
- TBT и полные Lighthouse audits: не получены.
- Полевые CrUX Core Web Vitals: не получены.
- Полная проверка HTML edge cache HIT: не подтверждена; наблюдался DYNAMIC.
- Полная карта потребителей массивов products/categories/services в App: требует отдельного анализа перед изменением запросов.
- Реальная проверка на физическом Android устройстве: не выполнялась.

**Статус этапа 0:** воспроизводимые browser/network measurements и статический аудит выполнены; Lighthouse/CrUX/LCP/INP остаются незавершёнными из-за ограничений источника измерения. Runtime-код и Production настройки не менялись.


## 9. Post-optimization measurement — homepage card images (09.11.2026)

Реализация: PR #141, merge commit `b635aa4e307da86b11f70595f9da8a3c3d444074`; Cloudflare Production deployment `81b26460-1c58-408c-9cc3-c485e256ec45` — success. Подробный отчёт: [POST_OPTIMIZATION_HOME_IMAGES_2026-11-09.md](./POST_OPTIMIZATION_HOME_IMAGES_2026-11-09.md).

- Изменён только `src/pages/HomePage.tsx`: responsive Sanity image URLs (320–1200w), `srcSet`, `sizes`, `auto=format`, `q=75`, явный `loading=lazy`, `decoding=async` и intrinsic dimensions для карточек. Hero background и логотип не изменялись.
- Production smoke: BG `/`, RU `/?lang=ru`, EN `/?lang=en` — HTTP 200. В live DOM BG: 38 img, 34 srcSet/sizes, 37 lazy (логотип eager); Hero background прежний.
- Повторный mobile capture (390×844, CPU 4×, 150 ms, 10/1.5 Mbps, cache disabled, 3 прогона): общий transfer 15,790,388 / 12,927,532 / 12,929,319 bytes; медиана **12,929,319 bytes** против baseline 42,874,746 (≈−69.8%). Image transfer 11,841,602 / 8,980,653 / 8,980,844 bytes; медиана **8,980,844 bytes** против 38,921,410 (≈−76.9%).
- Sanity XHR median 3,725,884 bytes — практически без изменения; запросы каталога ещё не оптимизированы. В медианном initial load было 21 image response против 38 до оптимизации, так как native lazy loading откладывает изображения ниже/дальше от viewport; все 38 img остаются в DOM.
- CI PR #141: Blog and Studio validation run `42582485634` success; D1 migration validation `42582485603` success. Studio build и website build прошли.
- Lighthouse/LCP/INP/CrUX, post-optimization desktop capture и полный scroll-through/visual review всех изображений остаются незавершёнными. Не делать вывод о завершении всей image optimization stage.
- Изменения Sanity documents/schema, D1, API, checkout, cart, Manager, Header/menu/Footer, BlogSection и Cloudflare settings отсутствуют.


---

## Post-optimization comparison — category page (09.11.2026)

Detailed report: [POST_OPTIMIZATION_CDN_AND_IMAGES_2026-11-09.md](./POST_OPTIMIZATION_CDN_AND_IMAGES_2026-11-09.md).

Route: `/category/rastenia`. Both deployments were tested with the same mobile profile: 390×844, CPU slowdown 4×, 150 ms latency, 10 Mbps download, 1.5 Mbps upload, browser cache disabled, three runs.

| Metric | Before PR #150 (median) | After PR #150 (median) |
|---|---:|---:|
| First Contentful Paint | 428 ms | 408 ms |
| DOM Content Loaded | 575 ms | 562 ms |
| Load event | 691 ms | 691 ms |

Raw runs are retained in the post-optimization report. The small FCP/DCL changes should not be presented as a major overall speed increase; median load event did not change.

The confirmed improvement is the image-response volume on the category route: approximately 17.9 MB before versus 1,081,732 B after, about 94% lower in the captured initial-load sample. After optimization, 28 of 29 DOM images have responsive `srcSet`; 17 load initially and all 29 load after a full scroll, with no failed images. The post sample includes the unchanged Header logo and an original social-preview image request. This is an image-byte comparison, not Lighthouse or field Core Web Vitals.

Sanity CDN was also enabled only for public published content. Product price/stock, search, delivery tariffs, Manager reads and order validation remain on live APIs. Cloudflare HTML remains `DYNAMIC`; no Cloudflare settings were changed.

LCP, INP, CLS, Lighthouse, CrUX, desktop comparison and controlled measurements on all other routes remain open. The original baseline section above is preserved unchanged.
