# Florial — CURRENT STATE

> Snapshot date: 2026-11-21. Verified against live GitHub main, GitHub Actions and Cloudflare Pages. This is a handoff summary, not a substitute for the mandatory startup protocol or live checks before future changes.

## Latest main and Production release — 2026-11-21

- PR #450 (Manager Web Push) merged into main at 54026c75030e5f950576cc1b99f7ebf8903006f1.
- Exact merge-commit Blog/Studio validation run 44859242349 and D1 validation run 44859242327 both succeeded.
- Cloudflare Pages Production deployment e80238e2-af1a-4441-8134-4388124accee succeeded from the exact merge SHA; production aliases remain https://florial-bg.com and https://www.florial-bg.com.
- Manager Web Push implementation is deployed. D1 migration 0017 and VAPID Production configuration were applied and verified before merge under owner approval.
- Actual Android/Chrome subscription, persistence, push delivery, notification click, unsubscribe and re-subscribe are not yet independently verified. Do not create real Production orders/leads without an agreed test procedure.

## Latest documentation closeout — 2026-11-20

- PR #434 and final documentation closeout PR #435 are merged into `main`; PR #435 is documentation-only. Latest runtime changes remain PR #433 merge `0ec090932007d49c04f633875534af8eacbe49a6` and PR #432 merge `0f6368e0f758e8a16a7ddd321d598c61790e1373`; their Production deployments are recorded below and in CHANGELOG.
- Owner confirmed that the remaining Manager direct-catalog acceptance, password-reset acceptance and decision on the existing plant-care binding are complete/accepted. This is owner-confirmed acceptance, not a claim of independently captured browser or Resend delivery logs. No test email was sent during implementation.
- The legacy Cloudflare plant-care binding remains unchanged and accepted in its current state; do not disable it without separate approval.

## Latest main and Production release — 2026-11-19

