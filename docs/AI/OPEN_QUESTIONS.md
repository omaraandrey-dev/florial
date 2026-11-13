## 2026-11-13 — Irrigation category SEO follow-up

- 10/10 primary irrigation categories are published with BG/RU/EN H1, Meta Title, Meta Description, concise descriptions and localized SEO articles/visible FAQ. Details: `docs/audits/2026-11-13-irrigation-category-seo.md`.
- **Still to verify:** inspect the initial HTTP HTML and rendered Production routes for representative categories in BG/RU/EN; confirm metadata, canonical/hreflang and the SEO article are visible to crawlers. No application deployment was made in this content-only update.
- **Still to do:** monitor/request Google recrawling after route verification. Search results may continue to show cached metadata temporarily.
- **Schema follow-up:** four existing category documents contain root-level legacy `seoTitle` and `seoDescription` fields absent from the deployed category schema. They were preserved. Any schema registration or data cleanup requires a separate approved migration and backup.
- Visible FAQ content was added, but FAQPage structured data was not. Revisit only if there is a concrete search-feature requirement; do not assume FAQ rich snippets will be displayed.

## 2026-11-13 — Plant category SEO metadata published

- Completed the category-wide SEO update: 17/17 published plant categories in Sanity dataset `plants`.
- BG/RU/EN each have category-specific Meta Title and Meta Description values (51 pairs in total). All titles are 70 characters or shorter; descriptions are localized and include relevant local intent.
- The H1 fields, category descriptions, slugs, images, category tree and product data were preserved. Backup and exact verification details: `docs/backups/sanity-plant-categories-before-seo-2026-11-13.json` and `docs/audits/2026-11-13-plant-category-seo.md`.
- **CI on exact content/docs head `6100fbe1ba79f977700c4a442005b37266f4f4c7`:** Blog and Studio validation run `43406072024` — success (lint, website utility tests, website build, read-only migration dry-run and Studio build); D1 migration validation run `43406071860` — success. No application code changed.
- No code/schema/deployment changes. **Still open:** verify the initial HTTP HTML metadata for representative plant category routes in BG/RU/EN and request/observe Google recrawl; Google AI/search results may continue to reflect previously indexed metadata until refreshed.

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

## Current checkpoint — PR #251 / Cloudflare Preview (13.11.2026)

