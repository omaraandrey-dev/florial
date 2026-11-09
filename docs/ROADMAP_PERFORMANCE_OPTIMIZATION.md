> **Актуальный статус — 09.11.2026:** performance optimization приостановлена по решению пользователя. PR #163 объединён в `main` (merge commit `a12068bc3a8a4707f70e19abc76ecf382d98eabe`), Production deployment `6cab6c9b-7490-4b1e-8bb2-57fcc9c53070` завершился успешно; aliases `florial-bg.com` и `www.florial-bg.com` назначены. PR #156 route-height wrapper и commit `9bd5d3f` SEO fallback dimensions отменены. Ранее завершённые responsive images, Sanity CDN, lazy route chunks и Hero LCP сохранены. Lighthouse, INP и новые CLS замеры не проводились. Browser Rendering подтвердил HTML главной, но остальные route smoke запросы ограничены HTTP 429; полная browser regression не подтверждена.

# Florial — дорожная карта оптимизации производительности

**Версия:** 1.0  
**Дата:** 09.11.2026  
**Статус:** PR #148–#152 сохранены; PR #156 и commit `9bd5d3f` отменены PR #163. Текущая версия Production — merge commit `a12068bc3a8a4707f70e19abc76ecf382d98eabe`, deployment `6cab6c9b-7490-4b1e-8bb2-57fcc9c53070` — success. Performance optimization приостановлена. Исторические результаты PR #156 ниже сохранены как история, но не описывают текущую реализацию. Responsive images, Sanity CDN, lazy route chunks и Hero LCP остаются.
**Репозиторий:** omaraandrey-dev/florial, ветка main  
**Production:** https://florial-bg.com  
**Стек:** React 18, Vite 8, Sanity, Cloudflare Pages/Functions и D1. Supabase не используется.

> Это основной план ускорения Florial. В новом чате сначала прочитать актуальную MD2-инструкцию, docs/TECHNICAL_PASSPORT.md, CHANGELOG.md и этот документ. Затем сверить текущий main и Production: статусы ниже относятся к дате документа.

## Последняя контрольная точка 09.11.2026 — PR #148–#152

- PR #148–#152 merged; runtime main commit `a88ce6ca513abcad4b7ee107c441fa62ec570ec3`; Production deployment `6cad50d7-291a-4004-ae15-b77786f3d292` success.
- Reports: `docs/performance/POST_OPTIMIZATION_CDN_AND_IMAGES_2026-11-09.md` and `docs/performance/POST_OPTIMIZATION_HERO_LCP_2026-11-09.md`.
- Public Sanity content uses API CDN; product prices/stock, product search/detail, delivery tariffs, Manager and order validation stay live.
- Responsive images cover homepage cards, blog, services, About, categories, product detail, public search and HomePage Hero. Header logo remains unchanged.
- Category `/category/rastenia`: initial image-response bytes ~17.9 MB → 1,081,732 B; FCP median 428→408 ms, DCL 575→562 ms, load 691→691 ms.
- Hero LCP: mobile 3,620→696 ms (−80.8%), desktop 3,908→912 ms (−76.7%); Hero image 2.70 MB → 17.4 KB mobile / 141.6 KB desktop AVIF. CLS on homepage unchanged.
- Cloudflare JS/CSS cache HIT; HTML remains DYNAMIC. No Cloudflare settings/rules changed.
- Mobile SPA Back/Forward/scroll regression passed. New finding: category/product/blog/article routes show large CLS when async content replaces short loading placeholders; category/blog source inspection shows Footer moving. Do not change shared layout until explicit approval.

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

### P2. Полные данные статей для карточек блога — выполнено PR #145

