# Florial — дорожная карта оптимизации производительности

**Версия:** 1.0  
**Дата:** 09.11.2026  
**Статус:** Этап 0 частично завершён; browser/network baseline сохранён. Реализация Этапа 1 опубликована: компактные service/product/category indexes, полные detail-записи по требованию, отдельный search index и homepage 6+6. Повторный network capture и Lighthouse/CWV после PR #142–#144 ещё впереди.  
**Репозиторий:** omaraandrey-dev/florial, ветка main  
**Production:** https://florial-bg.com  
**Стек:** React 18, Vite 8, Sanity, Cloudflare Pages/Functions и D1. Supabase не используется.

> Это основной план ускорения Florial. В новом чате сначала прочитать актуальную MD2-инструкцию, docs/TECHNICAL_PASSPORT.md, CHANGELOG.md и этот документ. Затем сверить текущий main и Production: статусы ниже относятся к дате документа.

## 1. Цель и обязательные ограничения

Ускорить загрузку и взаимодействие на всём сайте, начиная с главной страницы, без потери функций, контента, SEO и качества изображений.

- Сохранять дизайн и визуальную иерархию.
- Не удалять товары, растения, услуги, категории, статьи, фотографии и документы ради ускорения.
- Не менять URL, SEO/canonical/hreflang, robots/noindex, schema.org, Header, меню и Footer без отдельного согласования.
- Не ломать поиск, фильтры, сортировку, корзину, checkout, доставку, заказы, Manager, заявки на услуги и BG/RU/EN.
- Не менять Sanity schema/documents, D1, API, Cloudflare settings/secrets и интеграции без обоснования и согласования.
- Не раскрывать секреты и не выполнять destructive writes.
- Не переходить на Wix, Lovable, Supabase или полную замену архитектуры.
- Предпочитать небольшие проверяемые изменения с измеримым результатом.

## 2. Как измеряем успех

До оптимизации снять baseline и сохранить результаты с датой, URL, локалью, устройством, профилем сети, инструментом и commit/deployment.

Обязательные метрики:
- Core Web Vitals: LCP, INP, CLS.
- Lighthouse Performance, Accessibility, Best Practices, SEO — mobile и desktop.
- TTFB, FCP, Speed Index.
- Общий transfer size и число запросов.
- Размер начального JS/CSS raw и gzip/brotli, количество чанков.
- Самые тяжёлые изображения и шрифты.
- Время/объём Sanity-запросов, количество документов и полей.
- Ошибки консоли и сети.

Минимум 3 прогона на одном профиле; сравнивать медиану. Для mobile зафиксировать CPU/network throttling. Реальный телефон — дополнительная проверка. Не смешивать Lighthouse lab data с полевыми CrUX/Web Vitals.

Предварительные ориентиры Core Web Vitals для 75-го перцентиля полевых данных, если они доступны: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1. Это цели, не текущие измерения. Lighthouse score и бюджет initial JS определить после baseline.

Каждое изменение должно иметь: измерение до, гипотезу, минимальный diff, build/lint/tests, регрессионную проверку, измерение после и честную запись результата. Успешный build сам по себе не доказывает ускорение.

## 3. Подтверждённые наблюдения исходного кода на 09.11.2026

Статический аудит GitHub main. Влияние на реальную скорость пока не измерено.

### P1. Общая загрузка каталога — src/App.tsx

Начальный useEffect запускает запросы к Sanity: категории оборудования, активные товары оборудования, услуги, категории растений, активные растения, настройки сайта и логотип. Выборки товаров и услуг включают полные описания, SEO, галереи, характеристики, совместимость, PDF URL, связанные материалы, plant care, contentBlocks и другие поля.

После загрузки растений выполняется дополнительный запрос для разрешения relatedContentBySlug (service/blogPost).

Гипотеза: начальная загрузка передаёт и обрабатывает больше данных, чем нужно для первого отображения главной.

Важно: App использует общие массивы для навигации, поиска, фильтров, страниц товаров, категорий и услуг. Нельзя просто урезать глобальные массивы или GROQ query. Нужны раздельные минимальные индексы, карточные проекции и полные данные detail pages.

