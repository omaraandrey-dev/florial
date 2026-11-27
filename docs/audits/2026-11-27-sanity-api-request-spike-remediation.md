# Sanity API request spike — urgent remediation

**Date:** 2026-11-27  
**Repository:** `omaraandrey-dev/florial`  
**Development branch:** `develop`  
**Status:** code remediation prepared; CI, Preview and Production verification pending.

## Observed usage

Read-only Sanity project usage snapshot for `bxvcy0qs`, billing month through 2026-11-27:

- API Requests: **221,169**.
- API CDN Requests: **41,563**.
- API Requests daily history:
  - 2026-11-24: 3,074
  - 2026-11-25: 71,053
  - 2026-11-26: 82,243
  - 2026-11-27: 6,376 (incomplete day at the time of the snapshot).
- The 25–26 November increase is not mirrored by API CDN usage, which remained in the low thousands per day.

These figures establish a sharp increase in successful live API traffic. They do not by themselves identify the caller or prove that every request came from SSR.

## Code finding

In `functions/_middleware.ts`, the shared `querySanityData()` helper was constructing direct requests to:

`https://bxvcy0qs.api.sanity.io/v2024-01-01/data/query/{dataset}`

The helper is used by SSR routes for published content, including category trees/listings, plant and equipment product detail, blog index/article/related content and static page projections. The request explicitly uses `perspective=published`.

Sanity's current documentation recommends the API CDN for published frontend reads. Requests to `api.sanity.io` count against API Requests; requests to `apicdn.sanity.io` count against the separate API CDN quota. Sanity also documents that a server-side client with `useCdn: false` can issue a live API request on every page render.

References:
- https://www.sanity.io/docs/platform-management/diagnose-api-request-spikes
- https://www.sanity.io/docs/content-lake/api-cdn

## Implemented code change

On `develop`, the shared published SSR query endpoint was changed from the project's live API host to the API CDN host:

- Before: `bxvcy0qs.api.sanity.io`
- After: `bxvcy0qs.apicdn.sanity.io`

This is restricted to the middleware helper that queries published content. It does not change the separate live clients used for commercial product price/stock/search behavior, Studio, Manager, Sanity writes, schemas or datasets.

A regression test was added to assert that the middleware's published SSR query helper uses `apicdn.sanity.io`, retains `perspective=published`, and does not use `api.sanity.io`.

## Verification status and limitations

- Sanity usage snapshot/history: **read-only live service check passed**.
- GitHub source inspection: **confirmed** on current `main` and `develop`.
- Sanity Request Logs export: **not yet inspected**. The authenticated Sanity dashboard was not accessible through the available browser session; the Cloud Browser run could not start because its project had insufficient credits. Therefore caller IP, user agent, request tags and exact GROQ query attribution remain **unconfirmed**.
- Automated regression test, type-check, lint, build and exact-SHA CI: **pending**.
- Cloudflare Pages Preview and raw HTTP smoke: **pending**.
- Production deployment and post-release Sanity usage comparison: **not performed**.

## Safety boundaries

No Sanity documents, schemas, datasets, Cloudflare settings/secrets, D1 data/schema, orders, Resend configuration or Production settings were changed. The only application change is the published SSR query hostname on `develop`.

`CHANGELOG.md`, `docs/TECHNICAL_PASSPORT.md`, `docs/AI/CURRENT_STATE.md` and `docs/AI/OPEN_QUESTIONS.md` are not edited because their diffs are frozen by open PR #409. Reconcile this audit into those shared records after PR #409 is resolved, without overwriting its work.

## Next steps

1. Run regression tests, type-check, lint and website build on the exact development head.
2. Open/verify the normal `develop → main` release PR and Preview.
3. After explicit Production release approval, deploy and smoke-test BG/RU/EN routes.
4. Re-read Sanity usage history after the deployment and compare live API Requests with API CDN Requests.
5. Obtain Sanity Request Logs when dashboard access is available to identify any independent crawler/integration traffic and add request tags if needed.
