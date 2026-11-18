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

- Current GitHub `main` HEAD after the documentation-policy merge: `ef7c3927cc9eee3791b5578a17d8d1e6f6d12f8d` (documentation-only PR #401).
- Latest verified application/CI/Production baseline remains `34a472b813119b72cc45d2009fbe3bd1ce617d4d`; the commits after it in this snapshot are documentation-only and do not change runtime code.
- Open PRs: **0**.
- GitHub Actions on this exact SHA:
  - [Blog and Studio validation #44301545917](https://github.com/omaraandrey-dev/florial/actions/runs/44301545917) — success. Includes npm ci, TypeScript, lint, tests, website build, migration dry-run and Sanity Studio typecheck/build.
  - [Florial D1 migration validation #44301545919](https://github.com/omaraandrey-dev/florial/actions/runs/44301545919) — success. Includes lint/build, Pages Functions syntax and migration checks.
- Cloudflare Pages Production deployment: `4fb5bbd8-5fcc-4f53-9c16-4d7a8356689f`, exact source commit `34a472b813119b72cc45d2009fbe3bd1ce617d4d`; queued, initialize, clone, build and deploy stages all succeeded. Aliases: `florial-bg.com`, `www.florial-bg.com`.
- Live Pages project is connected to GitHub repo `omaraandrey-dev/florial`; Production branch `main`; build command `npm run build`; output `dist`; Pages Functions are enabled.
- Deployment success proves build/publication for this commit; it does not replace browser QA or functional acceptance tests.

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

## Current work boundaries / pending verification

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
