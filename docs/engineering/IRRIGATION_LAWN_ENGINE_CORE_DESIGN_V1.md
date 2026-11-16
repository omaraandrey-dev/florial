# Lawn irrigation engineering core — domain model and calculation contracts v1.0

**Status:** proposed engineering design; requires irrigation-engineer review before implementation  
**Date:** 2026-11-16  
**Parent specification:** FLORIAL_AI_IRRIGATION_CONSULTANT_SPEC_V1.md  
**Baseline main SHA reviewed:** a9dc18be8a0d0c2266bd77170c0f8dd6b1ce8219  
**Scope:** geometry, water measurements, sprinkler performance data, deterministic calculation contracts and test scenarios  
**Runtime changes:** none

---

## 1. Design objective

Define stable, testable data contracts for the first Florial calculation module: automatic lawn irrigation.

This document deliberately separates four things that must never be conflated:

1. **Customer observations** — what the customer says, measures, draws or uploads.
2. **Normalized engineering inputs** — validated values with units, provenance and confidence.
3. **Manufacturer evidence** — exact, source-traceable performance data and component compatibility.
4. **Calculation outputs** — reproducible results produced by a named version of the deterministic engine.

The conversational model may help collect and explain these records. It cannot promote an estimate into a measurement, convert an unconfirmed sketch into confirmed geometry, or change an engineering result.

## 2. Domain boundaries and invariants

### 2.1 Canonical units

Use metric units in the engineering domain:

- geometry and pipe length: metre (m);
- area: square metre (m²);
- elevation: metre (m);
- pressure: bar, stored at sufficient precision for source data;
- flow: litre per minute (L/min) as the canonical customer-facing and calculation unit;
- pipe internal diameter: millimetre (mm);
- precipitation rate: millimetre per hour (mm/h);
- angle: degree;
- water volume: litre (L);
- time: second (s).

Conversions happen at validated boundaries. Never infer a unit from the magnitude of a number. Keep the original entered value/unit alongside the normalized value when conversion occurs.

### 2.2 Provenance and confidence

Every customer-supplied or inferred engineering value must carry provenance. Recommended provenance values:

- customer_measured;
- customer_reported;
- engineer_measured;
- imported_document;
- derived_by_engine;
- ai_extracted_unconfirmed.

Confidence is separate:

- confirmed;
- reported;
- estimated;
- unverified.

An AI-extracted value remains unconfirmed until the customer or engineer explicitly verifies it. A derived value points to its source inputs and calculation rule. Confidence must never be silently upgraded by the model.

### 2.3 Immutable calculation inputs

A calculation run consumes a frozen, versioned input snapshot. If any geometry, measurement, equipment point or engineering setting changes, create a new snapshot/run. Do not mutate a past result in place.

### 2.4 No false precision

Store source precision and rounding rules. Do not display more decimal places than the source data and calculation method justify. A calculation result must distinguish:
- manufacturer-published values;
- measured site values;
- engine-derived values;
- assumptions;
- unknown values.

## 3. Geometry contract

### 3.1 Coordinate model

Use a local planar Cartesian coordinate system in metres for all geometry calculations. Coordinates are not latitude/longitude and are not raw screen pixels.

- X and Y are local coordinates relative to a recorded origin.
- The coordinate frame orientation is recorded for rendering, but geometry calculations depend only on relative positions.
- The editor converts pixels to metres using a confirmed scale before geometry is eligible for calculation.
- Store map latitude/longitude separately as optional location metadata; never use geographic degrees directly for sprinkler spacing or area calculations.

The first supported editor should allow:
1. entering rectangle dimensions;
2. drawing a polygon on a metric grid;
3. adding one or more lawn regions;
4. adding exclusions/obstacles;
5. entering a known reference length to scale an imported sketch;
6. reviewing and confirming the resulting dimensions.

An unscaled photo or AI interpretation is draft-only.

### 3.2 Geometry entities

A project geometry snapshot contains:

- schemaVersion;
- coordinateSystem = local_cartesian_m;
- geometryStatus = draft | needs_scale | needs_confirmation | confirmed;
- origin description and optional map location;
- one or more lawn regions;
- zero or more exclusions and obstacles;
- scale reference and evidence;
- provenance/confidence;
- customer-reported area as a separate optional field.