- PR #251 is open on `feat/plant-category-server-rendering`. Code implementation SHA `0ef46d74d7fd5e48af38c80985a1604e968bbf30` passed exact-SHA GitHub Actions: `43396561749` (Blog and Studio) and `43396561879` (D1 migration validation). Later commits in the PR update documentation only.
- Cloudflare Pages project `florial`: Preview setting is now `all` with include pattern `*`, changed after explicit owner approval. Production branch `main` and automatic Production deployments remain enabled.
- Preview deployment `5fc9f0fb-3f3c-4e82-b1a1-8556866f093c` (`https://5fc9f0fb.florial.pages.dev`) completed successfully on documentation-updated PR head `73c2132f4ac69546c26697d48b33a156991460d3`. Initial HTTP HTML QA for BG/RU/EN remains unconfirmed: the available scrape returned the client-rendered DOM after React startup, not the original response.
- Production D1 binding `DB` remains configured; Preview has no D1 binding. Legacy Supabase-named environment keys remain in Cloudflare configuration: Preview has `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`; Production has those two plus `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Only key names were inspected; values were not read. Their current runtime usage was not re-audited in this task. These residual keys are not evidence that Supabase is part of the active Florial architecture; do not remove them without a separate code-usage audit and owner approval. Do not copy Production bindings or secrets into Preview as part of this task. Preview URLs are public unless protected separately.
- Production remains on `main` commit `0df7a52bb2a923f71096179c3837141382446554`; deployment `5c52db09-707f-47a7-a4c7-1ffea0300130` succeeded on that commit. PR #251 has not been merged.

## Plant category server-rendered catalogue — PR #251 open (13.11.2026)

- Branch: `feat/plant-category-server-rendering`. Plant categories only; equipment categories remain Phase 2.
- The Middleware includes published plant products in initial category HTML and emits localized product links plus ItemList JSON-LD. React continues to load live catalogue data and replaces the server fallback after JavaScript starts.
- Sanity read-only GROQ check: 12 products for `plants-palms`; 50 for `plants-root` across 17 category documents. No Sanity writes.
- CI on exact implementation head `0ef46d74d7fd5e48af38c80985a1604e968bbf30`: Blog/Studio `43396561749` and D1 validation `43396561879` — success.
- Cloudflare Preview setting is `all`; the Preview deployment on head `73c2132f4ac69546c26697d48b33a156991460d3` completed successfully. Initial no-JavaScript HTML QA remains pending; post-JS DOM inspection is not a substitute.
- Preview has no D1 binding; Manager/orders checks are excluded. Production remains on `main` commit `0df7a52bb2a923f71096179c3837141382446554`; PR #251 is not merged or deployed.
- Do not extend to equipment categories until Phase 1 Preview HTML/browser QA passes.
- Details: `docs/audits/2026-11-13-plant-category-server-rendering.md`.

## Production incident — blank storefront after PR #249 (13.11.2026)

- Confirmed source-level cause: temporal-dead-zone `ReferenceError` in `src/App.tsx` because the SEO effect dependency array reads `currentService` before its `const` initialization later in `App`. This causes initial render failure and an empty root.
- Cloudflare deployment `467d9866-0d04-4ef1-b265-3f84b6533950` reports build/deploy success; client-side JS startup was not exercised by that pipeline.
- Hotfix branch `hotfix/app-current-service-initialization` moves the declaration before the SEO effect and adds a test guarding declaration order.
- Open: wait for CI; obtain owner authorization before rollback or Production release; verify browser console, root render, homepage, service routes, blog and locales after recovery.

## PR #249 — services and blog route loading optimization (merged/deployed, browser QA pending, 13.11.2026)

- PR #249: https://github.com/omaraandrey-dev/florial/pull/249; squash merge commit `d4b19a59775cb6370ed28a3d90dd4ef36760db9f`.
- Code separates the full service directory from global route loading while preserving a compact Header service query. That compact query also carries the small image fields required by homepage service cards and About-page service images; both pages use it instead of the `/services` full directory state. Individual service routes fetch one localized service document by slug.
- During final review, a regression was found where homepage and About page still consumed the now route-specific full service state. It was corrected before merge and covered by new tests.
- Homepage's sixth plant category is now the published Sanity category `plants-solitaires` (slug `soliteri-edrorazmerni`) instead of `plants-citrus`; no Sanity content was written.
- Blog card queries are locale-specific. Blog article details are fetched independently from the full blog index; related posts are a separate query limited to three.
- Responsive Sanity image sizing and selective eager loading were added for service pages. Blog article cover remains eager/high priority; galleries and cards are lazy.
- Automated regression tests cover route-specific loading, localized blog data, homepage specimen category and compact service-card data. CI on final PR head `91bc8abd042f6624dc531081bbde077d254d76cc`: Blog and Studio run `43389185896` — success; D1 validation run `43389169540` — success.
- Cloudflare Pages Production deployment `467d9866-0d04-4ef1-b265-3f84b6533950` — `success` на точном merge commit `d4b19a59775cb6370ed28a3d90dd4ef36760db9f`; URL `https://467d9866.florial.pages.dev`; production aliases `https://florial-bg.com` и `https://www.florial-bg.com`.
- Studio dependency installation reported 23 npm audit findings (13 moderate, 9 high, 1 critical). Affected packages and production exposure have not been investigated; no dependency changes were made as part of PR #249.
- **Required browser QA:** `/services` list and all visible service links; direct service URLs and SPA navigation; lead form, related content and image galleries; blog index/filtering; direct blog article and related links; BG/RU/EN content; Header service navigation on non-`/services` routes.
- **Required Network QA:** confirm full service directory query is absent on unrelated routes; confirm service detail issues one detail query, not full list; confirm blog article does not request the entire blog index; inspect query payload sizes and responsive image currentSrc/transfer bytes.
- **Required measurement:** repeat Lighthouse mobile and desktop on matched URLs/network profiles; record FCP/LCP/TBT/CLS/Speed Index and transfer bytes. Do not infer an improvement before measurement.
- Production deployment is complete. Owner visual/functional QA and browser Network/Lighthouse measurements remain pending. Sanity documents/schema, D1, Resend and Cloudflare settings/secrets were not changed.

