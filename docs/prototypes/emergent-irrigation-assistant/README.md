## Owner-approved customer journey refinement — 2026-11-16

The final Gemini review happens **after** deterministic engineering and exact catalogue selection:
1. Conversational intake collects and confirms site facts.
2. Florial's deterministic engine calculates the supported preliminary layout/hydraulic result.
3. Florial maps eligible engineering components to exact compatible Sanity products and retrieves live prices/availability.
4. The completed, frozen proposal is sent to Gemini for a second-pass consistency/completeness review and localized explanation. Gemini cannot alter engineering values, product selection, quantities, prices, availability or cart state.
5. The UI shows a genuine review-in-progress state, then presents engineering status and AI-review status separately, with findings/warnings.
6. Only after the customer explicitly clicks “Добави в количката” does Florial revalidate current catalogue/price/availability and add validated product IDs and quantities through the existing cart flow. Gemini never mutates the cart.

If review fails/is unavailable, do not fabricate a pass. A material issue requires clarification, specialist escalation, or validated input changes followed by a fresh deterministic run and final review. An AI review is not an engineer's certification. Do not show a made-up countdown; any duration estimate must come from measured telemetry.

# Emergent irrigation assistant — capture and Florial integration roadmap

**Status:** prototype review / source capture in progress; not production code  
**Captured:** 2026-11-16  
**Source prototype:** Emergent preview `https://florial-ai-advisor--2b6fjadu.preview.emergentagent.com/`  
**Target repository:** `omaraandrey-dev/florial`  
**Target production:** `https://florial-bg.com`

## 2026-11-16 — Phase 2 implementation slice: guided intake and measurement provenance

- **Implemented in branch:** the existing `/irrigation-assistant` now presents a localized step-by-step guided prompt in BG/RU/EN and captures how flow and pressure were measured.
- Pressure intake distinguishes static vs dynamic pressure and measurement location (water source vs irrigation point). Flow intake distinguishes flow-meter readings from timed-volume measurements. Unknown values remain explicitly unknown; customer-entered values are not promoted to verified engineering measurements.
- Added versioned `irrigationIntake` snapshot contract with provenance, validation warnings and explicit `intake_only / not_calculated` status. Added unit tests for the snapshot contract.
- This is a first guided-intake slice, not a free-form LLM chat, saved conversation or engineering calculation. It does not call the lawn layout solver, select products, access live catalogue data, invoke Gemini or mutate the cart.
- Exact-head CI, browser QA and Production deployment are pending PR validation. No D1, Sanity, Cloudflare configuration/secrets or customer data were changed.

## Purpose

Preserve the useful work from the standalone Emergent prototype so it can be reviewed and selectively adapted into the existing Florial application. The prototype is an experiment and must not replace the Florial store or become a parallel production platform.

## Source of truth and boundaries

- GitHub `main` remains the only permanent source of truth for Florial code and technical documentation.
- Emergent remains the origin of the prototype until its complete source and export are verified.
- Files in this directory are captured evidence/source snapshots supplied during the review. They are **not** integrated into the production application and must not be imported blindly.
- Production architecture remains React/TypeScript + Cloudflare Pages/Functions + D1 + Sanity + Resend. Supabase is excluded.
- Do not add Emergent runtime/backend dependencies to Florial without a separate architecture review.
- Do not overwrite Florial `main`, existing routes, Header, menu, Footer, or global layout as part of prototype capture.

## Prototype review — observed behavior

The owner tested the Emergent chat using a lawn of 200 m², rectangle 10 × 20 m, reported pressure 4 bar and measured flow 40 L/min, later clarifying that the source is a well.

The prototype:
- opens with a Russian conversational irrigation assistant;
- presents suggested questions and sample consultations;
- collects area, dimensions, water source, pressure, flow and location;
- displays source links to its demonstration knowledge area;
- offers preliminary recommendations and escalation to a Florial specialist;
- distinguishes preliminary guidance from a final engineer-reviewed design.

Demonstration knowledge items shown in the UI:
1. “Чек-лист для проекта автополива” — sample document;
2. “Как замерить давление и дебит воды” — sample document;
3. “Нормы полива газона в Болгарии” — sample document.

These are explicitly labeled examples. They are not verified Florial technical documentation and must not be treated as production knowledge sources.

### Owner's engineering review of the sample conversation

