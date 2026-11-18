# Florial plant category editorial refresh — 2026-11-18

## Scope

- Sanity project: `bxvcy0qs`
- Dataset: `plants`
- Published document: `plants-root`
- Public slug / route: `rastenia` / `/category/rastenia`
- Source published revision before edits: `mCiJ6j1PmqLVq15csfnJ1Z`
- Final published revision after all edits: `27yhFk6bgn0uNCdCySoa9D`
- Languages: BG (root fields), RU and EN (translation fields)

The owner approved the category text refresh and complete RU/EN localization. Only editorial and SEO text fields were changed.

## Changes

- Rewrote the short category description in BG/RU/EN to state clearly that Florial sells plants and that the page is an online plant catalogue.
- Rewrote all 25 Portable Text blocks in each language (75 blocks total), preserving block keys, Portable Text structure and heading hierarchy (8 H2 per locale).
- Added direct commercial language naturally in the introduction and closing copy; retained plant categories, coastal suitability guidance, local service geography and related landscaping/irrigation services.
- Clarified the Bulgarian term “солитери” with plain-language wording in the section heading and retained the professional term in the explanatory paragraph.
- Improved Bulgarian phrasing (including replacing the awkward “обем” usage with “структура”) and produced independent, natural Russian and English versions.
- Confirmed and retained the existing H1 wording in all three locales; updated the meta descriptions for all three languages. The Russian meta title now uses the Russian spelling “Несебр”.
- Final meta description lengths: BG 141 characters, RU 132, EN 158.

## SEO and page intent

The category now explicitly communicates commercial intent in visible content and metadata:
- BG opening: “В градински център Florial предлагаме за продажба…”
- RU opening: “В садовом центре Florial мы продаём…”
- EN opening: “Florial Garden Centre sells plants…”

Meta descriptions begin with an explicit sale signal in all three locales. Existing CollectionPage / ItemList category structured data and product-card catalogue model were not changed.

## Preservation

- Document ID, slug, URL and publication status preserved.
- Existing image, helpBlock, sortOrder and other non-text fields preserved.
- Existing H1 meaning and category structure retained.
- No product records, category children, assets, Sanity schema, application code, Cloudflare, D1, Resend or global navigation were changed.

## Backup

A full pre-write Sanity document snapshot was created and read back from GitHub before the first Sanity write:

- `docs/backups/sanity/2026-11-18-plants-root-before-editorial-refresh.json`
- Backup commit on main: `bbfa964566c3c115bcc5504fc0c09f2706de838d`
- Snapshot source revision: `mCiJ6j1PmqLVq15csfnJ1Z`

## Verification

- Sanity patch: 1 document successful, 0 failed.
- Sanity publish: `drafts.plants-root` published to `plants-root`.
- Published-perspective read-back confirmed final revision `27yhFk6bgn0uNCdCySoa9D`, unchanged slug `rastenia`, all three descriptions, all three H1/meta title/meta description values and 25 SEO blocks per locale.
- Sanity document validator returned `valid`, `complete=false`; custom validation callbacks (including custom slug uniqueness callbacks) are not executed by the beta validator.
- Live HTML verification is **not confirmed**. Firecrawl returned an insufficient-credits error before running the scrape; direct web open could not access the production URL. Do not claim rendered-page QA or Google indexing/recrawl.
- This is a content-only Sanity update; no code build or Cloudflare deployment was required or performed.

## Documentation integration

This audit and the pre-write backup are unique artifacts. Shared `CHANGELOG.md` and `docs/TECHNICAL_PASSPORT.md` updates are deferred to the repository's conflict-aware documentation integration pass because open content PRs #391, #392 and #393 are also coordinating changes to shared history documents.
