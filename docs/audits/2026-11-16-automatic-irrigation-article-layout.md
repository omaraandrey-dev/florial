# Automatic irrigation service — article layout and internal links

**Date:** 2026-11-16  
**Repository:** `omaraandrey-dev/florial`  
**Base main:** `d3c3ad205ccc01ce2e46851eec91cc96b3e9b576`  
**Branch:** `content/automatic-irrigation-article-layout-2026-11-16`  
**Sanity:** project `bxvcy0qs`, dataset `production`  
**Document:** `04c7ab3b-1888-41cb-9917-6b9014cd1ac3`  
**Slug / route:** `avtomatichno-napoyavane` / `/services/avtomatichno-napoyavane`

## Owner-approved scope

The owner approved moving the four process photographs from the top gallery into the article under their relevant H2/H3 headings, retaining the first informational gallery image near the hero, removing three duplicate image-and-text blocks, adding contextual links to existing equipment categories, and improving paragraph readability in BG/RU/EN without rewriting, shortening or changing the meaning of the article.

## Backup and Sanity draft

- Full published-document snapshot saved before the write: `docs/backups/sanity/2026-11-16-automatic-irrigation-service-before-article-layout-update.json`.
- Snapshot was read back from Sanity Production at published revision `kG84M8L0NjpttWhMhqGtNr` and verified in this branch before the write.
- A revision-guarded patch created draft `drafts.04c7ab3b-1888-41cb-9917-6b9014cd1ac3` from that exact published revision.
- Draft validation reported `valid`, `complete=false`; custom validation callbacks were not executed. This is not a complete validation.
- Draft read-back confirmed the new localized headings and the removal of the three duplicate `contentBlocks`. Publishing is pending integration of the matching frontend renderer change.
- No gallery asset was deleted or replaced. All five gallery asset references and the hero image reference are preserved.

## Photo placement

- `img0`: the informational photo remains immediately below the hero.
- `img1`: design/zoning photo appears below the design-and-zoning H2.
- `img2`: excavation and pipe-route photo appears below the route-preparation H3.
- `img3`: sprinkler installation photo appears below the equipment-installation H3.
- `img4`: inspection/maintenance photo appears below the testing and commissioning H3.

The three former bottom image-and-text cards referenced the same process assets and repeated information already present in the article. Their document blocks were removed from the draft; the Sanity image assets and gallery references remain intact.

## Article text and localization

- BG remains Portable Text with actual H2/H3 styles and link annotations.
- RU/EN remain Markdown with H2/H3 headings and the existing supported inline markup.
- Added three H3 subheadings within the installation section in all locales: route/pipe preparation, sprinkler/equipment installation, and system testing/adjustment/commissioning.
- Long multi-sentence paragraphs were separated at sentence boundaries. Existing article wording and visible text were compared before/after (after ignoring paragraph whitespace and link syntax); the text comparison passed for BG, RU and EN. No article explanations were rewritten or removed.
- Existing bold and underline emphasis is retained. The Markdown renderer now recursively renders internal links nested within bold spans.

## Verified internal category destinations

The following published categories were confirmed in the production dataset and have active products:

- Controllers: `/category/controllers` — 23 active products.
- Sprinklers: `/category/sprinklers` — 20 active products.
- Drip irrigation: `/category/kapkovo-napoyavane` — 22 active products.

BG Portable Text uses the existing `link` annotation; RU/EN use path-only Markdown links. The service renderer localizes the paths through `localizedHref`.

## Code changes

- `src/pages/ServicePage.tsx` maps the five gallery items by stable `_key` for this service only.
- The first informational photo stays near the hero; the four process photos render at their matching H2/H3 headings.
- H3 headings now support section-image rendering for Portable Text and Markdown descriptions.
- Existing gallery rendering for other service pages remains on its prior path.
- Nested Markdown links inside bold emphasis are now rendered as links rather than literal Markdown text.

## Preserved fields and scope exclusions

Document ID, slug, active status, service category/layout, hero image, all five gallery assets, article meaning, SEO fields, hero text, advantages, steps, CTA, lead form and service route remain unchanged. No Sanity schema, product data, category data, URL, Header, menu, Footer, API, D1, Cloudflare settings/secrets, Resend or other service documents were changed.

## Verification status

- **Verified in live Sanity:** published source revision and all five gallery asset references; target categories and active product counts.
- **Verified in GitHub:** branch created from the exact main SHA above; backup file committed; frontend change committed.
- **Verified in draft:** revision-guarded patch succeeded; read-back found the new headings and no duplicate contentBlocks.
- **Schema validation:** `valid`, but incomplete because custom callbacks did not run.
- **Shared logs deferred:** `CHANGELOG.md`, `docs/TECHNICAL_PASSPORT.md` and `docs/AI/OPEN_QUESTIONS.md` are intentionally unchanged in this branch because multiple existing open PRs edit those shared files. Integrate the release record in one later documentation pass after that PR batch is reconciled.
- **Not yet confirmed:** exact-head CI/build, PR Preview browser QA, publication of the Sanity draft, Production deployment and post-deployment BG/RU/EN visual/mobile QA.
