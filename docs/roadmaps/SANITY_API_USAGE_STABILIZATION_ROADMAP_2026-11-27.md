# Florial — Sanity API usage stabilization roadmap

**Created:** 2026-11-27  
**Priority:** P0 / urgent  
**Target execution window:** 2026-11-27 to 2026-11-29 (two working days; extend only if evidence or safe verification requires it)  
**Repository:** `omaraandrey-dev/florial`  
**Canonical branch for development:** `develop`  
**Production branch:** `main`  
**Sanity project:** `bxvcy0qs`  
**Status:** ACTIVE — repository inventory completed; safe cart metadata migration and expanded request tagging are on develop; commercial reads remain Live pending freshness decisions; exact-head CI and request-log validation are pending.

> This file is the portable handoff for this workstream. Any ChatGPT, Claude, Gemini, developer or future conversation must read this roadmap first, then follow `AI_INSTRUCTIONS.md`, `docs/AI/START_HERE.md` and `docs/AI/WORK_PROTOCOL.md`. Update this file at every completed phase. Do not rely on chat history as the source of task status.

## 1. Objective

Stop unnecessary consumption of Sanity monthly **API Requests** (direct Live API), eliminate avoidable public read traffic from the Live API, retain live reads only where data freshness is required for correctness/security, and add enough observability and regression protection to detect a recurrence before the monthly allowance is exhausted.

The task is not to maximize API CDN usage blindly. Every migration must preserve published-content semantics, language behavior, prices/stock correctness, order validation, Manager authorization and user-visible functionality.

## 2. Non-negotiable constraints

- Do **not** upgrade Sanity to Growth. Work within the existing plan and its limits.
- Do not write to Sanity documents, schemas or datasets.
- Do not change D1 schema/data, Production secrets, Cloudflare bindings/settings, DNS or other Production infrastructure without separate explicit approval.
- Do not perform Production release without explicit owner approval for the specific release.
- Keep server-side order price/stock validation on the Live API unless a separate correctness review proves an alternative safe.
- Keep authenticated Manager and Studio operations on the appropriate live/authenticated paths; do not treat them as public crawler traffic.
- Do not weaken published perspective, access controls, cache correctness, localization, SEO, or freshness guarantees silently.
- Never claim a fix is effective from a static daily/monthly usage counter alone.
- No destructive cleanup, no broad refactor and no unrelated UI/architecture changes.

## 3. Baseline and evidence

### 3.1 Usage snapshot (read-only, 2026-11-27)

Latest snapshot available to this workstream:
- API Requests: **253,866 / 250,000 (101.55%)** — allowance exceeded; Sanity reports further API/API-CDN/bandwidth usage blocked.
- API CDN Requests: **49,483 / 1,000,000 (~4.95%)**.
- Bandwidth: **22,483,973,605 bytes (~22.48 GB / 100 GB)**.
- Metric timestamp: `2026-11-27T00:00:00Z`; this is a daily-boundary snapshot, not an hourly meter.

Because the direct API allowance has been exhausted, the static counter does not prove that the application has stopped issuing requests. Calls may be blocked and therefore absent from billable usage. The next month's reset and/or request logs are needed to measure the post-remediation successful traffic rate.

### 3.2 Historical anomaly

The request-history audit recorded:
- 2026-11-20 to 2026-11-24 baseline: approximately **2,190 direct API requests/day**.
- 2026-11-25: **71,053**.
- 2026-11-26: **82,243**.
- Approximate anomaly rate: **35× baseline**.

The leading explanation is a public SSR rollout that caused repeated published-content reads through the direct Live API. This is a strong code/timeline correlation, not complete per-request attribution. Sanity Request Logs are needed to establish exact query, route, user-agent, IP and status distributions.

### 3.3 Already released SSR mitigations

PRs **#553, #554 and #555** have been merged to `main` and released. The latest known Production deployment after the documentation closeout:
- Deployment: `f5313cf6-83b7-4b47-b1d3-69cf68b2b74d`
- Commit: `2376ac61ffba6b5b179987aebe52afd5849f1156`
- Status: `success`
- Created: 2026-11-27 12:38:06 UTC
- Aliases include https://florial-bg.com.

The latest deployment is a documentation-only release after the #555 runtime mitigation. The #555 runtime change routes the remaining shared public SSR document lookup through the published API-CDN/cache helper. Earlier #553/#554 changes also moved published SSR, sitemap and services feed reads to the API CDN and added caching.

