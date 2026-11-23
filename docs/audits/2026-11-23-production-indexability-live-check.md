# Florial — live indexability verification (23.11.2026)

## Status

**Live Production signals: PASS for the sampled product URLs. Google Search Console's saved index state: still reports historical noindex and three canonical mismatches. Phase 0 remains OPEN; do not implement a code/Sanity change until Google's current live view is confirmed.**

This is a read-only verification checkpoint. It does not claim that Google has re-crawled or re-indexed the affected URLs.

## Scope and timestamp

- Checked: 2026-11-23, approximately 06:16–06:20 UTC.
- Repository: `omaraandrey-dev/florial`, `main`.
- Main HEAD: `1ea8ad87940e346934303bfcaa746779771f98b0`.
- Production domain: `https://florial-bg.com`.
- Production Pages deployment: `8d2d6ec7-2926-4c3b-9d25-33b8c03b7b4b`, successful; created 2026-11-23 03:46:34 UTC, completed 03:47:32 UTC; source branch `main`, exact source commit `1ea8ad87940e346934303bfcaa746779771f98b0`. This latest commit is documentation-only; it does not introduce a new runtime SEO implementation.
- Production aliases returned by Cloudflare: apex and `www`.

## 1. Live Production HTTP and HTML

Read-only HTTP fetches and a rendered browser pass were performed. For the affected product URLs and controls:

- HTTP status: `200`.
- `X-Robots-Tag`: absent.
- Initial HTML meta robots: `index, follow`.
- Rendered DOM after client hydration: still `index, follow`.
- Canonical: self-referencing; localized RU/EN URLs retain their `?lang=ru` / `?lang=en` parameter.
- Hreflang: BG, RU, EN and `x-default` present.
- H1 is present in initial HTML and remains present after hydration.
- Product JSON-LD, BreadcrumbList and Organization are present in the rendered DOM.
- Observed product response headers: `Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=600`; `CF-Cache-Status: DYNAMIC`; `Age` absent. No response-level robots header was returned.

The rendered browser check covered all 11 URLs that the current GSC inspection reports as excluded by noindex:

- Washingtonia: BG, RU, EN.
- Brahea armata: BG, RU, EN.
- Buddha's hand citron: BG, RU, EN.
- Rain Bird 200-PGA 2-inch: BG and RU.

The EN Rain Bird 200-PGA page was also checked and is currently indexable in the rendered DOM.

Additional controls:
- `/product/yucca-rostrata` — HTTP 200, index/follow, self-canonical.
- `/product/citrus-japonica-kumquat` — HTTP 200, index/follow, self-canonical. This is the current Kumquat slug; `/product/kumquat` is not the canonical product URL.
- `/product/rain-bird-100-pga-9v` — HTTP 200, index/follow, self-canonical.

The three URLs Google previously selected as canonicals for unrelated pages were also fetched live:
- `/product/krasula`
- `/product/irritec-ivvee2700n160`
- `/product/komplekt-avtomatizatsiya-6-zoni`

All three currently return HTTP 200, `index, follow`, no `X-Robots-Tag`, and their own self-canonical. Their H1/title content is distinct from the affected pages.

### URL normalization checks

- `https://www.florial-bg.com/product/washingtonia` returns a 301 redirect to the apex URL `https://florial-bg.com/product/washingtonia`.
- The trailing-slash variant returns 200, renders the same product, remains `index, follow`, and declares the slashless canonical. This is a duplicate URL form, but no evidence from this check indicates that it is the cause of the reported noindex state.

## 2. Google Search Console — saved URL Inspection state

Read-only URL Inspection was run for the affected pages, controls and the three Google-selected canonical targets.

The API returned the last saved crawl/index state, not a live URL test. For the 11 affected product URLs it still reports:

- `coverageState = Excluded by ‘noindex’ tag`
- `indexingState = BLOCKED_BY_META_TAG`
- `robotsTxtState = ALLOWED`
- `pageFetchState = SUCCESSFUL`

Three BG product URLs still have a saved Google-selected canonical different from the page's declared canonical:

| Affected URL | Google-selected canonical | Last saved crawl |
|---|---|---|
| `/product/washingtonia` | `/product/krasula` | 2026-11-21 13:31:24 UTC |
| `/product/brahea-armata` | `/product/irritec-ivvee2700n160` | 2026-11-16 04:33:02 UTC |
| `/product/rakat-na-buda` | `/product/komplekt-avtomatizatsiya-6-zoni` | 2026-11-18 20:04:53 UTC |

The RU/EN variants of those three plants still show saved noindex status but self-canonical. Their last saved crawl times are 2026-10-23/24. Rain Bird 200-PGA BG and RU also show saved noindex; EN shows `Submitted and indexed`.

Historical code context: GitHub commit `1dbc0d4d0a1f1e3db5d076b214131c4c212e6303` (2026-10-25) explicitly removed automatic `noindex` from public RU/EN product, category and service pages when translation SEO fields were incomplete, and changed sitemap inclusion rules accordingly. The six RU/EN plant URL inspections have last crawl dates 2026-10-23/24, before that fix; Rain Bird 200-PGA RU was last crawled 2026-10-24. Their saved noindex state is therefore consistent with a pre-fix crawl and should not be treated as evidence of the current page response. The current rendered DOM for these localized URLs is `index, follow`. This historical code change does not explain the newer BG noindex/canonical anomalies; their original cause remains unestablished.

