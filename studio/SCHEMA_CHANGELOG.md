# Sanity schema changelog

## 2026-10-21 — Initial version-controlled Studio source

- Added `studio/sanity.config.ts` with two workspaces pointing to the existing Sanity project `bxvcy0qs`: `production` for irrigation products/services/content and `plants` for the plant catalogue.
- Added `studio/schemaTypes/index.ts` to centralize schema definitions in GitHub.
- Added the six service fields that were reported as unknown in Studio documents: `advantages`, `callToAction`, `hero`, `leadForm`, `steps`, `translations`.
- Changed the service `slug` field in the source schema to plain `string`, without auto-generation or slug validation, as requested.
- Included irrigation products, brands, categories, pages, photos/media, site settings, SEO, and plant categories/products.
- Matched the deployed `productSpec` field names (`name`, `value`) to avoid changing the existing data shape.

### Not yet done

- No schema was deployed to Sanity in this change.
- No documents or dataset contents were changed.
- The existing deployed Studio apps were not replaced, deleted, or redeployed.
- Existing service slug values may still be stored as Sanity slug objects. Converting the schema field to string requires a reviewed migration/compatibility plan; a schema definition alone does not convert stored document values.
- A local Studio build has not been run in this environment. Build and inspect this source before deploying it to the intended existing Studio.
