# Florial — Sanity API usage stabilization roadmap

**Created:** 2026-11-27  
**Priority:** P0 / urgent  
**Target execution window:** 2026-11-27 to 2026-11-29 (two working days; extend only if evidence or safe verification requires it)  
**Repository:** `omaraandrey-dev/florial`  
**Canonical branch for development:** `develop`  
**Production branch:** `main`  
**Sanity project:** `bxvcy0qs`  
**Status:** PR #558 is merged into `main` and `develop`; public product/plant catalogue, search, product detail and irrigation-assistant reads use published API CDN. Phase 6 service SSR seed reuse is implemented on `develop` and verified by exact-head CI + Preview raw HTTP smoke through Draft PR #559. Blog SSR payload handoff remains in place and is regression-tested. **Pending:** owner approval to merge/release PR #559 and fresh Sanity Request Logs after the December 1 usage reset. No Production release of Phase 6 is claimed.

> This file is the portable handoff for this workstream. Any ChatGPT, Claude, Gemini, developer or future conversation must read this roadmap first, then follow `AI_INSTRUCTIONS.md`, `docs/AI/START_HERE.md` and `docs/AI/WORK_PROTOCOL.md`. Update this file at every completed phase. Do not rely on chat history as the source of task status.

## 1. Objective

Stop unnecessary consumption of Sanity monthly **API Requests** (direct Live API), eliminate avoidable public read traffic from the Live API, retain live reads only where data freshness is required for correctness/security, and add enough observability and regression protection to detect a recurrence before the monthly allowance is exhausted.

The task is not to maximize API CDN usage blindly. Every migration must preserve published-content semantics, language behavior, displayed prices/status, the explicitly approved order rules, Manager authorization and user-visible functionality.

## 2. Non-negotiable constraints

- Do **not** upgrade Sanity to Growth. Work within the existing plan and its limits.
- Do not write to Sanity documents, schemas or datasets.
- Do not change D1 schema/data, Production secrets, Cloudflare bindings/settings, DNS or other Production infrastructure without separate explicit approval.
- Do not perform Production release without explicit owner approval for the specific release.
- Keep server-side submitted-price validation on the direct Live API. Plant `outOfStock` validation remains as implemented. Irrigation equipment is sold to order: do not validate or block equipment orders using `stockStatus` or `stockQuantity`; no quantitative warehouse accounting is performed for irrigation equipment at this stage.
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
2. Review the existing Request Logs archive (completed in the previous session); obtain a fresh post-remediation export when available and group requests by time, domain, dataset, query identifier, tag, status, user-agent, referrer and remote IP.
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
**Status: IMPLEMENTED ON DEVELOP — public product/plant prices and stock display moved to the published API CDN; cart weight metadata also uses CDN; delivery-zone tariffs remain Live; checkout submitted-price validation remains Live; equipment orders intentionally have no stock/quantity validation. Exact-head CI/Preview/raw-HTTP checks passed; fresh Request Logs validation remains pending.**

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

### Owner freshness and equipment sales policy decisions — 2026-11-28

The owner approved moving displayed product prices and stock status for both irrigation equipment and plants to the published Sanity API CDN. The accepted display freshness window is approximately 60 seconds, based on the previously observed Sanity CDN cache policy (60 seconds with stale-while-revalidate behavior); this is an observed cache policy, not a hard real-time SLA.

Implemented on `develop`:
- `src/App.tsx`: equipment and plant catalogue queries use `sanityClient` / `publicPlantsClient` (published CDN).
- `src/lib/routeData/search.ts`: equipment and plant search projections, including displayed prices and stock, use published CDN clients.
- `src/lib/routeData/productDetails.ts`: full equipment/plant product details and recommended irrigation product reads use published CDN clients; slug resolution was already on CDN.
- `src/pages/IrrigationAssistantPage.tsx`: public irrigation-kit product/price/stock reads use the published CDN.
- `tests/content-route-performance.test.mjs` and `tests/irrigation-assistant-cart.test.mjs`: updated to assert CDN routing.
- `src/lib/sanity.ts`: clarified the remaining direct-Live client boundary.

