# Manager plant image upload and Gemini progress UX — 2026-11-19

## Scope
Improve the direct plant catalog editor for staff without changing catalog records or the surrounding Manager shell.

## Changes
- Recommend 1600 × 1600 px images up to 500 KB.
- Reject any uploaded image larger than 1.5 MB in the browser and server; publication payload validation uses the same limit.
- Keep JPEG, PNG and WebP with server-side signature validation.
- Empty gallery guidance directs staff to upload a prepared image or select from the image library.
- Remove the Gemini model banner, long explanatory copy, raw streamed response, request ID and technical progress/heartbeat details.
- During a request show only a spinner, elapsed time and count of non-empty streamed text lines. Keep the final structured result and review/apply workflow.

## Files
- `src/manager/PlantCatalogManager.tsx`
- `functions/api/manager/upload-image.ts`
- `functions/api/manager/publish-plant.ts`
- `tests/manager-plant-image-size.test.mjs`
- `docs/FLORIAL_MANAGER_ARCHITECTURE.md`

## Validation and deployment
Pending CI and PR review. No Sanity documents/schema, D1 data/schema, Cloudflare settings/secrets or Production deployment were changed by this implementation.