**Verification boundary:** deployment metadata is verified; a fresh independent raw HTTP Production smoke was not completed as part of the 2026-11-27 audit. Previous exact-SHA CI/Preview and smoke evidence is recorded in the associated audit and PRs.

### 3.4 Source paths still requiring review

Current source review on `develop` confirms:
- `src/lib/sanity.ts` defines both CDN clients (`sanityClient`, `publicPlantsClient`) and direct clients (`sanityLiveClient`, `plantsClient`, `useCdn: false`).
- `src/App.tsx` imports both direct clients and contains browser-side catalogue loading paths. The full equipment and plants catalogue query path is a priority candidate for migration after checking every dependent field and freshness requirement.
- `src/lib/routeData/search.ts` still imports direct clients for public product search.
- `src/lib/routeData/productDetails.ts` uses CDN for published slug-to-ID resolution, while full product details and some related-product reads remain live.
- Other candidate paths include support/delivery-zone reads, irrigation assistant product reads, cart weight lookups and any remaining direct reads in page modules.
- `functions/api/orders.ts` uses live reads for server-side order validation and is an intentional keep-live candidate.
- Manager/Studio and authenticated operational calls must be separated from public browser traffic.
- Sitemap and services feed code already targets API CDN and uses Cache API; verify actual cache behavior and error/fallback behavior rather than assuming every request is a hit.

This list is an initial inventory, not a declaration that all remaining direct calls are wasteful. Every callsite must be classified and counted.

## 4. Workstreams and execution roadmap

### Phase 0 — establish baseline and guardrails
**Status: PARTIALLY COMPLETE**

Tasks:
1. Preserve the usage snapshot, anomaly history, deployment IDs and known code paths in this roadmap.
2. Obtain the latest Sanity Request Logs export when the dashboard makes it available; group requests by time, domain, dataset, query identifier, tag, status, user-agent, referrer and remote IP.
3. Separate billable successful direct API requests from blocked requests and non-billable failures.
4. Record the exact deployed commit and current `develop` HEAD before code changes.

Acceptance:
- A reproducible baseline exists with explicit time range and source.
- SSR spike attribution is labelled as proven, probable or unknown; no unsupported crawler attribution.

### Phase 1 — exhaustive Live API inventory and classification
**Status: COMPLETE — repository-wide search and classification completed for explicit application-owned SDK clients, raw API endpoints, middleware, sitemap/feed, Manager, migration scripts and CI smoke scripts. Sanity Studio's built-in internal traffic remains observable through Request Logs rather than custom repository callsites.**

Tasks:
1. Search the entire repository for `useCdn: false`, `sanityLiveClient`, `plantsClient`, direct `api.sanity.io` URLs, `createClient` instances, and direct Sanity `fetch()` calls.
2. Include browser source, Pages Functions, Manager, Studio, CI scripts and operational utilities.
3. For each callsite record: file/function, runtime (public browser / public SSR / checkout / Manager / Studio / CI), dataset, query purpose, fields returned, freshness requirement, auth status, approximate invocation trigger and proposed disposition.
4. Classify each call:
   - **MOVE TO CDN:** public published content/identity/reference reads that tolerate API-CDN caching.
   - **KEEP LIVE:** server-side order price/stock validation or another documented correctness/security requirement.
   - **AUTHENTICATED OPERATION:** Manager/Studio reads and writes; assess separately, never expose as public.
   - **REMOVE/DISABLE:** only proven redundant requests with no behavior dependency; requires tests and review.
   - **NEEDS OWNER DECISION:** any path where cache freshness changes commercial or operational behavior.
5. Check whether each public route duplicates data already delivered in SSR HTML and whether client startup refetch is avoidable.

Acceptance:
- Inventory covers every matching callsite in the repository.
- Every direct Live API call has an explicit classification and owner decision where needed.
- No broad replacement of all Live clients with CDN clients.

### Phase 2 — remediate public published reads
**Status: IN PROGRESS — cart weight metadata moved to the published API CDN on develop; price/stock, delivery fees and BOM reads remain Live pending freshness decisions**

