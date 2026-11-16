# Rain Bird 3500 layout-engine readiness audit

Date: 2026-11-16  
Code baseline: `77ee6047879db9112ea0eee7c542aa1e795ebcc9`  
Status: read-only engineering review; 3500 is not enabled in the layout solver.

## Executive result

The repository already contains a versioned Rain Bird 3500 manufacturer dataset with 36 exact operating points (six nozzle sizes × six pressure points). This is sufficient for exact pressure/nozzle lookup, but **not sufficient to use the 3500 in the current multi-arc placement solver**.

The official performance chart states that precipitation rates are based on half-circle operation. The 3500 rotor itself supports adjustable part-circle operation from 40° to 360°. The current layout solver generates 90°, 180°, 270° and 360° heads and uses a family-specific performance lookup for each arc. It would be incorrect to apply the 180° chart values to all other arcs without a manufacturer-backed conversion/rule and independent validation.

No runtime changes were made. No Sanity, D1, Cloudflare, Resend, Gemini, cart or Production writes were performed.

## Evidence checked

### 1. Existing code-owned dataset

- `src/lib/irrigation/irrigationPerformanceData.mjs`
- `src/lib/irrigation/irrigationPerformanceData.d.mts`
- `tests/irrigation-performance-data.test.mjs`

Dataset facts:
- Manufacturer: Rain Bird; family: 3500.
- Source document: D42378, 3500 Series Nozzles Performance Metric.
- Exact pressure points: 1.7, 2.0, 2.5, 3.0, 3.5 and 3.8 bar.
- Exact nozzle sizes: 0.75, 1.0, 1.5, 2.0, 3.0 and 4.0.
- 36 exact pressure/nozzle rows; no interpolation or nearest-point fallback.
- Each row includes radius, flow and square/triangular precipitation values.
- Existing catalogue references: Y34001 / 3504-PC and Y34500 / 3504-PC-SAM.

The existing tests verify dataset provenance, all 36 row combinations, exact lookup behavior, invalid-input rejection and the two current Florial model mappings.

### 2. Manufacturer operating chart

Official source: https://www.rainbird.com/media/4157

The chart explicitly states:
- “Precipitation rates based on half-circle operation”.
- Square and triangular spacing based on 50% of throw diameter.
- Performance data collected in zero-wind conditions.
- Tests conform with ASAE S398.1.

The manufacturer technical page states that the 3500 supports 40°–360° part-circle/reversing full-circle operation, a six-nozzle Rain Curtain nozzle tree, and radius reduction by an adjustment screw.

These statements do not themselves provide a complete set of independently published operating points for each arc. Do not infer that flow, radius or precipitation remain identical across 90°, 180°, 270° and 360° arcs.



### 2.1 Official installation manual cross-check

The current official Rain Bird 3500 installation manual (D42377, 10/23) was also reviewed:
- It repeats that the performance chart's precipitation rates are based on half-circle operation.
- Its installation instructions confirm that the arc is adjustable from 40° to 360°.
- The manual does not publish an arc-specific table or a conversion rule for radius, flow and precipitation at other selected arcs.

This independently confirms the implementation blocker: the fact that the rotor can be mechanically adjusted to an arc does not authorize the solver to reuse the half-circle performance row unchanged for 90°, 270° or full-circle heads.

### 3. Relevant 6–8 m radius rows

The current dataset contains exact rows in the practical radius band:

| Pressure (bar) | Nozzle | Radius (m) | Flow (L/min) | Square precip. (mm/h) | Triangular precip. (mm/h) |
|---:|---:|---:|---:|---:|---:|
| 1.7 | 1.0 | 6.1 | 2.91 | 9 | 11 |
| 1.7 | 1.5 | 7.0 | 4.01 | 10 | 11 |
| 1.7 | 2.0 | 8.2 | 5.30 | 9 | 11 |
| 2.0 | 1.0 | 6.2 | 3.14 | 10 | 11 |
| 2.0 | 1.5 | 7.0 | 4.35 | 11 | 12 |
| 2.5 | 1.0 | 6.4 | 3.55 | 10 | 12 |
| 2.5 | 1.5 | 7.0 | 4.94 | 12 | 14 |
| 3.0 | 1.0 | 6.4 | 3.93 | 12 | 13 |
| 3.0 | 1.5 | 7.3 | 5.49 | 12 | 14 |
| 3.5 | 1.0 | 6.6 | 4.27 | 12 | 14 |
| 3.5 | 1.5 | 7.3 | 5.97 | 13 | 15 |
| 3.8 | 1.0 | 6.7 | 4.47 | 12 | 14 |
| 3.8 | 1.5 | 7.3 | 6.25 | 14 | 16 |

