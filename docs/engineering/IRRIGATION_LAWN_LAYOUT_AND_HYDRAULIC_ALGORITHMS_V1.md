# Lawn layout and hydraulic calculation algorithms — design proposal v1.0

**Status:** proposed algorithm design; requires irrigation-engineer approval before implementation  
**Date:** 2026-11-16  
**Parent:** IRRIGATION_LAWN_ENGINE_CORE_DESIGN_V1.md  
**Reviewed main baseline:** a9dc18be8a0d0c2266bd77170c0f8dd6b1ce8219  
**Runtime changes:** none

---

## 1. Purpose and safety boundary

This document defines a deterministic approach for generating and validating lawn sprinkler layouts and evaluating their hydraulic feasibility.

It does not certify an irrigation design and does not select final engineering constants. The algorithms are divided into:
- rules already supported by the current manufacturer data;
- proposed computational methods;
- engineering parameters that must be approved before the result can be called calculation_validated.

The first release should prefer a transparent, constrained solution over a clever but opaque optimizer. If the engine cannot prove a supported layout or hydraulic path, it must return needs_engineer_review or unsupported_case.

## 2. Layout-engine inputs

The layout stage consumes:
- confirmed metric lawn geometry;
- explicit exclusion and obstacle geometry;
- allowed sprinkler installation areas;
- candidate manufacturer families and verified operating-point datasets;
- layout ruleset version;
- site constraints such as overspray-sensitive boundaries;
- optional wind/slope restrictions, if measured and supported.

It does not consume:
- customer-reported area as a replacement for polygon geometry;
- an unscaled image;
- an unconfirmed AI-drafted polygon;
- product title or broad min/max flow as performance data;
- a model-generated head count or coordinate list.

Each candidate head position and operating point must be traceable to the geometry version, rule version and manufacturer dataset row that produced it.

## 3. Geometry preprocessing

Before layout generation:

1. Validate polygon topology and metric scale.
2. Compute net irrigable regions by applying approved exclusions.
3. Build obstacle clearance zones from explicit buffers.
4. Identify boundary segments by role: external edge, shared edge, overspray-sensitive edge, strip edge or unknown.
5. Identify disconnected lawn regions. Do not create a sprinkler connection between disconnected polygons merely because they share one project.
6. Determine whether the geometry is inside the supported layout envelope.

### 3.1 Boundary and obstacle treatment

A geometric exclusion and a spray restriction are not always the same thing:
- a pool/path may be excluded from irrigation and may also be an overspray-sensitive boundary;
- a tree may be an obstacle with canopy/clearance, but its trunk location alone does not define the full no-spray region;
- a planting bed may be excluded from lawn coverage but may have a separate future drip module.

Keep these semantics distinct. Each boundary segment should carry an explicit spray policy:
- no_restriction;
- avoid_overspray;
- spray_toward_region_only;
- engineer_review.

Do not infer spray policy solely from the obstacle label.

### 3.2 Supported first-release geometry

Recommended automatic-layout scope:
- one rectangular lawn region;
- one orthogonal L-shaped lawn region;
- no holes except explicit exclusions;
- no unresolved scale or self-intersection;
- no narrow corridors or complex curves unless the approved layout resolution can validate them.

Multiple independent regions can be represented in the data model but should initially be calculated as separate layout subproblems. A combined project result must still aggregate source demand and zone constraints across regions.

## 4. Candidate sprinkler placement

### 4.1 Candidate generation is not final selection

Generate candidate locations and arcs first, then evaluate them against verified manufacturer performance points and geometry. Do not choose a SKU or price during geometric candidate generation.

Each candidate contains:
- candidateId;
- local x/y position;
- candidate family/model;
- permitted arc/pattern options, only if supported by manufacturer data;
- candidate nozzle and pressure-point references;
- boundary role and intended spray direction;
- placement rule ID;
- provenance and rejection reasons.

### 4.2 Rectangular region strategy

For a simple rectangle, use a constrained perimeter-first strategy:

1. Generate perimeter candidate locations at corners and along edges.
2. Generate inward-facing candidates for boundary coverage, with spray direction constrained by the edge policy.
3. Generate interior grid candidates where required to meet head-to-head spacing and coverage.
4. Evaluate square and triangular grid patterns only where the selected manufacturer's table supports the relevant spacing basis.
5. Remove candidates that violate minimum edge clearance, obstacle clearance, installability or overspray restrictions.
6. Run the coverage validator on the resulting set.
7. If coverage fails, add/shift candidates deterministically and re-evaluate.
8. Return all accepted positions and a concise record of rejected alternatives.

The number of perimeter heads is not fixed in advance. It depends on geometry, selected radius, supported arc behavior, spacing, edge conditions and exclusions.

### 4.3 L-shaped region strategy

Do not treat an L-shape as one rectangle with a guessed extra head.