## Category-specific catalogue loading — PR #248 merged/deployed; browser QA pending (13.11.2026)

- PR #248 объединён в `main` squash commit `fe3e528320b88eebe3331e288bbf45591df64482`.
- Cloudflare Pages Production deployment `db437e51-7794-4bcd-93d0-e2ca004d59f7` — success на точном commit; URL `https://db437e51.florial.pages.dev`; aliases apex и www.
- CI на точном PR head `d70ec7936a8d58c8f16550688536bd0f918a4089`: Blog/Studio runs `43379996722` и `43380019954` — success; D1 validation `43379996726` — success.
- По коду plant categories загружают только dataset `plants`, equipment categories — только `production`; product detail routes по-прежнему загружают оба индекса. Независимое кэширование предотвращает повторную загрузку уже полученного каталога.
- **Остаётся проверить в браузере:** direct URL и SPA для `/category/maslini`, других plant categories и equipment category; отсутствие полного product-index запроса противоположного dataset; переходы plant ↔ equipment; product detail из обоих datasets; search, cart, BG/RU/EN; ошибки/пустые результаты.
- Не путать небольшие необходимые `production` запросы категорий/услуг/help content с полным каталогом оборудования.
- **Не подтверждено:** browser Network capture, фактический transfer saving, повторный Lighthouse и изменение LCP/critical request chain. Production deployment подтверждён, но не заменяет browser QA и performance measurement.
- Sanity documents/schema, D1, Resend, Cloudflare settings/secrets не затрагивались.


## Каталог растений — fallback image и responsive image sizing (PR #247 merged/deployed; QA open, 13.11.2026)

- PR #247 merged в `main`: commit `5801d390a468952563f8f339b233d15774ca74d9`.
- Cloudflare Pages Production deployment `579f4c88-fc98-4357-ab61-21c57f7fed23` — success на точном commit; URL `https://579f4c88.florial.pages.dev`; production aliases apex и www.
- CI на точном PR head `c94f0c5ba481a7d1a386b242629d6c376b82822c`: Blog and Studio `43376289807` — success; D1 validation `43376289788` — success.
- Кодовая реализация: category raw fallback `<img>` удалён из HTML внутри `#root`, og:image сохранён; desktop React hero responsive от 1024 px; catalog card sizes согласованы с grid, Sanity quality 65, desktop hero quality 70 / cap 408 px; eager только первые две карточки.
- **Остаётся:** проверить на реальном mobile Network отсутствие category fallback request; на desktop проверить responsive hero/currentSrc и качество; измерить фактический transfer size; повторить Lighthouse mobile/desktop. Визуальная browser QA после публикации не заявлена.
- Baseline владельца mobile 13.11.2026 07:35 GMT+2: Performance 84, FCP 0.9 s, LCP 4.5 s, TBT 0 ms, CLS 0.001, Speed Index 2.4 s. Post-deploy metrics отсутствуют; transfer savings и LCP improvement НЕ ПОДТВЕРЖДЕНЫ.
- Изменения не затрагивали Sanity, D1, Cloudflare settings/secrets, SEO metadata, Header/Footer или routing.



- На main report владельца от 13.11.2026 07:35 GMT+2: Performance 84, FCP 0.9 s, LCP 4.5 s, TBT 0 ms, CLS 0.001, Speed Index 2.4 s. Lighthouse показал категорийное изображение «Всички растения» 1021×979, 268 KB, и plant card images 480×640 при фактическом контейнере около 168×224.
- Кодовая причина найдена: functions/_middleware.ts documentBody() вставлял category doc.imageUrl как raw HTML <img src> до запуска React. CSS desktop-only hero в index.html не отменяет сетевой запрос уже присутствующего HTML image.
- PR branch fix/category-image-responsive-loading-2026-11-13 suppresses that category fallback <img> while preserving og:image, responsive desktop React hero, and all product metadata. It also aligns catalog sizes to grid geometry, sets per-image quality 65 for catalog cards / 70 for desktop hero, and limits eager loading to two first cards.
- Остаётся: CI on exact PR SHA; mobile raw HTML/Network verification that category fallback image is not requested; desktop verification that responsive category hero is requested and correctly sized; visual quality review; repeat Lighthouse mobile and desktop. Actual transfer savings and LCP change are NOT CONFIRMED.
- No Sanity, D1, Cloudflare settings/secrets, SEO metadata, image assets, Header/Footer or routing changes.

