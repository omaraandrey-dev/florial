# Sanity API request spike — urgent remediation and attribution

**Date:** 2026-11-27  
**Repository:** `omaraandrey-dev/florial`  
**Project:** `bxvcy0qs`  
**Status:** published SSR API-CDN remediation deployed to Production; likely cause identified by code/timeline correlation; exact request attribution awaits Sanity Request Logs export.

## Executive finding

The strongest current explanation is that the expanded SSR rollout on 2026-11-25 caused a large increase in published-content reads through the uncached Sanity Live API. This is supported by:

1. A sharp step-change in API Requests beginning on 2026-11-25.
2. A sequence of SSR route deployments throughout 2026-11-25.
3. The shared middleware helper used by those routes was calling `api.sanity.io` with `perspective=published`.
4. API CDN request counts did not rise in parallel.

This is a strong code/timeline correlation and likely a major contributor, not yet a definitive attribution of every request. Sanity Request Logs are required to quantify the share and identify crawlers, user agents, IPs, datasets and individual GROQ queries.

## Live usage evidence

Read-only Sanity usage snapshot for November 2026, retrieved 2026-11-27 after the Production release:

- API Requests: **248,560 / 250,000** — **99.4%**, approximately **1,440 requests remaining**.
- API CDN Requests: **42,585 / 1,000,000** — approximately **4.3%**.
- Bandwidth: **22,311,152,176 bytes** (approximately 22.3 GB of the 100 GB monthly allowance).
- The usage API reports the current daily bucket timestamp as `2026-11-27T00:00:00Z`; it does not provide an hourly split in this response.

Daily request history:

| Date (UTC) | API Requests | API CDN Requests |
|---|---:|---:|
| 2026-11-20 | 1,698 | 1,827 |
| 2026-11-21 | 2,999 | 2,847 |
| 2026-11-22 | 1,423 | 1,891 |
| 2026-11-23 | 1,755 | 2,130 |
| 2026-11-24 | 3,074 | 4,483 |
| 2026-11-25 | 71,053 | 3,027 |
| 2026-11-26 | 82,243 | 2,366 |
| 2026-11-27 | 33,767 | 1,495 |

The 2026-11-20 to 2026-11-24 direct-API baseline averages approximately 2,190 requests/day. The 2026-11-25 and 2026-11-26 average is approximately 76,648/day, about 35 times higher. The 2026-11-27 daily bucket is 33,767 at the time of this read; it must not be interpreted as a full-day total or as post-release-only traffic.

At the current Free-plan cap, further successful requests to the direct API can be blocked once the counter reaches 250,000. The separate API CDN allowance remains much larger, but direct live reads still used by the application may be affected.

## Deployment timeline correlation

Cloudflare Pages Production deployment history confirms the SSR rollout sequence:

- 2026-11-24 19:07 UTC — equipment category SSR was deployed; API Requests for 2026-11-24 remained 3,074.
- 2026-11-25 04:18 UTC — homepage SSR deployed.
- 2026-11-25 05:10–06:50 UTC — homepage startup, services directory/detail and blog index/article SSR deployments.
- 2026-11-25 07:27–09:10 UTC — equipment category/product and plant product/catalogue SSR deployments.
- 2026-11-25 10:14–12:47 UTC — contacts, About and full SSR/SEO verification deployments.
- 2026-11-26 — SSR was already active across the expanded public route set; daily API Requests reached 82,243.

The timing aligns closely with the jump from 3,074 direct API requests on 2026-11-24 to 71,053 on 2026-11-25. This makes the SSR middleware path the leading hypothesis.

## Code findings on Production main

### 1. Shared SSR query helper — corrected and deployed

In `functions/_middleware.ts`, `querySanityData()` is the shared query helper for published SSR projections. It was constructing requests to:

`https://bxvcy0qs.api.sanity.io/v2024-01-01/data/query/{dataset}`

The helper is used across public SSR routes: homepage, service pages, blog, equipment/plant categories and products, contacts and About.

The helper has a Cloudflare Cache API lookup keyed by the query's `cachePath`, and writes a response with the caller-supplied TTL. Cloudflare Cache API entries are local to the data center rather than a globally shared/tiered cache. Consequently, requests arriving at different edge locations can each incur a cold miss. This is a plausible amplifier when crawlers visit many localized pages across multiple regions; it is not independently proven to explain the observed volume.

### 2. Other remaining direct-API candidates — not yet attributed

The current `main` still contains several intentional or separately implemented direct API paths:

