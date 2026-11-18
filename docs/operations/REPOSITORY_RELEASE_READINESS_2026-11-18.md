# Florial — repository and release readiness audit

Date: 2026-11-18  
Repository: `omaraandrey-dev/florial`  
Original baseline main HEAD: `34a472b813119b72cc45d2009fbe3bd1ce617d4d`

## Addendum 2026-11-18 — latest main after PR #405 and PR #403

- Current `main` HEAD: `3ff2c96d208d7c871cbf6b5975b5458e6efff4ea`; open PRs: 0.
- PR #405 (on-demand PostHog analytics in Manager) merged at `a7da7916d2fc728432f116f395cc16038b0258ce`. The Manager GET request was corrected to send no body; the server accepts `POSTHOG_PERSONAL_API_KEY` or the existing `POSTHOG_API_KEY` alias. PR #403 (Bulgarian editorial updates for 15 plant categories, audit and five Sanity backups) merged at `3ff2c96d208d7c871cbf6b5975b5458e6efff4ea`; common documents were synchronized without losing either record.
- Exact-current-main GitHub Actions: Blog/Studio run `44321010828` — success; D1 validation run `44321010791` — success; Cloudflare Pages check `134859953008` — success.
- Exact-current-main Cloudflare Pages Production deployment: `3edf0d48-e8ca-4d29-878d-a8e308c4d4c8`, source commit `3ff2c96d208d7c871cbf6b5975b5458e6efff4ea`; all stages succeeded.
- Cloudflare Production metadata confirms `POSTHOG_API_KEY` is present as `secret_text`; its value was not read. Live PostHog Query API validity/scope and authenticated Manager UI acceptance remain pending. No Cloudflare secret/settings were changed during this verification.


## Executive result

**The original baseline commit was green in GitHub Actions and successfully deployed to Cloudflare Pages Production.** The latest main/CI/Production state is recorded in the addendum above; it supersedes the historical baseline below.

This readiness audit is a baseline for the verified commit. By owner decision dated 2026-11-18, non-main refs are historical/auxiliary and require no further inventory or cleanup. Legacy Supabase-named Cloudflare variables are intentionally retained dormant reserves and require no removal or repeat audit. The optional GitHub branch-protection setting is separate from the fact that main is the sole authoritative branch.

## 1. GitHub main

- Default branch: `main`.
- Exact HEAD: `34a472b813119b72cc45d2009fbe3bd1ce617d4d`.
- Open Pull Requests at verification: **0**.
- Branch refs: 417 total including main; 416 non-main refs remain (including this cleanup branch).
- GitHub branch metadata: `main.protected=false`; repository rulesets query: empty.
- Branch protection details endpoint returned 403 to the connected integration; it could not inspect the full settings. The branch listing flag and empty rulesets are sufficient to treat protection as not configured.
- Historical branch refs were not deleted because the integration exposes no branch-delete action and unique commits/checkpoints were not individually audited. Full policy: [BRANCH_HYGIENE.md](BRANCH_HYGIENE.md).

## 2. CI on the exact current main SHA

- [Blog and Studio validation — run 44301545917](https://github.com/omaraandrey-dev/florial/actions/runs/44301545917): **success**.
  - npm ci, TypeScript typecheck, lint, tests, website build, migration syntax/dry-run, Sanity Studio typecheck and build.
- [Florial D1 migration validation — run 44301545919](https://github.com/omaraandrey-dev/florial/actions/runs/44301545919): **success**.
  - lint, website build, Pages Functions syntax, additive migration validation and contract-withdrawals migration validation.
- Both runs refer to the exact main SHA above.

## 3. Cloudflare Pages Production

Live project metadata confirms:
- Project: `florial`.
- GitHub source: `omaraandrey-dev/florial`.
- Production branch: `main`.
- Build command: `npm run build`.
- Output directory: `dist`.
- Pages Functions enabled.
- Production aliases: `https://florial-bg.com` and `https://www.florial-bg.com`.

Latest Production deployment:
- Deployment ID: `4fb5bbd8-5fcc-4f53-9c16-4d7a8356689f`.
- URL: `https://4fb5bbd8.florial.pages.dev`.
- Source commit: `34a472b813119b72cc45d2009fbe3bd1ce617d4d`.
- All stages (queued, initialize, clone, build, deploy): **success**.

A browser-based functional smoke test was not part of this repository-readiness audit. Deployment success is not a claim that every route, locale, checkout, Manager action or live content page was visually accepted.

## 4. Branch and PR hygiene

- There are no open PRs.
- All future work must start from the current main SHA.
- Non-main refs are historical/auxiliary and intentionally remain in GitHub. Per owner decision, no per-branch comparison or deletion is required; ignore them in ordinary work.
- Production deploys only from main. Cloudflare Preview currently includes all branches, so a later push to an old branch may create a Preview deployment but cannot change Production.

## 5. Production configuration caveats — unchanged

- Owner confirmed on 2026-11-18 that legacy variable names `SUPABASE_*` / `VITE_SUPABASE_*` remaining in Cloudflare Pages Production/Preview are intentionally retained dormant reserves, unused by the active Florial project.
- Do not remove, change, read or re-audit these values solely because they exist. They are not an active integration. Revisit only under a separate owner-approved future Supabase activation decision.
- Preview is not a production-equivalent environment; it does not expose the same D1/server-side bindings. Do not use it for Manager/orders acceptance without a separately approved safe setup.

## 6. Remaining owner / engineering gates

1. Configure GitHub branch protection for main: require PR, both successful checks, up-to-date branch, block force-push/delete.
2. Optional: owner may configure GitHub branch protection for main; this is repository governance, not a prerequisite to treating main as authoritative.
3. Recheck live D1 migration ledger/schema before the next migration; resolve the historical 0014/table-count discrepancy.
4. Complete pending browser QA for refreshed category/articles and other items listed in [OPEN_QUESTIONS.md](../AI/OPEN_QUESTIONS.md).
5. Keep the irrigation engineer assistant paused after stage 7 until explicitly resumed.

## 7. Scope and non-changes

This audit and its documentation updates do not change application code, Sanity content/schema, D1 schema/data, Resend, Cloudflare settings/secrets, DNS or Production configuration. No production write or deployment was initiated by this audit; the deployment cited above was triggered automatically by the already-current main commit.