Each lawn region contains one outer polygon boundary. An exclusion is a separate polygon clipped to/contained by the region. Obstacles may be polygonal or point/line features with a documented clearance buffer. Do not encode a hole by silently subtracting area from a customer-entered total.

A polygon ring is an ordered list of at least three distinct vertices. The normalized persisted representation is closed: the first vertex is repeated at the end. Consecutive duplicate vertices are invalid. Self-intersecting rings are invalid. The geometry validator checks containment, intersections, zero-area rings, duplicate regions, invalid exclusions and unsupported topology.

### 3.3 Proposed TypeScript domain shape

The following is a conceptual domain contract, not a committed runtime type:

- GeometrySnapshot
  - schemaVersion: integer
  - coordinateSystem: local_cartesian_m
  - status: draft | needs_scale | needs_confirmation | confirmed
  - origin: optional description
  - regions: LawnRegion[]
  - obstacles: Obstacle[]
  - scaleEvidence: optional ScaleEvidence
  - reportedAreaM2: optional MeasurementValue
  - provenance: ProvenanceRecord
- LawnRegion
  - id: stable opaque ID
  - boundary: PolygonRing
  - exclusions: Exclusion[]
  - surfaceType: natural_lawn | artificial_turf | mixed | unknown
- PolygonRing
  - vertices: Point2M[] (closed ring)
- Point2M
  - x: number
  - y: number
- Exclusion
  - id
  - polygon: PolygonRing
  - kind: building | path | driveway | pool | planting_bed | tree_canopy | water_sensitive | other
  - clearanceM: optional non-negative value
- Obstacle
  - id
  - kind
  - geometry: point | line | polygon
  - clearanceM
  - heightM: optional
- ScaleEvidence
  - method: entered_dimensions | measured_reference | scaled_plan | ai_draft
  - referenceStart: Point2M
  - referenceEnd: Point2M
  - measuredLengthM
  - confirmedBy: customer | engineer | null
- ProvenanceRecord
  - source
  - confidence
  - capturedAt
  - confirmedAt: optional
  - note: optional

### 3.4 Geometry validation results

Geometry validation returns a structured result, not a boolean alone:

- valid: boolean;
- status: accepted | needs_scale | needs_confirmation | unsupported | invalid;
- computedAreaM2 per region and total;
- computedPerimeterM where meaningful;
- warnings[] with stable codes;
- errors[] with stable codes;
- normalizedGeometry only when normalization is safe;
- validatorVersion.

The customer-entered area is compared with computed polygon area. A mismatch creates a warning requiring confirmation; it does not overwrite either value. The acceptable mismatch threshold is a project engineering decision and must be configurable/versioned, not hidden in UI code.

### 3.5 Geometry support boundary

The data model can represent multiple polygons and exclusions, but that does not mean the first solver supports every topology.

Recommended first solver support:
- one rectangle;
- one orthogonal L-shape represented as a simple polygon;
- multiple separated simple lawn polygons only after independent-region handling is tested.

Initially reject or escalate:
- self-intersecting boundaries;
- holes/inner rings not represented as explicit exclusions;
- narrow corridors below the validated sprinkler/layout resolution;
- overlapping lawn regions;
- complex curved boundaries that cannot be represented within an approved tolerance;
- geometry without a confirmed metric scale.

Arbitrary polygons may be accepted by the geometry editor before they are supported by automatic sprinkler placement. Geometry acceptance and solver support are separate states.

## 4. Water source and measurement contracts

### 4.1 Water source

WaterSourceType:
- mains;
- well_or_borehole;
- pump_from_tank;
- gravity_tank;
- shared_supply;
- unknown.

Keep the source type separate from the equipment installed at the source. A well may feed a pump and pressure tank; a tank may be gravity-fed or pumped.

### 4.2 Measurement record

Every pressure or flow measurement must be an independent immutable record:

- id;
- kind: static_pressure | dynamic_pressure | flow_rate | elevation | pipe_internal_diameter;
- value;
- unit;
- method;
- testPoint;
- measurementSessionId;
- measuredAt;
- operatingConditions;
- provenance;
- confidence;
- evidenceReference: optional;
- note: optional.

Pressure records must identify gauge location and whether water was flowing. Flow records must identify the outlet/test point, collection method, duration and concurrent water use.

### 4.3 Static and dynamic pressure

