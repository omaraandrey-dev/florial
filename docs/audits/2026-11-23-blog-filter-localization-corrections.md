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
- **Automatic irrigation:** `kak-raboti-avtomatichnata-polivna-sistema`, `avtomatika-za-polivane-rain-bird-kontroleri`, `polivane-na-treva-razprskvachi-dyuzhi`, `sravnenie-rotatorni-dyuzi-rain-bird-r-van-hunter-mp-rotator`, `cena-sistema-avtomatichno-napoyavane-burgas`, `etapi-montazh-avtomatichna-polivna-instalatsiya`, `rain-bird-oborudvane`, and the multi-topic case study `podroben-landshaften-proekt-gradina`.
- **Landscape design:** `podroben-landshaften-proekt-gradina`, `maslina-sredizemnomorie`, `landshaften-dizain-proekt-zasazhdenie`, `landshaften-proekt-zima-burgas`, `landshaften-proekt-nesebar`, `etapi-landshaften-proekt-nesebar`.
- **Rolled turf:** `prodavane-traven-chim`, `kupete-travna-plosht`.
- **Planting and greenery:** `rozi-sympathy`, `nov-vnos-palmi-2025`, `maslina-sredizemnomorie`, `kiparis-totem`, and `podroben-landshaften-proekt-gradina`.
- The landscape project case study is intentionally multi-category (landscape, irrigation and planting); the olive article is intentionally multi-category (landscape and planting).
- `sistema-magluvane-terasa-besedka` is an outdoor mist-cooling system, not an irrigation/plant-watering article, so it remains in the complete publication list but is intentionally outside the four main directions.
- All 19 current slugs are explicitly marked as reviewed: known current articles use the curated editorial mapping, and the misting article is intentionally unassigned. This prevents a broad historical Sanity tag from overriding the editorial decision. New posts use existing tags as a fallback, so future content remains classifiable without a schema change.

## Implementation
- `src/pages/BlogPage.tsx`: localized introductory copy; category matching by curated slug with tag fallback for future posts; case-insensitive localized topic labels; one compact dropdown containing search, year, sort and secondary topics; no publication-type filter or badges.
- `tests/blog-portfolio-page.test.mjs`: regression coverage for localized copy, the curated article mapping, compact dropdown, removed publication type, localized topic tags and read-only Sanity behavior.

## Verification
- Exact implementation code commit `417b5403e566ef0da345ac776cff3f7789c415ac` passed Blog/Studio run `45244666135` and D1 run `45244666088`. The final PR head `ef3fe61a3b683403d2cf7315debf1a01232c4021` passed Blog/Studio runs `45245064385` and `45245088129`, plus D1 run `45245064540`; all steps succeeded, including website/Pages Functions type-check, lint, tests, website build, migration syntax and read-only dry-run, Studio type-check and Studio build.
- Cloudflare Pages Preview deployment `01588588.florial.pages.dev` succeeded from the final PR head `ef3fe61a3b683403d2cf7315debf1a01232c4021` (earlier code-only Preview: `52695a2a-dcad-4d48-93c8-818b90220961`).
- Cloudflare Browser Rendering read-only checks on the final Preview confirmed the Russian mobile and English desktop pages have their localized intro, H1, all four category labels and the compact Filters button. Both locales omit the publication-type filter; article-card topic chips are translated and the generic Project/Проект chip is absent.
- Browser Use could not run because its project had insufficient credits. Full screenshot-based desktop/mobile review and clicking through the dropdown/category filters therefore remain unconfirmed; HTML rendering alone does not verify click behavior or visual overflow.
- Production deployment `e006bf14-6b8c-4796-924e-761e40a150a6` succeeded from `main` SHA `c44e3bbd007c7ae4599dad84a540043ee0ecd2f8`; aliases `https://florial-bg.com` and `https://www.florial-bg.com` were attached. Live BG, RU and EN HTML checks confirmed localized intro/H1, all four localized categories and the compact Filters button; publication-type filter is absent.
- No Sanity writes or schema changes were made.