The assistant suggested six Rain Bird 5004 sprinklers for a 10 × 20 m rectangle, a preliminary head-to-head layout, and initially estimated 60–70 L/min. After challenge, it acknowledged that this was an indicative estimate, gave an illustrative 5004 nozzle #3.0 / approx. 3 bar / approx. 10 L/min full-circle explanation, estimated 25–30 L/min for the proposed 90°/180° sectors, and said the measured 40 L/min might be sufficient for one zone subject to dynamic pressure and pipe losses.

The owner, an irrigation engineer, confirmed that the practical preliminary recommendation and layout were reasonable for a simple site. This owner assessment is important context: do not reject a practical preliminary engineering judgement merely because it is not a complete hydraulic report. At the same time, the assistant's figures and exact equipment selection must be checked against the chosen manufacturer's performance data before automatic specification or sale.

### Review conclusions

- Conversation UX is promising and worth preserving.
- The prototype demonstrated useful progressive intake and follow-up questions.
- The demo knowledge library is placeholder/sample content; real retrieval and source-grounding remain unverified.
- The sample response is not proof of a deterministic engineering solver or a live Rain Bird data connection.
- A complete prototype export, frontend dependencies, all components, backend routes, LLM provider/configuration, retrieval implementation, database schema and deployment assumptions have not yet been captured.

## Captured source files

- `source/frontend/src/pages/Chat.tsx` — React chat page supplied by the owner from Emergent.
- `source/backend/models/chat.py` — Pydantic conversation/message/site models supplied by the owner from Emergent.

These are partial source snapshots only. The source tree is incomplete until related components, libraries, routers, LLM layer, knowledge retrieval, seed data, package manifests and configuration are inspected. Never infer missing files or credentials.

## Integration strategy

**Recommended approach: reuse the UX, not the Emergent application wholesale.**

1. Preserve and inspect the full Emergent source in isolation.
2. Inventory frontend components, CSS/tokens, assets, routes, dependencies and licenses.
3. Inventory backend routes, persistence, LLM calls, prompt construction, document retrieval, streaming protocol, seed data, tests and environment variables. Record names and behavior, never commit secrets.
4. Separate reusable presentation components from Emergent-specific API/data dependencies.
5. Compare the prototype UX with existing Florial routes/components and the already implemented irrigation-assistant page.
6. Adapt selected UI components to Florial's existing React/TypeScript conventions, localization and accessibility.
7. Replace Emergent backend endpoints with narrowly scoped Cloudflare Pages Functions and D1 persistence where appropriate.
8. Connect live product/catalog data to published Sanity documents through server-side Florial code; do not hardcode prices or stock in prompts or uploaded documents.
9. Keep AI responsible for conversation, normalization, clarification and explanation. Deterministic, versioned Florial code remains the source of truth for geometry, coverage, hydraulic calculations, compatibility and product selection.
10. Test in a separate branch/Preview, review the diff, run CI and browser QA. Production release requires separate owner approval.

## Florial engineering constraints to preserve

Use `docs/engineering/IRRIGATION_ASSISTANT_LAWN_ENGINEERING_SPEC.md` as the governing engineering specification.

- Geometry must eventually include scaled boundaries, exclusions and obstacles; area alone is not enough for a real layout.
- Distinguish static pressure from dynamic pressure at a defined test point while flowing.
- Record flow measurement method, pipe internal diameter/material/length, elevation and pump data when relevant.
- For simple cases, the assistant may provide an explicitly preliminary practical layout, but must state assumptions and avoid presenting it as verified hydraulic design.
- Never invent manufacturer performance points, pressure, radius, flow, precipitation, compatibility, prices or availability.
- Use only exact verified manufacturer data and exact compatible Sanity SKUs for automatic recommendations.
- No `design_ready` state while mandatory data/checks are missing.
- Customer contact details and consent are requested only at the point of submitting a request.

## Roadmap and acceptance gates

### Phase 0 — Source preservation (current)
- [x] Capture Chat.tsx supplied by owner.
- [x] Capture chat data models supplied by owner.
- [x] Record demo knowledge items and test conversation findings.
- [ ] Capture all remaining frontend components and shared libraries.
- [ ] Capture backend routers, LLM layer, knowledge retrieval and seed data.
- [ ] Capture package manifests, tests and configuration shape (without secrets).
- [ ] Verify complete project export/commit from Emergent, if available.

**Exit:** enough source is available to map the whole application and its external dependencies.

### Phase 1 — Technical audit of Emergent
- [ ] Draw frontend component and route map.
- [ ] Trace message lifecycle from Composer to API, streaming response and persistence.
- [ ] Identify LLM provider/model, prompts, tool calls and failure handling.
- [ ] Determine whether knowledge answers use actual retrieval (RAG) or static/demo data.
- [ ] Inspect authentication, privacy, retention, CORS, rate limits and abuse controls.
- [ ] Identify dependencies/licenses and build/test commands.
- [ ] Produce a keep/adapt/replace matrix.

