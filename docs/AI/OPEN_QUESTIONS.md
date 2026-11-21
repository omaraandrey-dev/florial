## 2026-11-21 — Manager plant editor UX acceptance

- Exact PR head `a7219381ed47ebaa6cc44f3ee2365d3cb08be7a1`: Blog and Studio run `44921957018` and D1 validation run `44921957051` both succeeded.
- OPEN: Owner acceptance of Seller/Manager and Owner editor workflows on phone and desktop. Confirm unsaved-change warnings and role-specific field visibility in authenticated sessions.
- No Preview/Production deployment was performed; do not treat CI success as live UI acceptance.

---

## 2026-11-21 — Bank transfer checkout / proforma release checks


- Implementation is on `feat/bank-transfer-proforma-invoice`; PR and CI verification are pending.
- OPEN: verify Blog/Studio validation, D1 validation and Pages Preview on the exact PR head. Confirm PDF font loading and inspect generated Bulgarian PDF visually, including a long item list and multiple-page behavior.
- OPEN: owner acceptance of bank transfer checkout wording and the rule that bank transfer is unavailable while plant delivery cost is still being agreed.
- OPEN: after merge and Production deployment are explicitly approved, use an agreed safe test order/email procedure; do not create a real Production order or send a test email without approval.
- The implementation does not create a tax invoice. The PDF is a proforma/payment request. Confirm with the company's accountant the exact tax-document issuance point and whether the five-day term should be attached to the proforma or only to a later tax invoice before representing it as a legally issued invoice.

## 2026-11-21 — Manager real-event visibility and push follow-up

- Owner reports the Owner-only push self-test and lifecycle checks 2.1, 2.2 and 2.3 as working.
- Owner created a service enquiry and a plant order in Production. The new records did not appear in Manager until a manual pull-to-refresh.
- Code review found the UI cause: order list polling was 15 minutes; service-lead list had no polling. PR #453 proposes 20-second visible-tab polling for both, plus focus/visibility refresh and overlap protection.
- [x] Exact-head CI and Preview for PR #453 passed (Blog/Studio 44867072658; D1 44867072702; Preview https://fab55962.florial.pages.dev). OPEN: merge and verify exact-SHA Production deployment.
- OPEN: independently confirm actual push reception for a real order on active Owner/Manager/Seller subscriptions and a service enquiry on Owner only. The owner report about list visibility does not establish whether the push notification itself arrived.
- OPEN: confirm notification tap opens the correct Manager section. No additional test orders/leads/emails should be created for QA without an agreed safe scenario.

# Florial — текущие открытые вопросы и проверки

Дата сверки: 2026-11-21.

## 2026-11-21 — Manager Web Push: post-release QA

- PR #450 merged into main at 54026c75030e5f950576cc1b99f7ebf8903006f1.
- Exact merge-commit Blog/Studio validation run 44859242349 — success; D1 validation run 44859242327 — success.
- Cloudflare Pages Production deployment e80238e2-af1a-4441-8134-4388124accee succeeded from the exact merge SHA; aliases florial-bg.com and www.florial-bg.com.
- Production D1 migration 0017 and VAPID variables were configured and verified before merge. Push implementation is deployed, but actual device subscription/delivery is not independently verified.
- OPEN: verify authenticated Manager Push UI and GET/POST/DELETE /api/manager/push/subscriptions on a real device; verify D1 subscription ownership without exposing endpoint/key material.
- OPEN: Android/Chrome permission, subscribe, persistence after reload, real push delivery, notification click to correct Manager section, unsubscribe and re-subscribe for Owner, Manager and Seller.
- OPEN: verify order push recipients (active Owner/Manager/Seller), service-lead recipients (active Owner only), test-order exclusion (is_test=1) and no customer PII in payload.
- Do not create real Production orders/leads or send test emails without an agreed safe test scenario. A safe way to trigger events without affecting real customers/data is required.
- Live Production scrape returned HTTP 200 for /manager/ (Bulgarian staff sign-in page, robots noindex/nofollow) and HTTP 401 Authentication required for unauthenticated GET /api/manager/push/subscriptions. Route presence/auth gating are verified; authenticated behavior and delivery remain open. Owner reports Manager appears to work.
- PRAGMA integrity_check remains unavailable through the current D1 API (SQLITE_AUTH); PRAGMA foreign_key_check after migration 0017 returned zero violations.

## 2026-11-20 — Manager Web Push: release prerequisites (historical snapshot; superseded by the 2026-11-21 status above)

