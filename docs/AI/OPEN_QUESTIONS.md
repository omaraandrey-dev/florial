# Florial — текущие открытые вопросы и проверки

Дата сверки: 2026-11-19. Этот файл содержит только вопросы, которые остаются актуальными. Полная предыдущая история, включая закрытые задачи и старые проверки, сохранена без изменений в [OPEN_QUESTIONS_HISTORY_2026-11-18.md](../archive/OPEN_QUESTIONS_HISTORY_2026-11-18.md).

Перед закрытием любого пункта требуется доказательство: commit/file, CI run, deployment ID, live query или browser smoke. Не считать старую запись доказательством текущего состояния.

## 1. Главная ветка и репозиторий

- `main` — единственная главная и авторитетная ветка Florial. Все остальные ветки — исторические/вспомогательные refs; владелец решил не проводить их дальнейшую инвентаризацию, сравнение или удаление. В обычной работе их игнорировать и начинать новые задачи от актуального HEAD `main`.
- На дату последней проверки открытых PR было 0. Наличие старых веток не считается открытой задачей и не влияет на Production.
- GitHub branch metadata на 18.11.2026 показывала `main.protected=false`. Настройка защиты main — отдельная опция GitHub governance; не блокирует использование main как единственного источника истины.

## 2. Cloudflare Pages — dormant legacy variables

- Решение владельца от 18.11.2026: legacy-переменные `SUPABASE_*` / `VITE_SUPABASE_*`, которые могут оставаться в Cloudflare Pages Production/Preview, намеренно сохранены как неактивный резерв «на всякий случай».
- Они не являются частью действующей архитектуры Florial и не используются проектом. Не удалять, не изменять, не читать значения и не проводить повторные проверки только из-за их наличия.
- Возвращаться к этому вопросу только если владелец отдельно решит активировать Supabase или изменить инфраструктурную политику.

## 3. Текущие QA и технические вопросы

- **PostHog telemetry coverage:** live ingestion is active and five Florial events are confirmed in project `349453`. The code paths for `florial_phone_click`, `florial_chat_click` and `florial_checkout_start` were not present in the live event schema on 18.11.2026. Investigate delivery/trigger coverage before treating these as available analytics. Dashboard and evidence: `docs/FLORIAL_ANALYTICS_CONSENT_POSTHOG.md`.
- **Hreflang услуг:** ранее Production QA выявил неполные alternates для `avtomatizirano-kapkovo-napoyavane`. Проверить текущие BG/RU/EN HTML, исправить только SEO projection при подтверждении дефекта и повторно проверить все локали.
- **Растения и статьи:** Sanity Published read-back подтверждён, но live rendered HTML/browser QA остаётся неподтверждённым для категории `/category/rastenia` и статьи об оливе BG/RU/EN; для зимней статьи BG проверен, RU/EN остаются pending. Google recrawl/indexing не подтверждены. См. соответствующие audits в `docs/audits/`.
- **Hosted Sanity Studio:** проверить фактический hosted Studio deployment после последних schema updates, если работа затронет Studio; успешный Studio build в CI сам по себе не доказывает hosted deployment.
- **Gemini Manager smoke:** повторить только с авторизованной Manager-сессией и согласованной тестовой записью; root cause прежней ошибки не подтверждён.
- **D1 migration ledger:** последняя задокументированная read-only сверка 2026-11-11 видела миграции `0001–0014`, но исторические roadmap записи расходились по статусу `0014`. Также было расхождение между `sqlite_master` (17 таблиц) и Cloudflare metadata (`num_tables: 0`). Перед следующей D1 migration/write выполнить read-only сверку live ledger/schema; полная SQLite integrity/foreign-key проверка не подтверждена.
- **Irrigation product SEO:** базовый аудит 2026-11-13 выявил 193/275 товаров без отдельного локализованного H1 и 143 с неполными RU/EN meta-полями. Это исторические counts, не актуальная перепись. Перед любым исправлением повторно получить live inventory; bulk apply, перезаписывающий заполненные поля, не использовать.
- **Google Shopping / Product Schema / Search Console:** продолжать строго по [дорожной карте](../roadmaps/GOOGLE_SHOPPING_SEO_ROADMAP_2026-11-18.md). PR #407 and PR #410 are merged; Product Offer remediation and brand parity are deployed to Production. CI for the corrected Product Schema and merge commit passed (see CHANGELOG and roadmap). Owner-provided Google Inspection Tool output on 19.11.2026 confirms successful crawl, indexing allowed, and Product, Merchant listings and Breadcrumbs detected without errors for Kumquat; the valve's later indexed state is owner-reported. These are URL Inspection observations, not a separately authenticated standalone Rich Results Test. Optional warnings remain: review/aggregateRating (do not fabricate), availability for `onRequest` (intentionally omitted), and shipping/return policy fields (blocked on confirmed business terms). Plant stock statuses for three palms were normalized in published Sanity; active plant counts are 26 inStock / 3 outOfStock / 21 onRequest with no root-vs-first-variant mismatch. The Offer helper files in `src/lib` and `functions/_lib` are currently identical but duplicated; consider a parity test or consolidation before future behavior changes. The BG `/terms` page remains marked as a legal-review draft, but the owner instructed to use the existing published rules for Google policy markup. Organization-level `MerchantReturnPolicy` now links to `/terms` using `merchantReturnLink` without inventing universal return conditions. Shipping markup remains open: current delivery terms do not specify the exact supported destination list or rate/transit-time values; do not infer country-wide or worldwide delivery. Dedicated Rich Results Test, broader URL Inspection/sitemap checks, Merchant Center account setup and commercial policy confirmation remain open. Merchant Center was confirmed not registered by owner on 18.11.2026.
- **Performance:** несколько старых release audits не имеют сопоставимых post-release Lighthouse/CLS/INP замеров. Не приписывать улучшение производительности без повторных измерений.

