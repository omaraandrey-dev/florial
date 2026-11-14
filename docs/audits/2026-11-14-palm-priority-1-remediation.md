# Florial — palm priority-1 SEO remediation

Date: 2026-11-14  
Sanity project: `bxvcy0qs`  
Dataset: `plants`  
Perspective before/after: `published`  
Scope: all 11 published product documents with `productType == "palm"`.

## Backup and safety

- A pre-change snapshot of all affected SEO objects, localized SEO objects, main-image ALT values and revision IDs was committed to `docs/backups/palm-seo-before-priority-1-2026-11-14.json` on branch `seo/palm-priority-1-2026-11-14`.
- The original Cycas classification fields (`productType`, `category`, `categories`) are included in that snapshot.
- Creating a separate Sanity dataset copy was attempted but blocked by the project's dataset quota (Payment Required / Quota exceeded). No quota or plan changes were made.
- Sanity edits were applied as drafts with revision guards, reviewed, then published. No unrelated product fields were changed.

## Changes published

1. Shortened all 23 Meta Description fields that exceeded 160 characters: BG 7, RU 8, EN 8.
2. Corrected the Cycas revoluta SEO in BG/RU/EN:
   - H1 now identifies it as a cycad/sagovnik, not a palm.
   - Meta Title and Meta Description use the correct plant group and local search context.
   - Main image ALT in all three languages no longer calls it a palm.
3. Corrected Cycas classification:
   - `productType`: `palm` → `other` (the deployed schema's allowed botanical/commercial value; no dedicated cycad enum exists).
   - `category` and `categories`: `plants-palms` → `plants-exotic`.
4. Filled the three missing main-image ALT values on the second Washingtonia product in BG/RU/EN.

## Verification after publication

Fresh read-only queries against Sanity published perspective confirmed:
- 11/11 target documents returned.
- 0 Meta Descriptions over 160 characters across BG/RU/EN.
- 0 Meta Titles over 70 characters across BG/RU/EN.
- 0 empty main-image ALT values across the 11 target documents and three locales.
- Cycas no longer references `plants-palms`; it references `plants-exotic` and has `productType: other`.

## Boundaries and remaining work

- No product names, slugs, prices, stock, variants, long descriptions, care guides, images/assets, schema, code, Cloudflare settings or production infrastructure were changed.
- No code build or Pages deployment was required or performed; these were Sanity content-only changes.
- Google Search Console recrawl, indexing and ranking changes are not yet confirmed.
- The dataset-level backup remains unavailable due to Sanity quota. The affected-field snapshot is retained in GitHub and can be used to restore the edited fields.