The three canonical-target pages themselves still show saved `Excluded by noindex tag` with self-canonical in GSC:
- Krasula — last crawl 2026-11-20 05:29:53 UTC.
- Irritec valve — last crawl 2026-11-17 21:17:15 UTC.
- Six-zone automation kit — last crawl 2026-11-18 08:34:21 UTC.

Controls in GSC:
- Yucca rostrata — `Submitted and indexed`, self-canonical.
- Citrus japonica / Kumquat — `Submitted and indexed`, self-canonical.
- Rain Bird 100-PGA-9V — `Submitted and indexed`, self-canonical.
- Rain Bird 200-PGA EN — `Submitted and indexed`, self-canonical; Rich Results verdict PASS in the saved inspection.

**Interpretation:** these GSC records describe Google's last stored crawls. They do not prove that Google still receives noindex today. The live Production HTML and hydrated DOM observed on 23.11.2026 contradict the saved noindex state. The GSC connector available for this check exposes stored URL Inspection data but does not expose Google's UI-only “Test live URL” action. Therefore the current Google live-test result remains **NOT VERIFIED**.

## 3. Live Sanity read-back

Read-only published-document queries in project `bxvcy0qs` confirmed:

Dataset `plants`:
- `palm-washingtonia`, slug `washingtonia`, active; root and RU/EN `seo.noIndex = null`; `_updatedAt = 2026-11-20T12:03:47Z`.
- `palm-brahea`, slug `brahea-armata`, active; root and RU/EN `seo.noIndex = null`; `_updatedAt = 2026-11-20T12:03:43Z`.
- `citrus-buddha`, slug `rakat-na-buda`, active; root and RU/EN `seo.noIndex = null`; `_updatedAt = 2026-11-11T15:49:25Z`.

Dataset `production`:
- `94b743bb-e6d5-467d-902d-80e3d9bee440`, slug `rain-bird-200-pga-24v`, active; root and RU/EN `seo.noIndex = null`; `_updatedAt = 2026-11-15T12:04:56Z`.

No Sanity writes were performed.

## 4. Sitemap and robots

Live Production:
- `/robots.txt`: HTTP 200; `User-agent: *`, `Allow: /`; sitemap declared as `https://florial-bg.com/sitemap.xml`.
- `/sitemap.xml`: HTTP 200; 1,372 `<loc>` entries. Affected product slugs and the three canonical-target slugs are present.

Google Search Console sitemap report:
- Submitted: 1,372 web URLs.
- Last downloaded: 2026-11-22 14:41:08 UTC.
- Errors: 0.
- Warnings: 0.
- Pending: false.

## 5. Code review on current main

Files checked at current `main`:
- `functions/_middleware.ts` — blob SHA `46bc2ccc9418fc9629ef8180b918c3128da58179`.
- `src/pages/ProductPage.tsx` — blob SHA `bd14a9f0c2929b57152083399d61436d16981de3`.
- `src/lib/seo.ts`.
- `public/_headers`.

Relevant behavior:
- Server middleware sets product noindex only when the selected Sanity `seo.noIndex === true`.
- Client ProductPage passes noindex only when localized `seo.noIndex === true`.
- `applyPageSeo` defaults `noIndex` to false and writes `index, follow` when false.
- `public/_headers` contains security headers and immutable asset caching; no global robots/noindex directive.

The product document lookup uses a 300-second Cloudflare Cache API TTL for Sanity document data. The observed page responses themselves were `CF-Cache-Status: DYNAMIC` with no `Age` header. This does not prove that every internal data lookup was uncached at every earlier crawl time.

## 6. Conclusions and remaining work

**Confirmed now:**
1. The sampled Production pages currently render indexable directives in both initial HTML and post-hydration DOM.
2. No response-level `X-Robots-Tag` was present on the sampled product pages.
3. Current published Sanity records for the four affected products are active and do not set noindex in BG/RU/EN.
4. Current robots.txt and sitemap are accessible; sitemap count matches Google's submitted count and Google reports no errors/warnings.
5. Current Production deployment is successful from the exact current main SHA.

**Still open:**
1. Obtain a Google live URL test for representative BG/RU/EN affected URLs. The current connector only returns the saved crawl state.
2. After a live test confirms index/follow, allow/request a new Google crawl for the 11 affected URLs and verify that Google-selected canonical becomes the declared self-canonical.
3. Re-run GSC URL Inspection after Google has crawled the current HTML.
4. Do not change Product SEO fields or middleware merely to make old GSC snapshots disappear. No present live noindex defect has been reproduced.

**Phase 0 acceptance is NOT yet met.** The live HTML check passes, but the Google live-test / post-recrawl evidence required to close the noindex and canonical discrepancy is missing.

## 7. Change and safety record

- Read-only GitHub, Cloudflare Pages deployment metadata, Production HTTP/browser inspection, Search Console reads and Sanity published-document queries only.
- No runtime code, tests, Sanity documents/schema, Cloudflare settings/secrets, D1, Resend, DNS or Google settings were changed.
- No indexing request was submitted.
- This checkpoint is intentionally a unique audit artifact. Shared files `CHANGELOG.md`, `docs/TECHNICAL_PASSPORT.md`, `docs/AI/OPEN_QUESTIONS.md` and the existing SEO roadmap were not edited here because open PRs #409 and #486 already touch shared documentation. Integrate the closeout after those PRs are resolved and the live-test evidence is available.
