# Rain Bird 3500 — manufacturer arc and radius evidence review

Date: 2026-11-16  
Code baseline reviewed: `997695a9801d014dff86de9b3f6e9f8400ccfd03`  
Status: read-only source review; no 3500 solver activation.

## Executive result

The official Rain Bird 3500 documentation confirms an adjustable rotor arc of 40°–360° and a factory preset of 180°. The official nozzle performance chart contains 36 exact nozzle/pressure rows (six nozzle sizes × six pressures). It explicitly states that the **precipitation rates are based on half-circle operation**.

The reviewed manufacturer documents do not provide separate performance tables or a conversion method for precipitation at 40°–179° or 181°–360°. The current Florial solver must therefore not reuse the 180° precipitation values as if they were manufacturer values for other arcs.

The technical specification also contains inconsistent radius-reduction limits (25% and 35%). The solver must not automatically apply either percentage until Rain Bird clarifies the applicable limit and operating conditions.

## Official sources reviewed

1. Rain Bird, **3500 Series Nozzles Performance Metric**, D42378 chart:  
   https://www.rainbird.com/media/4157
2. Rain Bird, **3500 Series Rotors Technical Specifications**, D42378:  
   https://www.rainbird.com/sites/default/files/media/documents/2023-11/d42378_3500_rotor_tech_spec.pdf
3. Rain Bird, **3500 Series Installation Instructions**, D42377:  
   https://www.rainbird.com/sites/default/files/media/documents/2023-11/d42377-3500_series_rotor-web-hq_1.pdf
4. Rain Bird current 3500 product page:  
   https://www.rainbird.com/products/3500-series-professional-grade-rotor-sprinklers

## Confirmed manufacturer facts

### Arc and mechanism

- Adjustable part-circle arc: 40°–360°.
- Full-circle operation is reversing.
- Factory arc preset: 180°.
- The rotor uses an attachable nozzle tree with six Rain Curtain nozzle sizes.
- Installation instructions describe arc adjustment, but do not supply arc-specific performance tables.

### Exact performance chart

The metric chart contains 36 exact rows:
- Pressures: 1.7, 2.0, 2.5, 3.0, 3.5 and 3.8 bar.
- Nozzle sizes: 0.75, 1.0, 1.5, 2.0, 3.0 and 4.0.
- Each row contains radius, flow, square-spacing precipitation and triangular-spacing precipitation.

The chart states:
- Precipitation rates are based on half-circle operation.
- Square and triangular spacing are based on 50% of throw diameter.
- Performance data was collected in zero-wind conditions.
- Performance data conforms with ASAE S398.1.

These are exact chart values, not site-specific nozzle pressure or field performance guarantees.

### Radius-reduction discrepancy

The official D42378 technical specification contains two different limits:
- Operating Range section: radius reduction up to **35%** with the Nozzle Retention Screw.
- Detailed specification section: adjusting screw reduces radius up to **25%**.

The current Rain Bird product page repeats the inconsistency: one feature bullet says 35%, while its operating-range section says 25%.

Until clarified by the manufacturer, neither percentage is accepted as an automatic calculation parameter. The Florial engine must use only the exact published radius row and must not silently apply an assumed reduction factor.

## Existing Florial code mapping

The current isolated 3500 dataset maps:
- `3504-PC` — SKU `Y34001`
- `3504-PC-SAM` — SKU `Y34500`

These are code-owned catalogue mappings. This review did not perform a live Sanity read-back and does not assert current publication, stock or product configuration.

## Engineering consequences

1. Keep 3500 in a rotor-specific engine path. Do not route it through R-VAN or HE-VAN lookup logic.
2. Preserve the 36 exact manufacturer rows; do not interpolate pressure or nozzle size.
3. Treat precipitation values as 180°/half-circle chart values only.
4. Do not extrapolate precipitation to 90°, 270° or 360° by a simple arc ratio unless Rain Bird supplies an approved method and the result is independently validated.
5. Do not assume that radius and flow are arc-invariant without manufacturer confirmation. The reviewed chart gives nozzle/pressure values but does not publish separate arc-specific rows.
6. Do not apply a 25% or 35% radius-reduction factor until the discrepancy is resolved.
7. Candidate generation, sector geometry, head-to-head checks, overspray, precipitation distribution and hydraulic zoning must be rotor-specific and independently tested.
8. Keep any unvalidated result internal/preliminary and require irrigation-engineer review before customer-facing equipment recommendations or catalogue/cart mapping.

## Open manufacturer questions

- Are radius and flow in the 3500 chart intended to remain unchanged at all adjustable arcs for a fixed nozzle and pressure?
- What validated method, if any, should be used to calculate precipitation at arcs other than 180°?
- Is the allowable radius-reduction limit 25% or 35%, and under what nozzle/pressure conditions?
- Does the chart's 50%-of-throw spacing basis remain the correct placement rule for all supported arcs?

## Scope exclusions

- No Rain Bird 5000 MPR engine or customer-facing MPR recommendations.
- No change to Sanity, D1, Cloudflare settings/secrets, Resend, catalogue, cart or Production.
- No 3500 solver implementation or activation in this review.