Safety boundary:
- `functions/api/orders.ts` remains on direct Live API for current submitted prices; plant variant `outOfStock` is checked there. Equipment stock/quantity is intentionally not checked at checkout under the owner-confirmed made-to-order policy.
- **Owner-confirmed business rule (2026-11-28):** all irrigation equipment is currently sold to order. Customers may place orders without equipment stock being held in or checked against a warehouse quantity. There is no quantitative warehouse accounting for irrigation equipment at this stage. Do not add checkout rejection or availability gating based on equipment `stockStatus` or `stockQuantity`. The absence of equipment stock validation is intentional, not an open correctness gap. A future informational status such as “available to order” / “in stock” may be shown without quantitative stock enforcement, subject to a separate owner decision.
- Delivery-zone tariff read in `src/pages/IrrigationSupportPage.tsx` remains Live; Manager plant-category operations remain Live/authenticated.
- No Sanity writes, schema changes, D1 changes, Cloudflare settings/secrets changes or Production deployment are part of this migration.
- CDN freshness must be measured after the monthly reset; the API CDN may serve cached published values and the approximately 60-second window is not a guarantee of exact refresh timing.

Code head at time of the CDN migration: `9472f55b264de4477576d738c941ba92a8af9004`. The complete PR head `412da0af82d2a45a1b7c6774027d489fa6f2bba1` passed Blog/Studio validation, full SSR/SEO regression, equipment product SSR/raw-HTTP smoke and D1 migration validation. Cloudflare Pages Preview succeeded at `https://11b3c25b.florial.pages.dev`. Browser-interaction QA was not performed because Browser Use credits were unavailable; no browser-rendered functional result is claimed. Fresh Sanity Request Logs validation remains pending until the December 1 usage reset.

### Phase 3 — request attribution and monitoring
**Status: IMPLEMENTED ON DEVELOP — requestTagPrefix and family tags cover browser, checkout, Manager, SSR middleware, sitemap/feed, CI smoke and admin migration scripts; exact-head CI passed; fresh Request Logs confirmation remains pending**

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
**Status: IN PROGRESS — direct Live API allowlist and CDN/request-tag regression tests added; exact-head CI, Preview and raw SSR/SEO smoke passed; browser functional and controlled request-volume checks remain open**

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
- [x] Review the existing Sanity Request Logs archive (20–27 Nov export; last record 26 Nov 23:57 UTC); obtain a fresh export after remediation for tag validation.
- [ ] Approve the exact remediation list internally; identify any owner decisions required.

### Day 2 — 28 November
- [x] Implement the highest-confidence safe metadata migration on `develop`; keep commercial reads Live until freshness is agreed.
- [x] Add targeted regression tests and direct-Live-client allowlist guard (exact-head CI pending).
- [x] Add request tags to SDK and raw API/CDN request families; CI and Request Logs confirmation pending.
- [x] Run exact-head CI, website/Studio build, Preview and raw HTTP checks.
- [ ] Complete interactive browser checks for catalogue, product detail, search, cart and irrigation assistant.
- [x] Review diff and prepare draft PR #557; do not merge to Production without explicit release approval.
- [x] Record exact-head CI/Preview results and remaining risks in this roadmap.

If Request Logs, a CI failure, or a correctness concern prevents safe completion in two days, prioritize correctness and leave the affected item explicitly open rather than forcing a risky release.

## 6. Current status board