Static pressure is measured with no flow at the defined test point. It is useful context but cannot establish sprinkler operating pressure.

Dynamic pressure is measured while a known flow is being delivered. Record the actual simultaneous flow and pressure as one measurement session where possible. If they were not simultaneous, do not pretend they describe one source operating point.

A dynamic pressure measured at the source/test tap is not pressure at the sprinkler. The engine must account for elevation and all downstream pipe, fitting, filter, valve and regulator losses before evaluating nozzle pressure.

### 4.4 Flow measurement

For a bucket/container test:

Q (L/min) = collected volume (L) × 60 / elapsed time (s).

The record must preserve volume, elapsed time, calculated flow, outlet/test point and conditions. The result is a measurement at that test point, not automatically the available flow at the sprinkler manifold.

If pressure and flow are measured simultaneously, link them by measurementSessionId. If a single flow-only measurement is supplied, mark pressure-flow relationship as incomplete.

### 4.5 Important hydraulic limitation

One measured dynamic pressure/flow pair is one operating point. It does not define a complete pump or supply curve.

A single point cannot safely be extrapolated to arbitrary design demand. For a mains supply, the approved engineering method must state how the measured point is used and what additional test is required. For a pump, use a verified pump curve and operating configuration. If the planned zone demand materially differs from the tested operating point and no validated source curve/model exists, the result must be needs_measurement or needs_engineer_review, not “hydraulically feasible”.

### 4.6 Pipe and restriction records

For each known segment or component, capture:

- material/manufacturer/model;
- nominal size and verified internal diameter;
- length;
- fittings and quantities;
- valves, filters, meters, backflow devices, regulators and connectors;
- elevation change;
- source and confidence of each value.

Nominal diameter is not internal diameter. Never substitute one for the other without a verified product/material schedule.

### 4.7 Hydraulic input readiness

Hydraulic readiness is not a count of completed form fields. It is a set of explicit gates:

- source type known;
- dynamic measurement available at a defined test point;
- simultaneous flow context known;
- pipe path and internal diameters sufficiently described;
- elevation difference known or bounded;
- restrictions identified;
- source curve or approved measured-point method available;
- selected sprinkler performance point known.

If a gate is not met, the engine may return a preliminary geometry result but must not assert hydraulic feasibility.

## 5. Sprinkler and nozzle performance data contract

### 5.1 Separate product identity from hydraulic performance

A catalogue product is not itself a performance point. Keep separate entities:

1. Manufacturer model/component identity.
2. Physical assembly definition (integrated body/nozzle or compatible component set).
3. Manufacturer-tested operating point.
4. Florial Sanity product binding.
5. Verification/source record.

A single model may have many nozzle, pressure, arc and pattern operating points. A product title or broad catalogue flow range is not a substitute for a tested point.

### 5.2 Performance dataset structure

A dataset revision should include:

- datasetId and revision;
- manufacturer;
- family and exact model;
- component role: rotor | spray_body | nozzle | integrated_assembly | valve | regulator | other;
- manufacturer document code, revision/date, source URL, page/table and reviewer;
- test standard and conditions;
- supported units and precision;
- discrete operatingPoints[];
- verificationStatus: draft | reviewed | verified | blocked;
- effective date and change note.

Each operating point should include, where the manufacturer publishes it:

- stable point ID;
- exact model and nozzle identifier;
- pressure at the device inlet (bar);
- flow (L/min);
- radius/throw (m);
- precipitation rate (mm/h);
- pattern type: circular | strip | other;
- arc or tested arc basis, if the table specifies it;
- square/triangular spacing basis, if specified;
- test wind/conditions;
- source row/page reference;
- original published values and normalized values;
- rounding/precision metadata.

Do not invent a missing field. Use null plus an explicit unsupported/missing-data reason.

### 5.3 Arc and precipitation semantics

Do not confuse:
- the arc installed/adjusted on a sprinkler;
- the arc used to establish a manufacturer precipitation table;
- the shape/pattern of the nozzle.

The existing Rain Bird 3500 dataset identifies half-circle operation as the precipitation basis in the source metadata. That is not proof that every installed 3500 head must operate at 180 degrees, nor does it define flow changes for every arc. The model must represent these concepts separately and only apply an arc correction where a verified manufacturer rule exists.

Strip nozzles require pattern geometry and orientation; they are not circular heads with a shorter radius.