## Каталог растений — loading skeleton опубликован; визуальная QA и повторные метрики открыты (13.11.2026)

- PR #246 объединён в `main` (commit `3f2099e6ac2c11c2461c4c14618128c618a8d413`) и опубликован Cloudflare Pages Production deployment `6208bca0-23a6-48b0-a84b-b1861bac9523` на том же commit. Category-specific skeleton в `src/App.tsx` используется и для загрузки данных, и как React.Suspense fallback.
- Кодовый осмотр: `index.html` скрывает `.category-page-hero-image` на ширине менее 1024 px. Подкатегорийные thumbnails в `CategoryPage.tsx` отображаются 48×48 px на mobile / 56×56 px на desktop.
- Baseline владельца (mobile, 13.11.2026 06:52 GMT+2): Performance 61, LCP 4.507 s, CLS 0.693, TBT 10 ms.
- **Остаётся:** проверка прямого URL `/category/rastenia` и SPA navigation; visual QA на Android/mobile и desktop; повторный Lighthouse; layout-shift attribution. После skeleton отдельно оптимизировать plant catalogue GROQ projection/payload только после измерения Network waterfall.
- Не утверждать, что Footer был единственной причиной CLS или что skeleton улучшил метрики до фактического повторного замера. Sanity не менялся.

## JavaScript split — PR #244: функциональная browser QA закрыта владельцем (13.11.2026)

- PR #244 merged в `main`: `c97255f4fc843714f0a453727a77f22b75fdf0f7`.
- Cloudflare Pages Production deployment `cc421986-4aa0-49e3-85db-33d78d8546ce` — build/deploy success; deployment commit совпадает с merge commit.
- CI: Blog and Studio run `43359151357` — success; D1 validation run `43359151359` — success.
- Владелец вручную проверил переключение языков в обе стороны, категории, товары, корзину, поиск и переводы; сообщил, что всё работает корректно. Функциональная проверка владельца закрыта. Автоматизированный browser test или отдельный Network capture не заявляются.
- Initial JS entry: 398.12 kB raw / 108.66 kB gzip → 336.08 kB raw / 97.95 kB gzip. Это сравнение build artifacts, не измерение LCP.
- **Остаётся только performance measurement:** Network waterfall по маршрутам и языкам; повторный Lighthouse mobile/desktop; сравнение LCP/INP/CLS. Lighthouse unused-JS estimate «32 KiB» считать закрытым только при новом отчёте.
- Sanity, D1, Resend и Cloudflare settings/secrets не менялись.

## Категория хвойных — SEO-текст подготовлен, публикация ожидает владельца (13.11.2026)

- Sanity draft `drafts.plants-conifers` содержит новые локализованные BG/RU/EN статьи в `seoContent` (по 25 Portable Text блоков на язык).
- Backup до записи: `../backups/sanity/2026-11-13-plants-conifers-before-seo-content.json`.
- Read-back успешен; beta schema validator сообщил `valid`, но `complete=false` (custom validation не выполнялась).
- **Ожидает:** визуальная проверка всех трёх языков в Sanity Studio и отдельное разрешение владельца на публикацию. Не публиковать автоматически.

## Homepage hero — release deployed (12.11.2026, PR #242)

