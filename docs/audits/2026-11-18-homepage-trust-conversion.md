# Homepage trust and conversion refresh — 2026-11-18

## Scope
Homepage-only storefront UX changes. Header, primary navigation, Footer, global shell, routing architecture, checkout, D1, Resend, Cloudflare settings and Sanity content/schema are not changed.

## Implemented
- Two direct hero CTAs route plant shoppers to `/category/rastenia` and irrigation shoppers to `/category/vsichko-za-polivane`; the About link remains secondary.
- A compact trust strip presents the existing 25+ years claim, product range, Nessebar-area service and design/installation offering.
- Service cards show localized Sanity `shortDescription` values, with concise localized category fallbacks when a description is absent.
- A responsive four-card featured-plants section reads only active, published plant documents explicitly marked `isFeatured == true` from the plants dataset. It uses real product images, localized names, the minimum price among non-out-of-stock variants, a VAT label only when the product record confirms VAT inclusion, and existing variant-derived stock status. Out-of-stock products are not displayed.

## Live Sanity read-only finding
On 2026-11-18, the published plants dataset query returned zero documents with `isFeatured == true`. The section therefore intentionally remains hidden until products are marked as featured in the existing plant catalogue. A read-only sample query confirmed that root product prices can differ from sale-variant prices; the homepage card prioritizes the lowest valid sale-variant price and never substitutes the root price when variants exist.

No Sanity documents or assets were written. No schema deployment was performed.

## Validation
- Automated regression tests added for CTA destinations, trust claims, localized service summaries, featured-only Sanity query and locale coverage.
- Build/lint/typecheck/CI and visual Preview verification are pending the exact PR head.
- No Production deployment or live visual browser verification is claimed.

## Files
- `src/pages/HomePage.tsx`
- `src/App.tsx`
- `src/lib/i18n/bg.ts`
- `src/lib/i18n/ru.ts`
- `src/lib/i18n/en.ts`
- `tests/homepage-conversion.test.mjs`
- This audit file.

 
## Owner feedback follow-up — 2026-11-18

- Hero shopping CTAs now include the published category images: plants root category `plants-root` (slug `rastenia`) and ready-made irrigation kits category `gotovi-komplekti-za-polivane`. The secondary About link is visually stronger, larger and keyboard-focus visible.
- The trust strip remains unchanged. The mobile services header now keeps the small activity label and the All services link on one row, with the main heading below.
- Added a compact equipment recommendation section after irrigation categories. It reads up to four active products from the existing published ready-made kits category, ordered by ascending price, with product image, localized name, published price, VAT label only when `vatIncluded == true`, and stock status. The live Sanity read-only query returned 12 products in that category. No `isFeatured` field or new Sanity data was added.
- Blog homepage ordering now pins the existing published landscape-project article first and the existing automatic-irrigation pricing article second; the third card is the newest published article excluding those two. No blog documents or fields are changed.
- Live Sanity read-only references: plants root category `plants-root`, slug `rastenia`, image asset URL `https://cdn.sanity.io/images/bxvcy0qs/plants/611be152eca54582ad91030b2d86b2c180369796-1200x896.jpg`; irrigation kit category ID `6709cd41-18c6-4c5f-bc27-90d55d685dec`, slug `gotovi-komplekti-za-polivane`, image asset URL `https://cdn.sanity.io/images/bxvcy0qs/production/e747c2b0726c96c773ed663b795edd6bbe86663f-1000x918.png`.
- Pinned blog slugs: `podroben-landshaften-proekt-gradina` and `cena-sistema-avtomatichno-napoyavane-burgas`. The third card remains dynamic.
- No Sanity documents, assets or schema were written. No Header, primary navigation, Footer, routing architecture, D1, Resend, Cloudflare configuration, secrets or Production deployment changes.
- Exact code/test head before this audit close-out: `94f71f3293759cfbbd16efc20b43000ebfd32f01`. Blog and Studio validation run `44234482013` passed: application/Pages Functions typecheck, lint, `npm test`, website build, migration checks, Studio typecheck and Studio build. D1 validation run `44234481949` passed.
- Cloudflare Pages Preview deployment `05cdea4f-4e5e-43e5-9e82-c1cc5ed9ed39` succeeded for the same code/test head. Preview alias: `https://feat-homepage-trust-conversi.florial.pages.dev`.
- Automated checks passed. Independent screenshot/browser visual QA has not been completed; owner review of the Preview remains the visual acceptance step.
- Shared CHANGELOG, Technical Passport and OPEN_QUESTIONS updates are deferred to the coordinated documentation integration pass because several other open PRs still modify those shared files.