### 5.4 Assembly and catalogue binding

AssemblyRepresentation:
- integrated_sku;
- body_plus_nozzle;
- rotor_with_selected_nozzle;
- standalone_component.

A bill of materials must choose exactly one valid representation for each physical assembly. An integrated UNI-Spray assembly must not receive a second nozzle line. A body-only SKU may require a separate compatible nozzle. A rotor package may include a nozzle tree; the exact package contents must be verified before the BOM is finalized.

CatalogueBinding contains:
- Sanity document ID;
- SKU;
- published state;
- component/assembly role;
- compatibility rule ID;
- binding verification status;
- last verified catalogue revision/time.

Commercial values (price, stock state, product URL) are resolved at request time through trusted Florial server-side catalogue code. They do not belong in the engineering performance dataset.

### 5.5 Current Rain Bird 3500 baseline

The current main-branch dataset contains 36 discrete manufacturer points:
- pressure: 1.7, 2.0, 2.5, 3.0, 3.5 and 3.8 bar;
- nozzle: 0.75, 1.0, 1.5, 2.0, 3.0 and 4.0;
- each point includes radius, flow and square/triangular precipitation;
- source: Rain Bird D42378, zero-wind conditions, ASAE S398.1, half-circle precipitation basis.

Current Florial product bindings in the dataset:
- Y34001 — 3504-PC;
- Y34500 — 3504-PC-SAM.

The exact nozzle-tree/package contents remain to be confirmed. Therefore the dataset's manufacturer performance lookup can be used as a verified point lookup, but a complete assembly recommendation/BOM remains gated by package confirmation.

One current row is a useful contract fixture: at 3.0 bar and nozzle 2.0, the dataset reports radius 8.2 m, flow 7.17 L/min, square precipitation 13 mm/h and triangular precipitation 15 mm/h. This is a table lookup test fixture only, not a recommendation for a real site.

### 5.6 Dataset integrity tests

For each dataset revision:
- all required numeric values are finite and positive where applicable;
- units are explicit;
- source references are present;
- point IDs are unique;
- no duplicate operating-point key exists;
- model/nozzle identifiers match the manufacturer document;
- pressure/nozzle/arc combinations are discrete and exact;
- normalized conversions agree within source rounding precision;
- no unsupported interpolation/extrapolation occurs;
- product bindings are published and exact;
- compatibility is verified for every proposed assembly;
- blocked/unverified data cannot enter automatic selection.

For the current 3500 data, add a conversion consistency test: 7.17 L/min corresponds to 0.4302 m³/h, displayed as 0.43 m³/h at two decimals. The two stored values must not be treated as independently precise source measurements if one is a rounded conversion.

## 6. Deterministic calculation contracts

### 6.1 Pure engine boundary

The core calculation package should be a pure TypeScript/JavaScript module:
- no LLM dependency;
- no browser APIs;
- no direct Sanity/network calls;
- no D1 writes;
- no price/stock calculations;
- no hidden global state.

It receives a validated immutable input snapshot plus explicit dataset/ruleset revisions and returns a serializable result. Server adapters fetch trusted inputs and catalogue data outside the core.

### 6.2 Calculation request

Conceptual LawnCalculationRequest:

- requestId;
- projectId;
- inputSnapshotId;
- inputSchemaVersion;
- geometrySnapshot;
- waterSupplySnapshot;
- designConstraints;
- candidateDatasetRevisions[];
- engineeringRulesetVersion;
- requestedOutputLevel: preliminary_layout | hydraulic_validation | product_proposal.

The request must include only validated records. A preliminary request may omit hydraulic fields, but the output status must remain preliminary_only.

### 6.3 Calculation pipeline contracts

1. validate-inputs
   - validate schema, units, ranges, provenance and confidence;
   - return blocking errors and missing requirements.
2. validate-geometry
   - normalize polygons and exclusions;
   - compute areas and support status.
3. generate-layout-candidates
   - generate candidate positions/arcs only for supported geometry/families;
   - return candidate provenance and rejected alternatives.
4. evaluate-performance
   - exact lookup of verified manufacturer operating points;
   - reject unsupported pressure/nozzle/arc combinations.
5. evaluate-coverage
   - verify edge coverage, head-to-head spacing, overlaps, blind spots and overspray against declared geometric rules;
   - report the method/resolution and limits.