- PR #242 merged to `main`: `16bd410ad4b246f4d20594823ea5fe7be2f20bdd`.
- Production deployment `4f4dc307-3f6d-416b-b411-4bceccbc3661` is successful on that exact commit; deployment aliases include apex and www.
- Sanity photo document `ec5582be-f4bd-4e3c-9dd7-b5d8e4b31fd1` points to compressed image asset `image-460eba3d596671187e5a382f4449ed09fcf78bfc-1518x957-png` (1,015,107 bytes, 1518×957); homepage fallback URL is synchronized.
- CI passed on exact PR head `a7270d4b931009dba4fd27c35a99b5375dbcca3e`: Blog/Studio run `43271610071`, D1 run `43271609865`.
- **Still open:** visual owner QA, actual browser network candidate/transfer measurement and repeat mobile/desktop Lighthouse. Do not equate Sanity asset byte reduction with measured LCP improvement.

## Homepage hero — compressed Sanity photo asset (12.11.2026)

- Published photo record `ec5582be-f4bd-4e3c-9dd7-b5d8e4b31fd1` now references compressed asset `image-460eba3d596671187e5a382f4449ed09fcf78bfc-1518x957-png` (1518×957; 1,015,107 bytes).
- Homepage immediate fallback URL is synchronized with this asset on the PR branch; the first render and Sanity query resolve to the same URL.
- CI must be green on the updated PR head; after merge, verify Cloudflare Pages deployment and inspect mobile/desktop image selection, network transfer and Lighthouse LCP. No measured LCP gain is claimed yet.

## WWW → non-WWW redirect — practically verified by owner, 12.11.2026

- **Cloudflare rule repaired:** production Redirect Rule `WWW to non-WWW`, ruleset version 5, condition `(http.host eq "www.florial-bg.com")`, HTTP 301 to apex with original path and query string preserved. Cloudflare API write/read-back successful.
- **Cloudflare Request Tracer simulated:** www `/services` → 301; www homepage with query → 301; apex `/services` → 200.
- **Owner browser verification (12.11.2026):** owner tested real requests in a regular browser and confirmed that opening the `www.florial-bg.com` address automatically redirects to `florial-bg.com` without `www`. The practical www → non-www behavior is confirmed by the owner.
- **Still open — Google only:** Google Search Console URL Inspection for apex/www homepage and `/services`; Google-selected canonical and index consolidation remain NOT CONFIRMED. Do not report Google's canonical choice as confirmed until Search Console verifies it.
- Detailed evidence: `../audits/2026-11-12-www-canonical-redirect.md`.

8. **Мобильное изображение категории и зимний индикатор — визуальная Android QA закрыта 12.11.2026:** PR #222 объединён в main (`79e96ce419b4be6513a112deee7c48bb3b0564e5`), CI и Cloudflare Pages Production deployment прошли успешно; владелец подтвердил корректное отображение на физическом Android-устройстве. Индикатор вынесен в отдельную строку над фото в карточках растений и на странице товара; desktop-only category hero использует `<picture>` с media source от 1024 px и fallback `img` без `src/srcSet`. **Не подтверждено отдельно:** Android Network/DevTools capture отсутствует, поэтому отсутствие фактического HTTP-запроса не заявляется как независимо измеренное. Ранее зафиксированный CLS около 0.34385 не был атрибутирован конкретному DOM-узлу и не считается устранённым этим изменением; для его расследования потребуется отдельный замер. Не менять `src/App.tsx`, Header или Footer без отдельного согласования.
# Florial — открытые вопросы и проверки

**PR #240 — независимая загрузка Header / главной / каталога (12.11.2026):** Кодовый commit `8953f913be649f62af34d7123b15c6373c68171a`; последующие commits PR содержат документационные уточнения. CI для этого branch snapshot (workflow runs на документационном commit `e067660f1896fbce3cb575541434a362ba37c740`) прошёл: Blog and Studio validation run `43261832983` — success (lint, utility tests, website build, migration syntax/dry-run, Sanity Studio build); D1 validation run `43261833064` — success (lint, website build, Pages Functions syntax и обе migration validations). До merge обязательны браузерная регрессионная проверка прямых URL и SPA-навигации: главная; все шесть plant categories; equipment category; product detail; search; services list/detail; About; Blog/list/article; contacts; cart; BG/RU/EN; mobile/desktop. В Network нужно подтвердить, что на homepage не запрашивается полный product index, а на service/blog/about/contact/cart routes он не запускается; Header queries не блокируют page rendering. Проверить, что все категории растений остаются в Header menu, а homepage показывает только шесть утверждённых карточек. Lighthouse/Network waterfall и визуальная QA ещё не выполнены; performance gain НЕ ИЗМЕРЕН. PR: https://github.com/omaraandrey-dev/florial/pull/240.


