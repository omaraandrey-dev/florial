## 2026-11-13 — PR #249 (draft): services and blog route loading

Draft PR: https://github.com/omaraandrey-dev/florial/pull/249. Branch `perf/optimize-services-and-blog-pages`; no merge or Production deployment yet.

- **Services directory:** global bootstrap retains a compact Header projection, now including only the image URLs/ALT fields required for homepage cards and About-page service images. `HomePage` and `AboutPage` reuse it; full service cards and role photos are fetched only on `/services`.
- Homepage plant-category cards now use the Sanity category `plants-solitaires` instead of `plants-citrus` (synchronized query and render IDs).
- **Service detail:** fetch one published service by slug with the active language projection; 60-second in-memory cache. Avoid fetching the full service list as a prerequisite.
- **Service images:** responsive Sanity URLs for listing cards/role photos; service hero and first intro image are high priority; secondary gallery images are lazy.
- **Blog cards:** request only title, summary, cover alt and cover URL for the active language. Header, homepage BlogSection and BlogPage share language-aware list cache.
- **Blog article:** request only the selected article and fields used by Portable Text renderer; render before the separate related-post query completes. Related query returns at most three posts.
- **Automated coverage:** `tests/content-route-performance.test.mjs`.

**Validation still required:** GitHub Actions on final PR head; browser Network checks for list/detail request counts and bytes; direct URL and SPA route checks; service form and blog filter/related-post functional checks; BG/RU/EN visual QA; responsive image currentSrc and transfer size; matched mobile/desktop Lighthouse runs. No performance gain is claimed until measured.

## 2026-11-13 — Category-specific catalogue loading (PR #248 merged and deployed)

PR #248 squash-merged в `main`: `fe3e528320b88eebe3331e288bbf45591df64482`. Cloudflare Pages Production deployment `db437e51-7794-4bcd-93d0-e2ca004d59f7` — success на точном commit; URL `https://db437e51.florial.pages.dev`; production aliases `https://florial-bg.com` и `https://www.florial-bg.com`.

- `src/App.tsx` выбирает dataset по `isPlantCategory`: растения → `plants`; оборудование → `production`.
- Загрузка каталогов кэшируется раздельно. При навигации в другой каталог загружается только отсутствующий набор; product detail route сохраняет прежнее поведение и получает оба индекса, поскольку slug не сообщает dataset.
- Существующие GROQ projections и live Sanity clients сохранены. Другие небольшие запросы `production` (категории, услуги/help content и т.п.) остаются допустимыми и не являются полным product index оборудования.
- CI на точном PR head `d70ec7936a8d58c8f16550688536bd0f918a4089`: Blog/Studio `43379996722` и `43380019954` — success; D1 validation `43379996726` — success.
- **Остаётся browser QA:** Network для прямых `/category/maslini` и других plant categories должен подтвердить отсутствие полного equipment product-index запроса; equipment category — отсутствие полного plant product-index запроса. Проверить SPA переходы, product detail, search/cart и BG/RU/EN.
- Экономия байтов, изменение critical request chain и LCP пока **НЕ ИЗМЕРЕНЫ**. После browser QA выполнить повторный Lighthouse mobile/desktop на одинаковом URL и профиле сети; не приписывать homepage Lighthouse этой оптимизации.


## 2026-11-13 — Category fallback image and catalogue image sizing (PR #247 merged and deployed)

PR #247 squash-merged в `main`: `5801d390a468952563f8f339b233d15774ca74d9`. Production deployment `579f4c88-fc98-4357-ab61-21c57f7fed23` — success на точном commit; URL `https://579f4c88.florial.pages.dev`.

- Middleware no longer emits the category image as a raw HTML fallback image inside `#root`; Open Graph image metadata remains.
- Responsive desktop category hero remains available from 1024 px; image sizing is capped at a 408 px source-size estimate with Sanity quality 70.
- Catalog card `sizes` match the rendered 2/2/3/4-column grid; quality 65; only first two cards eager, remaining cards lazy.
- Optional per-image quality was added to `src/lib/sanityImage.ts`; default 75 preserves existing callers.
- CI on PR head `c94f0c5ba481a7d1a386b242629d6c376b82822c`: Blog/Studio `43376289807` success; D1 validation `43376289788` success.
- Still required: inspect mobile raw HTML/Network to confirm fallback is not requested; inspect desktop currentSrc and responsive hero; compare actual image transfer sizes; visual quality review; repeat Lighthouse mobile and desktop. Baseline mobile 13.11.2026 07:35 GMT+2: Performance 84 / FCP 0.9 s / LCP 4.5 s / TBT 0 ms / CLS 0.001 / Speed Index 2.4 s. **No post-change performance result is available; transfer savings and LCP improvement are not confirmed.**



Implemented on branch fix/category-image-responsive-loading-2026-11-13; awaiting CI and measurement.

1. Prevent the category image from being emitted as a raw HTML fallback image by the Pages Middleware. This addresses the early request seen in the mobile Lighthouse report despite the desktop-only CSS rule.
2. Preserve the category image in Open Graph metadata and keep the React desktop hero at >=1024 px.
3. Align plant/product card sizes with the actual CSS grid widths; use Sanity quality 65 for catalog cards and quality 70 for the desktop hero.
4. Reduce initial eager card images from four to two; subsequent cards remain lazy-loaded.

