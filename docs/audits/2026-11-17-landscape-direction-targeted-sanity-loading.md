# Landscape architect route — targeted Sanity loading

Date: 2026-11-17

## Scope

Reduce the Sanity data dependency for `/services/category/landshaften-arhitekt` without changing the shared Header, navigation, Footer, route model, published Sanity content, schemas, Cloudflare configuration or other service-direction loading.

## Implementation

- The landscape architect route now performs one Sanity CDN query for its selected `serviceDirection` document, the matching role photo, and active services in the `landscaping` category.
- Only the active locale projection is requested for direction copy and service names/short descriptions.
- The existing full service-directory and multi-direction queries remain in place for `/services` and the other service-direction routes.
- The existing `ServiceDirectionPage` props and reserved layout placeholders are preserved.
- The portfolio's separate published-blog query remains unchanged and is not part of this optimization.

## Validation status

- Source-level regression test added to `tests/content-route-performance.test.mjs`.
- CI, build, Preview deployment, browser smoke and matched Lighthouse runs must be checked against the exact PR head before merge/release claims.
- No Sanity writes or schema changes. No D1, Resend, secrets, bindings, DNS or Cloudflare settings changes.