| Work item | Status | Evidence / next action |
|---|---|---|
| SSR direct API spike remediation | RELEASED | PRs #553–#555; exact Production deployment recorded above |
| Sanity usage baseline | RECORDED | 253,866 / 250,000 API requests; daily-boundary snapshot |
| Exact attribution of Nov 25–27 requests | PARTIAL | Existing archive reviewed; fresh post-remediation export needed to validate tags and request statuses |
| Full Live API callsite inventory | COMPLETE | Explicit application-owned clients/endpoints, middleware, sitemap/feed, Manager, scripts and CI smoke paths searched and classified; Studio built-in traffic requires Request Logs |
| Public catalogue migration | BLOCKED ON OWNER DECISION | Full projection includes price/stock; do not move until displayed freshness policy is agreed |
| Public search migration | BLOCKED ON OWNER DECISION | Search projections include price/stock; design a split or approve the CDN freshness window |
| Product detail full-read policy | PARTIAL / KEEP LIVE COMMERCIAL FIELDS | Slug resolution and related content use CDN; full detail with price/stock remains Live |
| Support / irrigation assistant / cart paths | PARTIAL | Cart weight fallback uses CDN; delivery fees and irrigation BOM price/stock reads remain Live |
| Order validation live path | KEEP LIVE | Re-reads current prices and checks plant variant `outOfStock`; current equipment query does not select/check `stockStatus` — confirm whether a separate stock-validation change is needed |
| Request tagging | IMPLEMENTED / CI VERIFIED | SDK, raw SSR middleware, sitemap/feed, checkout, Manager, browser and admin scripts tagged; exact-head tests passed; fresh Request Logs must confirm tags appear in Sanity |
| Automated monitoring | NOT STARTED | Start with usage/log review; AE requires separate approval |
| Regression guard | CI VERIFIED | `tests/sanity-live-api-tagging.test.mjs` and `tests/sanity-public-cdn-reads.test.mjs` passed within exact-head npm test/Studio validation; Preview and raw HTTP smoke passed |
| Production release of new browser changes | BLOCKED | Draft PR #557; requires exact-SHA Preview/CI verification and separate owner release approval |
| Services/blog SSR seed reuse | IMPLEMENTED ON DEVELOP / PREVIEW VERIFIED | `/services` and `/services/{slug}` now reuse validated SSR payloads; blog index/article seed behavior retained. Draft PR #559. Exact-head CI + BG/RU/EN raw HTTP smoke passed; owner release approval and post-reset Request Logs measurement remain pending |

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
- **Interactive browser check limitation:** a read-only Browser Use inspection of Preview was attempted for catalogue, product, search, cart and irrigation assistant, but the browser service refused to start because its project has insufficient credits. No retry was made. Raw HTTP/SSR tests passed, but they do not prove client-side interaction; browser functional checks remain open.
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


### 2026-11-28 — Production read-only spot check and quota-policy interpretation

- **Production spot check (read-only GETs, no writes):** homepage `/`, plant category `/category/rastenia`, equipment controller category `/category/controllers`, and product detail `/product/senzor-za-dazhd-rain-bird-rsd-bex` returned server-rendered HTML containing catalogue content; the category responses contained 20 product entries and the product detail included price and availability text.
- **Important limitation:** this confirms that those public routes returned HTML at the time of the check. It does **not** prove that the underlying Sanity API/CDN request succeeded on that request; Cloudflare edge cache may have served the content. No cache-busting production request was sent.
- **Sanity plan policy checked against current official docs:** Free/Growth Trial projects have hard caps; once API, API CDN or bandwidth reaches 100%, further public API/CDN requests fail with HTTP 402 until reset or plan change. Failed 4xx/5xx requests are not billed. See https://www.sanity.io/docs/platform-management/plans-and-payments.
- **Interpretation:** the daily history series (39,074 API / 17,246 API CDN on Nov 27) may include failed/blocked attempts, while the monthly metered snapshot is billable usage. This is plausible but **not proven** without Request Logs status codes. Do not equate daily history with billable request totals.
- **Operational risk:** if the project is still on the Free plan and the API quota is above 100%, cache misses that reach Sanity may return 402. Existing cached Production HTML can make a route appear healthy while an uncached request is still blocked. Obtain fresh Request Logs and verify response status before claiming the quota problem is resolved.


### 2026-11-28 — exact-head CI passed; stale Preview target corrected

