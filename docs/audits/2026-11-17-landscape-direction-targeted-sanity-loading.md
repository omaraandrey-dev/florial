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

## Validation results

- Regression coverage is in `tests/content-route-performance.test.mjs`.
- PR #359 head `c7de8fd2410e26ff6125d02730519fea3a5480e9`: Blog/Studio validation run `44020688656` and D1 validation run `44020688641` both completed successfully. Type-check, lint, website tests/build, Studio type-check/build and D1 migration validation passed.
- Preview deployment `c785f735-1f6c-454b-b2fb-df5d90792fcd` succeeded for the exact PR head. Read-only mobile browser checks at 390 × 844:
  - BG: HTTP 200, localized H1, 389 px hero image, service heading and portfolio links rendered; no visible role=alert errors.
  - RU: HTTP 200, localized H1, 389 px hero image, service heading and portfolio rendered; one selected-direction query used the `ru` projection; no visible role=alert errors.
- Production merge commit: `548765ccef2611978eb1bf9186bb24749d21abda`. Cloudflare Pages Production deployment `72b5ca91-7ea5-427b-a170-af3054472581` succeeded for this exact SHA and assigned `https://florial-bg.com` and `https://www.florial-bg.com`.
- Post-deploy read-only mobile browser check on Production EN: HTTP 200, localized H1, hero image 389 × 389, localized service heading and the five portfolio article links rendered; the targeted direction query used the `en` projection; no visible role=alert errors.
- Browser network capture shows exactly one selected `serviceDirection` query for the landscape architect route. The prior route-level full service list, four-role-photo query and all-directions query are not issued on this route. The browser still makes other global/header/category/blog Sanity requests; total Sanity request count is not a route-only metric.
- Matched post-release Lighthouse runs have **not** been performed. Do not claim an LCP or Performance-score improvement yet; collect comparable mobile/desktop PSI runs after the owner checks Production.
- Main-push validation on merge SHA `548765ccef2611978eb1bf9186bb24749d21abda`: Blog/Studio run `44020955836` and D1 run `44020955802` both completed successfully. Cloudflare Pages Production check also succeeded.

## Safety

- No Sanity writes or schema changes. No D1 or Resend writes. No secrets, bindings, DNS or Cloudflare settings changes.
- Header, menu, Footer, global route model and other service-direction loaders were not changed.
