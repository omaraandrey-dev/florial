# Engineering specification — lawn irrigation assistant (Rain Bird first)

Status: approved direction / engineering design, not yet an implemented calculator  
Date: 2026-11-15  
Project: Florial Bulgaria  
Scope: first calculation module — automatic lawn irrigation

## 1. Product goal

Turn the existing intake wizard into a trustworthy guided design flow for automatic lawn irrigation, using Rain Bird equipment represented in the published Florial Sanity catalogue.

The assistant must collect measurable site and water-supply data; ask for missing information before calculation; calculate coverage, sprinkler/nozzle operating points, zones and hydraulic feasibility with deterministic application code; map only verified outputs to exact compatible published Sanity SKUs; resolve current price and stock from Sanity; and provide a reviewable bill of materials, cart handoff and engineer escalation.

This is not an AI-generated design and not a promise that every site can be designed remotely.

## 2. Assistant launcher visibility — explicit owner requirement

The floating launcher and specialist portrait may appear only on:
1. irrigation equipment catalogue category pages (/category/...) belonging to the equipment catalogue, including the irrigation root and all descendants;
2. irrigation equipment product pages (/product/... or /products/...) after the product is resolved and confirmed not to be a plant;
3. the service direction page /services/category/polivni-sistemi;
4. individual irrigation-related service pages whose published Sanity serviceCategory is irrigation, maintenance or delivery, including /services/dostavka-poliv.

It must not appear on the homepage, plant categories/products, blog, contacts, about, general services directory, landscaping/planting/lawn service pages, cart, search or the assistant page itself.

Route decisions must use resolved Sanity category/product/service data where applicable, not fragile substring guesses over category slugs. While a relevant route is loading and its type is unresolved, keep the launcher hidden. Recompute visibility on route changes and browser back/forward. Fetch the portrait only while eligible and clear it when leaving eligible sections. Do not change Header, menu or Footer.

## 3. Customer journey and required data

### A. Site geometry
Required: polygon or connected polygon regions, not area alone; dimensions/coordinates and units; boundaries and no-water areas; obstacles (buildings, paths, driveways, trees, beds, pools); optional elevation points/slope.

Preferred UX: simple 2D grid editor, vertices and exclusion zones, with at least one known dimension to establish scale. Guided rectangle and L-shape fallback. Never derive exact geometry from an unscaled photo. Any AI interpretation of a drawing is only a draft until the customer confirms scale and dimensions.

### B. Water source and hydraulics
Collect source type (mains, well/borehole, tank, pump or unknown); measured dynamic flow rate and method; dynamic pressure at a defined test point while flowing; static pressure separately if available; supply pipe internal diameter/material/length; elevation difference; pump data and restrictions such as filters, meters and backflow devices.

Explain that static pressure alone is insufficient. If dynamic pressure/flow or pipe data is missing, allow only a preliminary layout; hydraulic feasibility cannot be marked confirmed.

### C. Design constraints
Collect lawn use/type and objective; slope and exposure/wind where relevant; existing pipework/valves/controllers; power availability and controller preference; installation constraints and optional budget. Ask for contact details and consent only when sending a request to Florial.

### D. Result review
Show geometry and assumptions; sprinkler positions/model/nozzle/arc/operating point; coverage/spacing checks and blind-spot/overspray warnings; zones with per-zone flow/pressure; pipe network, lengths, diameters and losses; valves/controller/accessories; unresolved measurements and status; live catalogue links/prices/stock and subtotal; clear distinction between indicative and engineer-reviewed design.

## 4. Deterministic calculation engine — engineering source of truth

Gemini must not invent or directly decide sprinkler coordinates, arcs, spacing, quantities, nozzle/rotor flow, radius, pressure, precipitation, zone flow limits, pipe diameters/losses, component compatibility, availability or prices. These must come from versioned Florial code and curated manufacturer data.