6. evaluate-precipitation
   - compare precipitation using a configurable, engineer-approved threshold;
   - never infer uniformity distribution from one average rate.
7. group-zones
   - aggregate head demand and group compatible heads;
   - respect family, pressure, valve and hydraulic constraints.
8. evaluate-hydraulics
   - calculate pipe-segment flow, friction/minor losses and elevation effects using an approved method and verified pipe data;
   - verify residual pressure at the worst-case device.
9. validate-assemblies
   - verify body/nozzle/rotor/package and accessory compatibility.
10. resolve-catalogue
    - map only eligible components to exact published Sanity IDs/SKUs;
    - commercial data fetched separately by server adapter.
11. produce-report
    - return results, trace, assumptions, warnings, errors and next actions.

A stage may stop the pipeline. The engine must not continue with fabricated defaults after a blocking error.

### 6.4 Calculation response

Conceptual LawnCalculationResult:

- resultId;
- requestId;
- status;
- engineVersion;
- rulesetVersion;
- inputSnapshotId;
- datasetRevisions[];
- geometryResult;
- layoutResult;
- zones[];
- hydraulicResult;
- assemblyResult;
- catalogueEligibility[];
- warnings[];
- blockingErrors[];
- assumptions[];
- trace[];
- calculatedAt.

Each zone should include selected head IDs, exact operating-point IDs, total demand, source operating-point reference, calculated losses, worst-case residual pressure and pass/fail/unknown status.

Each head should include local coordinates, exact model/nozzle, arc/pattern, operating-point ID, inlet pressure, radius, flow, precipitation basis and coverage relationships.

### 6.5 Result states

Use explicit states:
- invalid_input;
- needs_scale;
- needs_geometry_confirmation;
- needs_measurement;
- preliminary_only;
- unsupported_case;
- needs_engineer_review;
- not_feasible;
- calculation_validated;
- engineer_approved.

Only the deterministic engine may return calculation_validated, and only after all required gates pass. Only an authorized human engineer can transition to engineer_approved. The LLM cannot set or upgrade these states.

### 6.6 Hydraulic method is a release-blocking decision

Do not silently choose a friction equation, roughness coefficients, fitting K-values, velocity limits, acceptable pressure variation, precipitation matching tolerance or safety margin.

The implementation must make these explicit in a versioned EngineeringRuleset:
- friction method and valid range;
- pipe material/internal-diameter source;
- roughness coefficient or friction-factor method;
- fitting/minor-loss data source;
- velocity limits;
- allowed pressure variation;
- minimum residual pressure per selected device;
- elevation handling;
- source pressure-flow curve policy;
- precipitation matching threshold;
- geometry/coverage tolerance;
- wind/slope limitations.

These values require engineer approval and documented source/rationale before hydraulic results can be marked validated.

## 7. First calculation-engine API

These are internal pure-function boundaries, not public API routes:

- validateGeometry(geometry, geometryRules) → GeometryValidationResult
- validateWaterMeasurements(waterSupply, measurementRules) → WaterReadinessResult
- lookupPerformancePoint(datasetRevision, selector) → PerformanceLookupResult
- generateLawnCandidates(geometry, supportedFamilies, layoutRules) → LayoutCandidateSet
- evaluateCoverage(geometry, heads, coverageRules) → CoverageResult
- evaluatePrecipitation(heads, precipitationRules) → PrecipitationResult
- groupHeadsIntoZones(heads, supplyConstraints, zoningRules) → ZoneGroupingResult
- calculatePipeNetwork(network, zoneDemand, hydraulicRules) → HydraulicResult
- validateAssemblyAndCatalogue(parts, compatibilityRules) → AssemblyValidationResult
- calculateLawn(request) → LawnCalculationResult

Every function returns typed errors/warnings; no function silently falls back to a nearest manufacturer point.

## 8. Test strategy and initial acceptance matrix

Tests must be deterministic, run without a model provider or live Sanity, and assert both positive and negative cases. Test fixtures must identify whether values are synthetic, manufacturer-sourced or engineer-reviewed.

### 8.1 Geometry tests