- `src/lib/sanity.ts`: `sanityLiveClient` and `plantsClient` use `useCdn: false`. They serve fresh product/plant detail, price/stock and search-related reads; some are user-facing.
- `functions/sitemap.xml.ts`: every uncached invocation executes six parallel direct API queries across the `production` and `plants` datasets. It returns `s-maxage=300`, but the function itself does not use `caches.default`; actual edge caching must be verified rather than assumed.
- `functions/feeds/services-bg.xml.ts`: each invocation performs a direct API query for published services. It also sets `s-maxage` without an explicit Cache API lookup/write.
- `functions/api/orders.ts`: direct reads are part of server-side order validation and should remain live unless a separate correctness review approves otherwise.
- Manager reads/writes, service lead lookups and asset operations also use the direct API, but their traffic share is unknown.
- Some CI smoke scripts make a small number of direct API inventory queries; they are another measurable but unquantified source.

These are candidates for the remaining direct API consumption, not confirmed causes of the November 25–27 spike.

## Implemented remediation

The shared published SSR query endpoint was changed:

- Before: `bxvcy0qs.api.sanity.io`
- After: `bxvcy0qs.apicdn.sanity.io`

The change preserves `perspective=published`, query text, parameters, cache keys, TTLs and route behavior. It does not change commercial live clients, order validation, Manager, schemas or datasets.

A regression test in `tests/content-route-performance.test.mjs` asserts the API CDN hostname and published perspective.

### Release and verification

- PR [#553](https://github.com/omaraandrey-dev/florial/pull/553) merged into `main`.
- Merge commit: `5b48e7eca72340b4040a24f0dcd7a3d738d2dad0`.
- Cloudflare Pages Production deployment: `abdaa1d6-99e9-4b27-bfa5-e3819deadf36`.
- Deployment status: **success**, from the exact merge commit; production aliases include `https://florial-bg.com` and `https://www.florial-bg.com`.
- Exact PR head `51c2865646eea76a416299880335eb4fd88ef960`: **14/14 GitHub checks passed**; Preview and full BG/RU/EN raw first-response SSR/SEO regression passed.
- A live public fetch of the Production homepage and a plant product page returned the expected server-rendered content.
- `develop` was fast-forward synchronized to the merge commit; GitHub compare reports `main` and `develop` identical at `5b48e7eca72340b4040a24f0dcd7a3d738d2dad0`.

### Measurement boundary

The current Sanity daily history has no hourly breakdown. The 2026-11-27 bucket cannot separate requests made before the 06:57 UTC Production deployment from requests made after it. The snapshot therefore confirms the quota is nearly exhausted but does **not** yet demonstrate the remediation's post-release effect.

## Request Logs — exact attribution still required

The authenticated dashboard was not accessed during this run, so no Request Logs export has been analyzed yet. Sanity's current documentation states that ad hoc Request Logs downloads are available on every plan:

- Sanity Manage → project `bxvcy0qs` → **Usage → Request logs**.
- The export covers up to the last 7 days through the day before download, is capped at 1 GB, and can be requested once every 24 hours.
- The downloaded file is compressed NDJSON (`.ndjson.gz`).

Useful fields include timestamp, request domain (`api`, `apicdn`, `cdn`), dataset, endpoint, GROQ query identifier, tags, user agent, remote IP, referrer, status and response size.

Once the export is available, group billable successful requests by:
1. date/hour and API domain;
2. dataset and endpoint;
3. GROQ query identifier and request tag;
4. user agent, remote IP and referrer;
5. status code.

This will distinguish SSR, sitemap/feed, browser clients, CI, bots and unrelated integrations. The export can be attached to the task for analysis; do not share API tokens or other secrets.

Documentation:
- https://www.sanity.io/docs/platform-management/diagnose-api-request-spikes
- https://www.sanity.io/docs/platform-management/request-logs
- https://www.sanity.io/docs/platform-management/reference-request-log-data
- https://www.sanity.io/docs/platform-management/reference-api-request-tags
- https://developers.cloudflare.com/workers/reference/how-the-cache-works/
- https://developers.cloudflare.com/workers/runtime-apis/cache/

## Recommended next actions

1. Obtain and analyze the Sanity Request Logs export before assigning exact percentages to SSR, crawlers or other callers.
2. Re-read Sanity usage history after the next metric update and compare direct API versus API CDN traffic after the 06:57 UTC release.
3. Review moving the published sitemap and services feed reads to the API CDN and adding explicit edge caching; these are published-content reads and do not need order-time freshness.
4. Separately assess whether public product/plant detail reads can tolerate the API CDN's short cache window. Keep server-side order price/stock validation on the live API.
5. Add request tags to application-owned requests where supported, so future usage attribution is straightforward.

## Safety boundaries

No Sanity documents, schemas, datasets, Cloudflare settings/secrets, D1 data/schema, orders or Resend configuration were changed. The only runtime change in PR #553 is the published SSR query hostname. Production code deployment was performed from the approved merge commit.

The shared `CHANGELOG.md`, `docs/TECHNICAL_PASSPORT.md`, `docs/AI/CURRENT_STATE.md` and `docs/AI/OPEN_QUESTIONS.md` remain untouched because their diffs are frozen by open PR #409. Reconcile this audit into those shared records after PR #409 is resolved, without overwriting its work.