- **Branch / tested code HEAD:** `develop`, `c957283ec19142554562501dd92e4db9698e77ab`.
- **Draft PR:** [#557](https://github.com/omaraandrey-dev/florial/pull/557), still open, draft, unmerged; base `main` at `2376ac61ffba6b5b179987aebe52afd5849f1156`. No Production release.
- **Root cause of prior failing smoke:** `.github/workflows/equipment-ssr-preview-smoke.yml` used the fixed legacy hostname `feat-seo-equipment-category.florial.pages.dev`. The workflow repeatedly received HTTP 503 from that stale target, while the exact PR-head Cloudflare Pages deployment itself had succeeded.
- **Correction:** the workflow now waits for the `Cloudflare Pages` check on the exact commit, extracts that deployment ID from its check details URL, and tests the corresponding immutable `<deployment-id-prefix>.florial.pages.dev` hostname. Retry duration was reduced to a bounded 12 attempts at 5 seconds; the workflow retains the BG/RU/EN initial-HTML, 20-card, JSON-LD order and locale assertions. The workflow regex escaping was checked from the committed file and the subsequent job log.
- **Exact Preview:** Cloudflare Pages check passed for tested code HEAD `c957283ec19142554562501dd92e4db9698e77ab`; deployment ID `82e89755-698d-4fc7-961e-0e59a469f28a`; URL `https://82e89755.florial.pages.dev`. The corrected equipment SSR smoke passed for BG/RU/EN, each with 20 server-rendered product links and matching CollectionPage ItemList order.
- **Exact-head CI:** all checks completed successfully. Key runs: full SSR/SEO regression `46109241466`; Blog and Studio validation `46109241533`; Equipment product SSR validation/raw HTTP `46109241417`; Equipment catalog all categories `46109241423`; Equipment SSR Preview smoke `46109241493`; Plant catalogue `46109241409`; Blog index `46109241413`; Blog article `46109241465`; Services directory `46109241517`; Service detail `46109241519`; About page `46109241424`; D1 migration validation `46109241445`. All returned `success`.
- **Validation detail:** app/Pages Functions type-check, lint, website tests, website build, migration script syntax, read-only description-migration dry-run, Studio type-check/build, D1 validation and all raw SSR/SEO smoke workflows passed. No D1 migration was applied.
- **Request-tag SDK compatibility:** verified against the installed lockfile version `@sanity/client 6.29.1` source. The SDK supports `requestTagPrefix`; per-request `tag` is accepted in the third `client.fetch(query, params, options)` argument and combined with the configured prefix. This matches the implementation pattern in the current branch.
- **Sanity usage snapshot (read-only, 2026-11-28):** API Requests `253,867` (above the Free allowance of 250,000); API CDN Requests `72,739`; bandwidth `22,886,090,261` bytes. Latest metering timestamp is `2026-11-28T00:00:00Z`. The daily history series reports 0 API Requests and 14,403 API CDN Requests for 28 Nov so far. The direct monthly counter is already capped; the daily history series does not prove that blocked Live API calls have stopped or that they were billable.
- **Existing Request Logs findings from the previous session:** archive `bxvcy0qs-2026-11-20-2026-11-27.ndjson.gz` contained 215,077 records, with the last record at 2026-11-26 23:57 UTC. The reviewed Live API Query counts were 3,293 on 24 Nov, 74,603 on 25 Nov and 82,420 on 26 Nov. Largest GROQ groups: product detail 47,670 requests (339 products); universal type/slug lookup 20,751 (136 slugs); equipment category 12,997; plant category 12,417; services 7,426; plants 6,741. This supported the SSR attribution and the direct `queryDocument()` lookup finding corrected in PR #555. The aggregate CSV contains no query/user-agent/IP/status attribution. The archive has not yet been reprocessed here for a complete status/IP/User-Agent breakdown; a fresh export is still needed to verify request tags and blocked/successful status distribution after remediation.
- **Files changed in this continuation:** `.github/workflows/equipment-ssr-preview-smoke.yml`; this roadmap update records the verified results. The tested application code was unchanged by the workflow fix except for the workflow itself.
- **No changes:** no Sanity documents/schemas/datasets, D1 schema/data, Cloudflare Production settings/bindings/secrets, DNS, orders or Resend configuration were changed.
- **Open owner decisions:** displayed catalogue/search price and stock freshness (previous CDN cache observation approximately 60 seconds); whether to add equipment stock validation to checkout before moving equipment stock display to CDN. Keep these reads Live until decided.
- **Next:** obtain a fresh Request Logs export and validate tags/statuses; complete browser functional checks and a controlled repeated-route traffic sample; request owner decisions on catalogue/search freshness and equipment stock validation. Keep PR #557 draft and Production release blocked pending explicit approval.


### Phase 6 — services and blog SSR/API stabilization (added 2026-11-28)
**Status: IMPLEMENTED ON DEVELOP — service directory and service-detail SSR payload reuse passed exact-head CI and Preview BG/RU/EN raw HTTP smoke. Existing blog index/article payload reuse is retained and regression-tested. Draft PR #559 remains unmerged; owner release approval and post-reset Sanity Request Logs measurement are pending.**

Objective: extend the Sanity API stabilization work to all four public service/blog route families without changing published content or weakening SEO, localization, or freshness behavior.

Scope:
1. Services directory: `/services`.
2. Individual service pages: `/services/{slug}`.
3. Blog directory: `/blog`.
4. Individual blog articles: `/blog/{slug}`.

Audit sequence:
1. Trace each route from `functions/_middleware.ts` through its SSR renderer and Sanity query helper. Record exact query, dataset, perspective, request tag, client/endpoint, Cache API behavior, TTL/stale behavior, error fallback and route invalidation.
2. Trace the matching React route and data functions. Determine whether SSR payload is reused or the browser repeats the same Sanity query after startup; identify related-content and localization follow-up requests separately.
3. Classify each request as public published read eligible for API CDN, direct Live read requiring a documented reason, authenticated/admin operation, or duplicate/unnecessary request.
4. Compare the four route families and their existing regression/smoke workflows. Add tests for endpoint/client selection, published perspective, SSR seed reuse, query counts/deduplication, cache/error behavior and BG/RU/EN output where supported.
5. Propose the smallest safe runtime changes. Preserve existing route HTML, H1/meta/JSON-LD, canonical and language behavior, content ordering, images, internal links and user-visible page behavior.
6. Implement only proven safe changes on the canonical `develop` branch, then run exact-SHA tests, type-check, lint, build, Preview and BG/RU/EN raw-HTTP smoke. Production release remains subject to the existing owner-approval gate.
7. After the Sanity usage reset, compare fresh Request Logs and usage data for the four route families; do not infer savings from CDN code alone.

Initial source map (verified by repository source reads; detailed query/cache classification remains pending):
- Services directory SSR renderer: `functions/_lib/servicesDirectoryHtml.mjs`; middleware entry: `functions/_middleware.ts`.
- Service detail SSR renderer: `functions/_lib/serviceDetailHtml.mjs`; client data path: `src/lib/routeData/serviceDetails.ts`.
- Blog index SSR renderer: `functions/_lib/blogIndexHtml.mjs`; client route and SSR-seed consumer: `src/pages/BlogPage.tsx`.
- Blog article SSR renderer: `functions/_lib/blogArticleHtml.mjs`; client route and SSR-seed consumer: `src/pages/BlogPostPage.tsx`; shared client data functions: `src/lib/blog.ts`.

Guardrails:
- Read-only audit is allowed. Existing published `service` and `blogPost` documents are protected. Do not edit, publish, unpublish, delete or otherwise mutate Sanity content/schema.
- Do not change service/blog copy, SEO metadata, slugs, images, galleries, references, ordering or activity state as part of this API task.
- Keep public reads on the published perspective. Never expose drafts or authenticated Manager/Studio data through public CDN/cache.
- Do not assume every direct Live request is redundant. Preserve any read whose freshness or validation purpose is documented until a safe alternative is demonstrated.
- Do not change global Header, navigation, Footer, routing architecture, Production settings/secrets, D1 or DNS.
- Keep SSR and crawler-visible HTML intact; no reduction in page content or structured data as a request-saving shortcut.

Acceptance criteria:
- A route-by-route callsite matrix exists for all four route families, including SSR and browser requests.
- Any duplicate SSR-to-client fetch is either eliminated safely or documented with its reason.
- Public published reads use the existing API CDN/cache path where safe; every remaining direct Live read has a specific justification.
- Cache policy, freshness, stale behavior and error fallback are tested and documented.
- BG/RU/EN SEO/SSR smoke and exact-head CI pass with no content/behavior regression.
- Post-reset Request Logs show the actual route-family request distribution; any claimed reduction is supported by measured evidence.

### 2026-11-28 — Phase 6 kickoff and initial source review
- Owner approved adding this workstream to the Sanity API stabilization roadmap and beginning implementation work.
- Branch policy: continue on canonical `develop`; no new task-specific branch.
- Initial source files read: `functions/_lib/servicesDirectoryHtml.mjs`, `functions/_lib/serviceDetailHtml.mjs`, `functions/_lib/blogIndexHtml.mjs`, `functions/_lib/blogArticleHtml.mjs`, `src/pages/BlogPage.tsx`, and `src/pages/BlogPostPage.tsx` (selected source sections).
- Confirmed in client code: blog index consumes `florial-blog-ssr-data` and initializes as loaded when the SSR language matches; blog article consumes `florial-blog-article-data` and reuses both article and related-post payload when slug/language match. A non-matching or absent seed falls back to client fetches. This is code-level evidence only; middleware serialization and the exact SSR query/cache paths still require tracing.
- Service detail client loader `src/lib/routeData/serviceDetails.ts` uses an in-process 60-second Map cache with promise deduplication (recorded in source review); this does not establish the edge/SSR cache policy.
- **Not yet verified:** exact Sanity endpoint/client and request tags in each of the four SSR renderers; Cache API TTL/stale behavior; middleware route-to-renderer wiring and error fallbacks; whether service pages repeat a fetch after SSR; current live Production behavior.
- No application source, tests, Sanity content/schema, D1, Cloudflare settings/secrets or Production deployment changed in this kickoff.
- Next: complete middleware/query/cache trace and route-family request matrix, then implement only demonstrated safe optimizations.


### 2026-11-28 — Phase 6 source audit: SSR/CDN and client duplication findings
**Verified against `develop` source at the audit time; no runtime files changed.**

**Shared SSR Sanity helper**
- `functions/_middleware.ts::querySanityData()` calls `https://bxvcy0qs.apicdn.sanity.io/v2024-01-01/data/query/{dataset}`.
- It explicitly sends `perspective=published` and a route-family request tag generated by `getSanityRequestTag()`.
- It uses Cloudflare `caches.default` with a route-specific cache key and caller-supplied TTL. Cache read/write failures are non-fatal; failed upstream responses throw and route handlers use their own fallback behavior.
- This is verified in code, not a live Sanity Request Logs measurement.

**Services directory `/services`**
- SSR executes two published API-CDN queries in parallel: active services (60-second edge data-cache TTL) and four specialist role photos (300-second data-cache TTL). The transformed HTML uses `s-maxage=60, stale-while-revalidate=120`.
- React `src/App.tsx` independently executes three `sanityClient.fetch()` calls for the service list, role photos and service-direction documents. The service list and role-photo projections overlap with the SSR query. The direction-document query is additional data needed by specialist-direction UI and must not be dropped blindly.
- No service-directory SSR seed is currently serialized/consumed. This is a confirmed avoidable duplicate-read candidate for the service list and role photos. Proposed safe design: pass only the already-fetched service and role-photo arrays to the browser as a validated, language-scoped seed; preserve the separate direction-document query where that route requires it. Confirm route conditions before implementation.

**Individual service pages `/services/{slug}`**
- SSR `queryServiceDocument()` uses the shared published API-CDN helper with a 60-second data-cache TTL; service HTML uses `s-maxage=60, stale-while-revalidate=120`.
- React `src/App.tsx` separately calls `fetchServiceDetails()`; `src/lib/routeData/serviceDetails.ts` uses `sanityClient` (configured with `useCdn: true`, `perspective: 'published'`) and a per-runtime 60-second Map cache with in-flight promise deduplication.
- The SSR service document is not currently serialized as a client seed. On a direct first load, the browser therefore repeats a published service-detail read after the server has already fetched the document. This is a confirmed duplicate-read candidate.
- Proposed safe design: serialize the SSR service document and slug/language into a script payload, validate it in App on the initial matching route, initialize `currentServiceDetails` from it and skip only that initial client request. Later SPA navigation to another slug or language changes must continue to fetch normally.

**Blog index `/blog`**
- SSR makes one published API-CDN query with a 60-second data-cache TTL; HTML cache is `s-maxage=60, stale-while-revalidate=120`.
- SSR serializes `florial-blog-ssr-data`; `BlogPage.tsx` consumes it only when language matches and initializes the list as loaded. The initial duplicate browser catalogue fetch is already prevented. If the seed is absent/invalid or language differs, the client intentionally falls back to `fetchBlogPosts()`.
- `src/lib/blog.ts` also has a 60-second in-process list cache with promise deduplication. This is a second cache layer, not a substitute for SSR seed reuse.

**Individual blog articles `/blog/{slug}`**
- SSR fetches the published article and up to three related posts through the shared API-CDN helper; each data cache TTL is 60 seconds. Related content is optional and its failure does not hide a valid article. HTML cache is `s-maxage=60, stale-while-revalidate=120`.
- SSR serializes `florial-blog-article-data`; `BlogPostPage.tsx` consumes matching slug/language data for both article and related cards and skips the initial article/related client reads. Missing/invalid/mismatched seeds fall back to client fetching.
- `src/lib/blog.ts` separately uses 60-second in-process caches for detail and related requests, with promise deduplication and error eviction.

**Preliminary classification**
- Existing blog SSR-to-client duplication: no confirmed duplicate on a normal matching first load; keep current seed behavior and add/retain regression coverage.
- Service directory and service detail: confirmed duplicated public published reads are the highest-value Phase 6 candidates.
- All four SSR families already use the API CDN. Do not replace these with a different endpoint or blindly modify the shared helper.
- No Sanity content/schema, D1, Cloudflare configuration/secrets, DNS or Production state was changed.
- Next: implement the two service SSR-seed reuse improvements, preserving client fetches on later SPA navigation and locale changes; add focused tests and extend BG/RU/EN service SSR smoke to validate the payload and initial-fetch suppression.


### 2026-11-28 — services SSR payload reuse implementation started
- Owner confirmed that temporary PR #409 must no longer constrain normal work. PR #409 was closed (not merged) through GitHub; its temporary branch/diff is not used as a base or source of changes. Current workflow remains `develop` for work and `main` for Production.
- Removed the obsolete PR #409 freeze instructions from `AI_INSTRUCTIONS.md`, `docs/AI/WORK_PROTOCOL.md` and `docs/operations/BRANCH_HYGIENE.md` on `develop`. Historical audit entries remain historical and do not constrain current work.
- Implemented SSR-to-client payload handoff for `/services`: middleware serializes the already-fetched published service list and role photos into a safely escaped JSON script payload; App validates the locale and initializes its state from that payload. Matching initial loads now satisfy the existing `loadedServicesLanguage` guard and skip the duplicate service/role-photo fetches (and the unused direction-list fetch in that same effect).
- Implemented SSR-to-client payload handoff for `/services/{slug}`: middleware serializes the already-fetched published service document, including its route slug and locale; App validates slug/locale/document identity, initializes from the payload and suppresses only the matching first-load fetch. Later SPA route or locale changes continue through the existing client fetch path.
- Blog index/article SSR payload behavior is unchanged; added regression assertions to protect both existing blog handoffs.
- Files changed: `functions/_middleware.ts`, `src/App.tsx`, `tests/content-route-performance.test.mjs`, this roadmap, and current workflow documentation.
- **Tests/CI:** not yet run on the implementation head. Static source review only; do not treat implementation as verified until exact-head CI passes.
- **Preview/Production:** not checked; no deployment performed.
- **Sanity:** no live Sanity reads/writes performed by this implementation; no content/schema changes.
- **Open:** exact-head TypeScript/lint/test/build/Pages Functions validation, Preview deployment, BG/RU/EN raw-HTTP checks, and proof that invalid/mismatched seeds safely fall back to existing fetches.
- Next: open a draft integration PR from `develop` to `main` for exact-head CI/Preview validation; review all changed files and fix any failures before requesting release approval.


### 2026-11-28 — Phase 6 exact-head CI and Preview verification
- **Branch / code head:** `develop`; code-bearing commit `676cc68e72c81e9df620554aeed608eadac27013`. Draft integration PR #559: https://github.com/omaraandrey-dev/florial/pull/559.
- **Implementation:** service directory SSR seed and service detail SSR seed are consumed by the client only when locale/slug/document identity match. Mismatched or absent seeds fall back to the existing CDN fetch path; later SPA navigation and locale changes continue to fetch normally. Blog index/article seeds remain unchanged.
- **Exact-head CI:** Blog/Studio validation `46113461352` — success (application/Pages Functions type-check, lint, website tests/build, read-only migration dry-run, Studio type-check/build); D1 validation `46113461408` — success; full SSR/SEO raw first-response regression `46113461344` — success.
- **Route smoke:** services directory `46113461340` — success (26 service links and CollectionPage/BreadcrumbList in BG/RU/EN); service details `46113461333` — success (25 active detail pages per locale, full first-response HTML and Service/BreadcrumbList); blog index `46113461336` — success (19 cards, four directions and hydration seed per locale); blog articles `46113461332` — success (19 articles per locale, full body/images/seed and BlogPosting/BreadcrumbList). Additional equipment product/catalogue, plant catalogue and About smoke checks passed: `46113461331`, `46113461379`, `46113461328`, `46113461468`, `46113461451`.
- **Preview:** exact Cloudflare Pages Preview `https://e4169bb4.florial.pages.dev`. These checks do not prove Production release or browser-interaction behavior.
- **Production:** not deployed; PR #559 remains Draft and unmerged. Owner approval is still required.
- **Sanity usage:** no fresh Request Logs available yet. Wait for December 1 usage reset, then compare route-family requests and distinguish Live API from API CDN requests and successful from blocked requests. No measured reduction claimed yet.
- **Safety:** no Sanity writes/schema changes, D1 writes/migrations, Cloudflare settings/secrets, DNS, orders, emails or Production state changed.
- **Next:** owner review/approval of Draft PR #559; after release, run safe Production raw HTTP smoke and complete post-reset Sanity Request Logs measurement.



### 2026-11-28 — product SSR identity handoff added to PR #559

- **Branch:** `develop`; exact code/test head: `4b045fd54182cff217a17e1654caec97a02698a9`.
- **Root cause addressed:** the middleware already resolves the product's exact Sanity dataset and document ID for the first HTML response. The browser then repeated two slug lookups (equipment + plants) before fetching the full product projection. This duplicated work on every direct product-page load.
- **Changed:** `functions/_middleware.ts` now serializes a minimal, safely escaped product route payload containing only slug, locale, dataset and document ID. It does not expose a product document or alter rendered content.
- **Changed:** `src/App.tsx` validates that payload against the requested slug, locale and dataset, then uses the resolved identity only for the matching initial product route. SPA product navigation and invalid/missing payloads continue through the existing slug resolver.
- **Changed:** `src/lib/routeData/productDetails.ts` adds `fetchProductDetailsByIdentity()`, which loads the full published product projection directly from the known dataset and ID. It preserves the existing CDN client, published perspective, price/stock display and related-content behavior.
- **Regression test:** added a product SSR identity handoff assertion to `tests/content-route-performance.test.mjs`.
- **Expected reduction:** on an uncached initial product-page load, remove the two parallel slug-to-ID requests; retain the single full product-detail request and any necessary related-content requests. This is a source-level expected reduction, not yet a measured Sanity usage result.
- **Exact-head CI:** queued for `4b045fd54182cff217a17e1654caec97a02698a9`; run IDs include `46118450388`, `46118450358`, `46118450362`, `46118450443`, `46118450363`, `46118450412`, `46118450380`, `46118450352`, `46118450398`, `46118450489`, `46118450357` and `46118450406`. Do not claim validation until completed.
- **Release:** included in Draft PR #559 (`develop → main`). No merge, Production deployment, Sanity writes, D1 changes or Cloudflare configuration changes.
- **Next:** wait for exact-head CI and Preview; then extend SSR payload reuse to product/category catalogue data only after validating projection completeness and route behavior. Keep the 60-second displayed price/stock freshness policy and authoritative Live checkout price validation unchanged.


### Product SSR identity handoff — exact-head verification update

- Tested code SHA: `4b045fd54182cff217a17e1654caec97a02698a9`.
- Exact Cloudflare Pages Preview deployment: `aeaa764d-1a57-4db8-934c-4bd15300b59f`; URL: https://aeaa764d.florial.pages.dev.
- Blog and Studio validation run `46118450398`: success — app/Pages type-check, lint, website tests, website build, migration syntax/read-only dry-run, Studio type-check/build.
- Full SSR/SEO regression run `46118450363`: success.
- Equipment product SSR validation/raw HTTP run `46118450388`: success — validation/build/tests and all active published equipment product pages checked without JavaScript.
- Plant catalogue `46118450358`, equipment catalogue `46118450380`, services directory `46118450489`, service details `46118450362`, blog index `46118450352`, blog articles `46118450443`, About `46118450357`, equipment Preview smoke `46118450412`: success.
- D1 validation run `46118450406` was cancelled; no D1 migration or data operation was part of this change.
- **Verification boundary:** this validates source behavior and raw first-response routes on Preview. It does not measure Sanity's real CDN request counter or prove a two-request reduction from usage logs. No Production deployment or merge.