Calculation pipeline:
1. validate and normalize geometry, dimensions, units and exclusion zones;
2. generate candidate sprinkler positions and Rain Bird families;
3. evaluate arcs, radius and head-to-head coverage against manufacturer performance points;
4. reject candidates outside verified pressure/radius/flow ranges;
5. calculate precipitation and check zone uniformity; do not mix materially different precipitation families without documented engineering exception;
6. group sprinklers into zones under measured dynamic flow and pressure limits;
7. calculate segment flow and friction/minor losses using a documented hydraulic method and verified pipe internal diameters, lengths, fittings and elevation;
8. verify residual pressure at the hydraulically worst sprinkler and each valve;
9. select valves, controller and accessories only where exact compatibility is verified;
10. resolve every selected item to a published Sanity SKU, current price and stock status;
11. return a traceable report with data-source/version IDs and warnings.

Every result records engine/rule-set version, input snapshot and units, exact manufacturer source/revision, exact model/SKU and performance point, assumptions/warnings, and calculation trace for engineering review.

No result may be marked design_ready if a mandatory validation fails or a required input/specification is unknown.

## 5. Rain Bird technical catalogue dataset

The read-only Production inventory checkpoint recorded:
- irrigation root category vsichko-za-polivane, Sanity ID 7f6eaa30-8085-4fae-be3c-1209a0c50fc6;
- sprinkler category sprinklers, ID de7ecefe-0a25-41ed-8146-ce475efb2378, 20 active published products;
- nozzle category nozzles, ID ad3914b4-5ab0-49e3-868a-52621c4654a7, 26 active published products;
- all 46 inspected sprinkler/nozzle records had a published price but stockStatus onRequest;
- product records had productType null; equipment membership is determined through category references, not productType.

Important gaps: specifications are not uniform; many nozzle records lack complete manufacturer performance data; some rotor data is expressed as ranges rather than tested operating points; 1800 bodies and separately selected nozzles must be represented as compatible components, not one assumed complete sprinkler; exact model/version/SKU must map to the correct manufacturer table row.

Before a SKU can be offered automatically, curate: Sanity product ID/SKU/published status; manufacturer/family/exact model/component type; body/nozzle compatibility; supported pressure range and discrete operating points; radius/flow/arc/precipitation; manufacturer source URL/document revision/date/reviewer; verification status verified/incomplete/blocked.

Do not modify published Sanity product data or schema in this specification stage. Prepare a versioned code-owned dataset first, or propose a separate Sanity schema change with backup and approval.

### Manufacturer references already collected
- Rain Bird 3500 Series Rotor Technical Specification: https://www.rainbird.com/sites/default/files/media/documents/2023-11/d42378_3500_rotor_tech_spec.pdf
- Rain Bird 5000 Series Rotor Performance Charts: https://www.rainbird.com/sites/default/files/media/documents/2020-09/5000-series-rotor-nozzle-performance-chart.pdf
- Rain Bird R-VAN Nozzle Performance Charts: https://www.rainbird.com/sites/default/files/media/documents/2020-09/r-van-nozzles-performance-charts.pdf
- Rain Bird HE-VAN Series Performance Charts: https://www.rainbird.com/sites/default/files/media/documents/2018-02/chart_HE-VAN.pdf
- Rain Bird 1800 Series Spray Sprinklers: https://www.rainbird.com/products/1800-series-spray-sprinkler-he-van-nozzles
- Rain Bird 5000 Series product specifications: https://www.rainbird.com/products/5000-series

Only families with complete verified data and exact catalogue mapping may enter the automatic selector.

## 6. Gemini role and request contracts

Gemini is the conversation/interpretation layer, not the hydraulic solver.

Responsibilities:
- classify natural-language answers;
- identify missing or contradictory inputs;
- formulate the next concise clarification question;
- interpret a customer drawing as draft geometry with confidence/ambiguities; require customer confirmation;
- explain deterministic calculation results in BG/RU/EN;
- translate engineer warnings into customer language;
- call narrowly scoped permitted Florial functions through Function Calling.

