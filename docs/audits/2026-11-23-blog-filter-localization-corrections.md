# Blog and portfolio filter and localization corrections — 2026-11-23

## Scope
- Address owner feedback after the first Production release of `/blog`.
- Keep the introductory copy, category descriptions, page controls, topic labels and card topic labels localized in BG/RU/EN.
- Collapse search, year, sort and secondary topic controls into one dropdown button.
- Remove publication-type filter and publication-type badges from article cards.
- Correct the four main category assignments using editorial review of all currently published articles, not only the Sanity tag values.

## Read-only content evidence
- Sanity project: `bxvcy0qs`; dataset: `production`; perspective: `published`.
- Published `blogPost` count: 19.
- Read-only GROQ confirmed all 19 records have Russian and English titles and short descriptions.
- Some records have no tags, and some tags are too broad to reliably determine the editorial topic. The original UI filtered category cards only by exact tag equality; this omitted irrigation articles with no tags and made broad `Озеленяване` tags over-inclusive.
- No Sanity document, tag, schema, dataset or asset was written.

## Editorial category mapping in the frontend
- **Automatic irrigation:** `kak-raboti-avtomatichnata-polivna-sistema`, `avtomatika-za-polivane-rain-bird-kontroleri`, `polivane-na-treva-razprskvachi-dyuzhi`, `sravnenie-rotatorni-dyuzi-rain-bird-r-van-hunter-mp-rotator`, `cena-sistema-avtomatichno-napoyavane-burgas`, `sistema-magluvane-terasa-besedka`, `etapi-montazh-avtomatichna-polivna-instalatsiya`, `rain-bird-oborudvane`, and the multi-topic case study `podroben-landshaften-proekt-gradina`.
- **Landscape design:** `podroben-landshaften-proekt-gradina`, `maslina-sredizemnomorie`, `landshaften-dizain-proekt-zasazhdenie`, `landshaften-proekt-zima-burgas`, `landshaften-proekt-nesebar`, `etapi-landshaften-proekt-nesebar`.
- **Rolled turf:** `prodavane-traven-chim`, `kupete-travna-plosht`.
- **Planting and greenery:** `rozi-sympathy`, `nov-vnos-palmi-2025`, `maslina-sredizemnomorie`, `kiparis-totem`, and `podroben-landshaften-proekt-gradina`.
- The landscape project case study is intentionally multi-category (landscape, irrigation and planting); the olive article is intentionally multi-category (landscape and planting).
- `sistema-magluvane-terasa-besedka` is an outdoor mist-cooling system, not an irrigation/plant-watering article, so it remains in the complete publication list but is intentionally outside the four main directions.
- All 19 current slugs are explicitly marked as reviewed: known current articles use the curated editorial mapping, and the misting article is intentionally unassigned. This prevents a broad historical Sanity tag from overriding the editorial decision. New posts use existing tags as a fallback. New posts continue to use existing tags as a fallback, so future content remains classifiable without a schema change.

## Implementation
- `src/pages/BlogPage.tsx`: localized introductory copy; category matching by curated slug with tag fallback for future posts; case-insensitive localized topic labels; one compact dropdown containing search, year, sort and secondary topics; no publication-type filter or badges.
- `tests/blog-portfolio-page.test.mjs`: regression coverage for localized copy, the curated article mapping, compact dropdown, removed publication type, localized topic tags and read-only Sanity behavior.

## Verification
- Pending exact-head CI and Production release.
- Full desktop/mobile visual QA and interactive filter testing must be completed after Preview/Production availability.
- This change intentionally does not write to Sanity or change its schema.
