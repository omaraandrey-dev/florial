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
| 4 | Ready-made irrigation kits | 12 products | **PARTIAL — 11/12 published; 10 × 5 m held for controller/valve compatibility decision** |
| 5 | Controllers | 23 active products in current Sanity read-back | **CONTENT COMPLETE FOR CURRENT 23/23**; historical 24-vs-23 inventory discrepancy remains open |
| 6 | Sprinklers | 20 active products in current Sanity read-back | **COMPLETE — 20/20 published; delivery/service section added in BG/RU/EN** |

## Completed: nozzle category

- 7 VAN products.
- 4 HE-VAN products.
- 6 MPR strip products.
- 9 R-VAN products.

All 26 are published in BG/RU/EN. Published read-back confirms 26 active products, five H2 sections and two internal links per language, and zero remaining drafts for the target IDs. The validator reported all 26 as valid; custom slug callbacks were not executed by the available validation tool.

Detailed evidence and the manufacturer source register: [Nozzle description refresh audit](../audits/2026-11-23-nozzle-product-descriptions-refresh.md).

## Ready-made irrigation kits — 11/12 published; one held

- Live published category count: 12 products.
- Complete before-write snapshot: `docs/backups/sanity-kits-current-2026-11-23-complete.json`.
- **11 products were edited and published** in BG/RU/EN. Published read-back confirmed five H2 sections, two internal links and Econt delivery wording in each locale. All 11 component arrays were compared with the snapshot and remain unchanged.
- **10 × 5 m kit is held unchanged.** Its components include ESP-BAT-BT1 and 100-HV-9V, which the two published product specifications identify as incompatible. Its short description still says WPX1 while the component list says ESP-BAT-BT1. Owner decision is required before correcting or publishing this kit.
- Detailed evidence: [kit description refresh audit](../audits/2026-11-23-irrigation-kit-descriptions-refresh.md).
- Next action in this category: resolve the 10 × 5 m controller/valve pairing; do not change `kitComponents` without owner approval.

## Controllers — current descriptions complete; inventory discrepancy remains open

- Current published Sanity read-back: **23 products** linked to the controller root category.
- The 15.11.2026 audit records 24 products. The historical audit included the RSD-BEx rain sensor; a current published lookup by SKU `RSD-BEx` returns no document. The reason for its absence is **NOT KNOWN — needs confirmation**; do not infer deletion, unpublishing or category reassignment.
- All 23 currently published controller-category products have BG `description` and RU/EN `formattedDescription`; read-back of all 23 final blocks confirms the required Econt / engineer delivery / paid installation wording in all three locales. A representative full-description read-back and all 23 closing-block read-backs were checked. No controller Sanity writes were made in this refresh pass.
- The earlier controller audit remains the technical-content record: `docs/audits/2026-11-15-irrigation-controller-product-descriptions.md`.

## Sprinklers — 20/20 published

- Current published category count: **20** products.
- Existing full descriptions were already present in BG/RU/EN. The refresh appended a localized final H2 delivery/service section and paragraph to all 20 cards; the prior description body, technical specifications, compatibility, product identity and commercial fields were left unchanged.
- Published read-back confirmed all 20 documents, the final delivery/service paragraphs in BG/RU/EN and **zero remaining target drafts**.
- Sanity validation: 20/20 reported `valid`; `complete=false` because custom validation callbacks (including custom slug uniqueness callbacks) are not executed by the available validation tool. Built-in checks ran.
- Detailed evidence and SKU/ID register: [sprinkler delivery refresh audit](../audits/2026-11-23-sprinkler-delivery-refresh.md).
- Manufacturer family references were consulted for context; this pass did not change or certify every individual technical specification. A separate line-by-line specification audit remains outside the scope of this append-only content update.

## Final close-out

After all remaining categories:

- Resolve the 10 × 5 m kit's ESP-BAT-BT1 / 100-HV-9V compatibility conflict with the owner; do not change its components without that decision.
- Run a cross-category BG/RU/EN terminology and technical-token consistency audit.
- Confirm delivery and paid installation/service wording in every product description.
- Verify all internal links against published Sanity routes.
- Reconcile category counts and confirm zero unreviewed target drafts.
- Update category audit files, this roadmap, `ROADMAP_STATUS_INDEX_2026-11-23.md`, `OPEN_QUESTIONS.md` and `CHANGELOG.md`.
- Commit and merge documentation through a reviewed PR. No runtime build or Production deployment is needed for content-only changes; if code or schema is later changed, follow the full project release protocol.
