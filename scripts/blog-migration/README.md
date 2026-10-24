# Florial blog migration

## Current source inventory
- Source: https://www.drop.od.ua/bg/blog
- Unique Bulgarian article pages found: 5.
- Some pages also link to RU/EN variants; these were deduplicated as language variants.
- Some category-only posts were discovered beyond the main listing. One turf page currently returns 404 and several language variants are English/Russian despite /bg/ paths.
- The image counts below are source-page image candidates, including inline photos; these are not yet deduplicated by underlying Wix asset ID.

## Files
- `source-inventory.json`: source URL, observed title, original cover URL, image candidate count and unresolved metadata.
- `prepared-posts.json`: intentionally starts as an empty array. Populate only after full article extraction, review of all price references, and BG/RU/EN translation.
- `import-blog-posts.mjs`: validation-first, idempotent import script. Default execution is a dry run; it never writes unless `--write` is passed. Production requires `--confirm-production-write`. Existing documents are skipped unless `--overwrite-existing` is explicitly supplied.

## Safe workflow
1. Complete article extraction, date verification, image download/alt review, and price/contact replacement report.
2. Populate `prepared-posts.json` with Portable Text blocks and Sanity image asset references.
3. Run `node scripts/blog-migration/import-blog-posts.mjs` for validation only.
4. Only after explicit owner approval, configure `SANITY_API_TOKEN` in the local shell (never in a committed file) and run the import with the production confirmation flag.
5. Documents are imported with `isPublished: false`; publication is a separate manual action in Sanity Studio.

No Sanity production documents/assets were written by creating these files.
