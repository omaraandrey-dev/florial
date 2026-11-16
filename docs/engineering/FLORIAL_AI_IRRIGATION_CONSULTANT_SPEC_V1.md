# Florial AI Irrigation Consultant — technical specification v1.0

**Status:** draft for owner review; architecture and requirements specification, not implementation approval  
**Date:** 2026-11-16  
**Repository baseline:** `main` at `a9dc18be8a0d0c2266bd77170c0f8dd6b1ce8219`  
**Target:** existing Florial Bulgaria website and engineering workflow  
**Languages:** BG (primary), RU, EN  
**Currency:** EUR  
**Production architecture:** React/TypeScript + Cloudflare Pages/Functions + Cloudflare D1 + Sanity + Resend. Supabase is excluded.

---

## 1. Purpose and product vision

Build an engineering-grade irrigation consultation service inside the existing Florial website. It should guide a customer from an initial question and site description to a traceable preliminary irrigation concept, a technically validated calculation where the available data permits it, an equipment list grounded in the published Florial catalogue, and (when needed) a request for review by a Florial irrigation specialist.

The Emergent prototype is evidence for useful conversational UX and progressive intake. It is not a production architecture, verified knowledge base, hydraulic solver, or source of manufacturer specifications. Reuse selected interaction ideas only; do not import its FastAPI/MongoDB/Gemini-specific runtime into Florial.

The system is not an AI that independently designs irrigation. It is a coordinated product consisting of:
1. a guided customer interface;
2. a conversational AI orchestration layer;
3. deterministic, versioned engineering calculation modules;
4. curated manufacturer and Florial knowledge;
5. a server-side catalogue and commercial-data adapter;
6. a specialist handoff integrated with the existing Florial Manager.

## 2. Governing principles

1. **Engineering truth is deterministic.** Geometry, sprinkler placement, performance points, coverage, hydraulic losses, zone flow, compatibility and quantities are calculated by versioned Florial code using verified source data.
2. **AI is an assistant, not a solver.** It interprets language, collects and normalizes inputs, identifies gaps and contradictions, asks clarifying questions, invokes approved functions, and explains returned results. It must not invent technical values.
3. **Evidence and uncertainty are visible.** Every input has units, source/provenance and confidence. Every calculated output has an engine version, source-data revision, assumptions and warnings.
4. **No false readiness.** Missing mandatory measurements, unsupported geometry, unverified equipment or failed hydraulic checks prevent a design from being marked ready.
5. **One Florial platform.** Use the existing website, catalogue, Manager, D1 and Sanity. Do not create a second shop, CRM, user database or product-price system.
6. **Provider independence.** Keep the LLM behind a provider adapter. The product must remain usable for deterministic intake and calculation if the model provider is unavailable.
7. **Localized experience.** BG is the default customer language; RU and EN are full supported experiences. Engineering units are metric.
8. **Privacy by minimization.** Do not send names, telephone numbers, emails, order data or unrelated personal information to an LLM.

## 3. Scope and release boundaries

### 3.1 v1 customer-facing scope

The first engineering module is **automatic lawn irrigation**, initially limited to supported Rain Bird families and only those operating configurations for which verified performance data and exact Florial catalogue mapping exist.

v1 should deliver:
- guided lawn-project intake and conversational clarification;
- confirmed site geometry, including boundaries and exclusions;
- water-source and measured hydraulic inputs;
- a deterministic preliminary geometry/coverage and hydraulic calculation for supported cases;
- transparent unsupported / missing-data / engineer-review outcomes;
- an equipment proposal mapped to exact published Sanity products where compatibility is verified;
- live price lookup from the existing server-side catalogue path; honest stock wording;
- a reviewable project summary and a consented specialist handoff;
- BG/RU/EN customer explanations.

### 3.2 Later modules — not part of the first lawn calculation release

Build as separate engineering modules with separate datasets and acceptance suites:
- drip irrigation for beds, hedges and planting areas;
- trees, shrubs and mixed landscape zones;
- pumps, tanks, wells and source-water equipment;
- commercial / sports / large-area irrigation;
- maintenance, troubleshooting and optimization.

Do not force these use cases into the lawn solver by adding loosely related fields. Shared primitives (geometry, water source, pipe network, catalogue references, project and audit records) may be reused after their semantics are established.

### 3.3 Explicit non-goals