Validation still required: confirm no request for the category fallback image at mobile width; confirm a responsive hero image is requested at desktop width; inspect currentSrc, transfer size and visual quality; run Lighthouse mobile and desktop. The owner's 13.11.2026 07:35 mobile baseline is Performance 84 / FCP 0.9 s / LCP 4.5 s / TBT 0 ms / CLS 0.001 / Speed Index 2.4 s. No post-change performance result is available yet.

> **13.11.2026 — PR #246: loading skeleton каталога категорий объединён и опубликован в Production.** Merge commit `3f2099e6ac2c11c2461c4c14618128c618a8d413`; Pages deployment `6208bca0-23a6-48b0-a84b-b1861bac9523` — success на точном commit. CI: Blog/Studio `43370628228` и D1 validation `43370628255` — success на PR head.  `src/App.tsx` получает category-specific skeleton с высотой не менее одного viewport и тот же fallback для lazy CategoryPage; цель — исключить короткую заглушку, из-за которой Footer оказывается в первом экране, и снизить layout shift. Header/Footer, запросы Sanity, карточки/изображения и данные не менялись. Исходный mobile Lighthouse: Performance 61, LCP 4.507 s, CLS 0.693. Повторные измерения не выполнены; улучшение не заявляется.

> **13.11.2026 — PR #244 release status:** merged and deployed; owner browser QA passed for languages, categories, products, cart and search. Network waterfall/Lighthouse remain measurement tasks.

> **Историческая запись до merge — PR #244: initial JS split:** BG dictionary remains in the initial entry; RU/EN locale maps and product/search/service/category data loaders are dynamic chunks. CI build comparison: initial entry 398.12 kB raw / 108.66 kB gzip before → 336.08 kB raw / 97.95 kB gzip after (−62.04 kB raw / −10.71 kB gzip). Blog/Studio validation run `43358984471` and D1 validation run `43358984398` passed on PR documentation head `0bdc3f7` (code snapshot `1c36472`). At the time of this historical note the PR was still draft; see the current release status above. Network waterfall and Lighthouse re-test remain open; no LCP/field improvement is claimed.

> **12.11.2026 — Homepage hero Sanity photo library:** PR #242 merged as `16bd410ad4b246f4d20594823ea5fe7be2f20bdd`; Cloudflare Production deployment `4f4dc307-3f6d-416b-b411-4bceccbc3661` succeeded on the exact commit. The photo record and first-render fallback use the compressed 1518×957 asset (1,015,107 bytes vs 2,704,931 bytes). CI passed on PR head. Browser Network/Lighthouse and owner visual QA still required; no measured LCP claim.

> **12.11.2026 — Homepage hero:** managed by the Sanity `photo` document. The owner compressed the source; Production photo record now references the 1518×957 asset (1,015,107 bytes, versus previous 2,704,931 bytes). PR branch first-render fallback is synchronized to the compressed CDN URL. Browser transfer/LCP comparison remains pending.

> **Актуальный статус — 12.11.2026:** PR #240 открыт; кодовый snapshot в commit `8953f913be649f62af34d7123b15c6373c68171a` прошёл CI (Blog and Studio run `43261832983`, D1 validation run `43261833064` на последующем документационном commit). Header, homepage plant cards и полный catalogue index разделены; полный индекс товаров запрашивается только на страницах категорий и товаров, а видимость категорий вычисляется через GROQ productCount. Browser route regression, Network waterfall, Lighthouse и visual QA пока не подтверждены; performance gain не измерен. Production не менялся.

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

### P8. Initial JavaScript — locale and route-data code splitting (PR #244, deployed)

- **Статус:** merged в `main` и опубликован в Cloudflare Pages Production. Merge commit `c97255f4fc843714f0a453727a77f22b75fdf0f7`; deployment `cc421986-4aa0-49e3-85db-33d78d8546ce`, build/deploy success.
- `src/lib/i18n.tsx`: BG dictionary статически загружается как default; RU/EN подключаются динамически из `src/lib/i18n/{ru,en}.ts`. Общие типы вынесены в `types.ts`.
- Данные product detail, search, service detail и category detail загружаются через динамические loaders в `src/lib/routeData/`. В App остаются routing/state и UI orchestration; search UI целиком не считается вынесенным.
- Сохранены locale URL/localStorage/document lang, Sanity translations/fallback, GROQ projections, Sanity client/dataset selection и cancellation handling.
- CI runs `43359151357` (Blog/Studio) и `43359151359` (D1) — success. Owner browser QA подтверждает BG/RU/EN switching, категории, товары, корзину, поиск и переводы.
- Initial entry: 398.12/108.66 kB raw/gzip → 336.08/97.95 kB; снижение 62.04 kB raw и 10.71 kB gzip. Build artifact comparison не равен браузерному transfer/LCP замеру.
- **Следующий performance measurement:** собрать Network waterfall для homepage и маршрутов category/product/search/service при BG, затем при RU/EN; проверить, что RU/EN и route chunks загружаются только по необходимости. Повторить Lighthouse mobile/desktop и сравнить LCP/INP/CLS с сопоставимым baseline. До этого не заявлять улучшение Core Web Vitals.
