# Florial — SEO fallback image dimensions and CLS follow-up (09.11.2026)

## Runtime release
- Main commit: `9bd5d3fb268d7dec9c3dab330e8039987ec78718`.
- Production deployment: `88fd47db-3990-4447-813e-be6b12a42028`, status `success`, aliases `florial-bg.com` and `www.florial-bg.com`.
- Changed files: `functions/_middleware.ts`; added `functions/lib/sanityImageDimensions.ts`; added `tests/sanity-image-dimensions.test.mjs`.
- The helper parses original Sanity CDN dimensions from filenames and returns width/height attributes only for HTTPS `cdn.sanity.io/images/` URLs with positive safe-integer dimensions.
- Test coverage includes square, landscape and portrait assets, query parameters, non-Sanity URLs, missing dimensions and zero dimensions.

## CI
GitHub Actions run `42635382574` completed successfully. Steps: dependency installation, lint, website build and Pages Functions syntax check. This push-triggered workflow does not run `npm test`; unit test execution is pending PR validation.

## What remains unverified
- Previous mobile category CLS median before this release: `0.3441` (runs `0.0002`, `0.3441`, `0.3441`).
- No controlled post-release CLS run was completed. Do not claim the residual is fixed.
- A live scrape returned HTTP 200 but exposed the hydrated React loading shell rather than the pre-JavaScript response; it did not confirm the actual initial fallback image tag or its attributes.
- Desktop CLS, Lighthouse and INP have not been measured.

## Source observations
- The mobile CategoryPage hides its category hero image below the desktop breakpoint. Subcategory thumbnails and product-card images use fixed-size containers.
- The separate SEO fallback is generated in `functions/_middleware.ts` by `documentBody`.
- `renderRoot` injects that fallback into the root element; `src/main.tsx` mounts the SPA with `createRoot`. The client mount replaces existing root markup. This is a plausible early transition contributing to layout shift, but causality is not proven without a CDP trace.
- The next diagnosis must capture every layout-shift entry and source node, including previous/current rectangles, on a cold load. Then repeat mobile 3-run measurements and add a desktop profile.

## Scope
No Sanity data/schema, D1 data/migrations, Manager, orders, checkout, API contracts, Header, menu, Footer component or Cloudflare settings/secrets were changed by the runtime commit.