В `src/lib/blog.ts` введены отдельные compact card и full detail projections. Список статей содержит только slug/date/cover и локализованные title/shortDescription/coverAlt; body Portable Text, gallery, SEO и tags загружаются только для открытой статьи. Header и BlogSection используют общий promise cache (TTL 60 секунд), предотвращающий дублирование одновременного `fetchBlogPosts(3)`. BlogPage и related articles также используют compact records. Реальные опубликованные Sanity projections и live BG/RU/EN страницы проверены. Wire transfer/CDP до и после ещё не измерены.

### P3. Sanity CDN — частично выполнено PR #149

- `sanityClient` и `publicPlantsClient` используют `useCdn: true` и `perspective: 'published'` для публичного контента и категорий.
- `sanityLiveClient` и `plantsClient` остаются `useCdn: false` для цен, наличия, продуктового поиска/деталей, доставки и Manager reads.
- `functions/api/orders.ts` продолжает серверную проверку по live API.
- Read-only сравнение `api.sanity.io` и `apicdn.sanity.io` для API version `2024-01-01`, perspective `published`: результаты совпадают; CDN cache policy 60 s; повторный query hit около 10–12 ms против 116–140 ms для live API в одном браузерном session.
- Не использовать CDN для немедленного чтения после записи, Manager writes или order validation.

### P4. Начальный JavaScript

PR #146 перевёл ManagerApp на React lazy dynamic import: публичный маршрут не загружает Manager chunk; он загружается только на /manager. Один remote browser sample при 1920×993 показал public JS transfer 161,151 B против 209,165 B до PR #146 (single sample, не controlled mobile baseline).

PR #147 перевёл десять non-home pages в `src/App.tsx` на React.lazy: About, Cart, Contacts, Services list/detail, Category, Product, Blog list/article, IrrigationSupport. HomePage остаётся в initial bundle. Build artifact main entry уменьшился с 620.15 kB raw / 163.82 kB gzip до 388.90 kB raw / 106.91 kB gzip (−34.74% gzip). Page chunks выводятся отдельно. Direct-route smoke прошёл; mobile SPA navigation/Back/Forward/scroll restoration теперь проверены на 390×844. Полная route chunk resource inspection остаётся открытой. Серверные модули не должны попадать в client bundle.

### P5. Изображения — Hero LCP и responsive images опубликованы PR #148, #150, #152

- Общий helper `src/lib/sanityImage.ts`: responsive widths 160–1600w, `srcSet`, `sizes`, intrinsic width/height, `fit=max`, `auto=format`, `q=75`.
- Применён к HomePage cards, BlogSection/BlogPage/BlogPostPage и Portable Text, ServicePage, AboutPage, CategoryPage, ProductPage, public product search и Hero.
- CategoryPage: первые четыре product cards eager, остальные lazy. В mobile capture 390×844: 29 img в DOM, 28 srcSet; initial image-response bytes ~17.9 MB → 1,081,732 B (около −94%); после полного scroll все 29 изображений загрузились, ошибок нет.
- HomePage Hero confirmed as actual LCP: mobile 3.62→0.696 s, desktop 3.908→0.912 s; 2.70 MB original PNG replaced by 17.4 KB mobile AVIF / 141.6 KB desktop AVIF. CLS on homepage unchanged.
- Header logo remains original PNG 1547×581 (~656 KB); Header protected from changes without separate approval.
- Other routes show high CLS during async content load; investigate shared App loading area separately and get approval before layout change.

### P6. Cache headers и статика — аудит выполнен, HTML edge cache открыт

- Hashed JS/CSS: `cf-cache-status: HIT`, `Cache-Control: public, max-age=31536000, immutable`; Brotli, HTTP/2/3 включены.
- HTML: `cf-cache-status: DYNAMIC` при `s-maxage=300`, `stale-while-revalidate=600`; повторные запросы остаются DYNAMIC.
- Custom Cache Rules/Page Rules не обнаружены; zone defaults: cache level aggressive, edge TTL 7200 s, browser TTL 14400 s.
- Cloudflare settings/rules/secrets не менялись. HTML caching требует отдельной политики и исключений для Manager, API, cart, checkout, orders и персональных маршрутов.

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

