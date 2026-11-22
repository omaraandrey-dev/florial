# Plant product page UX implementation

Date: 2026-11-22  
Base: `main` at `dc971872b3672d41566565800524add90214bba2`  
Branch: `feat/plant-product-page-ux`

## Scope implemented

- Reworked the plant purchase panel hierarchy and visual emphasis while retaining the existing product/variant selection, price, VAT, stock, quantity, WhatsApp and cart behavior.
- Added compact plant badges only for confirmed foliage and Black Sea coast suitability values; `needsVerification` is not presented as a suitability verdict.
- Moved the short description directly under the plant title and scientific name.
- Consolidated sale height/container/SKU information into the purchase panel and removed the duplicate lower sale-option section.
- Split botanical information into key characteristics and growing conditions while preserving the existing field values and color semantics.
- Made the care guide collapsible without changing its Portable Text rendering.
- Added a mobile-only sticky add-to-cart bar that appears after the original purchase controls leave view; it uses the selected variant price and the same out-of-stock/price/variant guards as the original action.
- Preserved equipment ProductPage rendering paths, SEO/JSON-LD, Sanity projections, cart callback contract and localized BG/RU/EN labels.

## Safety and boundaries

- No Sanity documents/schemas, D1, Cloudflare configuration/secrets, Resend, orders, Header, navigation, Footer or Production data are changed.
- No new product or botanical facts are generated. Suitability badges require an explicit existing `suitable` or `notSuitable` value.
- Production release and authenticated visual QA are not part of this branch; Preview and CI evidence must be recorded separately after they run.

## Verification

- Source-level regression tests added in `tests/plant-product-page-ux.test.mjs`.
- Pending: exact-branch CI, Preview deployment and manual desktop/mobile visual QA for BG/RU/EN, including variant switching, onRequest/outOfStock, missing price, no sale variants and long names.