14. **Изображения блога восстановлены и миниатюры/ALT улучшены 12.11.2026:** шесть legacy Wix images восстановлены в четырёх статьях; дополнительно три низкоразмерных изображения заменены оригиналами 925×855, 2048×2048 и 640×468; шесть BG ALT исправлены после визуальной проверки Wix originals. Backups перед записями: docs/backups/2026-11-12-blog-images-before-write.json, blog-small-images-before-write.json, blog-alt-before-write.json, blog-sketch-before-write.json. Read-back подтвердил публикацию и отсутствие drafts. **Остаётся:** live visual QA страниц через браузер владельца; 12 повторов cover asset в body не удалялись автоматически; принять решение о трёх нерелевантных к оливе изображениях в статье об оливе. CDN HTTP smoke через viewer недоступен. Код/schema не менялись; deployment не запускался. Детали: ../audits/2026-11-12-blog-seo-images.md.

15. **Повторы cover/body — редакционная проверка:** в выборке 22 blogPost обнаружено 12 image blocks, где asset ref полностью совпадает с cover статьи. Один и тот же cover 1000×638 также используется двумя статьями о ландшафтном проектировании. Ничего не удалять автоматически: повтор может быть намеренной иллюстрацией в контексте body. Требуется визуальная проверка владельцем и решение по каждой статье.


12. **Блог — этап 1 merged и опубликован 12.11.2026:** PR #232 объединён squash в `main`, commit `75fcc9226fc05be2bf56e669b1ddd5ee83094a20`. CI по точному PR head `de12df4f0d55dea6b57fa2ec91b80f32638d41eb`: Blog and Studio validation run `43198224064` — success (lint, utility tests, website build, migration syntax/dry-run, Sanity Studio build); D1 validation run `43198224015` — success. Cloudflare Pages Production deployment `fba87951-81aa-406b-a1a7-f8894bf47c7f`, точный commit `75fcc9226fc05be2bf56e669b1ddd5ee83094a20`, deploy stage `success`, aliases `florial-bg.com` и `www.florial-bg.com`. Изменения блога работают в Production. **Остаётся:** визуальная проверка владельцем BG/RU/EN и мобильных ширин 320–360 px; CI/deployment не заменяют визуальную QA. Sanity schema/documents и Production data не менялись. Подробности: `docs/releases/2026-11-12-blog-stage1.md`.


Повторно проверять в актуальном main и соответствующих live services. Не считать вопрос закрытым по старой записи.

1. **Hosted Sanity Studio:** hosted build/deployment после добавления plantCare-полей AI-рекомендации и причины пригодности к Черноморскому побережью отдельно не подтверждён в последней записи паспорта.
2. **Gemini live smoke test:** требуется повторить тест с авторизованной Manager-сессией и согласованной тестовой записью. Root cause предыдущей ошибки не подтверждён.
3. **Старый CI run для `6c65e01e7c8d99994669158fe0aeb120136bebfa`:** D1 validation run `43095667280` остаётся `queued` без jobs и conclusion; причина задержки НЕ ИЗВЕСТНА. Позднее, на более новом main commit `2dba36582e8e19079eef6ad80108d882bd85c218`, GitHub Actions run `43099079700` завершился `success`: lint, website build, Pages Functions syntax и обе D1 migration validations прошли. Поэтому текущий подтверждённый main CI имеет успешный запуск; старый queued run не отменяли и не перезапускали. Ссылка: https://github.com/omaraandrey-dev/florial/actions/runs/43099079700.
4. **D1 migration 0014:** исторические записи `docs/ROADMAP_SERVICES_AND_LEADS.md` содержат разные статусы. Перед следующей D1 работой сверить живой migration ledger read-only и обновить паспорт/roadmap. Не запускать миграцию в рамках сверки.
5. **Legacy Cloudflare variables — аудит выполнен 11.11.2026:** live Pages project `florial` подтверждает Production: `SUPABASE_URL` (plain text), `SUPABASE_SERVICE_ROLE_KEY` (secret), `VITE_SUPABASE_URL` (plain text), `VITE_SUPABASE_PUBLISHABLE_KEY` (plain text); Preview: `VITE_SUPABASE_URL` и `VITE_SUPABASE_PUBLISHABLE_KEY`. Значения переменных/секретов не читались и не выводились. Статически проверены 115 файлов `src/**`, `functions/**`, `.github/workflows/**` и ключевые конфигурации на merge commit `6c65e01e7c8d99994669158fe0aeb120136bebfa`: упоминаний Supabase в runtime source/functions/workflows нет; `package.json` не содержит Supabase SDK; `.env.example` содержит только Sanity-переменные; `src/lib/sanity.ts` читает только `VITE_SANITY_*`. По текущему коду эти шесть Cloudflare variables выглядят неиспользуемыми. **Не удалять без отдельного явного согласования владельца**, так как это изменение Production/Preview settings. Вопрос остаётся открытым только до разрешения и удаления.
6. **Старые Manager документы:** setup/mobile QA/часть architecture содержат прежние Supabase Auth/Storage/RLS шаги. Они помечаются как исторические; актуальные рабочие инструкции поддерживать в Manager architecture и Technical Passport.

