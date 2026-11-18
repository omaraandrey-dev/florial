# Homepage code cleanup — 2026-11-18

## Scope

Follow-up to the read-only homepage audit and owner approval. Code-only changes; no Sanity, Cloudflare configuration, D1, Resend, or production data writes.

## Changes

- Removed the unused homepage `siteSettings` request, state, and prop. The separate compact `headerSiteSettings` flow remains unchanged.
- Made one semantic `<main>` landmark wrap the homepage content, including the blog section. The irrigation catalogue block is now a regular `<section>`.
- Added explicit blog loading, empty, ready, and error states. Loading uses the existing localized blog-loading message; request failures no longer appear as an empty catalogue. The new error message is localized in BG/RU/EN.
- Extracted the existing featured-kit selection and plant starting-price rules into a small dependency-free helper used by the application and directly tested with Node's built-in test runner.
- Added focused tests for: exclusion of the standard 5×5 kit, placement of the six-zone kit, the three-item fallback when the six-zone kit is unavailable, cheapest available plant variant, price-range label logic, base-price fallback, no available variants, and blog states/main landmark.

## Files

- `src/App.tsx`
- `src/pages/HomePage.tsx`
- `src/components/BlogSection.tsx`
- `src/lib/homepageFeatured.mjs`
- `src/lib/i18n/bg.ts`
- `src/lib/i18n/ru.ts`
- `src/lib/i18n/en.ts`
- `tests/homepage-conversion.test.mjs`
- `tests/homepage-featured.test.mjs`

## Safety and verification

- No Sanity documents, schemas, or assets changed.
- No Header, navigation menu, Footer, route handling, checkout, D1, Resend, Cloudflare settings, or secrets changed.
- CI and deployment results are recorded against the exact PR head after GitHub Actions and Cloudflare Pages report them.
