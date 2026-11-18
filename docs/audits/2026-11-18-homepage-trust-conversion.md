# Homepage trust and conversion refresh — 2026-11-18

## Scope
Homepage-only storefront UX changes. Header, primary navigation, Footer, global shell, routing architecture, checkout, D1, Resend, Cloudflare settings and Sanity content/schema are not changed.

## Implemented
- Two direct hero CTAs route plant shoppers to `/category/rastenia` and irrigation shoppers to `/category/vsichko-za-polivane`; the About link remains secondary.
- A compact trust strip presents the existing 25+ years claim, product range, Nessebar-area service and design/installation offering.
- Service cards show localized Sanity `shortDescription` values, with concise localized category fallbacks when a description is absent.
- A responsive four-card featured-plants section reads only active, published plant documents explicitly marked `isFeatured == true` from the plants dataset. It uses real product images, localized names, variant-aware minimum prices and existing variant-derived stock status. Out-of-stock products are not displayed.

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