- PR #450 contains the Manager Web Push implementation and remains Draft. Exact implementation/test head `a908426f3355c793e369ea0e0adaae170bbac6de` passed Blog/Studio run `44793855068`, D1 run `44793855086`, and Preview deployment `33d99b8b-e866-4701-85a9-d6809c9c62df`.
- Production D1 migration and VAPID setup were pending at that historical checkpoint; both were later completed with separate owner approval.
- Real Android Chrome install/permission/subscribe/push/click/unsubscribe verification remains pending.

## 2026-11-20 — Sanity category schema descriptor: legacy SEO fields

- При публикации контекстной ссылки в категории `Ротаторни дюзи` (`6690848d-a4a5-4386-b9ae-5f63604914b1`) Sanity document validator отметил существующие root-поля `seoTitle` и `seoDescription` как unknown fields для текущего descriptor типа `category`.
- Сами поля не изменялись в задаче переноса статьи; публикация категории прошла успешно, а локализованные ссылки на статью присутствуют в SEO content.
- Нужно сверить deployed schema descriptor с исходниками единственной Studio в GitHub и определить, являются ли эти поля историческим остатком или пропущенными schema fields. Не удалять значения и не менять schema до отдельной проверки и согласования.

Полная предыдущая история, включая закрытые задачи и старые проверки, сохранена без изменений в [OPEN_QUESTIONS_HISTORY_2026-11-18.md](../archive/OPEN_QUESTIONS_HISTORY_2026-11-18.md).



## 2026-11-20 — rotary nozzle replacement service: remaining verification

- Owner confirmed the published service changes work in the live interface. Sanity Production read-back confirmed the edited fields, unchanged slug/ID and preserved image assets.
- **Not independently verified:** browser-based visual/rendered HTML check of the public service URL and an end-to-end lead-form submission. The external page reader could not retrieve the URL. Do not claim those tests passed.
- Sanity beta validator reports `valid` but `complete=false`: custom validation callbacks (including custom slug uniqueness callbacks) were not executed. Built-in validation passed.
- Documentation PR #442 is merged in `main` at `ef1c0b5881759ee114665c6231fe09d80d52f362`; PR-head Blog/Studio and D1 workflows passed. No frontend/schema/runtime change or Production deployment was made.



## 2026-11-20 — Manager: приёмка закрыта подтверждением владельца

- Owner/Manager/Seller: владелец подтвердил, что приёмку прямого каталога считает пройденной.
- Password reset: владелец подтвердил, что проверку считает пройденной. Важно: во время реализации отдельное тестовое письмо не отправлялось; это owner-confirmed acceptance, а не сохранённый нами Resend delivery log.
- Cloudflare plant-care service binding: оставлен без изменений; владелец принимает его текущий статус. Отключение не требуется в рамках этой задачи и запрещено без отдельного согласования.
- Эти пункты закрыты как задачи текущего workstream. При будущих изменениях соответствующие сценарии проверяются повторно.

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
- **D1 migration ledger:** актуальная Production сверка 2026-11-21 подтвердила миграцию `0017_manager_push_subscriptions`, таблицу и индексы; `PRAGMA foreign_key_check` — 0 нарушений. `PRAGMA integrity_check` остаётся недоступным через Cloudflare D1 API (`SQLITE_AUTH`); повторять его без изменения метода доступа не требуется.
- **Irrigation product SEO:** базовый аудит 2026-11-13 выявил 193/275 товаров без отдельного локализованного H1 и 143 с неполными RU/EN meta-полями. Это исторические counts, не актуальная перепись. Перед любым исправлением повторно получить live inventory; bulk apply, перезаписывающий заполненные поля, не использовать.
- **Google Shopping / Product Schema / Search Console:** продолжать строго по [дорожной карте](../roadmaps/GOOGLE_SHOPPING_SEO_ROADMAP_2026-11-18.md). PR #407 and PR #410 are merged; Product Offer remediation and brand parity are deployed to Production. CI for the corrected Product Schema and merge commit passed (see CHANGELOG and roadmap). Owner-provided Google Inspection Tool output on 19.11.2026 confirms successful crawl, indexing allowed, and Product, Merchant listings and Breadcrumbs detected without errors for Kumquat; the valve's later indexed state is owner-reported. These are URL Inspection observations, not a separately authenticated standalone Rich Results Test. Optional warnings remain: review/aggregateRating (do not fabricate), availability for `onRequest` (intentionally omitted), and shipping/return policy fields (blocked on confirmed business terms). Plant stock statuses for three palms were normalized in published Sanity; active plant counts are 26 inStock / 3 outOfStock / 21 onRequest with no root-vs-first-variant mismatch. The Offer helper files in `src/lib` and `functions/_lib` are currently identical but duplicated; consider a parity test or consolidation before future behavior changes. The BG `/terms` page remains marked as a legal-review draft, but the owner instructed to use the existing published rules for Google policy markup. Organization-level `MerchantReturnPolicy` now links to `/terms` using `merchantReturnLink` without inventing universal return conditions. Shipping markup remains open: current delivery terms do not specify the exact supported destination list or rate/transit-time values; do not infer country-wide or worldwide delivery. Dedicated Rich Results Test, broader URL Inspection/sitemap checks, Merchant Center account setup and commercial policy confirmation remain open. Merchant Center was confirmed not registered by owner on 18.11.2026.
- **Performance:** несколько старых release audits не имеют сопоставимых post-release Lighthouse/CLS/INP замеров. Не приписывать улучшение производительности без повторных измерений.