- [x] Ввести лёгкую blog card projection: title, shortDescription, slug, publishedAt, cover URL и ALT/caption.
- [x] Убрать body/gallery/SEO/tags из запроса списка публикаций.
- [x] Объединить одновременные `fetchBlogPosts(3)` вызовы Header и BlogSection через promise cache TTL 60 секунд.
- [x] Полную статью получать по slug только на BlogPostPage.
- [x] BlogPage и related articles перевести на compact records.
- [x] Сохранить BG/RU/EN, ALT, даты, slug, публикационный статус, порядок и ссылки.

**Релиз:** PR #145, merge commit `6897cb1ad4ef4bb8429838c83f11c515ad9fec80`; Cloudflare Production deployment `1f9145d2-7aeb-46e7-840d-e79af9e70a68` success. Live smoke homepage, Header Portfolio, /blog и Rain Bird article BG/RU/EN прошёл. Sanity read-only projections вернули top-3 3 карточки и all-list 22 карточки. Реальный wire transfer и CDP request count не измерялись.

**Критерии:** визуально прежние карточки; компактный список без body/gallery; один общий in-flight запрос для Header/BlogSection; полная статья работает. Все функциональные проверки пройдены; количественное измерение скорости остаётся открытым.

### Этап 3 — Оптимизация изображений

1. [x] Общий Sanity helper с responsive `srcSet`/`sizes`, форматом и размерами.
2. [x] HomePage cards, BlogSection, BlogPage, BlogPostPage/Portable Text, ServicePage, AboutPage.
3. [x] CategoryPage, ProductPage и public product search images; first four category cards eager, remaining lazy.
4. [x] Проверка категории растений на 390×844: 28/29 img имеют srcSet, все 29 загружаются после scroll, 0 failed images.
5. [x] HomePage Hero background заменён на responsive LCP img с eager/high priority; mobile/desktop LCP improved by ~81%/~77%, CLS unchanged.
6. [~] Header logo (~656 KB) требует отдельного согласования. Full desktop visual review, Lighthouse/CrUX and all-route CWV remain open.

Критерии: меньше переданных байтов; LCP не ухудшился; CLS не вырос; изображения не размыты и не обрезаны неправильно.

### Этап 4 — Sanity CDN и кэширование

1. [x] Разделены public published content clients и live commercial clients.
2. [x] `sanityClient`/`publicPlantsClient` используют API CDN; `sanityLiveClient`/`plantsClient` остаются live.
3. [x] Проверены read-only совпадение результатов и 60-секундная CDN cache policy.
4. [x] Подтверждено: product prices/stock, product search/detail, delivery tariffs, Manager reads и order validation идут через live API.
5. [x] Cloudflare hashed JS/CSS — HIT/immutable; HTML repeated response остаётся DYNAMIC; custom Cache Rules/Page Rules не найдены.
6. [ ] Решить отдельно, нужна ли targeted HTML Cache API policy. Cloudflare settings не менять без согласования и исключений для Manager/API/cart/checkout/orders.

Критерии: подтверждённая cache policy; публикации видны в допустимый срок; API и персональные данные не кэшируются публично.

### Этап 5 — Code splitting и JavaScript

