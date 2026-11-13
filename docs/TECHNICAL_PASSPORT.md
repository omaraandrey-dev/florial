## 2026-11-13 — SEO metadata unified for all 17 plant categories

- Updated and published all 17 existing category documents in Sanity project `bxvcy0qs`, dataset `plants`; no category IDs, slugs, parent references, images, product relationships, category descriptions or SEO body blocks were changed.
- Filled localized `seo.metaTitle` and `seo.metaDescription` for BG, RU and EN: 51 titles and 51 descriptions. Each description is category-specific, begins with a localized sale/for-sale phrase, includes relevant local geography (Nessebar/Несебър, Ravda/Равда and the Southern Black Sea coast where appropriate), and mentions delivery/planting only where relevant.
- Title format follows the agreed local SEO pattern: category name + geographic location + Florial garden-centre brand. The shorter Florial suffix is used when the full centre name would make a title exceed 70 characters. All 51 titles passed the 70-character check.
- Existing H1 values were preserved. Comparison of the exact pre-write backup with the published documents found zero H1 changes across all 17 categories and all three locales. `noIndex` values were not intentionally changed.
- Pre-write backup: `docs/backups/sanity-plant-categories-before-seo-2026-11-13.json` (17 complete published-document snapshots; 358,092 characters).
- Sanity write result: 17/17 document patches successful; 17/17 published. Post-publish GROQ read-back confirmed all 17 documents and all 102 localized meta fields (51 title + 51 description); no missing values or title-length violations.
- No schema, application code, Cloudflare configuration, D1, Resend, product records, individual plant product SEO, or deployment was changed.
- **CI on exact content/docs head `6100fbe1ba79f977700c4a442005b37266f4f4c7`:** Blog and Studio validation run `43406072024` — success (lint, website utility tests, website build, read-only migration dry-run and Studio build); D1 migration validation run `43406071860` — success. No application code changed.
- Live Production HTML/crawler rendering and Google re-crawl are not independently confirmed in this operation. Metadata is confirmed in published Sanity; runtime rendering is governed by the existing category SEO resolver/middleware.

## 2026-11-13 — PR #251 merged and deployed; owner QA pending

- PR #251: https://github.com/omaraandrey-dev/florial/pull/251 — squash-merged.
- Merge commit: `eb8553f73732bc18d8b64cdcf112f8f2d00fd4d4`.
- Cloudflare Pages Production deployment `928ed2ca-fffb-4941-8942-529bf3119c3b` — **success** on the exact merge commit; deployment URL: https://928ed2ca.florial.pages.dev.
- Preview deployment policy remains `all` with branch include `*`; Production branch remains `main`.
- CI passed on final PR head `6170907cc7aefbf0b92cd94641590cd4a1ed46b7`: Blog and Studio runs `43400080140` and `43400000309` — success; D1 migration validation run `43400000333` — success. Documentation-only follow-up commits did not alter implementation code.
- Phase 1 implements server-rendered plant category product fallback and ItemList JSON-LD. Existing React catalogue remains responsible for interactive browsing; equipment-category SSR is deferred to Phase 2.
- **Owner QA remains pending:** check live category pages in BG/RU/EN, product cards, links, prices/availability, layout and browser console.
- **Initial-response QA limitation:** the earlier browser scrape captured the DOM after React startup, not a proven JavaScript-disabled first HTTP response. The documentation does not claim that raw initial HTML was independently inspected.
- No Sanity writes, D1 schema/data changes, Resend changes, Production secrets/bindings/DNS changes, or Header/menu/Footer/global React architecture changes. Cloudflare Preview deployment policy was changed earlier with owner approval.

## 2026-11-13 — Plant category server-rendered catalogue (PR #251; CI and Preview deployment passed)

- Phase 1 adds the plant catalogue to the first HTML response for category routes resolved from the published Sanity `plants` dataset.
- `functions/_middleware.ts` loads the published category tree, computes descendants, then fetches active plant products using `references($categoryIds)`. Projection is limited to localized display names/SEO H1 fallback, slug, price, stock status and sale variants.
- `functions/_lib/plantCategoryHtml.mjs` renders a semantic list of up to 20 plant products, detail links, starting prices and known availability labels; unknown stock status is not guessed. It also creates an ItemList JSON-LD object.
- Existing React rendering and browser-side live catalogue fetches remain unchanged. The first HTML is replaced by React `createRoot` after JavaScript starts; this is not hydration.
- Category tree cache 300 s; product list cache 30 s; plant-category HTML edge cache 30 s / stale-while-revalidate 60 s. Sanity failure or malformed response produces the middleware 503/noindex response, not an empty-category message.
- Read-only live Sanity query validation: 17 category documents; 12 product documents returned for `plants-palms`; 50 product documents returned for the full `plants-root` category tree. No content/schema writes.
- Regression tests cover category descendant resolution, localized names/links, HTML escaping, known/unknown availability, empty result handling, ItemList and middleware integration.
- **CI:** exact PR head `0ef46d74d7fd5e48af38c80985a1604e968bbf30` passed Blog and Studio validation run `43396561749` and D1 migration validation run `43396561879`.
- **Cloudflare Preview:** project setting changed with owner approval from `none` to `all`; branch include pattern remains `*`. Preview deployment `5fc9f0fb-3f3c-4e82-b1a1-8556866f093c` succeeded on documentation-updated PR head `73c2132f4ac69546c26697d48b33a156991460d3`. Initial HTTP HTML QA remains pending; the available scrape captured the post-JS DOM. Preview has no D1 binding and is not suitable for Manager/orders tests.
- **Production:** remains on `main` commit `0df7a52bb2a923f71096179c3837141382446554`; deployment `5c52db09-707f-47a7-a4c7-1ffea0300130` succeeded on that commit. PR #251 is not merged/deployed.
- **Not yet confirmed:** raw HTML in BG/RU/EN, Googlebot/AI crawler interpretation, browser JS/no-JS parity or indexing impact. Equipment category rendering is Phase 2.
- Detailed design and verification ledger: `docs/audits/2026-11-13-plant-category-server-rendering.md`.

## Cloudflare Pages Preview policy — live checkpoint 13.11.2026

- Project `florial`, production branch `main`; Preview deployments are enabled for all branches (`preview_deployment_setting=all`, include pattern `*`) after owner approval.
- Production deployments remain enabled. This change did not alter Production deployment configuration, environment variables/secrets, bindings or DNS.
- Production D1 binding `DB` remains configured; Preview has no D1 binding. Treat Preview as a public, limited validation environment for public routes and plant-category SSR only; do not test Manager/orders flows there. Preview URLs are public unless protected separately.
- Legacy Supabase-named environment keys remain in Cloudflare configuration: Preview has `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`; Production has those two plus `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Only key names were inspected; values were not read. Runtime usage was not re-audited in this task. These are residual configuration keys, not evidence of an active Supabase architecture; removal requires a separate code-usage audit and owner approval.

## 2026-11-13 — Production incident after PR #249: root cause and hotfix

- **Incident:** initial React render of the storefront fails, resulting in an empty `#root`.
- **Root cause confirmed by source inspection:** `src/App.tsx` has a dependency array for the SEO effect that evaluates `currentService` before its `const` declaration later in the component. This is a temporal-dead-zone `ReferenceError`; it occurs before React can render the page.
- Cloudflare deployment `467d9866-0d04-4ef1-b265-3f84b6533950` had successful build/deploy stages, but no client-side runtime smoke test. This did not validate app startup.
- Corrective branch: `hotfix/app-current-service-initialization`. The declaration is moved above its first use; regression test added.
- **Production status:** no rollback or hotfix deployment has been performed yet. Awaiting CI and explicit release authorization.

## 2026-11-13 — PR #249: service and blog route loading optimization merged and deployed

**Статус:** PR #249 squash-merged в `main`, commit `d4b19a59775cb6370ed28a3d90dd4ef36760db9f`. Cloudflare Pages Production deployment `467d9866-0d04-4ef1-b265-3f84b6533950` — success на точном commit; URL `https://467d9866.florial.pages.dev`; aliases `https://florial-bg.com` и `https://www.florial-bg.com`. CI на final PR head `91bc8abd042f6624dc531081bbde077d254d76cc`: Blog and Studio run `43389185896` — success; D1 validation run `43389169540` — success. Browser QA and Lighthouse remain pending.

- Full service listing data and role photos load only on `/services`. A compact service query remains in the global Header data loader and includes only navigation fields plus service image URLs/ALT fields; this same compact result supplies homepage service cards and About-page service images. The full directory query remains route-specific.
- Homepage plant-category selection is synchronized in `src/App.tsx` and `src/pages/HomePage.tsx`: `plants-solitaires` replaces `plants-citrus` in the six homepage category cards.
- Service detail routes query the selected Sanity service by slug directly. Query projection is localized for BG/RU/EN and cached in memory for 60 seconds. No full service directory is required to render a service detail.
- Service list cards and role images use responsive Sanity image URLs. Service hero and first intro image are eager/high priority; other images remain lazy.
- Blog list/homepage/Header cards request the active language only. Blog article page fetches its own localized document first and loads up to three related posts in a separate request.
- Blog Portable Text query now selects only the fields used by `BlogContent`, with image/video block-specific projections. List, detail and related-post requests use language-aware short-lived caches.
- Regression tests added in `tests/content-route-performance.test.mjs`.
- **Still pending:** browser Network waterfall, direct route and SPA navigation, service form/related links, blog filtering and article content in BG/RU/EN, visual quality, repeat Lighthouse/transfer savings. CI and Production deployment are confirmed above.
- Production, Sanity content/schema, D1, Resend, Cloudflare configuration and secrets have not been changed.

## 2026-11-13 — PR #248: category-specific catalogue loading merged and deployed

**Статус:** PR #248 squash-merged в `main`, commit `fe3e528320b88eebe3331e288bbf45591df64482`. Cloudflare Pages Production deployment `db437e51-7794-4bcd-93d0-e2ca004d59f7` — success на том же commit; URL `https://db437e51.florial.pages.dev`; aliases `https://florial-bg.com` и `https://www.florial-bg.com`.

- CI на точном PR head `d70ec7936a8d58c8f16550688536bd0f918a4089`: Blog and Studio validation runs `43379996722` и `43380019954` — success; D1 validation run `43379996726` — success.
- `src/App.tsx`: plant category routes загружают только `plantsClient` / dataset `plants`; equipment category routes — только `sanityLiveClient` / dataset `production`.
- Состояние загрузки кэшируется независимо для `plants` и `equipment`. При SPA переходе в другой каталог загружается только ещё не загруженный dataset; уже полученные товары сохраняются без дублирования по `_id`.
- Category route ожидает загрузки категорий для определения `isPlantCategory`; неизвестный category slug не инициирует product catalogue query.
- Product detail route по-прежнему загружает оба индекса, поскольку slug не идентифицирует Sanity dataset. Search loader не менялся.
- GROQ projections, live clients, цены/остатки, фильтры, сортировка, корзина и обработка вариантов растений не менялись.
- Browser Network/functional QA и повторный Lighthouse пока не выполнены. Не подтверждены фактическое отсутствие противоположного product-index query в браузере, transfer saving и изменение LCP/critical path.
- Sanity documents/schema/assets, D1 schema/data, Resend, Cloudflare settings/secrets, SEO metadata, Header/menu/Footer и routing не менялись.


## 2026-11-13 — PR #247: responsive category fallback and plant catalogue images deployed

**Статус:** PR #247 squash-merged в `main`, commit `5801d390a468952563f8f339b233d15774ca74d9`. Cloudflare Pages Production deployment `579f4c88-fc98-4357-ab61-21c57f7fed23` — success на том же commit; URL `https://579f4c88.florial.pages.dev`; aliases `https://florial-bg.com` и `https://www.florial-bg.com`.

- CI на точном PR head `c94f0c5ba481a7d1a386b242629d6c376b82822c`: Blog and Studio validation run `43376289807` — success; D1 migration validation run `43376289788` — success.
- `functions/_middleware.ts`: для category document удалён raw fallback `<img src>` из HTML внутри `#root`; category image остаётся в Open Graph metadata. Desktop category hero отображается клиентским responsive `<picture>` начиная с 1024 px.
- `src/lib/sanityImage.ts`: добавлен необязательный параметр quality; default 75 для существующих вызовов сохранён.
- `src/pages/CategoryPage.tsx`: sizes карточек согласованы с фактической grid-сеткой; quality карточек 65; первые две карточки eager, остальные lazy; desktop hero — sizes с пределом 408 px и quality 70.
- Не менялись Sanity documents/schema/assets, D1 schema/data, Cloudflare settings/secrets, SEO metadata, Header/Footer и routing.
- **Не подтверждено:** mobile/desktop browser Network inspection, выбранные currentSrc/srcset, фактический transfer saving, визуальная проверка качества и повторные Lighthouse mobile/desktop. Baseline владельца mobile 13.11.2026 07:35 GMT+2: Performance 84, FCP 0.9 s, LCP 4.5 s, TBT 0 ms, CLS 0.001, Speed Index 2.4 s. Не заявлять измеренное улучшение LCP/скорости до повторных измерений.



- functions/_middleware.ts documentBody() no longer inserts a raw fallback image for category documents. The image was being emitted as an ordinary <img src> before React/CSS, so hiding .category-page-hero-image below 1024 px did not prevent the browser from downloading that fallback image.
- Category image metadata (og:image) remains unchanged. The client-rendered category hero remains desktop-only via its existing responsive <picture> source.
- src/lib/sanityImage.ts accepts an optional per-image quality value; default remains 75 for every existing caller.
- src/pages/CategoryPage.tsx uses grid-accurate sizes values for plant/product cards, quality 65 for those card images, and eager loading only for the first two visible offers. Desktop category hero is capped at a 408 px source-size estimate and quality 70.
- No Sanity, D1, Cloudflare configuration/secrets, global shell, Header/Footer, routing or SEO metadata changes.
- Verification status: code changes are on a separate PR branch; CI, browser Network inspection and repeat Lighthouse are pending. Do not claim measured savings or improved LCP until verified.

## 2026-11-13 — PR #246: loading skeleton каталога категорий опубликован в Production

**Статус:** PR #246 squash-merged в `main`, commit `3f2099e6ac2c11c2461c4c14618128c618a8d413`; Cloudflare Pages Production deployment `6208bca0-23a6-48b0-a84b-b1861bac9523` завершён успешно на том же commit. Aliases: `https://florial-bg.com`, `https://www.florial-bg.com`. CI на PR head `2e0fa03` прошёл: Blog/Studio `43370628228`, D1 validation `43370628255`.

- `src/App.tsx`: category-specific `CategoryLoadingState` резервирует минимум `100svh` после Header, содержит skeleton breadcrumb/title/description, subcategory tiles, filter area и product cards. Это предотвращает схлопывание области основного содержимого в короткую текстовую заглушку и не позволяет Footer попадать в первый viewport во время ожидания каталога.
- Route-specific React.Suspense fallback для category routes использует тот же skeleton, избегая двух разных промежуточных состояний.
- Не меняются Header/Footer/меню, CategoryPage markup после готовности данных, Sanity queries/datasets/schema/documents, цены/остатки, изображения, D1, Cloudflare settings и routing.
- По коду `index.html` содержит inline CSS: `.category-page-hero-image { display:none }`, desktop media query включает изображение с 1024 px. Подкатегорийные изображения в `CategoryPage.tsx` имеют 48×48 px mobile / 56×56 px desktop и `object-cover`.
- Lighthouse baseline от владельца, mobile 13.11.2026 06:52 GMT+2: score 61; FCP 0.9 s; LCP 4.507 s; TBT 10 ms; CLS 0.693; Speed Index 1.4 s.
- **Не подтверждено:** browser layout-shift attribution, новый Lighthouse, реальный CLS/LCP gain и визуальная проверка. Skeleton является layout-stability mitigation; он не ускоряет сам запрос Sanity и не доказывает оптимизацию каталожного data payload.

---

## 2026-11-13 — Текущее состояние: locale и route-data code splitting в Production

**Источник состояния:** GitHub `main`, merge commit `c97255f4fc843714f0a453727a77f22b75fdf0f7`; Cloudflare Pages Production deployment `cc421986-4aa0-49e3-85db-33d78d8546ce` (точный commit совпадает, build/deploy success).

### Реализация по коду

- `src/lib/i18n.tsx` — provider и механизм выбора языка. Болгарский словарь загружается статически как default locale; RU и EN импортируются динамически по запросу.
- Locale modules: `src/lib/i18n/bg.ts`, `en.ts`, `ru.ts`; общие типы — `src/lib/i18n/types.ts`. Локали содержат UI strings, known content translations и known category translations.
- Сохранены query parameter `?lang=`, localStorage, `document.documentElement.lang`, интеграция с Sanity translations и fallback на исходный текст. При смене локали отображение ожидает выбранный словарь, чтобы не показывать контент на неверном языке.
- Route data loaders находятся в `src/lib/routeData/`: `productDetails.ts`, `search.ts`, `serviceDetails.ts`, `categoryDetails.ts`. `src/App.tsx` загружает соответствующий модуль динамически при необходимости. Это разделение data/query loaders; оно не означает, что вся UI-логика поиска или вся маршрутизация вынесены из App.
- Существующие Sanity clients/dataset selection, GROQ projections, result handling, fallbacks и cancellation behavior сохранены. Каждый loader получает cancellation predicate от вызывающего кода.
- Build outputs для соответствующего snapshot: entry `index-H36PXtsT.js` — 336.08 kB raw / 97.95 kB gzip; до изменений `index-Ms-oKrTF.js` — 398.12 kB raw / 108.66 kB gzip. Изменение entry: −62.04 kB raw / −10.71 kB gzip.
- Отдельные raw chunks: EN 23.98 kB; RU 33.16 kB; product details 8.64 kB; search 3.40 kB; service details 2.58 kB; category details 1.39 kB. Это значения Vite build artifact, не network transfer measurements.
- CI runs: Blog and Studio `43359151357` — success; D1 validation `43359151359` — success. Production manifest подтверждает наличие соответствующих locale и route chunks.
- **Ручная функциональная QA владельца:** подтверждены переключение языков в обе стороны, категории, товары, корзина, поиск и переводы; владелец сообщил, что все проверки прошли успешно. Отдельный автоматизированный browser test/network capture не заявляется.
- **Не измерено:** повторный Lighthouse mobile/desktop, Network waterfall, фактический transfer по маршрутам, LCP/INP/CLS и field Core Web Vitals. Уменьшение initial entry не доказывает автоматически улучшение этих метрик.

### Границы изменений

Изменены frontend source и документация. Sanity schema/documents, Cloudflare bindings/settings/secrets, D1 schema/data, Resend, Header/menu/Footer layout и глобальная архитектура не менялись. Production release опубликован через штатный GitHub → Cloudflare Pages deployment.

---

### Исторический технический снимок PR #244 до merge (13.11.2026)

- На момент составления этой записи PR #244 ещё был Draft; см. актуальную запись выше для последующего merge и Production deployment.
- Locale data is split into `src/lib/i18n/bg.ts`, `en.ts`, `ru.ts`; shared type in `src/lib/i18n/types.ts`. Bulgarian is statically imported; RU/EN are dynamic imports. Each locale includes UI strings, known content translations and known category translations. `LanguageProvider` keeps URL, localStorage, document lang and fallback behavior. Content rendering waits for the selected locale to avoid a wrong-language flash.
- Full product detail, full-text search, service detail and category detail queries moved to dynamically imported modules under `src/lib/routeData/`. App retains routing and state; each loader receives a cancellation predicate. Existing Sanity client selection, datasets, GROQ fields, error handling and fallback semantics are preserved.
- Build comparison (same CI workflow; baseline main and PR #242 head have identical blob SHA for App, i18n, package and Vite config): initial JS 398.12 kB raw / 108.66 kB gzip before, 336.08 kB raw / 97.95 kB gzip after. Difference: −62.04 kB raw / −10.71 kB gzip. EN/RU and route loaders emit separate dynamic chunks.
- Final PR-head validation on documentation head `0bdc3f72272d04a13bff4dfc0498b23364d99ac4`: Blog and Studio run `43358984471` — success; D1 migration validation run `43358984398` — success. Code snapshot tested: `1c36472e52cbc0f7219f7827a5452b10581a317b`.
- На тот момент browser-level QA ещё ожидалась. Последующая проверка владельцем и Production deployment зафиксированы в актуальной записи выше. Build output не доказывает улучшение LCP/Core Web Vitals; Network и Lighthouse re-measurement остаются отдельной задачей.

## 2026-11-13 — Категория хвойных: SEO-контент подготовлен в draft

- Sanity Production project `bxvcy0qs`, dataset `plants`; категория `plants-conifers`, slug `igol_listni`.
- Backup опубликованного документа и существующего draft сохранён в `docs/backups/sanity/2026-11-13-plants-conifers-before-seo-content.json` до записи.
- Подготовлены локализованные BG/RU/EN Portable Text статьи в полях `seoContent` и вложенных `translations.ru/en.seoContent`. Frontend schema подтверждает назначение `seoContent`: SEO текст под продуктами, поддерживает H2/H3, bullet/number lists, strong/emphasis и link annotations.
- Запись выполнена только в `drafts.plants-conifers`; read-back подтвердил по 25 блоков на каждый язык. Published version остаётся прежней; автоматическая публикация не выполнялась.
- Существующие `description`, `seo`, H1/meta title/meta description, image, helpBlock, slug, parent и sortOrder сохранены без изменений.
- Schema validation: status `valid`, но `complete=false`; custom validation callbacks не запускались. Требуется ручной просмотр в Sanity Studio и визуальная проверка локалей до публикации.
- RHS hardiness values and pruning guidance were checked against official RHS profiles/advice; cypress canker information checked against UC IPM. RHS ratings are presented as guidance, not a Bulgarian-site guarantee.
- Code, schema, frontend, Cloudflare, D1, Resend and deployment were not changed.

## 2026-11-12 — Homepage hero Sanity photo library: merged and deployed (PR #242)

- PR #242 merged squash into `main`; merge commit `16bd410ad4b246f4d20594823ea5fe7be2f20bdd`.
- Sanity Production photo document `ec5582be-f4bd-4e3c-9dd7-b5d8e4b31fd1` (`florial-homepage-hero-background`) is active and points to compressed asset `image-460eba3d596671187e5a382f4449ed09fcf78bfc-1518x957-png`, 1518×957, 1,015,107 bytes. Prior asset was 2,704,931 bytes; Sanity metadata indicates ~62.5% lower stored file size.
- Homepage first-render fallback in `src/pages/HomePage.tsx` uses the exact same compressed CDN URL as the Sanity record. App resolves the photo record only on homepage route. No intentional old-to-new image source swap on first load.
- Exact PR head `a7270d4b931009dba4fd27c35a99b5375dbcca3e` CI: Blog and Studio validation run `43271610071` — success (lint, utility tests, website build, migration syntax/dry-run, Studio dependency install and Studio build); D1 validation run `43271609865` — success.
- Cloudflare Pages Production deployment `4f4dc307-3f6d-416b-b411-4bceccbc3661` deployed exact merge commit `16bd410ad4b246f4d20594823ea5fe7be2f20bdd`; queued, initialize, clone_repo, build and deploy all succeeded. Deployment aliases include `https://florial-bg.com` and `https://www.florial-bg.com`.
- No Header/menu/Footer/CSS/layout changes; no Sanity schema change, no D1/Resend/Cloudflare settings change. Previous original image asset was retained.
- Remaining: owner visual check on mobile/desktop and repeat Lighthouse + Network waterfall to confirm the browser fetches the compressed asset and measure actual LCP/transfer bytes. File size reduction is confirmed from Sanity metadata; browser performance improvement is not yet measured.

## 2026-11-12 — Homepage hero compressed asset linked from Sanity photo library

- Sanity Production photo document `ec5582be-f4bd-4e3c-9dd7-b5d8e4b31fd1` (`florial-homepage-hero-background`) is active and now references compressed asset `image-460eba3d596671187e5a382f4449ed09fcf78bfc-1518x957-png`.
- Live Sanity read-back confirms URL `https://cdn.sanity.io/images/bxvcy0qs/production/460eba3d596671187e5a382f4449ed09fcf78bfc-1518x957.png`, dimensions 1518×957 and file size 1,015,107 bytes. Previous asset size was 2,704,931 bytes; the new asset is approximately 62.5% smaller. This is based on Sanity asset metadata, not a browser transfer measurement.
- Homepage first-render fallback in `src/pages/HomePage.tsx` was updated to the exact compressed asset URL. The homepage-only Sanity query resolves to the same asset URL, avoiding an intentional initial old-image → compressed-image source swap.
- The original asset and its prior photo reference were not deleted. The photo record continues to be managed from Sanity Studio.
- Header, menu, Footer, other routes, visual layout, CSS and responsive image helper were not changed. PR #242 CI must pass on the updated exact head SHA before merge; Production deployment and browser/Lighthouse QA remain pending.

## 2026-11-12 — Header, homepage и каталог загружаются независимо (PR #240)

- Ветка `perf/header-homepage-data-decoupling-2026-11-12`, PR #240: https://github.com/omaraandrey-dev/florial/pull/240; последний кодовый commit `8953f913be649f62af34d7123b15c6373c68171a`; последующие commits в PR содержат только документационные уточнения.
- Header получает отдельные компактные запросы меню оборудования, всех категорий растений, списка услуг и логотипа. Эти запросы не входят в page-data/product loading и не являются условием отображения содержимого других страниц. Вёрстка, CSS, Header menu и поведение не менялись.
- Для главной страницы отдельный Sanity query загружает только шесть карточек растений в заданном порядке: `plants-root`, `plants-palms`, `plants-olives`, `plants-trees-shrubs`, `plants-citrus`, `plants-flowers`. Полный список категорий остаётся доступен для каталожной навигации; все категории растений сохраняются в меню Header.
- Полный индекс товаров запрашивается только при активном маршруте категории или товара. Поиск использует собственные поисковые запросы. Главная, услуги, About, блог, контакты и корзина не запускают полный каталог.
- Фильтр видимых категорий больше не скачивает товары: GROQ возвращает `productCount` для категорий, клиент добавляет предков категорий с товарами. Сохранена прежняя логика direct category + multi-category references. Read-only GROQ проверен в Sanity Production (54 категории) и Plants (17 категорий); оба запроса успешно вернули счётчики.
- Загрузка категорий, услуг и каталога разделена. Страницы услуг не ожидают каталог; категории и товары ожидают только собственные необходимые данные. Поиск не ждёт глобальный product index.
- Изменены: `src/App.tsx`, `src/pages/HomePage.tsx`, `src/types.ts`, документация. Sanity documents/schema, Cloudflare settings/secrets, D1, Resend и Production не изменялись.
- **CI для branch snapshot с кодовым commit `8953f913be649f62af34d7123b15c6373c68171a` (workflow runs на последующем документационном commit `e067660f1896fbce3cb575541434a362ba37c740`): Blog and Studio validation run `43261832983` — success (website lint, utility tests, website build, migration syntax/dry-run, Sanity Studio build); D1 validation run `43261833064` — success (lint, website build, Pages Functions syntax и обе migration validations). Это подтверждает lint/tests/build и миграционные проверки, но не браузерную route regression.
- **Остаётся до merge:** browser/visual QA desktop и mobile для BG/RU/EN и прямых URL главной, шести plant categories, equipment category, product detail, search, services list/detail, About, Blog/list/article, contacts и cart. В Network подтвердить, что homepage и нетоварные страницы не запрашивают полный catalogue index, а Header не блокирует рендер страниц. Lighthouse и Network waterfall before/after ещё не измерены; performance gain не заявляется. Production deployment не запускался.

## 2026-11-12 — Responsive delivery для Header logo (PR #239 closed)

- Branch `perf/header-logo-responsive-srcset`, commit `7923e1534f028e57911109fd30a878dd3f400389`: `src/components/Header.tsx` использует существующий `getSanityImageProps` из `src/lib/sanityImage.ts` для responsive Sanity CDN URL, `srcset`, `sizes`, `auto=format` и `q=75`.
- Target CSS rendered widths отражены в `sizes`: 80 px mobile, 156 px small/tablet, 200 px desktop; fallback width 480 px. Desktop layout и визуальные CSS-параметры не менялись.
- Для Sanity assets helper предоставляет intrinsic dimensions из имени файла; для non-Sanity URL fallback сохраняет SiteSettings width/height. Изменён только Header component, без CSS, меню или навигации.
- PR #239 закрыт; responsive logo implementation присутствует в текущем `main` commit `c80d3f491d399c4df3ddc2662e3157fce7b953f4`. Текущий PR #240 прошёл website lint/build на базе этого кода. **Остаётся не подтверждено:** фактически выбранный srcset candidate/transfer size, desktop/tablet/mobile visual QA и Lighthouse before/after. Не считать улучшение PSI доказанным до сетевого замера.

## 2026-11-12 — Исправлено WWW → non-WWW перенаправление

- Live Cloudflare zone `florial-bg.com`: правило `WWW to non-WWW` исправлено с условия `(http.request.full_uri eq "www.florial-bg.com")` на `(http.host eq "www.florial-bg.com")`. Первое условие сравнивало полный URL с одним hostname и не соответствовало обычным запросам.
- Ruleset `70edcde1f86a4cdb97324f426a5ea53e`, rule `58851ae78926478aa7bb05dac1480abf`, version 5. Action — HTTP 301; target — `https://florial-bg.com` + исходный path; query string сохраняется; правило enabled.
- API dry-run, Production write и post-write GET verification успешны.
- Cloudflare Request Tracer simulated: www /services → 301; www homepage с query → 301; apex /services → 200. Это проверка обработки правил Cloudflare, не внешний HTTP Location-header smoke test.
- GitHub main code audit: `index.html`, `src/lib/seo.ts`, `functions/_middleware.ts`, `functions/sitemap.xml.ts` и `public/robots.txt` используют основной домен без www. Проверенные исходники: HEAD `36f37ef824a6118af55fddda5f8f8d8626dd94af`.
- **Проверка владельцем в обычном браузере 12.11.2026:** владелец подтвердил, что реальные запросы к адресу с `www.florial-bg.com` автоматически перенаправляются на `florial-bg.com` без `www`. Практическое поведение редиректа в браузере подтверждено.
- Google Search Console не проверен; Google-selected canonical и полнота индексации НЕ ПОДТВЕРЖДЕНЫ. Следующий отдельный SEO-шаг — URL Inspection для homepage и `/services` в www/apex вариантах.
- Source code, Pages deployment, DNS records, Pages settings/secrets, Sanity, D1 и Resend не менялись. Полный протокол: `docs/audits/2026-11-12-www-canonical-redirect.md`.

## 2026-11-12 — Блог: повышение разрешения иллюстраций и исправление ALT

- Из Wix DROP через Media Manager восстановлены оригиналы для трёх миниатюр в Sanity Production: схема полива 266×246 → 925×855; фотография сада с дождевателем 147×147 → 2048×2048; эскиз ландшафтного плана 179×131 → 640×468. Новые Sanity assets: image-9bb7021d464503eeb9c42e19896c152e75892023-925x855-jpg, image-39434b00c36004a520f6b94d5d91cd61ff5b011d-2048x2048-jpg, image-ca422dbbb9682c5e464b7d42b2ff10f567a5b394-640x468-jpg.
- Исправлены BG ALT шести image blocks в статьях: cena-sistema-avtomatichno-napoyavane-burgas, kupete-travna-plosht, maslina-sredizemnomorie, sistema-magluvane-terasa-besedka, rain-bird-oborudvane, kiparis-totem. Тексты ALT основаны на визуальной проверке оригиналов Wix.
- Полные backups перед соответствующими Sanity writes сохранены в PR #235: blog-small-images-before-write.json, blog-alt-before-write.json, blog-sketch-before-write.json.
- Повторная выборка 22 blogPost: 12 точных повторов cover asset в body. Не удалялись автоматически, так как расположение inline images может быть редакционным. Один cover asset 1000×638 используется в двух статьях о ландшафтном проектировании и повторяется внутри обеих.
- Rain Bird GIF 220×120 визуально является логотипом; оставлен без замены. Эскиз 640×468 — доступный оригинал из Wix (25 372 байта); больший исходник по точному file ID не подтверждён.
- Post-publish read-back подтвердил новые refs/размеры и отсутствие drafts. Beta validation: valid, complete=false (custom callbacks не выполняются).
- Веб-просмотр Production страниц и CDN через доступный viewer не сработал; live visual QA не подтверждена. Код и schema не менялись; Pages deployment не запускался. PR #235 остаётся Draft.

## 2026-11-12 — Восстановлены шесть изображений блога из Wix DROP

- Источник оригиналов: подключённый Wix Media Manager сайта DROP. Шесть точных файлов были найдены по Wix file IDs, все со статусами `OK` / `READY`, визуально проверены и загружены напрямую в Sanity Production `bxvcy0qs/production`.
- Sanity assets: `58cbaf809dfa5883067ea788477c891fdcef51ff` (720×1169), `d3fd144b938c3e9c67c3883d1d683c85cada39d0` (1564×1564), `0bb24a4f41c62ab97d270ce660227f1ad4796243` (1564×1564), `fab83fa1629a16e4c55e24e71cf63ca7b97a4a32` (600×800), `b8578d79532be0b53646b767084e31d39abbff10` (1384×3000), `44077349f1be666c383d730d4b920d5cf9098127` (3000×2250).
- В четырёх существующих опубликованных blogPost восстановлены шесть Portable Text image blocks с локализованными ALT BG/EN/RU и caption. Четыре документа опубликованы с revision guards; read-back подтвердил 4/4 и отсутствие drafts, а также отсутствие старых Wix CDN href в целевых BG-блоках.
- Backup текущего состояния четырёх документов до write: `docs/backups/2026-11-12-blog-images-before-write.json` в PR #235.
- Frontend `BlogContent.tsx` уже поддерживает image blocks; код, schema, Cloudflare settings и deployment не менялись. Это Sanity content-only update.
- Редакционный остаток: три восстановленных изображения в конце статьи об оливе показывают газон, кипарис и юкку; они сохранены в исходном порядке, но их уместность требует решения владельца.
- Beta validation: 4/4 `valid`, `complete=false` из-за неисполняемых custom validation callbacks. Wix proxy запретил независимый запрос к `cdn.sanity.io` (403); asset URLs и размеры подтверждены Sanity read-back. PR #235 остаётся Draft; main и Production frontend deployment не менялись.

## 2026-11-12 — SEO-метаданные блога опубликованы в Sanity

- В Sanity Production опубликованы SEO-поля 14 существующих `blogPost` — 42 версии BG/RU/EN и 126 значений `shortDescription`, `seoTitle`, `seoDescription`.
- После публикации read-back подтвердил 14/14 документов; оставшихся draft-версий нет. Перед первоначальной записью сохранён полный snapshot всех 14 документов: `docs/backups/2026-11-12-blog-seo-before-draft-write.json`.
- Уточнены болгарские SEO/анонсные формулировки четырёх статей. Slug, заголовки H1, тексты статей, обложки, ALT, галереи, schema и frontend не менялись.
- Валидация: 14/14 `valid`, `complete=false` из-за пропуска custom validation callbacks beta validator; уникальность slug отдельно проверена read-only по всем 22 документам `blogPost`, дубликатов нет.
- Не завершено: визуальная проверка шести Wix image href, четырёх ALT-кандидатов, повторных cover assets и трёх изображений малого разрешения. Никакие image assets не заменялись и не удалялись.
- Изменение Sanity content не требовало frontend/Cloudflare deployment; код и Production infrastructure не затрагивались.

## 2026-11-12 — Блог: этап 2, улучшение landing page

- Branch: `feat/blog-featured-landing-stage2`.
- Страница `/blog`: первая публикация текущей выборки (или выбранной темы) получает широкую featured-карточку; дата остаётся источником порядка, вручную закреплённой статьи нет.
- Featured image использует eager loading/high fetch priority; остальные карточки lazy. Topic chips показывают число статей по существующим тегам.
- Изменён только `src/pages/BlogPage.tsx`; Sanity schema/documents и backend не менялись. Pagination не вводилась при 14 опубликованных публикациях.
- PR #233 объединён squash в `main`, commit `5e0c895c38a0903616d25f4dccde6cd596d20aed`. CI по точному PR head `28854bc4c92fb9faa0fa59a6322d6e0eb5cd3ad2`: Blog and Studio run `43201350601` — success, включая Studio build; D1 validation run `43201349713` — success. Cloudflare Pages Production deployment `392ec129-5551-48b2-a63f-cab5ead23c8c` для точного main commit прошёл build и перешёл в deploy; все стадии, включая deploy, завершились `success`; aliases `https://florial-bg.com` и `https://www.florial-bg.com`. Визуальная QA BG/RU/EN и мобильных 320–360 px не подтверждена.
- Подробности: `docs/releases/2026-11-12-blog-stage2.md`.

## 2026-11-12 — Блог: этап 1, улучшение навигации и локализации (PR #232)

- Base main: `35fb62bedab13b5a9f500628f0a50432389ca73a`; branch: `feat/blog-content-discovery-stage1`.
- Реализовано в коде: фильтры страницы `/blog` по существующим tags; локализованные названия четырёх тегов; вывод тематических меток в карточках; передача `alt/altRu/altEn` в запросе для галереи и Portable Text image blocks; locale-aware внутренние ссылки в тексте статьи; похожие статьи ранжируются по пересечению tags и затем по дате.
- Sanity Production read-only: всего 22 `blogPost`, опубликовано 14; существующие темы: Растения, Автоматично напояване, Озеленяване, Тревни площи. Поля ALT BG/RU/EN подтверждены в Hosted Schema; RU/EN Portable Text содержит свои локализованные значения ALT в поле `alt` соответствующей языковой версии.
- Изменены только `src/lib/blog.ts`, `src/pages/BlogPage.tsx`, `src/pages/BlogPostPage.tsx`, `src/components/BlogContent.tsx`. Sanity schema/data и Production не менялись.
- PR #232 объединён squash в `main`: merge commit `75fcc9226fc05be2bf56e669b1ddd5ee83094a20`. CI по точному PR head `de12df4f0d55dea6b57fa2ec91b80f32638d41eb`: Blog and Studio run `43198224064` — success, включая Sanity Studio build; D1 validation run `43198224015` — success. Cloudflare Pages Production deployment `fba87951-81aa-406b-a1a7-f8894bf47c7f` для точного merge commit завершился success; aliases `florial-bg.com` и `www.florial-bg.com`. Визуальная QA BG/RU/EN и мобильных ширин 320–360 px остаётся неподтверждённой. Подробный release record: `docs/releases/2026-11-12-blog-stage1.md`.

## 2026-11-12 — RSS-лента услуг опубликована и проверена в Production

- Endpoint: `https://florial-bg.com/feeds/services-bg.xml`; Cloudflare Pages Function динамически читает опубликованные документы `service` из Sanity dataset `production`.
- Фильтр: активные услуги, опубликованный slug, `seo.noIndex != true`, draft IDs исключены. Поля записи: болгарское name, shortDescription (fallback на SEO description), абсолютный URL `/services/{slug}`, `_updatedAt` как pubDate.
- Формат RSS 2.0, язык `bg-BG`, Atom self-link, XML escaping; cache headers: CDN s-maxage 300 и stale-while-revalidate 600.
- PR #229 squash-merged в main, commit `d9f8ded8a10ba3f477026e2ba04affeb427e5480`. Cloudflare Pages Production deployment `c1e03dc4-3b28-4575-920e-dae1e152ef02` завершился success; все stages включая build/deploy — success; aliases `florial-bg.com` и `www.florial-bg.com`.
- CI: PR head Blog/Studio run `43176887544` — success; PR head D1 validation run `43176887495` — success; post-merge main D1 run `43177889083` — success.
- Live smoke: feed HTTP 200, Content-Type `application/rss+xml; charset=utf-8`, возвращает RSS XML с service items. Homepage HTTP 200; RSS autodiscovery link подтверждён в live HTML.
- Sanity, D1 и Cloudflare settings/secrets не менялись. Не выполнено: регистрация feed в сторонних RSS каталогах/агрегаторах — отдельный следующий шаг.

---

## 2026-11-12 — Перенос коммерческих страниц из блога в услуги (завершён)

- В Sanity Production опубликованы 8 специализированных service documents: дождеватели, программаторы, электромагнитные клапаны, ремонт/модернизация полива, годовая профилактика, цветники, топиарная резитба и замена газона.
- Четыре направления специалистов сохранены: landscaping; irrigation (включая maintenance и delivery); planting; lawn. Новое направление не создавалось.
- `landshaften-dizain-proekt-zasazhdenie` оставлен проектной статьёй блога; он связан с существующей услугой `landshaften-dizain`, остаётся опубликованным и не перенаправляется.
- В 99 product documents заменены `relatedContent` references с четырёх blogPost IDs на соответствующие service IDs (46 + 23 + 17 + 13). Live GROQ после публикации: 99 товаров со ссылками на service, 0 старых product-ссылок на эти четыре статьи.
- Восемь перенесённых blogPost документов сохранены, но получили `isPublished=false`; старые URL обрабатываются middleware HTTP 301. Физическое удаление не выполнялось.
- PR #226 merged squash, commit `7acdc09e0ea01739bb69eca1ee4a2711a8fbe75f`; Cloudflare Pages Production deployment `f22c3b8f-6d75-4228-b764-5bf32bbce497` завершился success и имеет aliases `florial-bg.com` и `www.florial-bg.com`.
- CI: Blog/Studio run `43170398802` success; D1 validation run `43170398659` success. Live Firecrawl проверил все восемь старых URL: конечные service URL отвечают HTTP 200, `lang` query сохраняется; ландшафтный case study остаётся на blog URL с HTTP 200.
- Live sitemap.xml: HTTP 200; все восемь service URL присутствуют, восемь деактивированных blog URL отсутствуют, landscape case-study URL остаётся в sitemap.
- Backups: 9 исходных blogPost, 5 service documents и field-level snapshot `relatedContent` 100 документов сохранены в `docs/backups/`. Это целевые snapshots, не полный dataset export.
- Sanity validation для 8 услуг и 99 товаров: `valid`, но `complete=false`, так как инструмент не выполняет custom validation callbacks. Ручной визуальный осмотр hosted Studio BG/RU/EN остаётся дополнительной QA-проверкой.

---


## 2026-11-12 — Фильтр направлений специалистов на странице услуг (PR #225 merged)

- PR #225 объединён в main методом squash: merge commit a8db72ffda86e8d678cfe233a92ae88b0f82a892. PR head d51a04b53f2393b824a78b7affe2700ac75f7014; base main b82fedb92ab30042bcd8ef7d41b25936aae5de72.
- Файлы: src/App.tsx, src/pages/ServicesListPage.tsx, src/types.ts. Документация: CHANGELOG.md, docs/TECHNICAL_PASSPORT.md, docs/AI/OPEN_QUESTIONS.md.
- На /services реализованы четыре фото-карточки и multi-select: landscaping; irrigation + maintenance + delivery; planting; lawn. Все направления активны при загрузке; при снятии последнего выбора восстанавливается «все услуги».
- Мобильная раскладка: четыре карточки в одной строке, квадратные фото, подписи снизу. Есть клавиатурная доступность и aria-pressed.
- Фотографии и локализованные ALT загружаются read-only из четырёх опубликованных Sanity photo documents. Документы и asset URL проверены; визуальный просмотр фотографий отдельно не выполнен.
- CI по точному PR head SHA: run 43165329360 (D1 migration validation) — success; run 43165329362 (Blog and Studio validation) — success. Включены lint, utility tests, website build, Pages Functions syntax, migration checks/dry-run и Sanity Studio build.
- Sanity data/schema, D1, API, Header, меню, Footer и Cloudflare settings не изменялись. Cloudflare Pages Production deployment точного merge commit a8db72ffda86e8d678cfe233a92ae88b0f82a892 — success, deployment 6a9c87fd-a424-4ab8-8895-9c560a0e2336. Следующий успешный deployment aa669cbe91d5d467e66e7ccbb02b25b7a06569b8 включает тот же код и aliases florial-bg.com / www.florial-bg.com. Более поздние документационные commits продолжают собираться. Мобильный визуальный QA остаётся непроверенным.


## 2026-11-12 — Закрытие Android visual QA для зимнего индикатора и category hero

- Владелец сообщил об успешной визуальной проверке опубликованного сайта на физическом Android-устройстве: результат корректный, замечаний по отображению нет.
- Визуальный QA по PR #222 закрыт. Проверяемый код находится в main commit `79e96ce419b4be6513a112deee7c48bb3b0564e5`; Production deployment: `4113830f-e8ff-4eba-bfc7-263818f8f287`.
- Поведение индикатора: отдельная строка над изображением карточки растения и страницы товара; снежинка `text-xs`, температура `text-[10px]`.
- Мобильный category hero: `<picture>` содержит desktop-only source с media `(min-width: 1024px)`; fallback `<img>` не содержит `src`/ `srcSet`. Основное фото товара не отключается и остаётся responsive.
- Ограничение: владелец подтвердил визуальный результат, но отдельный Android Network/DevTools capture не предоставлен; фактическое отсутствие сетевого запроса не заявляется как независимо измеренное. Это не является новой метрикой CLS и не закрывает расследование иных причин layout shift.
- Изменялась только документация; приложение, Sanity, D1, Cloudflare settings/secrets и Production deployment не затрагивались.

---

## 2026-11-12 — Зимний индикатор вне изображения и responsive category hero

- Base main: `6d41f82414676f8121ed1c374c77c0ad1258b211`; branch: `fix/winter-indicator-card-position-and-responsive-category-image`.
- `src/pages/CategoryPage.tsx`: зимний индикатор теперь находится в отдельной строке карточки растения перед фотографией, а не поверх изображения. Снежинка уменьшена до `text-xs`; температура оставлена `text-[10px]`.
- `src/pages/ProductPage.tsx`: тот же индикатор вынесен над основной фотографией растения. Основное фото остаётся необходимым содержимым страницы товара; оно загружается с responsive `srcSet`. Отдельного скрытого desktop-only фото в основной галерее не обнаружено.
- Hero image категории переведён на `<picture>` с desktop-only `<source media="(min-width: 1024px)">`. Fallback `<img>` намеренно не имеет `src` и `srcSet`, поэтому на мобильной ширине изображение не должно загружаться вообще. Контейнер по-прежнему скрывается критическим CSS ниже 1024 px.
- Это устраняет лишний запрос именно для desktop-only category hero на мобильном; не доказывает устранение всех возможных причин CLS.
- Изменения не затрагивают Sanity, D1, Manager, API, Header, меню, Footer или Cloudflare Production settings. CI/Production/Android QA ожидают отдельной проверки по PR.

---

## 2026-11-12 — Индикатор зимней температуры на странице товара и мобильное изображение категории (PR #221)

- Base main: `370e12a33e043e7fe93e686f6c88f6b1c314aae4`; branch: `fix/plant-winter-indicator-and-mobile-category-flash`; PR #221 merged (squash) as `96cc7508301485b81856981d010f506ea7b5ebe0`.
- `src/pages/CategoryPage.tsx`: уменьшен overlay минимальной зимней температуры; оставлены только синяя снежинка и синяя температура без белой подложки, рамки и тени. Позиция — левый верхний угол с отступом 4 px.
- `src/pages/ProductPage.tsx`: такой же overlay показывается поверх основного изображения товара-растения, если `plantCare.minWinterTempC` содержит конечное числовое значение. Значение читается из существующего поля; Sanity schema/documents не менялись.
- `index.html` и `src/pages/CategoryPage.tsx`: hero image категории получает класс `category-page-hero-image`; критический inline CSS скрывает его по умолчанию и показывает при ширине от 1024 px. Это предотвращает ранний flash именно этого desktop-only изображения до загрузки основного stylesheet.
- Изменены только три файла: `index.html`, `src/pages/CategoryPage.tsx`, `src/pages/ProductPage.tsx`. Не менялись App/router, Header, меню, Footer, Sanity, D1, Manager, API и Cloudflare settings.
- CI по точному PR head `c4225fa3eb7898c4f2b1a5963c45e6f48b94b746`: run `43157810821` D1 validation — success; run `43157810867` Blog and Studio validation — success (lint, utility tests, website build, Pages Functions syntax, read-only migration dry-run, Studio build).
- Production deployment `edd10fd4-75b4-4c23-8631-0016395b767e`, commit `96cc7508301485b81856981d010f506ea7b5ebe0` — success. URL `https://edd10fd4.florial.pages.dev`; aliases `florial-bg.com` и `www.florial-bg.com`.
- Не подтверждено физическим Android visual QA: исчезновение первого кадра с hero image и итоговое визуальное положение/масштаб снежинки. Существующий остаточный CLS около 0.34385 ранее не был атрибутирован конкретному DOM-узлу; не считать root cause полностью закрытым только по этому CSS mitigation.

---

## 2026-11-12 — Индикаторы растений в каталоге (merged + Production deploy)

- Base main: `84052cee404edd572448d0f58fa058889fe7b9df`; branch: `feat/plant-card-stock-and-winter-indicators`; PR #220 merged (squash) as `4ab09c5737b1d271042bdb64ffe658176f8e78cc`.
- `src/pages/CategoryPage.tsx`: подготовлен красный индикатор `outOfStock` при сохранении зелёного `inStock` и синего `onRequest`; неизвестный статус не отображает точку.
- Для plant category cards добавлен условный overlay снежинки и значения `plantCare.minWinterTempC`. Отображение использует существующую проекцию данных и не требует Sanity write/schema change.
- Implementation commit: `d6f2f8cd12a080c1edab52005846341d133df5c2`.
- CI: D1 validation run `43156657696` success; Blog and Studio validation run `43156657647` success. Подтверждены lint, website build, utility tests, Pages Functions syntax, D1 validations и Studio build.
- Cloudflare Pages Production deployment `be092504-d800-4007-832b-c5bb86690cb3` для merge commit `4ab09c5737b1d271042bdb64ffe658176f8e78cc` — `success`, 2026-11-12. Deployment URL: `https://be092504.florial.pages.dev`.
- Live visual QA карточек на мобильном/desktop не выполнялся; это не следует смешивать с успешной сборкой и deployment.
- Mobile category image shift: по текущему коду header image имеет `hidden lg:block`, то есть на мобильной ширине не должен отображаться. Отдельный controlled CLS report (09.11) после PR #156 показал остаточный category shift около 0.34385, но Performance API не определил source node. Нельзя утверждать, что это именно изображение. Не менять `src/App.tsx`, Header или Footer без отдельного решения и capture.

---

## 2026-11-12 — Длинный SEO-текст категорий: кодовая реализация в отдельной ветке

- Base main: `d72b9bfdd7036359e1eb2d13f819d24a8bb6c388`; implementation branch: `feat/category-long-seo-content`. Изменение добавляет необязательное поле `seoContent` в обе Sanity category schemas (workspace `florial-admin` / dataset `production`, workspace `plants` / dataset `plants`) и в локализованные объекты `translations.en/ru`.
- Portable Text ограничен тем, что умеет `src/components/RichText.tsx`: normal/H2/H3; bullet/number; strong/em; link.href как string с внутренними путями `/` (кроме `//`) и HTTPS без userinfo. Не допускаются H1/H4+, blockquote, underline и прочие неподдерживаемые варианты.
- `src/App.tsx` добавляет поле только в две detail queries, вызываемые для открытой страницы категории; полные `translations` уже выбираются целиком. Компактные index queries не менялись.
- `CategoryPage` выбирает BG из root `seoContent`, RU/EN из соответствующей локали без fallback на BG. Секция условная, располагается после pagination и перед helpBlock. Используется существующий `RichText` и `onNavigateInternalPath`.
- Добавлены `src/lib/categorySeoContent.mjs`, declaration `.d.mts` и тесты для локалей, отсутствующих/пустых полей и массивов без Portable Text blocks.
- В рамках задачи Sanity Content Lake не изменялся: документы не записывались, не мигрировались и не публиковались; SEO-тексты не создавались. Поле не заполнялось этой задачей ни у одной категории.
- **Deployment gate:** `.github/workflows/deploy-sanity-studio.yml` запускается автоматически при push в `main`, если меняется `studio/**` или сам workflow; после build выполняет `npx sanity deploy --yes --schema-required --json`. PR validation workflow отдельно запускает website lint/tests/build и Studio build. Не объединять PR до явного разрешения владельца.
- GitHub Actions для implementation commit `e9fbbf25b5279102226ec9d7c6ea4856e6b80442`: Blog and Studio validation #908 / run `43153746750`, D1 validation #1133 / run `43153746827`, Sanity Studio validation #147 / run `43153746938` — все `success`. Подтверждены lint, website tests/build, Pages Functions syntax, migration validations и Studio build.
- PR #219 открыт, не объединён. Workflow `deploy-sanity-studio.yml` не запускался, так как он не имеет `pull_request` trigger. Live Sanity schema не проверялась; deployment не выполнялся.

---

## 2026-11-11 — Production Cloudflare D1 read-only audit and CI follow-up

- Live database inspected: Cloudflare D1 `florial-db`, region `EEUR`, approximately 1.9 MB. Inspection was read-only; no D1 writes, migrations or schema/data changes.
- Direct query of `sqlite_master` returned 17 application tables. Cloudflare database-list metadata reported `num_tables: 0` for the same database. This is an unresolved discrepancy between API views.
- Live migration ledger `schema_migrations` contains continuous entries `0001`–`0014`; latest is `0014_contract_withdrawals`.
- Counts observed: `orders` 7; `order_events` 26; `catalog_staff_profiles` 2 (Owner + Manager, both active); `manager_sessions` 2 (expired 0); `catalog_submissions` 15; `catalog_submission_events` 57; `catalog_stock_events` 60; `manager_product_audit` 120 (60 started, 60 success, 0 failed); `service_leads` 2; `contract_withdrawals` 1 (confirmation status `sent`). `api_rate_limits` contained 5 expired rows; current code has 1% best-effort cleanup on eligible requests, so this count alone does not indicate a failure.
- Read-only relationship checks returned zero orphan rows for permission events, stock events, submission events, manager sessions, product audit and order events. No negative order amounts were observed.
- `PRAGMA integrity_check` and `PRAGMA foreign_key_check` were not reliably confirmed via the API invocation. A full SQLite integrity check is therefore **not confirmed**; do not describe it as passed.
- GitHub Actions run `43099079700`, commit `2dba36582e8e19079eef6ad80108d882bd85c218`, completed successfully. Job `validate` passed dependency installation, lint, website build, Pages Functions syntax, additive plant audit migration validation and contract withdrawals migration validation.
- Earlier run `43095667280` for `6c65e01e7c8d99994669158fe0aeb120136bebfa` remains queued without jobs or conclusion. The newer main-commit run passed; the old run was not cancelled or rerun.
- A concise handoff snapshot is maintained in [CURRENT_STATE.md](AI/CURRENT_STATE.md). Re-check live D1 and Actions before future operational decisions.
- No application code, Sanity, D1 schema/data, Cloudflare settings/secrets, DNS or Resend were changed by this audit.

> **ВАЖНО — СТАТУС АРХИТЕКТУРЫ НА 11.11.2026.** Действующая архитектура Florial: GitHub + Sanity + Cloudflare Pages/Functions + Cloudflare D1 + Resend. **Supabase выведен из эксплуатации и не является частью текущего проекта.** Упоминания Supabase, Supabase Auth/Storage/RLS, старых SQL migrations и переменных `SUPABASE_*` в нижележащих исторических записях этого паспорта описывают прежние состояния и не являются инструкциями к выполнению. Старые SQL сохранены только в `docs/archive/supabase/`; не запускать их и не переносить в D1. Актуальные правила: [AI_INSTRUCTIONS.md](../AI_INSTRUCTIONS.md), [START_HERE](AI/START_HERE.md), [OPEN_QUESTIONS](AI/OPEN_QUESTIONS.md). Проверяйте живые Cloudflare settings перед выводами о legacy variables.

---

## 2026-11-11 — Read-only Cloudflare legacy-variable audit and post-merge CI

- Live Cloudflare Pages project `florial` was read without exposing variable values. Production contains legacy names `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`; Preview contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Static scan of 115 tracked application source, Pages Functions, GitHub workflow and key configuration files at commit `6c65e01e7c8d99994669158fe0aeb120136bebfa` found no Supabase references in `src/**`, `functions/**` or `.github/workflows/**`. `package.json` has no Supabase SDK; `.env.example` documents only Sanity public configuration; `src/lib/sanity.ts` reads `VITE_SANITY_*` only.
- Assessment: all six Cloudflare legacy variables appear unused by the current repository code/workflows. Values were not read. No variables were changed or deleted; removal is a Production/Preview configuration change and requires explicit owner approval.
- Cloudflare Pages latest Production deployment for merge commit `6c65e01e7c8d99994669158fe0aeb120136bebfa`: deployment `f2114ff2-9efe-480b-a4c9-ced4d24da3dc`, stage `deploy`, status `success`; aliases `florial-bg.com` and `www.florial-bg.com`.
- GitHub Actions D1 validation run `43095667280` for this exact merge commit remains `queued` with no jobs and no conclusion. Earlier successful CI runs were for a different SHA and are not attributed to this merge commit. The reason for the queue delay is not confirmed.
- No application code, Sanity content/schema, D1 data/schema, secrets or Cloudflare settings were changed during this audit.

## 2026-11-11 — Gemini plant care form review and Black Sea coast assessment

- Review found that Gemini response schema and normalizer already carried plantCare and careGuide; Manager mapped them into the form and save payload. The existing apply action immediately called save and closed the editor, preventing staff from reviewing populated botanical fields in the form. A read-only Sanity query for the published product “Маслина бонсай 4” returned plantCare: null and careGuide: null; this confirms the values are not currently stored on that document, but does not prove whether a previous apply/save action was attempted or succeeded.
- Changed Manager flow: applying a Gemini result now fills the editable form and keeps the editor open. It no longer saves automatically. Staff review/correct the fields and use the ordinary Save/Publish button to persist the record.
- Added a preliminary AI coastal assessment inside plantCare: blackSeaCoastRecommendation (suitable, conditional, notSuitable, insufficientData) and blackSeaCoastReason (Bulgarian rationale). Gemini considers frost tolerance, coastal wind/salt exposure, summer drought, drainage, maturity, and open-ground versus container cultivation. The prompt forbids inventing local climate thresholds or treating uncertain species identification as sufficient evidence.
- The existing blackSeaCoast field remains the confirmed staff-reviewed status (suitable, notSuitable, needsVerification). Gemini always leaves it at needsVerification; the preliminary recommendation is separate and must not be presented as confirmed suitability on public product pages.
- Manager UI displays the preliminary recommendation and rationale separately from the confirmed suitability selector. Both fields are saved in the existing plantCare object and are editable before saving.
- Server-side save normalization bounds the rationale to 800 characters and restricts recommendation/status values to supported enums.
- Updated files: functions/api/manager/plants/gemini-test.ts, functions/api/manager/plants/gemini-test-lib.ts, functions/api/manager/plant-direct-lib.ts, src/manager/PlantCatalogManager.tsx, studio/schemaTypes/index.ts, tests/gemini-plant-ai.test.mjs, tests/manager-plant-care-permissions.test.mjs.
- No Sanity documents/assets, D1 data/schema, orders, employee permissions, Cloudflare settings/secrets, or global site components were changed. Sanity schema source has additive fields; hosted Sanity Studio schema deployment is not yet confirmed and must be verified separately.
- PR merged into `main`; Cloudflare Pages Production deployment `abc8d826-84e6-4f5e-a433-60f490528c98` for commit `2b6db5028061c0d27778760b9ac25b59d6629fc6` completed successfully (all build/deploy stages success); production aliases `https://florial-bg.com` and `https://www.florial-bg.com` attached. The deployment was confirmed from the Cloudflare Pages deployment record.
- GitHub Actions status for this exact commit: НЕ ИЗВЕСТНО — нужно уточнить; the available commit-workflow lookup did not return a PR-triggered run. Do not mark CI as passed on this evidence.
- Sanity Studio source schema was updated, but a separate hosted Studio build/deployment was not confirmed. No Sanity document was written; the published “Маслина бонсай 4” record remains unchanged.

---

## 2026-11-11 — Разделение этапов проверки ответа Google Gemini и подписи AI proof

- Уточнена диагностика Gemini Photo/Text: единый этап `normalizing` больше не объединяет разбор JSON, нормализацию данных и создание защитной подписи AI proof.
- Добавлены отдельные этапы `json_parsing`, `normalizing` и `proof_signing`. В сообщении об ошибке теперь возвращается фактический последний этап обработки, а не общий `response_validation`.
- Добавлен `parseGeminiPlantJson`: завершённый JSON должен быть объектом. Оборванный JSON и корректный JSON другого корневого типа получают `GEMINI_INVALID_JSON` и безопасную краткую диагностику без вывода полного ответа модели.
- Ошибки выдачи подписи разделены на отсутствие пригодной сессии Manager и сбой Web Crypto signing; они больше не маскируются как общий `GEMINI_PROVIDER_ERROR`.
- Существующие проверки SSE, `finishReason`, `MAX_TOKENS`, safety block и транспортных ошибок сохранены; повторно не реализовывались.
- Изменены: `functions/api/manager/plants/gemini-test.ts`, `functions/api/manager/plants/gemini-test-lib.ts`, `functions/api/manager/plant-direct-lib.ts`, `tests/gemini-plant-ai.test.mjs`.
- Дополнительно исправлен путь импорта `./_lib.ts` в `plant-direct-lib.ts`: Node.js 22 в тестовом раннере не разрешал extensionless import при прямом импорте TypeScript-файла; runtime логика не менялась.
- PR #213 объединён squash merge в `main`: `91cb388106c554eb0488cd8fdfa1c6b57452d5be`.
- CI PR HEAD `74496ee14ad10cdbb5b5a8fc9a8ac512c9546526`: Blog and Studio validation run #895 (43077258363) — success; lint, 97 tests, website build, Pages Functions syntax, read-only migration dry-run и Sanity Studio build — success. Florial D1 migration validation run #1111 (43077258310) — success.
- Cloudflare Pages Production deployment `e4914b63-2ebc-49d9-b753-389df2965148`, commit `91cb388106c554eb0488cd8fdfa1c6b57452d5be`: build и deploy — success; deployment URL `https://e4914b63.florial.pages.dev`; aliases `https://florial-bg.com` и `https://www.florial-bg.com` активны.
- Sanity, D1 schema/data, пользовательские данные, роли/права, Gemini model/API key, Cloudflare settings/secrets, каталог, Header, меню и Footer не изменялись. Миграции не запускались.
- Реальный повторный запуск Gemini Photo на карточке «Маслина бонсай» с пользовательской Manager-сессией после публикации ещё не выполнен; требуется проверка владельцем. Исходный root cause остаётся неподтверждённым до такого повторного запуска.
- Диагноз исходной ошибки с ID `5ff5260c-e57b-4eaa-8915-cc67028286e5` не подтверждён: Cloudflare Observability не вернул соответствующую запись. Новое разделение этапов позволит определить, завершился ли JSON parsing, normalization или AI proof signing.

---

## 2026-11-11 — Google AI botanical fields available to Owner, Manager and Seller

- Implemented the owner-approved policy: Google Gemini is the only AI provider for the plant Manager workflow; the existing Gemini Photo/Text flow remains the source of AI-generated plant data.
- All plant staff roles (Owner, Manager, Seller) can now apply Google AI botanical results, see/edit the botanical care fields in the Manager form, load those fields when opening an existing product, and save them to Sanity.
- The Manager now carries the complete botanical object through apply/save: `light`, `waterNeeds`, `minWinterTempC`, `adultHeightCm`, `foliageType`, `floweringSeason`, `plantingSeason`, `blackSeaCoast`, plus `careGuide`. Unknown scalar values are represented as null; seasonal arrays remain empty when not known; `blackSeaCoast` remains `needsVerification` pending review. This avoids inventing botanical facts while retaining the requested fields.
- Updated `src/manager/PlantCatalogManager.tsx`, `functions/api/manager/plants/[id].ts`, `functions/api/manager/plant-direct-lib.ts`; added `tests/manager-plant-care-permissions.test.mjs` covering Owner/Manager/Seller.
- No D1 permission changes were necessary: the Manager already had plant-creation permission; there is no separate Google AI permission key, and the plant role gate admits Owner/Manager/Seller. Production D1 had 1 Owner, 1 Manager and 0 Seller accounts at the time of inspection.
- No Sanity schema/documents, existing plant data, D1 rows/schema, secrets, Cloudflare bindings, order permissions, publish/delete permissions, Header, menu or Footer were changed.
- Verification completed: GitHub Actions run #1105 (43056763211) on commit 4442ec129e1d40d04d35531ceace487c97413cae succeeded: lint, website build, Pages Functions syntax and D1 migration validations all passed. Cloudflare Pages Production deployment e4a85088-7572-41f0-8cdc-e6c71e2a98ce completed with all stages successful; project aliases florial-bg.com and www.florial-bg.com are attached. Deployment URL: https://e4a85088.florial.pages.dev.

---

## 2026-11-11 — Обязательная политика Google Gemini для AI-заполнения растений

- Решение владельца: единственный основной AI-провайдер для рабочего сценария подготовки карточки растения в Manager — Google Gemini. Альтернативные AI-провайдеры не должны использоваться как основной или резервный источник данных этого сценария.
- Google Gemini Photo/Text должен одинаково обслуживать роли Owner, Manager и Seller. Получение и применение ботанических характеристик не является привилегией Owner.
- Обязательные поля Sanity Product: `plantCare.light` (освещённость), `plantCare.waterNeeds` (потребность в воде), `plantCare.minWinterTempC` (минимальная зимняя температура), `plantCare.adultHeightCm` (высота взрослого растения), `plantCare.foliageType` (тип листвы), `plantCare.floweringSeason` (сезон цветения), `plantCare.plantingSeason` (сезон посадки), `plantCare.blackSeaCoast` (пригодность для Черноморского побережья), `careGuide` (руководство по уходу).
- Неизвестные или недостаточно подтверждённые значения не выдумывать: сохранять null/пустое значение либо `needsVerification` в соответствии с типом поля. Для `blackSeaCoast` до подтверждения использовать `needsVerification`.
- Коммерческие данные (SKU, продажная высота конкретного экземпляра, объём контейнера, цена, остаток и наличие) Google не генерирует.
- Проверка фактического состояния Production D1: Owner — 1 активная учётная запись; Manager — 1 активная учётная запись; Seller — 0 учётных записей. У Manager уже установлено `canCreatePlant=true`. Отдельного permission key для Google AI нет; endpoint Gemini допускает все три роли.
- Обнаружено несоответствие реализации требованию: в `src/manager/PlantCatalogManager.tsx` функция применения результата добавляет `plantCare` и `careGuide` только при `role==='owner'`; та же роль-проверка исключает эти поля из payload сохранения. Поэтому D1 permission update не может открыть сохранение этих полей Manager/Seller.
- В рамках этой документационной записи runtime-код и Production D1 не изменялись. Существующий Manager уже имеет право создания растения; записей Seller в D1 нет, поэтому дополнительное изменение разрешений не требовалось и не выполнялось.
- Статус: политика Google-only и обязательный набор ботанических полей зафиксированы; полное применение/сохранение этих полей для Manager и Seller остаётся НЕ ВЫПОЛНЕНО и требует отдельного согласования минимального изменения кода.

---

## Дополнение — порядок связанных материалов на карточке растения

Дата: 11.11.2026

- В plant detail GROQ projection добавлено чтение category.helpBlock.buttonUrl как источника категорийной услуги/статьи. URL принимается только в виде внутреннего маршрута /services/{slug} или /blog/{slug}.
- Категорийный документ разрешается в рамках существующего вторичного read-only Sanity query. Он выводится первым; далее выводятся документы из relatedContentBySlug в порядке массива Sanity.
- src/lib/plantRelatedContentUtils.mjs объединяет последовательности, исключает дубли по _id (fallback: тип + slug), неактивные service и неопубликованные blogPost. Существующий лимит карточек ProductPage не меняется.
- Затронуты: src/App.tsx, новый src/lib/plantRelatedContentUtils.mjs, новый tests/plant-related-content-utils.test.mjs. Sanity documents/schema и данные не изменяются; категории остаются источником первой связи.
- PR и Production status фиксируются после CI; до этого merge/deploy не заявлять.

---

## Дополнение — карточки связанных услуг и статей в категориях (PR #210)

Дата: 11.11.2026
Статус: PR #210 объединён; Cloudflare Pages Production deployment завершён успешно.

### Поведение storefront
- В src/pages/CategoryPage.tsx блок помощи категории отображает карточку связанного материала вместо прежней текстовой кнопки. Карточка включает изображение, локализованное название, доступное имя для скринридера и внутреннюю ссылку.
- Целевой URL берётся из category.helpBlock.buttonUrl, только если путь начинается с /services/ или /blog/. Для некорректного/отсутствующего пути используются fallback: /services/zasazhdane-na-rasteniya для категории растений и /services/avtomatichno-napoyavane для остальных категорий.
- По slug целевого пути выполняется read-only запрос Sanity к документам типов service или blogPost. Для услуг учитывается isActive; для статей — isPublished. Изображение выбирается через fallback-последовательность доступных полей изображения; локализуются title/name и alt для BG/RU/EN.
- Если связанный документ не найден или запрос завершается ошибкой, сохраняется текстовый fallback карточки; при отсутствии изображения используется пустая нейтральная область.
- Поддержка карточек блог-публикаций реализована в коде; в рамках live smoke этой задачи фактически проверены две service-карточки.

### Затронутые файлы и границы
- Runtime: src/pages/CategoryPage.tsx.
- Документация: CHANGELOG.md, docs/TECHNICAL_PASSPORT.md.
- PR #210: https://github.com/omaraandrey-dev/florial/pull/210.
- Merge commit: 38235643054c148c9754428e40403741728735cd.
- Sanity documents/schema, D1 schema/data, Cloudflare settings/secrets, API, orders, cart, checkout, Header, main menu и Footer не изменялись. SQL/D1 migrations не запускались.

### CI и Production verification
- GitHub Actions Blog and Studio validation — success.
- GitHub Actions Florial D1 migration validation — success.
- Cloudflare Pages Production deployment: c2b880a6-c301-48e5-a433-60f490528c98; trigger github:push на main commit 38235643054c148c9754428e40403741728735cd; build и deploy — success.
- Production aliases: https://florial-bg.com, https://www.florial-bg.com.
- Live smoke: /category/rastenia и /category/vsichko-za-polivane — HTTP 200; карточки имеют изображения и корректные ссылки на service pages. /services/zasazhdane-na-rasteniya и /services/avtomatichno-napoyavane — HTTP 200.
- Локализация карточки растений проверена на BG/RU/EN: «Засаждане на растения» / «Посадка растений» / «Planting Services». RU и EN category routes вернули HTTP 200.
- Владелец подтвердил успешную проверку Production.
- Изменение не меняет архитектуру, маршруты, модель данных, SEO URL или инфраструктуру; отдельное обновление архитектурных схем не требуется.

---

## Дополнение — сброс выбранного варианта растения при внутренней навигации

Дата: 11.11.2026

- В `src/App.tsx`, внутри `navigateToInternalPath()`, перед обработкой нового внутреннего маршрута сбрасывается `initialSaleVariantKey`.
- Причина: внутренние ссылки не передают ключ варианта; без сброса состояние выбранного размера предыдущего товара могло случайно примениться к следующему товару с совпадающим ключом.
- Переход из карточки категории через `navigateToProduct(slug, saleVariantKey)` сохраняет передачу выбранного варианта. URL остаётся `/product/{slug}`; прямые открытия и browser back/forward без ключа сохраняют прежнее поведение — выбор первого доступного варианта.
- Изменён только клиентский файл `src/App.tsx`; Sanity, D1, Cloudflare bindings/functions, маршруты, canonical/SEO, корзина, checkout, Header, меню и Footer не затронуты.
- Исправление не является решением ошибки Cloudflare Pages при генерации D1 binding.

---

## Дополнение — карточки вариантов продажи растений в каталоге (PR #207)

Дата: 11.11.2026  
Статус: PR #207 открыт; merge и Production deployment не выполнялись.

### Поведение storefront
- `CategoryPage.tsx` строит отдельную карточку на каждый элемент `Product.saleVariants[]`; один документ Sanity остаётся единственным источником данных о растении. Для товара без вариантов сохраняется одна обычная карточка.
- В компактной plant projection добавлены `mainImageUrl: mainImage.asset->url` и `galleryImages: gallery[]{_key, url, alt, altEn, altRu}`; исходная `imageUrl` с fallback сохраняется для совместимости. Карточка использует `getPlantCatalogCardImageUrl`: вариант с максимальной положительной ценой всегда получает `mainImageUrl`; остальные варианты выбирают изображение псевдослучайно из main + gallery, включая main. Выбор детерминирован по id/ключу варианта, поэтому не меняется при rerender. При отсутствии отдельного main применяется существующий fallback `imageUrl`. Цена и старая цена берутся из текущего варианта, не из минимальной цены всех вариантов. Если цена варианта отсутствует/не положительна, выводится локализованное «Цена по запросу».
- CTA показывает локализованную метку и имя/параметры варианта: `Виж размер:`, `Посмотреть размер:`, `View size:`.
- Варианты сортируются индивидуально: собственный `stockStatus` (или root fallback при отсутствии) → цена в соответствии с выбранным режимом → название растения; при стандартной сортировке порядок размеров одного растения сохраняется как в Sanity.
- Счётчик и пагинация считают отдельные предложения размеров, а не родительские документы.
### Переход на общую страницу растения
- `CategoryPage.onSelectProduct(product, saleVariantKey)` передаёт выбранный ключ в `App.navigateToProduct`. Ключ хранится только в React state, URL остаётся `/product/{slug}`; query string, отдельные SEO страницы и новые canonical не добавляются.
- `ProductPage.initialSaleVariantKey` выбирает запрошенный вариант; `resolveInitialPlantVariantKey` проверяет, что ключ действительно существует, иначе выбирает первый вариант. При прямом открытии URL или browser back/forward без внутреннего ключа остаётся стандартный выбор первого варианта.
- Корзина уже принимает `PlantSaleVariant`; её контракт не изменялся. Добавление товара использует выбранный вариант ProductPage.
### Затронутые компоненты и проверки
- Runtime: `src/pages/CategoryPage.tsx`, `src/App.tsx`, `src/pages/ProductPage.tsx`, `src/lib/plantCatalogUtils.ts`, `src/types.ts`.
- Tests: `tests/plant-catalog-utils.test.mjs` — покрытие разворачивания предложений, stock/price sort, отсутствующей цены, порядка Sanity и проверки выбранного ключа.
- CI code HEAD `ac107a131f758ebd81c112dec6fdec4b2ba0c5c6`: lint, 89 utility tests, website build — success; D1 validation run #1074 — success; Studio build run #879 ещё выполняется на момент записи.
- Sanity documents/schema, D1 data/schema, Cloudflare settings/secrets, cart/checkout, Header/menu/Footer не затронуты.
- PR #207 — `https://github.com/omaraandrey-dev/florial/pull/207`. Не выполнять merge/Production deploy без отдельного явного согласия владельца.

---

## Дополнение — каталог растений: названия, наличие и сортировка (PR #204)

Дата: 11.11.2026  
Статус: реализация находится в отдельном PR; merge и Production deployment не выполнены.

- Диагностика опубликованного Sanity-документа `palm-trachycarpus` подтвердила: корневое `name` заполнено, `translations.bg.name` — пустая строка, BG H1 и RU/EN локализованные поля заполнены. Причина пустого заголовка в карточке — `CategoryPage.tsx` рендерил `localize(product, 'name')` напрямую; локализатор сохраняет пустую строку как значение, поэтому fallback на корневое название не срабатывал.
- Добавлен helper `getPlantDisplayName`: непустое название выбранного языка → локализованный SEO H1 для RU/EN → корневое `name` → корневой SEO H1.
- Наличие для сортировки и индикатора карточки определяется по вариантам `saleVariants[].stockStatus`, если они заполнены: любой `inStock` имеет высший приоритет, затем `onRequest`, затем `outOfStock`. Корневой `stockStatus` используется только при отсутствии статусов вариантов. Это устраняет влияние устаревшего root status на порядок карточек.
- В каталоге растений удалены UI-фильтры освещённости, потребности в воде и пригодности для Черноморского побережья. Оставлены тип растения и зимостойкость; добавлены `priceAsc` и `priceDesc`. Сначала всегда сортируется группа наличия, внутри группы применяется выбранная сортировка. Варианты без положительной цены помещаются после товаров с ценой в той же группе.
- Изменённые runtime-файлы: `src/pages/CategoryPage.tsx`, новый `src/lib/plantCatalogUtils.ts`. Тест: `tests/plant-catalog-utils.test.mjs`.
- Live Sanity чтение было read-only; документ `palm-trachycarpus` и любые другие Sanity documents не изменялись. Schema, D1, Cloudflare settings/secrets, orders, cart, checkout, Header, menu и Footer не затронуты.
- PR #204, ветка `fix/plant-category-stock-filters-names`, финальный HEAD на момент записи `a1f7b10ab4a56b7a3dd2630859a367ab351cb2e6`. CI run #871 и D1 validation #1066 прошли на более раннем HEAD `93f8b1c...`; обязательна повторная проверка финального HEAD после follow-up commits. Production deployment отсутствует.
- Отдельные индексируемые страницы вариантов не реализованы. Текущий ProductPage хранит выбранный вариант во внутреннем состоянии; `getRouteState` не читает variant query, клиентский canonical не сохраняет такой параметр, middleware Product JSON-LD и sitemap пока не перечисляют варианты. Для безопасной SEO-реализации нужен отдельный проектный этап с variant-aware URL, canonical/hreflang, middleware metadata/JSON-LD и sitemap. Не создавать дублирующие Sanity documents.

---

## Дополнение — страница «Общи условия» (PR #202, на проверке)

Дата: 11.11.2026

- Подготовлена отдельная публичная страница /terms на основе текста проекта, предоставленного владельцем 11.11.2026.
- Исходный документ сохранён без юридического редактирования в src/content/terms-bg.md; компонент отображения — src/pages/TermsPage.tsx.
- Маршрут подключён отдельной веткой в src/main.tsx; серверные title/description/canonical добавлены в functions/_middleware.ts; болгарский URL включён в functions/sitemap.xml.ts.
- Основной и единственный готовый текст сейчас болгарский. При выборе RU/EN страница явно сообщает, что перевод ещё не подготовлен; RU/EN hreflang не публикуются до появления проверенных переводов.
- Страница помечена как проект для юридического прегледа. В ней сохранены все 18 разделов, реквизиты и предупреждения из текста владельца. Юридическая корректность и реквизиты не подтверждены.
- Header, главное меню, Footer, корзина, checkout, Sanity, D1, заказы и клиентские данные не изменялись. Постоянная ссылка Footer не добавлялась.
- PR #202 squash-объединён в main: merge commit `b66e18b6ee952ff77e07121dcb3d03871f5a6ddc`.
- GitHub Actions на финальном PR HEAD `e2a7b913dfef06f5a1e90267d5c66b45d9882c89`: Blog and Studio validation run #868 — success (lint, tests, website build, read-only dry-run, Studio build); Florial D1 migration validation run #1058 — success (lint, website build, Pages Functions syntax, D1 migration validations).
- Cloudflare Pages Production deployment `7a4b4deb-f713-4f37-bbd4-0d11adf62913`, URL `https://7a4b4deb.florial.pages.dev`; trigger `github:push` на main commit `b66e18b6ee952ff77e07121dcb3d03871f5a6ddc`; stages queued, initialize, clone_repo, build и deploy — success. Production aliases проекта: `https://florial-bg.com` и `https://www.florial-bg.com`.
- Публичный URL страницы: `https://florial-bg.com/terms`. Автоматическая проверка HTML через внешний просмотрщик недоступна; deployment status и build подтверждены Cloudflare.

## Дополнение rev83 — Footer обновлён и опубликован в Production

Дата: 11.11.2026
Статус: PR #200 объединён; Cloudflare Pages Production deployment успешен.

- PR #200 squash-объединён в main: `ecd2b6f8a0700f864bfe24bfce047a88334a7753`.
- Изменён только `src/components/Footer.tsx`.
- Фон подвала `#F3F5EC` совпадает с фоном завершающей информационной секции `src/pages/ServicesListPage.tsx`; контактный блок — `#E9EDDB`, границы — `#DDE3D0`.
- Основные тексты стали тёмными и контрастными, ссылки — тёмно-зелёными; зелёные CTA звонка и WhatsApp сохранены.
- Добавлена локализованная постоянная ссылка `/withdrawal` рядом с `/privacy-policy`.
- Контакты, Facebook, локализация BG/RU/EN и существующие tracking events сохранены.
- Header, меню, checkout, Sanity, D1, Cloudflare settings/secrets и пользовательские данные не изменялись.
- CI PR #200: Blog and Studio validation #43012114645 — success; Florial D1 migration validation #43012114952 — success. Main D1 validation #43012265621 — success.
- Production deployment: `6225a42e-4904-442a-8937-393db535ac8a`, стадия deploy success, aliases `https://florial-bg.com` и `https://www.florial-bg.com`.

Остаётся: отдельная визуальная проверка на реальных мобильных/desktop экранах; юридическая проверка текста политики/заявления; authenticated Owner/Manager permission checks и полный Manager workflow.

---
## Дополнение rev82 — Production D1 migration 0014 применена

Дата: 11.11.2026
Статус: additive migration 0014 успешно применена в Production D1; read-only post-checks пройдены.

- Актуальный main на момент операции: e60f88abeef830eb160e1dbc9ecdc85908f609cf; инструкция rev69; technical passport до операции rev81.
- Production D1: florial-db, UUID 5fbb0e47-8439-493c-821a-6945eef7d8b2, jurisdiction eu.
- Перед изменением получен Time Travel bookmark: 000002bd-00000000-00005120-fb012ce3f8148fe6ae14638b64af462f.
- До применения последняя версия schema_migrations — 0013_manager_product_audit; две новые таблицы отсутствовали.
- Применён SQL из docs/migrations/0014_contract_withdrawals.sql. Cloudflare D1 API вернул success для всех SQL statements; applied_at: 2026-11-11 11:11:19.
- Созданы contract_withdrawals и contract_withdrawal_events, четыре индекса и четыре защитных триггера (JSON metadata, append-only UPDATE/DELETE событий, неизменяемость декларационных полей).
- Post-check подтвердил наличие всех объектов и регистрацию миграции.
- Контрольные количества существующих данных до/после совпадают: orders 7; order_events 26; service_leads 2; service_lead_events 7. На момент применения новые таблицы были пусты.
- После миграции владелец выполнил контролируемый end-to-end POST через Production-форму и подтвердил получение подтверждающего письма заявителем и администратором.
- Read-only post-test D1 подтвердил: `contract_withdrawals` — 1 запись; `contract_withdrawal_events` — 2 события (`declaration_received`, `confirmation_sent`). Проверочные запросы не меняли БД (`rows_written=0`, `changed_db=false`).
- Фактическая регистрация заявления и доставка подтверждений обеим сторонам подтверждены. Полная приёмка Manager остаётся частичной: авторизованные Owner/Manager проверки доступа, смена статусов и повторная отправка письма ещё не проверены.
- Не менялись существующие заказы/заявки, Sanity, Cloudflare settings/secrets, Header, меню, Footer и checkout. Migration additive only; тестовая запись сохранена.
- Юридическая проверка текста/сроков хранения и отдельное согласование постоянной ссылки Footer остаются открытыми. Тестовую запись не удалять без отдельного согласования.
- Документационный follow-up фиксирует фактический результат контролируемого теста; его публикация выполняется после проверки CI.

---
## Дополнение rev81 — PR #198 объединён и Production опубликована

Дата: 11.11.2026  
Статус: PR #198 объединён с main; Cloudflare Pages Production deployment завершился успешно; D1 migration 0014 НЕ применялась.

- PR #198: https://github.com/omaraandrey-dev/florial/pull/198, merged=true, squash merge.
- Merge commit / актуальный main: `1b94b5a749e759ee28197e32daef8733e1b21a3e`.
- GitHub Actions на main commit: Florial D1 migration validation #1042 — success; включает отдельный шаг `Validate contract withdrawals migration`. Blog and Studio validation #856 — success на PR head до merge; Pages production build также прошёл успешно.
- Cloudflare Pages project `florial`: Production deployment `8955b559-ce01-4e9a-9292-8da34fa43352`, URL `https://8955b559.florial.pages.dev`, trigger `github:push` на `main` commit `1b94b5a749e759ee28197e32daef8733e1b21a3e`; стадии queued, initialize, clone_repo, build, deploy — success. Production aliases проекта включают `https://florial-bg.com` и `https://www.florial-bg.com`.
- Live retrieval публичной страницы `/withdrawal` подтвердил отрисовку болгарской формы и ссылок BG/RU/EN; вариант `?lang=ru` вернул русские тексты. `/privacy-policy` вернула обновлённую политику с описанием обработки заявлений.
- Read-only запрос к Production D1 `schema_migrations` подтвердил, что последняя применённая миграция — `0013_manager_product_audit`; `0014_contract_withdrawals` отсутствует. Запрос прочитал 13 строк, `rows_written=0`, `changed_db=false`.
- Поэтому публичная страница уже опубликована и отображается, но полноценную отправку заявления и Manager workflow пока нельзя считать активированными: для них нужна миграция 0014. Не отправлять реальные заявления и не заявлять о работающей обработке до миграции и live smoke.
- Production D1 migration 0014 не применялась. Resend live test и авторизованные Owner/Manager проверки не выполнялись. Юридическая проверка текста, реквизитов и срока хранения не подтверждена.
- Footer, Header, основное меню, checkout, Sanity, Cloudflare settings/secrets не изменялись. Постоянная ссылка в Footer не добавлена; публичный адрес страницы можно открыть напрямую по `https://florial-bg.com/withdrawal`.
- Следующие условия: юридическая проверка; отдельное согласование Footer link; отдельное прямое согласие на применение additive migration 0014; затем проверка отправки Resend на контролируемый адрес, Owner/Manager permission checks и live smoke BG/RU/EN.

---

## Дополнение rev80 — CI-тест миграции онлайн-отказа

Дата: 11.11.2026  
Статус: тест миграции включён в CI и успешно пройден; PR #198 не объединён; Production не изменялась.

- Добавлен `tests/contract-withdrawals-migration.test.py`, который применяет `docs/migrations/0014_contract_withdrawals.sql` в SQLite in-memory и проверяет таблицы/индексы, корректное создание заявления и event, изменение разрешённых рабочих статусов, immutability декларационных полей, JSON-object metadata, append-only events, уникальность idempotency key и удаление персональной декларации при сохранении минимального audit event.
- В `.github/workflows/validate-d1-migration.yml` добавлен отдельный шаг `Validate contract withdrawals migration`; он выполняется отдельно от существующего теста plant audit migration.
- Code/CI baseline commit: `3a8f5b45085e9397f1a1c4a9ccc0d0c711c4bbab`. Florial D1 migration validation run #1040 — success, новый тест включён. Blog and Studio validation run #854 — success.
- Текущий PR #198 открыт, mergeable, не объединён. Base/main: `28c58401c6015033a9c844a1bf92d8d2151ba1d3`. Документационный commit после CI не меняет код миграции или приложения.
- Cloudflare Pages preview deployment setting: `none`; preview deployment пропускается с причиной `preview_deployments_disabled`. Не менять глобальную настройку проекта без отдельного согласования.
- Production deployment остаётся `d583ec9a-7986-4778-a171-f424c2039bee` на main commit `28c58401c6015033a9c844a1bf92d8d2151ba1d3`; D1 migration 0014 не применялась.
- Не менялись реальные D1 данные/заказы, Sanity, Cloudflare settings/secrets, Header, меню, Footer и checkout.
- Открытые условия до Production: юридическая проверка текста/реквизитов/retention; отдельное согласование Footer link; тест Resend на контролируемый адрес; Owner/Manager live checks; согласование и применение migration 0014; Production deployment и live smoke BG/RU/EN.

---

## Дополнение rev79 — повторная проверка PR #198 и Cloudflare deployment

Дата: 11.11.2026  
Статус: кодовая ветка проверена на текущем HEAD; Production не менялась.

- PR #198 открыт и mergeable, но не объединён. Branch `feat/contract-withdrawal-flow`; фактический HEAD `5d5f3d8cbe815f3d11cb552cee6eecd840f2e3ce`.
- GitHub `main` и PR base остаются на commit `28c58401c6015033a9c844a1bf92d8d2151ba1d3`.
- GitHub Actions на фактическом HEAD: Blog and Studio validation #847 — success; Florial D1 migration validation #1033 — success. В #847 прошли lint, tests, website build, migration script syntax, read-only description migration dry-run и Sanity Studio build. Job #1033 прошёл success, но его шаг «Validate additive plant audit migration» не является прямой проверкой contract withdrawal migration 0014.
- Migration `docs/migrations/0014_contract_withdrawals.sql` ранее проверена отдельно на SQLite in-memory (DDL, triggers, insert/update, immutability и append-only). Это отдельная проверка, не CI run #1033.
- Cloudflare Pages project `florial` имеет `preview_deployment_setting=none`; deployment `48859ea7-7b07-4165-a823-4a67faba679a` для HEAD помечен skipped с причиной `preview_deployments_disabled`. Изменять глобальную настройку preview без отдельного согласования нельзя.
- Последний Production deployment: `d583ec9a-7986-4778-a171-f424c2039bee`, commit `28c58401c6015033a9c844a1bf92d8d2151ba1d3`, все стадии success. Для PR deployment не запускался.
- Production D1 migration 0014 не применялась; данные D1, заказы, Sanity и Cloudflare settings/secrets не менялись. Header, меню, Footer и checkout не затрагивались.
- До Production остаются: юридическая проверка текста/реквизитов/срока хранения; отдельное решение о Footer link; тест Resend на контролируемый адрес; авторизованные Owner/Manager checks; отдельное согласование применения migration 0014; Production deployment и live smoke BG/RU/EN.
- CI workflow success не заменяет правовую проверку, live role checks или production acceptance.

---

## Дополнение rev78 — черновая реализация онлайн-отказа от договора

Дата: 11.11.2026  
Статус: PR #198 открыт, CI success; merge и Production не выполнялись.

- Текущий baseline: `main` commit `28c58401c6015033a9c844a1bf92d8d2151ba1d3`; Cloudflare Pages Production deployment `d583ec9a-7986-4778-a171-f424c2039bee` — success.
- В GitHub создана ветка `feat/contract-withdrawal-flow`.
- Добавлена публичная локализованная страница `/withdrawal` (BG/RU/EN), двухэтапная форма с отдельной кнопкой подтверждения, ссылкой на официальный стандартен формуляр (Приложение № 6) и серверным timestamp.
- Добавлен `POST /api/withdrawals`: same-origin, bounded JSON body, D1 rate limit, валидация имени/идентификатора договора/email, регистрация заявления в D1 и попытка отправить подтверждение через существующий Resend.
- Заявление сохраняется и при отсутствии автоматического совпадения заказа; в этом случае `order_id=NULL`, а Manager показывает необходимость ручной проверки. Публичный ответ не раскрывает факт/отсутствие совпадения с заказом.
- Добавлена additive миграция `docs/migrations/0014_contract_withdrawals.sql`: таблицы `contract_withdrawals` и append-only `contract_withdrawal_events`; декларационные поля защищены от изменения триггером. Существующие orders/order_events не меняются.
- Добавлен Manager API `/api/manager/withdrawals` и вкладка `Откази от договори`. Просмотр доступен Owner и Manager с `canViewOrders`/ `canEditOrders`; изменение статуса и повторная отправка подтверждения — Owner/Manager с `canEditOrders`.
- Privacy Policy BG/RU/EN дополнена раскрытием категорий данных, целей обработки, подтверждений Resend и критериев хранения заявлений. Срок хранения требует юридической фиксации; автоматическое удаление не реализовано.
- Добавлены helper tests `tests/contract-withdrawals.test.mjs`.
- Production D1 проверена только read-only: миграции до `0013_manager_product_audit`; 7 заказов и 26 order events. Никакие данные и схемы Production не менялись.
- Не изменялись Header, основное меню, Footer, checkout, каталог Sanity, существующие заказы, Cloudflare settings/secrets и Production D1.
- **Открытые блокирующие пункты:** CI и PR review; отдельное согласование постоянной ссылки в Footer (без неё функция не будет видимой и доступной на всех страницах, как требует чл. 52а); юридическая проверка текста, реквизитов и срока хранения; проверка реальной отправки Resend на тестовый адрес; миграция Production D1 и публикация выполняются только после отдельного подтверждения.
- Не заявлять о юридической готовности или Production-релизе до выполнения блокирующих пунктов и live smoke BG/RU/EN.


### CI и статус PR — 11.11.2026
- PR #198: `https://github.com/omaraandrey-dev/florial/pull/198`, head `86944fce79ca9e2dbb9bb95fb1c7dd7c826f5862`, открыт, mergeable, не объединён.
- GitHub Actions Blog and Studio validation run #845 — success: lint, tests, website build, migration script syntax check, read-only dry-run, Sanity Studio build.
- GitHub Actions Florial D1 migration validation run #1031 — success. Отдельно SQL `docs/migrations/0014_contract_withdrawals.sql` проверена в SQLite in-memory: создание таблиц/индексов/триггеров, регистрация заявления/события, изменение статуса, запрет изменения декларации и append-only event; удаление декларационной строки возможно после утверждённого срока хранения, неидентифицирующий event остаётся.
- Production D1 migration 0014 не применялась. Cloudflare Production deployment не запускался; PR не merged.
- Cloudflare Pages preview deployment `e87a10d3-e65a-4536-a7b3-4f657f15a4ce` для branch commit `86944fce79ca9e2dbb9bb95fb1c7dd7c826f5862` создан как `preview`, но все стадии остались `idle`; активного preview и Production deploy не подтверждено.
- Footer, checkout, Header и меню не изменялись. Постоянная ссылка Footer остаётся блокирующим пунктом и требует отдельного согласования владельца.

---

## Дополнение rev77 — разрешение privacy-policy route в Cloudflare Middleware

Дата: 11.11.2026

- После Production deployment rev76 live smoke выявил HTTP 404 для /privacy-policy, включая RU/EN query variants.
- Причина: functions/_middleware.ts завершал неизвестные статические пути через notFoundResponse до передачи запроса в Vite SPA. Клиентский route в src/main.tsx и sitemap уже существовали, но edge middleware не разрешал новый путь.
- Добавлен явный route /privacy-policy в middleware: локализованные title/description, SSR SEO fallback H1/intro, self-canonical и alternates BG/RU/EN/x-default, index/follow.
- Изменён только functions/_middleware.ts. Sanity, D1, API, Manager, checkout, Header, Footer, меню и Cloudflare settings/secrets не менялись.
- PR/CI/Production deployment и повторный live smoke ожидают; не считать исправление опубликованным до подтверждения.

---
## Дополнение rev76 — публичная политика конфиденциальности Florial

Дата: 11.11.2026

- Добавлена публичная страница /privacy-policy с болгарской версией по умолчанию и локализациями ?lang=ru / ?lang=en.
- Добавлен локализованный пункт «Политика за поверителност» в самом низу Footer после Copyright. На самой странице доступны переключатели BG/RU/EN и возврат на главную.
- В functions/sitemap.xml.ts добавлены три локализованных URL политики с hreflang alternates.
- Страница использует существующий applyPageSeo: локализованные title/description, self-canonical и alternates, index, follow.
- Политика отражает текущую архитектуру Sanity + Cloudflare Pages/Functions + D1 + Resend; Supabase не указан как действующий поставщик.
- Описаны категории данных заказов и заявок, статистические события, rate-limit hash IP (до 48 часов), localStorage языка/корзины, внешние сервисы и права по GDPR.
- В политике прямо раскрыто, что срок пересмотра service leads предусмотрен до 365 дней, но автоматическое удаление заявок на текущий момент не реализовано. Это открытый operational/privacy gap.
- Юридические реквизиты взяты из предоставленного владельцем черновика; адрес использован по прямому подтверждению владельца. Седалище по Търговския регистър отдельно не проверялось.
- Затронуты: src/pages/PrivacyPolicyPage.tsx (новый), src/main.tsx, src/components/Footer.tsx, functions/sitemap.xml.ts. Не изменялись Sanity, D1, API, Manager, checkout, Header, основное меню, Cloudflare settings/secrets.
- CI, Production deployment и live smoke на момент записи ещё не подтверждены; не считать страницу опубликованной до проверки.
- Требуется юридическая проверка болгарским специалистом: правовые основания статистики, transfer impact/договоры поставщиков, точные сроки хранения бухгалтерских данных, реквизиты и порядок фактического удаления заявок.

---
## Дополнение rev75 — аудит локализованных H1, SEO, изображений, архива заявок и AI-потоков

Дата: 11.11.2026

### Три карточки растений
- В Sanity dataset `plants` подготовлены только отдельные H1:
  - `plant-3b1f30e9-51e5-4020-847d-bdea5a403dec` — BG `Испанска ела (Abies pinsapo)`, RU `Испанская пихта (Abies pinsapo)`, EN `Spanish fir (Abies pinsapo)`.
  - `plant-dfa442af-261b-4f3b-a0c3-71686132a7e2` — BG `Кавказка ела (Abies nordmanniana)`, RU `Пихта Нордмана (кавказская пихта, Abies nordmanniana)`, EN `Nordmann fir (Caucasian fir, Abies nordmanniana)`.
  - `plant-b0e4396c-49b8-4a10-a608-ff248b95cc46` — BG `Обикновен смърч (Picea abies)`, RU `Ель европейская (Picea abies)`, EN `Norway spruce (Picea abies)`.
- Поля записаны в draft: корневое `seo.h1` (BG) и `translations.ru.seo.h1` / `translations.en.seo.h1`. Названия товаров, SEO title/description, описания, цены, варианты, категории и изображения не изменялись.
- Перед записью создан полный снимок трёх документов: `docs/backups/sanity-plant-h1-before-2026-11-11.json`.
- Публикация не выполнена: Sanity validation показывает для каждой из трёх карточек четыре ошибки типа данных — `description` и `translations.bg/en/ru.description` имеют тип String, а deployed schema ожидает Portable Text Array (`richDescription`). Validation beta сообщает, что custom callbacks не запускались. Опубликованные документы остались без изменений; H1 остаются в draft до отдельного решения по безопасному представлению старых описаний.
- В опубликованном каталоге plants найдено 43 документа: 40 уже используют Portable Text для корневого и трёх локализованных описаний и имеют новые SEO metaTitle/metaDescription; ровно эти три карточки остаются legacy исключениями.

### SEO, категории и внутренние связи
- Для трёх карточек `seo.metaTitle` и `seo.metaDescription` отсутствуют; frontend использует legacy fallback `seo.title` и `seo.description`. Локализованные названия `translations.ru.name` и `translations.en.name` заполнены, но RU для Abies pinsapo («Испанский Пихта») и RU/EN для Picea abies («Ель Смурч» / «Spruce Fir») некорректны или неестественны. До публикации новых H1 страница использует эти локализованные названия как fallback.
- Найдены ошибки локализации legacy SEO: для испанской пихты RU Title/Description содержат неграмматичное название и ошибочное написание Несебър; для Picea abies используются неестественные/неверные названия «Смърч Ела», «Ель Смурч», «Spruce Fir». Для кавказской пихты RU также используется транслитерация Несебыр вместо Несебър/Несебар. SEO поля не менялись.
- Все три товара имеют `productType=conifer` и корректную цепочку категорий: `Всички растения` → `Дървета и декоративни храсти` → `Иглолистни дървета и храсти`. `relatedProducts` и `relatedContentBySlug` пусты.
- Метаданные изображений подтверждают наличие основной и дополнительной фотографии у каждого товара. Разрешения: Abies pinsapo 2000×2000 + 1149×2002; Abies nordmanniana 2000×2000 + 1044×1309; Picea abies 1352×1484 + 748×547. Визуальная проверка содержимого файлов не выполнялась.
- ALT дополнительных изображений сейчас являются шаблонными «снимка 2» и местами оставлены на болгарском в RU/EN. ALT основной фотографии Picea abies содержит сомнительное описание «пълзящ ела с бяла пънка», не соответствующее нормальному описанию Norway spruce. ALT не изменялись.

### Архив заявок и D1
- В Cloudflare D1 `florial-db` таблица `catalog_submissions` содержит 15 записей и `catalog_submission_events` — 57 событий: 9 published, 3 draft, 2 submitted, 1 changes_requested.
- Отдельной archive-таблицы нет: owner-only вкладка «Архив заявок» в `ManagerApp` читает `catalog_submissions` (до 100 записей, сортировка по updated_at). Это отдельный legacy workflow; новый прямой каталог растений работает через Sanity Pages Functions и отдельный D1 audit.
- Таблица `service_leads` отдельно содержит 2 заявки на услуги; `orders` — 7 записей, archived_at установлен у 0. Данные D1 не изменялись.

### Разделение Google и Cloudflare AI
- Текущий Google-путь в `PlantCatalogManager`: `POST /api/manager/plants/gemini-test`, модель `gemini-3.5-flash-lite`, секрет `GEMINI_API_KEY`. UI вызывает именно этот endpoint.
- Legacy вкладка заявок использует `PlantPublicationEditor`, который по-прежнему вызывает `/api/manager/enrich-plant` и `/api/manager/enrich-plant-care`. Эти endpoints используют Cloudflare Workers AI (`@cf/meta/llama-3.3-70b-instruct-fp8-fast` и `@cf/meta/llama-3.2-11b-vision-instruct`) и GBIF для отдельной ботанической проверки.
- Cloudflare Production по-прежнему имеет binding `AI` и service binding `PLANT_CARE_WORKFLOW`; workflow `florial-plant-care-workflow` существует. Проверены 3 экземпляра: 2 complete и 1 errored. Ошибка заявки «Кавказка ела»: этап care_generation завершился невалидным JSON; диагностический кандидат `Abies concolor` не был сохранён в товар. В D1 для этой и ещё трёх заявок остались статусы plantCareJob=queued, хотя один workflow errored, а три соответствующих workflow instance возвращают 404. Это устаревшие статусы, не подтверждение работающих задач.
- `functions/api/manager/plants/ai-enrich.ts` остаётся резервным неиспользуемым endpoint; актуальная инструкция rev66 указывает, что основной UI его не вызывает. Ничего из Workers AI, workflow и Cloudflare bindings не отключалось и не удалялось.
- В Pages Production остаются legacy переменные `SUPABASE_*` и `VITE_SUPABASE_*`; текущий `managerApi` — собственный клиент Cloudflare D1, `sanity.ts` использует Sanity, Supabase SDK/runtime references в текущем коде не обнаружены. Переменные не удалялись и значения секретов не читались.

### Изменения и проверки
- Изменён только Sanity draft трёх H1 и добавлен backup JSON в GitHub. Sanity published documents, D1 rows/schema, Cloudflare settings/secrets/bindings и frontend/backend код не менялись.
- Cloudflare Pages Production deployment после backup commit `d3346733-9165-4dff-8470-8650397e9e22` завершился success; deployment commit `f7b0aa5f68b1e22339a897518dca0262c99febc1`. Документация отражает фактический статус draft-only и не заявляет публикацию H1.
- Следующее безопасное решение для Owner: разрешить или отклонить техническое преобразование 12 legacy description string fields (по 4 в каждой карточке: корневое описание и BG/RU/EN) в Portable Text blocks с сохранением исходного текста дословно; без этого Sanity не публикует H1.

---

## Дополнение rev74 — подтверждение фактической записи размера растения

Дата: 11.11.2026

- Для POST /api/manager/plants/:id/add-variant после Sanity mutation выполняется read-back целевого документа с полями saleVariants и проверкой нового элемента по _key, name, priceEUR, stockStatus=inStock и stockQuantity.
- API возвращает ok=true и variantVerified=true только после совпадения всех значений в повторно прочитанном Sanity документе. Отсутствующий/несовпадающий вариант возвращает безопасный код SANITY_VARIANT_NOT_CONFIRMED и не отображается в Manager как успешное сохранение.
- Idempotent replay теперь также проверяет фактический вариант в Sanity; повтор операции после временного сбоя проверки может подтвердить уже записанный вариант без добавления дубликата. Конфликт совпадающего _key с другими данными не считается успехом.
- UI PlantDuplicatePicker дополнительно требует ok, variantVerified, ожидаемый documentId и непустую revision перед закрытием окна и показом уведомления об успехе.
- Добавлены unit tests для полного совпадения и частичных/несовпадающих вариантов. D1 audit фиксирует отдельный код ошибки проверки read-back; секреты, содержимое фото и данные пользователя не логируются.
- Изменения ограничены add-variant API, helper/типами, PlantDuplicatePicker, тестами и документацией. Sanity schema, существующие документы и изображения не меняются; D1 schema/rows не мигрируются и не редактируются вручную; Cloudflare secrets/settings, каталог оборудования, заказы, Header/menu/Footer не затрагиваются.
- PR #194 объединён squash в `main`; merge commit `95375b28d913eb9321f4309c52df76f489492a21` (PR head `7b17a08057b5d23484cf60e3b365919e8baed429`).
- GitHub Actions: Blog and Studio validation run #832 — success (lint, tests, website build, migration syntax/read-only dry-run и Sanity Studio build); Florial D1 migration validation run #1010 на PR и #1011 после merge в main — success (lint, build, Pages Functions syntax и additive plant audit migration validation).
- Cloudflare Pages Production deployment `aecbfaf1-aa72-4ae3-aac4-bbf7365b2b0e`, URL `https://aecbfaf1.florial.pages.dev`, commit совпадает с merge commit. Стадии queued, initialize, clone_repo, build и deploy — success; aliases `https://florial-bg.com` и `https://www.florial-bg.com` назначены.
- Авторизованный live-тест добавления нового размера владельцем после публикации остаётся обязательной приёмкой; он не выполнялся автоматически, так как требует действующей Manager-сессии и осознанного production catalog write.

---

## Дополнение rev73 — очистка устаревшей старой цены при изменении цены растения

Дата: 10.11.2026

- Удалена блокирующая проверка, требовавшая, чтобы `oldPriceEUR` всегда была выше `priceEUR`. Обычное повышение текущей цены растения теперь разрешено.
- Необязательная старая цена сохраняется только если она строго выше текущей цены (то есть действительно обозначает скидку). Если старое значение отсутствует, равно текущей цене или ниже неё, оно автоматически исключается из варианта при следующем сохранении.
- Это устраняет блокировку редактирования категории/наличия/прочих полей из-за устаревшего значения старой цены, не выполняя массовую запись или миграцию Sanity.
- Добавлен изолированный helper и unit tests для реальной скидки, равной/меньшей старой цены и обычного повышения цены.
- Серверная логика прав ролей, текущей цены, вариантов, складских остатков, Sanity optimistic revision, D1 audit и другие проверки не меняются. Поля старой цены по-прежнему могут передаваться в рамках текущей формы продавца/менеджера; эта правка не расширяет права на изменение других полей.
- Затронуты: `functions/api/manager/plant-direct-lib.ts`, новые `functions/api/manager/plant-old-price-lib.mjs` и `functions/api/manager/plant-old-price-lib.d.mts`, новый `tests/plant-old-price.test.mjs`, а также документация.
- GitHub Actions PR-triggered runs/check statuses для merge commit в доступном ответе не представлены; отдельно не заявлять их как success. Cloudflare Pages production deployment `431d0604-871e-4672-8276-fd8b2dccdc14` (`https://431d0604.florial.pages.dev`) для commit `56546d921c0d3327e33054031be6185567147616` завершился success на всех стадиях queued, initialize, clone_repo, build и deploy; aliases `https://florial-bg.com` и `https://www.florial-bg.com` назначены.
- Sanity documents/assets/schema, D1 schema/rows, Cloudflare secrets/settings, оборудование, заказы и глобальные компоненты не изменялись.

---

## Дополнение rev72 — безопасная диагностика PATCH-запроса при редактировании растения

Дата: 10.11.2026

- Для `PATCH /api/manager/plants/:id` введена отдельная тестируемая проверка контракта запроса: JSON body, UUID `idempotencyKey`, объект `product` и непустая строка `expectedRevision`.
- Вместо общего `Invalid product update request` Manager API возвращает код `INVALID_PRODUCT_UPDATE_REQUEST` и только список некорректных/отсутствующих полей с болгарскими пояснениями. Значения карточки, ревизии, UUID, AI proof, фотографии и секреты не возвращаются.
- Существующие проверки авторизации, роли, same-origin, AI proof (если передан), Sanity optimistic revision, idempotency, D1 audit и сама логика записи не меняются.
- Добавлены unit tests для валидного UUID `crypto.randomUUID()`, корректного PATCH payload, невалидного JSON body и каждого обязательного поля.
- Причина исходной ошибки по конкретному сохранению пока `НЕ ИЗВЕСТНО — нужно уточнить`: после публикации диагностический ответ покажет, какой элемент запроса фактически отсутствовал/не прошёл проверку.
- Изменения ограничены `functions/api/manager/plants/[id].ts`, новым `functions/api/manager/plant-update-request-lib.mjs` и его типами, новым тестом `tests/plant-update-request.test.mjs` и документацией. Sanity schema/documents/assets, D1 schema/rows, Cloudflare secrets/settings, прочие категории и глобальные компоненты не затрагиваются.
- Unit tests для нового валидатора: 4/4 passed локально. GitHub Actions Florial D1 migration validation run #1001 завершился со статусом `cancelled`; при этом все перечисленные шаги job — Checkout, Setup Node.js, Install dependencies, Lint, Build website, Syntax-check Pages Functions и Validate additive plant audit migration — имели `success`. Не обозначать итог run как success.
- PR #192 объединён squash в `main`; merge commit `60f345650d51253e2a7d3695e507038d2ea91537`.
- Cloudflare Pages Production deployment `4b574ecd-5f9c-4b8f-9c61-cc431a53e434`, URL `https://4b574ecd.florial.pages.dev`; deployed commit совпадает с merge commit. Все стадии queued, initialize, clone_repo, build и deploy завершились `success`; production aliases `https://florial-bg.com` и `https://www.florial-bg.com` назначены.
- Авторизованный live тест редактирования растения и добавления категории после публикации остаётся обязательной приёмкой Owner. Причина прежнего запроса будет установлена по `invalidFields` нового ответа; до такого теста она остаётся `НЕ ИЗВЕСТНО — нужно уточнить`.
- Production Sanity documents/assets/schema, D1 rows/schema, Cloudflare secrets/settings, каталог поливочного оборудования, заказы, Header/menu/Footer не изменялись; production catalog writes не выполнялись.
- Изменены только `functions/api/manager/plants/[id].ts`, новые `functions/api/manager/plant-update-request-lib.mjs` и `functions/api/manager/plant-update-request-lib.d.mts`, `tests/plant-update-request.test.mjs`, `docs/TECHNICAL_PASSPORT.md` и `CHANGELOG.md`.

---

## Дополнение rev71 — автоматические повторы при временной перегрузке Gemini

Дата: 10.11.2026

- Для Gemini HTTP 502/503/504 добавлены максимум два автоматических повтора того же read-only запроса анализа с задержками 900 и 1800 мс. На каждом повторе Manager получает SSE progress; промежуточное тело ответа Google отменяется и не логируется.
- HTTP 429 (квота/лимит), 4xx, ошибки доступа, неверный запрос и ошибки потока не повторяются этой логикой. Модель `gemini-3.5-flash-lite`, endpoint, prompt, response schema, параметры генерации, API key, формат результата и AI proof не меняются.
- Если после двух повторов Google продолжает отвечать 5xx, Manager получает исходную безопасную диагностику, HTTP status, provider status, request ID и число повторов. Автоматические повторы не выполняют запись в Sanity/D1.
- Добавлены unit tests для разрешённых retry статусов, исключения 429/4xx и фиксированных задержек.
- Blog and Studio validation run #828 — success: website lint, utility tests, website build, migration syntax/dry-run и Sanity Studio build. Florial D1 migration validation run #998 — success.
- PR #191 объединён squash в `main`; merge commit `68d9b1980b1dbde0e97c1e567dd9d26e5ef2bbda`.
- Cloudflare Pages Production deployment `4870b7b6-ed1a-4a19-9901-41c4eaaea475`, URL `https://4870b7b6.florial.pages.dev`; deployed commit совпадает с merge commit. Все стадии queued, initialize, clone_repo, build и deploy завершились `success`; production aliases `https://florial-bg.com` и `https://www.florial-bg.com` назначены.
- Авторизованный live Gemini request с реальной фотографией после deployment остаётся обязательной приёмкой Owner; реальный Google 503 является временной ошибкой провайдера и не гарантирует, что повторная попытка обязательно пройдёт.
- Production Sanity documents/assets, D1 schema/rows, Cloudflare secrets/settings, каталог оборудования, заказы, Header/menu/Footer не изменялись.
- Изменены только `functions/api/manager/plants/gemini-test.ts`, `functions/api/manager/plants/gemini-test-lib.ts`, `src/manager/PlantCatalogManager.tsx`, `tests/gemini-plant-ai.test.mjs`, `docs/TECHNICAL_PASSPORT.md` и `CHANGELOG.md`.

## Дополнение rev70 — исправление UUID при добавлении варианта растения

Дата: 10.11.2026

- Причина `Invalid add-variant request.` установлена и исправлена: серверный UUID regex был неверным — не соответствовал стандартной структуре UUID `8-4-4-4-12`, поэтому отклонял `crypto.randomUUID()` браузера. Теперь проверяется полный стандартный UUID.
- Ранняя валидация запроса возвращает безопасный код `INVALID_ADD_VARIANT_REQUEST` и имена отсутствующих/неверных полей (`body`, `idempotencyKey`, `expectedRevision`, `variant`, `image`), а Manager показывает болгарские названия полей. Значения запроса, токены, AI proof и изображения не раскрываются.
- Сохранены проверки роли, same-origin, Google AI proof, Sanity asset, optimistic revision, idempotency и D1 audit. Формат Sanity и логика append варианта не меняются.
- Unit tests проверяют стандартный UUID, точный контракт запроса и диагностирование отсутствующих полей. Blog and Studio validation run #827 — success: 60 tests passed, lint, website build, migration syntax/dry-run и Sanity Studio build. Florial D1 migration validation run #993 — success.
- PR #190 объединён squash в `main`; merge commit `19f18b63d2132d5b18c334056808a314c203fee3`.
- Cloudflare Pages Production deployment `0ed7d8d2-cedb-4b76-b237-dddf4c35aad2`, URL `https://0ed7d8d2.florial.pages.dev`; deployed commit совпадает с merge commit. Стадии queued, initialize, clone_repo, build и deploy завершились `success`; production aliases `https://florial-bg.com` и `https://www.florial-bg.com` назначены.
- Live homepage fetch вернул страницу Florial с основным содержимым. Авторизованный сценарий сохранения варианта в Manager после deployment ещё должен быть проверен владельцем; Sanity production documents/assets и D1 rows/schema не изменялись.
- Изменены только `functions/api/manager/plant-duplicate-lib.mjs`, его `.d.mts`, `functions/api/manager/plants/[id]/add-variant.ts`, `src/manager/PlantDuplicatePicker.tsx`, `tests/plant-duplicates.test.mjs`, `docs/TECHNICAL_PASSPORT.md` и `CHANGELOG.md`.

---

## Дополнение rev68 — надёжный разбор Gemini SSE и диагностика JSON

Дата: 10.11.2026

- Обработчик Gemini SSE переведён на отдельный тестируемый parser с поддержкой LF, CRLF, CR, BOM, нескольких data lines, произвольного разбиения сетевых чанков и последнего события без завершающего пустого разделителя.
- Некорректное SSE JSON-событие учитывается и пропускается; последующие корректные события продолжают обрабатываться.
- В диагностике Manager показываются число SSE-событий, число некорректных событий, пропущенные строки и безопасное описание синтаксической ошибки JSON с позицией. Полный provider body и содержимое ответа в Cloudflare logs не записываются.
- Модель gemini-3.5-flash-lite, API endpoint, prompt, response schema, maxOutputTokens=8192, API key, Sanity и D1 не изменялись.
- Изменены только функции Gemini, Manager diagnostic display, unit tests и документация.
- Добавлены unit tests для BOM, LF/CRLF/CR, фрагментов чанков, EOF без пустой строки, malformed SSE event и диагностики JSON.
- PR #189 объединён squash в main; merge commit: 1bd2d62e1e386b3293bf386cd75bfe301e49d8cf.
- Blog and Studio validation #822 — success: lint, 58 tests passed / 0 failed, website build, migration syntax/dry-run и Sanity Studio build.
- Florial D1 migration validation #982 — success: lint, website build, Pages Functions syntax и additive migration validation.
- Cloudflare Pages Production deployment b0732d5d-a83b-474b-af09-8c2dfa9555ae, URL https://b0732d5d.florial.pages.dev; deployed main commit 1bd2d62e1e386b3293bf386cd75bfe301e49d8cf. Все стадии queued, initialize, clone_repo, build и deploy завершились success; aliases https://florial-bg.com и https://www.florial-bg.com назначены.
- Live smoke: главная florial-bg.com и /manager вернули HTTP 200; /manager показывает штатную болгарскую страницу входа. Авторизованный Gemini Photo/Text test после deployment остаётся обязательным и ещё не выполнен.
- Sanity schema/documents/assets, D1 schema/rows/migrations и Cloudflare secrets/settings не изменялись; production catalog writes не выполнялись.

---

## Дополнение rev67 — исправления Manager растений и диагностика Gemini

Дата: 10.11.2026

### Поведение Manager
- При применении результата Google первый корректный ботанический кандидат предварительно переносится в поле `scientificName`, даже если confidence medium/low. Уже введённое вручную ботаническое имя не перезаписывается. Предупреждение о необходимости ручной проверки кандидата сохраняется; кандидат не объявляется научно подтверждённым.
- Обычное редактирование опубликованной карточки растения через PATCH не требует повторного Google AI proof. Если proof передан, сервер проверяет его. Создание новой карточки через POST по-прежнему требует действительный Google AI proof.
- Новый вариант по умолчанию получает `stockStatus=inStock`. Для нового варианта и для нового товара при статусе «В наличност» обязательно фактическое целое количество больше нуля.
- При добавлении варианта через красную точку совпадений сотрудник вводит размер, цену EUR и количество (шт.). Сервер сохраняет `stockStatus=inStock` и введённое `stockQuantity`. Существующие варианты не переписываются; старые варианты со статусом inStock и пустым количеством остаются редактируемыми, если их статус не меняется.
- Общая галерея остаётся прежней: проверенное изображение добавляется в gallery, не привязывается к отдельному варианту; mainImage и прежние изображения не заменяются. Sanity schema и структура документа не меняются.

### Диагностика Google Gemini
- Streaming parser сохраняет безопасные метаданные завершения: candidate finishReason, prompt block reason, usage token counts, полученные bytes/chars и состояние JSON parse.
- `MAX_TOKENS` и safety termination показываются разными кодами; невалидный/неполный JSON сопровождается диагностикой. В Cloudflare logs не записываются API key, заголовки авторизации, raw provider body, полное содержимое ответа или изображения.
- Модель `gemini-3.5-flash-lite`, prompt, response schema и лимит `maxOutputTokens=8192` не менялись. Увеличение лимита или смена модели не выполняются без данных о фактическом finishReason.
- Диагностика не доказывает причину уже произошедшей ошибки задним числом; точная причина прежнего ответа на 3835 символов остаётся НЕ ИЗВЕСТНО — нужно уточнить по новому Request ID после публикации.

### Изменённые файлы
- `src/manager/PlantCatalogManager.tsx`
- `src/manager/PlantDuplicatePicker.tsx`
- `functions/api/manager/plants/[id].ts`
- `functions/api/manager/plants/[id]/add-variant.ts`
- `functions/api/manager/plant-direct-lib.ts`
- `functions/api/manager/plant-duplicate-lib.mjs`
- `functions/api/manager/plants/gemini-test.ts`
- `functions/api/manager/plants/gemini-test-lib.ts`
- `tests/plant-duplicates.test.mjs`
- `tests/plant-direct-stock.test.mjs`
- `tests/gemini-plant-ai.test.mjs`

### Ограничения и статус
- Не менялись Sanity schema/documents/assets, D1 schema/rows, Cloudflare secrets/settings, модель Gemini, каталог поливочного оборудования, заказы, Header/menu/Footer и общая структура сайта.
- Никакие production catalog writes и миграции не выполнялись.
- CI и Production deployment завершены успешно: Blog and Studio validation #819, Florial D1 migration validation #975; deployment `2c9a2e6e-67ce-4cba-8056-a84983db7621`.
- Ручная проверка в Manager ролями Owner/Manager/Seller остаётся обязательной после публикации.
- PR #188 squash merged в `main`; merge commit: `4e53815028d45ea22958ce4feadd1585e90f461f`.
- Cloudflare Pages Production deployment: `2c9a2e6e-67ce-4cba-8056-a84983db7621`; URL `https://2c9a2e6e.florial.pages.dev`; aliases `https://florial-bg.com` и `https://www.florial-bg.com`.
- GitHub Actions Blog and Studio validation #819 — success; Florial D1 migration validation #975 — success; website lint/tests/build, Studio build, Pages Functions syntax и migration validation — success.
- Ручная приёмка Owner/Manager/Seller в Production остаётся pending.

---

## 2026-11-10 — Manager растений: обнаружение совпадений и добавление варианта в существующую карточку (PR #187)

- Read-only проверка Sanity dataset plants подтвердила, что точный запрос по «Цикас» / Cycas revoluta возвращает две опубликованные карточки. Данные не изменялись.
- Read-only проверка Cloudflare D1 подтвердила существование manager_product_audit и применение migration 0013_manager_product_audit; схема и строки не изменялись.

**Scope:** только src/manager/PlantCatalogManager.tsx, новый src/manager/PlantDuplicatePicker.tsx, Manager Pages Functions и unit tests. Production catalog data не изменялись.

- Новый read-only endpoint GET /api/manager/plants/duplicates проверяет опубликованные product документы dataset plants по case-insensitive exact match в name, translations.bg.name, translations.ru.name, translations.en.name и scientificName и legacy plantDetails.scientificName. Используются имя Gemini и до трёх научных кандидатов. Draft документы исключаются, результат ограничен 12 карточками.
- В Gemini review dialog отображается кликабельная красная точка возле предложенного имени. Нажатие показывает найденные карточки с thumbnail, названием, scientificName, категорией и текущими вариантами.
- Новый вариант добавляется только по выбору сотрудником существующей карточки. Вводятся только свободный текст размера (до 100 символов) и цена EUR. Совпадающие высоты/названия допустимы. Стволы не имеют отдельного поля.
- Новый variant записывается в существующий saleVariants: _type=plantSaleVariant, случайный _key, name, priceEUR, stockStatus=onRequest, stockQuantity=null. saleHeightCm, containerVolumeL, SKU, old price и root price/stock не изменяются этим действием.
- Новая Pages Function: POST /api/manager/plants/:id/add-variant. Сервер проверяет Manager session/role, same-origin, HMAC aiProof и соответствие proof asset текущей фотографии, наличие Sanity image asset, текущую _rev, максимум 30 вариантов, idempotency и журнал manager_product_audit. Мутация использует Sanity ifRevisionID.
- Проверенная фотография добавляется в существующий gallery только если asset ещё не присутствует в mainImage/gallery и общее количество фотографий с учётом mainImage не превышает лимит Manager в 10 снимков. mainImage и существующие gallery entries сохраняются. При заполненной галерее новый вариант всё равно записывается без новой фотографии.
- Никаких Sanity schema changes, Sanity migrations, D1 migrations, D1 schema changes, production catalog mutations или глобальных UI changes нет.
- Tests: tests/plant-duplicates.test.mjs проверяет query escaping и локализованные поля, допускает повторяющийся размер, подтверждает сохранение прежних вариантов/снимков и поведение лимита gallery.
- PR #187 squash merged в main: 26ef412e9cddb61bea0c9d73ce2bd5dfc9aa0ddd. Первичный CI run #776 выявил ошибку test import path; query builder вынесен в Node-native helper functions/api/manager/plant-duplicate-lib.mjs (+ .d.mts declarations), импорт исправлен. Локальные Node tests: 7/7 passed; TypeScript declaration resolution проверена. GitHub Actions: Blog and Studio validation #807 — success; Florial D1 migration validation #957 — success. Cloudflare Pages Production deployment 02f1e592-440c-49ef-a611-234a42e60cf0, commit 26ef412e9cddb61bea0c9d73ce2bd5dfc9aa0ddd, completed successfully; URL https://02f1e592.florial.pages.dev, aliases https://florial-bg.com and https://www.florial-bg.com.

**Acceptance pending:** авторизованный тест Owner/Manager/Seller; проверить exact-match, multiple matches, repeated size, image already present, gallery full, revision conflict и idempotent retry. Не выполнять Sanity live writes до явного ручного теста владельцем.

---

## 2026-11-10 — Gemini Flash-Lite переведён в основной процесс заполнения растений

- PR #186 объединён squash в `main`; merge commit: `756784c51ada295732ee8c05b29200da5ac468a9`.
- Основной AI-процесс Manager растений теперь использует Google Gemini `gemini-3.5-flash-lite`; изолированный Owner-only test endpoint переведён в рабочий поток для ролей owner/manager/seller с проверкой `requirePlantRole`.
- В редакторе растений доступны два режима: Photo (основная фотография передаётся Google) и Text (только название; фотография и её содержимое не отправляются).
- Результат Google открывается в окне проверки. Кнопка «Да, приложи и запази» применяет AI-поля и сразу запускает существующее создание/обновление Sanity-документа. При успешной проверке не требуется второе ручное сохранение.
- Для записи endpoint выдаёт подписанный сервером `aiProof`, связанный с asset ID текущей основной фотографии. Существующие same-origin/auth проверки, проверка роли, idempotency key, optimistic revision, audit log и Sanity mutation/verification сохранены.
- AI-поля: название, тип, категория, краткое и полное описание BG/RU/EN, SEO BG/RU/EN, ALT основной фотографии в Photo режиме, а для Owner — plantCare и careGuide. Высоко-уверенный первый ботанический кандидат может быть предложен в scientificName, но UI предупреждает, что кандидат не подтверждён независимой ботанической базой.
- Коммерческие поля не генерируются и сохраняются из текущей карточки: SKU, цена, старая цена, размеры, варианты, количество и статус наличности, фотографии/галерея, isActive и isFeatured. При неполных обязательных коммерческих данных Sanity mutation не выполняется; пользователь получает ошибки валидации.
- Старый `functions/api/manager/plants/ai-enrich.ts` сохранён в репозитории для безопасного отката, но основной Manager UI больше не вызывает Workers AI. Cloudflare AI binding и секреты не изменялись.
- Runtime-файлы: `src/manager/PlantCatalogManager.tsx`, `functions/api/manager/plants/gemini-test.ts`, `functions/api/manager/plants/gemini-test-lib.ts`; тест: `tests/gemini-plant-ai.test.mjs`.
- GitHub Actions Blog and Studio validation #774 — success; Lint, website build, 41 tests (41 passed, 0 failed), Studio build, migration dry-run — success. Florial D1 migration validation #921 — success, включая Pages Functions syntax check и additive migration validation.
- Cloudflare Pages Production deployment: `2499b1ad-1ecc-402c-8d18-2f6c913c4447`; URL `https://2499b1ad.florial.pages.dev`; deployed commit совпадает с merge commit. Стадии queued, initialize, clone_repo, build и deploy завершились success; aliases `https://florial-bg.com` и `https://www.florial-bg.com` назначены.
- Существующий Production secret `GEMINI_API_KEY` не читался и не изменялся.
- Фактическая авторизованная приёмка полного сценария «Photo/Text → окно проверки → прямое сохранение в Sanity» после Production deployment, включая роли Manager/Seller, остаётся pending и должна быть выполнена в Manager.

## 2026-11-10 — Gemini Photo/Text: переход тестового endpoint на Flash-Lite

- Тестовая модель Owner-only endpoint `POST /api/manager/plants/gemini-test` изменена с `gemini-3.8-flash` на стабильную `gemini-3.5-flash-lite`.
- Модель поддерживает текстовый и графический ввод, а также structured outputs; обе тестовые кнопки Photo и Text продолжают использовать общий endpoint с разными payload/prompt.
- Изменены только `functions/api/manager/plants/gemini-test.ts` и подписи в `src/manager/PlantCatalogManager.tsx`.
- Сохранены response schema, prompts, SSE streaming, 300-секундный timeout, Owner-only authentication, same-origin guard и read-only режим.
- Workers AI enrichment, Sanity/D1, Cloudflare secrets/settings, каталог, заказы и глобальные компоненты не затронуты.
- API key не проверялся напрямую и не изменялся; его валидность остаётся неподтверждённой. Ошибка HTTP 503 UNAVAILABLE от прежней модели классифицирована как временная недоступность/перегрузка провайдера.
- PR #185 объединён squash в `main`: merge commit `8a42398c908b2dd0f0acc32121ead7fa85477b7e`.
- Blog and Studio validation #766 и Florial D1 migration validation #911 завершились success.
- Cloudflare Pages Production deployment `ce6ed89e-0d90-4ab2-bb9a-8779079cac85`, URL `https://ce6ed89e.florial.pages.dev`; build и deploy success, production aliases `florial-bg.com` и `www.florial-bg.com` назначены.
- Авторизованные live Owner Photo/Text tests на новой модели ещё не выполнены; функциональная приёмка остаётся pending.

## 2026-11-10 — Gemini Photo/Text: диагностика обрыва потока опубликована в Production

- Добавлены heartbeat SSE события каждые 3 секунды, пока Owner тест ожидает Google или читает ответ. Они содержат только Request ID, режим, этап и прошедшее время.
- Разделены transport failures при установлении соединения Cloudflare → Google, прерывании upstream stream и обрыве SSE в браузере.
- Manager показывает последний этап, безопасный error code, Request ID, Google HTTP status/content type и счётчики полученных bytes/chars, если соответствующие данные доступны.
- Добавлены структурированные Cloudflare logs: mode, stage, HTTP status, content type, counters, stable error code и exception type. API key, auth headers, image bytes, raw provider body и raw exception messages не логируются.
- Сохранены модель gemini-3.8-flash, prompt, response schema, Owner-only guard, same-origin проверка, 300-секундный provider timeout и read-only режим.
- PR #184 объединён squash в main: merge commit 9e24b416b142cbc7f9d0373bb737c7dc72f10dbe.
- Blog and Studio validation #764 и Florial D1 migration validation #906 завершились success.
- Cloudflare Pages Production deployment 98eff424-0b8e-4ec4-8301-50891d2d99d4 для merge commit завершился success; aliases florial-bg.com и www.florial-bg.com назначены.
- Реальный авторизованный Owner тест Photo и Text после деплоя ещё не выполнен. Функциональная приёмка Gemini и фактическая причина предыдущих network error остаются НЕ ИЗВЕСТНО — нужно проверить оба режима.
- Sanity/D1 данные и схемы, каталог, основная Workers AI функция, заказы, Header/menu/Footer и Cloudflare secrets/settings не изменялись.

## 2026-11-10 — Gemini Photo/Text: потоковое тестирование опубликовано в Production

- Подготовлена изолированная Owner-only тестовая интеграция Gemini 3.8 Flash с двумя режимами: Photo (Sanity plants CDN image + данные формы) и Text (только название/текст, без изображения).
- Endpoint сохранён: `POST /api/manager/plants/gemini-test`; поле `mode` различает `photo` и `text`.
- Google REST method переведён на `streamGenerateContent?alt=sse`; сервер передаёт Owner безопасные события progress/delta/result/error. Сырые текстовые фрагменты модели показываются в Owner панели; итоговый JSON отдельно нормализуется и проверяется перед отображением структурированного результата.
- Для Text prompt явно запрещает использование изображения, определяет введённое название как предмет анализа, просит botanical candidates, описания BG/RU/EN, SEO и plantCare. ALT и visual description остаются пустыми, так как фотографии нет.
- Общий лимит ожидания Gemini увеличен до 300 секунд; клиентский watchdog — 310 секунд. Тайм-аут загрузки изображения классифицируется отдельно от тайм-аута генерации модели.
- Обе кнопки доступны только Owner. Результаты тестовые: без изменения формы, AI proof, записи в Sanity/D1 и публикации. Основной Workers AI путь не изменяется.
- Изменены runtime-файлы: `functions/api/manager/plants/gemini-test.ts`, `functions/api/manager/plants/gemini-test-lib.ts`, `src/manager/PlantCatalogManager.tsx`; тесты: `tests/gemini-plant-ai.test.mjs`.
- PR #181 merged squash в `main`: merge commit `06583f5cbdcc5e7a35d696f052e5c091f8e76c03`; branch `feat/gemini-photo-text-streaming`.
- CI: Blog and Studio validation run #757 — success (lint, website utility tests, website build, migration syntax/dry-run, Sanity Studio build); Florial D1 migration validation run #892 — success (lint, website build, Pages Functions syntax, additive migration validation).
- Cloudflare Pages Production deployment `89324a26-7360-44cd-bf42-8c1688905861`, URL `https://89324a26.florial.pages.dev`; deployed commit matches merge commit `06583f5cbdcc5e7a35d696f052e5c091f8e76c03`. Stages queued, initialize, clone_repo, build and deploy all success; aliases `https://florial-bg.com` and `https://www.florial-bg.com` assigned.
- После фиксации релиза обновлены CHANGELOG, TECHNICAL_PASSPORT и MD2 rev60. Финальный docs-sync commit в main: `a72bbae328061730b5a6b1e3888a948950ecf037`; Cloudflare Pages deployment `e55f6549-0e2d-423f-8326-d6fde198c04b` завершился success, deployed commit совпадает с docs-sync commit, production aliases назначены.
- Owner live Gemini Photo and Gemini Text requests have not yet been performed after this deployment; functional AI acceptance remains pending user test.
- Не изменялись Sanity schema/documents/assets, D1 schema/data, Cloudflare secrets/settings, каталог оборудования, заказы, Header/menu/Footer и глобальная структура сайта.

## 2026-11-10 — Gemini plant AI test: safe provider diagnostics

- Диагностическое обновление отдельного Owner-only endpoint `POST /api/manager/plants/gemini-test`.
- При non-2xx ответе Google сервер извлекает только стабильный `error.status`, классифицирует ошибку и возвращает Manager: Florial error code, upstream HTTP status, provider status, request ID и безопасную подсказку на болгарском.
- Категории: invalid request/schema (400), authentication/permission (401/403), model/endpoint not found (404), quota (429), provider timeout (408/504), temporary provider outage (5xx), unknown provider error.
- Raw provider response body, API key, request headers и image bytes не передаются в клиент и не логируются.
- Без изменений: `gemini-3.8-flash`, prompt, response schema, input image validation, 120-second timeout, Owner-only authentication, same-origin guard, Workers AI primary path, Sanity/D1 data and schemas.
- Тесты классификатора добавлены в `tests/gemini-plant-ai.test.mjs`.
- PR #180; кодовый commit `b01bfd422ca8b97f586975b3165182cbaf955f51`.
- CI: Blog and Studio validation #740 — success (39 tests passed, lint, website build, migration dry-run, Sanity Studio build); Florial D1 migration validation #878 — success (lint, website build, Pages Functions syntax, additive migration validation).
- PR #180 merged squash в main: `4a26ddbb454b9c8e35b39f7d815ef1bfbff7950c`.
- Cloudflare Pages Production deployment `d25aad28-0a15-42d0-9ca9-6f5b394d280c`, URL `https://d25aad28.florial.pages.dev`, commit совпадает с merge commit; все стадии, включая deploy, завершились success.
- Авторизованный live Gemini request Owner остаётся pending. Внешняя HTTP smoke-проверка домена в этом сеансе не подтверждена.

## 2026-11-10 — Gemini plant AI test: Production deployment

- PR #178 merged squash to main: `ab63351def7a844f2337702c8515912e8f8724e4`; PR head `fd61e0db9c6596e17fb14f0f49fad3bf1c702323`.
- CI: Blog and Studio validation run #732 — success; Florial D1 migration validation run #868 — success.
- Cloudflare Pages project `florial`, Production deployment `2af39055-e508-491b-8670-fe2ed9ac827b`, URL `https://2af39055.florial.pages.dev`, deployed commit `ab63351def7a844f2337702c8515912e8f8724e4`; build and deploy stages success.
- Production smoke: homepage HTTP 200; Manager entry HTTP 200 and protected login shell with `noindex,nofollow,noarchive`.
- Production environment metadata confirms `GEMINI_API_KEY` exists as `secret_text`. Secret value is masked by Cloudflare and was not accessed or logged. Actual Google key validity, model entitlement/quota and a successful authenticated Gemini generation remain unverified until Owner runs the test from Manager.
- Runtime scope: `functions/api/manager/plants/gemini-test.ts`, `functions/api/manager/plants/gemini-test-lib.ts`, `functions/api/manager/_lib.ts`, `src/manager/PlantCatalogManager.tsx`, `tests/gemini-plant-ai.test.mjs`.
- Gemini remains a separate Owner-only, read-only test path. It does not write Sanity or D1, modify the current form, create AI proof or publish products. Existing Workers AI enrichment remains unchanged.
- No Sanity schema/documents/assets, D1 schema/data, checkout/orders, Header/menu/Footer or global layout were modified.
- Remaining acceptance: execute one authenticated Owner Gemini request on a real Sanity plants image; verify role restrictions; compare 10–15 images with Workers AI. Do not switch the primary AI button before Owner approval.

## 2026-11-10 — Подготовка изолированного теста Gemini для Manager растений

- Основа: main commit f29fba24ae8d9db7231d3a71a8dd5dc2d381cd5e; инструкция проекта — MD2 rev56.
- Модель: стабильный Gemini 3.8 Flash (gemini-3.8-flash) через Google Gemini Developer API REST endpoint. Серверная интеграция, API key только в Cloudflare Pages secret GEMINI_API_KEY.
- Новый route: functions/api/manager/plants/gemini-test.ts (POST /api/manager/plants/gemini-test); только role owner, authenticated Manager session и same-origin.
- Новый helper: functions/api/manager/plants/gemini-test-lib.ts; структурированный JSON response извлекается и нормализуется; category ID принимается только из фактического списка Sanity categories; латинские кандидаты не считаются подтверждённым scientificName.
- UI: src/manager/PlantCatalogManager.tsx показывает отдельную кнопку и результат. Не меняет поля формы, не выдаёт AI proof и не влияет на save/publish. Существующий Workers AI path остаётся неизменным.
- Input: одна выбранная фотография из Sanity CDN (bxvcy0qs/plants), MIME JPEG/PNG/WebP, максимум 10 MB; seller-entered fields and allowed category list.
- Model call: один запрос без автоматического retry; timeout 120 секунд; ограничение изображения 15 секунд; response schema JSON; no writes to Sanity or D1.
- Новый GEMINI_API_KEY добавлен только в тип ManagerEnv в коде. Cloudflare Production secret пока не настроен/не проверен. Не вставлять ключ в код, GitHub, frontend или журналы.
- Test coverage: Gemini candidate extraction, malformed/empty response, output normalization, category allowlist, product type fallback and Latin binomial validation.
- Результат тестов, CI, PR, deployment и live photo acceptance будут добавлены после фактического выполнения; до этого статус — prepared, not deployed.

## 2026-11-10 — Manager растений: обработка неопределённого визуального распознавания (PR #177)

- PR #177 объединён squash в main: `7b4bae535f17627530f06a0b72b907dc0faae61b`.
- Cloudflare Pages Production deployment: `b7eb0c58-9922-4e9f-8f60-2772c27d4de6`, URL `https://b7eb0c58.florial.pages.dev`; build/deploy success 2026-11-10 05:37:52 UTC; production aliases `florial-bg.com` и `www.florial-bg.com`.
- CI на исходном PR head: D1 migration validation #858 — success; Blog and Studio validation #726 — success. Cloudflare Pages build/deploy на итоговом merge commit также завершился success. GitHub Actions connector не предоставил отдельный run для поздних коммитов PR; это отмечено как ограничение проверки.
- Если Vision не вернул коммерческое имя, AI enrichment больше не прекращается только по этой причине. Используется временная метка «Растение за идентификация», а генерация продолжается в осторожном режиме без видоспецифичных утверждений.
- При неустановленной идентичности кандидаты из одного визуального предположения не используются для автоматического подтверждения научного имени через GBIF.
- Manager предупреждает продавца и блокирует сохранение до замены временной метки реальным названием растения.
- Runtime файлы: `functions/api/manager/plants/ai-enrich.ts`, `src/manager/PlantCatalogManager.tsx`.
- Обновлены `docs/TECHNICAL_PASSPORT.md`, `CHANGELOG.md`, создана актуальная инструкция rev56.
- Sanity documents/schema/assets, D1 data/schema, dataset `production`, checkout/orders, global Header/menu/Footer, Cloudflare settings/secrets не изменялись.
- Авторизованный live photo acceptance остаётся открытым: нужно проверить результат на реальной фотографии в Manager после деплоя.

- В AI enrichment устранён ранний отказ `AI_PLANT_IDENTITY_UNCLEAR`, который прерывал весь процесс, если Vision не возвращал коммерческое имя, даже при наличии полезного визуального описания/кандидатов.
- При отсутствии уверенного имени используется только временная метка «Растение за идентификация». Генерация продолжается в осторожном режиме: модель не должна выдавать вид и видоспецифичный уход как установленные факты.
- Ботанические кандидаты при неустановленной идентичности не отправляются на автоматическое подтверждение GBIF; научное имя не заполняется на основании одного неуверенного визуального предположения.
- Manager показывает предупреждение и требует заменить временную метку реальным названием перед сохранением. Публикация/сохранение с временной меткой блокируется.
- Изменены только `functions/api/manager/plants/ai-enrich.ts` и `src/manager/PlantCatalogManager.tsx`.
- Санити-документы, схемы и assets, D1, dataset `production`, заказы, общая структура сайта, Header/menu/Footer, Cloudflare settings/secrets не изменялись.
- CI workflows на PR head initial commit: D1 migration validation #858 — success; Blog and Studio validation #726 — success. Последние два комментарных/логических изменения после запуска workflow не были отдельно подтверждены отдельным workflow run на их SHA; требуется финальная проверка CI для итогового PR head до merge.
- Live authenticated photo acceptance не выполнена; реальный результат модели нужно проверить в Manager после production deployment.

## 2026-11-10 — Manager растений: надёжность AI и индикация ожидания (PR #175)

- PR #175 merged by squash: `d76cf69a315aac6c688732922b2539ed97445dcb`.
- Production Cloudflare Pages deployment: `97ac4255-c6ec-4fe2-876c-4bab2d6cacac`, URL `https://97ac4255.florial.pages.dev`; build and deploy success at 2026-11-10 05:22:31 UTC; aliases `https://florial-bg.com` and `https://www.florial-bg.com`.
- CI: Blog and Studio validation #724 success; Florial D1 migration validation #854 success. Website lint, utility tests, website build, Pages Functions syntax, read-only migration dry-run and Sanity Studio build passed.
- Изменены только `src/manager/PlantCatalogManager.tsx` и `functions/api/manager/plants/ai-enrich.ts`.
- Workers AI vision and text model per-call timeout increased from 20 to 45 seconds; one bounded retry remains. Sanity image fetch increased 10→15 seconds; GBIF lookup 8→10 seconds; browser request timeout 150→300 seconds. Aborted browser requests are not retried.
- Manager now displays a compact elapsed-time counter and progress bar next to the photo AI button. The bar estimates elapsed request time and explicitly does not claim to represent the model's actual completion percentage.
- Failed AI responses now expose actionable Bulgarian messages, error code, processing stage and request ID. Vision timeout is distinguished from an inconclusive plant identification; text-generation timeout and invalid model JSON have separate messages.
- The earlier user-visible generic failures were consistent with the 20-second per-call cap being too aggressive for a multi-stage request (photo vision, optional botanical candidate lookup, three-language content generation and possible quality retry). Per-request runtime details for the user's earlier attempts were not present in retained telemetry, so the exact underlying provider error remains unconfirmed.
- No Sanity records/schema, D1 schema/data, irrigation catalogue, checkout/orders, global header/menu/footer, or Cloudflare settings/secrets changed.
- Authenticated live acceptance with a new plant photo is still pending. Owner/seller should retry after deployment and report the request ID if an error remains.

## 2026-11-10 — Manager растений: PR #173 опубликован в Production

- PR #173 merged by squash: `87048514d0ee5f73980b8ddf450ae0358bd76812`.
- Изменены только:
  - `src/manager/PlantCatalogManager.tsx`
  - `functions/api/manager/plants/ai-enrich.ts`
  - `functions/api/manager/plant-direct-lib.ts`
  - `functions/api/manager/plants.ts`
  - `functions/api/manager/plants/[id].ts`
- Production Cloudflare Pages deployment: `445cf59b-f019-471f-b567-d0758bf0b15e`, URL `https://445cf59b.florial.pages.dev`, build/deploy success 2026-11-10 05:04:16 UTC; aliases `https://florial-bg.com` and `https://www.florial-bg.com` assigned.
- CI on latest PR head: Blog and Studio validation #721 success (lint, utility tests, website build, Pages Functions syntax, migration dry-run, Sanity Studio build); Florial D1 migration validation #849 success.
- AI button `Попълни с ИИ` moved to the plant image area and becomes available after a main photo is added. A seller-entered name is no longer required.
- Cloudflare Vision model `@cf/meta/llama-3.2-11b-vision-instruct` now proposes a Bulgarian common name, likely botanical candidates, an allowed `productType`, and a category selected only from actual category IDs supplied by Manager. Low/medium visual confidence is explicitly warned; the seller can correct the name, type and category after AI completion.
- `scientificName` remains conservative: it is automatically populated only after an exact accepted GBIF species match with the existing high-confidence rules. A visual suggestion by itself is not scientific confirmation.
- The AI completion proof is HMAC-signed with the authenticated HttpOnly Manager session and bound to the selected main-image asset. It is valid for two hours. Create and edit APIs reject a save without a valid proof; changing the main image requires a new AI run. Manual correction of the suggested name/type/category after AI does not invalidate the proof.
- AI request waits are bounded: model calls 20 seconds each with one server retry, image fetch 10 seconds, GBIF lookup 8 seconds, browser request 150 seconds. The browser no longer repeats a full server AI timeout response; it shows a clear error instead of spinning indefinitely.
- Save/publish is enabled only after a successful AI run and at least one real size is entered (positive sale height or container volume). The same size requirement is checked by the server for both create and edit.
- On explicit save only, root legacy `priceEUR` is set to the minimum current `saleVariants[].priceEUR`; root `oldPriceEUR` is set to the minimum populated `saleVariants[].oldPriceEUR`, or null when no variant has an old price. Variant prices remain canonical for storefront/cart/order. Root `stockQuantity` is not aggregated or changed. No mass migration or existing Sanity document update was performed.
- No Sanity schema/documents/assets, D1 schema/data, irrigation dataset, checkout/orders, global header/menu/footer, or Cloudflare settings/secrets were changed.
- Manual authenticated end-to-end acceptance of a fresh plant photo by a seller/Owner is still pending. CI and production deployment are confirmed; a live Manager session test is required to confirm the model's real response for a sample photo.

## 2026-11-10 — Manager растений: PR #172 опубликован в Production

- PR #172 merged by squash: 6b10b44f999f2dbf40a46e447bbd9c1175a9756d.
- Runtime: functions/api/manager/plants/ai-enrich.ts, src/manager/PlantCatalogManager.tsx.
- AI plant enrichment восстановлен: развёрнутые BG/RU/EN описания, локальное SEO, practical care sections, ALT основной фотографии на трёх языках.
- Botanical identity: AI формирует кандидатов только из seller-entered данных; автоматическая запись scientificName разрешена только при confidence=high и GBIF exact accepted species match (EXACT, SPECIES, ACCEPTED, confidence >=95). Фотографии не используются для определения вида.
- Owner-only fields: AI возвращает plantCare/careGuide только Owner; форма Owner позволяет просмотреть и изменить эти данные. Manager/Seller не получают эти поля.
- Надёжность: серверный retry для transient/invalid model responses, quality retry для коротких описаний, одна клиентская повторная попытка для retryable ошибок; непустые ручные поля не перезаписываются.
- CI: Blog and Studio validation #714 success; Florial D1 migration validation #840 success.
- Production Pages deployment: bcca7c97-928f-4db5-a5e8-001314d23502, https://bcca7c97.florial.pages.dev, commit 6b10b44f999f2dbf40a46e447bbd9c1175a9756d; build/deploy success 2026-11-10 04:18:56 UTC. Production aliases active.
- No Sanity documents/schema/assets, D1 schema/data, irrigation dataset production, checkout/orders, global layout or Cloudflare settings/secrets changed. No live AI-generated Sanity write was performed.
- Manual authenticated AI acceptance (Owner/Manager) remains pending. Existing published «Лавровишня храсти» was inspected but not modified; its existing populated content is preserved by the fill-empty-only merge.

## 2026-11-10 — Manager растений: PR #171 опубликован в Production

- PR #171 merged by squash at `40b695821736b6499e58140337e8169d71f14279`.
- CI success: Florial D1 migration validation run #831; Blog and Studio validation run #707. Website lint, utility tests, build, Pages Functions syntax, migration regression checks and Sanity Studio build passed.
- Cloudflare Pages Production deployment `ef7e07a9-09b3-4b9a-948d-0454ff05dbc5` for commit `40b695821736b6499e58140337e8169d71f14279`: build/deploy success at 2026-11-10 03:37:28 UTC. Domains `florial-bg.com` and `www.florial-bg.com` are active.
- Owner retains ALT, SKU/variant SKU, slug, translations and SEO fields. Manager/Seller use simplified form. Terminal categories only. Variant names auto-generate from height ±5% and container litres. New slugs are checked against published and draft plant documents, with numeric suffixes for collisions. AI fills blank BG/RU/EN descriptions, localized SEO and main-image ALT while preserving non-empty manual values.
- Runtime files: `src/manager/PlantCatalogManager.tsx`, `functions/api/manager/plants.ts`, `functions/api/manager/plants/[id].ts`, `functions/api/manager/plants/ai-enrich.ts`.
- No Sanity documents/schema/assets, D1 schema/data, irrigation dataset `production`, checkout/orders, Header/menu/Footer, Cloudflare settings or secrets were modified. No live Sanity write operations were performed.
- Remaining acceptance: authenticated Owner/Manager UI testing; Seller profile was not present in the last D1 audit. No test products were created.


- Role visibility: Owner retains ALT, SKU/variant SKU, slug, translations and SEO fields. Manager/Seller see the simplified workflow: image upload/library, plant identity, terminal categories, sale sizes/prices/stock, BG short and full descriptions, and the AI enrichment action.
- Category selector now lists only terminal categories (categories without child categories); parent grouping nodes are hidden. The save payload keeps only selected terminal category IDs.
- Variant auto-name: if the name is blank/auto-generated, height generates `Размер {round(0.95*h)}–{round(1.05*h)} см`; container volume appends `C{litres}`. The auto-name follows subsequent dimension edits until a staff member manually edits the name. The UI-only auto-name marker is not sent to Sanity.
- New product slug is generated from the plant name and checked against published product slugs in Sanity dataset `plants`; collisions use numeric suffixes. Existing slugs remain unchanged during edits unless Owner explicitly edits the slug.
- AI enrichment response now includes main-image ALT in BG/RU/EN and SEO H1/metaTitle/metaDescription in BG/RU/EN. When model SEO fields are absent, localized safe fallback values are produced. UI fills blank fields only and preserves already populated manual values.
- Runtime files touched on feature branch: `src/manager/PlantCatalogManager.tsx`, `functions/api/manager/plants.ts`, `functions/api/manager/plants/[id].ts`, `functions/api/manager/plants/ai-enrich.ts`.
- No Sanity documents/schema/assets, D1 schema/data, irrigation dataset `production`, checkout/orders, Header/menu/Footer, Cloudflare settings or secrets were modified.
- No live Sanity write operations were performed. CI, merge, Pages deployment and authenticated Owner/Manager/Seller acceptance remain pending.

## 2026-11-10 — Current runtime status after PR #170 rollout

- PR #170 merged into main at commit 24c90b929692fa6b7a306caf31a31803128ab203.
- Production Cloudflare D1 florial-db (UUID 5fbb0e47-8439-493c-821a-6945eef7d8b2, EU) now has additive migration 0013_manager_product_audit. Verified schema_migrations row, audit table and append-only UPDATE/DELETE triggers. Migration did not alter or delete pre-existing application records/tables.
- Cloudflare Pages production deployment 832b9bbc-2777-4b48-96ed-5af252591a06 for merge commit 24c90b929692fa6b7a306caf31a31803128ab203 completed build and deploy successfully at 2026-11-10 02:33 UTC. Domains florial-bg.com and www.florial-bg.com report active.
- Direct plant Manager implementation is deployed. Direct APIs and UI are scoped to Sanity dataset plants. Irrigation dataset production and Sanity content/schema/assets were not modified.
- Both pre-merge GitHub workflows passed on PR head 741ac6bffca48406fe6eaf28d64d87ee944bacd7, including website lint/build, Pages Functions syntax, SQLite migration regression test and Sanity Studio build.
- Remaining acceptance: authenticated Owner and Manager CRUD test in browser/mobile; Seller role test cannot be performed until a Seller profile exists (none was found in live D1); validate AI enrichment and image upload on a test plant document with explicit user-approved test data. Do not create/modify Sanity documents without approval.
- Production deployment success is not equivalent to end-to-end authenticated runtime acceptance. Pages Preview deployments are disabled.

## Точное подтверждение Cloudflare Pages deployments

- Commit `fb1d440251415fc31acfa31b216e82968aa2928c` → Production deployment `4d48f564-8845-4912-bbb3-723cebaebbc7`, status `success`, 2026-11-09 20:01 UTC.
- Commit `52f7192b4a1cbe37359f56de72e300e8fc1f7823` → Production deployment `0f1d33bb-739d-4758-9cb7-edb5a972ede1`, status `success`, 2026-11-09 20:06 UTC.
- Оба commit изменяли только пока не подключённый `src/manager/PlantCatalogManager.tsx`; `src/manager/ManagerApp.tsx` в main не импортировал его.
- Preview deployments для соответствующих feature branches были skipped с `preview_deployments_disabled`.

## 2026-11-09 — final CI result for plant Manager implementation

- Code commit `d53ba337c855e906873a1a7e27276e575e07559c` passed both GitHub workflows:
  - Blog & Studio validation: success — website lint, utility tests, website build, migration syntax/dry-run, Sanity Studio install/build.
  - Florial D1 migration validation: success — lint, website build, Pages Functions syntax, SQLite migration 0013 test.
- Later commit `b29803843eee4e2ded9e82705fad9320e5147718` contains documentation updates only; runtime code is unchanged from the fully validated code commit.
- CI does not validate live Sanity writes or live D1 migration; no Production data was changed.
- Preview deployment remains disabled and mobile acceptance remains open.

## Дополнение 2026-11-09 — UI media и AI ALT

- Редактор поддерживает выбор существующих Sanity assets через `PlantImageLibrary` и загрузку новых фотографий; обе операции доступны Owner/Manager/Seller.
- Поддерживается множественный выбор категорий и подкатегорий; основная категория задаётся отдельно, все ссылки сохраняются.
- При обычном редактировании неизменённый Portable Text сохраняет исходное форматирование; при ручном изменении текста он преобразуется в обычный Portable Text блок.
- AI использует Workers AI text model для описаний/переводов/SEO и Vision model для визуального ALT только основной фотографии. Остальные фотографии получают ALT вручную. Vision не определяет вид растения и не генерирует биологические свойства.
- Live D1 migration не применялась; изменения остаются в Draft PR #170.

## 2026-11-09 — PR #170 validation and deployment audit

- GitHub Actions at `495b873856202d9ab19e31d765bbe351dd66e16e`: Blog & Studio validation success; D1 migration validation success. Lint, website tests/build, Pages Functions syntax, SQLite migration test and Studio build passed.
- SQL test ran in isolated SQLite memory DB only. Live Cloudflare D1 `0013_manager_product_audit` remains unapplied.
- Pages Preview for PR branch is skipped because `preview_deployments_disabled`; no real preview/mobile acceptance.
- Two main commits `fb1d440251415fc31acfa31b216e82968aa2928c` and `52f7192b4a1cbe37359f56de72e300e8fc1f7823` changed only the currently unconnected `PlantCatalogManager.tsx` component. Both Pages Production deployments completed successfully; main `ManagerApp.tsx` does not import it, so the Manager UI/public behavior did not change. Full integration remains in Draft PR #170.
- Pages project still contains legacy environment variable names `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`. New code does not read them; they were not modified. Separate runtime usage audit is required before removal.
- No Seller profile found in live D1; Seller-session QA remains pending.

## 2026-11-09 — Manager растений: первая реализация в Draft PR #169

- В отдельной mainline-based feature branch подготовлен новый mobile-first Manager для dataset Sanity `plants`.
- Новые Pages Functions: `GET/POST /api/manager/plants`, `GET/PATCH /api/manager/plants/:id`, `POST /api/manager/plants/ai-enrich`, Owner-only `GET /api/manager/plant-audit`; общие функции — `plant-direct-lib.ts`.
- UI: `src/manager/PlantCatalogManager.tsx`; ManagerApp направляет все три роли в каталог, старый submissions workflow оставлен Owner-only архивом.
- Owner/Manager/Seller используют существующую D1 cookie session. Роли берутся из D1 profile; новая система не создаёт параллельную авторизацию.
- Sanity mutations ограничены dataset `plants`; создание idempotent, PATCH использует `ifRevisionID`; root legacy price/stockQuantity автоматически не переписываются.
- AI заполняет текст/переводы/SEO, не создаёт цены, SKU, варианты, остатки или ботанические сведения.
- Добавлена аддитивная SQL migration `0013_manager_product_audit` и SQLite regression test. Live D1 на момент read-only аудита остановлена на `0012_service_leads_manager`; migration 0013 не применялась.
- В live D1 обнаружены 1 активный Owner и 1 активный Manager; Seller profile не обнаружен. Реальные профили и данные не менялись.
- CI для PR #169 выполняется; Preview deployment настройкой Pages помечен как отключённый. Production rollout не выполнялся.
- Не затронуты Sanity schema/documents/assets, orders/checkout, irrigation dataset `production`, Header/menu/Footer, staff permissions, Cloudflare secrets/settings.

## 2026-11-09 — завершён read-only аудит цены/наличия растений

- `CategoryPage.tsx`: цена карточки растения — минимальная положительная `saleVariants[].priceEUR`; root price не используется. Наличие сначала берётся из root `stockStatus` (inStock/onRequest), затем из вариантов.
- `ProductPage.tsx`: цена и скидка выбранного размера берутся из варианта; статус/количество — вариант с root fallback.
- `CartPage.tsx`: цена варианта приоритетна, root price — fallback.
- `functions/api/orders.ts`: для plants обязателен `variantKey`; сервер проверяет цену по `saleVariants[].priceEUR`, отклоняет `outOfStock`, допускает `onRequest` с положительной ценой; фактический `stockQuantity` сейчас не проверяется. Order items сохраняют snapshot.
- `functions/api/manager/order-products.ts`: варианты растений выдаются отдельными selectable позициями; цена/наличие берутся из saleVariant.
- Спецификация уточнена: variant price — canonical; root price не синхронизировать автоматически; root stockStatus должен быть агрегатом для согласованности CategoryPage, но root stockQuantity не суммировать; mixed status в Manager list показывать отдельно.
- Дробный stockQuantity для растений не подтверждён; заказное количество integer 1–999.
- Это read-only аудит; runtime, Sanity, D1 и Production не менялись.

## 2026-11-09 — спецификация прямого управления каталогом растений (документационный этап)

- Подготовлена `docs/ROADMAP_MANAGER_PLANTS.md` для нового мобильного plant manager.
- Область строго ограничена Sanity dataset `plants`; dataset `production` и оборудование не входят в задачу.
- Решения владельца: Owner/Manager/Seller могут создавать, редактировать любые растения и публиковать напрямую; история доступна только Owner; общий AI доступен всем; botanical care fields и отдельная ботаническая проверка — Owner-only.
- Проверены GitHub main commit `4bfd00b436fbca81b239fe12edb98e6823973571`, MD2 rev49, Manager components/API, D1 migrations и deployed Sanity schema `product` / `plantSaleVariant`.
- Read-only Sanity snapshot на момент аудита: 36 опубликованных `product` документов и 17 опубликованных `category` документов в `plants`.
- Существующая схема уже поддерживает `saleVariants` до 30 позиций; первый этап не предполагает изменения схемы и массовой миграции документов.
- Выявлено расхождение root `priceEUR` и `saleVariants[].priceEUR` в части старых карточек. До реализации direct PATCH требуется проверить storefront/cart/order canonical price и legacy fallback.
- Предлагается additive D1 audit table `manager_product_audit`, append-only intent/result events, Owner-only read API и direct Sanity create/patch с idempotency + `ifRevisionID`.
- **Это только спецификация.** На этом этапе не изменялись runtime-код, Sanity documents/schema, D1 schema/data, Cloudflare settings/secrets, staff profiles, submissions, orders или Production deployment.
- Новая roadmap находится в отдельной документационной ветке; не считать функции реализованными до отдельного PR/CI/merge/deployment и ручной приёмки.

## 2026-11-09 — performance pause: rollback CLS-only changes (PR #163 merged)

- User-approved scope: restore the route layout and SEO fallback image behavior that preceded the two latest CLS-specific runtime changes; preserve all earlier performance improvements and all intervening business/Manager work.
- Planned code scope: `src/App.tsx` (remove the PR #156 conditional min-height wrapper), `functions/_middleware.ts` (restore original SEO fallback image markup), delete `functions/lib/sanityImageDimensions.ts` and `tests/sanity-image-dimensions.test.mjs`.
- Preserved: PR #148–#152 responsive images, Sanity public CDN split, lazy routes and Hero LCP; PR #161 Manager Owner/Seller submission fix; all catalog, service, SEO, cart, checkout and order logic.
- No data/schema/API/D1/Sanity/Cloudflare settings writes; no Header/menu/Footer component changes.
- PR #163 merged squash: `a12068bc3a8a4707f70e19abc76ecf382d98eabe`. GitHub Actions D1 validation run `42652345312` and Blog/Studio validation run `42652345147` — success; website lint/tests/build, Pages Functions syntax, migration syntax/read-only dry-run and Sanity Studio build passed.
- Cloudflare Pages Production deployment `6cab6c9b-7490-4b1e-8bb2-57fcc9c53070` — build success, deploy success; aliases `florial-bg.com` and `www.florial-bg.com`.
- Browser Rendering returned the homepage HTML and expected root/title/Vite asset markers. Further route requests were rate-limited with HTTP 429; full browser route regression remains unconfirmed. No new CLS/Lighthouse/INP measurements were performed.
- After release, perform smoke checks only; no new CLS/Lighthouse/INP values are claimed. Performance optimization remains paused until separately authorized.

---

## 2026-11-09 — Manager plant submission status fix (PR #161)

- Root cause: `functions/api/manager/data.ts` allowed `submitted` for Seller and Manager-with-create permission, but omitted it from the Owner branch. Owner's valid `draft → submitted` request therefore returned `Invalid status transition`.
- Added `canSetCatalogSubmissionStatus` to `functions/api/manager/_lib.ts` and routed the D1 Manager endpoint through this helper.
- Owner can submit own plant draft. Seller can submit only own draft; Seller still cannot review, approve, reject or publish. Manager review/approval continue to require their individual permission flags.
- Added six tests in `tests/catalog-submission-status.test.mjs` for Owner, Seller, Manager and protected publication statuses.
- PR #161 merged squash: `3f8a363ee60b6355209c36d821d50ab80267d806`.
- CI: Blog and Studio validation run `42649059860` — success; D1 migration validation run `42649059911` — success. All 34 tests passed; lint, website build, Pages Functions syntax, read-only migration dry-run, Sanity Studio build and D1 migration validation passed.
- Cloudflare Pages Production deployment `35abbc66-d88a-4492-8783-87f827642441` — success; aliases `florial-bg.com` and `www.florial-bg.com`. First deployment attempt `b60516f3-3980-403e-b499-37c13f60360d` failed transiently during Function publish with `Unknown internal error occurred`; Cloudflare retry succeeded.
- No D1 migrations or data writes; no Sanity changes; no changes to staff profiles, submissions, events, orders, Header, menu, Footer or checkout.
- Authenticated Owner/Seller browser submission was not performed. Unit coverage confirms the role/status helper; no test Production submissions were created.

---

## 2026-11-09 — PR #156: reserve shared route content height and post-release CLS verification

- PR #156 merged into `main`: merge commit `70335b7064e6c61c9d53b4c3f3769fd91c8f5ee2`; changed only `src/App.tsx` (+8 lines).
- Added `shouldReserveRouteContentHeight` for category, product, service-detail, search and blog routes; the existing Suspense boundary now sits inside a shared `flex-grow min-h-screen` content wrapper for those routes. This keeps the Footer outside the initial viewport while route chunks/data resolve.
- Header, menu, Footer component, individual page components, page content, routes, SEO, product/cart/checkout/order/Manager logic, Sanity documents/schemas, D1, APIs, Cloudflare settings/rules/secrets and environment variables were not changed.
- CI passed: Florial D1 migration validation and Blog and Studio validation. Website lint/build, Pages Functions syntax, utilities tests, D1 read-only dry-run and Sanity Studio build all succeeded.
- Production deployment `5658ac34-ce79-440a-ac9b-57262ef13ba3` from `main` commit `70335b7064e6c61c9d53b4c3f3769fd91c8f5ee2` succeeded and owns aliases `florial-bg.com` and `www.florial-bg.com`.
- Controlled mobile CLS retest (390×844, CPU 4×, 150 ms, 10/1.5 Mbps, cache disabled, 3 runs): homepage median `0.0002`; irrigation category `0.3441`; product `0.0002`; blog `0.0002`; article `0.0143`. Before PR #156: `0.0002`, `1.0443`, `0.7005`, `0.6124`, `0.7805` respectively. Footer-driven shifts on product/blog/article are effectively eliminated; category improved by about 67%, but retains a separate `0.34385` shift in two of three runs whose source node is not exposed by the browser Performance API. Do not claim category CLS is fixed.
- Post-release smoke: all tested routes returned HTTP 200; zero failed images. Category plants 29/28 responsive srcsets; search 45/44; planting service 9/8; about 8/7; contacts 3/0; cart 1/0; irrigation category 32/31; product 4/3; blog 23/22; article 5/4. SPA category → product → Back → Forward navigation succeeded.
- Short pages `/about`, `/contacts`, `/cart` do not receive the `min-h-screen` route wrapper; the wrapper applies only to dynamic/long routes. Their page content and route rendering remain intact.
- Remaining: investigate category-specific CLS residual; repeat desktop CLS/INP and Lighthouse/field CrUX when available. This PR does not claim overall site speed or Core Web Vitals are fully optimized.

---
## 2026-11-09 — Controlled route CLS audit and stale-base deployment root cause

- Repeated controlled mobile route CLS capture on current Production (`390×844`, CPU 4×, 150 ms latency, 10 Mbps down / 1.5 Mbps up, browser cache disabled; 3 runs per route). Session-window grouping: 1-second gap, 5-second maximum window.
- Median session CLS: homepage `0.0002`; irrigation category `/category/vsichko-za-polivane` `1.0443`; product `/product/musa-banana` `0.7005`; blog `/blog` `0.6124`; article `/blog/montazh-podmyana-remont-razpruskvachi-nesebar` `0.7805`. Values reproduced in all three runs per route in this lab browser. These are lab measurements, not field CrUX data.
- The dominant layout-shift source is the `FOOTER` element on category, product, blog and article routes. Category also has an earlier shift from unidentified nodes. The repeated pattern is consistent with short route loading placeholders being replaced by full asynchronous page content in `src/App.tsx`, causing the Footer to move. Do not edit Footer.
- Confirmed the earlier Pages alias mismatch was caused by stale-base commits being deployed from `main`: commit `51ef6b56...` (MD2 rev35) has parent `612b4713...` and its tree predates PR #148–#152; commit `6a4eea12...` (MD2 rev41) has parent `2f35bf31...` and predates PR #152. Their successful Pages builds served older runtime bundles. This was not a browser cache issue.
- Current main chain is `a88ce6ca...` (PR #152 runtime) → `859dfb10...` (MD2 rev42) → `81114ccd...` (PR #154 documentation recovery). Current Production deployment `28d3d2c0-6046-4c75-8a2c-723b4e89c9eb` is successful and aliases `florial-bg.com` and `www.florial-bg.com`; it serves `index-DFmXNYJ3.js` with the correct PR #148–#152 runtime.
- No application code, Sanity documents/schemas, D1 data, order APIs, Manager, Header/menu/Footer, Cloudflare cache rules/settings/secrets or environment variables were changed during this CLS audit. The shared loading-area fix in `src/App.tsx` requires explicit user approval under MD2 rev42.
- Detailed report: `docs/performance/POST_OPTIMIZATION_ROUTE_CLS_2026-11-09.md`.

---
## 2026-11-09 — Production deployment recovery after Pages alias mismatch

- Audit found that `florial-bg.com` was serving deployment `2ea7f7f0-3340-4cea-b64d-0bd5e20c7fb2` from commit `51ef6b56f475232275dceb0a5ad94310cee9d768`, whose published bundle was the older `index-DVSEkUpQ.js` (742,368 B). The correct build from current `main` commit `859dfb10c75108d9a4609de424b420fa622bac68` was already available as deployment `146a68ed-b69b-46c8-b470-ff58ba1ae201` but did not hold the production aliases.
- Compared deployment assets: the correct deployment serves `index-DFmXNYJ3.js` (357,247 B), containing route-level chunks, responsive image helper widths including 160w/240w and the PR #152 Hero image implementation.
- Used the Cloudflare Pages deployment rollback operation to restore deployment `146a68ed-b69b-46c8-b470-ff58ba1ae201` to production. Rollback completed successfully; aliases now include `https://florial-bg.com` and `https://www.florial-bg.com`.
- Production smoke at 390×844: `/`, `/category/rastenia`, `/category/vsichko-za-polivane`, `/product/musa-banana`, `/search?q=контролер`, `/blog`, `/blog/montazh-podmyana-remont-razpruskvachi-nesebar`, `/services/zasazhdane-na-rasteniya` all HTTP 200.
- Responsive image checks: homepage 23 images/22 srcsets; plant category 29/28; irrigation category 32/31; product detail 4/3; search 45/44; blog 23/22; article 5/4; planting service 9/8. Zero failed images and zero browser JavaScript page errors. Homepage Hero has an eager high-priority Sanity image.
- No application source files, Sanity documents/schemas, D1 data, order APIs, Manager, Header/menu/Footer, Cloudflare settings, cache rules, secrets or environment variables were changed. Only the existing Pages deployment alias was rolled back to a previously successful build.
- Remaining: investigate why the later deployment from commit `51ef6...` produced an older runtime bundle; repeat controlled CLS capture on internal routes. The proposed shared loading-area change in `src/App.tsx` remains blocked pending explicit user approval under MD2 rev42. No shared layout or Footer changes made.

---
## 2026-11-09 — PR #152: homepage Hero LCP

### Production
- Runtime main commit after PR #152: `a88ce6ca513abcad4b7ee107c441fa62ec570ec3`.
- PR: [#152](https://github.com/omaraandrey-dev/florial/pull/152).
- Production deployment: `6cad50d7-291a-4004-ae15-b77786f3d292` — success.

### Hero image implementation
- Only `src/pages/HomePage.tsx` changed.
- Previous LCP element was a CSS background PNG from Sanity, 1518×957, response size 2,704,931 B.
- Replaced with a decorative `img` using `getSanityImageProps`; `srcSet`, `sizes=100vw`, intrinsic dimensions, `fit=max`, `auto=format`, `q=75`.
- Attributes: `loading=eager`, `fetchPriority=high`, `decoding=async`.
- Preserved centered cover crop, same overlay `rgba(247, 248, 241, 0.68)`, Hero section dimensions, text and buttons. No preload added.

### Controlled LCP results
- Mobile 390×844, CPU 4×, latency 150 ms, download 10 Mbps, upload 1.5 Mbps, browser cache disabled, 3 runs:
  - LCP median 3,620 → 696 ms (−80.8%).
  - Hero response 2,704,931 → 17,439 B (−99.4%); browser selected 480w AVIF.
  - FCP 404 → 408 ms; DCL 481 → 484 ms; load 482 → 486 ms.
  - CLS 0.00025 before and after.
- Desktop 1440×900, same CPU/network profile, 3 runs:
  - LCP median 3,908 → 912 ms (−76.7%).
  - Hero response 2,704,931 → 141,597 B (−94.8%); browser selected 1518w AVIF.
  - CLS 0.01417 before and after.
- Full report: `docs/performance/POST_OPTIMIZATION_HERO_LCP_2026-11-09.md`.

### Additional CLS finding — no change applied
- Homepage CLS remains low (0.00025 mobile, 0.01417 desktop).
- Other route samples show large layout shifts while asynchronous content replaces short loading states: category `/category/vsichko-za-polivane` session-window CLS ~1.044; raw shift-entry sums for blog/product/article samples ~0.612/0.700/0.784.
- Layout-shift source inspection on category/blog shows the Footer moving from within the viewport to below the fold as page content expands. `src/App.tsx` renders short loading placeholders while route data is fetched; this is the likely shared cause, but the fix is not yet validated.
- Potential fix: reserve a stable minimum height for the shared main-content/loading area or use route-shaped skeletons. This changes shared layout behavior in `src/App.tsx`; no change was made. Explicit user approval is required. Footer component itself must remain untouched unless separately approved.
- Search smoke `/search?q=контролер`: 44 products, 45 images, 44 responsive sets, 0 failed images.

### CI and scope
- Website/Studio validation `42604050648` — success; D1 validation `42604050707` — success.
- No Header/menu/Footer, cart/checkout, Manager, Sanity data/schema, D1 data, API/order logic or Cloudflare settings changed.
- Header logo remains a 1547×581 PNG (~656 KB); it is a separate candidate and was not changed.

---

## 2026-11-09 — PR #148–#150: responsive Sanity images, CDN split and catalog image delivery

### Main and Production
- Runtime main commit after PR #150: `2f35bf3151f68ecb64288ba861b97b084d21b1c9`.
- PR #148 merge `0b72d45021230e7d286b42dfb116acd6ca47ee80`; Production deployment `113205bf-630b-4586-a873-223dac8a9140` — success.
- PR #149 merge `606d7c8c26daee641a1890a786b54b1decda5340`; Production deployment `6b84da59-f2a8-4d8b-90a1-ed415d2272b9` — success.
- PR #150 merge `2f35bf3151f68ecb64288ba861b97b084d21b1c9`; Production deployment `100ac60e-28b9-4da3-8dc1-7197743844c4` — success; production aliases `florial-bg.com`, `www.florial-bg.com`.

### Responsive image architecture
- New shared helper: `src/lib/sanityImage.ts`.
- Sanity images receive width candidates 160, 240, 320, 480, 640, 800, 960, 1200 and 1600; helper returns `src`, `srcSet`, `sizes`, intrinsic width/height when encoded in Sanity asset ID, and uses `fit=max`, `auto=format`, `q=75`.
- Applied to HomePage cards, BlogSection, BlogPage, BlogPostPage/Portable Text, ServicePage, AboutPage, CategoryPage, ProductPage and public product search results.
- Category grid keeps first four product cards eager and lazy-loads remaining cards. Product detail main image remains eager; offscreen related/gallery images use lazy loading where appropriate.
- Header logo and homepage CSS Hero background remain unchanged. Header/menu/Footer layout not modified. Header logo requires separate approval before any optimization.
- No image assets, Sanity documents or schemas were written or deleted.

### Sanity clients and data freshness
- `sanityClient`: dataset `production`, `useCdn: true`, `perspective: 'published'`.
- `publicPlantsClient`: dataset `plants`, `useCdn: true`, `perspective: 'published'`; used for public plant category content.
- `sanityLiveClient`: dataset `production`, `useCdn: false`, `perspective: 'published'`; used for product prices/stock, equipment search/details/recommended product and delivery tariffs.
- `plantsClient`: dataset `plants`, `useCdn: false`; remains live for plant products, variants/search and Manager plant-category reads.
- `functions/api/orders.ts` continues validating orders against live server-side data. Manager writes and API logic were not changed.
- Read-only validation with API version `2024-01-01` and `perspective=published` returned matching results from `api.sanity.io` and `apicdn.sanity.io`. Observed CDN policy: 60-second cache with stale-while-revalidate 15 seconds. Repeated simple query cache hits: about 10–12 ms; direct API sample: about 116–140 ms. These are query samples, not full-page timing results.

### Cloudflare cache audit
- Fingerprinted JS/CSS return `cf-cache-status: HIT` and `Cache-Control: public, max-age=31536000, immutable`. Brotli, HTTP/2 and HTTP/3 are enabled.
- HTML responses return `cf-cache-status: DYNAMIC` with `Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=600`; repeated requests did not produce an edge HIT.
- No custom Cache Rules entrypoint or Page Rules found. Zone defaults observed: cache level aggressive, edge TTL 7200 s, browser TTL 14400 s, Development Mode off.
- No Cloudflare settings, rules, secrets or bindings changed. HTML edge caching requires a separate, scoped design and approval; exclude Manager, APIs, cart, checkout, orders and personalized routes.

### Controlled category result and regression
- Report: `docs/performance/POST_OPTIMIZATION_CDN_AND_IMAGES_2026-11-09.md`.
- Route `/category/rastenia`, 390×844, CPU 4×, 150 ms latency, 10 Mbps down / 1.5 Mbps up, browser cache disabled, three runs. Median FCP 428→408 ms, DCL 575→562 ms, load event 691→691 ms.
- Captured initial image responses decreased from approximately 17.9 MB to 1,081,732 B (about 94% lower). Post DOM has 29 images, 28 responsive srcsets; 17 images loaded initially; after scroll all 29 loaded; no failed images.
- Mobile SPA test: Home → Services → planting service; Back/Forward and scroll restoration within 20 px. No JS page errors. Product detail `/product/musa-banana`: H1/title correct, four images, three responsive sets, no failed images.
- CI for PRs #148–#150 passed: website lint, utility tests, build, migration syntax/read-only dry-run, Studio build and D1 validation. Run IDs recorded in CHANGELOG.

### Remaining
- Lighthouse/CrUX, LCP, INP and CLS remain unmeasured. Hero LCP identification is pending.
- Header logo remains a large 1547×581 PNG (~656 KB); no Header change made.
- Public HTML edge caching remains unimplemented. Continue controlled measurements on homepage, equipment category, product, search, blog and article before further infrastructure changes.

---

## 2026-11-09 — PR #147: lazy loading public route components

- PR #147 merged squash: `b35b5e499700d0330a7ea43ca1ca09e4f6cad7e8`; Production deployment `20836dfd-7536-4379-be50-2c865800c814` success; aliases florial-bg.com and www.florial-bg.com.
- Only runtime file changed: `src/App.tsx`.
- HomePage remains eager. Ten non-home pages now load via React.lazy dynamic imports: About, Cart, Contacts, Services list/detail, Category, Product, Blog list/article, IrrigationSupport. One Suspense boundary wraps route content; Header/Footer stay outside.
- Existing route predicates, state, callbacks, page props, data loading and page-local SEO remain unchanged.
- CI run `42592562970` success: lint, utility tests, site build, migration syntax/dry-run, Studio install/build. D1 run `42592563158` success.
- Live direct route smoke passed 16 URLs: homepage BG/RU/EN; about; empty cart; contacts; services; planting service; delivery support; plant/equipment category roots; Rain Bird equipment; Trachycarpus plant; blog; Rain Bird article; search Rain Bird (130 results). No persistent Suspense/loading placeholders.
- Build output: index 620.15 kB raw / 163.82 kB gzip before route splitting (PR #146) versus 388.90 kB raw / 106.91 kB gzip after PR #147; −231.25 kB raw / −56.91 kB gzip (−34.74% main-entry gzip). Page-specific chunks are emitted separately. This is build artifact size, not live transfer or total page speed.
- Full SPA navigation/scroll restoration and post-release resource-list verification remain open. No Sanity, D1, API, Manager, cart/checkout, Header/menu/Footer layout or Cloudflare settings changed.

## 2026-11-09 — PR #146: lazy Manager chunk

- PR #146 merged squash: `eef48358030cc04c7c8105f66b74013cfc20997a`; Production deployment `5ae924f2-29ba-446b-ab8c-be44e121eabb` success; aliases florial-bg.com and www.florial-bg.com.
- Only runtime file changed: `src/main.tsx`.
- `ManagerApp` now uses React lazy dynamic import and loads only on initial path `/manager` or `/manager/*`. Bulgarian Suspense fallback shown while loading.
- Public app branch and exact route predicate unchanged. ManagerApp source/auth/API/permissions not changed.
- CI run `42591541092` success: lint, tests, site build, migration syntax/dry-run, Studio install/build. D1 run `42591541240` success.
- Live smoke: homepage BG/RU; `/manager` and `/manager/` render existing Bulgarian login. Performance resource inspection confirms ManagerApp chunk absent from public page and loaded only on Manager route; Manager auth bootstrap endpoint requested. No sign-in performed.
- One unthrottled remote browser sample (1920×993): before one main JS transfer 209,165 B; after public JS index + runtime 161,151 B, saving 48,014 B (22.96%). Separate ManagerApp chunk 47,518 B, only on Manager. This is a single desktop resource sample, not controlled mobile/CDP/Lighthouse/CWV and not a page-speed percentage.
- No changes to ManagerApp source, API, D1, Sanity, cart/checkout, Header/menu/Footer or Cloudflare settings/secrets.

## 2026-11-09 — PR #145: compact blog cards and shared list fetch

- PR #145 merged squash: `6897cb1ad4ef4bb8429838c83f11c515ad9fec80`; Production deployment `1f9145d2-7aeb-46e7-840d-e79af9e70a68` success; aliases `florial-bg.com`, `www.florial-bg.com`.
- Changed runtime files: `src/lib/blog.ts`, `src/components/Header.tsx`, `src/components/BlogSection.tsx`, `src/pages/BlogPage.tsx`, `src/pages/BlogPostPage.tsx`.
- Blog list/card query now contains only slug, date, cover URL/ALT/caption and localized BG/RU/EN title, shortDescription and coverAlt. Full body Portable Text, gallery, SEO and tags remain in single-article detail query by slug.
- `fetchBlogPosts(3)` shared promise cache TTL 60 seconds deduplicates concurrent Header and BlogSection calls. Cache keys separate top-3 and all posts; failures evict their cache entry and token prevents an older failed request from deleting a newer entry.
- BlogPage and related articles use compact list records; BlogPostPage retains full detail for current article.
- Read-only Sanity validation: compact top-3 returned 3 documents / 4,668 output characters; compact all returned 22 / 29,597 characters; full detail for two published articles returned 47,544 and 35,000 output characters with BG/RU/EN Portable Text. These tool-output lengths are not wire transfer metrics. No Sanity writes.
- CI run `42590188304` success (lint, utility tests, site build, Studio build and migration dry-run); D1 run `42590188234` success.
- Live smoke BG/RU/EN: homepage 3 blog cards; `/blog` 22 article links; Rain Bird article detail content and localization; header Portfolio menu opens and shows 3 article links plus blog CTA. No loading placeholders after client-side load.
- Live PerformanceResourceTiming after release: 8 Sanity API URLs, 8 distinct, including one compact blog top-3 query (158 ms); previous diagnostic showed 9 URLs and duplicate blog requests. Duplicate request removal is confirmed. Cross-origin transferSize/encodedBodySize/decodedBodySize remain 0, so this is not a byte measurement or controlled baseline capture.
- No changes to Sanity schema/documents, D1, API, Manager, cart/checkout, Cloudflare settings/secrets or Header/menu/Footer layout.
- Controlled network byte capture and Lighthouse/CWV remain unmeasured; no overall speed percentage claimed.

## 2026-11-09 — Post-release Sanity diagnostic (not comparable with baseline)

- Report: `docs/performance/POST_OPTIMIZATION_SANITY_DIAGNOSTIC_2026-11-09.md`.
- Live homepage remote browser diagnostic found 9 Sanity requests. Additional read-only fetch measured 1,077,038 B decoded response bodies (equipment 740,714 B; plants 86,747 B; categories 84,554 B combined; services 17,022 B; duplicate blog requests 145,912 B each).
- The browser could not set viewport 390×844, disable cache or apply CPU/network throttling; cross-origin PerformanceResourceTiming transferSize was zero. These decoded body sizes are not comparable to baseline CDP encoded bytes and do not establish a speed percentage.
- Next optimization target: duplicate full blog list fetch in Header and BlogSection; full blog body/gallery currently fetched twice though only cards are needed.
- Controlled post-release CDP capture, Lighthouse, LCP, INP and CrUX remain open.

## 2026-11-09 — PR #144: full category content on demand

- PR #144 merged squash: `dd129898f207018e5124f7fa2604ff9a727ccd9a`; only runtime file `src/App.tsx` changed.
- Initial category projections for both Sanity datasets now return only navigation/presentation index fields: _id, name, localized names, slug, sortOrder, parentId, image URL/ALT/TITLE and isPlantCategory.
- Full category content (localized description, SEO/H1/noIndex, helpBlock) is fetched by category _id from the appropriate dataset only on `/category/:slug`.
- CategoryPage waits for detail fetch; stale route responses are cancelled; detail fetch errors fall back to compact category index.
- Header, homepage, About, product breadcrumbs and category subcategory cards retain the compact fields they consume.
- Sanity read-only GROQ tests succeeded for equipment/plant compact and detail category projections; no Sanity writes.
- CI: Blog and Studio validation `42588551106` success; D1 validation `42588551110` success.
- Production: Cloudflare Pages deployment `d93cc80d-1475-49d1-a798-a08587b6b2dd`, success, deployed commit matches merge commit; aliases `florial-bg.com`, `www.florial-bg.com`.
- Live smoke: plant and irrigation category roots BG/RU/EN, child categories, and categories with configured help blocks in BG/RU/EN. H1, descriptions, SEO titles, images, category/product cards and help text render; no loading placeholders after client-side load.
- No Sanity schema/documents, D1, API, cart/checkout, Manager, Header/menu/Footer layout or Cloudflare settings changed.
- Post-release network transfer and Lighthouse/CWV measurements remain open.

## 2026-11-09 — PR #143: компактный каталог и карточки главной

- PR #143 merged squash: `e7d33432b134825dc2fb065a8e254b363e73e67d`; ветка `main`.
- Runtime files: `src/App.tsx`, `src/pages/HomePage.tsx`.
- Homepage renders first 6 sorted plant categories and first 6 sorted irrigation categories. Existing sort/priorities retained; localized links lead to complete root catalogues.
- Initial product/plant GROQ queries now return compact catalog/card data. Full equipment/plant detail projections load only on product route. Search index loads only on search route. Plant related content and recommended irrigation product are resolved only for plant detail.
- Preserved category assignments, plant filters (type/light/water/coast/winter), saleVariants, stock/price card data, full product descriptions/specifications, galleries, SEO, manuals, kit components, related products/content and BG/RU/EN localization.
- Sanity read-only GROQ validation passed against project `bxvcy0qs`, datasets `production` and `plants`; no content/schema writes.
- CI: Blog and Studio validation `42587640231` success; D1 validation `42587640149` success.
- Production: Cloudflare Pages deployment `7169a06c-cd7d-4184-b47c-083a9f3cdb2a`, success, deployed commit matches merge commit, aliases `florial-bg.com` and `www.florial-bg.com`.
- Live smoke: BG/RU/EN homepage (6+6 cards), both catalog roots, equipment detail, plant detail/variants BG/RU/EN, kit components, plant filters, search Rain Bird (130 results). No real cart/checkout/order flow was executed. Browser console and full manual SPA regression remain unverified.
- Post-release network transfer / Lighthouse / CWV measurement not yet captured; no speed percentage claimed.
- No changes to Sanity schema/documents, D1, APIs, Manager, cart/checkout logic, Header/menu/Footer or Cloudflare settings/secrets.

## 2026-11-09 — MD2 rev33: homepage image optimization checkpoint

- Published new instruction edition `docs/ИНСТРУКЦИЯ(2)_FLORIAL_АКТУАЛЬНАЯ_09-11-2026_rev33.md`, commit `a4ff4c5652a03ecb282a474a28994e71b18b6dc9`.
- rev33 preserves rev32 and records PR #141, production deployment, CI, before/after mobile network measurements, remaining Lighthouse/LCP/desktop checks and the next Stage 1 consumer-map task.
- Previous MD2 editions remain intact; no historical instruction was overwritten.

## 2026-11-09 — Homepage responsive image optimization (PR #141)

- PR #141 merged squash in `main`: `b635aa4e307da86b11f70595f9da8a3c3d444074`; only `src/pages/HomePage.tsx` changed.
- Added responsive Sanity CDN image URLs for homepage service/plant-category/equipment-category cards (320–1200w), `srcSet`, `sizes`, `fit=max`, `auto=format`, `q=75`, explicit `loading=lazy`, `decoding=async`, and width/height. Existing layout, `object-cover`/`object-contain`, ALT/TITLE, links preserved. Hero CSS background intentionally unchanged.
- Production deployment `81b26460-1c58-408c-9cc3-c485e256ec45` — success; aliases `florial-bg.com` and `www.florial-bg.com`. Live BG/RU/EN home routes return HTTP 200. BG DOM: 38 img, 34 srcSet/sizes, 37 lazy (logo eager).
- Mobile initial-load network capture, 3 runs, same 390×844 / CPU 4× / 150 ms / 10 Mbps profile: total transfer median 12,929,319 bytes vs baseline 42,874,746 (≈−69.8%); image transfer median 8,980,844 vs 38,921,410 bytes (≈−76.9%). Sanity XHR stayed ~3.73 MB, as expected.
- Detailed measurement: `docs/performance/POST_OPTIMIZATION_HOME_IMAGES_2026-11-09.md`; baseline updated with before/after section.
- CI: Blog and Studio validation run `42582485634` success (lint, tests, website build, Sanity Studio build); D1 migration validation `42582485603` success.
- No changes to Sanity schema/documents, D1, API, checkout/cart, Manager, Header/menu/Footer, BlogSection, Cloudflare settings/secrets or production data. Full scroll-through visual review, post-optimization desktop run, Lighthouse/LCP/INP/CrUX remain outstanding.

## 2026-11-09 — Этап 0: первый baseline производительности Florial

- Создан отчёт `docs/performance/BASELINE.md` (commit `90ab9a2d62e5cdbe628f802e7d9a9205e8d5661e`) по реальным browser/network measurements Production главной.
- Mobile 390×844, CPU 4×, latency 150 ms, 10/1.5 Mbps, 3 прогона: медианы TTFB 163 ms, FCP 380 ms, DOMContentLoaded 553 ms, Load 554 ms. Desktop 1365×900, 3 прогона: TTFB 53 ms, FCP 136 ms, DOMContentLoaded 146 ms, Load 147 ms.
- CDP network capture: 42,874,746 bytes (≈40.89 MiB); изображения — 38.92 MB (90.8%), 10 Sanity XHR — 3.73 MB (8.7%), app JS — 207.5 KB, CSS — 12.1 KB.
- Подтверждены 38 image responses, преобладание оригинальных Sanity assets, 34 image elements с loading=auto, только 3 с явным lazy loading; Hero — CSS background PNG около 2.58 MiB.
- Полный equipment-products GROQ query передал около 3.33 MB и выполнялся около 9.8 s в мобильном throttled-профиле. Header и BlogSection дважды запрашивают один и тот же список трёх статей с body/gallery (около 145.9 KB каждый до транспортного сжатия).
- HTML в проверках имел `cf-cache-status: DYNAMIC`; fingerprinted JS/CSS — `HIT`, `max-age=31536000, immutable`.
- BG/RU/EN главные: HTTP 200, корректные lang/title/H1, `robots=index, follow`. Page errors и HTTP 4xx/5xx не обнаружены; тестовый браузер блокировал только Cloudflare Insights beacon.
- Lighthouse API вернул 429 (PageSpeed API quota=0); LCP entry не получен, INP и TBT не измерялись. Stage 0 отмечен как частично завершённый, эти ограничения явно зафиксированы.
- Обновлена `docs/ROADMAP_PERFORMANCE_OPTIMIZATION.md` (commit `10edcd57aef958a4d1d62d1ad611e619e6d65fdf`).
- Изменения только в документации. Runtime-код, Sanity schema/documents, D1, API, Manager, checkout, Cloudflare settings/secrets и Production data не менялись.

## 2026-11-09 — Internal links on five planting-service photos

- Sanity document `cfdbf22c-a7d9-480b-b88b-d1529a9389ef`, slug `zasazhdane-na-rasteniya`: assigned `contentBlocks[].image.linkUrl` for all five inline photos in their existing article order.
- Photo 1 → `https://florial-bg.com/category/rastenia` (plants dataset category `plants-root`).
- Photo 2 → `https://florial-bg.com/category/darveta-i-hrasti` (plants dataset category `plants-trees-shrubs`).
- Photo 3 → `https://florial-bg.com/category/soliteri-edrorazmerni` (plants dataset category `plants-solitaires`).
- Photo 4 → `https://florial-bg.com/category/tsvetya-i-rozi` (plants dataset category `plants-flowers`).
- Photo 5 → `https://florial-bg.com/category/kapkovo-napoyavane` (production dataset category `e577ef6b-d164-488f-b2f0-29ff7e8e7e9b`).
- All five category documents were found in their respective published Sanity datasets. Existing image assets, order, markers, ALT texts, main Hero image, article text and form were preserved.
- Before-write snapshot committed: `docs/backups/sanity-service-zasazhdane-na-rasteniya-before-category-image-links-2026-11-09.json` (GitHub commit `e4d2ee328e0096a48e6dee134238c95db4587744`).
- Draft was verified to contain the five requested URLs, then published. Published Sanity revision: `9Jlb6k9xfgGTkBekNEY2fH`.
- External live page fetch via web cache was unavailable in this run; therefore live click-through is not claimed. Sanity published-data verification passed.

## 2026-11-09 — Florial Service Content Playbook v1.0

- Созданы `docs/SERVICE_CONTENT_PLAYBOOK.md` и `docs/PROMPT_SERVICE_CREATION_AND_EDITING.md` в GitHub main и Library.
- Стандарт основан на фактической service schema и frontend: H1 из `hero.title`; BG Portable Text; RU/EN Markdown; локализованные SEO; ALT и image `linkUrl`; `relatedContent`; существующие image group markers; форма через `/api/service-leads`.
- Создана MD2 rev25; исторические rev24 и предыдущие версии не перезаписаны.
- Только документационные изменения. Код, Sanity documents/schema, D1, API, Manager, checkout, Cloudflare settings и Production не менялись.

## 2026-11-09 — MD2 instruction rev24

- Latest control instruction: `docs/ИНСТРУКЦИЯ(2)_FLORIAL_АКТУАЛЬНАЯ_09-11-2026_rev25.md` added to GitHub main and personal Library `/Florial/ИНСТРУКЦИЯ(2)_FLORIAL_АКТУАЛЬНАЯ_09-11-2026_rev25.md`.
- rev24 preserves rev23 and adds the verified implementation of service image links and related content cards (PR #134), the drip-irrigation photo in the planting service, Sanity schema deployment, backup and production verification.

## 2026-11-09 — Service image links and related content

- GitHub main merge commit: `627953676e0cef853704a648693e7cf57284bfcc`, PR #134.
- Service schema: optional `linkUrl` on service image, hero image, gallery images and `serviceContentBlock.image`; optional `relatedContent` references to `service`, `blogPost`, `product`, `category`.
- Frontend: service image links are localized for internal routes; related materials render as compact image-left/text-right cards. Added `__gallery:watering` marker to map inline imagery to the watering section.
- Canonical Studio schema deployment succeeded in GitHub Actions run `42553313954`; schema API confirms the new fields in workspace `florial-admin`. Existing Studio application retained.
- Sanity service `cfdbf22c-a7d9-480b-b88b-d1529a9389ef` updated and published with new drip-irrigation image, localized ALT values, localized watering text, image link to `/services/avtomatizirano-kapkovo-napoyavane`, and related service references to olive planting and drip irrigation. User's current main image preserved.
- Target-service JSON snapshot stored at `docs/backups/sanity-service-zasazhdane-na-rasteniya-2026-11-09.json`. Full dataset copy is unavailable under the current Sanity plan; no dataset contents were deleted or overwritten.
- Cloudflare Pages Production deployment `7a53b3b5-0898-48f2-a249-50f71617ae91` succeeded for this commit. Live smoke in BG/RU/EN confirms localized H1/section, linked photo, related cards and lead form.
- Checks passed: lint, utility tests, website build, Pages Functions syntax, read-only migration dry-run, Studio build, Sanity Studio validation, D1 migration validation.
- No changes to Header, navigation, Footer, Manager, D1, order APIs, service URL or existing lead-form behavior.


## 2026-11-09 — Контрольная инструкция Florial MD2 rev23

- Новая редакция `docs/ИНСТРУКЦИЯ(2)_FLORIAL_АКТУАЛЬНАЯ_09-11-2026_rev23.md` добавлена в GitHub main и Library. Она сохраняет полную историю rev22 и дополняет её результатами переработки услуги «Засаждане на растения».
- Rev23 фиксирует PR #132/#133, merge commit `c3b0d53d4c395d96881e4ab0f33d641caf10f32a`, Production deployment `4b21e8f0-c841-4c7f-8488-f70c92845bef` и live smoke BG/RU/EN.

## 2026-11-09 — Глубокая переработка услуги «Засаждане на растения»

- Существующий Sanity service document cfdbf22c-a7d9-480b-b88b-d1529a9389ef обновлён и опубликован; slug zasazhdane-na-rasteniya, serviceCategory=planting, serviceLayout=standard. Существующий URL сохранён; повторный документ не создавался.
- Подготовлены самостоятельные BG/RU/EN версии: расширенное описание, H2/H3, выделения strong/bold, списки, преимущества, этапы, CTA и краткие описания. BG использует Portable Text; RU/EN — Markdown, поддерживаемый текущим src/pages/ServicePage.tsx.
- Заполнены локализованные name, shortDescription, hero.title/subtitle, description, advantages, steps, callToAction, seo.metaTitle, seo.metaDescription, seo.keywords, seo.noIndex=false. География: Несебър, Равда, Слънчев бряг, Свети Влас, Поморие, Ахелой, Бургас и близлежащие населённые пункты; Созопол исключён.
- Использованы уже существующие 5 изображений: одно главное и четыре фотографии внутри статьи. Для изображений заданы ALT BG/RU/EN. Assets не удалялись и повторно не загружались.
- contentBlocks использует существующие маркеры __gallery:intro, __gallery:trenches, __gallery:equipment, __gallery:automation; gallery очищена от повторных ссылок, поскольку фотографии теперь находятся внутри статьи. PR #132 добавил локализованное сопоставление заголовков для посадки и включён в main commit d7ee50f55f4df03013f006ef47fe89ae31d56f3d. PR #133 исправил двойной показ intro-фото и сохранил прежние группы изображений услуг оливковых деревьев и полива; merge commit c3b0d53d4c395d96881e4ab0f33d641caf10f32a.
- GitHub Actions PR #132: Blog and Studio validation 42548490358 — success; D1 migration validation 42548490418 — success. PR #133: Blog and Studio validation 42548753912 — success; D1 migration validation 42548753764 — success. Проверки включали lint, website tests, website build, Pages Functions syntax, read-only description migration dry-run, Sanity Studio build.
- Cloudflare Pages Production deployment 4b21e8f0-c841-4c7f-8488-f70c92845bef для commit c3b0d53d4c395d96881e4ab0f33d641caf10f32a завершился success; aliases florial-bg.com и www.florial-bg.com.
- Live smoke BG/RU/EN: HTTP 200; корректный html lang; локализованные H1, SEO title и description; robots=index, follow; 5 article photos total (1 hero + 4 in-text); 14 H2 и 21 H3 в полной странице; преимущества, этапы и форма заявки отображаются. Проверка не отправляла реальную заявку.
- Содержимое адаптировано для Болгарии: выбор места и растений, взрослые размеры, разметка и расстояния, подготовка почвы и индивидуальный субстрат, отвод воды, правильная глубина/корневая шейка, деревья/кустарники/живые изгороди/цветы/декоративные травы, полив, мульчирование и особенности Южного Черноморья. Не перенесены неподтверждённые цифры DROP «20 лет / 600 проекта» и устаревшая цена. Не обещается безусловная гарантия приживаемости.
- Sanity schema не менялась. Существующая форма и POST /api/service-leads не менялись; D1, Manager, orders, checkout, Header, меню и Footer не затрагивались. Тестовые заявки не создавались.

## 2026-11-08 — Новая услуга: профессиональная посадка маслиновых деревьев

- В Sanity dataset `production` создана и опубликована новая услуга: `service` ID `6afc3eff-944c-4085-a48c-38686999b0f3`, slug `profesionalno-zasazhdane-na-maslini`, категория `planting`, `serviceLayout=standard`, `sortOrder=25`, `isActive=true`. Существующая общая услуга «Засаждане на растения» не изменялась.
- Подготовлены и опубликованы три версии: BG (Portable Text), RU и EN (Markdown в текстовом поле). Для локализованных описаний используются H2 через `##`, H3 через `###`, жирное выделение через `**...**`, маркированные и нумерованные списки. Рендерер `src/pages/ServicePage.tsx` сохраняет заголовки и inline marks Portable Text, а также отображает Markdown-структуру RU/EN.
- Для статьи используются четыре оригинальных изображения: главное — `image-7bd95362e8f711b75b51610129215270fe7d8e8c-1152x1536-jpg`; доставка/кран — `image-f7f05aff38dc6e9de8d2ba57816f5fe55528072e-864x1536-jpg`; подготовка ямы — `image-516b87ccd214b0b72511b5abc28ece5ac91c063d-1152x1536-jpg`; позиционирование — `image-7a903fda6ec1577698f43c430eeedb17f8c345c4-1152x1536-jpg`.
- Главное изображение подключено в `image` и `hero.image`. Три дополнительные фотографии размещаются внутри статьи через существующие `contentBlocks` и маркеры `__gallery:pipeline`, `__gallery:trenches`, `__gallery:equipment`. Для всех четырёх фотографий заполнены локализованные ALT BG/RU/EN с географическим упоминанием Несебра.
- Заполнены локализованные `name`, `shortDescription`, `hero.title`, `hero.subtitle`, `description`, `advantages`, `steps`, `callToAction`, `leadForm`, а также `seo.metaTitle`, `seo.metaDescription`, `seo.keywords`, `seo.noIndex=false` для BG/RU/EN. География: Несебър, Равда, Слънчев бряг, Свети Влас, Поморие и Бургас; Созопол не используется.
- Форма заявки использует существующий endpoint `POST /api/service-leads`; поля: name, phone, email, location, details. Форма отображается внизу страницы. Реальную отправку тестовой заявки не выполняли, чтобы не создавать ложную запись в D1.
- PR #130 `feat: render rich localized service articles` объединён в main: `fba2c114a80b05769b0cae4090e6fbaaa63e92db`. PR #131 `fix: improve service article image layout` объединён в main: `adfe9c735f8a100e9405cb10bfccf22eae10d796`. Изменения кода ограничены `src/pages/ServicePage.tsx`; одиночные изображения статьи показываются крупнее, по центру, без обрезки и без повторения ALT в подписи. Существующие image-group markers услуг автоматического полива сохранены.
- GitHub Actions для PR #130: Blog and Studio validation `42499466599` — success; D1 migration validation `42499466381` — success. Для PR #131: Blog and Studio validation `42499876717` — success; D1 migration validation `42499876770` — success. Проверки включали lint, website tests, website build, Pages Functions syntax, read-only D1 validation и Sanity Studio build.
- Sanity document validation вернула `valid`; инструмент отметил `complete=false`, поэтому custom validation rules не были полностью проверены. Документ дополнительно проверен в опубликованном состоянии и через live page.
- Cloudflare Pages Production deployment `afbaa0c5-3659-46bc-8998-8716f7c09fe7` (short ID `afbaa0c5`) для commit `adfe9c735f8a100e9405cb10bfccf22eae10d796` завершился success; aliases `florial-bg.com` и `www.florial-bg.com`.
- Live smoke: страница услуги BG/RU/EN возвращает HTTP 200; все три локали имеют H1, локализованные SEO title/description, `robots=index, follow`, три inline-фотографии и форму заявки. В BG проверено отображение преимуществ и этапов в структурированных блоках.
- Sanity schema, существующие документы услуг, D1, Manager, orders, checkout, Header, меню и Footer не изменялись.

## 2026-11-08 — Этап 6: PR #129 объединён и опубликован в Production

- PR #129 `fix: align delivery fee and sanitize seller permissions` объединён методом squash в `main`; merge commit: `01f21becb40d847270c83b12a3f54d37049d5c67`. PR закрыт со статусом merged.
- Перед merge актуальный HEAD ветки `fbaa97a4e4b6ace9c35a1a3553c4c07b832ef3e5` прошёл GitHub Actions: Blog and Studio validation run `42494862245` — success; Florial D1 migration validation run `42494837586` — success. В составе CI: 24/24 теста, lint, Vite build, Pages Functions syntax, read-only D1 migration validation, Sanity Studio build.
- Cloudflare Pages Production deployment `d0e2791b-401a-4c52-83f1-1e56d5fe5342` (short ID `d0e2791b`) для merge commit завершился success 08.11.2026 15:43:55 UTC; build и deploy stages — success; aliases `florial-bg.com` и `www.florial-bg.com`.
- Live smoke после deployment: главная, `/manager`, `/cart`, delivery page BG/RU/EN — HTTP 200. `/api/manager/service-leads` без авторизации — HTTP 401. Страница Manager показывает закрытую форму входа. Полная аутентифицированная матрица Owner/Manager/Seller не выполнена: отдельные сессии этих ролей недоступны.
- Delivery page BG/RU/EN показывает Каблешково 10 EUR и Поморие 15 EUR. Sanity опубликованный документ Каблешково `43fdc359-0e28-4410-83b3-a1902270345e` = 10 EUR; корзина и серверная проверка заказа согласованы.
- Изменения кода: `functions/api/manager/staff.ts` очищает manager-only права при переводе в Seller и запрещает выдачу таких прав Seller; `src/manager/ManagerApp.tsx` сбрасывает manager-only permission в форме создания Seller; `tests/service-leads-manager.test.mjs` покрывает регрессии. Изменено 9 файлов в PR.
- Production D1 не изменялась: migrations, профили сотрудников, заявки, события и заказы не затрагивались; новые тестовые заявки не создавались. Sanity schema не менялась; ранее изменён только один опубликованный deliveryZone документ Каблешково. Header, меню, Footer, checkout и глобальная оболочка не менялись.
- Retention: срок `retention_until` = 365 дней; автоматическое удаление/обезличивание не включено. Нужны отдельное решение владельца и правовая проверка. Не выполнять purge или анонимизацию без отдельного подтверждения.
- Cloudflare Pages project config содержит legacy переменные с именами `SUPABASE_*` / `VITE_SUPABASE_*`; статический поиск в репозитории ранее не выявил активного Supabase runtime-кода. Значения не раскрывались, настройки не менялись. Удаление этих переменных требует отдельной проверки workflow/config и отдельного согласования.
- Статус: **код PR #129 объединён и опубликован; техническая часть исправления Seller permissions и выравнивания доставки выполнена. Полное закрытие Этапа 6 остаётся открытым до authenticated role matrix и решения по retention.**

---

## 2026-11-08 — Этап 6: первичная сквозная проверка и исправления в PR

- Перед работой прочитана Library-инструкция `ИНСТРУКЦИЯ(2)_FLORIAL_АКТУАЛЬНАЯ_08-11-2026_rev18.md` (created_at `2026-11-08T11:39:25Z`); сверены `main`, `CHANGELOG.md`, `docs/ROADMAP_SERVICES_AND_LEADS.md`, Manager architecture, опубликованные Sanity documents и Production D1.
- Владелец подтвердил ручную приёмку этапа 5. Production D1 read-only: 2 заявки, 7 событий; обе записи сохранены, email status у уведомлений `sent`. PII не выгружалась, тестовые заявки не создавались.
- Live smoke: service page BG/RU/EN и delivery page HTTP 200; Manager HTTP 200 с `noindex,nofollow`; неавторизованный Manager API HTTP 401. Полный аутентифицированный тест ролей недоступен без отдельных Owner/Manager/Seller сессий.
- Sanity `production`: опубликован тариф Каблешково 10 EUR вместо 15 EUR по прямому правилу владельца выбирать меньшую цену при расхождении. Обновлён только документ `43fdc359-0e28-4410-83b3-a1902270345e`; остальные deliveryZone документы не затронуты. Поморие остаётся 15 EUR. Cart и server order validation уже содержали 10 EUR; тарифы выровнены.
- Рабочая ветка `fix/stage-6-seller-permissions-delivery-fee`: `functions/api/manager/staff.ts` дополнен очисткой `canManageCategorySeo`, `canViewServiceLeads`, `canManageServiceLeads` при переводе сотрудника в Seller; проверки создания и обновления Seller запрещают этот набор manager-only прав. Добавлены тесты в `tests/service-leads-manager.test.mjs`.
- D1 migration/записи, реальные профили сотрудников, заявки, события, заказы, checkout, secrets, Header, меню, Footer и глобальная оболочка не менялись. Retention cleanup не включался.
- PR #129 открыт. CI на code HEAD `061aa1d96eb7ed5697320a4b0b8bfcbc8205b69c` прошёл: 24/24 теста, lint, Vite build, Pages Functions syntax, read-only D1 migration validation, Sanity Studio build. После добавления Manager UI permission reset final HEAD `7973d5d46e8651d5e3d50faa5ee785f10b6d71f3` проходит повторный CI. Merge и Production deployment кода не выполнялись и требуют отдельного разрешения владельца.
- Статус: **ЭТАП 6 В РАБОТЕ**. Открыты полная проверка ролей на аутентифицированных сессиях, безопасная end-to-end проверка без записи фальшивых заявок и решение по процедуре хранения/обезличивания 365 дней.

---

## 2026-11-08 — Этап 5: Manager для заявок на услуги (PR #127 объединён, Production опубликован)

- Базовый `main`: `2516b3f4c60420e95a8b8a12400c373e9b0f9b16`; PR #127 объединён commit `4213e5c2c79fe300be36cb71b94470431ed49705`; проверенный PR head `539c59fb83ae4272ca062da68dc3e3775799840b`.
- Актуальная MD2-инструкция перед работой: rev17, Library created_at `2026-11-08T10:17:23Z`. Повторно изучены roadmap, Manager architecture, актуальные исходники и D1 schema.
- Владелец подтвердил реальную тестовую отправку заявки: уведомление Florial получено, клиент получил письмо-подтверждение, мобильное отображение проверено. Read-only D1: 2 заявки и 4 события; данные клиентов не выгружались.
- Добавлены `functions/api/manager/service-leads.ts`, `src/manager/ServiceLeadsManager.tsx`, интеграция в `src/manager/ManagerApp.tsx`, permission keys в `functions/api/manager/_lib.ts` и делегирование/валидация в `functions/api/manager/staff.ts`.
- Новые разрешения: `canViewServiceLeads`, `canManageServiceLeads`. Owner получает доступ автоматически; Manager получает только явно выданные права; Seller блокируется. Управление требует также права просмотра. Существующие permission flags сохраняются.
- API поддерживает поиск/фильтры, детальную карточку, безопасные статусы/переходы, назначение активного профиля Owner/Manager (owner — любой активный Owner или Manager; manager — себя или прямых подчинённых с ролью Manager; Seller исключён), внутренние комментарии и неизменяемые события.
- Additive migration `0012_service_leads_manager` добавляет `service_leads.assigned_to`, индекс и два новых permission keys со значением false; одновременно включает отсутствующий `canManageCategorySeo=false` в проверяемую форму permission JSON и укрепляет triggers. Существующие заявки, события, заказы и сотрудники не удаляются.
- Migration SQL проверена отдельно в локальной SQLite-модели с representative permission JSON; migration применена в тестовой модели, новые поля прав остались boolean false. Production D1 migration 0012 применена 08.11.2026 11:37:54 UTC.
- Добавлен `tests/service-leads-manager.test.mjs`. GitHub Actions PR #127 завершились `success`: website lint/tests/build, Pages Functions syntax, D1 migration validation, Sanity Studio build.
- Sanity и её документы не менялись; Cloudflare secrets/settings не менялись; Production deployment `82ac6348-f42c-4095-b81e-1d2b450d0fc0` для commit `4213e5c2c79fe300be36cb71b94470431ed49705` завершился `success` 08.11.2026 11:38:32 UTC; aliases `florial-bg.com` и `www.florial-bg.com`. Header, меню, Footer, checkout и публичная оболочка не менялись.
- Retention cleanup для заявок по истечении 365 дней остаётся отдельной нерешённой задачей и не включался.
- Статус: **ЭТАП 5 ЗАВЕРШЁН И ПРИНЯТ ВЛАДЕЛЬЦЕМ ВРУЧНУЮ. Этап 6 в работе.**

---
## 2026-11-08 — Обновлён фирменный шаблон клиентского email по заявкам

- Изменён только `functions/api/service-leads.ts`: общий helper `buildCustomerConfirmationHtml` формирует локализованное BG/RU/EN HTML-письмо с логотипом, названием садового центра, фирменной палитрой и контактами.
- Логотип: существующий опубликованный Sanity photo asset `oficialno-logo-florial-gradinski-centar`, CDN URL `https://cdn.sanity.io/images/bxvcy0qs/production/4d6d94ce99f3e210ba0b649dda236ee7e0ce522c-1547x581.png`; Sanity document не изменялся.
- Контакты в письме: BG `+359 876 777 902`; RU/UA/EN `+359 885 834 860`; WhatsApp `+380 67 480 7486`. Телефоны и WhatsApp оформлены кликабельными ссылками.
- Helper вызывается для первоначального клиентского подтверждения и повторной отправки после idempotency conflict; текст письма с номером заявки и услугой сохранён.
- Не менялись owner notification, форма, D1, Sanity documents/schema, Cloudflare secrets/settings, Manager, checkout, email заказов, Header, меню и Footer. Тестовое письмо и Production API submission не выполнялись; Resend delivery остаётся непроверенной.
- PR #125 merged squash commit `75ea099147714174e303e727cf67d091c05fb5dd`; Cloudflare Pages Production deployment `42cfb190-b961-4f6b-8883-2d9d78eab222` (2026-11-08 10:53 UTC) опубликован для `main`, build/deploy stages `success`, command `npm run build`, aliases `florial-bg.com` и `www.florial-bg.com`.
- CI: PR website + Studio validation run `42471440144` — success; PR D1 migration validation run `42471440098` — success; post-merge D1 validation run `42473330879` — success.
- Live read-only smoke после deploy: `/services/avtomatichno-napoyavane` (BG), тот же URL с `?lang=ru` и `?lang=en`: HTTP 200, `html lang` соответственно bg/ru/en, `robots=index, follow`; форма присутствует в HTML. POST заявки не отправлялся.
- Реальное письмо не отправлялось; Production API и Resend delivery не тестировались. Поэтому шаблон встроен в опубликованный Worker, но фактическая отправка клиенту остаётся НЕ ПРОВЕРЕНА.

---

## 2026-11-08 — Production D1 migration 0011_service_leads применена

- Владелец явно разрешил применение миграции 08.11.2026.
- Production D1: `5fbb0e47-8439-493c-821a-6945eef7d8b2`; перед применением последняя версия была `0010_public_api_rate_limits`.
- Исходный файл: `functions/migrations/0011_service_leads.sql`, blob SHA `c9a15f971a0deeb764884c440c8fd380d35a92ff`, из `main` commit `c47c9d0033007c5fbe02a023efdd7851d34a03a0`.
- Marker `0011_service_leads` записан в `schema_migrations` с `applied_at=2026-11-08 10:16:39`.
- Созданы `service_leads` (24 колонки), `service_lead_events` (11 колонок), 6 индексов и 2 triggers: `trg_service_lead_events_no_update`, `trg_service_lead_events_no_delete`.
- Read-only verification после применения подтвердила marker, обе таблицы, все индексы/triggers и нулевое количество строк в обеих таблицах. Batch применён успешно, ошибок нет.
- Изменены только новые объекты service-leads и marker migration; существующие orders/catalog/Manager данные не менялись.
- Не выполнялись Production API submission и тестовое письмо Resend; секреты не читались. Автоматическое retention cleanup отсутствует. API/email end-to-end не объявлять готовыми до отдельных проверок.
- Новая инструкция: `/Florial/ИНСТРУКЦИЯ(2)_FLORIAL_АКТУАЛЬНАЯ_08-11-2026_rev17.md`; rev16 сохранена.

---

## 2026-11-08 — Выпущена основная инструкция MD2 rev16

- В Library проекта Florial загружена новая редакция `/Florial/ИНСТРУКЦИЯ(2)_FLORIAL_АКТУАЛЬНАЯ_08-11-2026_rev16.md`.
- Rev16 создана на основе rev15 с сохранением всей предыдущей инструкции и истории целиком; добавлена контрольная точка после merge PR #124 и Production deployment.
- Зафиксированы merge commit `53ee65d6970dd3d3849853e6241cff652d1220a2`, Production deployment `ccae6acc-3e39-47f3-8192-c4110240c080`, live smoke BG/RU/EN и текущий blocker: D1 migration `0011_service_leads` не применялась.
- Rev15 и более ранние редакции не перезаписывались и не удалялись.
- Последний подтверждённый `main` commit перед записью этой строки: `9cbd9928800044d37f9998656d99509e3a0389bf`.

## 2026-11-08 — PR #124 объединён и опубликован: заявочная форма с уведомлением об обработке

- PR #124 объединён в `main` squash-commit `53ee65d6970dd3d3849853e6241cff652d1220a2`; PR закрыт со статусом merged.
- Cloudflare Pages Production deployment `ccae6acc-3e39-47f3-8192-c4110240c080` для этого commit завершился успешно: queued, initialize, clone_repo, build и deploy — success. Build command подтверждена как `npm run build`; aliases `https://florial-bg.com` и `https://www.florial-bg.com`.
- На странице услуги добавлено небольшое уведомление BG/RU/EN: менеджер Florial получит и обработает заявку; при необходимости команда свяжется с клиентом по указанным контактам. Checkbox согласия и ссылка на privacy policy не добавлялись.
- Live smoke test страницы `/services/avtomatichno-napoyavane` на BG, RU и EN: HTTP 200, `robots=index, follow`, локализованная строка уведомления отображается во всех трёх версиях. Проверка выполнена после ожидания клиентского рендеринга.
- CI на PR HEAD `6d8a6eb80159137b316670b8b79311fd1108c0c3`: D1 migration validation run `42469920216` — success; Blog and Studio validation run `42469920217` — success; Sanity Studio validate run `42469920287` — success.
- **Важно: Production D1 migration `0011_service_leads` НЕ применялась.** В Production D1 до миграции отсутствуют таблицы `service_leads` и `service_lead_events`; API формы не готов к приёму реальных заявок до применения миграции и отдельного безопасного smoke test. Не считать форму рабочей end-to-end.
- Sanity schema deploy не выполнялся, Sanity documents не изменялись. Resend test email не отправлялся; секреты не читались.
- Автоматическое удаление/обезличивание по retention 365 дней не реализовано. Процедуру нужно определить до полноценного запуска приёма заявок.
- Фотозагрузка через сайт отложена: фото при необходимости клиент отправит через WhatsApp или другой мессенджер; Sanity Media Library и R2 не создавались.
- Не менялись Manager, orders, checkout, Header, меню, Footer и глобальная оболочка.
- **Статус Этапа 4: КОД ОБЪЕДИНЁН И FRONTEND ОПУБЛИКОВАН; ПРИЁМ ЗАЯВОК НЕ ГОТОВ К ПРОДАКШН-ЭКСПЛУАТАЦИИ до применения migration 0011, проверки email и согласования retention.**

---

## 2026-11-08 — ЭТАП 4: заявочная форма без согласия и без фото (в работе)

- Проверенная база: `main` commit `50d91be629bd1d31dd861896732cdd43fb5ea91b`; реализация находится в `feat/service-leads-stage-4`, PR #124.
- Production D1 `5fbb0e47-8439-493c-821a-6945eef7d8b2` до начала работ read-only проверена: последняя migration `0010_public_api_rate_limits`; таблиц `service_leads` / `service_lead_events` не было.
- Подготовлена additive migration `functions/migrations/0011_service_leads.sql` с отдельными таблицами `service_leads` и append-only `service_lead_events`. Содержит idempotency, notification states и `retention_until` на 365 дней. Поля согласия и URL политики не включены. Migration не применена к Production.
- `functions/api/service-leads.ts` проверяет same-origin, JSON/body limit, rate limit, honeypot, активную Sanity service, поля/контакты и idempotency. Нет проверки checkbox, `consentText` или `privacyPolicyUrl`; запись в D1 и best-effort email сохраняются.
- Email повторно использует существующий `sendOrderEmail` и Pages variables `RESEND_API_KEY`, `EMAIL_FROM`, `ORDER_NOTIFICATION_EMAIL`; наличие имён проверено без чтения значений. Тестовая отправка не выполнялась.
- `src/pages/ServicePage.tsx` показывает форму BG/RU/EN без checkbox согласия и без ссылки на privacy policy. Клиент описывает проблему; если потребуется фотография, команда Florial свяжется с ним и предложит отправить её через WhatsApp или другой удобный мессенджер.
- **Фотозагрузка через сайт исключена из текущего объёма по решению владельца.** Не создавать Media Library, не подключать R2, не использовать Sanity dataset assets для клиентских фото и не добавлять file fields/endpoints. Вопрос будущего приватного хранения остаётся открытым.
- Из Sanity Studio schema и `src/types.ts` удалены поля `consentText` и `privacyPolicyUrl`, добавлявшиеся в этой ветке; schema deploy и Sanity document writes не выполнялись.
- Для клиентского запроса на расчёт/оказание услуги применимость GDPR Art. 6(1)(b) оценивается как преддоговорные действия по просьбе клиента, если фактическая цель запроса соответствует этому основанию. Art. 13 GDPR сохраняет отдельную обязанность информирования; она не требует checkbox согласия и не является техническим gate формы. Наличие и содержание privacy notice вне формы требуют отдельной правовой проверки; не заявлять о полной GDPR-compliance без неё.
- Срок хранения заявок задаётся 365 дней; автоматическое удаление/обезличивание не реализовано. Перед запуском требуется отдельно согласовать и проверить процедуру retention.
- Production D1, Sanity documents, Cloudflare secrets/settings, Manager, orders, checkout, Header, меню, Footer не изменялись. Нет merge и Production deployment. Этап 4 не завершён.
- Выпущена и проверена Library-инструкция `ИНСТРУКЦИЯ(2)_FLORIAL_АКТУАЛЬНАЯ_08-11-2026_rev15.md` (08.11.2026, rev15); предыдущая rev14 сохранена целиком.



## 2026-11-08 — ЭТАП 3: Sanity delivery zones подключены в коде; Production ожидает согласования

- Базовый `main`: `a021f637f7ea2850a57673c0560f4e82fe3146fc`. Реализация подготовлена в PR #120: https://github.com/omaraandrey-dev/florial/pull/120; кодовые commits `cb2c92d566228bed31c1fc1bd5a96f87d4746c4b` и `7e2296b2f54eafb93265f402856e1099773172a0`.
- Runtime изменён в `src/App.tsx`, `src/pages/IrrigationSupportPage.tsx` и `src/lib/servicesOrder.ts`: страница загружает активные `deliveryZone` через существующий публичный `sanityClient`, сортирует по `sortOrder` и показывает локализованные BG/RU/EN названия, расстояния и EUR тарифы; `App.tsx` выбирает специальную страницу по сохранённому URL или `serviceLayout=delivery`; helper отключает временную отдельную карточку доставки, когда опубликована Sanity-услуга с layout/category delivery.
- Добавлены локализованные состояния загрузки, ошибки и отсутствия активных зон. Существующий URL `/services/dostavka-poliv`, тексты страницы, CTA, изображения, контакты, breadcrumbs и SEO fallback сохранены.
- Sanity Production `bxvcy0qs/production`: все 30 существующих `deliveryZone` документов проверены (уникальные slug, числовые distanceKm/feeEUR, заполненные обязательные поля), активированы и опубликованы. Создан и опубликован один документ `service` для доставки (`slug=dostavka-poliv`, `serviceCategory=delivery`, `serviceLayout=delivery`, `sortOrder=90`) с BG/RU/EN названием, кратким описанием, SEO и существующим изображением. Дубликаты не создавались.
- Перед публикацией у двух подтверждённых зон обновлены только флаги активности и удалены устаревшие предупреждения в RU/EN примечаниях: Поморие — 15 EUR, Кошарица — 10 EUR. Все остальные тарифы, расстояния, названия и sortOrder сохранены.
- GitHub Actions PR #120: `Blog and Studio validation` run #477 — success (lint, website utility tests, Vite build, syntax checks, Studio build); `Florial D1 migration validation` run #483 — success. D1 не изменялась.
- Live smoke до публикации кода: production страница BG/RU/EN проверена; H1/тексты и текущая таблица доступны. Canonical и hreflang BG/RU/EN/x-default подтверждены на каждой локали. После публикации delivery service в Sanity live sitemap содержит ровно 3 `<loc>` для `/services/dostavka-poliv` (BG/RU/EN), без дублирующих URL; alternate hreflang присутствуют. Это проверка текущей production версии до merge PR, не доказательство работы нового frontend query.
- Последний Production deployment на момент проверки: `e1161649-dc9a-46be-be28-d7989c917a40`, commit `a021f637f7ea2850a57673c0560f4e82fe3146fc`, build/deploy `success`. Это документационный deploy предыдущего этапа; код PR #120 в нём отсутствует.
- Header, меню, Footer, global shell, `HomePage.tsx`, `ServicesListPage.tsx`, Sanity schema, D1, Manager, orders, checkout, Resend, secrets и Cloudflare settings не менялись. Старый fallback JSX карточки доставки сохранён, но helper не добавляет его при наличии Sanity delivery service.
- **Статус этапа: В РАБОТЕ — код и данные готовы, PR #120 открыт; merge/Production deployment не выполнялись.** Production deployment требует отдельного согласования владельца. После публикации обязательно проверить BG/RU/EN, 30 строк, тарифы, canonical/hreflang, sitemap и изменение тарифа из Sanity без изменения кода.

## 2026-11-08 — ЭТАП 2 ЗАВЕРШЁН: публичные страницы услуг

- PR #116 merged: `f05d52f2bf81c80e103c337f5332dbf3c13af81c`; PR #117 merged: `2f94935645025441be931dceeb047701d9e0ea28`; PR #118 merged: `f23e80dc78910657547a996ff87c85b5075d6ac8`.
- Финальный main commit: `f23e80dc78910657547a996ff87c85b5075d6ac8`.
- Изменены: `src/App.tsx` (GROQ fields sortOrder/category/layout/Hero/gallery); `src/types.ts`; `src/lib/servicesOrder.ts` (Sanity sortOrder); `src/pages/ServicePage.tsx` (Hero, gallery, advantages, steps, CTA, UI-only leadForm, duplicate suppression, localized headings and form labels).
- `HomePage.tsx` и `ServicesListPage.tsx` используют единый helper и сортируются по Sanity sortOrder. Отдельная карточка доставки остаётся фиксированной позицией 90 до Этапа 3.
- Production smoke test: BG/RU/EN service pages и `/services` — HTTP 200; robots `index, follow`; Hero image не дублируется в gallery; совпадающий Hero H1 не повторяется как H2; преимущества/этапы/CTA не дублируются, если уже присутствуют в description; подписи формы локализованы, phone/email/details получают tel/email/textarea.
- Все 8 опубликованных service документов имеют RU/EN description и SEO metaTitle/metaDescription. Структурированные `translations.ru/en.advantages`, `steps`, `leadForm` не заполнены; соответствующие разделы уже присутствуют в локализованных descriptions, UI избегает повторов. Для формы используются локализованные frontend fallback labels; Sanity данные не менялись.
- Sitemap smoke test: 24 service URL entries (8 услуг × BG/RU/EN). SEO source helper `applyPageSeo` сохраняет self-canonical и hreflang alternates; `robots` подтверждён как `index, follow`.
- CI: PR #116/#117/#118 lint/tests/Vite build/Pages Functions syntax/read-only migration dry-run/Studio build — success. Main D1 validation run `42448148467` — success. Отдельного npm script для standalone TypeScript `tsc --noEmit` в проекте нет.
- Cloudflare Pages Production deployment: `407cef61-bc67-444f-ba84-48d46d99fcfa`, build и deploy success; aliases `https://florial-bg.com`, `https://www.florial-bg.com`.
- Sanity read-only: 8 published active service documents; 14 contentBlocks услуги монтажа в Несебре сохранены. Никакие Sanity documents не изменялись. 30 deliveryZone drafts, 0 published.
- Владелец подтвердил тарифы: Поморие 15 €, Кошарица 10 €. Обе draft-записи пока `isActive=false`; на Этапе 3 активировать обе и сохранить эти суммы. Расстояния взяты из текущей страницы и не были независимо проверены.
- Не менялись D1, Manager, Resend, заказы, checkout, доставка, Header, меню, Footer, глобальная оболочка и Cloudflare secrets. Заявочная форма — только UI; серверная отправка, email, фото и Manager интеграция остаются следующими этапами.
- Related services/products не добавлялись: соответствующих полей в текущей схеме service нет.
- Этап 3 не начат. Продолжать его в отдельном новом чате после проверки последней MD2 и актуального main.

## 2026-11-08 — Выпущена основная инструкция MD2 rev11

- В Library проекта Florial сохранён отдельный файл `/Florial/ИНСТРУКЦИЯ(2)_FLORIAL_АКТУАЛЬНАЯ_08-11-2026_rev11.md`.
- Фактический `created_at`: `2026-11-08T04:49:15Z`; номер редакции rev11 подтверждён поиском Library.
- Rev11 создана на основе rev10: сверху добавлена контрольная точка после завершения Этапа 2, ниже вся предыдущая редакция rev10 сохранена целиком. Rev10 и более ранние файлы не перезаписывались и не удалялись.
- Зафиксированы main commit `f23e80dc78910657547a996ff87c85b5075d6ac8`, PR #116–#118, Production deployment `407cef61-bc67-444f-ba84-48d46d99fcfa`, финальные smoke tests и подтверждённые владельцем тарифы Поморие 15 € / Кошарица 10 €.
- Документационные изменения GitHub для Этапа 2 подготовлены в PR #119; PR оставлен открытым до отдельного решения владельца о merge, поскольку merge запускает новый Production deployment.

## 2026-11-08 — Выпущена основная инструкция MD2 rev10

- В Library проекта Florial сохранён новый файл `/Florial/ИНСТРУКЦИЯ(2)_FLORIAL_АКТУАЛЬНАЯ_08-11-2026_rev10.md`.
- Редакция создана на основе rev9 с сохранением предыдущей инструкции и истории целиком; сверху добавлена контрольная точка после завершения Этапа 1 модели услуг и зон доставки Sanity.
- В rev10 зафиксированы GitHub main commit `938cdb132909106e5ff2a93407c81b8461fd265d`, PR #111–#114, результаты CI/Studio/Cloudflare Pages, 8 опубликованных service metadata и 30 deliveryZone drafts (0 published).
- Зафиксированы тарифные расхождения Поморие и Кошарица; обе зоны оставлены неактивными до решения владельца.
- В Library проверено фактическое создание файла: `created_at=2026-11-08T04:04:32Z`, номер редакции rev10. Старые файлы rev9 и ранее не перезаписывались и не удалялись.

## 2026-11-08 — ЭТАП 1 ЗАВЕРШЁН: модель услуг и deliveryZone в Sanity

- GitHub main base commit: `1de4822d54366ca8b38b750bf9cf979a087bc1b1`. Реализация схемы: PR #112 (merge `bc7ed03040a0639962c031508196062092f151bc`); совместимость существующих content blocks: PR #113 (merge `1de4822d54366ca8b38b750bf9cf979a087bc1b1`).
- GitHub Actions: Sanity Studio validation, Blog and Studio validation, D1 migration validation и Deploy Florial Sanity Studio run #89 завершились `success`. Cloudflare Pages check для текущего main commit также завершился `success`.
- Проверка Sanity Schema API подтвердила, что в действующей workspace `florial-admin` опубликованы поля service `sortOrder`, `serviceCategory`, `serviceLayout`; локализованные RU/EN `advantages`, `steps`, `leadForm`; расширенная BG leadForm; новый тип `deliveryZone`; локализованное `serviceContentBlock.translations.en/ru.imageAlt`.
- Все 8 существующих опубликованных услуг получили additive metadata и опубликованы: порядок 10–80, категории landscaping/planting/irrigation/lawn/maintenance, layout standard. Остальные поля не заменялись.
- Услуга монтажа в Несебър проверена после публикации: 14 `contentBlocks` сохранены.
- В Sanity Production созданы 30 draft-документов `deliveryZone` из действующей страницы доставки: локализованные BG/RU/EN названия, расстояния (км), текущие тарифы EUR, активность и sortOrder. Все 30 записей находятся в drafts; 0 опубликованных deliveryZone, поэтому текущая публичная страница не меняется.
- Две зоны намеренно оставлены `isActive=false` до подтверждения расхождений: Поморие — текущий код 15 €, ранее названо владельцем 20 €; Кошарица — текущий код 10 €, ранее названо владельцем 15 €. Другие текущие зоны и тарифы сохранены как в коде. Расстояния перенесены из текущей страницы и пока не являются независимо проверенными дорожными расстояниями.
- Обнаруженная ранее схема-несовместимость существующего `contentBlocks[].translations.en/ru.imageAlt` устранена аддитивным добавлением полей в `serviceContentBlock`; данные не удалялись.
- Runtime/frontend, публичные страницы услуг, `IrrigationSupportPage.tsx`, Header, меню, Footer, D1, заказы, checkout, Resend и Cloudflare secrets не менялись. Страница доставки остаётся на прежней реализации до Этапа 3.
- Следующий этап — Этап 2 (визуальные компоненты и страницы услуг). Этапы 2–6 остаются не начатыми.

## 2026-11-08 — Совместимость существующих переводов serviceContentBlock

- После аддитивного добавления новых полей в service и deliveryZone подготовка draft-изменений восьми услуг выявила существующее поле `contentBlocks[].translations.en/ru.imageAlt`, которое присутствует в документах, но отсутствовало в определении `serviceContentBlock`.
- Чтобы сохранить старые данные и разрешить публикацию drafts без потери информации, в `studio/schemaTypes/index.ts` добавлено необязательное локализованное поле `imageAlt` для EN/RU.
- Никакие значения `imageAlt` не удалялись и не переписывались. Drafts восьми услуг содержат только новые поля `sortOrder`, `serviceCategory`, `serviceLayout`; опубликованные документы пока не менялись.
- Изменение схемы аддитивное; PR ожидает validation и deployment существующей Studio.

## 2026-11-08 — Этап 1: расширение модели услуг и зон доставки Sanity (PR в работе)

- Текущий GitHub main перед этапом: `3a58b1412c949a6c4f9bd8bda33214b78045ced9`; рабочая ветка: `feature/services-sanity-model-2026-11-08`.
- Источник схемы — существующий `studio/schemaTypes/index.ts`; workspace `florial-admin` в dataset `production`. Используется существующая Studio `florial-admin-bg.sanity.studio`, appId `fdy0ldwl717qtp5pikl7715l`; новую Studio не создавать.
- В тип `service` добавлены необязательные поля `sortOrder`, `serviceCategory` (landscaping/planting/irrigation/lawn/maintenance/delivery) и `serviceLayout` (standard/delivery; initialValue только для новых документов).
- В существующие RU/EN translations добавляются локализованные `advantages`, `steps` и `leadForm` (title, submitLabel, successMessage, consentText, fields с name/type/label/placeholder/required). Корневая BG leadForm получает successMessage, consentText, placeholder и type поля. Существующие поля не переименовываются и не удаляются.
- Добавлен новый документный тип `deliveryZone`: BG name, string slug, RU/EN names and notes, distanceKm, feeEUR, BG note, isActive, sortOrder. Денежное поле явно хранит EUR; расстояние в километрах от Слънчев бряг.
- Live Sanity schema до этого изменения не содержала `sortOrder`, `serviceCategory`, `serviceLayout` в service и не содержала `deliveryZone`. Восемь опубликованных service documents найдены в published perspective; все активны. Поля/значения существующих документов не мигрировались.
- Специальная услуга монтажа в Несебър сохранена: документ `7ead4133-8f63-4381-bafe-493499fff5b8` содержит 14 существующих `contentBlocks`; никакие документы не редактировались.
- Сверка действующей страницы `src/pages/IrrigationSupportPage.tsx`: 30 зон/населённых пунктов с расстояниями и тарифами. Совпадают с ранее сообщёнными владельцем значениями Sunny Beach 0 €, Nessebar 10 €, Ravda 10 €, Sveti Vlas 10 €, Kableshkovo 15 €. Расхождения: текущий код Pomorie 15 € (владелец ранее указал 20 €); текущий код Kosharitsa 10 € (владелец ранее указал 15 €). Не исправлять автоматически. Дополнительные населённые пункты из текущего кода также должны быть сохранены при переносе. Расстояния берутся из текущей страницы и требуют подтверждения владельцем до публикации тарифов.
- В workflow `.github/workflows/sanity-studio.yml` PR validation только собирает два workspace; `.github/workflows/deploy-sanity-studio.yml` выполняет production schema deployment при push в main или ручном запуске. После merge требуется проверить оба workflow/deployment и фактический `get_schema`.
- На момент этой записи изменения ещё не объединены в main и deployed schema не обновлена. Sanity documents, D1, Cloudflare settings/secrets, Resend, frontend/runtime, Header/menu/Footer и Production content не менялись.

# Правило поиска и версионирования основной инструкции Florial (обязательно для каждого нового чата)

**Дата фиксации правила: 07.11.2026. История договорённости: 21.10.2026; подтверждение сохранения отдельных редакций: 03.11.2026.**

- Основная оперативная инструкция проекта хранится отдельными Markdown-файлами в Library проекта ChatGPT. Используется формат MD2 — файл семейства `ИНСТРУКЦИЯ(2).md`; «AMD» в устной формулировке означает именно MD/Markdown, не отдельный формат.
- В начале каждого нового чата и до любой технической работы обязательно найти все доступные редакции этой инструкции в Library, проверить метаданные `created_at` (дату создания) и номер `revN` в имени/заголовке. Выбрать редакцию с самой поздней датой создания; если дата совпадает — с наибольшим номером rev. Дата изменения файла сама по себе не заменяет дату создания. Не полагаться на историю чатов или память вместо проверки Library.
- Прочитать выбранную редакцию целиком либо все разделы, относящиеся к задаче, включая самый верхний блок актуальной контрольной точки и обязательный порядок работы. Проверить, нет ли более новой редакции или дополнения.
- После каждой существенной технической работы создавать **новый отдельный Markdown-файл** на основе последней редакции: `ИНСТРУКЦИЯ(2)_FLORIAL_АКТУАЛЬНАЯ_YYYY-MM-DD_revN.md`. В имени указывать фактическую дату создания новой редакции и следующий последовательный номер rev. Добавлять сверху новый блок контрольной точки и сохранять ниже всю предыдущую историю/разделы. Не перезаписывать и не удалять старые редакции.
- Новую редакцию сохранять в Library проекта. В GitHub не дублировать всю Library-инструкцию без необходимости: в `docs/TECHNICAL_PASSPORT.md` поддерживать это правило и актуальные технические факты; в `CHANGELOG.md` фиксировать факт выпуска новой редакции и кратко перечислять добавления.
- Если Library недоступна, дата создания или последовательность редакций не подтверждаются, прямо указать «НЕ ИЗВЕСТНО — нужно уточнить» и запросить нужный файл/доступ. Не выбирать редакцию только по догадке.
- После сохранения проверить фактическое имя, дату создания/путь и успешность загрузки новой редакции. В ответе сообщать номер rev, дату, место сохранения, GitHub commit и какие файлы изменены.

## 2026-11-07 — Усиление безопасности публичных API (Production опубликован)

### Публикация и инфраструктура
- PR #110 объединён в `main`; merge commit: `aa514f8997a3f4faeba35483e86d0ef558a061f5`.
- Cloudflare Pages project: `florial`; Production deployment: `1651e652-2ff5-45d4-a89e-b53addfb07e4`; deployment commit совпадает с merge commit. Все стадии `queued`, `initialize`, `clone_repo`, `build`, `deploy` завершились `success`.
- Production D1: `5fbb0e47-8439-493c-821a-6945eef7d8b2`. По явному разрешению владельца применена migration `0010_public_api_rate_limits`; marker в `schema_migrations` подтверждён (`2026-11-07 15:12:54`).
- Созданы `api_rate_limits(bucket_key, window_start, request_count, expires_at)` и индекс `idx_api_rate_limits_expires(expires_at)`. Migration аддитивная, существующие `orders`, `order_events`, `site_events` не изменяла.
- CI перед merge: workflow runs `42379786803` и `42379786810`; все jobs/steps завершились `success`. Cloudflare Production build `npm run build` и компиляция Pages Functions успешны.

### Публичные endpoints
- `POST /api/orders`: strict same-origin, JSON Content-Type, `Sec-Fetch-Site` validation, body limit 64 KiB, rate limit 5 requests / 15 minutes / IP.
- `POST /api/track`: те же проверки, body limit 4 KiB, rate limit 90 requests / minute / IP.
- Rate limiting хранит дневной SHA-256 digest значения `CF-Connecting-IP`, а не исходный IP. Digest — псевдонимизированный идентификатор, не считать его полной анонимизацией.
- При превышении лимита возвращается 429 с `Retry-After`; при отсутствии IP или недоступности D1 действует fail-closed (503). Случайная best-effort очистка просроченных bucket rows не должна блокировать запрос.
- API responses используют `Cache-Control: no-store`; размер тела ограничен до чтения/парсинга.

### HTTP headers и static assets
- `functions/_middleware.ts` добавляет `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`; HSTS `max-age=31536000` устанавливается для HTTPS.
- `public/_headers` задаёт security headers для статических ответов и `Cache-Control: public, max-age=31536000, immutable` для `/assets/*`.
- Данные правила конфигурации вошли в production deployment. Сырые HTTP response headers live-домена не удалось независимо получить используемым web-reader; фактический ответ каждого заголовка помечен как НЕ ПРОВЕРЕНО до проверки обычным HTTP-клиентом.

### Ограничения и последующие проверки
- Главная страница `https://florial-bg.com` открывается через доступный web-reader. Web-reader не предоставляет raw response headers и не выполняет безопасные POST-запросы к API; негативные проверки `/api/orders` и `/api/track` поэтому не выполнялись. Не создавать тестовые заказы/события в Production.
- Production build выдал warning о размере основного JS chunk: 789.57 kB до gzip / 201.36 kB gzip. Build успешен; code splitting — отдельная задача.
- CSP не включён до инвентаризации реальных внешних скриптов, изображений, шрифтов и API.
- Turnstile не включён: Cloudflare widget/sitekey/secret не настроены. При последующем внедрении хранить secret только в Cloudflare Pages secret, не в GitHub и не в клиентском bundle.
- Для полного закрытия аудита нужно проверить raw response headers и безопасные negative POST tests с заведомо неверным Origin без создания заказов/аналитических событий; отдельно выполнить проверку H1–H4 на страницах, затронутых изменениями от 05.11.2026.

## 2026-11-07 — Удалён дублирующий ключ category SEO

- В `src/lib/categorySeo.ts` удалено второе повторное объявление ключа `nipel-reduktiven-plastmasov-vanshna-rezba` из `additionalTerms`.
- Обе записи имели полностью идентичные значения `phrase.bg`, `phrase.ru`, `phrase.en`; оставлена первая запись. Отдельный ключ `nipel-plastmasov-vanshna-rezba` не изменялся.
- Проверена логика: `generateCategorySeo` получает локализованные термины через `TERMS[category.slug]`; затем использует существующие H1 или fallback, строит Meta Title и Meta Description. `Object.assign(TERMS, additionalTerms)` ранее повторно присваивал тому же slug то же значение, поэтому удаление второй записи не меняет SEO-вывод ни для BG, ни для RU, ни для EN.
- Sanity categories/documents, опубликованные SEO-поля, URL/slug, sitemap, D1, Cloudflare variables/secrets, Header, меню и Footer не менялись.
- Добавлен регрессионный тест `tests/category-seo.test.mjs`: проверяет BG/RU/EN генерацию для slug и подтверждает, что объявление slug встречается в `categorySeo.ts` ровно один раз.
- PR validation завершилась успешно: `Florial D1 migration validation` run `42376470863` — `npm ci`, lint, `npm run build`, Pages Functions syntax; `Blog and Studio validation` run `42376470827` — lint, unit tests, `npm run build`, migration syntax, read-only migration dry-run, Studio `npm ci` и build. Все шаги обоих workflow завершились `success`. Production не менялся: проверки выполнены в PR, merge и Production deployment не запускались.
- Изменение подготовлено в отдельной ветке; `main` и Production не изменяются до отдельного согласования merge.

## 2026-11-07 — Подтверждена новая Cloudflare Pages build command в Production

- Проверяемый GitHub main commit: `8aa11542feccde8fc8963f0840323da5795deec5`.
- Cloudflare Pages Production deployment: `dbdd20b5-02c5-4ee9-a019-13e63a9d978a`; все стадии `queued`, `initialize`, `clone_repo`, `build`, `deploy` — `success`.
- Build log подтвердил Node.js `22.23.4`, npm `10.9.9`, автоматическую установку по lockfile командой `npm clean-install --progress=false` и фактическую пользовательскую build command `npm run build`.
- Vite build завершился успешно (`built in 669ms`), затем Pages успешно опубликовал сайт. Это первая подтверждённая Production-сборка после переключения Cloudflare build command; lockfile не удалялся и повторный `npm install` не выполнялся.
- Остаётся предупреждение о дублирующемся ключе `nipel-reduktiven-plastmasov-vanshna-rezba` в `src/lib/categorySeo.ts:184` и `:211`. Сборка прошла; исправление отложено до отдельного сравнения обоих значений.
- Preview deployments отключены (`preview_deployment_setting=none`); последний Preview deployment удалён. Production branch `main` и Production deployments включены.
- Runtime-код, Sanity, D1, заказы, checkout, Header, меню, Footer и секреты не менялись.

## 2026-11-07 — Отключение Preview и стабилизация npm-сборки (PR #106)

- GitHub PR #106 `build: stabilize npm dependency installation` объединён методом squash; merge commit: `6cb33769641d91589772086bd9d78b1ada24bfa2`.
- Добавлены корневой `package-lock.json` и `studio/package-lock.json`, оба формата lockfileVersion 3. Lock-файлы сформированы в GitHub Actions из соответствующих `package.json`; исходные manifest-файлы не менялись.
- Добавлен корневой `.nvmrc` со значением `22`. Cloudflare build logs подтвердили Node.js `22.23.4` и npm `10.9.9`.
- В GitHub Actions `.github/workflows/blog-studio.yml`, `deploy-sanity-studio.yml`, `sanity-studio.yml`, `validate-d1-migration.yml` заменён `npm install` на `npm ci` в соответствующих корневых и Studio рабочих каталогах.
- Все три PR validation checks завершились `success`: D1 migration validation (npm ci, lint, Vite build, Pages Functions syntax); Sanity Studio validation (npm ci и build двух workspace); Blog and Studio validation (lint, unit tests, Vite build, syntax checks, read-only migration dry-run, Studio npm ci и build).
- Cloudflare Pages project `florial`: Production branch осталась `main`, Production deployments включены. Последний Preview deployment `bd5be887-9f69-4d29-b3b7-a005b012d28c` удалён; его alias относился только к ветке `fix/about-in-sitemap-2026-11-05`. Установка `preview_deployment_setting` изменена на `none`, поэтому новые Preview deployments автоматически не создаются. Старые исторические Preview deployments не удалялись массово.
- Cloudflare Pages build command изменена на `npm run build`; папка результата остаётся `dist`. Pages автоматически устанавливает зависимости до пользовательской build command. Build log deployment `1737c6de-8ab5-4180-9797-66a94e700a49` показал штатный install step `npm clean-install --progress=false`, но этот deployment был начат до обновления build command и затем выполнил старую пользовательскую команду. Поэтому он подтверждает успешную сборку merge commit, но **не является проверкой нового пользовательского build command**. Проверить новый command на следующем Production deployment.
- В build log остался предупреждающий duplicate object key `nipel-reduktiven-plastmasov-vanshna-rezba` в `src/lib/categorySeo.ts` (строки 184 и 211). Сборка успешна; код не менялся, предупреждение вынесено в отдельную задачу.
- Runtime-код сайта, Header, меню, Footer, корзина, checkout, D1 schema/data, Sanity schema/documents, заказы и секреты не менялись. Production deployment `1737c6de-8ab5-4180-9797-66a94e700a49` для commit `6cb33769641d91589772086bd9d78b1ada24bfa2` завершился `success`; это deployment merge commit до окончательной проверки новой build command.

### Открытые пункты после стабилизации

1. Подтвердить в следующем Production deployment, что Cloudflare использует пользовательскую команду `npm run build` после автоматического `npm clean-install`.
2. Отдельно решить, нужно ли удалять исторические Preview deployments; сейчас автоматическое создание новых Preview отключено.
3. Разобрать предупреждение duplicate key в `src/lib/categorySeo.ts` отдельным точечным изменением после проверки обоих значений и их назначения.
4. Legacy variable names в Cloudflare не удалялись. Supabase не использовать и не подключаться к нему; любой анализ старых упоминаний выполнять только статически в текущем GitHub source/config.

## 2026-11-07 — Read-only аудит GitHub, Cloudflare, D1 и Sanity (контрольная точка rev6)

- GitHub `main`: `730285f75d0ed049ab9b2ee210544eab5942d12d`; Cloudflare Pages Production deployment `ac8f035c-b4e7-4fc4-bc53-ec4e41329a42`, status `success`, deployed commit совпадает с main. Последние 10 Production deployments — success.
- С предыдущей контрольной точки `f40ab75e9cb5888891337e73b683aadde5e402d9` было 9 commits, все документационные; runtime-код не менялся.
- Sanity `production`: 275 products, 54 categories, 3 brands, 8 services, 22 blog posts. H1 BG/RU/EN заполнен у 82/275 products; BG Meta Title/Description — у 274/275. Это расходится с историческим snapshot rev5 (0 новых H1); источник заполнения 82 карточек НЕ ИЗВЕСТНО — нужно уточнить. Не запускать массовый apply автоматически. Category SEO 54/54 на BG/RU/EN.
- Sanity `plants`: 35 products, 17 categories; product SEO H1/Meta Title/Meta Description BG/RU/EN — 35/35. Portable Text descriptions BG 35/35, RU 34/35, EN 34/35. Отсутствующие переводы описания одной карточки не генерировать без решения владельца. Plant category SEO 17/17. Всего категорий 71/71.
- D1 database `5fbb0e47-8439-493c-821a-6945eef7d8b2`: фактический SQL catalogue содержит 11 application tables; применено 9 migrations `0001`–`0009`. Trigger `trg_orders_order_created` соответствует исправленной migration 0009. Сводные counts: orders 7 (3 non-test, 4 test), order_events 26, catalog_staff_profiles 2, catalog_submissions 8, catalog_stock_events 2, site_events 662. Non-test orders — 3 со статусом `new`; тестовые — `new`/`ready`. Один активный owner и один manager. Не читались персональные данные.
- Cloudflare D1 metadata API возвращает `num_tables=0`, хотя SQL catalogue показывает 11 application tables; для числа таблиц использовать SQL catalogue, а расхождение оставить как диагностическое.
- Legacy Supabase variable names всё ещё присутствуют в Cloudflare Production/Preview (включая `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`); значения секретов не раскрывались. Не удалять до полного статического аудита source, workflows и Cloudflare config и отдельного плана. Supabase не открывать и не использовать.
- Статический поиск в текущем repo не обнаружил активной Supabase SDK dependency, `src/lib/supabase.ts` или runtime references; текущий Sanity client — `src/lib/sanity.ts`, checkout/Manager работают через D1. Это не доказывает отсутствие косвенного/CI использования.
- Preview не эквивалентен Production: не обнаружены D1 binding `DB`, server secrets orders, Sanity API token, AI binding и Workflow service binding. Не копировать Production credentials в Preview; при необходимости проектировать изолированную тестовую среду.
- Pages build command: `rm -f package-lock.json && npm install && npx vite build`; корневой `package-lock.json` отсутствует. Текущая установка не фиксирует dependency graph. Воспроизводимость сборки требует отдельного плана; в рамках аудита pipeline не менялся.
- Все проверки были read-only. Код, настройки Cloudflare, D1 migrations/data, Sanity schemas/documents и Production не изменялись.

### Вопросы и отдельные задачи

1. Установить, каким процессом были заполнены H1 у 82 equipment products.
2. Завершить статический аудит legacy Supabase variable names в source, GitHub Actions и Cloudflare config; только затем рассматривать безопасное удаление переменных.
3. Решить, нужен ли изолированный Preview с отдельными D1/Sanity credentials и workflow bindings.
4. Отдельно диагностировать D1 metadata `num_tables=0`.
5. Подготовить отдельный план lockfile/build reproducibility.
6. Пометить старые документы с Supabase-инструкциями как исторический архив; не удалять их и не удалять migration files.
7. Live sitemap XML, фактическая индексация поисковиками и полный end-to-end Preview checkout этим аудитом не подтверждены: НЕ ИЗВЕСТНО — нужно уточнить.

## 2026-11-06 — Состояние SEO карточек растений после ручного заполнения

- Dataset Sanity `plants`: вручную подготовленные SEO-поля опубликованы для 35/35 карточек, на BG/RU/EN: корневые `seo.h1`, `seo.metaTitle`, `seo.metaDescription`; локализованные `translations.ru.seo.*` и `translations.en.seo.*`.
- Принцип ручного SEO: H1 — локализованное название и подтверждённый сорт/научное имя при необходимости, без географии и рекламных формул; Meta Title — название, одна разрешённая геолокация и бренд Florial, максимум 70 символов; Meta Description — коммерческая формулировка продажи, подтверждённая характеристика/применение, бренд и одна локация. BG/RU/EN — самостоятельные естественные локализации. Не использовать Созопол.
- Перед публикацией строковые поля `description` и `translations.*.description` преобразованы в Portable Text по существующему типу `richDescription` (обычный block + span). Исходный текст сохранён без редакторских изменений. Преобразованы только существовавшие строковые значения; отсутствующие RU/EN descriptions карточки «Маслина 3» не создавались.
- Published perspective подтвердил 35 карточек, полный набор SEO-полей на трёх языках, Meta Title до 70 символов и отсутствие черновиков этих документов. Это не меняло схему Sanity и не требовало frontend/Pages deployment.
- При последующих правках описаний растений использовать Portable Text структуру типа `richDescription`; не записывать строку напрямую в эти поля. Перед массовой публикацией проверять published perspective и сохранять исходные тексты при миграциях.

## 2026-11-06 — Сводная актуализация технической структуры и инструкции MD2 (rev5)

- Создана новая Library-редакция основной инструкции: `ИНСТРУКЦИЯ(2)_FLORIAL_АКТУАЛЬНАЯ_06-11-2026_rev5.md`. Предыдущая rev4 сохранена как историческая версия, не перезаписывалась.
- Главный актуальный источник структуры: этот файл `docs/TECHNICAL_PASSPORT.md`; журнал всех изменений: `CHANGELOG.md`; изменения схем Sanity: `studio/SCHEMA_CHANGELOG.md`.
- Репозиторий `omaraandrey-dev/florial`, branch `main`. Последний подтверждённый Production code deployment на контрольной точке: commit `f40ab75e9cb5888891337e73b683aadde5e402d9`, Cloudflare deployment `29bcf868-2447-4902-8f00-8a6158b696c7`, status success, aliases `https://florial-bg.com` и `https://www.florial-bg.com`. После синхронизации документов rev5 main commit `0e067562c14f4c24ee1b62e56ed6f77aa101d164` также прошёл Cloudflare Pages build/deploy: deployment `6231673f-cf91-4c73-9ca0-8ba5f93cbf26`, status success, те же production aliases. Этот последний commit содержит только документационные изменения; runtime-код не менялся.
- В Production опубликован единый product SEO код и schema для equipment (`production`) и plants (`plants`), BG/RU/EN. Sanity schema подтверждена read-only в обеих workspace. В Manager есть owner-only preview/apply, серверная запись защищена revision guard и явным подтверждением.
- Массовое заполнение новых product H1/Meta Title/Meta Description не выполнялось; документы Sanity не изменялись. Текущий этап заполнения — только после preview и отдельного подтверждения владельца.
- SEO категорий и локализованные helpBlock опубликованы для всех 71 категорий (54 equipment + 17 plants); 213 локализованных SEO-наборов BG/RU/EN подтверждены. Это отдельный процесс от product SEO.
- Внесены и задокументированы: локализованные title/ALT изображений категорий и полное отображение изображений через `object-contain`; единая структура заголовков главной и Footer; crawlable DOM бургерного меню после запуска React; локализованная About в sitemap; исправление BG noIndex источника для plant products.
- Ограничения проверки: live XML sitemap и фактическая переиндексация поисковиками не подтверждены. Наличие ссылок в DOM меню не означает их присутствие в исходном HTML до запуска JavaScript.
- Supabase остаётся полностью запрещённым для любых подключений и операций. Использовать только Cloudflare D1, Sanity, Pages Functions/Workers и Resend по их текущей роли.

---
## 2026-11-05 — Исправлен источник BG noIndex в plant sitemap query (main; Production deployed)

- В `functions/sitemap.xml.ts`, GROQ query `plantProducts`, болгарский флаг исключения URL из sitemap читается из корневого поля `seo.noIndex`. Это соответствует текущей модели данных товара и использованию SEO на публичной странице.
- RU/EN условия не менялись и продолжают читать локализованные `translations.ru.seo.noIndex` и `translations.en.seo.noIndex`.
- Изменение точечное: только источник поля в проекции sitemap. Никакие Sanity документы, товары, категории или другие данные не изменялись.
- Кодовый commit: `a6e0b33a09d181f59c2e1b6500199074964d193a`; CHANGELOG commit: `3b5795f23e5d9a52588cc8564a7d28aba155e0aa`.
- GitHub Actions run `42079947210` для итогового commit `d820577ed675f684d38b18b186e93d4fe5b4bb89` завершился `success`: Install dependencies, Lint, Build website и Syntax-check Pages Functions — все шаги успешны. Cloudflare Pages Production deployment `d435d877-77de-44ef-96eb-19fa1dcb797f` для этого commit завершился `success`; aliases включают `https://florial-bg.com` и `https://www.florial-bg.com`. Прямое чтение `https://florial-bg.com/sitemap.xml` доступным web-инструментом завершилось ошибкой доступа, поэтому фактическое содержимое live XML и количество URL НЕ ПОДТВЕРЖДЕНЫ.
- Тестового набора для sitemap в репозитории не обнаружено; имеющиеся unit tests покрывают product SEO и rich text utilities. Production deployment latest main подтверждён; фактическое содержимое live XML и количество URL остаются НЕ ПОДТВЕРЖДЕНЫ из-за ошибки чтения sitemap внешним инструментом.

## 2026-11-05 — Страница About добавлена в XML sitemap (main; Production deployed)

- В `functions/sitemap.xml.ts` в статический список включён маршрут `/about`.
- Используется существующий `addLocalizedUrls`: BG `/about`, RU `/about?lang=ru`, EN `/about?lang=en`; для вариантов генерируются hreflang alternates и x-default.
- Изменён только генератор sitemap. Страница About, маршрутизация приложения, Header, меню, Footer, Sanity, D1 и другие данные не менялись.
- Изменение внесено непосредственно в `main`: кодовый commit `8fb68fafb52a0d0fb582ddd99b6b185eacf4e391`; запись CHANGELOG — `b3688a7145722e558b500fdb7527add2b779ae91`.
- Production deployment подтверждён: latest main commit `f40ab75e9cb5888891337e73b683aadde5e402d9`, deployment `29bcf868-2447-4902-8f00-8a6158b696c7`, aliases `https://florial-bg.com` и `https://www.florial-bg.com`.
- PR #105 создан ошибочно в feature-ветке и не объединён; маршрут `/about` уже находится в main. Не объединять PR #105 как повтор без проверки его diff.
- Содержимое live XML и фактическое количество URL отдельно не подтверждены: доступный инструмент не смог прочитать `https://florial-bg.com/sitemap.xml`; требуется отдельная проверка HTTP/XML и hreflang.

## 2026-11-05 — Единый SEO-стандарт карточек товаров (PR #104 merged; Production deployed; массовое заполнение pending)

- Feature branch: `feature/product-seo-standard-2026-11-05`; изменения подготовлены отдельно от `main`. PR #104 объединён в `main` commit `4d1957f190f1676b1de688c376698043c3d1978e`. Cloudflare Pages Production deployment `22e6631b-af13-4818-97df-22317c83c816` завершился успешно; production aliases `https://florial-bg.com` и `https://www.florial-bg.com`.
- Стандарт действует для обоих каталогов: поливочное оборудование (`production`) и растения (`plants`), для языков BG/RU/EN.
- Meta Title: формат `Название товара | Геолокация | Градински център Флориал`; максимум 70 символов. Если полный бренд не помещается, используется короткое «Флориал» / «Florial». При необходимости длинное название сокращается только по границе целого слова; H1 и Meta Description сохраняют полное название.
- Meta Description начинается с сообщения о продаже (BG «Продажба на», RU «Продажа:», EN «For sale:»), включает краткую подтверждённую характеристику, локализованное название садового центра Florial и одну географическую привязку. География: Несебър, Равда, Слънчев бряг, Свети Влас, Поморие, Бургас, Ахелой, Каблешково, Кошарица. Созопол/Sozopol исключён из генератора.
- Добавлен отдельный тип Sanity `productSeoFields`: H1, Meta Title, Meta Description, noIndex и keywords. Он используется только в карточках товаров и их языковых версиях; общий `seoFields` других типов документов и `categorySeoFields` не изменяются. Поля растений `seo.title` и `seo.description` сохранены как скрытые legacy-поля; значения не удаляются и не перезаписываются.
- `src/lib/productSeo.mjs` — общий детерминированный генератор активных полей. Он сначала ищет разрешённую геолокацию в описаниях товара и существующих SEO-текстах, выбирает первое упоминание; если географии нет, распределяет города по стабильному порядку документов. В Meta Description удаляются дублирующие геофразы, но сохраняются характеристики товара; предложения с исключённым Созополом не переносятся. Переводы генерируются только там, где есть локализованное название товара.
- `src/pages/ProductPage.tsx` выводит заданный локализованный H1; до заполнения H1 используется название товара. Существующие plant SEO title/description остаются fallback для метатегов.
- `src/App.tsx` добавляет `seo` в проекцию plant product. `functions/_middleware.ts` выводит product H1 в серверном HTML до запуска React и сохраняет существующий fallback metaTitle/metaDescription.
- В Florial Manager добавлена вкладка «SEO товаров», доступная только роли owner. API `functions/api/manager/product-seo.ts` использует D1-backed Manager auth, читает опубликованные товары из Sanity и записывает активные поля партиями с `ifRevisionID`; `SANITY_API_TOKEN` используется только на сервере Cloudflare. Новых D1 migrations и разрешений не требуется.
- Сначала Manager показывает preview. Массовая запись выполняется только после отдельного нажатия владельцем и подтверждения в браузере; она заменяет текущие H1/Meta Title/Meta Description, но сохраняет legacy SEO растений, noIndex и keywords. Текущая разработка не записывала документы Sanity.
- Read-only проверка Content Lake до изменений: `production` — 275 товаров, у 274 были metaTitle/metaDescription, H1 отсутствовал у всех; `plants` — 35 товаров, у 34 были legacy title/description, новых metaTitle и H1 не было. EN/RU названия и краткие описания: equipment 275/275, plants 34/35.
- В каталоге оборудования есть названия длиной до 77 символов; для Meta Title генератор сохраняет модель/начало названия, сокращая хвост только по границе слова, если иначе невозможно уложиться в 70 символов. Полный H1 и Meta Description не сокращаются по этому правилу.
- Затронутые файлы: `src/lib/productSeo.mjs`, `src/lib/productSeo.d.ts`, `tests/product-seo.test.mjs`, `functions/api/manager/product-seo.ts`, `src/manager/ProductSeoManager.tsx`, `src/manager/ManagerApp.tsx`, `studio/schemaTypes/index.ts`, `src/types.ts`, `src/App.tsx`, `src/pages/ProductPage.tsx`, `functions/_middleware.ts`, `docs/TECHNICAL_PASSPORT.md`, `CHANGELOG.md`, `studio/SCHEMA_CHANGELOG.md`.
- CI: GitHub Actions workflow #437 успешно выполнил lint, unit tests, Vite build, Pages Functions syntax, read-only migration dry-run и Studio build; Sanity Studio validation workflow #100 успешно собрал обе workspace. D1 validation workflow #392 завершился успешно; D1 schema не менялась.
- Read-only `get_schema` после merge подтвердил `productSeoFields` в обоих активных workspace: dataset `production` / workspace `florial-admin` (schemaId `_.schemas.florial-admin`) и dataset `plants` / workspace `plants` (schemaId `_.schemas.plants`). В типе подтверждены `h1`, `metaTitle` с warning max 70, `metaDescription`, а legacy `title`/`description` сохранены hidden/readOnly. Используется существующая Studio; третья Studio не создавалась.
- Sanity documents не изменялись; массовая запись новых SEO-полей не запускалась.
- Read-only D1 check: `catalog_staff_profiles` содержит 1 активный `owner` и 1 активный `manager`; owner-only вкладка SEO доступна существующему владельцу.
- На этом этапе не затронуты Header, меню, Footer, категории, URL, sitemap, корзина, checkout, заказы и D1-схема. `productSeoFields` опубликован в обеих существующих workspace; подтверждены `h1`, `metaTitle`, `metaDescription`, `noIndex`, `keywords` и скрытые read-only legacy `title`/`description`. PR #104 объединён и Production deployment выполнен. Документы Sanity не изменялись; массовая генерация/запись новых SEO-полей остаётся отдельным действием владельца через Manager после preview и явного подтверждения.
- Read-only контрольная точка до массового заполнения: `production` — 275 товаров, `plants` — 35. Старые metaTitle/metaDescription имелись у 274/275 товаров оборудования; legacy title/description — у 34/35 растений. RU/EN локализованные названия и shortDescription доступны у 275/275 equipment и 34/35 plants. H1 не заполнены; массовая запись не выполнялась.

## 2026-11-05 — Семантическая иерархия заголовков главной страницы и Footer

- На главной странице сохранять иерархию: H1 — главный заголовок сайта; H2 — подзаголовок о профессиональном ландшафтном дизайне, растениях и поливной технике; H3 — «Профессионални решения за градината», «Растения за вашата градина», «Продажба на поливно оборудване» и «Блог и портфолио».
- Под заголовками секций H3 использовать H4 для карточек категорий растений, категорий оборудования и заголовков отдельных публикаций блога. Категории оборудования уже размечены H4 и должны оставаться H4.
- Заголовки карточек услуг в секции «Профессионални решения за градината» остаются H4.
- Общий Footer отображается на всех страницах: «За нас» — H2; «Контакти» и заголовок социальных сетей («Последвайте ни» / локализованные варианты) — H3. Заголовок верхнего CTA-блока контактов остаётся H3.
- При локализации BG/RU/EN менять только текст, не уровень заголовка. Не использовать уровни заголовков ради размера шрифта; визуальный размер задаётся CSS-классами.
- Это семантическая правка HTML без изменения внешнего вида, текста, порядка блоков, ссылок, стилей, меню, Header или данных Sanity.

## 2026-11-05 — SEO-доступность ссылок бургерного меню

- В `src/components/Header.tsx` основная навигация и панели четырёх групп («Растения», «Поливни системи», «Услуги», «Портфолио») должны постоянно присутствовать в React DOM после монтирования Header; не оборачивать их в условный рендеринг по `isMenuOpen` или состояниям раскрытия групп.
- Видимость меню и каждой панели управляется нативным атрибутом `hidden`, а интерактивное состояние остаётся управляемым существующими React state. Это сохраняет закрытый вид меню, не меняет дизайн и позволяет анализаторам DOM находить ссылки без клика по бургеру и аккордеонам.
- Для кнопки бургера и кнопок групп используются согласованные `aria-controls` и стабильные ID соответствующих контейнеров; `aria-expanded` отражает реальное состояние. Ссылки остаются обычными `<a href>` с текущими обработчиками SPA-навигации.
- Не менять порядок, подписи, маршруты, правила сортировки, локализацию `localizedHref` (BG без параметра, RU/EN с `?lang=ru` / `?lang=en`), обработчики переходов и визуальные классы при последующем расширении меню.
- Категории, услуги и последние публикации загружаются динамически; ссылки появляются после получения соответствующих данных. При проверке дождаться загрузки Sanity-категорий/услуг и списка публикаций, затем проверять DOM до открытия меню.
- Важно: Florial использует клиентский React SPA. Это изменение обеспечивает наличие ссылок в DOM после выполнения React-кода, но не добавляет навигацию в исходный серверный HTML до запуска JavaScript. Для требования доступности ссылок в сыром HTML без JS потребуется отдельная архитектурная задача SSR/prerender; не решать её в рамках правки Header.
- При проверке всех локалей использовать BG, RU и EN; проверить DOM до клика, видимость/раскрытие меню, клавиатурную доступность, обычные и модифицированные клики, а также сохранение адресов ссылок.
- Область изменения: только `src/components/Header.tsx`, `docs/TECHNICAL_PASSPORT.md` и `CHANGELOG.md`. Не менялись Header CSS, Footer, App routing, Sanity, Cloudflare D1, middleware, sitemap, товары или данные.
- Проверка Cloudflare Pages Preview для commit `f481c6eac45ffec184116e24d48884204ed33168`: build и deploy завершились успешно; Preview URL `https://480e6a1c.florial.pages.dev` (deployment `480e6a1c-7f1b-451a-88cb-1db8159487fe`).
- После ожидания загрузки данных HTML/DOM Preview содержал 45 ссылок внутри nav до открытия меню: 17 plant-category, 11 irrigation-category, 10 service, 4 blog, плюс Начало/За нас/Контакти. Проверка повторена для BG/RU/EN: HTTP 200 и 45/45 ссылок на каждой версии; все RU-ссылки имеют `?lang=ru`, все EN-ссылки — `?lang=en`, BG-ссылки без языкового параметра.
- Первая Preview-сборка выявила лишний закрывающий JSX `div`; ошибка исправлена в commit `f481c6e`, после чего Preview build/deploy прошли успешно. Локальные `npm run lint` и `npm test` отдельно не запускались; Cloudflare Pages build command выполнял `npm install` и `npx vite build`.
 
## 2026-11-05 — SEO категорий и Manager (PR #92 merged; Production deployed; редакционные данные опубликованы)

- Feature branch: `feature/category-seo-generator-manager-2026-11-05`.
- Общий модуль `src/lib/categorySeo.ts` формирует предложения H1, Meta Title и Meta Description для BG/RU/EN. Для болгарского Meta Title используется бренд «Флориал», для RU/EN — «Florial». Словарь включает реальные slug категорий из Sanity: 54 категории оборудования в dataset `production` и 17 категорий растений в dataset `plants`.
- Функция `resolveCategorySeo` выбирает только утверждённые live SEO-поля; предложения `suggested` не используются на публичных страницах до отдельного утверждения.
- `CategoryPage.tsx` и `functions/_middleware.ts` используют общий resolver, поэтому React DOM и серверный HTML показывают один и тот же утверждённый H1/Meta Title/Meta Description. URL, canonical и hreflang-логика не меняются.
- Manager получает вкладку «Категории» и два режима: `all` — обновить предложения для всех категорий; `missing` — создать только те поля, где одновременно пусты утверждённое значение и сохранённое предложение.
- `functions/api/manager/category-seo.ts` обрабатывает по четыре категории за запрос, читает опубликованные категории из двух Sanity datasets и записывает только вложенные поля `seo.suggested` / `translations.ru.seo.suggested` / `translations.en.seo.suggested`. Для записи используется `SANITY_API_TOKEN` только на сервере Cloudflare и `ifRevisionID` для защиты от параллельного изменения документа.
- Добавлено разрешение `canManageCategorySeo` в серверный список разрешений и интерфейс назначения прав. Владелец имеет полный доступ; менеджер — только после назначения права; продавец не получает это право. D1 schema migration не нужна.
- Генератор первой версии — детерминированный локальный словарь/правила, не внешний AI API. Подтверждённая конфигурация AI binding для SEO не обнаружена; платные интеграции не добавлялись.
- Read-only запрос Sanity подтвердил: dataset `production` — 54 категории; dataset `plants` — 17 категорий. Никакие документы Sanity не записывались этим этапом.
- Предложения просматриваются и редактируются в Sanity Studio (`https://florial-admin-bg.sanity.studio/`) в объекте `seo.suggested` для каждой языковой версии. После проверки редактор вручную переносит одобренные значения в активные поля `h1`, `metaTitle`, `metaDescription`; изменение `suggested.status` само по себе не публикует SEO. Публичный сайт использует только активные поля.
- В Manager заголовок раздела локализован на болгарский: «Работа с категории».
- CI (lint, tests, website build, Pages Functions syntax, migration dry-run и Studio build) и Cloudflare Pages Preview завершились успешно. PR #92 объединён в `main`; код включён в Production deployment `29bcf868-2447-4902-8f00-8a6158b696c7` для commit `f40ab75e9cb5888891337e73b683aadde5e402d9`.
- Редакционные SEO-данные опубликованы для всех 71 категорий: 54 оборудования и 17 растений, 213 наборов BG/RU/EN с H1, Meta Title, Meta Description и keywords. Переиндексация Google и отдельный live HTML audit не подтверждены.
- Не затронуты Header, меню, Footer, маршруты, каталог, товары, цены, корзина, checkout и Cloudflare D1 данные.

## 2026-11-05 — Публикация схемы SEO категорий

- PR #91 объединён в main, merge commit: `64249cdf595f2bb9b9ca25bbe0b35ba8f8f41eae`.
- Существующая Studio опубликована штатным GitHub Actions workflow `.github/workflows/deploy-sanity-studio.yml` с помощью Sanity CLI и настроенного в `studio/sanity.cli.ts` appId.
- Workflow завершился успешно; CLI подтвердил публикацию обеих рабочих областей: `Deployed 2/2 schemas`, затем `Success! Studio deployed`.
- Действующий URL: https://florial-admin-bg.sanity.studio/
- `categorySeoFields` проверен через Sanity schema API в dataset `production` и dataset `plants`. Общий `seoFields` товаров и услуг сохранён без изменений.
- Публикация схемы не записывала и не мигрировала документы Sanity. Значения H1/Meta Title/Meta Description для категорий пока не генерировались и не заполнялись.
- `.github/workflows/sanity-studio.yml` выполняет только валидацию/сборку; production deployment остаётся в единственном штатном `deploy-sanity-studio.yml`.

## 2026-11-05 — Единая схема SEO категорий (этап 1)

- Добавлен отдельный тип `categorySeoFields`, используемый только категориями оборудования в dataset `production` и категориями растений в dataset `plants`. Общий `seoFields` для товаров, услуг и других документов не менялся.
- Для каждой языковой версии категории предусмотрены утверждаемые поля `h1`, `metaTitle`, `metaDescription`; сохранены существующие `noIndex` и `keywords`.
- Добавлен отдельный объект `suggested` для чернового предложения: H1, Meta Title, Meta Description, дата генерации, версия генератора и статус `needsReview/approved`. Предложения не подменяют действующие SEO-поля.
- Схема аддитивная по структуре данных: документы Sanity не мигрировались и не записывались. Публикация Studio и массовое заполнение категорий не выполнялись.
- Для этой проверки в `.github/workflows/sanity-studio.yml` добавлена валидация сборки Studio при открытии/обновлении PR в `main`; workflow только собирает обе Studio и не выполняет deployment.
- Не затронуты frontend, middleware, URL категорий, Header, меню, Footer, каталог товаров, корзина, checkout и Cloudflare D1.


## 2026-11-05 — Корневое SEO для категорий растений (BG)

- Для Sanity dataset plants в schema plant category добавлено корневое поле seo типа seoFields, чтобы редактор мог задавать SEO болгарской страницы. SEO английской и русской версий по-прежнему хранится в translations.en.seo и translations.ru.seo.
- GROQ-запрос plantCategoryQuery выбирает root seo; CategoryPage уже выбирает root SEO для BG и локальный SEO-объект для EN/RU. Существующие документы не менялись и не мигрировались.

## 2026-11-05 — Метаданные изображений категорий и локализованный SEO

- Для двух типов Sanity category (оборудование в dataset production и растения в dataset plants) в исходной Studio schema добавлены image.title/titleEn/titleRu. Поля image.alt/altEn/altRu сохранены; другие типы изображений не расширялись.
- Frontend GROQ projections передают шесть локализованных полей изображения в CategoryItem. Общий helper src/lib/categoryImageSeo.ts выбирает значение текущего языка: ALT использует редакторское значение или локализованное имя категории; title остаётся пустым, пока редактор его не заполнит.
- Homepage category cards и subcategory cards используют локализованные ALT/title. Для внешнего URL изображения категории растений метаданные по-прежнему задаются в объекте image документа категории.
- CategoryPage использует root SEO для BG и translations.en/ru.seo для EN/RU; noIndex также берётся из SEO объекта выбранной локали. В последующем дополнении для plant categories добавлено корневое поле seo, поэтому BG-страницы растений также могут иметь полноценные редакторские meta title/description и noIndex.
- Изменение кода не записывает документы Sanity. После merge требуется проверить workflow публикации существующей Studio и deployed schema обоих datasets. Не запускать массовое заполнение ALT/title без отдельного решения владельца.
- Не затронуты Header, меню, Footer, каталог товаров, корзина, checkout, D1 и заказы. Файл ИНСТРУКЦИЯ(2).md в корне GitHub main отсутствует; использован актуальный docs/TECHNICAL_PASSPORT.md.
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
- Дополнительно проверен сам Sanity imageAsset: `originalFilename=florial-logo-gardencenter.png`, asset title и description на BG заполнены, `altText` отсутствует. GROQ запрашивает asset-level title/description/altText; Header использует asset alt/title как fallback, если локализованные поля photo document не заполнены.
- Middleware задаёт локализованный `og:image:alt` для стандартного логотипа; если страница передаёт собственное OG-изображение, используется заголовок этой страницы.
- PR/production deployment и Studio schema deployment не считаются завершёнными до проверки GitHub Actions и фактических статусов сервисов.


## 2026-11-05 — Published photo ALT/title metadata

- Sanity `photo` schema now includes `title` (BG), `titleEn` (EN), `titleRu` (RU), plus nested `image.alt`, `image.altEn`, `image.altRu`. Frontend renders localized logo ALT/title for the active locale.
- Existing BG `seoDescription` remains unchanged; no EN/RU SEO-description fields were added.
- Official Florial logo document `bf2d25a6-cefe-4d25-9145-3b45a206299b` was published with all six localized ALT/title values. Existing BG content was preserved.
- PR #88 merged to `main` at `9faeef8a9daf60258e3bf59483099d14cb1f8320`; Cloudflare Pages production deployment `efa67989-b723-468b-88ea-7036e9b77715` completed successfully.


## 2026-11-05 — Редакционный стандарт SEO категорий BG/RU/EN и массовая публикация

### Подтверждённое состояние Sanity

- Выполнена редакционная генерация SEO для всех опубликованных категорий двух каталогов: 54 категории оборудования в dataset `production` и 17 категорий растений в dataset `plants`.
- Всего обработана 71 категория × 3 языка = 213 локализованных SEO-наборов.
- Для каждой языковой версии заполнены H1, Meta Title, Meta Description и keywords.
- Активные поля опубликованы: BG — `seo.h1`, `seo.metaTitle`, `seo.metaDescription`, `seo.keywords`; EN — `translations.en.seo.*`; RU — `translations.ru.seo.*`.
- Также сохранены редакционные предложения `seo.suggested` и локализованные `translations.en/ru.seo.suggested` с `generatorVersion: "assistant-editorial-v1"` и статусом `approved`.
- Read-only проверка опубликованной перспективы Sanity после публикации подтвердила наличие всех четырёх полей для BG/EN/RU у всех 71 категорий. Незавершённых наборов не обнаружено.
- Проверенные диапазоны: Meta Title — 14–58 символов; Meta Description — 57–153 символа. Это техническая проверка длины, а не гарантия позиций в Google.
- При записи обнаруживались validation warnings на отдельных старых полях документов (например, legacy `seoTitle`, `seoDescription`, `order`). Эти поля не удалялись и не переписывались. Никакие товары, цены, категории, slug, изображения, noIndex или другие бизнес-данные не менялись.
- Примеры проверенных локализованных H1: `rotorni-razprskvachi` — BG «Роторни разпръсквачи за средни и големи тревни площи», EN «Rotor Sprinklers for Medium and Large Lawns», RU «Роторные дождеватели для средних и больших газонов»; `maslini` — BG «Маслинови дървета за градината, двора и терасата», EN «Olive Trees for Gardens, Yards and Terraces», RU «Оливковые деревья для сада, участка и террасы».

### Редакционный стандарт для будущей генерации

1. Болгарский — основной исходный язык и коммерческая версия. Сначала создаётся полноценный естественный болгарский текст, затем EN и RU адаптируются по смыслу, а не переводятся дословно.
2. Перед написанием изучаются фактические данные категории: название, slug, родительская категория, описание, локализованные данные, реальные товары, бренды, характеристики, совместимость и соседние категории. Не придумывать ассортимент, технические свойства, наличие или применение.
3. Для каждой локали готовятся:
   - H1: точное название категории с понятным назначением и естественной поисковой формулировкой;
   - Meta Title: целевой диапазон 45–60 символов, уникальный и ориентированный на запрос;
   - Meta Description: ориентир 120–155 символов, максимум 160, с конкретной пользой и коммерческим намерением без повторов;
   - 5–8 релевантных keywords/ключевых фраз, без механического набора синонимов.
4. Использовать отраслевую терминологию:
   - BG: «автоматични поливни системи», «разпръсквачи», «роторни разпръсквачи», «статични разпръсквачи», «дюзи», «електромагнитни клапани», «контролери», «капково напояване», «тръби и фитинги», «маслинови дървета», «декоративни растения».
   - EN: “automatic irrigation systems”, “rotor sprinklers”, “spray sprinklers”, “solenoid valves”, “irrigation controllers”, “rotary nozzles”, “drip irrigation”, “irrigation fittings”, “olive trees”, “ornamental plants”.
   - RU: «системы автоматического полива», «роторные дождеватели», «статические дождеватели», «форсунки», «электромагнитные клапаны», «контроллеры полива», «капельный полив», «трубы и фитинги», «оливковые деревья», «декоративные растения».
5. Географические слова Болгарии (Бургас, Несебър, Слънчев бряг, Свети Влас, Поморие, Равда, Созопол и другие зоны обслуживания) добавлять только там, где они действительно усиливают релевантность страницы. Не добавлять географию автоматически во все категории.
6. SEO разных категорий должно отличаться по ассортименту и назначению. Не использовать один общий шаблон для всех фитингов или растений, если доступные данные позволяют описать конкретную категорию точнее.
7. Не обещать характеристики, совместимость, профессиональный результат или наличие, если это не подтверждено источником. Если данных недостаточно, писать нейтрально и фиксировать вопрос для владельца.
8. Перед публикацией проверять естественность болгарского, качество адаптации EN/RU, уникальность, соответствие фактическому каталогу, длины метаданных и отсутствие спама.

### Разделение программного и редакционного генераторов

- Программный генератор `src/lib/categorySeo.ts` (PR #92, merge commit `7dbc7e47f22a5f3aa8267fdde52963274ae7614d`) — детерминированный словарь и набор правил. Он предназначен для быстрого создания базовых предложений и заполнения пропусков; сам по себе не эквивалентен полноценному редакционному анализу ассортимента.
- Редакционный процесс `assistant-editorial-v1` использует содержимое категории и доступный контекст каталога, формирует более индивидуальные тексты и адаптации на трёх языках. Результат текущей массовой работы уже опубликован в Sanity; это не означает, что программа автоматически научилась воспроизводить редакционное качество.
- При развитии программного генератора стремиться к контекстной генерации с учётом реальных товаров, брендов, характеристик, категорий-родителей и географии. Не подключать платный AI API и не добавлять секреты/переменные без отдельного решения владельца.
- Для обычного запуска генератора в Manager сохранять результат сначала в `seo.suggested`; активные SEO-поля не перезаписывать. Публикация активных полей выполняется только после явного разрешения владельца и проверки результата. Исключение — массовая публикация 05.11.2026, для которой владелец дал прямое поручение.
- Рекомендуемые рабочие режимы: (1) полная генерация предложений для всех категорий; (2) заполнение только пустых полей; (3) сравнение программного результата с редакционным эталоном. В режиме «пустые поля» нельзя затирать уже существующее активное или предложенное значение.

### Ограничения проверки

- Подтверждено содержимое опубликованных документов Sanity. Отдельная проверка итоговых HTML meta-тегов на live-домене и переобход страниц Google в рамках этой операции не выполнялись.
- Успешная запись Sanity сама по себе не подтверждает завершение нового Cloudflare Pages deployment или обновление поискового индекса.
- Для редакционного контроля приоритетно повторно проверять категории с однотипным ассортиментом (особенно группы фитингов и редких комплектующих), категории без описаний и категории с близкими названиями.

### Правило для следующих чатов

Перед SEO-задачей прочитать этот раздел и актуальные исходники `src/lib/categorySeo.ts`, `src/pages/CategoryPage.tsx`, `functions/_middleware.ts`, Manager endpoint `functions/api/manager/category-seo.ts` и текущие Sanity schema/query. Не полагаться на старые числа категорий: пересчитать опубликованные документы в обоих datasets. Не подключаться к Supabase — действующая SQL-инфраструктура Florial использует Cloudflare D1.


## 2026-11-05 — Локализованный блок консультации на страницах категорий

- Общий `helpBlock` поддерживается для категорий поливочного оборудования в Sanity dataset `production` и категорий растений в dataset `plants`.
- Структура: `title`, `text`, `buttonLabel` на болгарском; `translations.en/ru` для этих трёх полей; `buttonUrl` — единый относительный внутренний адрес услуги или статьи.
- Frontend отображает блок для обоих типов категорий. Для растений используется отдельный резервный маршрут `/services/zasazhdane-na-rasteniya`, для оборудования — `/services/avtomatichno-napoyavane`.
- Разрешённые пользовательские маршруты кнопки: только относительные пути с префиксом `/services/` или `/blog/`; внешние URL не принимаются.
- GROQ-запросы обеих коллекций должны включать `helpBlock`. Новые тексты заполняются отдельно для каждой категории на BG/RU/EN. CTA выбирается по существующей релевантной статье или услуге; если профильная статья ещё не создана, используется общая услуга. Для будущих статей о посадке отдельных видов растений достаточно обновить `helpBlock.buttonUrl` соответствующей категории.
- Массовое заполнение документов выполняется только после проверки schema deploy для обоих datasets. Существующие значения и SEO-поля не должны перезаписываться.


## 2026-11-05 — Текущее состояние локализованных блоков помощи категорий

- PR #94: `d0e526b8361ef860b63f2a5c821b5f39db55eed1`; production Cloudflare Pages deployment `6491a004-a7ea-4810-8b84-607057a2f4f9` — `success`.
- Sanity datasets: `production` — 54 категории оборудования; `plants` — 17 категорий растений. Все 71 опубликованные категории имеют заполненный `helpBlock` на BG/RU/EN.
- Структура блока: BG `title`, `text`, `buttonLabel`; `translations.en/ru` для тех же трёх полей; `buttonUrl` — относительный внутренний адрес `/services/*` или `/blog/*`.
- Frontend отображает блок и для поливочного оборудования, и для растений. Plant categories GROQ projection включает `helpBlock`. Локализация ссылки выполняется через `localizedHref`.
- Проверенные CTA: монтаж/ремонт разпръсквачи, монтаж/настройка програматори, монтаж/обслуживание клапани, капково напояване, общо автоматично напояване, засаждане на растения и статья за маслини.
- Для `palmi-yuki` и других категорий без профильной статьи используется `/services/zasazhdane-na-rasteniya`. После создания статей о технологии посадки конкретных видов заменить `helpBlock.buttonUrl` у соответствующих категорий.
- Проверка published perspective: equipment 54/54, plants 17/17; все обязательные локализованные поля и URL заполнены. Существующие SEO, изображения, цены, описания и продуктовые документы не изменялись.


## 2026-11-05 — Обязательный стандарт заполнения helpBlock новых категорий

### Назначение блока

`helpBlock` — локальный консультационно-информационный блок конкретной категории каталога. Он должен объяснять именно ассортимент и задачу этой категории, помогать выбрать совместимые товары и вести к наиболее релевантной услуге или статье Florial. Это не универсальный рекламный текст, который можно копировать между родительской категорией и подкатегориями.

### Структура данных Sanity

Для категории в соответствующем dataset (`production` — оборудование, `plants` — растения) заполнять:

- `helpBlock.title` — короткий, конкретный заголовок на болгарском (основной язык);
- `helpBlock.text` — уникальный полезный текст на болгарском;
- `helpBlock.buttonLabel` — понятный CTA на болгарском;
- `helpBlock.translations.en.title/text/buttonLabel` — полноценная смысловая локализация на английский;
- `helpBlock.translations.ru.title/text/buttonLabel` — полноценная смысловая локализация на русский;
- `helpBlock.buttonUrl` — единый внутренний относительный маршрут существующей услуги или статьи.

Не создавать дополнительные поля и не менять схему без отдельной необходимости и проверки. Сохранять существующие значения CTA, если они подходят категории.

### Правила написания

1. Сначала определить фактическое назначение категории по её названию, slug, родителю, дочерним категориям и товарам. Не писать текст только по названию, если состав ассортимента показывает более точную специализацию.
2. Для родительской категории описывать весь её ассортимент и ключевые группы дочерних категорий. Не подменять общий смысл одной узкой подкатегорией. Для подкатегории писать только о её собственных товарах и задаче.
3. Заголовок должен быть уникальным и предметным. Избегать одинаковых общих заголовков у соседних и родительских категорий.
4. Текст должен давать практическую пользу: что входит в категорию, для каких задач используется, какие параметры/совместимость учитывать при выборе и когда обратиться за консультацией. Не перечислять товары, которых фактически нет в этой категории, и не обещать неподтверждённые характеристики.
5. Болгарский — естественный исходный коммерческий текст с корректной болгарской терминологией. Английский и русский — отдельные смысловые адаптации, а не дословный машинный перевод.
6. Географию упоминать естественно и только там, где она добавляет пользу. Не вставлять координаты, искусственные SEO-перечни населённых пунктов или не согласованные локации. Не упоминать Созополь/Sozopol.
7. CTA должен вести к реально существующей и релевантной странице. Предпочитать профильную услугу или статью; если её нет — использовать подходящую общую услугу. `buttonUrl` должен быть относительным внутренним путём с разрешённым префиксом `/services/` или `/blog/`; не выдумывать URL и не использовать внешний адрес.
8. Кнопка должна обещать именно то действие, куда ведёт ссылка. Локализовать `buttonLabel` на BG/RU/EN.

### Обязательная проверка перед публикацией

- Прочитать текущий документ и проверить его `_id`, `_rev`, slug, родителя и дочерние категории; сравнить helpBlock с соседними категориями, чтобы исключить копирование чужого текста.
- Проверить заполненность всех девяти локализованных полей: BG title/text/buttonLabel, EN title/text/buttonLabel, RU title/text/buttonLabel, а также единого `buttonUrl`.
- Проверить уникальность заголовков в соответствующем dataset, корректность терминологии и фактическое соответствие текста ассортименту.
- Проверить, что CTA URL реально существует в маршрутах сайта и относится к нужной теме.
- Сначала сохранять draft, перечитать draft и сравнить с ожидаемыми полями; затем публиковать только документ с ожидаемой ревизией. После публикации перечитать `published` perspective и проверить итоговые значения.
- Не перезаписывать SEO, изображения, описание категории, порядок, родителя, товары и другие поля, если они не входят в согласованную задачу. Не удалять и не менять существующие CTA без проверки.
- Для массового заполнения сначала подготовить и проверить все тексты и соответствия категорий, затем публиковать контролируемыми партиями; вести список ID и ревизий.

### Контрольный принцип

Каждый helpBlock отвечает на вопрос: «Что именно покупатель найдёт в этой категории, как правильно выбрать и куда обратиться за профильной помощью?» Для родительской категории ответ должен охватывать весь её раздел; для подкатегории — только её узкий ассортимент.


## 2026-11-05 — Стандарт семантики и desktop-представления категорий

- В src/pages/CategoryPage.tsx названия реально выводимых непосредственных подкатегорий в ссылках-карточках должны иметь тег H2. Заголовок страницы остаётся H1; названия товарных карточек остаются H3. Не использовать H2 для произвольных декоративных подписей и не менять иерархию заголовков товаров.
- На desktop заголовок H1 и краткое описание располагаются в двух третях ширины, справа выводится изображение текущей категории из уже полученного Sanity category.image (imageUrl). Для ALT/title использовать getCategoryImageText(category, language, kind), чтобы применять локализованные редакторские метаданные и fallback по названию категории.
- Блок изображения скрывается на мобильных viewport. Если imageUrl отсутствует, текстовая часть занимает всю доступную ширину — пустой placeholder-колонки не создавать.
- Данные категорий уже загружают imageUrl и локализованные imageAlt/imageAltEn/imageAltRu, imageTitle/imageTitleEn/imageTitleRu в src/App.tsx; не добавлять новые поля, не менять Sanity schema и не записывать документы ради этого интерфейсного изменения.
- При добавлении новых категорий проверять наличие подходящего изображения и локализованных ALT/title в соответствующем dataset (production или plants). Отсутствие изображения не должно ломать layout или добавлять пустую область.

### Область действия: все каталоги Florial

- Этот стандарт обязателен для **всех страниц категорий каталога Florial**: оборудования для полива из Sanity dataset `production` и растений из dataset `plants`, во всех локалях BG/RU/EN. Он действует для родительских категорий и подкатегорий; не создавать отдельные варианты вёрстки без согласования.
- H2 используется только для реально отображаемых непосредственных подкатегорий текущей страницы. Если дочерних категорий нет, фиктивные H2 не создаются. H3 остаётся уровнем названия каждой карточки товара или растения.
- Верхний блок категории имеет единую компоновку на desktop: текстовая часть занимает примерно 2/3 ширины, изображение текущей категории — примерно 1/3 справа. На мобильном изображение скрывается, текст занимает всю ширину. Если изображения нет, место под него не резервируется.
- Изображение верхнего блока категории обязательно выводится целиком: использовать `object-contain`, не `object-cover`. Допустимы свободные поля внутри фотоблока при несовпадении пропорций; нельзя обрезать фотографию ради заполнения рамки. Это правило относится к изображениям категорий оборудования и растений, но не меняет отдельные правила карточек подкатегорий, товаров или услуг.
- При создании новых каталогов, шаблонов или альтернативных страниц категорий переиспользовать этот стандарт, текущую реализацию `CategoryPage.tsx` и helper `getCategoryImageText`; не дублировать и не разводить семантику и responsive-поведение.
- Перед выпуском проверять обе группы каталога на desktop и mobile: H1 страницы, H2 видимых подкатегорий, H3 карточек товаров/растений, локализованные ALT/title и отсутствие пустой колонки без изображения. Header, меню и Footer в рамках такой проверки не менять.


## 2026-11-08 — Дорожная карта модернизации услуг и заявок

- Создан единый план `docs/ROADMAP_SERVICES_AND_LEADS.md` с шестью автономными промптами для последовательной работы в отдельных чатах.
- Зафиксированы решения владельца: управление услугами в Sanity; заявки в D1 и Florial Manager; owner access обязательный, manager access только по отдельному permission; email-уведомление владельцу через серверную конфигурацию; клиентское подтверждение при указанном email; приватные фото; срок хранения заявок 365 дней; зоны и тарифы доставки как отдельные редактируемые данные Sanity.
- Указанный владельцем адрес получателя не записывается в публичную документацию и не должен хардкодиться в frontend или публичном репозитории; использовать только проверенную серверную конфигурацию.
- Расстояния доставки и любые расхождения тарифов с текущим production-кодом требуют проверки; значения не угадывать и не менять без решения владельца.
- Дорожная карта задаёт контрольные зависимости: (1) Sanity model, (2) service pages/UI, (3) delivery migration, (4) leads API/D1/photos/email, (5) Manager, (6) end-to-end QA.
- Все шесть этапов имеют статус NOT STARTED на дату создания плана. Этот документационный change не изменяет runtime, Sanity documents/schemas, D1, Cloudflare settings/secrets, Resend configuration, orders, checkout, Header, menu или Footer.
- См. `docs/ROADMAP_SERVICES_AND_LEADS.md` для полного содержания, автономных промптов, критериев завершения и правил перехода между этапами.


## 2026-11-09 — Sanity service: «Засаждане на лавандула»

- Опубликован новый документ услуги: `4ee02515-24f2-42b7-8fc7-e98d5e75ffcf`, slug `zasazhdane-na-lavandula`, категория `planting`, layout `standard`, sortOrder 27, active.
- Локали: BG Portable Text; RU/EN Markdown. H1 через `hero.title`; SEO заполнено отдельно для BG/RU/EN, `noIndex=false`.
- Hero использует существующий lavender asset; ALT на трёх языках. Связанные материалы: общая посадка растений и капельное напояване.
- Форма использует текущий контракт `/api/service-leads`; технические имена `name/phone/email/location/details` соответствуют валидатору `normalizeLeadFields`. Реальная заявка не отправлялась.
- Live smoke: BG/RU/EN HTTP 200, локализованные H1/SEO, `robots=index, follow`, изображение, связанные карточки и форма отображаются.
- Это content-only Sanity change. Код, schema, D1, API, Manager, Cloudflare settings и Pages deployment не затронуты. Предыдущего документа с этим slug не существовало; JSON snapshot опубликованной новой записи сохранён в `docs/backups/sanity-service-zasazhdane-na-lavandula-2026-11-09.json`.

## 2026-11-09 — Sanity service «Засаждане на палми»

- Production Sanity document: `5fd92607-19dd-44ae-b546-01e841f835c9`; slug `zasazhdane-na-palmi`; category `planting`; layout `standard`; sortOrder 28; active.
- BG description хранится как Portable Text; RU/EN descriptions — Markdown. Локализованные H1 находятся в `hero.title`; SEO — BG `seo`, RU/EN `translations.*.seo`; публичная индексация включена.
- Hero и main image используют новый asset `image-962060f9e538f42cef2b5ae405a50df59e1d78bf-1536x1147-jpg` (1536×1147), ALT BG/RU/EN.
- Связи: общая услуга посадки растений и услуга монтажа автоматических поливных систем в Несебре. Форма использует текущие поля `name`, `phone`, `email`, `location`, `details` и существующий `/api/service-leads`.
- Опубликованный документ сохранён в `docs/backups/sanity-service-zasazhdane-na-palmi-2026-11-09.json`.
- Smoke BG/RU/EN и карточка в списке услуг проверены на Production; HTTP 200, локализованные SEO metadata, Hero asset и статья подтверждены. Реальная отправка формы, D1 insert и email delivery не проверялись.
- Контентная операция: schema, frontend, API, D1, Manager, Cloudflare bindings/settings, Header, menu, Footer и Pages deployment не менялись.

## 2026-11-09 — Inline images для услуги «Засаждане на палми»

- Sanity service document `5fd92607-19dd-44ae-b546-01e841f835c9`: три asset references из `gallery` перенесены в `contentBlocks` с marker groups `trenches`, `equipment`, `watering`.
- Для каждого изображения заданы BG/RU/EN ALT; исходные assets сохранены. Gallery field очищено, чтобы исключить повторный вывод тех же снимков перед статьёй.
- `src/pages/ServicePage.tsx`: добавлены заголовки услуги пальм для сопоставления BG/RU/EN с существующими группами inline gallery. Используется существующий рендерер; новый компонент и новые schema fields не добавлялись.
- Pre-edit snapshot: `docs/backups/sanity-service-zasazhdane-na-palmi-before-inline-gallery-2026-11-09.json`; post-edit snapshot: `docs/backups/sanity-service-zasazhdane-na-palmi-after-inline-gallery-2026-11-09.json`.

## 2026-11-09 — Production verification: inline palm service photos

- PR #138 merged to main; merge commit `b08469b5ee8cc3ee8ae1878865237f03339e83c6`.
- Cloudflare Pages project `florial`: Production deployment `19748523-6a55-4d5e-bb28-bd69b2b131fc`, `success`, production branch `main`, deployment URL `https://19748523.florial.pages.dev`.
- Production BG/RU/EN service URLs returned HTTP 200; localized page title/H1 and robots indexability confirmed. All three existing Sanity images appear in the intended article sections with localized ALT text.
- Mobile 390px smoke: all three images and three inline gallery sections present; no duplicate gallery above the article.
- CI run #636 (D1 migration validation) and run #594 (Blog and Studio validation) succeeded. Website lint, utility tests, website build, migration syntax/dry-run and Studio build passed.
- No Sanity schema, API, D1, Manager, Header, menu or Footer changes. No live form submission or D1/email end-to-end test performed.

## 2026-11-09 — Ограничение блока услуг на главной странице

- `src/pages/HomePage.tsx`: после существующей сортировки `getOrderedServiceEntries(services)` главная страница отображает только первые 6 элементов через `.slice(0, 6)`.
- Кнопка «Всички услуги» без изменений ведёт на `/services`; полная страница услуг и данные Sanity не ограничиваются.
- Сохранены существующий порядок `sortOrder`, fallback-карточка доставки, локализация BG/RU/EN, ссылки и оформление карточек.
- Изменение касается только количества карточек в домашнем блоке. Запрос Sanity и объём загружаемых данных не менялись; это сокращает число рендеримых карточек/изображений, но не объём сетевой загрузки услуг.
- Header, меню, Footer, SEO, Sanity, D1, API, Manager и checkout не затронуты.
- GitHub PR #140 merged squash; main commit `45aa522094420bdae31de47c593a5901a79723ae`.
- CI: Blog and Studio validation run `42577200758` — success (lint, website tests, website build, migration syntax/dry-run, Studio dependency install and Studio build); D1 migration validation run `42577200732` — success (lint, website build, Pages Functions syntax).
- Cloudflare Pages Production deployment `f0130655-d3e3-4695-a22b-717f1fb9e081` for commit `45aa522094420bdae31de47c593a5901a79723ae` completed successfully at `2026-11-09T07:07:42Z`; aliases `florial-bg.com` and `www.florial-bg.com`.
- Code and production deployment are verified. Browser-level live card-count/click-through smoke was not performed in this run.


## 2026-11-09 — Florial performance optimization roadmap v1.0

- Создан `docs/ROADMAP_PERFORMANCE_OPTIMIZATION.md` (commit `b238f063bae150f21615c6eac66795c736094956`) как единая карта работ по ускорению сайта от главной до Manager.
- Документ содержит baseline methodology, предварительные Core Web Vitals targets, подтверждённые статические наблюдения App/Sanity/blog/images/code splitting, этапы 0–7, критерии приёмки и правила безопасной работы.
- Следующий этап: 0 — воспроизводимые Lighthouse mobile/desktop, Network waterfall, анализ Sanity payload, bundle, изображений и Cloudflare cache headers. До измерений runtime изменения не выполняются.
- На момент создания runtime-код, Sanity datasets/schema, D1, API, Cloudflare settings/secrets и Production не менялись.
- MD2 rev31 создана как актуальная инструкция-ссылка; предыдущие редакции сохранены.


## Контрольная точка 09.11.2026 — оптимизация загрузки услуг (PR #142)

- Main commit: `e9b49a42ee7cfdfd385cf7fce8706ab71c93b7bb`; PR #142 merged squash.
- Единственный runtime-файл: `src/App.tsx`.
- Initial service GROQ projection ограничена данными списка/навигации; полная запись услуги загружается по slug только на её detail route. Добавлены отдельное loading state и cancellation guard.
- Полная service projection сохраняет описание, hero, галерею, contentBlocks, relatedContent, startingPriceEUR, advantages, steps, callToAction, leadForm и SEO.
- CI: runs `42584605993` и `42584606037` — success.
- Cloudflare Pages Production deployment: `001a7aeb-a6f7-4bd0-b963-d9a1f38f2ca0`, status success, deployed commit совпадает с main commit. Домены: `florial-bg.com`, `www.florial-bg.com`.
- Live rendered check: `/services/zasazhdane-na-rasteniya` BG/RU/EN после client-side load; `/services` доступна. Browser console, полный ручной SPA regression и все service routes не проверялись.
- Не менялись Sanity schema/documents, D1, API, checkout/cart, Manager, Header/menu/Footer и данные каталога.
- Cloudflare Pages environment metadata содержит legacy-настройки `SUPABASE_*` / `VITE_SUPABASE_*`; активное использование приложением не установлено. Значения и секреты не копировались в документацию. Не удалять до отдельной проверки исходников и согласования.
- Следующая задача: завершить Stage 1 performance roadmap — dependency map и compact projections для equipment/plant catalog без потери поиска, фильтров, категорий, вариантов, комплектов, cart и SEO.


## 2026-11-09 — CLS follow-up: SEO fallback image dimensions

- Main commit: `9bd5d3fb268d7dec9c3dab330e8039987ec78718`; Production deployment: `88fd47db-3990-4447-813e-be6b12a42028` (`success`).
- `functions/_middleware.ts` now appends intrinsic `width`/`height` attributes to the image in the server SEO fallback when the source is a Sanity CDN asset whose original dimensions are encoded in its filename. Parsing is isolated in `functions/lib/sanityImageDimensions.ts`.
- New unit tests are in `tests/sanity-image-dimensions.test.mjs`. The push validation run passed lint/build/Pages Functions syntax but did not run `npm test`; unit-test execution is pending PR validation.
- The deployment is confirmed, but post-release CLS improvement is NOT confirmed. The previous mobile category residual (median `0.3441`, two of three runs) must not be marked resolved without another controlled trace.
- Browser automation was unavailable for a fresh CDP capture in this session. Firecrawl's live scrape returned HTTP 200 but exposed the hydrated loading shell, not the pre-JavaScript HTML. The image attributes on the initial response therefore remain unverified.
- Desktop CLS, Lighthouse and INP remain open. Next step: obtain a browser/CDP trace on the exact controlled profile and inspect layout-shift sources before changing the route shell or category content.


## 2026-11-09 — Production browser-rendering diagnostics

- Verified initial server HTML with JavaScript disabled: irrigation category HTTP 200; SEO fallback H1 present; loading placeholder absent; image tag includes `width="1254" height="1254"`.
- Cloudflare Browser Rendering, unthrottled, cacheTTL=0, 3 runs per viewport for the category: mobile 390×844 CLS median `0.0002631`; desktop 1365×900 CLS median `0.0148097`.
- Homepage also measured 3 times per viewport: mobile median `0.0002631`, desktop median `0.0148097`. One run each on blog, service detail and the known blog article showed the same viewport-specific CLS.
- Mobile shifts came only from the Header search form; desktop shifts came from a 4 px shared content/Header geometry adjustment and the search form. No Footer source appeared. The desktop CLS remains below 0.1 and is shared, not category-specific. Header was not changed.
- Browser-rendering LCP medians: category 0.872 s mobile / 0.812 s desktop; homepage 1.692 s mobile / 1.504 s desktop. FCP medians: category 0.532 s / 0.324 s; homepage 1.296 s / 0.836 s.
- These are unthrottled browser-rendering diagnostics, not Lighthouse or CrUX. They cannot be compared directly with the earlier controlled CPU 4× / 150 ms network profile.
- No trusted user interaction was performed, so Event Timing produced no interaction entries and INP remains unmeasured. Lighthouse mobile/desktop remains open.
- The same controlled 3-run mobile profile after the fix remains a pending verification item.

## Дополнение rev78 — Production-публикация и проверка privacy-policy

Дата: 11.11.2026

- PR #197 merged в `main`; merge commit `ac03b992cbdd8a7393e39528cc1ceb0594001d6b`.
- CI PR #197: Lint, тесты сайта, сборка сайта, синтаксис миграций, read-only D1 dry-run и сборка Studio — success.
- Cloudflare Pages Production deployment `a8425737-e658-48b2-87a2-c471447a5789` завершён успешно; commit `ac03b992...`; production aliases `florial-bg.com` и `www.florial-bg.com` назначены.
- Live smoke с `maxAge=0`: BG `/privacy-policy`, RU `?lang=ru`, EN `?lang=en` — HTTP 200. Проверены локаль документа, локализованные title/description/H1, `robots=index, follow`, self-canonical и hreflang BG/RU/EN/x-default.
- Главная страница возвращает HTTP 200; Footer содержит ссылку на политику. Sitemap HTTP 200 и включает все три локализованных URL.
- Изменения кода для устранения 404 ограничены `functions/_middleware.ts`; Sanity, D1, Manager, checkout, Header и меню не изменялись в рамках исправления.
- Открытые юридические вопросы: проверить текст болгарским юристом; подтвердить регистрационный адрес по Търговски регистър; сверить договоры обработчиков и конкретные transfer safeguards. Автоматическое удаление service leads отсутствует и честно раскрыто в политике.

---


## Дополнение — постоянная ссылка на «Общи условия» в Footer

Дата: 11.11.2026

- В src/components/Footer.tsx добавлена локализованная ссылка на /terms рядом с существующими юридическими ссылками.
- Подписи: BG «Общи условия», RU «Общие условия», EN «Terms and Conditions». URL формируется через существующий localizedHref.
- Существующие ссылки /privacy-policy и /withdrawal, цвета, фон, контакты, CTA, Facebook и tracking events сохранены.
- Изменён только Footer component в runtime; Header, основное меню, корзина, checkout, Sanity, D1, Cloudflare settings/secrets и реальные данные не затронуты.
- Страница /terms уже была опубликована отдельным PR #202; этот PR добавляет только постоянную навигационную ссылку.
- PR #203 merged squash в main; merge commit cb26dcacb0b254c57ac7cc280285516f4c3f3ce7.
- CI на PR HEAD 0376b175e76100113da938a06976d00593b5e7a1: Blog and Studio validation run #869 — success (lint, website tests, website build, migration syntax/read-only dry-run и Sanity Studio build); Florial D1 migration validation run #1062 — success (lint, website build, Pages Functions syntax и additive migration validation).
- Cloudflare Pages Production deployment 1d09957d-31ad-4753-b8fa-ddf5455e75f8 для merge commit cb26dcacb0b254c57ac7cc280285516f4c3f3ce7 завершился success; production aliases florial-bg.com и www.florial-bg.com назначены.
- Live smoke главной страницы: HTTP 200; сырой HTML подтверждает ссылку «Общи условия» с href https://florial-bg.com/terms в Footer.
- Изменения ограничены Footer и документацией; D1, Sanity, Cloudflare settings/secrets, checkout и пользовательские данные не менялись.



## 2026-11-11 — Единый GitHub-центр документации Florial

- Установлена модель: GitHub repository `omaraandrey-dev/florial`, branch `main` — единственное постоянное хранилище технических знаний. ChatGPT Library и параллельные копии исключены.
- Добавлены `AI_INSTRUCTIONS.md`, `docs/AI/START_HERE.md`, `WORK_PROTOCOL.md`, `MASTER_SPEC.md`, `OPEN_QUESTIONS.md`; README указывает единый порядок входа.
- Исторические Supabase migrations и Supabase-only analytics документы архивированы в `docs/archive/supabase/`. Старые Manager setup/mobile QA/architecture документы помечены как исторические.
- Статическая проверка: package.json не содержит Supabase SDK; поиск `@supabase/supabase-js` не дал результатов; `.env.example` содержит только публичные Sanity параметры. Это не live audit Cloudflare variables.
- Runtime-код, Sanity documents/schema, Cloudflare settings/secrets/deployments, D1 schema/data, Resend и глобальные компоненты сайта не менялись.
- Изменения выполняются в отдельной ветке `docs/github-single-source-of-truth`; merge и Production deployment не выполнялись на момент записи.


# Перенос коммерческих материалов блога в услуги — 12.11.2026

**Статус:** контентная часть опубликована; 301-переадресации подготовлены в GitHub branch, но ещё не развернуты. Исходные статьи не удалялись и пока остаются опубликованными.

## Бизнес-структура услуг

Используются четыре уже существующих направления страницы `/services`:

- **Ландшафтный дизайн:** `landscaping`.
- **Системы полива:** `irrigation` + внутренние категории `maintenance` и `delivery`.
- **Услуги садовника:** `planting`.
- **Услуги газонщика:** `lawn`.

Новые услуги не создают пятое направление и не меняют фильтр `ServicesListPage`.

## Перенесённые материалы

Sanity project `bxvcy0qs`, dataset `production`. Все восемь новых документов имеют `isActive=true`, собственные BG/RU/EN тексты, SEO, изображения/галереи и существующую форму заявки.

| Исходная статья | Новый документ service | Направление |
|---|---|---|
| `montazh-podmyana-remont-razpruskvachi-nesebar` — blogPost `4eb9f7c2-8ffe-4e26-881c-4c9aa41a0201` | `8a4ec08b-e064-4d85-8d97-52837afe6d6f` | Системы полива |
| `montazh-nastroika-podmyana-programatori-avtomatichno-napoyavane` — blogPost `5398768e-2661-49b5-9886-54b3d8218ba1` | `078495b7-168f-4b7d-8dbe-f723aeab0cc9` | Системы полива |
| `montazh-remont-elektromagnitni-klapani` | `d6dd1e83-f504-45a2-83de-974e144669e8` | Системы полива |
| `remont-modernizatsiya-polivni-sistemi` | `9f8a5130-49e8-4d34-9f76-c6124503fb5d` | Системы полива (`maintenance`) |
| `godishna-poddruzhka-avtomatichni-sistemi` | `88d0619d-1083-4eb7-b4e6-b22897f6c901` | Системы полива (`maintenance`) |
| `izgrazhdane-tsvetni-lehi` | `e5da8f0d-45ce-41f1-a95b-53ca951dd55c` | Услуги садовника |
| `topiarna-rezitba-rasteniya` | `31fb7746-10c1-48a3-a949-39767f9f0205` | Услуги садовника |
| `podmyana-stara-travna-plosht` | `fe90ae56-594e-45e4-b37f-54eb2c3bf0ed` | Услуги газонщика |

### Материал, оставленный в блоге

`landshaften-dizain-proekt-zasazhdenie` не создаёт девятую страницу услуги: в Sanity уже есть общая услуга «Ландшафтен дизайн» (`c7d2c120-6024-4876-b240-ff6585df91e4`). Исходная публикация оставлена как проектный материал/пример выполненной работы и добавлена в `relatedContent` существующей услуги. Она остаётся в блоге и не входит в список 301.

## Существующие связи Sanity

Существующие документы услуг получили ссылки на специализированные страницы через `relatedContent`:

- монтаж автоматических систем — дождеватели, программаторы, клапаны;
- ремонт и обслуживание систем — ремонт/модернизация, годовая профилактика, дождеватели и клапаны;
- посадка растений — цветники и топиарная стрижка;
- рулонная трава — замена старого газона;
- ландшафтный дизайн — оставленный в блоге проектный материал.

### Входящие ссылки из товаров

Read-only GROQ `references(blogPostId)` в Production обнаружил:

- статья о разпръсквачах — 46 документов `product`;
- статья о программаторах — 23 документа `product`;
- статья об электромагнитных клапанах — 17 документов `product`;
- статья о ремонте/модернизации — 13 документов `product`;
- остальные переносимые статьи — 0 входящих ссылок из других документов;
- проектная статья о ландшафтном дизайне — 1 ссылка из документа `service`.

Это 99 найденных обращений из товарных документов по четырём статьям (46+23+17+13). **Массовая перезапись этих товарных ссылок не выполнялась.** Ссылки продолжают указывать на существующие blogPost документы; после включения 301 они будут вести на новые service URL. Это позволяет не переписывать десятки товарных документов и не терять ссылки.

## Backup перед записью

Сохранены точные JSON snapshots опубликованных документов в GitHub:

- исходные 9 blogPost: `docs/backups/sanity-blog-to-services-2026-11-12/`;
- 5 затрагиваемых существующих service: `docs/backups/sanity-services-before-blog-migration-2026-11-12/`.

Это целевые snapshots затронутых документов, не полный export dataset.

## Переадресация и совместимость

В ветке `content/blog-posts-to-services-2026-11-12` подготовлены:

- `src/lib/blogServiceRedirects.mjs` — allowlist ровно восьми перенесённых slug;
- `src/lib/blogServiceRedirects.d.mts` — типы;
- `functions/_middleware.ts` — HTTP 301 до обработки старой blog-страницы;
- `tests/blog-service-redirects.test.mjs` — тесты восьми URL, незатронутого блога, trailing slash и encoded path.

Переадресация меняет только pathname, сохраняя исходные query parameters, включая `?lang=ru` и `?lang=en`. Используется Pages Functions middleware, а не статический `_redirects`, потому что проект обслуживает запросы через Functions middleware.

**До Production deployment старые статьи нельзя снимать с публикации.** После merge/deployment необходимо проверить все восемь старых URL на HTTP 301 и соответствующие новые URL на HTTP 200. Только после этого выставить `isPublished=false` для восьми перенесённых blogPost документов. Документы и их IDs сохраняются; физическое удаление запрещено. Проектная статья `landshaften-dizain-proekt-zasazhdenie` остаётся опубликованной.

## SEO и изображение

- Для новых услуг заполнены BG/RU/EN `seo.metaTitle`, `seo.metaDescription`, `noIndex=false`; тексты адаптированы к услугам и географии Несебър/Равда/Слънчев бряг/Южное Черноморье.
- В новые документы перенесены исходные assets, локализованные ALT, Portable Text BG и Markdown RU/EN.
- В live smoke до кода PR обнаружено, что client-side `ServicePage` перезаписывает `og:image` логотипом, даже когда у услуги есть основное фото. В ветку добавлено исправление: передавать `service.imageUrl || service.hero?.imageUrl` в `applyPageSeo`. Проверить итоговый OG image после Production deployment.

## Проверки на 12.11.2026

- Sanity: 8 новых документов опубликованы; 8/8 прошли доступную schema validation со статусом `valid`. Валидация неполная: custom validation callbacks и custom slug isUnique callbacks инструментом не запускались; встроенные правила и встроенная уникальность slug проверены. Требуется ручной осмотр Studio.
- Sanity: пять существующих service документов с обновлёнными `relatedContent` опубликованы после backup и revision guard.
- Live Firecrawl: новые страницы дождевателей (BG), топиарной стрижки (RU), замены газона (EN) — HTTP 200, `robots=index, follow`, локализованные title/description.
- Live Firecrawl: `/services` — HTTP 200, показывает 20 услуг и все восемь новых service slug в четырёх существующих направлениях.
- Live sitemap — HTTP 200; содержит восемь новых service URL и пока содержит старые blog URL, так как исходные статьи ещё опубликованы.
- Старый URL статьи о дождевателях пока отвечает HTTP 200 — это ожидаемо, пока redirect branch не объединена и не развёрнута.
- Cloudflare Pages Production на момент проверки: deployment `46473f2b-5f04-4d83-9611-2e5b68f0dbd0`, commit `74fe0b9da63413cfde586782532637b558954a5f`, status success. Preview deployments выключены (`preview_deployments_enabled` отсутствует, `preview_deployment_setting=none`); branch preview skipped.
- Код, редиректы и исправление OG image пока не в Production. Merge/Production release не выполнялись.

## Незавершённые действия

1. Завершить GitHub PR, получить CI по точному HEAD SHA: tests, lint, website build и Pages Functions syntax.
2. После разрешённого merge проверить Production deployment точного commit.
3. Проверить все восемь 301, сохранение `lang`/UTM query parameters, новые URL, canonical/hreflang, OG image и sitemap.
4. После успешной проверки отключить публикацию восьми старых blogPost документов, сохранив документы и ссылки.
5. Выполнить ручной осмотр новых услуг в Studio на BG/RU/EN.
