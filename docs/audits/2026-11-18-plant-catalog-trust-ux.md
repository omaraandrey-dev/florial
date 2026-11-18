# Plant catalogue trust and variant-card UX — 18.11.2026

## Scope

Implement the owner's approved first-stage UX changes for the all-plants catalogue at `/category/rastenia`.

Included:
- A compact four-item trust strip on the plant catalogue root only: Florial garden centre, help choosing plants, plant delivery and professional planting. Labels are localized in BG/RU/EN.
- Remove the irrigation-equipment fallback description from plant cards. If a plant has no localized or base short description, the description line is omitted; irrigation cards retain their existing fallback.
- Display sale-variant height and container volume as separate compact labels on plant catalogue cards. Keep the localized variant name as the option label and use `cm` / `L` units.

Explicitly excluded:
- Visible stock-status text; the existing indicator is unchanged.
- VAT/DDS labels.
- Offer counts beside filters.
- Header, navigation, Footer, global shell, routing, SEO and Sanity content/schema changes.

## Implementation

- `src/pages/CategoryPage.tsx` contains the entire runtime change.
- Trust strip is guarded by `isPlantCatalogRoot`, using the existing root slug `rastenia` / ID `plants-root`; it does not appear on plant subcategory pages.
- Plant short descriptions no longer inherit the irrigation fallback. Irrigation behavior is unchanged.
- Variant name and sale dimensions are separated so height and pot/container volume can be scanned independently.
- No new dependencies, Sanity writes, Cloudflare configuration changes, D1 changes or Resend changes.

## Verification status

- Source inspection and diff review completed on branch `feat/plant-catalog-trust-ux`.
- CI, build, typecheck, lint, browser/mobile visual QA and Preview deployment: pending PR validation.
- No claim is made that the change has been deployed to Production.
- The connected browser service had previously exhausted its credits; live screenshots and visual browser verification are not available at this checkpoint.

## Documentation integration

The shared `CHANGELOG.md` and `docs/TECHNICAL_PASSPORT.md` entries are intentionally deferred to the integration pass after PR review, to avoid concurrent edits to shared documentation while other documentation PRs are open. This audit is the task-specific record for the implementation branch.