7. **Cloudflare D1 audit 11.11.2026:** live read-only inspection of `florial-db` found 17 tables via `sqlite_master`, while Cloudflare database-list metadata reported `num_tables: 0`; discrepancy unresolved. Live migration ledger is continuous `0001`–`0014`, latest `0014_contract_withdrawals`. Core relationship checks returned zero orphans and no negative order amounts. Full SQLite integrity/foreign-key PRAGMAs were not reliably confirmed; do not claim full integrity passed. Details and row counts are in [Technical Passport](../TECHNICAL_PASSPORT.md) and [CURRENT_STATE](CURRENT_STATE.md). No D1 changes were made.

Закрывать вопрос только с доказательством: commit/file, CI run, deployment ID, live query или smoke test. Production writes, Sanity publish, email, D1 migration и secrets требуют отдельного согласования.

9. **Фильтр направлений на странице услуг — PR #225 объединён в main:** merge commit a8db72ffda86e8d678cfe233a92ae88b0f82a892. CI по точному PR head d51a04b53f2393b824a78b7affe2700ac75f7014 завершился успешно: D1 validation run 43165329360 и Blog/Studio validation run 43165329362; lint, tests, website build, Pages Functions syntax, D1 checks и Sanity Studio build прошли. Используются четыре опубликованные Sanity photo documents; Sanity documents/schema не изменялись. **Проверено:** Cloudflare Pages Production deployment для merge commit a8db72ffda86e8d678cfe233a92ae88b0f82a892 завершился success (deployment 6a9c87fd-a424-4ab8-8895-9c560a0e2336); следующий успешный deployment aa669cbe91d5d467e66e7ccbb02b25b7a06569b8 включает тот же код и aliases florial-bg.com / www.florial-bg.com. **Ожидает:** мобильный визуальный QA (320–360 px), читаемость подписей и соответствие фотографий специалистам. Последующие документационные commits вызвали дополнительные Production builds, которые на момент записи ещё выполнялись.

10. **Перенос коммерческих статей блога в услуги — завершён 12.11.2026.** PR #226 merged (`7acdc09e0ea01739bb69eca1ee4a2711a8fbe75f`), Cloudflare Pages Production deployment `f22c3b8f-6d75-4228-b764-5bf32bbce497` success. Восемь service pages опубликованы; 99 product.relatedContent ссылок переведены на service IDs; старые восемь blogPost документов сохранены с `isPublished=false`. Все восемь старых URL проверены через live redirect до service page (final HTTP 200, query `lang` сохранён). Проектная статья `landshaften-dizain-proekt-zasazhdenie` остаётся опубликованной в блоге и связана с существующей услугой. Backups и детальный протокол — `docs/migrations/2026-11-12-blog-posts-to-services.md`. **Остаточная QA:** ручной визуальный осмотр всех восьми услуг в hosted Studio на BG/RU/EN. Sitemap.xml также проверен: все восемь service URL включены, восемь старых blog URL исключены; ландшафтный case study остаётся.


