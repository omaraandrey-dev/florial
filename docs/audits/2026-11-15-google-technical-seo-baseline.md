# Florial — technical SEO baseline: Google, canonical, sitemap and robots

Date: 2026-11-15  
Repository baseline: `main` at `8c829c7e3e5f9e2a5857f56bfb9639aa8619a364`  
Primary domain: `https://florial-bg.com`  
Scope: read-only technical SEO audit. No Sanity writes, application changes, DNS/Cloudflare changes, redirects, deployments or Google settings were made.

## 1. Executive result

The sampled live pages have a consistent apex-domain setup:

- `www.florial-bg.com` requests for the palm category and standard Washingtonia product return HTTP 301 to the corresponding `florial-bg.com` URL.
- The BG/RU/EN palm-category pages return HTTP 200, `index, follow`, self-referencing localized canonicals and the expected hreflang set.
- The three category pages emit `BreadcrumbList`, `CollectionPage` and `Organization` JSON-LD.
- `robots.txt` returns HTTP 200, allows crawling and points to the primary sitemap.
- Google Search Console reports the sitemap was downloaded on 2026-11-14 with zero errors and zero warnings.

No confirmed live canonical or robots defect was found in the sampled routes. Google's *selected canonical* and the final indexing state are still unverified because the connected Windsor.ai Search Console connector does not expose URL Inspection data.

## 2. GitHub source inspection

Verified against the repository `main` SHA above:

- `functions/_middleware.ts`: defines `SITE_URL = https://florial-bg.com`; the localized page metadata path uses the shared localized-route URL builder; product/category/service/blog canonical URLs are generated from the apex base URL. The middleware also has explicit server-side `noindex, nofollow, noarchive` handling for private/no-index routes.
- `functions/sitemap.xml.ts`: constructs the sitemap from active/published Sanity records across the equipment and plants datasets, excludes records with `noIndex`, and emits apex-domain BG/RU/EN URLs plus x-default/hreflang alternates where translated content exists.
- `src/pages/CategoryPage.tsx`: applies localized category SEO and builds CollectionPage and breadcrumb structured data. The category's client-rendered content is hydrated after the initial server response.

These are code-level findings, not proof of Google's selected canonical or indexing decision.

## 3. Live robots and sitemap observations

### robots.txt

Read-only fetch of `https://florial-bg.com/robots.txt`:

```text
User-agent: *
Allow: /

Sitemap: https://florial-bg.com/sitemap.xml
```

The endpoint returned HTTP 200.

### Sitemap in Search Console

The connected Search Console property is `sc-domain:florial-bg.com`.

The date-scoped sitemap report returned this row:

- Sitemap: `https://florial-bg.com/sitemap.xml`
- Report date / last submission: 2026-11-14
- Submitted URLs: 2,624
- Errors: 0
- Warnings: 0
- Last downloaded: 2026-11-14 11:22:39 UTC

**Connector consistency note:** a separate no-date read of the same sitemap report returned 1,312 submitted URLs, while the date-scoped row for 2026-11-14 returned 2,624. The latest date-scoped record is reported above, but the count should be confirmed in the Search Console UI before using it as a definitive sitemap URL total. This discrepancy does not establish a sitemap error.

## 4. Live category page checks

Checked the following URLs:

- `https://florial-bg.com/category/palmi-yuki`
- `https://florial-bg.com/category/palmi-yuki?lang=ru`
- `https://florial-bg.com/category/palmi-yuki?lang=en`

All three returned HTTP 200 and `index, follow`.

| Locale | Title | Meta description length | H1 |
|---|---|---:|---|
| BG | Палми и юки | Несебър | Градински център Флориал | 144 | Палми и юки за градини, дворове и тераси |
| RU | Пальмы и юкки | Несебър | Садовый центр Флориал | 142 | Пальмы и юкки для сада и террасы |
| EN | Palms and Yuccas | Nessebar | Florial Garden Center | 152 | Palms and Yuccas for Gardens and Terraces |

All three descriptions are within the project's 160-character target. The shortened descriptions are already present in live page metadata; **no further Sanity update is needed for this item**.