### P2. Полные данные статей для карточек блога

src/lib/blog.ts использует postProjection с body Portable Text и gallery. fetchBlogPosts(3) вызывается отдельно из src/components/Header.tsx и src/components/BlogSection.tsx. Это два независимых вызова, причём карточкам не нужны body и gallery.

Гипотеза: лёгкая карточная проекция и общий результат для Header/BlogSection сократят объём и повторные запросы. Полную статью загружать по slug на странице статьи. Не вводить вечный cache без политики актуализации.

### P3. Sanity clients без CDN

src/lib/sanity.ts создаёт clients для datasets production и plants с useCdn: false.

Гипотеза: для публичных read-only запросов можно оценить Sanity CDN, предварительно проверив допустимую задержку публикаций. Не применять автоматически к write/admin flows и операциям, где требуется немедленно прочитать записанное значение.

### P4. Начальный JavaScript

src/main.tsx статически импортирует App и ManagerApp, хотя Manager нужен только на /manager. src/App.tsx статически импортирует страницы товаров, категорий, услуг, блога, корзины и другие.

Гипотеза: route-level code splitting и lazy loading Manager уменьшат initial JS публичного сайта. Перед изменением проверить Vite build manifest/chunks, зависимости и фактические размеры. Серверные модули не должны попадать в client bundle.

### P5. Изображения

Главная содержит CSS background Hero, карточки услуг/категорий и карточки блога. BlogSection уже применяет loading=lazy к карточным фото, но явные размеры изображений в JSX не заданы. Нужно проверить все изображения HomePage и определить фактический LCP элемент.

Гипотеза: responsive widths через Sanity image URL builder, форматы, width/height, lazy loading ниже первого экрана и приоритет LCP image сократят bytes и CLS. Не ставить LCP image на lazy. Не добавлять preload до измерения. Не менять crop без визуальной проверки.

### P6. Cache headers и статика

Состояние Cloudflare cache headers, _headers, Cache-Control, immutable assets и CDN cache ещё не проверено. Неизвестно — проверить на этапе 0. Не менять Cloudflare rules/settings по предположению.

### P7. Шрифты и сторонние ресурсы

Фактический вклад шрифтов, аналитики и сторонних скриптов не измерен. Неизвестно — установить по waterfall/Lighthouse. Не удалять необходимые бизнес-скрипты без проверки.

## 4. Очерёдность работ

### Этап 0 — Baseline и диагностический аудит (первый обязательный этап)

Цель: получить воспроизводимую картину до изменений.

1. Зафиксировать актуальный main commit и последний Production deployment.
2. Снять Lighthouse mobile/desktop для главной BG, RU, EN; одной категории оборудования; одной категории растений; товара; услуги; блога и статьи; Manager отдельно.
3. Снять Network waterfall: Sanity, изображения, JS/CSS, шрифты, сторонние ресурсы.
4. Сохранить размеры JS chunks и выявить тяжёлые зависимости.
5. Проверить Cloudflare response/cache headers и статические assets.
6. Определить реальный LCP элемент и изображения первого экрана.
7. Измерить объём/количество результатов текущих GROQ queries без записи в Sanity.
8. Подготовить baseline отчёт и ранжировать узкие места по эффекту и риску.

Выход: docs/performance/BASELINE.md с датой, commit, профилями и таблицей результатов. Готово, когда измерения воспроизводимы; до этого runtime-код и инфраструктуру не менять.

### Этап 1 — Лёгкая загрузка данных главной

Приоритет очень высокий.

1. Составить карту потребителей products, categories, plantCategories, services и siteSettings по всему App.
2. Разделить данные на навигационный индекс, карточные проекции и полные записи detail pages.
3. Главной отдавать только необходимые категории, первые 6 отсортированных услуг, настройки и данные карточек.
4. Сохранить логику корневых категорий, сортировку, доступность и связи.
5. Шесть услуг — только на главной; /services продолжает показывать полный список.
6. Не загружать полные описания, галереи, manuals, SEO и care guides, если они не нужны главной.
7. Сохранить полный каталог для поиска/фильтров через компактный индекс, если он необходим.
8. Связанный контент растений разрешать по требованию или лёгкой проекцией.

