# Irrigation equipment product page UX implementation

Date: 2026-11-22  
Base: `main` at `95b0c2cf5e5f54f5970ad2d62556a0075bc93b9b`  
Branch: `feat/equipment-product-page-ux`

## Implemented scope

- Show the existing localized short description for equipment directly under the product title.
- Give the purchase area a clear, softly tinted price panel, retaining the existing EUR price, discount and VAT wording.
- Repeat the existing stock state beside the purchase information so it is visible even when the product image is missing; retain the existing image badge.
- Highlight up to three already-entered localized specifications in the purchase panel and retain the complete technical specification list below.
- Restyle the complete specification list for easier scanning without inventing categories or data not present in Sanity.
- Present compatibility values as clear informational tags and visually distinguish manufacturer documents in a single section, including both legacy PDF fields and the documents array.
- Add an equipment mobile sticky purchase bar that appears only when the original quantity/cart controls leave the viewport. It uses the existing cart callback and current product price.
- Keep the plant-specific purchase, care, variant and WhatsApp behavior intact.

## Safety boundaries

- UI-only change. No Sanity documents/schemas, D1, Cloudflare configuration/secrets, Resend, order data, Header, navigation, Footer or Production data changed.
- No product facts, stock quantities, compatibility claims or specification groups are generated.
- The first three existing specifications are highlighted as supplied; no semantic classification is inferred from field names.
- SEO, JSON-LD, product projections and cart callback contracts are not intentionally changed.

## Verification

- Source-level regression tests: `tests/equipment-product-page-ux.test.mjs`.
- Exact-branch CI, Pages Preview and visual QA are pending until workflows run.
- Manual acceptance should cover desktop/mobile and BG/RU/EN, image present/missing, each stock status, discounts, long descriptions/specification values and sticky bar visibility/safe-area spacing.
- Shared documentation files `CHANGELOG.md`, `docs/TECHNICAL_PASSPORT.md` and `docs/AI/OPEN_QUESTIONS.md` are not changed in this branch because another open documentation PR (#409) is already modifying them. Add the release record after that documentation PR is resolved and the branch is synchronized with current main.