1. Rectangle with confirmed dimensions — computed area equals length × width.
2. L-shaped orthogonal polygon — computed area equals the sum of non-overlapping component rectangles.
3. Multiple separated lawn polygons — areas sum without connecting the regions.
4. Exclusion inside lawn — net irrigable area excludes the exclusion.
5. Exclusion outside/overlapping invalidly — return a validation error or explicit unsupported result.
6. Repeated adjacent vertex — reject or normalize only under a documented safe rule.
7. Self-intersecting polygon — reject.
8. Open ring — normalize by closing only if unambiguous; otherwise reject.
9. Zero-length edge / zero-area polygon — reject.
10. Pixel-only sketch without scale — needs_scale, never calculation_validated.
11. AI-drafted geometry without customer confirmation — needs_geometry_confirmation.
12. Area entered by customer disagrees with polygon area — warning and confirmation gate.
13. Very narrow corridor / unsupported geometry — unsupported_case or needs_engineer_review.

### 8.2 Water measurement tests

1. Static pressure only — insufficient for hydraulic validation.
2. Dynamic pressure without simultaneous flow context — incomplete source operating point.
3. Flow only — insufficient for pressure validation.
4. Simultaneous dynamic pressure + flow at one test point — valid measured operating point, but not a full supply curve.
5. Bucket test: 10 L collected in 30 s — 20 L/min.
6. Zero/negative volume or duration — invalid.
7. Unknown or ambiguous units — invalid; no magnitude-based inference.
8. Pump source without verified pump curve or approved measured-point method — needs_measurement/engineer review.
9. Nominal pipe diameter with no verified internal diameter — pipe-sizing gate remains open.
10. Source test point differs from irrigation manifold — require a documented intervening pipe/component path.

### 8.3 Manufacturer performance tests

1. Exact 3500 lookup at 3.0 bar / nozzle 2.0 — returns the published row: 8.2 m, 7.17 L/min, 13/15 mm/h.
2. 3500 lookup at 2.2 bar — null/unsupported; no interpolation.
3. 3500 lookup at 3.0 bar / nozzle 2.5 — null/unsupported; no nearest nozzle substitution.
4. NaN, infinity, string pressure or invalid nozzle — rejected.
5. Duplicate point key in a dataset — dataset validation fails.
6. Missing source document/revision — dataset cannot be verified.
7. Unverified/blocked dataset — excluded from automatic selection.
8. Integrated assembly plus duplicate standalone nozzle — BOM validation fails.
9. Unknown 3504 package/nozzle-tree contents — product proposal remains blocked pending confirmation.
10. R-VAN without verified 3.1 bar nozzle pressure/body compatibility — excluded from automatic selection.
11. 1802 body with R-VAN — reject until manufacturer compatibility is confirmed.
12. Strip nozzle without orientation and matching strip geometry — unsupported.

### 8.4 Hydraulic and zoning tests

1. Zone demand equals the sum of selected head operating-point flows.
2. Three identical heads at 7.17 L/min produce 21.51 L/min aggregate demand. This is an arithmetic fixture only; it does not prove the source can supply that flow.
3. Zone demand exceeds an approved source constraint — fail or split zones; do not invent a larger supply.
4. Source has only one measured point and requested zone demand differs materially — needs_measurement unless an approved supply model applies.
5. Pipe segment internal diameter missing — hydraulic validation blocked.
6. Elevation gain increases required pressure; elevation drop is handled with the correct sign.
7. Missing fitting data where material — warning/block according to approved ruleset.
8. Residual pressure below selected device requirement — not_feasible or needs_engineer_review.
9. Pressure outside manufacturer table — reject the operating point.
10. Mixed precipitation beyond approved tolerance — reject or require engineer exception.
11. Identical input snapshot + dataset + ruleset versions — deterministic identical output.
12. Change one input or dataset revision — new result ID and trace; prior run remains immutable.

### 8.5 Security and orchestration tests

1. Model returns a pressure or flow value not present in user inputs — value remains unconfirmed and cannot enter a validated run.
2. Model attempts to set result status to calculation_validated — ignored/rejected.
3. Prompt injection in customer notes or retrieved documents — no policy/function escalation.
4. Unknown function name/arguments — server rejects.
5. LLM provider unavailable — intake and deterministic validation remain usable.
6. Catalogue lookup unavailable — engineering result may remain, but commercial proposal is unavailable.
7. Sample/demo knowledge record — excluded from production retrieval.
8. No exact product mapping — return no automatic SKU rather than a guessed alternative.