Priority order:
1. Browser catalogue loading in `src/App.tsx`: inspect all consumers of catalogue fields, cart behavior, price/stock updates and page navigation. Move only safe published catalogue projections to CDN; do not silently weaken price/stock freshness. If a smaller identity/content projection can be used, prefer it.
2. Public search in `src/lib/routeData/search.ts`: determine which fields are needed for search results and whether stale price/stock can be omitted or separately refreshed. Use CDN for content/identity fields; retain a narrowly scoped live read only if necessary.
3. Support/delivery-zone and other public informational reads: use CDN where published and non-sensitive.
4. Irrigation assistant: separate catalogue/reference information from any operation that requires current stock/price. Preserve the user's engineering workflow and output.
5. Cart weight/derived logistics lookups: classify whether data is static catalog metadata or operationally time-sensitive; move static published fields to CDN where safe.
6. Product detail full reads: current slug resolution is already on CDN; separately decide freshness for price/stock-bearing details. Keep live only where required and document why.
7. Re-check sitemap/RSS and all SSR routes for duplicate queries and cache effectiveness.

Implementation principles:
- Prefer existing configured clients; avoid creating new clients per call.
- Use explicit `perspective: 'published'` for public published content.
- Keep draft/private data and authenticated data out of public CDN paths.
- Do not alter query semantics or returned data shape without regression tests.
- Where price/stock freshness matters, consider a split projection: CDN for descriptive/catalogue fields and a small live request for only critical fields, but only if this reduces total request count and is tested.
- Avoid one direct request per product or per component; batch requests where semantics allow.
- Preserve cancellation, error handling, localization and loading states.

Acceptance:
- Public read-only content requests use API CDN by default.
- All remaining direct public Live API requests are individually justified and documented.
- Cart, product display, search, irrigation assistant and order flow regression tests pass.
- Server-side order validation remains live and authoritative.

### Phase 3 — request attribution and monitoring
**Status: IMPLEMENTED ON DEVELOP — requestTagPrefix and family tags cover browser, checkout, Manager, SSR middleware, sitemap/feed, CI smoke and admin migration scripts; exact-head CI and Request Logs validation pending**

Tasks:
1. Add Sanity request tags to application-owned requests, using stable names for request families, for example:
   - `florial.ssr.*`
   - `florial.browser.catalog`
   - `florial.browser.search`
   - `florial.browser.product`
   - `florial.checkout.validation`
   - `florial.manager.*`
2. Confirm tags are supported by the exact installed `@sanity/client` version and appear in Request Logs before relying on them.
3. Decide whether Cloudflare Workers Analytics Engine is necessary. First inspect existing Cloudflare bindings, plan availability and operational cost. Do not add a Production binding or change Cloudflare settings without owner approval.
4. Establish a low-risk first monitoring path: periodic Sanity Usage API snapshot + request-log export review, with recorded timestamps and alert thresholds.
5. If an automated monitor is later approved, alert on direct API daily run-rate and projected monthly usage, not only the current monthly total.

Provisional thresholds for the 250,000 monthly direct API allowance (must be reviewed against actual traffic):
- 125,000 (50%): warning and review trend.
- 175,000 (70%): urgent investigation.
- 212,500 (85%): critical; freeze nonessential direct reads and investigate immediately.
- Daily run-rate warning: sustained >5,000 direct API requests/day; critical: sustained >8,000/day. These are conservative operational guardrails, not Sanity platform limits.

Acceptance:
- Requests from each important application family can be attributed in Request Logs.
- Monitoring method, owner, cadence, thresholds and failure behavior are documented.
- No Production monitoring infrastructure is changed without approval.

### Phase 4 — regression protection and load verification
**Status: IN PROGRESS — direct Live API allowlist and CDN/request-tag regression tests added; exact-head CI is queued**

Tasks:
1. Add a repository test that detects public runtime modules importing or invoking direct Live clients outside an explicit allowlist.
2. Add tests that public SSR, sitemap and feeds use the API CDN and published perspective.
3. Add query-count or request-count tests for the high-risk catalogue/search/product paths where test architecture supports it.
4. Run full unit/regression suite, type-check, lint and website build; run Pages Functions and Studio checks as applicable.
5. Run Preview raw HTTP smoke in BG/RU/EN for homepage, category, product, plants, search, service/blog and sitemap/feed.
6. Perform browser functional checks for catalogue, product details, search, cart and irrigation assistant.
7. Verify no private/Manager routes or draft data are exposed through public cache.
8. Compare request volume under a controlled repeated-route test before/after. Record exact sample size, duration, request domains and caveats.

