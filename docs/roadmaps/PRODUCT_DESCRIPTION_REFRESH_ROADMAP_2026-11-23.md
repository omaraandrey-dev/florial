# Florial — product description refresh roadmap

**Status snapshot:** 23.11.2026  
**Purpose:** controlled editorial refresh of irrigation equipment product descriptions in Sanity Production for the Bulgarian market, with RU and EN localization.

## Working rules

1. Process one product family/category at a time.
2. Read the live published documents and reconcile existing drafts before editing.
3. Save a complete Sanity snapshot to GitHub before each write batch.
4. Check every model against current manufacturer documentation; preserve SKU/model identifiers and exact technical values.
5. Update Bulgarian `description`, Russian/English `formattedDescription`, and all three short descriptions. Change specification values only where the audit establishes a confirmed correction.
6. Validate, publish, and read back the published documents. Confirm that no target drafts remain.
7. Record the result in the category audit, this roadmap, the cross-roadmap status index and CHANGELOG.

The owner approved this separate editorial refresh workflow. This approval does not authorize changes to SEO metadata, prices, stock, product identity, images, categories, schema, application code or Production infrastructure.

## Category status

| Order | Category | Current scope | Status |
|---|---|---:|---|
| 1 | Solenoid valves | 17 products | **COMPLETE — 17/17 published** |
| 2 | Valve boxes, hydrants and keys | 7 products | **COMPLETE — 7/7 published** |
| 3 | Spray and rotary nozzles | 26 products | **COMPLETE — 26/26 published** |
| 4 | Ready-made irrigation kits | 12 products | NEXT — audit, backup and publish |
| 5 | Controllers | 23 active products in current Sanity read-back | NOT STARTED — reconcile count before editing |
| 6 | Sprinklers | 20 active products in current Sanity read-back | NOT STARTED |

## Completed: nozzle category

- 7 VAN products.
- 4 HE-VAN products.
- 6 MPR strip products.
- 9 R-VAN products.

All 26 are published in BG/RU/EN. Published read-back confirms 26 active products, five H2 sections and two internal links per language, and zero remaining drafts for the target IDs. The validator reported all 26 as valid; custom slug callbacks were not executed by the available validation tool.

Detailed evidence and the manufacturer source register: [Nozzle description refresh audit](../audits/2026-11-23-nozzle-product-descriptions-refresh.md).

## Next: ready-made irrigation kits

- Live published category count: 12 products.
- Existing backup branch: `backup/sanity-kits-current-2026-11-23`; the first 10 products were snapshotted.
- Before any write, add the remaining two products to a fresh backup and re-read all 12 published records.
- Audit kit composition, component quantities (including decimal quantities), pipe lengths, controller/automation options, water source assumptions and exact SKU/price references.
- Recheck the owner's previously agreed 10 × 5 m kit/controller pairing: Rain Bird ESP-BAT-BT. Do not alter kit composition without source evidence or owner confirmation.
- Prepare BG/RU/EN descriptions, publish and read back all 12.

## Controllers — count reconciliation required

- Current Sanity read-back: 23 active published products linked to the controller root category.
- Existing audit `docs/audits/2026-11-15-irrigation-controller-product-descriptions.md` states 24 products.
- Current count without the `isActive` filter is also 23. The one-product difference is unresolved and must be reconciled by comparing the exact IDs/SKUs in the previous audit with the current category tree before editing.
- After reconciliation, audit model variants, station count, power source, battery type, programs, Wi-Fi/Bluetooth, valve/solenoid compatibility and IP rating. Do not infer values from family-level marketing copy.

## Sprinklers

- Current active published count: 20 products.
- Audit each model's radius, arc, pressure, flow, trajectory, nozzle/body compatibility and connection type against manufacturer performance data.
- Do not use a single generic description where models have different performance tables.

## Final close-out

After all remaining categories:

- Run a cross-category BG/RU/EN terminology and technical-token consistency audit.
- Confirm delivery and paid installation/service wording in every product description.
- Verify all internal links against published Sanity routes.
- Reconcile category counts and confirm zero unreviewed target drafts.
- Update category audit files, this roadmap, `ROADMAP_STATUS_INDEX_2026-11-23.md`, `OPEN_QUESTIONS.md` and `CHANGELOG.md`.
- Commit and merge documentation through a reviewed PR. No runtime build or Production deployment is needed for content-only changes; if code or schema is later changed, follow the full project release protocol.