Proposed method:
1. Decompose the orthogonal polygon into non-overlapping rectangles using a deterministic decomposition rule.
2. Generate candidate layouts for each rectangle.
3. Merge candidates near shared decomposition boundaries.
4. Re-evaluate the merged set against the original L-shaped polygon, not the decomposed rectangles.
5. Remove redundant heads only if coverage remains valid and all spacing/edge rules remain satisfied.
6. If the decomposition creates ambiguous narrow arms or unsupported intersections, return engineer review.

The decomposition and merge algorithm must be deterministic so identical geometry and rule versions produce identical candidate sets.

### 4.4 Arc selection

Arc is a separate engineering decision from location.

A corner head may require a quarter-circle pattern, an edge head a half-circle pattern and an interior head a full-circle pattern in a conventional layout, but this must not be hardcoded as universally valid. The engine may select only arcs and flow adjustments supported by the exact manufacturer data for that device.

For the current 3500 dataset, half-circle operation is recorded as the precipitation table basis. This does not establish every arc's flow or precipitation. Until the manufacturer arc behavior is represented and verified, the 3500 solver must not claim that arbitrary arc settings have exact hydraulic demand. Keep unsupported arc configurations out of automatic validation.

### 4.5 Optimization objective

Use a deterministic lexicographic objective rather than an opaque weighted score:

1. satisfy all hard coverage and safety constraints;
2. minimize uncovered irrigable area and overspray violations (hard violations must be zero for acceptance);
3. minimize head count among equally valid solutions;
4. minimize unnecessary overlap while preserving required head-to-head coverage;
5. minimize hydraulic complexity and number of zones;
6. only after engineering feasibility, compare eligible catalogue alternatives and current commercial values.

A lower product price must never override coverage, precipitation, pressure or compatibility constraints.

## 5. Coverage validation

### 5.1 Two different checks

Coverage validation must distinguish:
- **geometric reach:** whether irrigable sample points are within the declared throw radius of one or more heads;
- **distribution/uniformity:** whether water application is sufficiently even under the manufacturer's test assumptions and the actual selected layout.

A circle-radius model can establish geometric reach only. It cannot prove distribution uniformity or field performance.

### 5.2 Sampling method

For supported simple regions:
1. Generate a deterministic sample mesh over the net irrigable polygon.
2. Include additional samples near boundaries, exclusion edges, narrow sections and obstacle buffers.
3. Calculate distance from each sample to each head.
4. Apply only the declared throw-radius and pattern model for that exact operating point.
5. Record uncovered points, single-coverage areas, overlap counts and overspray intersections.
6. Repeat at a finer mesh resolution and compare results to detect resolution sensitivity.

Mesh spacing and convergence tolerance must be set in the versioned layout ruleset and approved against reference sites. Do not choose a resolution solely for speed.

### 5.3 Head-to-head spacing

The manufacturer's published spacing basis governs the maximum design spacing. For the current 3500 source table, the dataset records square and triangular spacing as 50% of throw diameter. This corresponds to the tabulated radius as a nominal spacing basis, but the layout engine must preserve the original manufacturer statement and apply the exact table/model context.

Do not assume all Rain Bird families share the same spacing rule. Store spacing basis and conditions with each family/dataset revision.

### 5.4 Distribution uniformity

Do not report Christiansen DU, low-quarter distribution uniformity or equivalent field performance based only on circles and nominal precipitation rates.

If a future model estimates distribution, it must:
- identify the manufacturer's distribution data or an approved mathematical model;
- state the tested sprinkler spacing, arc and wind conditions;
- validate against catch-can or engineer-reviewed reference data;
- distinguish simulated estimates from measured field uniformity.

For v1, report geometric coverage and manufacturer precipitation compatibility, not a fabricated DU percentage.

## 6. Precipitation compatibility

Each head contributes a precipitation value with a defined basis (square/triangular, arc/test configuration and manufacturer conditions).

For every proposed zone:
1. determine the precipitation basis applicable to each selected head;
2. compare rates only where the basis and test conditions are compatible;
3. calculate a zone spread metric using an approved method;
4. compare against an engineer-approved tolerance;
5. reject or flag mixed families/configurations where the evidence does not support a valid comparison.

Do not average square and triangular precipitation values together. Do not compare a strip nozzle's area application with a circular nozzle using only one nominal radius. Do not use a universal percentage threshold until the engineer approves it.

## 7. Zoning strategy

### 7.1 Grouping constraints

A zone may contain only heads whose:
- required operating pressure is compatible;
- precipitation/application family is compatible under the approved rule;
- control/valve arrangement is compatible;
- total flow is within the verified source and network envelope;
- residual pressure remains acceptable at the hydraulically worst device.

Grouping by total flow alone is insufficient. Two heads can have a low combined flow and still be incompatible due to pressure or precipitation requirements.