- **Google ProductGroup readiness:** Product Offer remediation passed CI on commit 92da3ec (Blog/Studio validation run 44355682859; D1 validation run 44355682858) and Cloudflare Preview deployed at https://9ba37c43.florial.pages.dev. Google Rich Results Test remains pending because the interactive testing application was not accessible through the available web reader; prefilled owner-run links are in the active roadmap/audit. Published plants dataset has 50 product documents with saleVariants and 0 documents with a non-empty SKU on any variant; current routing does not provide crawlable per-variant URLs. Do not implement ProductGroup or fabricate SKU/GTIN until real variant identifiers and variant URLs are added. Windsor.ai Search Console connector does not expose URL Inspection fields; use Search Console UI/API. Roadmap: [GOOGLE_SHOPPING_SEO_ROADMAP_2026-11-18.md](../roadmaps/GOOGLE_SHOPPING_SEO_ROADMAP_2026-11-18.md).

## 4. Намеренно приостановленная инженерная работа

- **Irrigation engineer assistant / Rain Bird 3500:** stage 7 (#349) уже объединён в `main` commit `1ddd1d99dd6cf086303c09ff2f856e96db84a8e6`. Workstream намеренно paused; stage 8 не начинать без отдельной просьбы владельца. Инженерные ограничения и порядок возобновления: [PAUSED_WORK_IRRIGATION_ENGINEER_ASSISTANT_2026-11-16.md](PAUSED_WORK_IRRIGATION_ENGINEER_ASSISTANT_2026-11-16.md).

## 5. Подтверждённое закрытие

- PR #383 (Manager plant catalog search controls / Seller permissions) merged в `main` commit `1716996c487c3dbfa6995b4eaa7a617cb90ad480`; не считать его открытой задачей.
- На момент сверки открытых PR: 0.
- Актуальный build/deployment статус зафиксирован в [REPOSITORY_RELEASE_READINESS_2026-11-18.md](../operations/REPOSITORY_RELEASE_READINESS_2026-11-18.md).


- **Google Product Schema validation:** PR #407's corrected Preview equipment and plant pages were parsed by Schema.org Validator: each 5 items, 0 errors, 0 warnings. Preview shows two Product and two BreadcrumbList nodes because middleware canonical URLs point to Production while client-rendered URLs use the Preview host; current Production equipment baseline has one Product and one BreadcrumbList. Official Google Rich Results Test is blocked by login/reCAPTCHA in the remote browser; no Google result exists yet. Rerun in an authenticated owner browser and after the corrected code is deployed to Production with approval. Roadmap: [GOOGLE_SHOPPING_SEO_ROADMAP_2026-11-18.md](../roadmaps/GOOGLE_SHOPPING_SEO_ROADMAP_2026-11-18.md).


## 2026-11-18 — PR #407 merged and Product Offer remediation deployed to Production

- PR #407 (Product Offer JSON-LD remediation, Google Shopping roadmap and stage-1 audit) merged into `main`; merge commit / exact `main` HEAD at verification: `458dd9d8e8edb78973a4660f3796f43d4d1c22d2`.
- Pre-merge comparison confirmed PR head `f30af1e940d8bccb627a55265c6fa6468651b520` was 42 commits ahead and 0 behind current `main`; the merge used expected head SHA protection.
- GitHub Actions on exact PR head `f30af1e`: Blog and Studio validation run `44358163151` — success; D1 migration validation run `44358126198` — success. A subsequent Blog and Studio run `44358126185` also succeeded. No workflow runs were returned for the merge commit itself; do not describe those PR-head checks as merge-commit CI.
- Cloudflare Pages Production deployment `3deb2a5d-cd16-4201-821e-7b6d6c7bba09` succeeded at `2026-11-18T18:08:28Z`; source branch `main`, exact source commit `458dd9d8e8edb78973a4660f3796f43d4d1c22d2`. Production aliases are `https://florial-bg.com` and `https://www.florial-bg.com`.
- The shared Product Offer implementation is now in Production. Schema.org Validator evidence in the PR applies to the Preview pages; the previous Production validator result is a pre-release baseline. Google Rich Results Test on Production has not yet been run and is not claimed as passed.
- Owner-run Google Rich Results Test links for Production:
  - Equipment: https://search.google.com/test/rich-results?url=https%3A%2F%2Fflorial-bg.com%2Fproduct%2Frain-bird-100-pga-9v
  - Plant: https://search.google.com/test/rich-results?url=https%3A%2F%2Fflorial-bg.com%2Fproduct%2Fcitrus-japonica-kumquat
- Stages 1 and 2 of the roadmap remain open pending authenticated Google Rich Results evidence and the remaining Search Console URL Inspection checks. Merchant Center account was confirmed by the owner as not yet registered; Merchant Center setup remains a later roadmap stage.
- No Sanity schema/documents, Cloudflare settings/secrets, D1 data/schema, Resend or Google settings were changed. The only Production change was the automatic Pages deployment from the explicitly approved PR merge.