Acceptance:
- Automated tests fail if an unapproved public direct Live API call is reintroduced.
- Exact-SHA CI passes.
- Preview raw HTTP and browser functional checks pass.
- No regression in SEO, localization, price/stock correctness, checkout or Manager.
- The observed request profile shows public reads on API CDN; any remaining Live API usage is attributable.

### Phase 5 — release and post-release verification
**Status: BLOCKED pending owner release approval**

Tasks:
1. Review full diff, tests, security implications and exact commit.
2. Create one integration PR from `develop` to `main`, following Florial branch policy.
3. Obtain explicit owner approval before merge/Production release.
4. Verify Cloudflare Pages Production deployment is successful and built from the exact approved commit.
5. Run safe Production raw HTTP smoke only; do not create orders, send emails or write Sanity/D1 data.
6. Obtain the next available Sanity Request Logs export and compare before/after request family distribution.
7. Confirm usage counters after the next monthly reset and monitor run-rate for at least 24–48 hours.

Acceptance:
- Production deployment SHA exactly matches approved main commit.
- Raw HTTP checks pass for BG/RU/EN.
- Fresh Request Logs confirm the intended traffic shift and no new high-volume Live API caller.
- The first post-reset usage trend is consistent with the agreed monthly budget. Do not claim a full-month guarantee from a short sample.

## 5. Two-day schedule

### Day 1 — 27 November
- [x] Read current project instructions and work protocol.
- [x] Review the latest Sanity usage snapshot and the existing SSR spike audit.
- [x] Confirm latest Production deployment metadata and #553–#555 release history.
- [x] Confirm the remaining browser-side Live API risk in source.
- [x] Complete exhaustive repository-wide callsite inventory and classification.
- [ ] Review latest Sanity Request Logs export if owner supplies it / if export becomes available.
- [ ] Approve the exact remediation list internally; identify any owner decisions required.

### Day 2 — 28 November
- [x] Implement the highest-confidence safe metadata migration on `develop`; keep commercial reads Live until freshness is agreed.
- [x] Add targeted regression tests and direct-Live-client allowlist guard (exact-head CI pending).
- [x] Add request tags to SDK and raw API/CDN request families; CI and Request Logs confirmation pending.
- [ ] Run exact-head CI, build, Preview and browser/raw HTTP checks.
- [x] Review diff and prepare draft PR #557; do not merge to Production without explicit release approval.
- [ ] Record all results and remaining risks in this roadmap.

If Request Logs, a CI failure, or a correctness concern prevents safe completion in two days, prioritize correctness and leave the affected item explicitly open rather than forcing a risky release.

## 6. Current status board

| Work item | Status | Evidence / next action |
|---|---|---|
| SSR direct API spike remediation | RELEASED | PRs #553–#555; exact Production deployment recorded above |
| Sanity usage baseline | RECORDED | 253,866 / 250,000 API requests; daily-boundary snapshot |
| Exact attribution of Nov 25–27 requests | OPEN | Need fresh Request Logs export; blocked requests may not count |
| Full Live API callsite inventory | COMPLETE | Explicit application-owned clients/endpoints, middleware, sitemap/feed, Manager, scripts and CI smoke paths searched and classified; Studio built-in traffic requires Request Logs |
| Public catalogue migration | BLOCKED ON OWNER DECISION | Full projection includes price/stock; do not move until displayed freshness policy is agreed |
| Public search migration | BLOCKED ON OWNER DECISION | Search projections include price/stock; design a split or approve the CDN freshness window |
| Product detail full-read policy | PARTIAL / KEEP LIVE COMMERCIAL FIELDS | Slug resolution and related content use CDN; full detail with price/stock remains Live |
| Support / irrigation assistant / cart paths | PARTIAL | Cart weight fallback uses CDN; delivery fees and irrigation BOM price/stock reads remain Live |
| Order validation live path | KEEP LIVE | Re-reads current prices and checks plant variant `outOfStock`; current equipment query does not select/check `stockStatus` — confirm whether a separate stock-validation change is needed |
| Request tagging | IMPLEMENTED ON DEVELOP | SDK, raw SSR middleware, sitemap/feed, checkout, Manager, browser and admin scripts tagged; validate exact-head CI and fresh Request Logs |
| Automated monitoring | NOT STARTED | Start with usage/log review; AE requires separate approval |
| Regression guard | ADDED ON DEVELOP | `tests/sanity-live-api-tagging.test.mjs` and `tests/sanity-public-cdn-reads.test.mjs` added; exact-head CI queued |
| Production release of new browser changes | BLOCKED | Draft PR #557; requires exact-SHA Preview/CI verification and separate owner release approval |

