# Plant catalogue trust and variant-card UX — 18.11.2026

## Scope

Completed the owner's approved first-stage UX changes for the all-plants catalogue at `/category/rastenia`.

Included:
- A compact four-item trust strip on the plant catalogue root only: Florial garden centre, help choosing plants, plant delivery and professional planting. Labels are localized in BG/RU/EN.
- Remove the irrigation-equipment fallback description from plant cards. If a plant has no localized or base short description, the description line is omitted; irrigation cards retain their existing fallback.
- Display sale-variant height and container volume as separate compact labels on plant catalogue cards. Keep the localized variant name as the option label and use `cm` / `L` units.

Explicitly excluded:
- Visible stock-status text; the existing indicator is unchanged.
- VAT/DDS labels.
- Offer counts beside filters.
- Header, navigation, Footer, global shell, routing, SEO and Sanity content/schema changes.

## Implementation and merge

- Runtime change is limited to `src/pages/CategoryPage.tsx`.
- Trust strip is guarded by `isPlantCatalogRoot`, using the existing root slug `rastenia` / ID `plants-root`; it does not appear on plant subcategory pages.
- Plant short descriptions no longer inherit the irrigation fallback. Irrigation behavior is unchanged.
- Variant name and sale dimensions are separated so height and pot/container volume can be scanned independently.
- No new dependencies, Sanity writes, Cloudflare configuration changes, D1 changes or Resend changes.
- Implementation PR: [#394](https://github.com/omaraandrey-dev/florial/pull/394), squash-merged into `main`.
- Merge commit: `b240e72f5fbe5d7778205b004e478be68a29f87e`.
- Original implementation head: `287ba1fb346b70cb73b96f34c382c7e80dae47db`.

## Verification

- GitHub Actions for the exact implementation head passed:
  - Blog and Studio validation: run `44290045413` — success, including website and Studio typechecks/builds, website lint and utility tests.
  - D1 migration validation: run `44290045424` — success.
- Cloudflare Pages Preview deployment for the implementation head succeeded:
  - Deployment ID: `322c33ee-d962-41ff-8122-8c26b2178f1e`.
  - Preview URL: https://322c33ee.florial.pages.dev/category/rastenia
- Browser/mobile screenshot QA was not completed: the connected browser service had exhausted its credits and direct page inspection was unavailable. The owner reviewed the result and confirmed the page is satisfactory.
- The merge commit's post-merge CI and Production deployment were not confirmed in this audit. Do not infer Production publication from the successful Preview deployment.
- No live Sanity, D1, Resend or Cloudflare configuration/data writes were performed.

## Completion

The owner confirmed the page is satisfactory and asked to close this task. No further UX changes to this page are planned at this stage.