Риск: глобальное состояние App обслуживает множество маршрутов. Неверное разделение сломает поиск, меню, фильтры, категории или страницы товаров.

Критерии: главная визуально и функционально прежняя; BG/RU/EN работают; CTA ведёт на полный /services; каталоги и поиск полны; initial Sanity payload и время реально снизились.

### Этап 2 — Карточные GROQ projections и блог

1. Ввести лёгкую blog card projection: title, shortDescription, slug, publishedAt, cover URL и ALT/caption.
2. Убрать body/gallery из запроса списка публикаций.
3. Устранить два независимых fetchBlogPosts(3) вызова Header и BlogSection: единый родительский результат или cache с понятной актуализацией.
4. Полную статью получать по slug только на BlogPostPage.
5. Аналогично проверить карточки услуг и категорий.
6. Сохранить локализацию, ALT, даты, slug, статус публикации и ссылки.

Критерии: карточки прежние; нет лишнего повторного fetch; список не содержит body/gallery; полная статья работает.

### Этап 3 — Оптимизация изображений

1. Инвентаризировать изображения главной и определить LCP image.
2. Использовать Sanity image URL builder или существующий корректный механизм для auto=format, fit, width/height и quality; не собирать URL вручную без проверки.
3. Создать responsive widths для mobile/tablet/desktop через srcSet и sizes.
4. Указать width/height или aspect-ratio для предотвращения CLS.
5. Lazy load ниже первого экрана; eager/high priority только для подтверждённого LCP.
6. Проверить Header logo, hero, services, categories и blog images.
7. Проверить MIME type, bytes и визуальное качество на телефоне/десктопе.
8. Сохранить ALT BG/RU/EN и внутренние image links.

Критерии: меньше переданных байтов; LCP не ухудшился; CLS не вырос; изображения не размыты и не обрезаны неправильно.

### Этап 4 — Sanity CDN и кэширование

1. Разделить read-only запросы и операции, которым нужна немедленная актуальность.
2. Оценить useCdn: true отдельно для production и plants.
3. Проверить публикационную задержку и ошибки.
4. Проверить Cloudflare cache headers для hashed assets, HTML, изображений и API.
5. Для hashed JS/CSS — immutable cache только если имена действительно fingerprinted.
6. Для HTML — revalidation/короткий TTL по реальной схеме деплоя.
7. Заказы, заявки, Manager и персональные данные не должны попадать в public cache; сохранить no-store/private.
8. Не менять dashboard rules, secrets или bindings без проверки и согласования.

Критерии: подтверждённая cache policy; публикации видны в допустимый срок; API и персональные данные не кэшируются публично.

### Этап 5 — Code splitting и JavaScript

1. Отложить импорт ManagerApp до маршрута /manager.
2. Lazy-load страницы/маршруты с корректными fallback states.
3. Проверить прямые URL, переходы и scroll state.
4. Проверить manifest, shared chunks и initial JS.
5. Убедиться, что PDF/document generation остаётся в server-side Functions.
6. Сравнить production build, не полагаться на dev mode/StrictMode.
7. Не дробить бандл на множество мелких чанков без выигрыша.

Критерии: меньше initial JS; Manager chunk не загружается публичными страницами; все URL и переходы работают.

### Этап 6 — Остальные страницы

По очереди: категории оборудования и растений; товар и комплекты; услуги и формы; блог и статьи; поиск; корзина и checkout; Manager отдельно.

Для каждой страницы: минимальные list projections, full detail on demand, responsive images, lazy loading, route chunks и корректное caching.

### Этап 7 — Регрессия, Production и контроль

Проверить BG/RU/EN, desktop/mobile, прямые URL и client navigation, Header/menu/Footer, поиск, категории/фильтры, товар/варианты/комплекты, корзину и доставку, услуги/формы без фиктивных заявок, блог, Manager, SEO/canonical/hreflang/robots/structured data, console/network errors и отсутствие client secrets.