## 7. Required status update format

Every continuation, including from a different AI tool, must update the status board and add a dated progress entry using this structure:

- **Date/time (UTC):**
- **Branch and exact HEAD SHA:**
- **Phase:**
- **Completed:**
- **Files changed:**
- **Tests/CI:** exact run IDs and result, or “not run”.
- **Preview/Production:** exact deployment IDs and commit SHA, or “not checked”.
- **Sanity usage/log evidence:** timestamp and measurement range.
- **Open blockers / owner decisions:**
- **Next action:**

Do not overwrite earlier progress entries. Append new dated entries below.

## 8. Progress log

### 2026-11-27 — roadmap initialization
- Read `AI_INSTRUCTIONS.md`, `docs/AI/START_HERE.md`, `docs/AI/WORK_PROTOCOL.md`, `docs/AI/MASTER_SPEC.md`, `docs/AI/OPEN_QUESTIONS.md`, the existing Sanity spike audit and current source files on `develop`.
- Confirmed latest known Production deployment metadata: `f5313cf6-83b7-4b47-b1d3-69cf68b2b74d`, commit `2376ac61ffba6b5b179987aebe52afd5849f1156`, success.
- Confirmed the usage snapshot and that the direct API allowance is exhausted.
- Confirmed the browser-side catalogue path in `src/App.tsx` and direct client imports in `src/lib/routeData/search.ts`; the full repository inventory is still pending.
- No application code, Sanity data/schema, D1 data/schema, Cloudflare settings/secrets or Production configuration changed in this initialization step.
- **Next:** finish exhaustive inventory, then implement only the safe, approved public-read migrations on `develop`.


## 9. Phase 1 — initial repository-wide inventory findings (2026-11-27)

A GitHub code search was performed for `sanityLiveClient`, `plantsClient`, `api.sanity.io`, and `createClient(`, followed by direct source reads for the principal runtime callsites. This is the initial classification; a final audit must still inspect all matching API route implementations and confirm imports/callers.

### Public browser reads — high priority

| File / path | Current behavior | Initial classification |
|---|---|---|
| `src/App.tsx` catalogue effect | Full equipment and plant catalogue queries use `sanityLiveClient` / `plantsClient`; projections include price, stock, weight, descriptions, images, categories and plant variants | **MOVE TO CDN candidate**, but price/stock freshness decision required. Server order validation is authoritative; displayed data may be stale for the CDN cache window |
| `src/lib/routeData/search.ts` | Two full product search queries (equipment + plants) use direct clients; results include descriptions, price and stock | **MOVE TO CDN candidate**, subject to the same display-freshness decision |
| `src/lib/routeData/productDetails.ts` | Slug resolution already uses CDN; full equipment/plant details still use direct clients and include price/stock and related product data | **SPLIT / NEEDS REVIEW**. Preserve fresh critical fields; investigate CDN for descriptive fields and narrow Live API projection for price/stock |
| `src/pages/IrrigationSupportPage.tsx` | Public delivery-zone configuration is read from direct Live API on page load; includes fee and localized display data | **CDN candidate**, but confirm whether fees must update immediately. This affects displayed delivery information, not the server's order validation |
| `src/pages/IrrigationAssistantPage.tsx` | User-triggered SKU lookup for BOM items and automation products; projection includes price, stock, VAT and weight | **SPLIT / NEEDS REVIEW**. It is interactive and used to build a commercial BOM; do not silently stale price/stock |
| `src/App.tsx` cart weight fallback | Reads only `_id, weightKg` for equipment items missing weight in an older persisted cart | **MOVE TO CDN** candidate; weight is published product metadata and does not determine authoritative order price |

### Server-side / operational reads

