# Florial — post-release Sanity payload diagnostic (09.11.2026)

**Production:** https://florial-bg.com  
**Runtime commit:** `dd129898f207018e5124f7fa2604ff9a727ccd9a` (PR #144)  
**Cloudflare deployment:** `d93cc80d-1475-49d1-a798-a08587b6b2dd` — success  
**Purpose:** diagnostic inspection after PR #142–#144, not a replacement for the controlled CDP baseline.

## Method and limitations

- Used a remote Firecrawl browser session on the live homepage.
- The browser viewport remained at its default `1920×993`; requested `390×844` was unavailable.
- Cache disable, CPU slowdown 4× and network throttling (150 ms, 10/1.5 Mbps) were unavailable.
- Browser Performance API showed many image and Sanity cross-origin entries with `transferSize=0` (cache/CORS timing visibility), so the reported 222,782 B total transfer and 1,442 B image transfer are **not valid transfer totals** and must not be compared with baseline.
- As a separate read-only diagnostic, the browser re-fetched each unique Sanity query URL with `cache: no-store`, `credentials: omit`, and measured UTF-8 response body length. This is decoded response-body size, not encoded network transfer. All 8 unique query URLs succeeded; no CORS failures.

## Read-only Sanity response body sizes

| Dataset | Query | Response body |
|---|---|---:|
| production | blogPost | 145,912 B |
| production | blogPost (duplicate request) | 145,912 B |
| production | category compact index | 67,090 B |
| production | equipment compact product catalogue | 740,714 B |
| production | service compact index | 17,022 B |
| production | siteSettings | 620 B |
| production | logo/photo metadata | 1,469 B |
| plants | category compact index | 17,464 B |
| plants | plant compact product catalogue | 86,747 B |
| **Total** | **9 Sanity API requests** | **1,077,038 B (~1.08 MB)** |

## Findings

1. The initial page now performs 9 Sanity API requests. The baseline recorded 10 XHR requests; the separate plant related-content lookup is no longer part of the homepage initial request set.
2. Equipment compact product query body is 740,714 B; plant compact product query body is 86,747 B. These values are useful as a current decoded-payload reference only.
3. The two duplicate blog requests each return 145,912 B. The blog list query still includes Portable Text body and gallery for each of the three posts even though Header/BlogSection cards do not need full article content.
4. Current category compact indexes return 67,090 B (production) and 17,464 B (plants).
5. This diagnostic does **not** prove a percentage improvement versus baseline. Baseline used CDP encoded transfer with cache disabled and mobile throttling; this diagnostic used unthrottled remote browser and decoded body lengths.

## Next step

Stage 2: inspect `src/lib/blog.ts`, `src/components/Header.tsx`, `src/components/BlogSection.tsx`, `src/pages/BlogPage.tsx` and `src/pages/BlogPostPage.tsx`. Replace duplicated full-list requests with one shared compact blog-card projection; retain full body/gallery only for article detail. Preserve BG/RU/EN titles, descriptions, cover ALT/caption, dates, slug and published status.

## What remains open

- Repeat the original CDP network capture on the same 390×844 / CPU 4× / 150 ms / 10/1.5 Mbps / cache-disabled profile.
- Obtain post-release encoded transfer and per-query timings.
- Lighthouse, LCP, INP and CrUX remain unmeasured.
