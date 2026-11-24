# Rain Bird 3504-PC geometric layout integration

**Status:** bounded implementation in PR #527; not merged and not enabled in Production.  
**Owner-approved scope:** geometric planning and preliminary layout only. This document does not approve hydraulic design, nozzle selection, precipitation matching or a final bill of materials.

## 1. Approved Florial planning rules

The 3504-PC layout module uses the following owner-approved geometric planning values:

- Planning radii: 10 m, 9 m and 8 m, tried in that order.
- Discrete layout sectors: 90°, 180°, 270° and 360°.
- Direction search step: 45°.
- Target coverage mesh: 0.5 m.
- Candidate-position grid: half of the planning radius, with additional samples along the boundary and exclusion edges.

These values are Florial planning assumptions. They are **not** manufacturer-certified per-arc operating points or pressure/nozzle performance data.

The published Sanity product's short description currently states a 4.3–9 m radius, while the manufacturer's general technical specification gives 4.6–10.7 m across the series. The installed nozzle and nozzle pressure determine the real operating point. In particular, the 10 m planning value must not be interpreted as a verified throw for the factory-installed 2.0 nozzle. The assistant and PDF label these values explicitly as geometric planning radii.

The manufacturer documents mechanical arc adjustment from 40° to 360°, a 1/2-inch female threaded bottom inlet, and broad operating ranges. The published performance chart's precipitation basis is half-circle operation. No per-arc performance conversion is inferred by this implementation.

References:
- Rain Bird 3500 Series product information: https://www.rainbird.com/products/3500-series-professional-grade-rotor-sprinklers
- Rain Bird 3500 Series technical specification D42378: https://www.rainbird.com/sites/default/files/media/documents/2023-11/d42378_3500_rotor_tech_spec.pdf
- Rain Bird 3500 performance chart: https://www.rainbird.com/media/4157

## 2. Geometry and candidate generation

Implementation: `src/lib/irrigation/rainBird3504Layout.mjs`.

The module accepts only confirmed, supported geometry with one irrigated region. It samples target points inside the outer boundary and outside rectangular non-irrigated exclusions. Candidate rotor positions must be inside irrigated geometry.

A candidate sector is retained only when the sampled footprint stays inside the original irrigated geometry. Candidate generation is bounded by implementation safety limits:

- 30,000 target points;
- 5,000 candidate sectors;
- 60 selected rotors.

The selector is a deterministic greedy set-cover heuristic, not a global optimizer. Each rotor added after the first must mutually reach at least one already selected rotor. The returned sampled coverage is not a mathematical proof of continuous coverage.

## 3. Integration order and safe fallback

The bridge in `src/lib/irrigation/irrigationLayoutBridge.mjs` follows this order:

1. Generate 3504-PC candidates first when the geometry is in the rotor planning envelope.
2. Pass accepted rotor heads as initially covered heads to the existing R-VAN layout engine.
3. Use the unchanged R-VAN engine to fill remaining uncovered samples.
4. Check combined circular-head Head-to-Head relationships.
5. Run a composite overspray check against the original geometry at 1° angular and 0.2 m radial sampling.
6. If the mixed candidate set fails Head-to-Head or composite overspray validation, reject the rotor prepass and return to the legacy R-VAN-only layout.

The approved R-VAN placement implementation in `src/lib/irrigation/lawnSprinklerLayout.mjs` was not modified. Existing narrow-strip R-VAN rules remain in place.

## 4. Dimension annotations and project PDF

`src/lib/irrigation/lawnDimensionAnnotations.mjs` produces outward dimension annotations for every edge of the outer lawn boundary and each rectangular exclusion.

The irrigation assistant renders those annotations in both the geometry preview and the calculated layout diagram. The project PDF now:

- draws the outer lawn boundary;
- draws rectangular non-irrigated exclusions;
- draws dimension lines and edge-length labels for both;
- lists the dimensions of each exclusion in the geometry section.

The order snapshot validator in `functions/api/_lib/irrigation-project.mjs` preserves sanitized rectangular exclusions so the PDF can render them. It accepts the closed rings emitted by the geometry normalizer, validates four-corner axis-aligned rectangles, checks their sampled points against the outer boundary, rejects overlapping exclusions, and stores the normalized open rectangle ring. No D1 schema migration is required; this is an additive field in the JSON project snapshot.

## 5. Catalogue and preliminary BOM boundary

Read-only Sanity Production verification on 2026-11-24 confirmed:

- `Y34001` — published Rain Bird 3504-PC product;
- `A46010` — Rain Bird SBE-050, 1/2-inch male threaded fitting for compatible SPX-FLEX pipe;
- `A82060` — Rain Bird SPX-FLEX30, 30 m flexible pipe roll.

The manufacturer product information describes the 3500 as having an attachable six-nozzle Rain Curtain tree. Regional product listings identify Y34001 as 3504-PC/2.0 with nozzle 2.0 pre-installed. This is useful package evidence, but it does not settle every accessory, installation configuration or final project BOM assumption.

Current preliminary BOM behavior:
- one `Y34001` rotor SKU per 3504-PC head;
- no separate `A44120` 1804 spray body for a rotor;
- the existing flexible-connection calculation currently allows two `A46010` SBE-050 fittings per head and 0.5 m of SPX-FLEX per head.

The accessory quantities and final factory package remain provisional pending engineering confirmation. Do not present this BOM as a final purchase list.

## 6. Explicitly not calculated

This geometric implementation does not calculate or infer:

- selected nozzle size or nozzle pressure;
- 3504-PC flow at a selected nozzle/pressure/arc;
- arc-specific precipitation or radius conversions;
- source pressure, pipe losses or hydraulic zone feasibility;
- DU/CU or precipitation uniformity;
- a field-validated continuous coverage guarantee.

The 3500 performance dataset remains separate. Do not interpolate or reuse its half-circle precipitation values for other arcs. Do not apply a 25% or 35% radius-reduction factor automatically; the manufacturer documentation has conflicting statements.

The result remains a preliminary geometric layout, not a hydraulically validated design.

## 7. Regression coverage

The current suite covers:

- 3504-PC priority on 8×8, 20×10, 20×15 and 30×30 m rectangles;
- a 28×14 m L-shaped lawn with a 16×12 m top-right recess;
- a 20×16 m lawn with a 4×4 m non-irrigated rectangle, where the safe R-VAN-only fallback is retained when no 3504 candidate is selected;
- legacy R-VAN model selection and interior rows through the unchanged R-VAN engine;
- 3504 geometry validation, rotor BOM mapping and exclusion persistence;
- dimension annotations and PDF source-level regression checks.

## 8. Release boundary

PR #527 is not merged. No Production deployment, Sanity write, D1 data write, schema change or Cloudflare settings/secret change was performed for this task.

The shared `CHANGELOG.md`, Technical Passport, `OPEN_QUESTIONS.md` and `CURRENT_STATE.md` are intentionally not edited on this branch because open PR #409 also changes those shared records. Reconcile and update the shared project records during the single integration step after the owner accepts this PR.