| File / path | Current behavior | Initial classification |
|---|---|---|
| `functions/api/orders.ts` | Direct API reads support server-side validation of submitted products/variants and commercial values | **KEEP LIVE**; authoritative order validation and tamper resistance |
| `functions/api/service-leads.ts` | Direct API lookup of service `leadForm` configuration when a customer submits an enquiry | **KEEP LIVE initially**; low-frequency operational configuration read; evaluate only if Request Logs show material volume |
| `src/manager/plantCategories.ts` | `plantsClient` reads plant categories for Manager | **AUTHENTICATED OPERATION**; confirm its callers remain behind Manager authorization; do not classify as public catalogue |
| `functions/api/manager/*` including plant direct library, product/category SEO, image library/upload and order product operations | Direct API reads and/or mutations for Manager operations | **AUTHENTICATED OPERATION**; keep separate from public browser remediation and preserve auth/no-store behavior |
| Studio and migration/import scripts | Authenticated writes or administrative tasks | **ADMINISTRATIVE**; not public visitor traffic |
| `scripts/smoke-*-ssr.mjs` | Direct API calls from CI smoke scripts | **CI / TEST**; quantify separately, not public runtime traffic |
| `functions/_middleware.ts` | Search found the Sanity API hostname in product-page resource hints; the public SSR query helper uses the API CDN/cache path after PR #555 | **NO remaining direct SSR query identified in this pass**; continue regression verification |

### Important implications

1. The browser catalogue path is a concrete remaining source of direct API requests. It fetches each catalogue type once when that catalogue is first needed in the SPA session, not on every React render; the exact invocation count still depends on route/session behavior.
2. Search uses two full direct queries per search-data load (equipment and plants). This is a strong candidate for API CDN because the query is published catalog data, but the displayed price/stock freshness contract must be explicitly tested.
3. The irrigation assistant lookup and full product detail queries carry commercial fields. They must not be blindly moved to CDN without a defined freshness policy.
4. Delivery-zone reads and cart weight fallback are narrower, lower-risk CDN candidates.
5. The November 25–26 70–82k/day anomaly remains most strongly associated with the SSR direct-read rollout, not proven to be caused by these browser callsites. The browser callsites are additional consumption risk and need Request Logs attribution.
6. No source code was modified during this inventory pass.

### Owner decision needed before migrating commercial projections

For public catalogue cards and search results, Sanity API CDN responses may be cached for a short window (the previous Florial read-only measurement observed a 60-second cache policy). The current `functions/api/orders.ts` code re-reads current product prices through the Live API and checks `stockStatus == outOfStock` for plant sale variants. **It does not select or validate the equipment product `stockStatus` field in its current equipment query.** Therefore do not assume checkout currently protects equipment stock freshness. Before moving catalogue/search projections to CDN, the owner must decide whether displayed prices and stock may lag by the CDN cache window, and whether equipment stock validation should be added as a separate approved correctness change. If not, split descriptive content from critical commercial fields and retain narrowly scoped Live reads.

Do not change catalogue/search query clients until this decision is explicitly settled or a design avoids stale displayed commercial values.

### Progress update — 2026-11-27, inventory pass

- **Branch:** `develop`; exact roadmap/document commit is recorded by GitHub.
- **Completed:** code search and source review for all matching principal public client paths; classified public, checkout, Manager, Studio and CI usage.
- **Files changed:** roadmap document only; no application source changed.
- **Tests/CI:** not run (read-only audit/documentation update).
- **Preview/Production:** no deployment made.
- **Sanity usage/log evidence:** latest available usage snapshot remains 253,866 / 250,000 direct API requests; Request Logs export still required for exact caller attribution.
- **Open owner decision:** accept up to the CDN cache window for displayed catalogue/search price and stock, with server-side order revalidation, or require split content/commercial reads.
- **Next action:** proceed with low-risk metadata/configuration CDN migrations and regression test design; resolve the catalogue/search freshness decision before changing those commercial projections.


### 2026-11-27 — first low-risk runtime remediation on develop

- **Code commit:** `ee2c309a19d1adc06d42cbf5523360bd4423ca7b`.
- **Test commit:** `d9ab31ff6e1d4221885c09d95f56a6e48168f27b`.
- **Changed:** `src/App.tsx` — legacy-cart fallback that reads only `_id, weightKg` now uses the existing published CDN client `sanityClient` instead of `sanityLiveClient`. This is static catalogue metadata and does not change price/stock validation.
- **Added:** `tests/sanity-public-cdn-reads.test.mjs` — guards this cart metadata path against regression to direct Live API.
- **Verification:** source and test file were read back from `develop`; GitHub combined commit status currently returns no status records. The test has **not yet been executed**; exact-head CI/local test result remains pending.
- **Production:** no merge or deployment. No Sanity writes, D1 changes, Cloudflare settings/secrets changes.
- **Next:** continue with high-volume catalogue and search decision; do not migrate commercial projections until the owner confirms the acceptable display freshness contract.