- **Google ProductGroup readiness:** Product Offer remediation passed CI on commit 92da3ec (Blog/Studio validation run 44355682859; D1 validation run 44355682858) and Cloudflare Preview deployed at https://9ba37c43.florial.pages.dev. Google Rich Results Test remains pending because the interactive testing application was not accessible through the available web reader; prefilled owner-run links are in the active roadmap/audit. Published plants dataset has 50 product documents with saleVariants and 0 documents with a non-empty SKU on any variant; current routing does not provide crawlable per-variant URLs. Do not implement ProductGroup or fabricate SKU/GTIN until real variant identifiers and variant URLs are added. Windsor.ai Search Console connector does not expose URL Inspection fields; use Search Console UI/API. Roadmap: [GOOGLE_SHOPPING_SEO_ROADMAP_2026-11-18.md](../roadmaps/GOOGLE_SHOPPING_SEO_ROADMAP_2026-11-18.md).

## 4. Намеренно приостановленная инженерная работа

- **Irrigation engineer assistant / Rain Bird 3500:** stage 7 (#349) уже объединён в `main` commit `1ddd1d99dd6cf086303c09ff2f856e96db84a8e6`. Workstream намеренно paused; stage 8 не начинать без отдельной просьбы владельца. Инженерные ограничения и порядок возобновления: [PAUSED_WORK_IRRIGATION_ENGINEER_ASSISTANT_2026-11-16.md](PAUSED_WORK_IRRIGATION_ENGINEER_ASSISTANT_2026-11-16.md).

## 5. Подтверждённое закрытие
- **2026-11-20 — внутренняя перелинковка доставки крупномерных растений закрыта:** 35 товаров, категория «Солитеры» (BG/RU/EN) и четыре страницы услуг обновлены в Sanity; Published read-back и Production HTML проверки прошли. Детали и snapshots: `docs/audits/2026-11-20-large-specimen-delivery-internal-links.md` и `docs/backups/sanity/2026-11-20-large-specimen-links-*.json`. Открытых действий по этой задаче нет.

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



## 2026-11-19 — Manager order details / proforma task closed

- PR #430 merged into `main` as `881db09ed84b0887560ddebc38fdcfa54aab4bcd`; implementation and documentation are in the authoritative branch.
- PR-head CI workflows passed and Cloudflare Preview succeeded. Cloudflare Pages Production deployment `6d8c4a4b-3cdc-43d8-a782-06223d32b55e` succeeded from the exact merge commit.
- Owner reports that the updated order workflow appears to work in the live interface; the task is paused at the owner's request.
- A separate independently observed Resend end-to-end delivery test to the customer and active Owner was not performed. Do not treat email delivery as independently verified. No live test order or test email was created by the assistant.
- Company email and IBAN are recorded in `docs/business/FLORIAL_COMPANY_PROFILE.md`.

## 2026-11-20 — delivery of large specimen plants service closeout

- Published service `df7893e8-902e-4265-921c-3cb0fd270cc8` is live at https://florial-bg.com/services/dostavka-na-edrorazmerni-rasteniya. BG/RU/EN public fetches returned HTTP 200 with localized metadata and indexable robots directives.
- No unresolved category decision remains: `planting` is the existing supported Gardener mapping in BG/RU/EN.
- Remaining verification boundary: no real Production enquiry was submitted, so the form's end-to-end delivery path was not tested. Do not create a test lead without approval.
- Detailed evidence and backups: `docs/audits/2026-11-20-delivery-plants-service-publication.md`.