- Latest application/runtime code commit in `main`: `9b697379c43db5e19a15bd91b48fb8d507da8479` (PR #410). PR #411 is documentation-only and merged at `93955895baa8777286cccacda2ef6731b0f392db`; it does not change runtime code.
- PR #410 synchronizes optional Schema.org Product `brand` between middleware and client ProductPage. Plant product-detail GROQ now fetches `brand->name`; equipment already did.
- Exact code commit `6b4c78f` passed Blog/Studio validation run `44432432693` (317/317 tests, TypeScript, lint, website build, migration syntax/dry-run, Studio typecheck/build) and D1 validation run `44432432898`. Latest PR head `8ce3257` also passed Blog/Studio run `44432666988` and D1 run `44432666815`.
- On merge commit `9b69737`, D1 validation run `44432799931` succeeded; Blog/Studio validation run `44432801621` succeeded on the exact merge commit.
- Cloudflare Pages Production deployment `ed8a8b40-bff1-4e35-948f-6b33970bcfff` succeeded from exact merge commit `9b69737`; aliases remain `https://florial-bg.com` and `https://www.florial-bg.com`.
- Google Rich Results Test on Production and Search Console URL Inspection remain pending. No Sanity documents/schema, Cloudflare settings/secrets, D1 data/schema, Resend or Google settings changed.

## Project and source of truth

- Repository: [omaraandrey-dev/florial](https://github.com/omaraandrey-dev/florial), default and production branch: `main`.
- GitHub `main` is the only main, authoritative and permanent source for code and technical documentation. All non-main refs are historical/auxiliary; ignore them during ordinary work. Start new work from the live HEAD of `main`.
- Business: Bulgarian online store for irrigation equipment, ready-made kits and plants, with related landscaping, planting, irrigation design/installation and maintenance services.
- Main language: Bulgarian; additional languages: Russian and English. Currency: EUR. Production: https://florial-bg.com.
- Priority geography: Bulgarian Black Sea coast, including Nessebar, Ravda, Sunny Beach, Sveti Vlas, Aheloy, Pomorie and nearby settlements. Do not add Sozopol to new geo-content without owner approval.

## Active architecture

- Sanity — published products, plants, categories, services and editorial content.
- Cloudflare Pages / Pages Functions — website hosting and server-side APIs.
- Cloudflare D1 — orders and Manager data.
- Resend — transactional email.
- Supabase is excluded from active architecture. Historical files under `docs/archive/supabase/` are for reference only; never execute or restore them.
- Owner-confirmed: legacy `SUPABASE_*` / `VITE_SUPABASE_*` variables that remain in Cloudflare Pages are intentionally retained dormant reserves, unused by Florial. Do not audit again, remove, change or read their values unless the owner explicitly starts a future Supabase activation project.
- Wix and Lovable are not the foundation of Florial.

## Latest verified main / CI / Production

- Latest verified application/Production source commit: `3ff2c96d208d7c871cbf6b5975b5458e6efff4ea`. PR #405 (Manager PostHog analytics) and PR #403 (15 Bulgarian plant category editorial updates plus audit/backups) are both merged. Documentation-only status updates do not change this runtime baseline; no open PRs after integration.
- PR #405 runtime implementation was merged at `a7da7916d2fc728432f116f395cc16038b0258ce`; the subsequent PR #403 merge is documentation/backups only and leaves that runtime unchanged.
- GitHub Actions on exact current main SHA `3ff2c96d208d7c871cbf6b5975b5458e6efff4ea`:
  - Blog and Studio validation run `44321010828` — success.
  - D1 migration validation run `44321010791` — success.
  - Cloudflare Pages check run `134859953008` — success.
- Cloudflare Pages Production deployment: `3edf0d48-e8ca-4d29-878d-a8e308c4d4c8`, URL `https://3edf0d48.florial.pages.dev`, exact source commit `3ff2c96d208d7c871cbf6b5975b5458e6efff4ea`; queued, initialize, clone, build and deploy stages all succeeded. Production aliases remain `florial-bg.com` and `www.florial-bg.com`.
- PostHog Manager feature was introduced by PR #405 and deployed in Production. The owner personally confirmed on 18.11.2026 that the Manager analytics page loads and displays PostHog data correctly; functional acceptance is complete. Cloudflare metadata confirms server secret `POSTHOG_API_KEY` as `secret_text`; its value was not read. Keep this credential server-side.
- Deployment success proves build/publication for this commit. Manager PostHog functional acceptance was separately confirmed by the owner in Production on 18.11.2026. Other unrelated visual/browser QA items remain tracked separately.
## Git branches and release governance

- GitHub returned 417 branch refs including `main`; 416 refs are non-main historical branches (including this cleanup branch). No open PRs.
- Only `main` is authoritative. Do not continue from an old branch without comparing it to the latest main and confirming the exact task.
- GitHub branch metadata at the 2026-11-18 audit reported `main` as `protected=false`; this is a separate optional repository-governance setting, not a reason to audit or clean old branches. The owner may enable PR/check protection in GitHub settings.
- Old refs are intentionally left alone as historical/auxiliary references. No branch-by-branch audit or cleanup is required; do not use them in ordinary work. See [BRANCH_HYGIENE](../operations/BRANCH_HYGIENE.md).

## Important infrastructure caveats

- Legacy Supabase-named Cloudflare Pages variables are intentionally retained dormant reserves by owner decision (18.11.2026). They are not part of the active Florial architecture. Do not remove or alter them; no further audit is required unless the owner explicitly proposes activating Supabase.
- Production has D1 binding `DB`. Preview is not equivalent to Production and does not have the same D1/server-side bindings; do not use Preview as a Manager/order acceptance environment without a separate safe test setup.
- D1's latest documented live audit is 2026-11-11; the migration 0014 status and table-count metadata discrepancy require a fresh read-only check before the next D1 migration.
- The legacy Supabase archive and old Manager setup documents are not current implementation instructions. Follow the current architecture and Manager Technical Passport.

## Active Google Shopping / SEO visibility workstream

- Roadmap: [GOOGLE_SHOPPING_SEO_ROADMAP_2026-11-18](../roadmaps/GOOGLE_SHOPPING_SEO_ROADMAP_2026-11-18.md). Any follow-up chat or implementation must read this roadmap first, update it with evidence, and continue from the first unfinished stage.
- Stage 1 is in progress; source audit and Search Console baseline are recorded in [stage-1 audit](../audits/2026-11-18-google-shopping-seo-stage-1-audit.md). Fresh Production Product HTML, Rich Results validation and URL Inspection remain pending. Windsor.ai Google Merchant Center connector has no connected account; standalone account status is unknown.

## Google Shopping / Product Schema workstream

- Active roadmap: [GOOGLE_SHOPPING_SEO_ROADMAP_2026-11-18.md](../roadmaps/GOOGLE_SHOPPING_SEO_ROADMAP_2026-11-18.md). Continue from its earliest unfinished item and update it after each material step.
- PR #407 was merged into `main` at `458dd9d8e8edb78973a4660f3796f43d4d1c22d2`; the Product Offer remediation is deployed to Production in Pages deployment `3deb2a5d-cd16-4201-821e-7b6d6c7bba09` from that exact SHA.
- Product Offer builder is shared between middleware and ProductPage. Plants use only the default first variant Offer; onRequest is not PreOrder. AggregateOffer is not used for a set of variants.
- ProductGroup is deferred because the published plants dataset has no non-empty variant SKU and the current route does not provide crawlable per-variant URLs.
- Product Offer implementation and tests passed full Blog/Studio validation run 44355759803 and D1 validation run 44355682858 (source code commit 8fd6704). Cloudflare Preview for functional code plus the updated roadmap succeeded at https://811f1545.florial.pages.dev (Preview commit df414aa). Later PR commits are documentation-only; latest checked PR head 7305780 had CI and Preview in progress.
- Google Rich Results Test and URL Inspection remain pending. The interactive Google test app and Preview pages were inaccessible through the available web reader; prefilled owner-run Rich Results links are in the roadmap/audit. Windsor.ai Search Console fields do not expose URL Inspection.
- ProductGroup remains deferred: no plant variant SKU is populated in published Sanity, and there are no crawlable per-variant URLs.

## Current work boundaries / pending verification

- Manager PostHog on-demand analytics is deployed and owner-accepted. The owner confirmed successful PostHog data display in Manager Production on 18.11.2026.
- The irrigation engineer assistant is intentionally paused after stage 7; PR #349 is merged. Do not begin stage 8 without the owner's explicit request.
- Live rendered HTML QA is still pending for the refreshed plant root category and olive article BG/RU/EN; winter landscape article RU/EN rendering also remains pending. Published Sanity read-back is not the same as browser rendering.
- Service hreflang projection, Manager Gemini smoke, irrigation product SEO inventory refresh, Google Search Console indexing checks and matched performance measurements remain listed in [OPEN_QUESTIONS](OPEN_QUESTIONS.md).
- Historical open-question notes were preserved in [OPEN_QUESTIONS_HISTORY_2026-11-18.md](../archive/OPEN_QUESTIONS_HISTORY_2026-11-18.md).

## Required startup reading

1. [AI_INSTRUCTIONS.md](../../AI_INSTRUCTIONS.md)
2. [START_HERE.md](START_HERE.md)
3. [WORK_PROTOCOL.md](WORK_PROTOCOL.md)
4. [MASTER_SPEC.md](MASTER_SPEC.md)
5. [TECHNICAL_PASSPORT.md](../TECHNICAL_PASSPORT.md)
6. [CHANGELOG.md](../../CHANGELOG.md)
7. [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md)
8. Relevant source, tests, workflows and live services for the task.


### Latest Google structured-data QA (18.11.2026)

- Schema.org Validator: corrected PR Preview equipment and plant each report 5 items, 0 errors, 0 warnings; Product and BreadcrumbList appear twice because the middleware canonical URL is Production while client markup uses the Preview host.
- Current Production equipment baseline: 3 items, 0 errors, 0 warnings (Organization 1, BreadcrumbList 1, Product 1); this is pre-PR code.
- Official Google Rich Results Test requires login/reCAPTCHA and returned “Log in and try again”; no Google test outcome confirmed. Owner-authenticated run and later Production retest remain pending. Details in roadmap and audit.


## Google Shopping / Product Schema — merge and Production release

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