### 2026-11-27 — request attribution and regression guard implementation on develop

- **Branch:** `develop`; implementation head at this update: `b0696ae0eadaa20d04bd5f90226a6f48e249d10a` (subsequent commits may advance it).
- **Completed:** added `requestTagPrefix: 'florial'` to all four shared Sanity SDK clients; added per-family tags to public browser catalogue, search, product-detail, recommended irrigation, delivery-zone, irrigation-assistant and legacy-cart metadata queries; tagged Manager plant-category client reads.
- **Completed:** added explicit URL tags to direct Pages Function calls for checkout order validation, service-lead config, Manager plant read/write, order-product search, product/category SEO read/write, image-library read and image upload.
- **Added:** `tests/sanity-live-api-tagging.test.mjs` to enforce the known direct-client callsite allowlist, required request tags and shared client prefix.
- **Prior remediation retained:** `src/App.tsx` legacy cart weight metadata now uses the published CDN client; `tests/sanity-public-cdn-reads.test.mjs` guards it.
- **Source verification:** all modified source and test files were read back from `develop`; exact-head CI/test execution has not yet been confirmed.
- **Production:** no merge or deployment. No Sanity content/schema, D1 data/schema, Cloudflare settings/bindings/secrets or DNS changed.
- **Open decision:** the current code deliberately keeps catalogue/search/product commercial projections and delivery tariffs on Live API for freshness. Existing SSR already uses published API-CDN cache windows, but changing the SPA price/stock freshness contract still requires explicit owner confirmation.
- **Next:** validate the new tests through a draft `develop → main` PR/CI and Preview; complete repository-wide callsite sweep; then request the freshness decision before moving high-volume catalogue/search reads to CDN.


### 2026-11-28 — exhaustive inventory, request tagging expansion and CI Preview correction