**Exit:** reviewed architecture and evidence-based migration plan.

### Phase 2 — Florial UI adaptation
- [ ] Compare with existing `/irrigation-assistant` and launcher.
- [ ] Select reusable visual components and interaction patterns.
- [ ] Adapt BG/RU/EN localization, responsive behavior, keyboard/accessibility and error states.
- [ ] Keep Florial Header/menu/Footer and global architecture unchanged.
- [ ] Implement only in a separate branch and Preview.

**Exit:** approved UI integrated into existing Florial without Emergent runtime dependency.

### Phase 3 — Cloudflare conversation backend
- [ ] Define request/response and streaming contracts.
- [ ] Design D1 schema/migration only after review and owner approval.
- [ ] Implement authenticated/abuse-resistant conversation endpoints as appropriate.
- [ ] Add rate limits, input validation, privacy/retention policy and observability.
- [ ] Store only necessary site data and consented contact details.
- [ ] Keep provider credentials in Cloudflare secrets; never in client or GitHub.

**Exit:** tested Cloudflare backend with no Emergent dependency.

### Phase 4 — Knowledge and catalogue grounding
- [ ] Define curated, versioned Florial knowledge sources and source metadata.
- [ ] Verify retrieval, citations and refusal/unknown behavior.
- [ ] Connect catalogue lookup to Sanity server-side.
- [ ] Return current published price/stock and exact product references.
- [ ] Prevent the LLM from fabricating product data.

**Exit:** evidence-backed answers from controlled Florial sources.

### Phase 5 — Deterministic lawn-engine connection
- [ ] Implement/extend deterministic geometry and coverage solver.
- [ ] Use verified Rain Bird datasets and exact SKU compatibility.
- [ ] Validate dynamic flow/pressure and pipe losses.
- [ ] Add engineer-reviewed baseline cases and regression tests.
- [ ] Generate traceable preliminary/design reports and specialist handoff.

**Exit:** reproducible engineering results independent of LLM generation.

### Phase 6 — Commercial handoff and rollout
- [ ] Add consented lead/request submission.
- [ ] Add quote/specification and optional cart handoff using current Sanity data.
- [ ] Add engineer review workflow and status tracking.
- [ ] Complete BG/RU/EN mobile/desktop QA, security review and exact-SHA CI.
- [ ] Obtain owner approval before Production deployment.

**Exit:** controlled rollout on Florial.

## Current status and open unknowns

- Full Emergent repository export/commit: **НЕ ИЗВЕСТНО — нужно уточнить**.
- Whether the prototype uses a real LLM at runtime: partially suggested by behavior, but not proven by the captured source.
- Whether knowledge documents are actually retrieved for each answer: **НЕ ПОДТВЕРЖДЕНО**.
- LLM provider/model, prompt, vector store/retrieval method: **НЕ ИЗВЕСТНО — нужно изучить backend**.
- Emergent database and persistence implementation: **НЕ ИЗВЕСТНО — нужно изучить backend**.
- Dependency licenses and export rights: **НЕ ИЗВЕСТНО — нужно проверить**.
- No source code from this prototype has been integrated into Florial production.


## 2026-11-16 — expanded source and public-preview audit

The source archive contains only the two files listed above. Additional Emergent source files were supplied and reviewed incrementally in the earlier owner conversation (FastAPI chat/documents/leads routes, LLM and keyword-retrieval modules, seed data, related Pydantic models, and frontend app shell/styles), but those files were not committed to this repository. Their architecture and limitations are summarized in [the source audit](../../audits/2026-11-16-emergent-irrigation-assistant-source-audit.md); the exact full project export, manifests/lockfiles, licenses and tests remain unpreserved.

The public preview was inspected read-only on 2026-11-16. It showed five suggested questions and five empty site fields; the knowledge page showed 0/0 documents and 0 requests. Two harmless chat prompts returned an assistant error. The preview identified itself as static and the Resume Preview link redirected to Emergent login. This does not prove that the backend is absent; it means the current public preview does not demonstrate a working end-to-end assistant. See the audit for evidence and limitations.

The Florial target remains a native rebuild: adapt the progressive conversation UX, replace Emergent/FastAPI/MongoDB and its keyword retrieval, and keep Gemini subordinate to the deterministic Florial engineering engine.
