# Florial — Sanity API usage stabilization roadmap

**Created:** 2026-11-27  
**Priority:** P0 / urgent  
**Target execution window:** 2026-11-27 to 2026-11-29 (two working days; extend only if evidence or safe verification requires it)  
**Repository:** `omaraandrey-dev/florial`  
**Canonical branch for development:** `develop`  
**Production branch:** `main`  
**Sanity project:** `bxvcy0qs`  
**Status:** ACTIVE — baseline SSR mitigation released; complete public Live API inventory and browser-side remediation remain open.

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
**Status: IN PROGRESS**

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
**Status: NOT STARTED**

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
**Status: NOT STARTED**

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
**Status: NOT STARTED**

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
- [ ] Complete exhaustive repository-wide callsite inventory and classification.
- [ ] Review latest Sanity Request Logs export if owner supplies it / if export becomes available.
- [ ] Approve the exact remediation list internally; identify any owner decisions required.

### Day 2 — 28 November
- [ ] Implement the highest-confidence public catalogue/search/informational-read migrations on `develop`.
- [ ] Add targeted regression tests and direct-Live-client allowlist guard.
- [ ] Add request tags where the installed client supports them and tests confirm behavior.
- [ ] Run exact-head CI, build, Preview and browser/raw HTTP checks.
- [ ] Review diff and prepare integration PR; do not merge to Production without explicit release approval.
- [ ] Record all results and remaining risks in this roadmap.

If Request Logs, a CI failure, or a correctness concern prevents safe completion in two days, prioritize correctness and leave the affected item explicitly open rather than forcing a risky release.

## 6. Current status board

| Work item | Status | Evidence / next action |
|---|---|---|
| SSR direct API spike remediation | RELEASED | PRs #553–#555; exact Production deployment recorded above |
| Sanity usage baseline | RECORDED | 253,866 / 250,000 API requests; daily-boundary snapshot |
| Exact attribution of Nov 25–27 requests | OPEN | Need fresh Request Logs export; blocked requests may not count |
| Full Live API callsite inventory | IN PROGRESS | Initial source review confirms App catalogue and search paths |
| Public catalogue migration | OPEN | Inspect data freshness and all consumers before change |
| Public search migration | OPEN | Split descriptive fields from price/stock if needed |
| Product detail full-read policy | PARTIAL | Slug resolution CDN; full detail still live |
| Support / irrigation assistant / cart paths | OPEN | Classify individually |
| Order validation live path | KEEP LIVE | Required for authoritative server-side price/stock validation |
| Request tagging | NOT STARTED | Validate installed client API and Request Logs output |
| Automated monitoring | NOT STARTED | Start with usage/log review; AE requires separate approval |
| Regression guard | NOT STARTED | Add public Live API allowlist test |
| Production release of new browser changes | NOT STARTED | Requires Preview verification and explicit approval |

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