## 9. Reference fixtures and evidence policy

Maintain three distinct fixture classes:

- manufacturer_fixture: exact row transcribed from a cited manufacturer document;
- synthetic_fixture: generated geometry/measurements for boundary and regression tests;
- engineer_approved_fixture: real or synthetic site independently checked and signed off by a qualified irrigation engineer.

Do not promote an Emergent sample conversation or an AI-generated numerical answer to an engineer-approved fixture.

For each engineer-approved fixture, record:
- reviewer and review date;
- geometry and measurement snapshot;
- source documents and dataset revisions;
- expected result and acceptable numeric tolerance;
- manual calculation or independent tool used;
- known limitations.

## 10. Implementation sequence after design approval

1. Approve geometry schema and initial supported geometry subset.
2. Approve measurement schema and field measurement procedure.
3. Confirm 3504-PC / 3504-PC-SAM package/nozzle-tree contents.
4. Confirm exact 5000 package configurations before including 5000.
5. Confirm 1800/UNI-Spray body/nozzle compatibility matrix.
6. Resolve R-VAN pressure regulation/body restrictions before including R-VAN.
7. Approve hydraulic equations, pipe data, fitting losses, velocity and pressure tolerances.
8. Add schema validators and dataset integrity tests.
9. Implement geometry validation only; review outputs on reference cases.
10. Implement coverage/layout candidate evaluation; review with an engineer.
11. Implement zone and hydraulic solver behind feature gating.
12. Add exact Sanity SKU resolution through the existing trusted server-side catalogue path.
13. Connect AI orchestration only after deterministic contracts and tests are stable.

Do not implement all phases in one change. Each stage should have isolated tests and a reviewable diff.

## 11. Decisions still required

1. Confirm initial geometry solver support: rectangle and orthogonal L-shape only, or multiple separated regions from the first release.
2. Approve coordinate editor behavior and acceptable drawing/scale error.
3. Approve geometry mismatch and coverage tolerances.
4. Define the field procedure for dynamic pressure/flow measurement, including test point and simultaneous conditions.
5. Decide how mains supply is represented when only one dynamic measurement is available.
6. Choose and approve the hydraulic friction method and source data for pipes/fittings.
7. Approve maximum velocity, pressure variation and minimum residual pressure rules by equipment family.
8. Approve precipitation matching tolerance and any allowed exceptions.
9. Confirm exact 3504 and 5000 package/nozzle contents.
10. Confirm which engineer reviews and signs off reference fixtures.

Until these decisions are made, the engine can be designed and tested structurally, but it must not claim validated hydraulic feasibility for real customer sites.

---

## 12. Source references reviewed

Internal Florial:
- docs/engineering/IRRIGATION_ASSISTANT_LAWN_ENGINEERING_SPEC.md
- docs/audits/2026-11-16-irrigation-assistant-rainbird-data-audit.md
- src/lib/irrigation/irrigationPerformanceData.mjs
- tests/irrigation-performance-data.test.mjs
- src/pages/IrrigationAssistantPage.tsx

Manufacturer:
- Rain Bird 3500 Series technical specification, D42378: https://www.rainbird.com/sites/default/files/media/documents/2023-11/d42378_3500_rotor_tech_spec.pdf
- Rain Bird 5000 Series performance chart: https://www-app.rainbird.com/media/4159
- Rain Bird R-VAN metric technical specification, D41159B: https://www.rainbird.com/sites/default/files/media/documents/2025-10/026549_rb_rvantechspecsheet_metric_f.pdf
- Rain Bird HE-VAN performance chart: https://www.rainbird.com/media/4172
- Rain Bird VAN performance chart: https://www.rainbird.com/sites/default/files/media/documents/2020-09/van-series-spray-nozzles-performance-charts.pdf
- Rain Bird 2023 International Turf Catalog: https://www.rainbird.com/sites/default/files/media/documents/2022-11/d42140_2023_intl_turf_catalog_v3_eng.pdf
- Rain Bird 1800 Series bodies: https://www.rainbird.com/products/1800-series-spray-sprinkler-bodies

**Change control:** this document defines contracts and test expectations only. It does not authorize application-code changes, D1 migrations, Sanity schema/data writes, Cloudflare configuration/secrets, LLM provider setup, customer-data transfer or Production release.
