# Manager plant catalog permissions and search UX — 2026-11-18

## Scope

This increment extends PR #383. It combines the catalog search/filter UX with an explicit, simplified Seller permission rule.

## Owner decision

A Seller who has `canCreatePlant=true` receives the complete direct plant-catalog write capability:
- create a plant;
- edit an existing plant card;
- add plant variants;
- change prices;
- change stock status and quantity.

For Seller, `canCreatePlant` is the single switch. The legacy granular plant-catalog flags do not grant partial catalog-write access when `canCreatePlant=false`. No permission is implied for orders, staff management, submission review/approval, publication administration, category SEO or service leads.

Manager permissions remain separate: direct creation requires `canCreatePlant`; direct card editing requires `canEditPlantCard`. In the direct editor, changing existing variant prices additionally requires `canEditPlantPrice`, changing stock additionally requires `canEditPlantStock`, and adding a variant directly requires `canAddPlantVariant` plus price and stock permissions. The legacy submission route continues to honor its individual variant/price/stock flags. Owner retains the existing bypass.

## Implementation

- `functions/api/manager/_lib.ts`: central `hasPermission` helper derives the four Seller catalog permissions from `canCreatePlant`.
- `functions/api/manager/plants.ts`: POST create now checks `canCreatePlant`; GET remains authenticated read access.
- `functions/api/manager/plants/[id].ts`: PATCH now checks `canEditPlantCard`; Seller with `canCreatePlant` satisfies it through the shared permission helper.
- `functions/api/manager/plants/[id]/add-variant.ts`: add-variant now checks `canAddPlantVariant`.
- `functions/api/manager/plant-catalog.ts`: the legacy variant/price/stock submission and stock-update route now normalizes the staff permissions and uses the same shared permission helper for read access, approval, publication, stock, variant and price actions.
- `functions/api/manager/plant-direct-lib.ts` and `functions/api/manager/plants/[id].ts`: detect which protected variant fields actually changed; Manager updates are rejected if the matching price/stock/variant permission is missing. Seller with `canCreatePlant` passes the catalog-specific checks.
- `src/manager/PlantCatalogManager.tsx`: Manager price, stock and direct add-variant controls are disabled when their individual permissions are missing.
- `functions/api/manager/upload-image.ts`: upload requires catalog create or edit permission.
- `src/manager/PlantCatalogManager.tsx`: receives the staff permission profile; create controls appear only with create permission; existing cards open for editing only with the applicable edit permission. Users without write access retain read-only catalog browsing.
- `src/manager/ManagerApp.tsx`: Seller permission UI presents one catalog-access switch and removes separate Seller variant/price/stock actions; the catalog editor is the direct workspace for those operations.
- `tests/manager-plant-catalog-permissions.test.mjs`: covers Seller implication, Seller denial without the switch, independent Manager flags, Owner bypass, and detection of Manager variant/price/stock changes.

The existing all-role botanical AI availability is unchanged; AI output does not bypass the protected create/update endpoints.

## Safety boundaries

- No D1 schema or profile records changed.
- No Sanity documents/assets were written by this work.
- No Cloudflare Production settings/secrets, Resend, public storefront, Header, menu or Footer changed.
- No Production deployment or live authenticated role test is claimed.
- The existing Manager permission model and non-catalog permissions were not intentionally expanded.

## Validation status

Runtime/test commit `9a95a7573d2ef9043df77aa2eae3adf0994f6b67` passed exact-head GitHub Actions:
- Blog and Studio validation run `44210343032`: application/Pages Functions typecheck, lint, website utility tests, website build, migration syntax/read-only dry-run, Studio typecheck and Studio build — all success.
- D1 migration validation run `44210343225`: lint, website build, Pages Functions syntax and additive migration validations — all success.
- Browser role-matrix QA and authenticated live Seller/Manager sessions remain unverified. PR #383 remains open and unmerged; no Production deployment is claimed.
Subsequent documentation-only synchronization does not change runtime/test code.