The 2.0 nozzle rows produce 8.2–8.5 m, just outside an 8 m upper boundary. These are exact manufacturer table values, not site recommendations. The correct nozzle/pressure choice still depends on the complete layout, precipitation matching, measured nozzle pressure and hydraulic network.

### 4. Current solver incompatibility

- `src/lib/irrigation/lawnSprinklerLayout.mjs` currently accepts only `R-VAN` and `HE-VAN` families.
- Its `performanceFor()` lookup routes every non-R-VAN family through the HE-VAN lookup.
- Candidate generation creates 90°, 180°, 270° and 360° heads.
- The solver evaluates exact performance data per candidate arc and uses the returned radius, flow and precipitation values.
- The current declaration `lawnSprinklerLayout.d.mts` also limits the family union to R-VAN and HE-VAN.
- The current bridge `irrigationLayoutBridge.mjs` is intentionally restricted to the R-VAN candidate scope and sends wider cases to the future rotor engine.

Therefore, adding `3500` to a TypeScript union or adding a lookup branch alone would be unsafe and incomplete.

## Required work before enabling 3500

1. Obtain manufacturer-confirmed performance interpretation for adjustable arcs, including what can be asserted for radius, flow and precipitation at the selected arc.
2. Confirm the 3504-PC and 3504-PC-SAM package/nozzle-tree contents and whether the Florial SKU represents the complete rotor with its nozzle tree.
3. Define the rotor candidate-generation strategy separately from spray-nozzle candidate generation. Do not assume the existing 90°/270° corner behavior transfers to rotor heads.
4. Use only exact supported manufacturer points. Do not interpolate pressure or nozzle data.
5. Add rectangle and L-shape regression cases at the user's practical width/radius ranges, including mirrored/rotated L-shapes and finer sampling.
6. Verify head-to-head geometry, overspray boundary behavior and precipitation consistency separately. A sampled-coverage pass is not a DU/SC or hydraulic pass.
7. Record the selected nozzle as a discrete component/configuration in the engineering result and map only to verified published Florial catalogue products.
8. Have an irrigation engineer review the baseline layouts before enabling customer-facing automatic recommendations.

## Recommended implementation order

- First: keep the existing 3500 dataset as exact manufacturer evidence; add an explicit solver gate that prevents accidental use until the arc model is approved.
- Second: implement a rotor-specific candidate/evaluation path behind a separate family interface, rather than treating a rotor as HE-VAN or R-VAN.
- Third: validate 3500 on engineer-reviewed reference rectangles and L-shapes.
- Fourth: curate Rain Bird 5000 exact operating data and product/nozzle configuration. The existing audit notes that 5004PC30 identifies a 3.0 nozzle, while 5004+FC remains insufficiently specified; do not generalize between SKUs.
- Fifth: only after layout validation, begin hydraulic zones and pipe-loss work using an approved versioned ruleset. The hydraulic method, internal pipe diameters, fittings and thresholds remain release-blocking decisions.

## Explicit non-claims

This audit does not claim that 3500 is less or more water-efficient than R-VAN/HE-VAN in all situations. It does not select a nozzle for a real property, infer nozzle pressure from source pressure, prove coverage, establish DU/SC, validate a zone, or approve a bill of materials.

## References

- Rain Bird 3500 Series Nozzles Performance Charts: https://www.rainbird.com/media/4157
- Rain Bird 3500 Series Rotor Installation Manual (D42377): https://www.rainbird.com/media/4228
- Rain Bird 3500 Series Technical Specifications (D42378): https://www.rainbird.com/sites/default/files/media/documents/2023-11/d42378_3500_rotor_tech_spec.pdf
- Rain Bird 3500 Series product/technical page: https://www.rainbird.com/products/3500-series-professional-grade-rotor-sprinklers
- Florial source files listed above and `docs/engineering/IRRIGATION_ASSISTANT_LAWN_ENGINEERING_SPEC.md`.


## 2026-11-16 — evaluator stage 1 implementation

PR #339 adds `src/lib/irrigation/rainBird3500RotorEngine.mjs` and a separate declaration/test file. The evaluator:
- accepts exact D42378 pressure/nozzle combinations only;
- accepts 180° arcs only and rejects all other arcs;
- evaluates explicitly supplied positions for sampled coverage, mutual directional head-to-head and sampled overspray;
- keeps hydraulic feasibility, precipitation uniformity and body/package compatibility as not evaluated.

This is not a placement generator, continuous coverage proof, hydraulic calculator, approved design or customer-facing recommendation. It does not alter the existing R-VAN/HE-VAN solver and does not use the 5000 MPR dataset. PR #339 CI is pending; no Production or live-service changes were made.
