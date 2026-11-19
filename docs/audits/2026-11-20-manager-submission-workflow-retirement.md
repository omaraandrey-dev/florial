# Manager plant-submission workflow retirement — 2026-11-20

## Итог

Старый D1 workflow заявок на растения выведен из пользовательского интерфейса и серверных API. Основной и единственный активный workflow — прямой каталог Sanity через PlantCatalogManager и /api/manager/plants*.

## GitHub и CI

- PR #433 merged into main.
- Merge commit: 0ec090932007d49c04f633875534af8eacbe49a6.
- Florial D1 migration validation: run 44640500780 — success.
- Blog and Studio validation: run 44640500743 — success.
- Cloudflare Preview deployment: a4153b8d-84aa-47a7-8226-04142eeb4be7 — success.
- Cloudflare Production deployment: 0e6c1a23-5322-45ef-8377-e996e55c6973 — success.

## Изменения кода

- Removed legacy routes: plant-catalog, publish-plant, notify, request-changes, enrich-plant, enrich-plant-care and the internal D1 REST compatibility shim.
- /api/manager/data now allows only authenticated self-profile reads.
- Removed active permission keys canReviewPlantSubmissions, canApprovePlantSubmission and canPublishPlant.
- Preserved direct catalog permissions: canCreatePlant, canEditPlantCard, canAddPlantVariant, canEditPlantPrice, canEditPlantStock.
- D1 migration 0016 updates staff permission triggers and removes the three old keys from existing staff profile JSON.
- The legacy D1 tables remain in the schema but are empty. The Cloudflare plant-care service binding was not modified.

## Production D1

Migrations applied:
- 0015_manager_password_reset_tokens
- 0016_remove_legacy_submission_permissions

Before deleting data, a complete D1 export was created after migration 0016:
- File: 5fbb0e47-8439-493c-821a-6945eef7d8b2-000005e4-00000002-00005128-28ca14783cd1aa5b3985aaa3b2b6dbae.sql
- Bookmark: 000005e4-00000002-00005128-28ca14783cd1aa5b3985aaa3b2b6dbae

Before cleanup:
- catalog_submissions: 15 (9 published, 3 draft, 2 submitted, 1 changes_requested)
- catalog_submission_events: 57

Deleted:
- 15 catalog_submissions
- 57 cascading catalog_submission_events

After cleanup:
- catalog_submissions: 0
- catalog_submission_events: 0
- staff profiles retained: 3
- profiles retaining any legacy submission permission keys: 0

The delete affected D1 workflow rows only. No Sanity product documents, images/assets, categories or sale variants were changed.

## Remaining manual QA

- Authenticated Owner, Manager and Seller browser acceptance of direct plant create/edit/variant/price/stock actions remains pending.
- Resend end-to-end password reset email delivery and redemption remains unverified; no test emails were sent.