- AI-only or prompt-only irrigation design.
- Automatically choosing products from title/description similarity.
- Invented manufacturer data, interpolation or extrapolation without an approved rule.
- Treating static pressure as proof of working pressure.
- Treating a published `onRequest` stock state as confirmed stock.
- Automatic Sanity publication, price changes or stock changes.
- Direct order placement or cart mutation by an LLM.
- Creating a separate CRM or parallel employee panel.
- Production D1 migrations, secrets, bindings, Sanity schema/data writes or deployment as part of this specification.
- Replacing Florial navigation, Header, menu, Footer or global layout.

## 4. Existing Florial foundation and known evidence

The following are present in the repository baseline or documented in the current engineering records:

- `src/pages/IrrigationAssistantPage.tsx`: localized three-step intake wizard and summary. It currently gathers shape/area, water source, optional flow and pressure, and notes. It is an intake starting point, not a calculation engine.
- `src/lib/irrigation/irrigationPerformanceData.mjs` and `.d.mts`: versionable Rain Bird performance data interface and 3500 dataset.
- `tests/irrigation-performance-data.test.mjs`: validation coverage for the current performance data module.
- `docs/engineering/IRRIGATION_ASSISTANT_LAWN_ENGINEERING_SPEC.md`: governing first-module engineering direction.
- `docs/audits/2026-11-16-irrigation-assistant-rainbird-data-audit.md`: read-only manufacturer/catalogue readiness audit.
- `docs/prototypes/emergent-irrigation-assistant/` is preserved in `main` as an isolated prototype evidence archive (PR #312, merge commit `7a4e4b03d10b4df9d3123f268c31e4c4b594e2b2`); the captured files remain partial source snapshots, not production code.
- The irrigation assistant launcher scope was introduced and deployed separately. Its current visibility restrictions must be preserved.

### 4.1 Rain Bird 3500 dataset facts

The current code-owned dataset contains 36 discrete manufacturer operating points: six pressure values (1.7, 2.0, 2.5, 3.0, 3.5, 3.8 bar) crossed with six nozzle sizes (0.75, 1.0, 1.5, 2.0, 3.0, 4.0). Each point carries radius, flow and square/triangular precipitation. The lookup function intentionally requires an exact pressure/nozzle match; it does not interpolate, extrapolate or silently choose a nearest point.

The dataset maps two Florial products: 3504-PC (SKU Y34001) and 3504-PC-SAM (SKU Y34500). Exact supplied nozzle-tree/package contents still require confirmation before a complete assembly can be recommended.

### 4.2 Catalogue readiness limitations

A recent published Sanity inventory audit inspected 20 sprinkler products and 26 nozzle products. The inspected records had published prices but `stockStatus: onRequest`; this is not a guarantee of physical availability. Product membership is resolved through category references, not `productType`, which was null on the inspected records.

The audit identifies family-specific constraints:
- 3500: exact installed nozzle/package mapping must be confirmed.
- 5000: exact rotor + installed nozzle configuration must be confirmed.
- 1800 / UNI-Spray + HE-VAN / VAN / strip: model the body and nozzle as either an integrated assembly or compatible separate components; never double-count a nozzle.
- R-VAN: do not automatically select until the required nozzle pressure and body/regulation compatibility are verified.
- 8005 and Falcon 6504: keep outside the first residential lawn candidate set until their exact datasets and use cases are curated.

The complete current SKU mapping and unresolved items remain in the Rain Bird audit. This specification does not certify product compatibility or authorize Sanity writes.

### 4.3 Emergent prototype audit — lessons retained

The owner supplied the files available from the free Emergent environment. The reviewed material covered Pydantic chat/site/document/lead models; FastAPI chat, document and lead routers; MongoDB persistence/index setup and seed data; Gemini streaming/prompt construction; keyword retrieval; and the React chat page, routing, API/SSE client, message composer, history, parameter panel, knowledge/lead UI and styling.

Observed implementation characteristics:
- The prototype backend is FastAPI + MongoDB and uses an Emergent-specific Gemini integration. These are not Florial runtime dependencies and are not to be ported as a backend.
- The frontend demonstrates useful progressive intake, streaming chat, sample conversations, a parameter side panel and specialist escalation. Reuse interaction concepts only after adapting them to Florial localization, accessibility and current React conventions.
- The prototype's manually mirrored frontend/backend types can drift. Florial should validate shared contracts at runtime and keep inferred TypeScript types aligned to the schemas.
- The reviewed keyword retrieval is not semantic retrieval and uses simplistic token stemming. More importantly, it selects active knowledge documents without excluding `is_sample`; prototype seed examples can therefore enter retrieval. Production retrieval must exclude sample/demo, unverified, obsolete and blocked material by default.
- The reviewed prototype document and lead routes showed no adequate authentication/ownership boundary. Conversation, document and lead access must be secured server-side; UI-only restrictions are insufficient.
- The prototype CORS default was wildcard with credentials enabled. Florial must use an explicit origin allowlist.
- The prototype's LLM metadata is extracted from generated text using regex/JSON parsing and merges model-supplied site fields. Florial must use structured contracts, strict runtime validation, domain bounds and explicit user confirmation for uncertain extracted values.
- The prototype's SSE client/parser has limited framing, buffering, cancellation and reconnect behavior. Any Florial streaming contract must explicitly define event framing, cancellation, disconnect handling, finalization, errors and retry semantics.
- The prototype's lead form and confirmation do not prove that a specialist was notified. Florial must distinguish request persistence, notification acceptance and human follow-up.
- The seed knowledge includes illustrative agronomic/hydraulic statements. These are examples, not approved engineering reference data or golden test results.

The source material supplied in chat is broader than the two source snapshots currently proposed in PR #312. The complete Emergent export, package manifests/lockfile, dependency licenses, deployment configuration and any missing source files remain unverified. Do not claim a full-project source audit or dependency/license clearance.

### 4.4 Reuse / replace decision

| Prototype element | v1 decision |
|---|---|
| Conversational UX, progressive questions, sample walkthrough concept | Adapt selectively |
| Chat bubbles, composer, history and parameter summary | Rebuild/adapt using Florial components and localization |
| FastAPI, MongoDB, Emergent SDK and persistence | Replace with existing Cloudflare Pages Functions / D1 patterns where approved |
| Gemini-specific prompt and streaming integration | Replace with provider-neutral adapter and strict function contracts |
| Prototype keyword RAG and sample seed documents | Do not port; curate verified Florial sources and retrieval filters |
| Public knowledge editor and lead listing | Do not port; use existing Manager roles and permissions |
| Model-derived hydraulic recommendations | Replace with deterministic engineering engine |
| Demo numerical answers | Do not use as engineering baselines |

## 5. User journey

### Step 1 — Start and identify the task

The customer chooses lawn irrigation or another supported topic. The assistant explains what it can do, what information will be needed, and the difference between a preliminary concept and an engineer-reviewed design.

### Step 2 — Describe the site

Collect:
- site/project name (optional, local to project);
- site location at a useful level (town/area; exact address only if needed for a site visit);
- lawn regions as one or more polygons;
- dimensions/coordinates and measurement units;
- one known dimension or scale reference;
- exclusions and obstacles: buildings, paths, driveways, pools, trees, beds, no-water areas;
- optional elevation points, slopes and wind/exposure notes;
- lawn type/use and watering objective.

Area alone is not sufficient for exact head placement. An unscaled photo is not geometry. An AI interpretation of a sketch/photo is a draft with confidence and ambiguities; the customer must confirm dimensions, scale and exclusions before calculation.

### Step 3 — Describe the water source

Collect source type: mains, well/borehole, pump, tank/reservoir, shared source, or unknown.

Hydraulic input model must distinguish:
- static pressure (bar), test point, method and date;
- dynamic pressure (bar) at a defined test point while flowing;
- measured flow (L/min), method, measurement duration and operating conditions;
- supply pipe material, internal diameter, length and fittings where known;
- elevation difference between source/pump/valves and irrigated area;
- pump make/model and curve or nameplate data, if applicable;
- filters, meters, backflow devices, regulators and other restrictions.

Static pressure alone cannot confirm feasibility. A flow figure without its measurement method and test conditions is lower-confidence evidence. If dynamic pressure/flow or critical pipe data is missing, the system may collect information and show a clearly preliminary layout, but cannot confirm hydraulic feasibility.

### Step 4 — Clarify and validate

The UI and AI identify missing, invalid or contradictory values. Ask one useful question at a time where possible. Accept metric units and normalize internally. Do not silently reinterpret units, pressure type, flow measurement or geometry.

The deterministic intake validator returns:
- normalized values;
- missing mandatory fields;
- invalid fields and reasons;
- contradictions;
- provenance/confidence;
- whether a particular calculation stage is permitted.

### Step 5 — Calculate

The calculation engine receives a validated, immutable input snapshot and a versioned ruleset. The AI does not calculate or edit the result. If the site falls outside supported families, geometry or hydraulic limits, return a reasoned unsupported/engineer-review outcome rather than a guessed solution.

### Step 6 — Review the proposal

Show:
- site geometry and assumptions;
- sprinkler positions, model, nozzle, arc and operating point;
- radius/spacing and coverage checks;
- excluded areas, potential overspray and blind spots;
- zone grouping and per-zone flow/pressure;
- pipe route, lengths, diameters and losses where supported;
- valves, controller and accessories only where exact compatibility is verified;
- product SKU, catalogue reference, current published price and honest availability wording;
- warnings, missing measurements and confidence;
- calculation engine/data versions;
- preliminary vs calculation-validated vs engineer-approved status.

### Step 7 — Specialist handoff

Ask for contact details and explicit consent only when the customer submits a request. Send the minimum required project snapshot and contact information to the existing Florial Manager workflow. Preserve a link to the conversation/project and an audit trail. The customer confirmation must distinguish “request received” from “specialist contacted” or “design approved”.

## 6. Input and domain data model

Use runtime schemas (Zod or the repository's approved validation convention) and matching TypeScript types. Avoid hand-maintained, drifting copies of backend contracts.

### 6.1 Project

- `projectId`: opaque ID;
- `conversationId`: optional conversation link;
- `locale`: `bg | ru | en`;
- `module`: `lawn` initially;
- `status`: explicit state machine;
- `inputSnapshotVersion`;
- `createdAt`, `updatedAt`;
- `owner/session reference` only if authenticated/session model is approved.

### 6.2 Geometry

Represent geometry in metric coordinates with explicit coordinate reference and scale:
- polygon regions / lawn zones;
- exclusion polygons;
- obstacles with type and optional height/clearance;
- boundary metadata;
- elevation points and slope where provided;
- source image/sketch reference separately from confirmed geometry.

Validate closed polygons, non-self-intersection, minimum edge/area constraints, units, coordinate scale and exclusion overlap. Geometry algorithms must state supported shapes and numeric tolerances. Keep the original customer input and normalized geometry separately.

### 6.3 Water measurements

Every measurement should contain:
- `kind`: static_pressure | dynamic_pressure | flow_rate | elevation | pipe_dimension;
- `value` and `unit`;
- `method`;
- `testPoint` / location description;
- `conditions` (e.g. flow running, simultaneous draw, pump state);
- `measuredAt`;
- `provenance`: customer_measured | engineer_measured | imported | inferred;
- `confidence`: confirmed | reported | estimated | unknown;
- optional note and evidence attachment reference.

Never store one undifferentiated `pressure_bar` or `flow_lpm` field as if all measurements were equivalent.

### 6.4 Engineering result

Store:
- immutable input snapshot ID/hash;
- engine version and ruleset version;
- manufacturer dataset IDs/revisions;
- selected model/component and exact Sanity product IDs/SKUs;
- discrete operating point references;
- geometry/coverage metrics and hydraulic trace;
- zones and pipe network;
- warnings/errors and unsupported conditions;
- result status and calculation timestamp.

### 6.5 Provenance and evidence

Manufacturer data must include manufacturer, exact model/family, component role, pressure, nozzle, arc, radius, flow, precipitation, units, test conditions, source URL, document code/revision/date, page/table, reviewer, verification status and effective date. A value without a traceable source cannot enter automatic selection.

## 7. Deterministic engineering engine

The engine is the source of truth and should be pure, testable application code with no LLM or network dependency during calculations. Inputs and outputs must be serializable and versioned.

### 7.1 Calculation pipeline

1. Validate and normalize geometry, units, exclusions and elevation.
2. Determine supported lawn regions and candidate sprinkler families.
3. Generate candidate positions/arcs based on geometry and supported layout rules.
4. Evaluate manufacturer radius and head-to-head spacing at exact supported operating points.
5. Evaluate coverage, overlap, edge coverage, blind spots and overspray.
6. Calculate precipitation and compare within an approved engineering tolerance; do not mix materially different precipitation families without a documented exception.
7. Calculate sprinkler demand and propose zone groupings against measured dynamic source constraints.
8. Build the pipe network and calculate segment flows.
9. Calculate friction and minor losses using a documented method, verified internal pipe diameters, material/roughness, fittings and elevation.
10. Verify residual pressure at the worst-case sprinkler and each relevant component.
11. Verify valve, filter, regulator, controller and accessory compatibility.
12. Map every component to an exact published Sanity SKU only after compatibility validation.
13. Return a traceable report, assumptions, warnings and next actions.

### 7.2 Supported-data rules

- Exact manufacturer operating points only unless a separate interpolation rule is approved, documented and tested.
- No extrapolation beyond manufacturer data.
- Do not use broad catalogue min/max flow as a specific operating point.
- Pressure at the source is not pressure at the nozzle.
- A SAM check valve is not a pressure regulator.
- Integrated assemblies and body-plus-nozzle combinations are mutually exclusive BOM representations.
- Do not infer product compatibility from title, description or visual similarity.
- If a family is incomplete or blocked in the verified dataset, exclude it from automatic selection.
- Manufacturer precipitation test conditions and spacing assumptions must be preserved in the calculation and customer-facing caveats.

### 7.3 Outcomes and state machine

Use explicit machine-readable states, not free-form LLM labels:
- `collecting_inputs`;
- `needs_measurement`;
- `needs_geometry_confirmation`;
- `preliminary_only`;
- `calculation_validated`;
- `needs_engineer_review`;
- `not_feasible`;
- `unsupported_case`;
- `engineer_approved` (only after an authorized engineer review).

Do not use `design_ready` as a synonym for “AI answered”. A validated calculation is not automatically engineer-approved. Each transition must have deterministic guards and an audit event.

## 8. AI orchestration layer

The LLM provider is not selected by this specification. Gemini may be evaluated because it appeared in the prototype, but production selection requires a separate review of current pricing, privacy terms, data retention, DPA, regional handling, availability and rate limits. The model must be replaceable without changing the engineering engine.

### 8.1 Permitted AI responsibilities

- classify customer intent and language;
- extract candidate values from natural language into a strict schema;
- flag ambiguity and contradiction;
- choose the next missing-data question from server-provided candidates;
- interpret uploaded sketches as draft geometry with confidence/ambiguities;
- call narrowly scoped server functions;
- explain already validated engineering outputs;
- answer support questions from curated Florial/manufacturer knowledge with citations;
- summarize the project for specialist handoff.

### 8.2 Forbidden AI responsibilities

The model must not invent or directly decide:
- sprinkler coordinates, arcs, spacing or quantity;
- pressure, flow, radius, precipitation or operating point;
- zone flow limits or zone count;
- pipe diameters, losses or pump duty;
- model/SKU compatibility;
- prices, stock, discounts, delivery promises or order totals;
- engineering approval status.

### 8.3 Function contracts

Initial conceptual functions (final names and schemas to be reviewed against current Pages Functions conventions):
- `intake.normalize`: normalize answer; return missing/invalid/contradictory fields.
- `intake.nextQuestion`: choose one next question from deterministic missing-data state.
- `geometry.validate`: validate customer-confirmed geometry.
- `geometry.proposeFromImage`: produce draft geometry only; never approve scale or dimensions.
- `lawn.calculate`: invoke deterministic calculation engine.
- `catalogue.resolveProducts`: resolve exact approved SKU references and current commercial fields server-side.
- `result.explain`: explain an existing calculation result without changing it.
- `lead.submit`: submit a consented request to the existing Florial workflow.

Use structured output and runtime validation. Reject unknown fields, invalid units, out-of-range values, model-supplied prices, arbitrary product IDs and unauthorized function calls. The server, not the model, controls function availability and authorization.

## 9. Knowledge and catalogue architecture

### 9.1 Curated knowledge

Use Sanity as the controlled content source where the current schema and workflow are appropriate. If engineering data needs a separate versioned code-owned dataset, keep it separate from editorial content and link it to manufacturer sources.

Each knowledge item should have:
- title and localized content BG/RU/EN where relevant;
- topic/module and manufacturer/model tags;
- source URL and document revision;
- source publication/effective date and review date;
- verification state: draft | reviewed | verified | obsolete | blocked;
- reviewer and change history;
- locale and units;
- explicit applicability/limitations.

Do not import Emergent seed documents or demo conversations into production retrieval. Do not retrieve unverified, sample, obsolete or blocked records for authoritative engineering answers. Retrieved text is untrusted reference material, never an instruction to the model.

### 9.2 Retrieval

Retrieval must be language-aware and metadata-filtered. It should return stable source IDs, revisions, excerpts and URLs. A response should cite the actual source used, not merely show a generic knowledge index. If no verified source is found, say so and escalate or ask for clarification.

Keyword matching may be an initial implementation, but it must be tested for Bulgarian/Russian morphology and exact technical model names. Embeddings/vector search are optional future improvements, not a prerequisite for the deterministic calculator.

### 9.3 Product catalogue

Sanity remains the catalogue source. Resolve published product/category relationships server-side and map engineering component IDs to exact Sanity document IDs/SKUs. Price and stock are fetched at response/cart time through existing trusted Florial logic. The LLM never sets commercial values.

When `stockStatus=onRequest`, present it as request/confirmation required, not in-stock. If a selected item has no verified price or compatible configuration, mark it for specialist review rather than fabricating a quote.

## 10. Target application architecture

### 10.1 Frontend

Reuse and evolve the existing localized Florial assistant entry and intake. Preserve existing global layout and launcher visibility rules.

Suggested client areas:
- conversation and guided questions;
- project parameter panel;
- geometry editor / drawing confirmation;
- water measurement wizard;
- calculation report and map;
- product proposal/BOM;
- specialist handoff.

The frontend must not contain provider API keys, privileged Sanity tokens, D1 credentials or authoritative price/stock logic. It should render server-validated states and results.

### 10.2 Cloudflare Pages Functions

Use narrowly scoped Pages Functions as the trust boundary:
- validate request schema, size, locale, units and session;
- apply abuse protection, rate limits, timeouts and budgets;
- load trusted catalogue/knowledge context server-side;
- invoke deterministic engine;
- invoke LLM adapter only for permitted tasks;
- persist minimum necessary conversation/project state;
- create lead requests through the existing Manager integration;
- redact logs and return stable error contracts.

The precise function paths must be reconciled with existing `functions/api` conventions before implementation. Do not create parallel API conventions or duplicate price/cart logic.

### 10.3 Cloudflare D1

D1 is the proposed persistence layer for conversation/project workflow state where persistence is required. No schema change is approved by this document.

Before any migration, inspect the live migration ledger and current schema, design indexes/retention, prepare a migration and dry-run, and obtain owner approval. Avoid duplicating existing Manager/lead/order records. Keep transient conversation data separate from durable lead data and define deletion/retention behavior.

Potential logical entities (not final SQL):
- conversation/session;
- irrigation_project;
- project_input_snapshot;
- calculation_run;
- calculation_warning;
- specialist_request / existing lead reference;
- audit_event.

Use opaque IDs, ownership/session binding, timestamps and minimal fields. Do not store unnecessary personal data in conversation transcripts.

### 10.4 Sanity

Sanity remains authoritative for published catalogue and curated editorial knowledge. The first release should not require a new Sanity schema unless the current content model demonstrably cannot represent a required fact. Any schema/data write requires a separate plan, backup and owner approval.

### 10.5 Resend and Manager

Specialist handoff should use existing Florial Manager and Resend paths after the current lead workflow has been inspected. Do not send an email directly from the browser or claim a specialist was notified until the server confirms delivery/acceptance. Do not create a second CRM.

## 11. API boundaries — conceptual only

These are proposed resource boundaries, not authorization to implement them as-is:

- `POST /api/irrigation-assistant/conversations`
- `GET /api/irrigation-assistant/conversations/:id`
- `POST /api/irrigation-assistant/conversations/:id/messages`
- `POST /api/irrigation-assistant/projects/:id/intake`
- `POST /api/irrigation-assistant/projects/:id/geometry/validate`
- `POST /api/irrigation-assistant/projects/:id/calculate/lawn`
- `GET /api/irrigation-assistant/projects/:id/report`
- `POST /api/irrigation-assistant/projects/:id/specialist-request`

Before coding, compare with existing Florial route names, session/auth model, error handling and streaming conventions. Use a stable JSON contract; if streaming is needed, specify SSE event IDs, cancellation, heartbeats, reconnect behavior, final event and error semantics. A normal request/response is preferred for deterministic calculation endpoints.

## 12. Security, privacy and operational controls

- Authenticate or securely bind every private conversation/project to a user/session; enforce ownership on read, update and delete.
- Protect Manager-only knowledge editing and lead access with existing role permissions.
- Keep sample/demo data isolated from real conversations and production retrieval.
- Restrict CORS to known Florial origins; do not use wildcard + credentials.
- Apply per-IP/session rate limits, payload limits, upload type/content validation, timeouts, retry ceilings and cost/token ceilings.
- Protect uploads from malicious files; do not execute user content. OCR and image processing must have size and resource limits.
- Treat customer messages, uploaded files, retrieved documents and product descriptions as untrusted input. They cannot override system policy or authorize tools.
- Store provider keys only as server-side Cloudflare secrets. Never expose them in Vite variables, client bundles, HTML, logs or Git.
- Do not send contact data, addresses or order details to the model unless a specific approved use case requires it.
- Define privacy notice, consent, retention, deletion and data-subject request process before production.
- Log request ID, model/provider, prompt/schema/engine version, latency, token usage, validation status and error class; redact content and personal data.
- Deterministic intake and calculation must remain available when the LLM is down.
- Add graceful fallback, user-visible errors and support diagnostics without leaking internal stack traces.

## 13. Testing and engineering acceptance

### 13.1 Unit and property tests

- geometry normalization, polygon validation, scale and exclusions;
- exact manufacturer point lookup and source metadata;
- sprinkler/nozzle/body compatibility and assembly de-duplication;
- coverage and spacing boundaries;
- precipitation matching;
- flow aggregation and zone constraints;
- pipe segment flow, friction/minor losses and elevation;
- residual pressure at worst-case device;
- exact Sanity SKU mapping and blocked/unverified item rejection;
- state-machine transition guards;
- deterministic repeatability for identical input/version.

### 13.2 Reference scenarios

Create versioned synthetic and engineer-reviewed cases:
1. simple rectangle;
2. L-shaped lawn;
3. narrow strip;
4. separated lawn regions;
5. building/path/tree exclusions;
6. irregular polygon;
7. elevation difference;
8. low-flow well;
9. sufficient flow but insufficient dynamic pressure;
10. missing/contradictory pressure or flow measurements;
11. source data outside manufacturer tested points;
12. unsupported sprinkler family or unknown package contents;
13. incompatible body/nozzle or integrated assembly duplication;
14. onRequest product availability;
15. provider unavailable / malformed model output / prompt injection.

For every case, assert expected status, warnings, geometry/coverage constraints, manufacturer point references, hydraulic results and product eligibility. Baseline numeric results must be independently reviewed by an irrigation engineer; do not use the Emergent sample figures as golden tests.

### 13.3 Release gates

A module can progress only when:
- domain schema and units are reviewed;
- all selected manufacturer data is verified and traceable;
- deterministic calculations pass unit, regression and boundary tests;
- engineer-reviewed reference cases pass;
- security/privacy review is complete;
- exact-SHA CI passes;
- Preview browser QA covers BG/RU/EN and mobile/desktop;
- specialist handoff is tested without creating unwanted production records;
- owner explicitly approves production release.

A passing build or successful deployment alone does not prove engineering correctness.

## 14. Delivery roadmap

### Phase A — Specification and source-of-truth alignment
- [ ] Owner review of this specification.
- [ ] Reconcile this document with the existing lawn engineering specification and open PR #311; resolve any conflicting requirement before implementation.
- [ ] Confirm the first customer promise and supported operating envelope.
- [ ] Confirm the exact first-release Rain Bird product/package/nozzle subset.
- [ ] Record decisions and unresolved items in the shared engineering docs through one synchronized documentation PR.

**Exit:** approved requirements, scope and decision log.

### Phase B — Data and calculation foundation
- [ ] Finish manufacturer dataset curation for the first supported families.
- [ ] Confirm exact catalogue SKU/package mapping and component compatibility.
- [ ] Define geometry and measurement schemas.
- [ ] Implement geometry validation and deterministic coverage solver.
- [ ] Implement zone and hydraulic solver with documented method and tested pipe data.
- [ ] Build engineer-reviewed reference cases and regression suite.

**Exit:** reproducible lawn calculations independent of AI.

### Phase C — Guided intake and conversation
- [ ] Adapt the existing Florial intake UI and selected Emergent interaction patterns.
- [ ] Implement progressive clarification, provenance and confirmation.
- [ ] Add conversation persistence only after session/privacy/retention decisions.
- [ ] Add provider adapter and structured model contracts.
- [ ] Explain deterministic results without allowing the model to mutate them.

**Exit:** useful localized AI conversation with safe fallback and validated tool boundaries.

### Phase D — Knowledge and catalogue
- [ ] Curate verified knowledge sources and metadata.
- [ ] Implement language-aware retrieval and source citations.
- [ ] Resolve exact Sanity catalogue products server-side.
- [ ] Return live price and truthful availability through existing trusted code.

**Exit:** evidence-grounded advice and exact eligible catalogue references.

### Phase E — Specialist workflow and commercial handoff
- [ ] Map project summary to existing Manager lead/request workflow.
- [ ] Add explicit consent and privacy copy.
- [ ] Add request status and notification through existing Resend integration.
- [ ] Add optional quote/cart handoff only after server-side validation and owner approval.

**Exit:** traceable engineer handoff without a parallel CRM.

### Phase F — Pilot and expansion
- [ ] Run supervised pilot on real sites with engineer sign-off.
- [ ] Monitor calculation errors, unsupported cases, customer comprehension and model cost.
- [ ] Improve the lawn module before adding drip irrigation, trees/shrubs or pump modules.
- [ ] Obtain explicit owner approval for production rollout.

**Exit:** controlled release and measurable operational quality.

## 15. Decisions required before implementation

These are intentionally open; do not silently choose on the owner's behalf:
1. What is the first customer promise: preliminary concept only, or a validated calculation for a narrowly supported subset?
2. Which lawn geometries are supported in the first release: rectangles and L-shapes first, or arbitrary polygons after editor implementation?
3. Which exact Rain Bird families/SKUs are in the first automatic selector after package/nozzle confirmation?
4. What is the approved engineering method and threshold for precipitation matching, hydraulic loss and allowable velocity?
5. What evidence is mandatory for a measured flow and dynamic pressure result?
6. What is the session model: anonymous short-lived session, account-bound project, or both?
7. What conversation/project retention and deletion policy should apply?
8. Which LLM provider/model and commercial/privacy tier are approved for production?
9. Should a calculation report be downloadable PDF in the first public release or a later phase?
10. Which existing Manager lead status/permissions should represent an irrigation project awaiting engineer review?

## 16. Source documents and references

Internal:
- `docs/engineering/IRRIGATION_ASSISTANT_LAWN_ENGINEERING_SPEC.md`
- `docs/audits/2026-11-16-irrigation-assistant-rainbird-data-audit.md`
- `src/pages/IrrigationAssistantPage.tsx`
- `src/lib/irrigation/irrigationPerformanceData.mjs`
- `tests/irrigation-performance-data.test.mjs`
- `docs/prototypes/emergent-irrigation-assistant/README.md` and `PROTOTYPE_REVIEW.md` (in open PR #312 at the baseline, not yet main)

Manufacturer references:
- Rain Bird 3500 Series technical specification, document D42378: https://www.rainbird.com/sites/default/files/media/documents/2023-11/d42378_3500_rotor_tech_spec.pdf
- Rain Bird 5000 Series performance chart: https://www.rainbird.com/sites/default/files/media/documents/2020-09/5000-series-rotor-nozzle-performance-chart.pdf
- Rain Bird R-VAN metric technical specification, document D41159B: https://www.rainbird.com/sites/default/files/media/documents/2025-10/026549_rb_rvantechspecsheet_metric_f.pdf
- Rain Bird HE-VAN performance chart: https://www.rainbird.com/media/4172
- Rain Bird VAN performance chart: https://www.rainbird.com/sites/default/files/media/documents/2020-09/van-series-spray-nozzles-performance-charts.pdf
- Rain Bird 1800 Series bodies: https://www.rainbird.com/products/1800-series-spray-sprinkler-bodies

---

## Change control

This specification is a design baseline for review. It does not authorize code changes, production deployment, D1 migrations/data writes, Cloudflare secret/binding changes, Sanity schema/content writes, customer-data transfer to an LLM, email sends or order/cart mutations. Any implementation must follow the current Florial AI instructions and work protocol, use a dedicated branch and Preview, preserve existing production boundaries, and receive explicit owner approval for production release.
