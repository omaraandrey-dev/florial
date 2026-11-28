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

1. `blog-studio.yml` remains the comprehensive application validation: type-check, lint, all website tests, website build, migration syntax/dry-run and Sanity Studio type-check/build. Its PR trigger no longer runs for metadata-only `edited` events.
2. `ssr-seo-regression.yml` remains the single automatic raw-HTTP SSR/SEO suite. Its runner `scripts/smoke-ssr-regression.mjs` already covers homepage, services directory/details, blog index/articles, plant catalogue/products, equipment catalogue/products, contacts, header seed, About and SEO surface in BG/RU/EN.
3. Both main PR validation workflows use concurrency groups that cancel superseded runs for the same Pull Request. Push-to-main and manual runs are not cancelled by this policy.
4. `validate-d1-migration.yml` now runs only when `docs/migrations/**`, `tests/*migration*.test.py` or that workflow file changes (or when manually dispatched). It runs the five SQLite migration regression scripts directly with Python; duplicate npm install, lint, website build and esbuild checks were removed because the main validation workflow already covers the application build and type checks.

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

- Workflow source changes are committed on `develop` and therefore update the existing Draft PR #559.
- Exact post-change GitHub Actions results are pending; do not claim CI passed until runs for the new head complete.
- The seven baseline test failures and the blog article SSR raw-response failure remain separate functional issues to investigate and fix. The CI changes only reduce duplicate execution; they do not change application code or test expectations.
- No merge to `main`, Production deployment, Cloudflare settings/secrets change, Sanity write, D1 migration/data write, or DNS change was performed.

## Acceptance criteria

- A normal code PR runs one comprehensive application validation and, for SSR/content/runtime changes, one full SSR/SEO regression.
- A new commit on the same PR cancels its superseded in-progress PR validation runs.
- D1 migration tests run only for migration SQL/test changes or manual dispatch.
- Individual route smoke workflows remain manually runnable.
- Production push validation and Studio deployment remain protected and are not cancelled by PR concurrency.