- [x] Отложить импорт ManagerApp до маршрута /manager через React lazy import (PR #146).
- [x] Перевести десять non-home page components на lazy imports; HomePage оставить в initial bundle (PR #147).
- [x] Добавить локализуемый Suspense fallback вокруг route content, не меняя Header/Footer.
- [x] Проверить production build: main entry gzip снизился с 163.82 до 106.91 kB (−34.74%); отдельные page chunks сформированы.
- [x] Проверить прямое открытие 16 public routes; контент рендерится, постоянных loading placeholders нет.
- [x] SPA navigation, Back/Forward и scroll restoration проверены на mobile 390×844: Home → Services → planting service; scroll восстановлен в пределах 20 px.
- [ ] Повторить live resource inspection для public и каждой lazy route; подтвердить фактическую загрузку нужных chunks.
- [x] PDF/document generation не менялись; остаются в существующих server-side Functions.

**PR #146/#147:** оба Production deployments успешны. PR #146 выносит ManagerApp; PR #147 делит public pages. Build artifact gzip main entry −34.74%; это не controlled mobile transfer measurement и не общая оценка скорости страницы.

Критерии: Manager chunk не загружается публичными страницами; non-home page chunks загружаются только при соответствующих маршрутах; все direct URLs и SPA transitions работают.

### Этап 6 — Остальные страницы

- [x] Blog, article, services, About, categories, product detail и public search images получили responsive Sanity images.
- [x] Product detail `/product/musa-banana` smoke: H1/title, price content, 4 images/3 srcSet, no failed images.
- [ ] CartPage/checkout и Manager остаются вне image changes; проверять отдельно, не менять их в рамках этого этапа без отдельного плана.
- [ ] Полная проверка всех equipment/plant category, kits, filters, search, cart/checkout and Manager routes.

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

- [x] Roadmap и статический аудит исходного кода зафиксированы.
- [~] Этап 0 — baseline, category comparison and homepage LCP capture completed. Lighthouse/CrUX and INP remain open; CLS issue discovered on async content routes.
- [x] Этап 1 — compact service/product/category projections, on-demand details, search on demand и homepage 6+6 опубликованы.
- [x] Этап 2 — compact blog cards, full article by slug, shared 60s promise cache Header/BlogSection опубликованы; BG/RU/EN smoke прошёл.
- [~] Этап 3 — responsive/lazy images for HomePage cards, blog, services, About, categories, products, search and Hero published. Category initial image-response bytes ~17.9 MB → 1.08 MB; homepage Hero LCP mobile 3.62→0.696 s and desktop 3.908→0.912 s. Header logo remains open.
- [~] Этап 4 — public published content использует Sanity API CDN; price/stock/delivery/Manager/order validation остаются live. HTML edge caching не настроен и требует отдельного решения.
- [~] Этап 5 — ManagerApp и десять non-home route chunks опубликованы; main entry gzip −34.74%; direct routes и mobile SPA Back/Forward/scroll regression проверены. Полная route chunk inspection ещё открыта.
- [~] Этап 6 — blog/services/About/category/product/search images оптимизированы; cart/checkout и Manager image/page review остаются отдельными.
- [~] Этап 7 — три Production releases #148–#150 успешны; category/product and SPA smoke passed. Полный multi-route mobile/desktop regression и CWV остаются открытыми.

**Текущая точка продолжения:** PR #148–#152 опубликованы; homepage Hero LCP оптимизирован и подтверждён mobile/desktop замерами. Public Sanity content uses CDN; commercial data remains live. Category image bytes reduced ~94%. Следующий критический пункт — высокий CLS на category/product/blog/article routes: preliminary source inspection points to short loading placeholders and Footer moving when asynchronous content expands. Предлагаемое изменение — reserve a stable minimum height in shared main-content loading area in `src/App.tsx`, without editing Footer component. Это затрагивает shared layout, поэтому сначала требуется явное согласование. Header logo и HTML edge cache остаются отдельными задачами.

## 7. Инструкция для нового чата

1. Найти и прочитать самую новую MD2 по номеру редакции/дате.
2. Прочитать docs/TECHNICAL_PASSPORT.md и последние записи CHANGELOG.md.
3. Прочитать docs/ROADMAP_PERFORMANCE_OPTIMIZATION.md.
4. Проверить актуальный main, исходники и последний Cloudflare Production deployment.
5. Проверить отмеченные этапы и более новые отчёты.
6. Продолжить с первого незавершённого этапа, не повторяя сделанное без причины.
7. Перед изменениями объяснить конкретный план и запросить согласование там, где оно требуется.

### Стартовый запрос

Продолжаем ускорение Florial. Найди самую новую MD2-инструкцию (сейчас rev41) в GitHub main, прочитай TECHNICAL_PASSPORT.md, CHANGELOG.md, docs/ROADMAP_PERFORMANCE_OPTIMIZATION.md, docs/performance/BASELINE.md и docs/performance/POST_OPTIMIZATION_CDN_AND_IMAGES_2026-11-09.md. Проверь актуальный main и последний Cloudflare Production deployment. PR #148–#150 опубликованы: responsive Sanity images, разделение public CDN/live clients, category/product images. Следующая задача — определить LCP главной и повторить controlled mobile/desktop measurements для homepage, equipment category, product, search, blog и article. Header logo и Cloudflare HTML edge caching не менять без отдельного согласования.


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
- Карточные изображения HomePage используют Sanity responsive widths 160–1600, `srcSet`, `sizes`, `auto=format`, `q=75`, lazy loading, async decoding и intrinsic dimensions. Hero background теперь responsive LCP img с high fetch priority; Header logo не менялся.
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



## Диагностическая точка 09.11.2026 — Sanity payload после PR #142–#144

- Дополнительный отчёт: `docs/performance/POST_OPTIMIZATION_SANITY_DIAGNOSTIC_2026-11-09.md`.
- На homepage зафиксировано 9 Sanity API requests. Отдельный read-only fetch `cache:no-store` измерил 1,077,038 B decoded response bodies; это не encoded network transfer.
- Два одинаковых blogPost fetch — по 145,912 B каждый; каждый запрос всё ещё включает body и gallery. Следующая задача Stage 2 — одна shared compact blog-card projection для Header и BlogSection, полную статью загружать по slug на BlogPostPage.
- Browser tool не поддержал baseline viewport, cache disable и CPU/network throttling. Значения TTFB/FCP и PerformanceResourceTiming из этого запуска не сравнивать с baseline. Не заявлять процент ускорения.



## Контрольная точка 09.11.2026 — PR #145: компактные карточки блога

- PR #145 merged squash: `6897cb1ad4ef4bb8429838c83f11c515ad9fec80`; runtime files: `src/lib/blog.ts`, Header, BlogSection, BlogPage, BlogPostPage.
- List projection включает slug, publishedAt, cover URL/ALT/caption и localized title/shortDescription/coverAlt BG/RU/EN; исключает body, gallery, SEO, tags. Full detail по slug сохраняет полный Portable Text, SEO и gallery.
- Shared in-flight cache TTL 60 sec keyed by list limit. Header + BlogSection use same top-3 request. Rejected promise evicted; cache token protects newer request.
- Read-only Sanity: top 3 documents / 4,668 chars of tool output; all 22 / 29,597 chars; full article queries tested with 47,544 and 35,000 chars of tool output. These are not encoded transfer bytes.
- CI: Blog/Studio validation `42590188304` success; D1 validation `42590188234` success.
- Production: Cloudflare deployment `1f9145d2-7aeb-46e7-840d-e79af9e70a68` success, commit matches merge commit, aliases florial-bg.com and www.florial-bg.com.
- Live smoke BG/RU/EN: homepage shows 3 blog cards; /blog shows 22 articles; Rain Bird article renders localized body, cover/gallery and related links; Header Portfolio dropdown opens with 3 article links and CTA. No loading placeholders.
- No Sanity writes/schema changes, D1, API, Manager, cart/checkout, Cloudflare config or header/menu/footer layout changes.
- Post-release PerformanceResourceTiming check: 8 Sanity API URLs, all distinct, including one compact top-3 blog query; previous diagnostic had 9 URLs with duplicate blog fetch. This confirms the duplicate request was removed. Cross-origin transferSize/encodedBodySize/decodedBodySize were 0, so no network bytes were measured. Controlled CDP/Lighthouse/CWV remain open; no overall speed percentage claimed.

**Следующая задача:** controlled CDP capture with the exact baseline profile (390×844, CPU 4×, 150 ms latency, 10/1.5 Mbps, cache disabled, at least 3 runs) for homepage, category, product, search, blog list and article. If capture tooling is still unavailable, document the limitation and proceed only with another code target supported by source evidence. Then assess Stage 3 image inventory/LCP and Stage 4 Sanity CDN/cache without changing CDN settings until freshness is validated.



## Контрольная точка 09.11.2026 — PR #147: lazy public page components

- PR #147 merged squash: `b35b5e499700d0330a7ea43ca1ca09e4f6cad7e8`; changed only `src/App.tsx`.
- HomePage stays eager. AboutPage, CartPage, ContactsPage, ServicesListPage, ServicePage, CategoryPage, ProductPage, BlogPage, BlogPostPage and IrrigationSupportPage use React.lazy named-export imports. One Suspense fallback wraps route content; Header/Footer stay outside.
- CI: Blog and Studio validation `42592562970` success; D1 validation `42592563158` success.
- Production: Cloudflare deployment `20836dfd-7536-4379-be50-2c865800c814` success; commit matches merge commit; aliases florial-bg.com and www.florial-bg.com.
- Live direct-route smoke: homepage BG/RU/EN; /about; /cart empty; /contacts; /services; planting service; irrigation delivery support; plant and irrigation root categories; Rain Bird product; Trachycarpus plant; /blog; Rain Bird article; search Rain Bird 130 results. All rendered content, no persistent Suspense/loading placeholders.
- Build output main index: before PR #147 620.15 kB raw / 163.82 kB gzip; after 388.90 kB raw / 106.91 kB gzip; reduction 231.25 kB raw / 56.91 kB gzip (34.74% gzip). Separate route chunks: BlogPage 3.67/1.68, ContactsPage 7.23/2.48, BlogPostPage 8.67/3.27, ServicesListPage 12.21/4.28, CartPage 23.14/6.16, IrrigationSupportPage 24.19/7.31, ServicePage 26.27/8.35, AboutPage 35.76/9.59, ProductPage 46.80/12.52, CategoryPage 47.41/12.60 kB raw/gzip.
- These are Vite build artifacts, not live transfer or page speed metrics. SPA navigation/scroll regression and live chunk network inspection remain open.
- No Sanity, D1, API, Manager, cart/checkout, Header/menu/Footer layout or Cloudflare config changes.



## Контрольная точка 09.11.2026 — intrinsic dimensions для SEO fallback image

### Runtime release
- На `main` опубликован commit `9bd5d3fb268d7dec9c3dab330e8039987ec78718`.
- Изменены `functions/_middleware.ts`, добавлен `functions/lib/sanityImageDimensions.ts`, добавлен тест `tests/sanity-image-dimensions.test.mjs`.
- Для изображения в `documentBody` middleware добавляет исходные `width` и `height`, если URL принадлежит `https://cdn.sanity.io/images/` и имя файла содержит валидные размеры `-WIDTHxHEIGHT.ext`. Невалидные, внешние и dimensionless URL остаются без придуманных размеров.
- Cloudflare Pages Production deployment `88fd47db-3990-4447-813e-be6b12a42028` — `success`, commit совпадает с main, aliases `florial-bg.com` и `www.florial-bg.com`.
- GitHub Actions run `42635382574` — success: dependency installation, lint, website build, Pages Functions syntax. Push workflow не выполняет `npm test`; новый unit test suite должен быть подтверждён PR validation.

### Что подтверждено и что нет
- Изменение является ограниченной mitigation для intrinsic image geometry в SEO fallback HTML.
- Оно НЕ доказывает, что residual CLS категории устранён. Последняя подтверждённая мобильная медиана до этого релиза — `0.3441`; post-release повторные измерения не выполнены.
- Live scrape категории вернул HTTP 200, но инструмент показал hydrated React loading shell, а не исходный HTML до JavaScript. Наличие атрибутов в первом HTTP response не подтверждено.
- Мобильная CategoryPage не показывает большое изображение категории (оно `hidden lg:block`); подкатегории и product images имеют фиксированные контейнеры. Поэтому нельзя автоматически приписывать residual CLS видимому мобильному изображению CategoryPage.
- Для точного диагноза требуется CDP PerformanceObserver trace на холодной загрузке и просмотр source nodes/rects. До него не менять shared layout или category markup.

### Открытые пункты
1. Повторить mobile CLS 3 раза на прежнем профиле 390×844, CPU 4×, latency 150 ms, 10/1.5 Mbps, cache disabled.
2. Провести desktop CLS с отдельным профилем и trace.
3. Получить Lighthouse mobile/desktop, INP field data (если CrUX доступен) и/или лабораторный interaction latency.
4. Если CLS остаётся, проверить начальный SEO fallback и его замену через `createRoot`, async category detail, fonts and images. Не считать одну гипотезу доказанной.
5. Не менять Header/menu/Footer, Sanity, D1, Manager, checkout, APIs или Cloudflare settings ради этих измерений.


## 09.11.2026 — Повторная browser-rendering диагностика Production

### Подтверждение runtime fix
- Cloudflare Browser Rendering с отключённым JavaScript получил категорию HTTP 200.
- В исходном серверном HTML присутствует SEO H1, нет текста загрузочного placeholder; изображение категории содержит `width="1254" height="1254"`. Это подтверждает, что intrinsic dimensions действительно отдаются до выполнения JavaScript.

### CLS без искусственного throttling
Профиль: mobile 390×844, desktop 1365×900, cacheTTL=0, browser rendering, без CPU/network throttling.

- Категория, 3 запуска: mobile `0 / 0.0002631 / 0.0002631`, median `0.0002631`; desktop `0.0148097 / 0.0148097 / 0.0148097`, median `0.0148097`.
- Главная, 3 запуска: mobile median `0.0002631`; desktop median `0.0148097`.
- Блог, услуга посадки лаванды и проверенная статья блога: по одному запуску на viewport; mobile `0.0002631`, desktop `0.0148097`.
- Mobile source: только search form в Header (ширина 169.27→158.45 px, x=108.69→119.5 px).
- Desktop sources: общая геометрия Header/content (wrapper y=73/h=827 → y=77/h=823) и search form (x=323.39/y=15 → x=344.81/y=17). Footer не является source. Значение desktop CLS < 0.1; сдвиг общий для разных маршрутов, не специфичен для категории.
- Header не изменялся.

### LCP / FCP — browser-rendering, не Lighthouse
- LCP median: категория mobile `0.872 s`, desktop `0.812 s`; главная mobile `1.692 s`, desktop `1.504 s`.
- FCP median: категория mobile `0.532 s`, desktop `0.324 s`; главная mobile `1.296 s`, desktop `0.836 s`.
- Значения получены без throttling и зависят от среды browser-rendering. Не сравнивать напрямую с предыдущим профилем CPU 4× / latency 150 ms / 10 Mbps / 1.5 Mbps; не обозначать их как Lighthouse scores или field data.

### Что остаётся открытым
1. Повторить post-fix 3-run mobile CLS на прежнем контролируемом профиле 390×844, CPU 4×, latency 150 ms, 10/1.5 Mbps, cache disabled.
2. Lighthouse mobile/desktop.
3. INP: в диагностике не было доверенных пользовательских взаимодействий, Event Timing не вернул interaction entries. Long Tasks не подменяют INP.
4. После контролируемого повторения сравнить с исходной медианой 0.3441 и только тогда закрыть этот пункт окончательно.

