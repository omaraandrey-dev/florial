# Equipment catalogue SSR v2 — audit and verification

Date: 2026-11-25

Status: implementation and automated Preview verification complete; PR #542 is open and awaiting owner visual acceptance. Production has not been changed.

## Baseline

- Base `main`: `f5aa6f899090e859e9b4be1b313ea2056cb58d6c` (after blog article SSR PR #541).
- Branch: `feat/ssr-equipment-catalog-v2`.
- PR: https://github.com/omaraandrey-dev/florial/pull/542.
- Latest PR head at audit time: `2d1739d1cffeeaec8406672369d2bf7a9a54f515`.
- Preview deployment: `fb3d28ed-60fb-43ff-be04-567ff66e9f36`, successful for the exact head above.
- Preview alias: https://feat-ssr-equipment-catalog-v.florial.pages.dev.

## Read-only Sanity Production inventory

Dataset: `production`.

- 54 published category documents with category slugs.
- 275 published active equipment products linked to the category tree.
- All 54 categories have localized `seoContent` in BG, RU and EN.
- All 54 categories have a `helpBlock`.
- Localized SEO content arrays contain varying amounts of Portable Text; observed category sizes include 13, 15 and 27 blocks.
- No category is marked `noIndex: true` in BG, RU or EN.
- Root catalogue category: `vsichko-za-polivane` (“Всичко за поливане”).

### Existing category visibility rule retained

The storefront's `App.tsx` `visibleCategories` logic keeps categories with products and their ancestors, hides empty categories, and explicitly excludes `electromagnetic-valves`.

Read-only inventory found `electromagnetic-valves` is an orphan category (`parentId` is null) with no assigned products. It still has localized SEO content and a help block. This PR preserves the existing storefront exclusion and does not change Sanity data. Whether to re-parent, archive or noindex that category remains a separate owner decision.

## Implementation

1. `functions/_lib/equipmentCategoryPageHtml.mjs` and its declaration:
   - Renders direct child category cards with localized names, category images and localized ALT text.
   - Preserves the root category's existing ten-category preferred order.
   - Uses the same populated-category/ancestor visibility rule as the React storefront.
   - Never substitutes sibling categories on leaf category pages.
   - Renders localized category Portable Text with H2/H3, paragraphs, lists, strong/emphasis and safe internal/HTTPS links.
   - Renders the existing localized help block and its configured internal service/blog CTA.

2. `functions/_middleware.ts`:
   - Adds category `seoContent` and `helpBlock` to the read-only category document projection.
   - Extends the category tree projection with parent, product count, localized names and category image metadata.
   - Keeps the existing equipment product query, product sorting, CollectionPage ItemList and 20-product initial-page cap.
   - Versions the category tree cache key to `category-tree-v4` and the category document cache namespace to `category-document-v2`.
   - Leaves plant category rendering and the interactive React catalogue intact.

3. Tests and smoke:
   - `tests/equipment-category-page-ssr.test.mjs` covers navigation, visibility, localization, Portable Text escaping and help CTAs.
   - `tests/equipment-category-server-rendering.test.mjs` retains the existing product listing/order checks.
   - `scripts/smoke-equipment-catalog-ssr.mjs` discovers all published category routes from Sanity and checks the raw first HTML response for BG/RU/EN.

## Verification evidence

- Raw HTTP smoke run `45567011939`: PASS — 162 localized category routes checked (54 categories × 3 languages); 275 linked published products discovered.
- Blog and Studio validation run `45566999975`: PASS — application/Pages type-check, lint, 530 website tests, website build, read-only migration dry-run, Studio type-check and Studio build.
- D1 migration validation run `45566999984`: PASS — validation only; no migration applied.
- Equipment SSR regression smoke run `45566999937`: PASS.
- Services directory SSR smoke run `45566999980`: PASS.
- Service detail SSR smoke run `45567000047`: PASS.
- Blog index SSR smoke run `45567000025`: PASS.
- Blog article SSR smoke run `45567000139`: PASS.
- Cloudflare Pages Preview deployment for the exact latest PR head: success.

## Safety and scope boundaries

- No Sanity documents, schemas or published content were written or changed.
- No D1 migration was applied.
- No Cloudflare Production configuration, secrets, domains or settings were changed.
- No Manager, order, payment, Resend, Header, main navigation, Footer or global architecture changes.
- Production deployment remains pending PR review and owner acceptance.
- `CHANGELOG.md`, `docs/TECHNICAL_PASSPORT.md` and `docs/AI/OPEN_QUESTIONS.md` were not edited because open PR #409 overlaps those shared documentation files. This audit is a new, task-specific record; shared documentation must be reconciled after PR #409 is resolved.

## Acceptance gate and next stage

1. Owner reviews the Preview category pages on desktop and mobile, especially the root catalogue, category navigation, SEO text and help CTA.
2. After explicit acceptance, merge PR #542 and verify the exact Production deployment plus the same all-category raw HTTP smoke against `https://florial-bg.com`.
3. A separate follow-up should address full SSR of individual irrigation equipment product detail pages (full descriptions, technical content, images and Product JSON-LD parity). That work is not included in this category-catalogue PR.
