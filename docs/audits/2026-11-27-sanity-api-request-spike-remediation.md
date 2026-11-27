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


## Additional browser-side product request path confirmed in source

A focused read of `src/lib/routeData/productDetails.ts` found another important live-API path:

- `fetchProductDetailsBySlug()` resolves a product slug by running **two parallel direct API reads on every invocation**: one against the `production` dataset via `sanityLiveClient`, and one against the `plants` dataset via `plantsClient`.
- After identifying the matching dataset and document ID, `fetchProductDetails()` performs a further direct API read for the full product/plant details.
- Plant details can additionally issue a live lookup for the recommended irrigation product.

This means a JavaScript-enabled product-page visit can cause at least three direct API requests after the server-rendered first response, even though the initial HTML already contains the product details. The first two slug-to-dataset lookups return only identity/type fields and do not need current price/stock; they are strong candidates to move to the API CDN. The full detail read includes price/stock and requires a separate freshness decision. This code path is confirmed; its share of the November spike is not known without Request Logs.

A future targeted optimization should first move only the two published slug-resolution reads to the API CDN, preserving the live detail read and server-side order validation. Any broader CDN use for price/stock-bearing details requires an explicit decision about accepting the CDN cache window.


## Follow-up implementation on develop — product slug reads, sitemap and RSS

**Status:** implementation committed to `develop`; exact-head CI and Preview verification passed; Production release is pending owner approval.

### Product detail browser path

- `src/lib/routeData/productDetails.ts`: the equipment slug-to-ID lookup now uses `sanityClient` and the plants slug-to-ID lookup uses `publicPlantsClient`. Both clients are configured with `useCdn: true` and published perspective in `src/lib/sanity.ts`.
- These two lookup projections contain only `_id` and product type; they do not contain price or stock fields.
- The subsequent full detail reads remain on `sanityLiveClient` / `plantsClient`. Recommended irrigation product lookup remains live. Server-side order validation remains live.
- Regression coverage in `tests/content-route-performance.test.mjs` asserts the CDN slug-resolution clients and preserves the full-detail live client path.

### Published sitemap and services RSS

- `functions/sitemap.xml.ts`: six published sitemap projections now target `apicdn.sanity.io` and explicitly set `perspective=published`. The generated XML is cached through `caches.default` using the request URL as key. Existing five-minute shared-cache policy and stale-while-revalidate window are retained.
- `functions/feeds/services-bg.xml.ts`: published services feed query now targets `apicdn.sanity.io` with explicit published perspective and uses the same request-keyed Cache API pattern. Existing five-minute shared-cache policy is retained.
- Cache API failures are treated as optimization failures only; the functions continue to generate and return the XML response. Error responses remain `no-store`.
- New source regression tests: `tests/sanity-public-endpoint-caching.test.mjs`.

### Remaining intentional live API paths identified by source review

- Full product/plant detail and recommended-product reads: current price/stock data; keep live until a separate freshness policy is approved and tested.
- `functions/api/orders.ts`: server-side price/stock/order validation; keep live.
- `functions/api/service-leads.ts`: service lead-form configuration is checked when a customer submits a form; current live read is retained for correctness.
- `functions/api/manager/image-library.ts`: authenticated Manager asset-library reads use a bearer token and no-store; not a public crawler path.
- Studio, Manager writes and other authenticated/operational requests remain outside this public-content CDN change.

### Verification boundary

