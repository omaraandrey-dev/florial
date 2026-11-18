# Manager UX — plant catalog search controls

**Date:** 2026-11-18  
**Branch:** `feature/manager-plant-catalog-search-ux`  
**Base:** `0482860622247f2d46967ed2c3f9750c8f719615`

## Scope

- Make the existing SKU search capability explicit for Owner, Manager, and Seller in the search placeholder and accessible label. The existing API already searches `name`, `scientificName`, `sku`, and localized names for all authorized plant roles.
- Add a clear-filters action that resets the text query, category selection, and sort order to their defaults.
- Improve Bulgarian UI copy and clarify that the displayed count is the number currently shown, not the total catalog size.
- Add accessible labels to category and sort controls and keep the filter controls responsive on mobile and desktop.

## Boundaries

- UI-only change in `src/manager/PlantCatalogManager.tsx`.
- No API, query semantics, permissions, authentication, D1, Sanity data/schema, Cloudflare configuration, Resend, or public storefront changes.
- No live Manager session or catalog write was performed.
- No production deployment was initiated.

## Verification

- Source diff checked against the exact base SHA: one file changed, 6 additions and 5 deletions.
- The current API implementation already supports SKU matching for all roles; no server change was required.
- PR #383 is open. No workflow run or commit status was returned for the exact PR head at the time of this audit; CI is therefore **not verified**.
- Pages deployment and browser visual QA are not confirmed; no Production deployment was initiated.
- Visual browser QA is not claimed; Pages Preview availability is not assumed.