После merge: CI, фактический Cloudflare Production deployment нужного commit, live smoke, повтор baseline тем же профилем, обновление CHANGELOG/TECHNICAL_PASSPORT/MD2.

## 5. Правила безопасной разработки

- Перед каждым этапом перечитать актуальную MD2, TECHNICAL_PASSPORT, CHANGELOG и этот roadmap; проверить main и Production deployment.
- До изменения объяснить конкретные файлы/запросы/компоненты, эффект и риски.
- Не делать массовый рефакторинг App в одном PR.
- Перед Sanity document writes создавать JSON backup; performance roadmap сначала решать read/query/frontend изменениями без Sanity writes.
- D1, Manager, order APIs, service leads, checkout, Header/menu/Footer не менять без необходимости и явного согласования.
- Не создавать реальные заказы/платежи/клиентские заявки ради теста.
- На диагностическом этапе не выполнять Production writes.
- Секреты не читать и не включать в отчёты.
- Недоступные измерения обозначать явно, не выдумывать результаты.
- Если оптимизация не улучшила метрики или вызвала регрессию — исправить или откатить.

## 6. Статус на 09.11.2026

- [x] Roadmap создан; статические наблюдения исходного кода зафиксированы.
- [~] Этап 0 — browser/network baseline сохранён в `docs/performance/BASELINE.md`; Lighthouse/CrUX/LCP/INP остаются незавершёнными из-за недоступности PageSpeed API и отсутствия LCP/INP в remote browser capture.
- [~] Этап 1 — компактные initial service/product/category projections, on-demand service/product/category details, search index on demand и homepage 6+6 опубликованы. Функциональная реализация прошла CI и live smoke; повторный network capture для количественного подтверждения остаётся открытым.
- [ ] Этап 2 — карточные GROQ projections и блог.
- [~] Этап 3 — изображения: responsive/lazy loading карточек HomePage выполнен (PR #141); Hero, блог, остальные страницы и Lighthouse/LCP проверки ещё впереди.
- [ ] Этап 4 — Sanity CDN и кэширование.
- [ ] Этап 5 — code splitting и JavaScript.
- [ ] Этап 6 — остальные страницы.
- [ ] Этап 7 — регрессия и production.

**Текущая точка продолжения:** Stage 0 остаётся частично завершённым из-за недоступности Lighthouse/CrUX/LCP/INP. PR #141 оптимизировал responsive/lazy images карточек главной; измеренный mobile result сохранён в `docs/performance/POST_OPTIMIZATION_HOME_IMAGES_2026-11-09.md`. PR #142 перенёс полные service records на detail route. PR #143 внедрил compact equipment/plant projections, on-demand product detail/search и homepage 6+6. PR #144 внедрил compact category index и on-demand category description/SEO/helpBlock. Следующий приоритет — повторить browser/network capture на том же профиле, что baseline, для homepage, equipment/plant category, product detail и search; затем оценить Lighthouse/CWV и переходить к Stage 2 (blog card projections и устранение повторного blog fetch).

## 7. Инструкция для нового чата

1. Найти и прочитать самую новую MD2 по номеру редакции/дате.
2. Прочитать docs/TECHNICAL_PASSPORT.md и последние записи CHANGELOG.md.
3. Прочитать docs/ROADMAP_PERFORMANCE_OPTIMIZATION.md.
4. Проверить актуальный main, исходники и последний Cloudflare Production deployment.
5. Проверить отмеченные этапы и более новые отчёты.
6. Продолжить с первого незавершённого этапа, не повторяя сделанное без причины.
7. Перед изменениями объяснить конкретный план и запросить согласование там, где оно требуется.

### Стартовый запрос

Продолжаем ускорение Florial. Найди самую новую MD2-инструкцию (сейчас rev36) в GitHub main, прочитай TECHNICAL_PASSPORT.md, CHANGELOG.md, docs/ROADMAP_PERFORMANCE_OPTIMIZATION.md, docs/performance/BASELINE.md и последний post-optimization report. Проверь актуальный main и последний Cloudflare Production deployment. PR #141–#144 опубликованы: responsive homepage images; compact service/product/category projections; on-demand service/product/category details; search index on demand; homepage 6+6. Следующая задача — воспроизвести network baseline на том же mobile-профиле для homepage, plant/equipment category, product detail и search; не заявлять проценты ускорения без измерений. Затем Stage 2: lightweight blog card projection and deduplicate Header/BlogSection blog fetch.


## Дополнение от 09.11.2026 — результаты первого baseline

- Отчёт: [docs/performance/BASELINE.md](./performance/BASELINE.md).
- Mobile (390×844, CPU 4×, latency 150 ms, 10/1.5 Mbps), 3 прогона: медиана TTFB 163 ms, FCP 380 ms, DOMContentLoaded 553 ms, Load 554 ms.
- Desktop (1365×900, без throttling), 3 прогона: медиана TTFB 53 ms, FCP 136 ms, DOMContentLoaded 146 ms, Load 147 ms.
- Отдельный CDP network capture: 42,874,746 bytes (≈40.89 MiB), 38 image responses (38.92 MB, 90.8%), 10 Sanity XHR (3.73 MB, 8.7%), app JS 207.5 KB, CSS 12.1 KB.
- Полный запрос equipment products передал около 3.33 MB и занимал около 9.8 s в каждом mobile throttled прогоне.
- HTML отвечал `cf-cache-status: DYNAMIC`; hashed JS/CSS — `HIT` и годовой immutable cache.
- Lighthouse/CrUX/LCP/INP не подтверждены: PageSpeed API quota=0; remote browser не вернул LCP entry; INP не проверялся пользовательским вводом.
- Stage 0 остаётся частично завершённым. Runtime, Sanity, D1, API и Cloudflare settings не менялись.


## Дополнение от 09.11.2026 — первая оптимизация изображений главной

- PR #141 merged squash: `b635aa4e307da86b11f70595f9da8a3c3d444074`; изменён только `src/pages/HomePage.tsx`.
- Карточные изображения HomePage используют Sanity responsive widths 320–1200, `srcSet`, `sizes`, `auto=format`, `q=75`, lazy loading, async decoding и intrinsic dimensions. Hero background и logo не менялись.
- Cloudflare Production deployment `81b26460-1c58-408c-9cc3-c485e256ec45` — success; BG/RU/EN главные HTTP 200.
- Mobile network median: total transfer 12,929,319 bytes против baseline 42,874,746 (≈−69.8%); image transfer 8,980,844 bytes против 38,921,410 (≈−76.9%). Подробности: `docs/performance/POST_OPTIMIZATION_HOME_IMAGES_2026-11-09.md`.
- Sanity XHR не изменились; лёгкие projections — следующий отдельный этап. Stage 3 частично выполнен; LCP, Lighthouse, desktop post-measurement, BlogSection и остальные страницы остаются открытыми.
- CI: Blog and Studio validation `42582485634` success; D1 validation `42582485603` success. Sanity schema/documents, D1 data, API, checkout, cart, Manager, Header/menu/Footer, Cloudflare settings и secrets не изменялись.


## Контрольная точка 09.11.2026 — услуги загружаются по требованию

- PR #142 merged squash в `main`: `e9b49a42ee7cfdfd385cf7fce8706ab71c93b7bb`.
- В `src/App.tsx` initial service query стал компактным; полная запись услуги загружается отдельным GROQ запросом только при открытии конкретной услуги. Поля detail-запроса сохранены целиком, включая related content и форму заявки.
- CI runs `42584605993` (website + Studio) и `42584606037` (D1 validation) — success.
- Production deployment `001a7aeb-a6f7-4bd0-b963-d9a1f38f2ca0` — success, commit совпадает с main.
- Live rendered smoke: planting service BG/RU/EN и `/services` доступны. Проверка была после ожидания client-side загрузки; console и полный SPA regression не проводились.
- Это частичное выполнение Stage 1: глобальная service projection уменьшена, но глобальные equipment/plant product queries и связанные данные ещё не оптимизированы. Stage 1 остаётся в работе.
- Обнаружены legacy env variable names `SUPABASE_*` и `VITE_SUPABASE_*` в Cloudflare Pages metadata. Не изменять без отдельной проверки ссылок в коде и согласования очистки.

**Следующая задача:** dependency map и безопасное разделение equipment/plant catalog на compact search/category index, card projection и on-demand detail. Сохранить полное поведение поиска, фильтров, сортировки, комплектаций, вариантов растений, совместимости, related products, cart и BG/RU/EN.



## Контрольная точка 09.11.2026 — PR #143: каталог и homepage 6+6

- PR #143 merged squash в `main`: `e7d33432b134825dc2fb065a8e254b363e73e67d`; изменены только `src/App.tsx` и `src/pages/HomePage.tsx`.
- Homepage: первые шесть категорий растений и первые шесть категорий оборудования по прежней сортировке; CTA ведут в полные каталоги. Live BG/RU/EN подтверждают 6+6.
- Initial product/plant queries теперь компактные. Product detail GROQ выполняется по требованию; поисковый индекс загружается только на /search. Сохранены category filters, plant filters, variants, kit components, related content, recommended irrigation, specifications, SEO и descriptions в detail.
- Sanity read-only queries проверены на datasets production/plants. Sanity content/schema не менялись.
- CI: Blog and Studio validation `42587640231` success; D1 validation `42587640149` success.
- Production deployment `7169a06c-cd7d-4184-b47c-083a9f3cdb2a` success, commit совпадает с merge commit; aliases florial-bg.com и www.florial-bg.com.
- Live smoke: homepage BG/RU/EN; both catalogue roots; Rain Bird equipment detail; Trachycarpus detail BG/RU/EN and sale variant; kit detail/components; plant filters; Rain Bird search returns 130 results. No loading placeholder remained after client load.
- Не выполнялись cart click, checkout/order, browser console, full SPA manual regression. Post-release network transfer/Lighthouse/CWV measurement не выполнялись; ускорение в процентах не заявляется.
- Следующая задача: compact category index + on-demand category description/SEO/helpBlock, после анализа Header/HomePage/ProductPage/About/CategoryPage consumers. Не менять Header/menu/Footer.



## Контрольная точка 09.11.2026 — PR #144: категория загружается по требованию

- PR #144 merged squash: `dd129898f207018e5124f7fa2604ff9a727ccd9a`; runtime изменён только `src/App.tsx`.
- Initial category queries теперь компактные: names/translations names, slug, sortOrder, parentId, image URL/ALT/TITLE и category type. Full descriptions, SEO and helpBlock не загружаются глобально.
- При открытии CategoryPage выполняется detail GROQ query из нужного Sanity dataset. Полные localized description, SEO/H1/noIndex, helpBlock и изображения сохраняются. Добавлены cancellation guard, защита от stale category и fallback при ошибке detail query.
- Sanity read-only GROQ queries compact/detail проверены для datasets production/plants; без writes.
- CI: Blog and Studio validation `42588551106` success; D1 validation `42588551110` success.
- Production deployment `d93cc80d-1475-49d1-a798-a08587b6b2dd` success, commit совпадает с merge commit, aliases florial-bg.com и www.florial-bg.com.
- Live smoke: plant and irrigation root categories BG/RU/EN, child categories palms/valves, categories with helpBlock rotor sprinklers BG/RU and citrus BG/EN. Category headings, descriptions, SEO titles, images, category/product cards and help text render after client-side load.
- Не менялись Sanity schema/documents, products, search, cart/checkout, D1, API, Manager, Header/menu/Footer layout, Cloudflare settings/secrets.
- Network transfer/Lighthouse/CWV после PR #144 ещё не измерялись. Следующий шаг — повторить baseline capture на идентичном профиле и нескольких маршрутах; затем перейти к Stage 2 blog projections.