- **Branch:** `develop`; exact HEAD at this update: `05858b7971dc3b0a1fededb2184e070c1729ee93`. Draft integration PR: [#557](https://github.com/omaraandrey-dev/florial/pull/557), still open and unmerged.
- **Phase 1 completed:** repository-wide GitHub code search and source review covered `sanityLiveClient`, `plantsClient`, `useCdn: false`, `createClient(`, direct `api.sanity.io` URLs, raw `data/query`, `data/mutate` and asset upload endpoints. Classified browser, checkout, Manager, middleware, sitemap/feed, CI and admin migration callers. Studio's own internal SDK traffic is not a custom application callsite and must be attributed from Sanity Request Logs.
- **Confirmed keep-Live paths:** `functions/api/orders.ts` authoritative order validation; catalogue/search/product detail projections carrying price/stock; delivery-zone fee data; irrigation assistant BOM SKU/price/stock reads; Manager authenticated reads/writes. Do not silently weaken freshness.
- **Service-lead validation decision:** `functions/api/service-leads.ts` remains on the Live API because it reads the currently published lead-form configuration to validate a submitted enquiry. A stale cached configuration could mismatch the form contract. The request remains tagged as `florial.service-leads.config`.
- **Safe migration retained:** `src/App.tsx` legacy-cart fallback reads only `_id, weightKg` via the existing published API-CDN client. This does not affect price/stock or order validation.
- **Request tagging expanded:** the shared SSR query helper now tags requests by route family and dataset; sitemap queries use `florial.ssr.sitemap.<dataset>`; the services RSS query uses `florial.ssr.services-feed`. Authenticated blog migration scripts now use dedicated SDK request-tag prefixes. Existing browser/checkout/Manager tags remain.
- **CI reliability:** the equipment-category and services-directory smoke workflows no longer use hardcoded historical Preview hostnames. They resolve the Cloudflare Pages Preview URL from the exact commit's successful `Cloudflare Pages` check. This corrects the earlier failures caused by stale Preview targets; the new workflow runs are pending.
- **Tests added/extended:** request-tag coverage now includes SSR middleware, sitemap, RSS and admin migration scripts, while explicitly asserting that service-lead validation stays Live.
- **Exact-head CI:** queued for `05858b7971dc3b0a1fededb2184e070c1729ee93`; current run IDs include `46093769490`, `46093769475`, `46093769476`, `46093769450`, `46093769492`, `46093769403`, `46093769363`, `46093769393`, `46093769351`, `46093769361`, `46093769359`, and `46093769401`. Do not claim these passed until completed.
- **Preview:** Cloudflare Pages Preview deployment `9036e852-9875-48fd-a938-e53361bcfc5c` was in progress at the time of this update. No Production deployment was requested or made.
- **Files changed in this continuation:** `.github/workflows/equipment-catalog-ssr-smoke.yml`, `.github/workflows/services-directory-ssr-smoke.yml`, `functions/_middleware.ts`, `functions/sitemap.xml.ts`, `functions/feeds/services-bg.xml.ts`, `functions/api/service-leads.ts`, `scripts/blog-migration/import-blog-posts.mjs`, `scripts/blog-migration/prepare-from-source.mjs`, `tests/sanity-live-api-tagging.test.mjs`.
- **Sanity usage/log evidence:** last verified snapshot remains 253,866 / 250,000 direct API requests from 2026-11-27. No fresh Request Logs export was available in this continuation; post-remediation request distribution is therefore not yet proven.
- **No changes:** no Sanity documents/schemas/datasets, D1 schema/data, Cloudflare Production settings/bindings/secrets, DNS, orders or Resend configuration were changed.
- **Open owner decision:** whether catalogue/search displayed prices and stock may lag by the API-CDN cache window (previous Florial observation: approximately 60 seconds), with server-side order revalidation remaining authoritative. Until decided, those commercial projections remain Live.
- **Next:** wait for exact-head CI/Preview; repair only demonstrated failures; then obtain fresh Sanity Request Logs and validate tags/traffic. Production merge/deployment remains blocked pending explicit owner approval.


### 2026-11-28 — fresh Sanity usage snapshot and Preview deployment result

- **Branch / HEAD:** `develop` at `9668e45c8ee0b7869f86c40489a42cffc1da2716`; PR #557 remains draft and unmerged.
- **Cloudflare Preview:** check completed successfully for this exact commit. Deployment ID: `c3831aa7-cbb9-4920-a957-29461f8a19af`; Preview URL: https://c3831aa7.florial.pages.dev. This is not a Production deployment.
- **Sanity live usage snapshot (2026-11-28, monthly period, lastRecorded 00:00 UTC):**
  - API Requests: `253,867` (above the 250,000 allowance).
  - API CDN Requests: `58,507` (5.85% of the 1,000,000 allowance).
  - Bandwidth: `22,781,299,192` bytes (~22.78 GB of 100 GB).
- **Sanity daily usage history (2026-11-27):** `39,074` API Requests and `17,246` API CDN Requests. The 2026-11-28 partial period at the snapshot boundary showed `0` API and `171` API CDN requests.
- **Metering caveat:** the daily history values do not reconcile with the change in monthly metered totals since the previous snapshot (API total changed only from 253,866 to 253,867; API CDN from 49,483 to 58,507). Treat the daily history as a separate activity series until request-log status codes clarify which attempts were successful, blocked (402), or otherwise non-billable. Do not claim that direct API traffic has stopped.
- **CI:** all exact-head GitHub Actions checks were still queued after the Preview deployment completed. Run IDs are listed in the previous progress entry; record final outcomes only after completion.
- **Next:** inspect exact-head CI results, then validate the new request tags against the next Sanity Request Logs export. The export is not currently available in this chat's attached/Library files.


### 2026-11-28 — checkout freshness verification

- Read `functions/api/orders.ts` directly on `develop` before defining the catalogue/search freshness contract.
- **Verified in code:** checkout fetches current product prices from the Live API and rejects a price mismatch; for plant variants it rejects `stockStatus == outOfStock`.
- **Important gap:** the equipment checkout query currently selects `_id, name, sku, priceEUR, imageUrl` and does not select or validate equipment `stockStatus`. Do not claim that checkout revalidates equipment stock until this is addressed in a separately approved correctness change.
- **Owner decision expanded:** decide whether catalogue/search displayed prices and stock may lag by the API-CDN cache window, and whether equipment stock validation should be added before moving equipment stock display to CDN.