Gemini must not publish Sanity content, change prices/stock, place orders or bypass cart validation.

Suggested request sequence:
1. intake.normalize — normalize answers into strict schema and report missing/invalid fields;
2. intake.next_question — return one next question with reason and accepted units;
3. geometry.interpret — propose geometry from drawing/photo and return confidence/ambiguities;
4. design.explain — explain an already calculated and validated result using only supplied facts;
5. support.answer — answer from curated Florial/Rain Bird context, not open-ended model memory.

Use structured JSON output for contracts and Function Calling only for narrowly scoped server functions. Validate model output against runtime schemas and domain rules; reject unknown fields, out-of-range values, unsupported units, invented SKU IDs and model-supplied prices. Store prompt/schema versions in GitHub. Treat customer notes, uploaded drawings and retrieved Sanity descriptions as untrusted data, never as instructions.

Example normalization response:
    {
      "status": "needs_more_information",
      "normalized": {"units": "metric", "water_source": "mains"},
      "missing": ["dynamic_flow_lpm", "dynamic_pressure_bar", "confirmed_geometry"],
      "contradictions": [],
      "next_question": "Can you measure the flow rate while water is running?",
      "calculation_allowed": false
    }

## 7. Cloudflare and security architecture

React sends minimum customer input to a dedicated Cloudflare Pages Function. The function validates payload size/schema/units, rate limits abuse, and constructs system instructions plus curated catalogue context server-side. Gemini key is a Cloudflare server-side secret, never in Vite/client bundles, HTML, logs or Git.

Do not send contact details, order data or unrelated personal information to Gemini. Do not use the free Gemini API tier for production customer data without a reviewed privacy decision. Prefer a paid Gemini API project for production; verify current terms, DPA, region and retention before launch. Official references: https://ai.google.dev/gemini-api/docs/structured-output, https://ai.google.dev/gemini-api/docs/function-calling, https://ai.google.dev/gemini-api/docs/pricing and https://ai.google.dev/gemini-api/terms.

Apply per-session/IP limits, timeouts, token/output budgets, retry ceilings and cost ceilings. Log request ID, model, prompt/schema version, latency, token usage, validation outcome and error class; redact customer free text and personal data. Deterministic forms/calculations must remain usable if Gemini is unavailable.

## 8. Proposed API boundary (names provisional)

- POST /api/irrigation-assistant/intake — normalize/validate answers and return missing fields;
- POST /api/irrigation-assistant/geometry — validate customer-confirmed geometry;
- POST /api/irrigation-assistant/calculate/lawn — deterministic calculation;
- POST /api/irrigation-assistant/explain — Gemini explanation of validated result;
- GET /api/irrigation-assistant/catalogue — verified SKUs and live commercial data.

Do not implement all endpoints at once. Start with intake/clarification only after contracts and privacy/cost controls are approved. Reuse trusted server-side catalogue/cart mechanisms; do not duplicate price logic.

## 9. Validation and acceptance tests

Build versioned synthetic and engineer-reviewed reference cases: rectangle; L-shape; narrow strip; separated lawn areas; building/path/tree exclusions; irregular polygon; elevation difference; low-flow source; adequate flow but insufficient dynamic pressure; incomplete/misleading measurements; geometry outside supported envelope.

Assert coverage/exclusion boundaries, manufacturer operating points, flow/pressure/loss calculations, zone limits, no unsupported SKU/compatibility, deterministic repeatability, and correct needs_measurement / needs_engineer / not_feasible outcomes.

An irrigation engineer must review rules and baseline cases before automatic customer-facing recommendations. Run a supervised real-site pilot before enabling add-to-cart.



## Implementation status — 2026-11-16

