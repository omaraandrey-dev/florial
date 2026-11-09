# Florial — blog card payload optimization report (09.11.2026)

**Production:** https://florial-bg.com  
**PR:** https://github.com/omaraandrey-dev/florial/pull/145  
**Merge commit:** `6897cb1ad4ef4bb8429838c83f11c515ad9fec80`  
**Cloudflare Pages deployment:** `1f9145d2-7aeb-46e7-840d-e79af9e70a68` — success  
**Scope:** compact blog list projections, shared request cache, full article detail on demand.

## 1. Before

- `src/lib/blog.ts` used one `postProjection` for both lists and article details.
- The projection included Portable Text body and gallery for every listed article.
- Header and homepage BlogSection independently called `fetchBlogPosts(3)`; both returned the same three articles.
- The preceding live Sanity diagnostic measured each of those duplicate response bodies at 145,912 B. These are decoded response-body sizes from the diagnostic, not encoded transfer totals.

## 2. Implemented

- Added a compact card projection with `_id`, slug, publication date, cover URL/ALT/caption and localized BG/RU/EN title, short description and cover ALT.
- List projection excludes Portable Text, gallery, SEO and tags.
- Full detail projection retains all localized body content, SEO, tags, cover and gallery and is fetched for one article by slug.
- Added a 60-second in-memory promise cache keyed by list limit. Concurrent Header and BlogSection calls to `fetchBlogPosts(3)` share one promise. Rejected requests are evicted; a cache token prevents an older failed request from deleting a newer cache entry.
- BlogPage and related article cards now use compact list records.

## 3. Read-only Sanity checks

Project `bxvcy0qs`, dataset `production`:

- Compact top-3 projection: 3 documents; Sanity tool response text 4,668 characters.
- Compact full-list projection: 22 documents; tool response text 29,597 characters.
- Full article detail projection:
  - `montazh-podmyana-remont-razpruskvachi-nesebar`: 47,544 characters.
  - `rain-bird-oborudvane`: 35,000 characters.
- BG/RU/EN translations and Portable Text are present in the tested detail records.
- All operations were read-only. No Sanity document/schema writes.

**Measurement note:** tool output character counts are not encoded HTTP transfer bytes. They are not compared as a percentage with the earlier 145,912 B browser measurements.

## 4. CI and release

- Blog and Studio validation run `42590188304`: success (website lint, utility tests, website build, migration syntax, read-only migration dry-run, Studio dependency install and build).
- D1 validation run `42590188234`: success.
- Merge commit: `6897cb1ad4ef4bb8429838c83f11c515ad9fec80`.
- Cloudflare Production deployment `1f9145d2-7aeb-46e7-840d-e79af9e70a68`: success; aliases `florial-bg.com`, `www.florial-bg.com`.

## 5. Live smoke

Firecrawl rendered-page checks after deployment:

- Homepage BG/RU/EN: three blog card links; localized pages render.
- `/blog` BG/RU/EN: 22 article links in each locale.
- `/blog/rain-bird-oborudvane` BG/RU/EN: localized article body, cover/gallery images and related links render.
- Header Portfolio menu opened successfully; displayed three recent article links and the full blog CTA.
- No blog/article loading placeholders remained after client-side load.

A separate live PerformanceResourceTiming inspection on the homepage found 8 Sanity API request URLs, all distinct, including exactly one compact top-3 blog query (duration 158 ms). The previous post-release diagnostic recorded 9 Sanity requests and two identical blog queries. This confirms the duplicate request is no longer present. Sanity `transferSize`, `encodedBodySize` and `decodedBodySize` were all 0 due cross-origin timing visibility; no transfer bytes can be reported. Browser remained at default 1920×993; this is not a controlled baseline run.

## 6. Scope and limitations

- Changed only `src/lib/blog.ts`, `src/components/Header.tsx`, `src/components/BlogSection.tsx`, `src/pages/BlogPage.tsx`, `src/pages/BlogPostPage.tsx`.
- No layout/design changes to Header/menu/Footer.
- No changes to Sanity schema/documents, D1, API, Manager, cart/checkout, Cloudflare settings/secrets.
- No real order or form submission.
- No controlled CDP network transfer/request count after release; Lighthouse, LCP, INP and CLS remain unmeasured. No overall speed percentage is claimed.

## 7. Next

Repeat the baseline CDP profile (390×844, CPU 4×, 150 ms latency, 10 Mbps down / 1.5 Mbps up, cache disabled, three runs) for homepage, plant/equipment category, product detail, search, blog list and article. Keep Lighthouse/CWV separate from network transfer measurements.