11. **RSS-лента услуг — опубликована и проверена 12.11.2026.** PR #229 объединён в main, commit `d9f8ded8a10ba3f477026e2ba04affeb427e5480`. Cloudflare Pages Production deployment `c1e03dc4-3b28-4575-920e-dae1e152ef02` — success, все build/deploy stages завершены. CI: Blog/Studio run `43176887544`, D1 PR run `43176887495` и post-merge D1 run `43177889083` — success. Live feed `https://florial-bg.com/feeds/services-bg.xml`: HTTP 200, `application/rss+xml; charset=utf-8`, RSS 2.0 XML; live homepage HTML содержит autodiscovery link на этот URL. **Осталось:** выбрать релевантные RSS-агрегаторы/каталоги и отправить туда URL; регистрация ещё не выполнялась.


## 2026-11-12 — Reconfirmed legacy Cloudflare variables (read-only)

- The service-page audit rechecked the live Cloudflare Pages project `florial`; legacy Supabase-named variables remain configured in Preview/Production. No values were added to documentation, and no variables, secrets, bindings or settings were changed.
- This confirms the existing 11.11 entry above; the previously recorded static audit found no Supabase references in 115 runtime/source/workflow files and no Supabase SDK in `package.json`. Removal still requires separate owner approval.
- Status: unchanged; this is not part of the service-content release.

13. **Блог — этап 2, featured landing card:** PR #233 объединён squash в `main`, commit `5e0c895c38a0903616d25f4dccde6cd596d20aed`. CI по точному PR head `28854bc4c92fb9faa0fa59a6322d6e0eb5cd3ad2`: Blog and Studio run `43201350601` — success (включая Studio build); D1 validation run `43201349713` — success. Cloudflare Pages Production deployment `392ec129-5551-48b2-a63f-cab5ead23c8c` для точного commit прошёл build и находится на стадии deploy; все стадии завершились `success`; aliases `https://florial-bg.com` и `https://www.florial-bg.com`. **Остаётся:** визуальная QA BG/RU/EN и мобильных 320–360 px. Pagination сознательно не добавлялась при текущих 14 опубликованных публикациях. Подробности: `docs/releases/2026-11-12-blog-stage2.md`.

14. **SEO-метаданные блога опубликованы 12.11.2026; image QA остаётся открытой:** в Sanity Production опубликованы 14 `blogPost`, 42 языковые версии BG/RU/EN и 126 значений `shortDescription`, `seoTitle`, `seoDescription`. Полный backup 14 исходных документов сохранён в `docs/backups/2026-11-12-blog-seo-before-draft-write.json`; post-publish read-back подтвердил 14/14 и 0 drafts. Уточнены болгарские формулировки четырёх статей. Slug отдельно проверены на уникальность среди всех 22 документов. **Остаётся:** визуально проверить 6 Wix href в четырёх BG статьях, 4 ALT-кандидата, повторы cover и 3 малых изображения; оригиналы не заменять без проверки. PR #235 остаётся draft до закрытия image follow-up: https://github.com/omaraandrey-dev/florial/pull/235. Детали: `docs/audits/2026-11-12-blog-seo-images.md`.

## Performance — responsive Header logo (12.11.2026)

- Ветка `perf/header-logo-responsive-srcset`, commit `7923e1534f028e57911109fd30a878dd3f400389`: применён существующий Sanity image helper к логотипу в Header. Визуальные CSS-параметры десктопа и мобильного Header не менялись.
- PR #239 закрыт; responsive logo implementation присутствует в `main` commit `c80d3f491d399c4df3ddc2662e3157fce7b953f4`. CI website lint/tests/build прошёл в рамках PR #240 (run `43260945549`). **Остаётся:** проверить выбранный srcset candidate и transfer size на DPR1/DPR2, визуальную регрессию desktop/tablet/mobile и повторный Lighthouse mobile/desktop. PSI исходный отчёт владельца: mobile Performance 96, LCP 2.7 s; logo image 887×444 / 331.2 KiB, Lighthouse estimate 267.1 KiB potential savings. Production для этого PR не менялся.