### 7.2 Deterministic grouping

Proposed v1 grouping:
1. Partition heads into compatibility groups by family, required pressure range, precipitation basis and control constraints.
2. Calculate total demand for each candidate group from exact manufacturer flow points.
3. Evaluate each group through the hydraulic network model.
4. If a group fails only due to source flow/pressure, attempt deterministic partitioning into smaller zones.
5. Recalculate each proposed zone independently and then validate simultaneous/non-simultaneous operation assumptions.
6. Return the smallest number of zones only among solutions that pass every hard engineering constraint.

The algorithm must not assume that all zones run simultaneously. Controller scheduling and source recovery are separate operational constraints.

### 7.3 Flow aggregation

For a zone with heads i = 1..n:

Q_zone = sum(Q_i)

This is a demand calculation, not proof of available source capacity.

For example, three heads at 7.17 L/min each produce 21.51 L/min of nominal demand. Whether the supply can maintain the required pressure at that flow depends on the measured source characteristic and the pipe network.

## 8. Hydraulic network model

### 8.1 Graph representation

Represent the water path as a directed rooted graph:
- nodes: source/test point, pump, tank, filter, meter, backflow device, regulator, valve, junction and sprinkler head;
- edges: pipe segments or components with verified hydraulic characteristics;
- source boundary: measured or manufacturer-supported pressure/flow relationship;
- demand nodes: selected sprinkler operating points.

For the first release, restrict automatic pipe-network solving to a tree (branched network without closed loops). A looped network requires a network solver and separate validation; it must not be approximated as a tree without owner/engineer approval.

### 8.2 Segment flow

For a tree network, flow in a segment is the sum of all downstream head demands:

Q_segment = sum(Q_head for all heads downstream of segment)

Use a consistent unit conversion before applying the friction equation. Do not use nominal pipe diameter where internal diameter is required.

### 8.3 Friction and minor losses

The engine must support a documented, versioned hydraulic method. Candidate methods for engineer review:

- Darcy–Weisbach, with Reynolds number, verified internal diameter, water properties and a documented friction-factor method/roughness basis;
- Hazen–Williams, with documented material-specific C coefficient, valid range and unit convention.

Do not mix coefficients or formulas from incompatible unit systems. The choice of method and its applicability must be explicit in the ruleset. Minor losses require documented fitting/component coefficients or manufacturer pressure-drop data. If a material restriction has no verified loss data, mark the segment incomplete rather than assigning zero loss.

### 8.4 Elevation and pressure budget

For a path from the reference measurement point to a sprinkler:

P_nozzle = P_reference_dynamic
           - ΔP_pipe_friction
           - ΔP_minor_losses
           - ΔP_components
           - ΔP_elevation

For water, the hydrostatic pressure change is approximately 0.0980665 bar per metre of elevation gain. Use the signed elevation difference: an uphill rise reduces available pressure; a downhill drop increases static pressure at the lower point. The exact implementation must document its reference direction and unit conversions.

The calculation trace must expose each term. Never subtract the same component loss twice or omit a component because its SKU is unknown.

### 8.5 Source pressure-flow relationship

The source boundary is not automatically a constant-pressure source.

Supported source models may include:
- measured operating point plus an explicitly approved method for the intended demand;
- verified pump curve with pump configuration and operating limits;
- validated mains-supply model based on adequate measurements and engineer-approved assumptions;
- gravity tank model with water-level range and pipe path.

A single dynamic pressure/flow measurement is one point. Do not extrapolate it into a curve. If planned zone flow differs materially from the measured flow and no approved source model exists, return needs_measurement or needs_engineer_review.

### 8.6 Residual pressure check

At each sprinkler, calculate available inlet pressure after all upstream losses and compare with the exact selected manufacturer's operating point.

The zone passes only if:
- each head has a supported performance point at the calculated inlet pressure;
- the required pressure is met at the worst-case head;
- component pressure limits are respected;
- velocity and pressure-loss rules pass;
- source capacity is supported by the approved source model;
- all required measurements and pipe characteristics are available.

Do not use a source pressure value as a substitute for nozzle inlet pressure.

## 9. Pipe sizing strategy

Pipe sizing should be a constrained candidate evaluation, not a free-form AI recommendation.

For each segment:
1. enumerate only verified Florial pipe SKUs/materials with known internal diameter and pressure rating;
2. calculate flow, velocity and losses for each candidate diameter;
3. reject candidates outside approved velocity, pressure-loss and pressure-rating limits;
4. select the smallest eligible size only if all constraints pass;
5. otherwise return needs_engineer_review.

Do not hardcode generic nominal-to-internal diameter mappings. Do not infer pressure rating from product title. The first release should not size a segment when its material, internal diameter or relevant fittings are unknown.

## 10. Result diagnostics and explainability

