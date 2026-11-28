# GitHub Actions CI consolidation — 2026-11-28

## Scope and baseline

This change reduces duplicate GitHub Actions runs and notification volume without suppressing failures or weakening the main validation suite.

- Working branch: `develop`
- Integration PR: #559 (Draft; not merged)
- Production branch: `main` — unchanged
- Baseline commit before CI changes: `9354efcc14f33a0c746324869cf109fa24e55fe8`

On the baseline PR commit, GitHub Actions created 12 workflow runs. One completed successfully and 11 failed. The main Blog and Studio validation run `46124032979` reported 610/617 passing tests (7 failures). The full SSR/SEO regression run `46124145409` failed because the blog-article raw HTTP check received the SPA shell instead of the expected server-rendered article marker. These are real validation failures and are not being hidden by this consolidation.

## Implemented workflow policy

### Automatic PR / Production validation

1. `blog-studio.yml` remains the comprehensive application validation: type-check, lint, all website tests, website build, migration syntax/dry-run and Sanity Studio type-check/build. Its PR trigger no longer runs for metadata-only `edited` events and now ignores Markdown-only changes (`**/*.md`) on PR and push. Any code/config/workflow change still triggers it; a mixed code + Markdown change still triggers it.
2. `ssr-seo-regression.yml` remains the single automatic raw-HTTP SSR/SEO suite. Its runner `scripts/smoke-ssr-regression.mjs` already covers homepage, services directory/details, blog index/articles, plant catalogue/products, equipment catalogue/products, contacts, header seed, About and SEO surface in BG/RU/EN.
3. Both main PR validation workflows use concurrency groups that cancel superseded runs for the same Pull Request. Push-to-main and manual runs are not cancelled by this policy.
4. `validate-d1-migration.yml` runs automatically only when `docs/migrations/**` or `tests/*migration*.test.py` changes, or when manually dispatched. The workflow YAML itself is deliberately excluded from the path list: GitHub evaluates PR path filters against the complete PR diff, so including the workflow file would rerun D1 validation on every subsequent PR synchronization until merge. Workflow-definition changes can be checked with manual `workflow_dispatch`. It runs the five SQLite migration regression scripts directly with Python; duplicate npm install, lint, website build and esbuild checks were removed because the main validation workflow already covers the application build and type checks.

### Manual focused diagnostics

The following focused workflows remain in the repository and retain `workflow_dispatch`, but no longer start automatically on every PR or main push:

- `sanity-studio.yml` (Studio validation; the comprehensive Blog and Studio workflow already builds Studio)
- `about-ssr-smoke.yml`
- `homepage-ssr-smoke.yml`
- `blog-index-ssr-smoke.yml`
- `blog-articles-ssr-smoke.yml`
- `service-detail-ssr-smoke.yml`
- `services-directory-ssr-smoke.yml`
- `plant-catalog-ssr-smoke.yml`
- `equipment-product-ssr-smoke.yml`
- `equipment-catalog-ssr-smoke.yml`
- `equipment-ssr-preview-smoke.yml`

Their checks are represented in the full SSR/SEO regression suite. Manual workflows remain available when an engineer needs an isolated diagnosis. The production Studio deployment workflow `deploy-sanity-studio.yml` is unchanged.

## Verification status

- Workflow source changes are committed on `develop` / Draft PR #559. A follow-up refinement at commit `0fa98715adb0beb9abe582c7da7a574337fc9b24` also makes the comprehensive app workflow skip Markdown-only changes, preventing documentation-only commits from generating another full validation email. Production branch `main` was not changed.
- Post-change exact commit: `900eab9fc38a199e00f764686bbdcc5905cd71b2`.
- Post-change automatic runs: 3 (down from 12 on baseline commit `9354efcc14f33a0c746324869cf109fa24e55fe8`):
  - Blog and Studio validation `46126385821` — **failure**.
  - Full SSR/SEO regression `46126385836` — **failure**.
  - D1 migration validation `46126385819` — **success**. This run was expected because the D1 workflow file itself changed in this commit; subsequent ordinary site-only changes should not match its migration path filter.
- The application validation log contains seven failing tests: three About SSR seed/middleware assertions, two content-route performance/product-CDN assertions, one product-detail cache assertion, and one Sanity client/tagging assertion. Several assertions expect old source fragments after refactors; each must be reconciled with the current implementation before changing either code or test expectations. No test was skipped or suppressed by the CI consolidation.
- The full SSR/SEO workflow resolved the exact successful Pages Preview deployment `https://ef0dd56a.florial.pages.dev` for commit `900eab9fc38a199e00f764686bbdcc5905cd71b2`. The deployment stages (queue, initialize, clone, build, deploy) all reported success. However, the homepage raw-HTTP smoke made 24 attempts and received HTTP 200 without `data-florial-ssr-homepage="v1"`; the suite stopped at homepage and did not reach services or blog checks.
- Therefore the earlier baseline blog-article SSR failure is **not yet revalidated** by this run. The new homepage SSR failure is a separate open issue.
- The baseline commit had 12 runs: 1 success and 11 failures. The post-consolidation commit had 3 runs: 1 success and 2 failures. This confirms fewer workflow runs, not a passing CI.
- No merge to `main`, Production deployment, Cloudflare settings/secrets change, Sanity write, D1 migration/data write, or DNS change was performed. The Preview deployment is a normal branch preview and is not Production.

## Follow-up actions

1. Reconcile the seven failing assertions against the current source and determine which tests are stale versus which implementation contracts are broken. Do not weaken or remove coverage merely to make CI green.
2. Investigate why the exact successful Preview deployment returned the homepage without its SSR marker; then rerun the full SSR/SEO suite and confirm the blog article route is reached.
3. Verify on a later ordinary site-only commit that D1 migration validation is skipped, and verify on a later migration-path commit that it runs.
4. Keep PR #559 Draft and do not merge or deploy Production without the owner's explicit release approval.

## Acceptance criteria

- A normal code PR runs one comprehensive application validation and, for SSR/content/runtime changes, one full SSR/SEO regression.
- A new commit on the same PR cancels its superseded in-progress PR validation runs.
- D1 migration tests run only for migration SQL/test changes or manual dispatch.
- Individual route smoke workflows remain manually runnable.
- Production push validation and Studio deployment remain protected and are not cancelled by PR concurrency.
