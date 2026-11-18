# Florial — repository and release readiness audit

Date: 2026-11-18  
Repository: `omaraandrey-dev/florial`  
Verified main HEAD: `34a472b813119b72cc45d2009fbe3bd1ce617d4d`

## Executive result

**The current main commit is green in GitHub Actions and successfully deployed to Cloudflare Pages Production.** There are no open PRs. The codebase is in a deployable state for this exact commit based on the recorded CI and Pages build/deploy evidence.

This does not mean every repository-governance and environment-cleanup item is complete. The main branch is not protected, 416 non-main branch refs remain, and legacy Supabase-named variables still exist in Cloudflare Pages. No Production settings were changed.

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
- The 416 non-main refs are historical and non-authoritative. They remain in GitHub for now; deleting them requires per-branch comparison and a GitHub action unavailable through the current connector.
- Production deploys only from main. Cloudflare Preview currently includes all branches, so a later push to an old branch may create a Preview deployment but cannot change Production.

## 5. Production configuration caveats — unchanged

- Cloudflare Pages Production and Preview still contain legacy variable names `SUPABASE_*` / `VITE_SUPABASE_*`. The current root `package.json` contains no Supabase SDK dependency. A complete current-main source/workflow/runtime reference audit is still required before declaring every variable unused.
- No variable names, values, secrets, bindings or settings were changed. Secret values are not included in this report.
- Do not remove these variables without a complete reference audit and separate explicit owner approval.
- Preview is not a production-equivalent environment; it does not expose the same D1/server-side bindings. Do not use it for Manager/orders acceptance without a separately approved safe setup.

## 6. Remaining owner / engineering gates

1. Configure GitHub branch protection for main: require PR, both successful checks, up-to-date branch, block force-push/delete.
2. Decide whether to perform a reviewed manual cleanup of old branches. Do not bulk-delete.
3. Complete the Supabase variable usage audit; then present a separate removal plan for owner approval.
4. Recheck live D1 migration ledger/schema before the next migration; resolve the historical 0014/table-count discrepancy.
5. Complete pending browser QA for refreshed category/articles and other items listed in [OPEN_QUESTIONS.md](../AI/OPEN_QUESTIONS.md).
6. Keep the irrigation engineer assistant paused after stage 7 until explicitly resumed.

## 7. Scope and non-changes

This audit and its documentation updates do not change application code, Sanity content/schema, D1 schema/data, Resend, Cloudflare settings/secrets, DNS or Production configuration. No production write or deployment was initiated by this audit; the deployment cited above was triggered automatically by the already-current main commit.
