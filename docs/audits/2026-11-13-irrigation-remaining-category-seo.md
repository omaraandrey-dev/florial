# SEO audit — 42 remaining irrigation categories

**Date:** 2026-11-13  
**Sanity:** project `bxvcy0qs`, dataset `production`, published perspective  
**Pre-write backup:** `docs/backups/sanity-irrigation-remaining-categories-before-seo-2026-11-13.json`  
**Scope:** 42 published category documents with assigned product references, including the irrigation catalogue root.

## Result

All 42 target documents were updated and published successfully. This completes the same localized category SEO structure for the remaining irrigation catalogue pages after the first 10 primary categories.

- 42 category documents; 126 localized SEO articles (BG/RU/EN).
- Four visible FAQ question/answer pairs in every localized article: 504 localized FAQ pairs.
- Each SEO article is Portable Text with 13 blocks: two H2 headings, explanatory paragraphs, four H3 questions and four answers.
- Plain-text article lengths after final publication: **1,676–2,061 characters** across all three locales.
- All 126 Meta Titles are **70 characters or shorter** and include the relevant location (Несебър / Несебр / Nessebar) and Florial brand.
- All 126 Meta Descriptions are **160 characters or shorter** and use localized purchase intent and Nessebar/Bulgaria delivery context.
- Existing localized H1 values were retained where already present and verified for all 42 documents.
- Existing useful category descriptions were retained; generic legacy boilerplate descriptions were replaced with concise localized descriptions.

## Category coverage

The 42 documents cover the irrigation root page, sprinkler and nozzle subcategories, controller and sensor subcategories, 24 V / 9 V valves, drip irrigation components, PE compression fittings, threaded plastic fittings, saddle clamps, sprinkler fittings and valve fittings.

Published category slugs:

```text
vsichko-za-polivane
rotorni-razprskvachi
static-sprinklers
spray-nozzles
rotator-nozzles
autonomous-controllers
kontroleri-vatreshen-montazh
kontroleri-vanshen-montazh
senzori-za-avtomatizatsiya
electromagnetic-valves-24v
electromagnetic-valves-9v
kranove-za-kapkov-markuch
fitingi-16-mm-za-kapkov-markuch
fitingi-6-mm-za-mikrotraba
kapkovo-napoyavane-fitingi
kapkovo-napoyavane-trabi
fitingi-za-praskachki
fitingi-za-klapani
vodovzemni-skobi
vodovzemni-skobi-vatreshna-rezba
plastmasovi-rezbovi-fitingi
barzi-fitingi-kompresionni-pe-pn10
adaptori-prehodi-vanshna-rezba-pn-10
adaptori-prehodi-vatreshna-rezba-pn-10
tapi-pn-10
troynitsi-pn-10
troynitsi-rezbovi-vatreshna-rezba-pn-10
reduktivni-troynitsi-pn-10
reduktivni-mufi-saediniteli-pn-10
mufi-saediniteli-pn-10
kolena-90-pn-10
kolena-vatreshna-rezba-pn-10
kolena-rezbovi-vanshna-rezba-pn-10
kolena-90-plastmasovi-rezbovi
kolyano-nipel-90-plastmasovi-rezbovi
mufa-plastmasova-vatreshna-rezba
mufa-nipel-plastmasova-vatreshna-vanshna-rezba
nipel-plastmasov-vanshna-rezba
nipel-reduktiven-plastmasov-vanshna-rezba
nipel-mufa-plastmasova-vanshna-vatreshna-rezba
mufa-reduktivna-plastmasova-vatreshna-rezba
fitingi-za-praskachki
fitingi-za-klapani
```

## Empty categories intentionally excluded

Two other published category documents had **zero product references** and were not changed:

- `electromagnetic-valves` — document `25a5e3e5-b937-4beb-882c-b6708337c81d`.
- `troynik-90-plastmasov-vatreshna-rezba` — document `90ab6b0d-7b56-4cf2-946e-129c60ab204f`.

They remain unchanged rather than receiving potentially misleading SEO copy for empty catalogue pages. Across the 54 category documents in the irrigation dataset, 52 now have the completed category SEO treatment (10 primary + 42 remaining); these two zero-product documents are the only exclusions.

## Data-integrity and publication checks

- Pre-write backup contains 42 complete published Sanity document snapshots.
- All 42 documents were read back after publication.
- All three locales have H1, Meta Title, Meta Description and 13 SEO Portable Text blocks.
- No remaining drafts were found for the 42 target IDs.
- Comparison with the exact pre-write backup found zero changes to category IDs, names, slugs, parent references, image references, sort order, `helpBlock` or BG/RU/EN `noIndex` values.
- Product records, category relationships and category images were not modified.
- Two narrow fitting categories were reviewed separately: sprinkler fittings describe flexible sprinkler connections; valve fittings describe manifolds, adapters and valve-box connections, not electrical valve-voltage selection.

## Existing Sanity schema warnings

The Sanity beta validator reports six target documents as invalid because of pre-existing root-level fields that are not declared in the currently deployed `category` schema: `seoTitle` and `seoDescription`; the irrigation root document also has a legacy `order` field. These fields were present before this operation and were preserved. No new schema fields were added. Do not remove or migrate these legacy fields without a separate approved schema/data migration and backup.

Validation is incomplete for custom callbacks (including custom slug uniqueness callbacks); the validator explicitly reports that limitation.

## Code, schema and deployment impact

- Sanity content-only update; no application code or schema changed.
- No Cloudflare Pages, D1, Resend, secrets, bindings, DNS, Header/menu/Footer or global routing changes.
- No new FAQPage JSON-LD was added; FAQ is visible editorial content.
- No Production deployment was triggered or required by these Sanity-only content changes.

## Remaining verification

1. Inspect representative live category routes in BG/RU/EN and confirm H1, title, description, canonical/hreflang and article placement below the product grid.
2. Confirm the initial HTTP HTML and rendered page separately; an ordinary browser DOM view alone does not prove the first response contains the content.
3. Monitor/request Google recrawling after route verification. Search snippets may continue to show cached metadata until Google recrawls.