Each locale has:
- its own canonical URL, including the `?lang=ru` / `?lang=en` query for localized pages;
- hreflang alternates for `bg`, `ru`, `en` and `x-default`;
- `index, follow`;
- JSON-LD types `BreadcrumbList`, `CollectionPage` and `Organization`.

The BG page's inspected rendered output contained one H1, 9 H2 headings, 3 H3 headings and 18 links to product pages. This supports the category-to-product navigation check; reciprocal product-to-category links were not exhaustively crawled in this audit.

## 5. Search Console — last 28 days

The connected property returned a page report with 313 URL rows:

- 1,004 impressions
- 58 clicks
- 946 impressions / 50 clicks on apex-domain URL rows
- 57 impressions / 8 clicks on www URL rows (23 URL rows)

The latest www URL impression in the retrieved daily sample was 2026-11-13. This is consistent with Google still reporting some historical www URLs even though sampled live www requests currently redirect with HTTP 301. It is not, by itself, proof of a canonical defect.

### Palm category

| Locale URL | Impressions | Clicks | Average position |
|---|---:|---:|---:|
| BG base URL | 12 | 0 | 5.92 |
| RU `?lang=ru` | 2 | 0 | 7.50 |
| EN `?lang=en` | 2 | 0 | 3.00 |
| **Total** | **16** | **0** | — |

These are low-volume observations, not a stable ranking baseline.

The query-level Search Console read returned 96 query/page rows and 220 impressions / 5 clicks. It is a partial query sample and should not be compared directly with page totals or presented as the property's total search performance. No search-query row for the palm category was returned in the query-filtered read; this does not mean the category had zero impressions.

## 6. www-to-apex redirect check

Live HTTP requests confirmed:

- `https://www.florial-bg.com/category/palmi-yuki` → HTTP 301 → `https://florial-bg.com/category/palmi-yuki`
- `https://www.florial-bg.com/product/washingtonia` → HTTP 301 → `https://florial-bg.com/product/washingtonia`

The apex category URLs themselves return self-canonicals in all three locales. Middleware source also constructs canonical URLs using the apex `SITE_URL`.

This is a positive technical result. Continue monitoring the www rows in Search Console after Google processes the redirects; do not change canonical rules or create additional redirects based only on historical impressions.

## 7. Remaining unknowns and blockers

1. **Google-selected canonical:** not available from the connected Windsor.ai Search Console connector. It must be checked with Search Console URL Inspection in the Google UI or a separately authorized URL Inspection integration.
2. **Google indexing status for recent Yucca/Cycas/Washingtonia changes:** not confirmed. A live HTTP 200 and correct canonical do not prove Google has recrawled or indexed the latest content.
3. **Sitemap submitted URL count:** connector reads were inconsistent (2,624 in the date-scoped 2026-11-14 row versus 1,312 in a no-date read). Confirm in the Search Console Sitemaps UI.
4. **Reciprocal palm product-to-category links:** not exhaustively crawled; the BG category page has 18 product links.
5. **Search performance history beyond the available Windsor trial window:** not available in the current connector access.

## 8. Recommended next actions

1. In Search Console URL Inspection, inspect the BG, RU and EN palm-category URLs and the two Washingtonia product URLs. Record indexing status, user-declared canonical and Google-selected canonical.
2. Inspect one www Washingtonia URL to confirm Google reports the redirected apex destination; repeat for any www URL that continues to receive impressions after the next reporting period.
3. Confirm the sitemap submitted URL count and last-read status in the Search Console Sitemaps UI.
4. Recheck the same GSC page/query groups after 7–14 days. Do not change canonical, slugs or redirects unless URL Inspection shows a real discrepancy.
5. Continue with the planned read-only internal-link and priority species-page review only after this Google URL Inspection checkpoint.

## 9. Change and approval record

- No Sanity content or schema was changed.
- No existing blog post or service document was edited.
- No application source, Cloudflare setting, DNS, redirect, D1, secret, analytics configuration or Production deployment was changed.
- No request for Google indexing was submitted.
- This report is an audit artifact only; it does not claim that Google has accepted the canonical URLs or recrawled recently changed pages.
