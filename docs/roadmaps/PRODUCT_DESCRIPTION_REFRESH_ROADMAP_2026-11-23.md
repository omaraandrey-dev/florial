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
| 4 | Ready-made irrigation kits | 12 products | **COMPLETE — 12/12 published; 10 × 5 m compatibility condition confirmed by owner** |
| 5 | Controllers | 23 active products in current Sanity read-back | NOT STARTED — reconcile count before editing |
| 6 | Sprinklers | 20 products | **COMPLETE — 20/20 published** |

## Completed: nozzle category

- 7 VAN products.
- 4 HE-VAN products.
- 6 MPR strip products.
- 9 R-VAN products.

All 26 are published in BG/RU/EN. Published read-back confirms 26 active products, five H2 sections and two internal links per language, and zero remaining drafts for the target IDs. The validator reported all 26 as valid; custom slug callbacks were not executed by the available validation tool.

Detailed evidence and the manufacturer source register: [Nozzle description refresh audit](../audits/2026-11-23-nozzle-product-descriptions-refresh.md).

## Ready-made irrigation kits — COMPLETE, 12/12 published

- Live published category count: 12 products.
- Complete before-write kit snapshot: `docs/backups/sanity-kits-current-2026-11-23-complete.json`.
- All 12 products are now published. The 10 × 5 m kit was initially held and was subsequently corrected after the owner confirmed the newer 100-HV-9V production version is compatible with ESP-BAT-BT1 from 01.01.2026, with a suitable 9 V DC latching solenoid.
- The 10 × 5 m kit now identifies ESP-BAT-BT1 consistently in BG/RU/EN; WPX1 was removed from its short description and SEO text. Its component list, quantities, prices and SKU were not changed.
- The separate H01040 valve and ESP-BAT-BT1 controller cards were synchronized in BG/RU/EN. Full descriptions and corresponding compatibility specification values now distinguish 100-HV-9V versions manufactured from 01.01.2026 from earlier versions.
- Before-write snapshot for the valve/controller compatibility copy: `docs/backups/sanity/2026-11-23-esp-bat-bt1-and-100-hv-9v-before-compatibility-copy.json`.
- Detailed evidence: [kit refresh audit](../audits/2026-11-23-irrigation-kit-descriptions-refresh.md) and [compatibility copy follow-up](../audits/2026-11-23-esp-bat-bt1-100-hv-9v-compatibility-copy.md).

## Controllers — count reconciliation required

- Current Sanity read-back: 23 active published products linked to the controller root category.
- Existing audit `docs/audits/2026-11-15-irrigation-controller-product-descriptions.md` states 24 products.
- Current count without the `isActive` filter is also 23. The one-product difference is unresolved and must be reconciled by comparing the exact IDs/SKUs in the previous audit with the current category tree before editing.
- After reconciliation, audit model variants, station count, power source, battery type, programs, Wi-Fi/Bluetooth, valve/solenoid compatibility and IP rating. Do not infer values from family-level marketing copy.

## Sprinklers — COMPLETE, 20/20 published

- The published category contained 20 active products. Full BG descriptions and RU/EN formatted descriptions already existed; existing text, headings, internal links and technical details were preserved.
- Appended the required localized final section to all 20 products: Econt delivery throughout Bulgaria; optional engineer delivery to a site in Nessebar / the Burgas area; installation, setup and repair for an additional fee.
- Published read-back confirmed 20/20 products and the final delivery/service paragraph in BG/RU/EN. Target draft count: 0.
- Sanity validation: 20 reported valid; custom validation callbacks (including slug uniqueness callbacks) were not executed by the available validator.
- No specifications, compatibility values, short descriptions, SKUs, names, prices, stock, images, categories, SEO fields, schema, code or Production infrastructure changed. No Sanity snapshot was created for this assignment, per the owner's explicit instruction.
- Detailed evidence: [sprinkler delivery refresh audit](../audits/2026-11-23-sprinkler-delivery-refresh.md).

## Final close-out

After all remaining categories:

- Run a cross-category BG/RU/EN terminology and technical-token consistency audit.
- Confirm delivery and paid installation/service wording in every product description.
- Verify all internal links against published Sanity routes.
- Reconcile category counts and confirm zero unreviewed target drafts.
- Update category audit files, this roadmap, `ROADMAP_STATUS_INDEX_2026-11-23.md`, `OPEN_QUESTIONS.md` and `CHANGELOG.md`.
- Commit and merge documentation through a reviewed PR. No runtime build or Production deployment is needed for content-only changes; if code or schema is later changed, follow the full project release protocol.
