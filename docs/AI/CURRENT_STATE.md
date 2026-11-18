# Florial — CURRENT STATE

> Snapshot date: 2026-11-18. Verified against live GitHub main and Cloudflare Pages. This is a handoff summary, not a substitute for the mandatory startup protocol or live checks before future changes.

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

- Latest GitHub main HEAD at 18.11.2026: 02a19a0978591f61b08ed28fa3b34479e99d1e01 (PR #408, documentation-only). Latest verified application/Production source commit: 458dd9d8e8edb78973a4660f3796f43d4d1c22d2 (PR #407 Product Offer remediation).
- Cloudflare Pages Production deployment 3deb2a5d-cd16-4201-821e-7b6d6c7bba09 succeeded at 2026-11-18T18:08:28Z for exact runtime source commit 458dd9d8e8edb78973a4660f3796f43d4d1c22d2; aliases remain https://florial-bg.com and https://www.florial-bg.com.
- PR #407 head checks: Blog and Studio validation 44358163151 — success; D1 migration validation 44358126198 — success; follow-up Blog and Studio run 44358126185 — success. No workflow run was returned for the merge commit itself; do not label PR-head checks as merge-commit CI.
- PR #408 is documentation-only and does not change the Production runtime. Open PR count was 0 at the 18.11.2026 audit check (before the current documentation follow-up).
- PostHog Manager feature was introduced by PR #405 and deployed in Production. The owner personally confirmed on 18.11.2026 that the Manager analytics page loads and displays PostHog data correctly; functional acceptance is complete. Cloudflare metadata confirms server secret POSTHOG_API_KEY as secret_text; its value was not read. Keep this credential server-side.
- Deployment success proves build/publication for the exact runtime source commit. Manager PostHog functional acceptance was separately confirmed by the owner. Other unrelated visual/browser QA items remain tracked separately.

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

- Roadmap: [GOOGLE_SHOPPING_SEO_ROADMAP_2026-11-18](../roadmaps/GOOGLE_SHOPPING_SEO_ROADMAP_2026-11-18.md). Any follow-up must read this roadmap first, update it with evidence, and continue from the first unfinished stage.
- PR #407 Product Offer remediation is deployed to Production from runtime commit 458dd9d8e8edb78973a4660f3796f43d4d1c22d2 (Pages deployment 3deb2a5d-cd16-4201-821e-7b6d6c7bba09). Current GitHub main is 02a19a0978591f61b08ed28fa3b34479e99d1e01 after documentation-only PR #408.
- Live initial HTML for Rain Bird 100-PGA-9V and Kumquat was fetched: both return HTTP 200 with Product, BreadcrumbList and Organization JSON-LD; homepage includes Organization and two GardenStore nodes. Manual JSON parsing succeeded.
- Confirmed remaining defect: after client hydration, Rain Bird Product JSON-LD omits brand, although server initial HTML includes it and route data already supplies product.brand. A small client Product-node parity patch and regression test are the next recommended code task; no code change has yet been made.
- GSC URL Inspection is PASS for Rain Bird and Kumquat, but stored crawls are 2026-11-05 and 2026-11-09, before PR #407 deployment. Sitemap: 1,327 URLs, 0 errors/warnings, last downloaded 2026-11-16. Post-release Google crawl remains pending.
- Published Sanity counts: irrigation production 275 active products, 267 with brand, 263 with SKU, 0 with EAN; plants 50 active products, 70 sale variants, 0 variant SKUs. ProductGroup/GTIN remain deferred until real identifiers and crawlable variant URLs exist.
- Full post-deployment Schema.org Validator and authenticated Google Rich Results Test remain pending (Cloudflare Browser Rendering HTTP 429; Google test requires the owner's authenticated browser). Manual JSON-LD parsing is not a validator result. Merchant Center remains unregistered per owner confirmation.

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

