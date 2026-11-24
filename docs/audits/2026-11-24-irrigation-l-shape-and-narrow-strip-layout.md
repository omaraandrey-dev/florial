# Irrigation assistant — L-shape orientation and narrow strip layout

Date: 2026-11-24  
Base commit: `d92d874423ca7ea0418e62a5bb9d11daccffea7d`  
Working branch: `fix/irrigation-l-shape-and-strip-nozzle-layout`

## Scope

This change addresses two owner-approved items:
1. Preserve the selected L-shape cut-out corner through geometry normalization, solver input and both customer SVG diagrams.
2. Replace the former single-model R-VAN-RCS strip rule with the directional R-VAN-LCS / R-VAN-RCS / R-VAN-SST layout for 1 m and 2 m wide rectangular strips.

No Sanity documents, schemas, Cloudflare settings, secrets, D1 tables or Production resources were changed.

## L-shape coordinate correction

The layout/pipe engine uses a Cartesian Y-up convention: `y=0` is the bottom edge, `y=width` is the top edge, and the fixed connection point `(maxX, maxY)` is top-right. The L-shape input builder previously generated its cut-out corner using Y-down semantics, while the calculated diagram reflected the polygon for SVG display. The preliminary preview did not apply the same transform.

The builder now maps each selected corner into the shared Y-up coordinate convention. Both the preliminary and calculated SVG use the same Y reflection. The inner zone labels are counter-reflected so that their text remains upright. This keeps the top-right connection point and all four cut-out corner choices consistent.

Regression coverage added for all four corners:
- top-left;
- top-right;
- bottom-left;
- bottom-right.

Tests also verify that layout heads are not placed inside the selected cut-out and that both SVG diagrams use the same transform.

## Approved narrow-strip rules

All heads are placed in one row along the lower long edge. A vertical strip rotates the row to the right long edge and starts from the lower end.

Catalogue model/SKU mapping was checked in the Rain Bird dataset and read-only against published Sanity `production` documents:
- R-VAN-LCS — A84667 — active;
- R-VAN-RCS — A84668 — active;
- R-VAN-SST — A84669 — active.

### Width 2 m

- Length ≤ 4 m: one RCS at the right/lower end, directed along the strip toward the left/upper end; planning reach approximately 4 m.
- Length > 4 m: RCS at the right/lower end and LCS at the left/upper end, facing each other.
- Length > 7 m: central SST heads at approximately 4 m spacing; each SST is bidirectional with approximately 4 m planning reach in each direction.
- 10 × 2 m regression: RCS x=10, SST x=6 and x=2, LCS x=0.

### Width 1 m

- Length ≤ 3 m: one RCS at the right/lower end; planning reach approximately 3 m.
- Length > 3 m: add the opposing LCS at the left/upper end.
- Length > 5 m: central bidirectional SST heads at approximately 3 m spacing; approximately 3 m planning reach in each direction.

The strip pattern does not claim circular sampled coverage or circular head-to-head validation. Hydraulic feasibility, actual nozzle pressure and field distribution uniformity remain unevaluated.

## Data carried through checkout

The layout stores:
- `pattern: 'strip'`;
- `performanceModel`;
- `stripWidthM`;
- `stripLengthM` (owner-defined planning reach per direction);
- `stripDirection` (`left`, `right`, `up`, `down`, or `both`);
- `stripAxis` (`horizontal` or `vertical`).

The customer diagram draws direction arrows. The cart project snapshot, Cloudflare project validator and owner PDF preserve the model and direction/axis metadata. BOM now resolves all three existing catalogue SKUs.

## Tests added or extended

- Threshold/count/position/direction cases for 1 m and 2 m widths, including lengths 3, 4, 5, 6, 7, 8, 10 and 12 m.
- Vertical strip orientation and bidirectional SST axis.
- 10 × 2 m BOM SKU counts for LCS/RCS/SST.
- Four L-shape corner positions after intake normalization and layout generation.
- Shared SVG transform regression.
- Server snapshot persistence of LCS/RCS/SST direction and axis metadata.

## Verification status

- Source-level implementation and regression tests added.
- Published Sanity catalogue records read-only verified: all three products exist and `isActive: true`.
- Blog and Studio validation workflow #2510: passed. Application/Pages Functions type-check, website lint, 442/442 tests, website build, migration-script syntax, read-only migration dry-run, Studio type-check and Studio build all passed.
- D1 migration validation workflow #2692: passed. Lint, website build, Pages Functions syntax and all configured additive migration validations passed.
- Live customer UI verification and Production deployment: not performed.
- No Sanity writes or Production changes performed.

## Documentation follow-up

The focused engineering implementation guide and balanced-zone/PDF guide were updated in this branch. The shared `CHANGELOG.md`, technical passport and AI open-questions register are intentionally left for the integration pass to avoid overwriting concurrent documentation work. They must be reconciled before merge.