The engine should return structured diagnostics at every stage:
- candidate heads considered and rejected with reason codes;
- coverage gaps and affected geometry samples;
- spacing violations;
- precipitation incompatibilities;
- zone demand and source operating-point comparison;
- segment flow, velocity and loss;
- worst-case path and residual pressure;
- missing pipe/component data;
- unsupported manufacturer configurations;
- exact dataset and ruleset references.

The customer-facing explanation can be concise. The engineer report must preserve the full trace.

## 11. Algorithm acceptance scenarios

### 11.1 Layout

1. Rectangle that fits a verified head-to-head grid — stable candidate positions and zero uncovered samples at the approved mesh resolution.
2. Rectangle with an exclusion strip — layout avoids the strip and checks adjacent lawn coverage.
3. L-shape — decomposition/merge result passes against original polygon.
4. Two separated lawn regions — no cross-region head placement; demands remain separately traceable.
5. Narrow arm below supported spacing — unsupported/engineer review, not a guessed head placement.
6. Boundary overspray restriction — candidate spraying outside restricted polygon is rejected.
7. Unsupported arc behavior — candidate rejected even if its nominal radius appears sufficient.
8. Change mesh resolution — convergence check detects a materially different coverage result.
9. Candidate removal — engine revalidates all constraints before accepting fewer heads.
10. Identical inputs/rules/datasets — identical candidate ordering and result.

### 11.2 Zoning and hydraulics

1. Three 7.17 L/min heads — zone demand equals 21.51 L/min; source feasibility remains unknown without supply model.
2. Two heads with incompatible pressure requirements — they are not grouped merely because their flow sum fits.
3. Zone split resolves flow demand but one zone still fails pressure — return failure/review.
4. Source test flow differs from proposed zone flow — require approved source model or new measurement.
5. Pipe internal diameter unknown — no hydraulic pass.
6. Elevation rises 5 m — pressure budget includes approximately 0.4903 bar elevation penalty, before friction/component losses.
7. Elevation drops 5 m — signed elevation term is applied in the opposite direction.
8. Missing filter loss data — hydraulic result is incomplete, not zero-loss.
9. Small pipe violates approved velocity limit — reject candidate diameter.
10. Worst-case head has insufficient residual pressure — zone fails.
11. Closed-loop pipe network supplied to tree-only solver — unsupported_case.
12. Pump curve outside verified speed/impeller/configuration — reject source model.
13. Mixed precipitation beyond approved tolerance — require separate zones or engineer exception.
14. Product has no exact catalogue binding — no automatic BOM item.

### 11.3 Numerical unit fixtures

- Bucket test: 10 L / 30 s = 20 L/min.
- Three-head demand: 3 × 7.17 = 21.51 L/min.
- Elevation: 5 m water column ≈ 0.4903325 bar.
- These are arithmetic/unit fixtures only; they do not constitute a design or source-capacity claim.

## 12. Engineering decisions required before hydraulic implementation

1. Select Darcy–Weisbach or Hazen–Williams for the first release and define the valid operating envelope.
2. Approve friction-factor/roughness or C-coefficient sources for each pipe material.
3. Approve minor-loss coefficients or manufacturer pressure-drop data for fittings, filters, meters, backflow devices, regulators and valves.
4. Approve velocity limits by pipe material/size and intended use.
5. Approve allowable pressure variation and minimum residual pressure for each supported sprinkler family.
6. Approve source modelling rules for mains, wells, pumps and gravity tanks.
7. Approve how much deviation between measured test flow and proposed zone flow requires a new field test.
8. Approve the coverage mesh resolution, convergence tolerance and boundary/obstacle clearance rules.
9. Approve precipitation matching tolerance and any documented exceptions.
10. Confirm supported arc behavior and flow adjustment for each selected model/nozzle family.
11. Confirm the exact 3504 package/nozzle-tree contents and exact 5000 product configuration.
12. Confirm whether automatic layout begins with rectangle only or rectangle plus orthogonal L-shape.

Until these decisions are approved, the engine may validate schemas, geometry and manufacturer table lookup, but it must not mark a real hydraulic design as calculation_validated.

---

## 13. Source documents

- docs/engineering/IRRIGATION_ASSISTANT_LAWN_ENGINEERING_SPEC.md
- docs/engineering/IRRIGATION_LAWN_ENGINE_CORE_DESIGN_V1.md
- docs/audits/2026-11-16-irrigation-assistant-rainbird-data-audit.md
- src/lib/irrigation/irrigationPerformanceData.mjs
- tests/irrigation-performance-data.test.mjs
- Rain Bird 3500 technical specification D42378: https://www.rainbird.com/sites/default/files/media/documents/2023-11/d42378_3500_rotor_tech_spec.pdf

**Change control:** design proposal only. No production source, catalogue, database, secrets or deployment changes are authorized by this document.