The latest read-only Sanity usage snapshot (after PR #553 Production deployment and before PR #554 Production release) reports 249,206 API Requests and 44,491 API CDN Requests for November through 2026-11-27. The first post-release snapshot recorded 248,560 API Requests and 42,585 API CDN Requests; the current totals are therefore +646 Live API Requests and +1,906 API CDN Requests. The daily 2026-11-27 bucket rose from 33,767 to 34,413 API Requests (+646) and from 1,495 to 3,401 API CDN Requests (+1,906). The first read was captured around 07:01 UTC after the 06:57 Production deployment; the current read was around 11:04 UTC. This is approximately 160 additional Live API Requests/hour over that interval, compared with the 25–26 November average of about 76,648/day (about 3,194/hour), roughly a 20-fold lower rate. This is a useful directional signal, not a controlled experiment: the earlier daily totals include the pre-release spike and aggregate usage cannot attribute individual requests. The direction is consistent with traffic shifting from Live API to API CDN after PR #553, but aggregate counters do not identify callers or prove causation. Sanity Request Logs have not been exported; exact IP/user-agent/query attribution remains open.

No Sanity documents, schemas, datasets, Cloudflare settings/secrets, D1 data/schema, orders or Resend configuration were changed by this follow-up. Production release has not been performed for these follow-up commits.


## Additional direct-read inventory from the current source tree

The following browser-side Live API reads were reviewed and are not included in the public published-content migration above:

- `src/lib/routeData/search.ts`: the search-results route loads two full product search projections (equipment and plants) through the Live API whenever `activeSearchQuery` changes. The projections include price and stock and are filtered locally after loading. This is a potential repeated-read path if many distinct search URLs/terms are requested; its actual share is unknown without Request Logs. Do not move it to CDN or add a stale cache without an explicit price/stock freshness decision. A future safe optimization candidate is bounded in-memory reuse of the same search index across consecutive search terms, with an owner-approved freshness window.
- `src/pages/IrrigationSupportPage.tsx`: one live read of delivery-zone fees when the delivery/support page mounts. Kept live because it displays commercial delivery tariffs; expected to be route-visit scoped, not a crawler-wide catalogue query.
- `src/pages/IrrigationAssistantPage.tsx`: Live API product/price reads are part of the user-driven irrigation-kit workflow; retain current freshness.
- `src/App.tsx`: legacy cart items missing `weightKg` trigger a Live API lookup only while the cart is open. The effect is tied to cart state; it is a narrow compatibility path, not a public SSR projection.
- `src/manager/plantCategories.ts` and `functions/api/manager/*`: Manager operations remain authenticated operational reads/writes and are not migrated to public CDN.

This inventory distinguishes intentional freshness-sensitive reads from published SEO/content projections. It does not quantify request volume; only Request Logs can establish that attribution.


## Exact-head verification — 2026-11-27

- PR: #554, head commit `031bee7a5d519c0fc985f1c4f6baa6b80230e987`, base `main` at `5b48e7eca72340b4040a24f0dcd7a3d738d2dad0`.
- Blog and Studio validation run `45986888035`: TypeScript application/Pages Functions, lint, website utilities/tests, website build, migration syntax and read-only dry-run, Studio typecheck and Studio build all passed. Test runner summary: **584 passed, 0 failed**.
- Equipment product SSR validation/raw HTTP smoke run `45986888033`: success.
- Services directory SSR smoke run `45986888034`: success.
- Service detail SSR smoke run `45986887977`: success.
- Blog index SSR smoke run `45986887950`: success.
- Blog article SSR smoke run `45986887972`: success.
- D1 migration validation run `45986887973`: success; no migration was applied.
- Cloudflare Pages Preview deployment `6855c92d-013a-4ce9-8517-160c7869b7bf` for exact head `031bee7a5d519c0fc985f1c4f6baa6b80230e987`: build and deploy succeeded; URL `https://6855c92d.florial.pages.dev`.
- Read-only HTTP checks against that Preview returned HTTP 200 for `/sitemap.xml` (application/xml), `/feeds/services-bg.xml` (application/rss+xml), and both equipment and plant product pages in BG/RU/EN (six localized product responses). All six product responses contained a main page body, `index, follow` robots metadata and product structured-data markers.
- Repeated direct HTTP requests to sitemap and RSS both returned `cf-cache-status: HIT`, `Age: 91`, and the existing `s-maxage=300, stale-while-revalidate=600` policy. This confirms the new edge-cache path is active on Preview.
- Product pages returned the expected `s-maxage=60, stale-while-revalidate=120` response policy; Cloudflare did not expose `cf-cache-status` for these HTML responses in this check, so HTML edge HIT is not claimed.

Production remains on the already verified PR #553 deployment. PR #554 is not merged; no Production deployment was initiated.