- Stage 1 (launcher visibility and portrait source): implemented and released in PR #303; exact Production deployment and route QA are recorded above in the Technical Passport/Changelog.
- Stage 2 (Rain Bird performance data): R-VAN and HE-VAN discrete datasets and SKU references are implemented. Rain Bird 3500 data exists in the repository, but it is not yet eligible for placement-solver use because arc-specific precipitation interpretation, nozzle-tree/package mapping and overspray handling are unresolved.
- Stage 3 (geometry intake/validator): confirmed metric rectangle and orthogonal L-shape intake and deterministic geometry validation are implemented.
- Stage 4 (geometry/coverage): first deterministic sampled placement engine is implemented for separate R-VAN and HE-VAN configurations and merged in PR #317. This is not a continuous coverage proof or approved irrigation design; hydraulic feasibility, DU/SC, overspray, wind and body/nozzle compatibility remain unevaluated.
- Stage 5 (hydraulic zones and pipe losses): not started. Begin only after the design inputs and validated sprinkler layouts can supply measured dynamic flow/pressure, actual pipe dimensions/material/lengths, valves/filters/regulators/fittings, elevation and zone constraints.
- Before extending automatic selection, obtain engineer-reviewed reference layouts and establish a defensible precipitation-uniformity method. Do not infer layout DU/SC from average precipitation values alone.



### Acceptance hardening — 2026-11-16

- PR #319 strengthens scenario tests to require 100% sampled coverage and zero uncovered points for 12m rectangles at 4/5/6/8m widths and for mirrored/rotated/reversed L-shapes. The baseline rectangle and L-shape are also checked at 0.125m sampling resolution.
- These tests do not prove continuous coverage or uniformity. The engine remains a code library: the current `IrrigationAssistantPage.tsx` collects and validates geometry but does not call the layout solver. Customer-facing layout recommendations remain gated on engineer-reviewed reference layouts, exact manufacturer compatibility, overspray and hydraulic validation.



### Field-measured uniformity utility — 2026-11-16

- PR #321 adds a code-owned utility for measured DUlq from catch-can volumes/depths. It uses the lowest-quarter mean divided by the mean of all samples, warns below 24 cans and assumes equal-area weighting.
- This does not estimate a future layout's uniformity, does not calculate SC or net precipitation rate, and does not replace a field audit. The solver's `precipitationUniformity` remains `not_evaluated`.
- A future field validation needs an engineer-reviewed catch-can grid and recorded sprinkler/nozzle model, arc, nozzle pressure, run time, wind conditions, sample spacing and readings. Non-uniform represented areas need a weighted calculation before DUlq can be trusted.



### Initial Production browser smoke — 2026-11-16

- Read-only Production browser QA confirmed the initial assistant geometry step loads in BG/RU/EN from the public automatic-irrigation service page. No runtime errors were observed. Only the initial state was inspected; no geometry or other data was submitted.
- Later steps and responsive viewport QA remain open. This does not authorize customer-facing solver output; the placement engine is not yet called by the page.

## 10. Delivery stages

1. Complete launcher visibility rules and portrait source.
2. Audit exact sprinkler/nozzle SKUs and manufacturer tables; publish versioned verified dataset.
3. Design and implement geometry editor and intake schema.
4. Implement/test deterministic geometry and coverage engine.
5. Implement hydraulic zones and pipe-loss solver.
6. Integrate verified Sanity catalogue data and live price/stock.
7. Add Gemini intake/clarification and result explanation on paid API tier.
8. Add cart integration, project PDF and engineer handoff after acceptance tests.
9. Extend to drip irrigation, trees/shrubs and pumps/water supply as separate modules.

## 11. Explicit non-goals for this stage

No AI-only irrigation design; no compatibility inferred from descriptions; no Gemini-generated prices/stock; no automatic Sanity publishing/editing; no D1 schema changes or production order writes; no Gemini key/Cloudflare secret/binding changes; no Header/menu/Footer changes; no recommendations for SKUs with incomplete manufacturer data.
