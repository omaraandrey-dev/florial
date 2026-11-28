# Cloudflare Pages Functions request-limit remediation — 2026-11-28

## Current status

**Implementation is on `develop`; Production is unchanged.** Draft PR #559 remains open and unmerged.

- Current `develop` HEAD: `83cb44d0a1fdaf250d5c1525a27b225bc03f0d04`.
- Current `main` / Production code SHA: `541223d7e8b01094223d53a140c139a99222952b`.
- Latest successful code-bearing Preview containing the route manifest: `a278c200-cfaf-4ef6-af0d-cb845de4c135`, URL https://a278c200.florial.pages.dev, source SHA `86ed15a105ab83ac4c0686661e6e23c18ea634c9`.
- Branch alias https://develop.florial.pages.dev points to that Preview.
- Blog and Studio validation run `46145932038` passed on exact `develop` HEAD, including type-check, lint, website tests, website build, built route-manifest validation, read-only migration dry-run, Studio type-check and Studio build.
- Full SSR/SEO run `46145932128` is waiting for an exact Preview check on the latest test/workflow-only commit. Cloudflare skipped those later commits with `skip_reason=path_config`; the code-bearing Preview is already deployed. Raw SSR verification remains pending because the account daily request limit was exceeded and both environments use `fail_open=true`.

## Cloudflare usage evidence

Read-only Cloudflare Analytics API data for Pages Functions:

| Date (UTC) | Preview requests | Production requests | Total |
|---|---:|---:|---:|
| 2026-11-25 | 90,628 | 12,571 | 103,199 |
| 2026-11-26 | 134,774 | 6,212 | 140,986 |
| 2026-11-27 | 80,636 | 11,564 | 92,200 |
| 2026-11-28* | 119,130 | 7,520 | 126,650 |

* 28 November was incomplete at query time; hourly data was available only through 07:00 UTC, so do not treat this as a final daily total. Analytics is delayed and does not yet measure the effect of the route-manifest deployment.

The Cloudflare warning states a 100,000 incoming Workers/Pages Functions request daily limit, resetting at 2026-11-29 00:00 UTC. The Preview worker accounted for approximately 94% of the available 28 November total.

Script names in the account analytics were:
- `pages-worker--21633031-preview`
- `pages-worker--21633031-production`

The Analytics aggregation available through the connected account exposes date, script and invocation status, but not request URL, path, user-agent or referrer. No usable historical Logs Explorer dataset or log destination was found. Exact external source attribution is therefore **not established**.

## Root cause identified in repository configuration

At the pre-fix `develop` code head:

1. `functions/_middleware.ts` is a root-level Pages middleware and runs before the request is handled.
2. The middleware eventually calls `context.next()` for static files, but that happens after the Function invocation has already occurred. Returning a static response does not avoid the invocation.
3. No project-owned `_routes.json` existed in the repository root, `public/` or `functions/`. With a root middleware and no explicit route exclusions, static asset requests were eligible to invoke Pages Functions.
4. The handler had special bypass branches for some individual paths, but those branches still ran inside the middleware and therefore did not save the invocation.
5. `public/_headers` already applies the same security headers to static assets, so static requests can bypass middleware without losing those headers.

This is the confirmed configuration/code-level cause of unnecessary Function invocations. The exact proportion of the 119,130 Preview requests attributable to static assets is not yet measured. External traffic to Preview URLs may also contribute.

## Changes applied

### Cloudflare Pages project settings — verified read-after-write

- Preview deployment setting changed to custom.
- Preview branch allowlist restricted to `develop`.
- Preview build path filters now include runtime/build inputs: `src/*`, `functions/*`, `public/*`, `index.html`, package manifests and Vite/PostCSS/Tailwind/TypeScript configuration.
- Production branch remains `main`; Production deployments remain enabled.
- No Production deployment, DNS, secrets, bindings or D1 settings were changed.

The filter behavior was verified in Cloudflare deployment records:
- Preview for code-bearing commit `86ed15a` deployed successfully.
- Later test-only, validator-script-only and workflow-only commits `7cceada`, `b716c71` and `83cb44d` were skipped with `skip_reason=path_config`.
- This confirms that non-runtime commits no longer create unnecessary Preview builds.

### Repository changes on develop

- `public/_routes.json`: includes application routes while excluding static bundles, scripts, stylesheets, images, fonts, documents, manifests and other static asset extensions.
- Dynamic HTML routes remain eligible for SSR.
- `/api/*`, `/sitemap.xml` and the services RSS XML route remain eligible for Pages Functions.
- HTML and XML are deliberately not globally excluded.
- `tests/pages-functions-routing.test.mjs`: protects the route-manifest rules and critical dynamic routes.
- `scripts/validate-pages-routes.mjs`: verifies that Vite copies the manifest unchanged into `dist/_routes.json`.
- `.github/workflows/blog-studio.yml`: runs the built-manifest validation after `npm run build`.

The manifest has been deployed to Preview and the CI build-copy validation passed.

## SSR and quota relationship

Cloudflare project configuration reports `fail_open=true` for both Preview and Production. When the daily Functions limit is exceeded, Cloudflare may bypass Function execution according to the configured failure mode. That is a strong explanation for the missing SSR marker observed in Preview while the limit was exhausted, but the exact request-level failure event has not been captured.

Do not change `fail_open` or upgrade the plan as a substitute for reducing unnecessary invocations.

## Next steps

1. After the 2026-11-29 00:00 UTC reset, run raw HTTP checks against the deployed Preview for BG/RU/EN: homepage, services, blog, category/product, Manager shell, API route behavior, sitemap and RSS.
2. Confirm that static assets are served successfully with the existing security headers and do not invoke Pages Functions.
3. Compare Cloudflare hourly/daily Preview and Production request counts after Analytics catches up. Record the measurement window and data lag; do not claim savings before the comparison.
4. Check that SSR markers return again once the quota resets. If not, continue middleware/route diagnosis separately.
5. If Preview traffic remains unusually high after static-asset bypass, investigate external requests to Preview aliases. Historical path/user-agent attribution is unavailable in the current account data; any persistent logging/Logpush setup requires a separate cost/retention review.
6. Keep PR #559 Draft and do not merge or deploy to Production without the owner's separate release approval.

## Safety record

No Sanity documents/schemas, D1 data/schema, Production deployment, DNS, secrets or bindings were changed. The Cloudflare project settings change was limited to Preview branch/build-path selection. No paid plan upgrade was performed.
