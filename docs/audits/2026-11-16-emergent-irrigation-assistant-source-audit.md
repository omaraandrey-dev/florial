# Emergent irrigation assistant — source and integration audit

**Date:** 2026-11-16  
**Reviewed Florial main:** `d68ea5dbdd6618f158a6d7584f91347026f84d13`  
**Emergent preview:** https://florial-ai-advisor--2b6fjadu.preview.emergentagent.com/  
**Scope:** prior source supplied in chat, archived source in GitHub, public preview, and current Florial implementation  
**Status:** source/architecture audit; no runtime changes

## Executive conclusion

Emergent demonstrated a useful conversational UX and a working prototype architecture, but it is not a production-ready subsystem to transplant. The reusable value is the interaction pattern: progressive questions, persistent-looking conversation flow, suggested follow-ups, a visible site-parameter summary, source references and specialist escalation.

Florial should rebuild that experience natively around the existing React application and deterministic irrigation engine. Do not port FastAPI, MongoDB, Emergent integrations or prototype retrieval into the Florial runtime.

The prototype source was supplied incrementally in prior chat messages. Only two source files were committed to the repository archive in PR #312: the React `Chat.tsx` and Pydantic `models/chat.py`. The other files below were reviewed in the earlier source-sharing session but are not present in the current GitHub archive. Their details in this report are based on the recorded prior review, not a fresh source checkout. A complete reproducible Emergent export (including manifests, lockfiles, all imported components, environment/deployment configuration and tests) has not been preserved.

## 1. Source inventory and evidence

### 1.1 Source files preserved in GitHub main

- `docs/prototypes/emergent-irrigation-assistant/source/frontend/src/pages/Chat.tsx`
- `docs/prototypes/emergent-irrigation-assistant/source/backend/models/chat.py`

The archived React page imports additional chat components and helpers that are not included in the archive: `ChatHeader`, `WelcomeCard`, `MessageBubble`, `StreamingBubble`, `Composer`, `SiteParamsPanel`, `HistorySheet`, `SpecialistDialog`, `lib/api`, `lib/types` and `lib/site`. The archived page is therefore a partial snapshot, not a buildable frontend export. The archived Pydantic model file is likewise not a complete backend.

### 1.2 Additional source supplied and reviewed in prior chat, not archived in GitHub

Recorded as supplied/reviewed in the earlier session:

**Backend**
- `backend/server.py`
- `backend/routers/chat.py`
- `backend/routers/documents.py`
- `backend/routers/leads.py`
- `backend/models/documents.py`
- `backend/models/leads.py`
- `backend/lib/llm.py`
- `backend/lib/knowledge.py`
- `backend/lib/seed_data.py`

**Frontend**
- `frontend/src/App.tsx`
- `frontend/src/index.css`
- `frontend/index.html`
- `frontend/src/pages/Chat.tsx`

The exact complete source text for these additional files is not currently present in the Florial repository. No package manifest/lockfile, full dependency inventory, license report, automated test suite or complete deployment export was preserved. Do not claim dependency/license clearance.

## 2. How the Emergent prototype was structured

### 2.1 Frontend

The reviewed UI used React Router, TanStack Query, Shadcn UI, Lucide icons and Sonner notifications. The chat page:
- loaded a conversation by route ID;
- created a conversation when the user sent the first message;
- streamed assistant output into a pending message;
- updated cached conversation data after the stream completed;
- offered quick follow-up questions;
- showed a site-parameter panel on wide screens and a bottom sheet on smaller screens;
- exposed conversation history and a specialist-request dialog;
- rendered sample conversations as read-only examples.

The main interaction pattern is worth adapting. The exact component implementation and dependency versions are not available in the current Florial archive.

### 2.2 Backend and persistence

The reviewed backend used FastAPI and MongoDB. The chat router handled conversation creation/read/list/delete and message submission, called knowledge retrieval and prompt construction, merged extracted site parameters, streamed response events and persisted messages, guidance and source labels.

The Pydantic chat models represented:
- site parameters: area, dimensions, water source, pressure, flow, location, terrain and plants;
- messages with role, content, optional guidance, source labels and timestamp;
- conversations with title, sample flag, site data and message count;
- message input limited to 4,000 characters;
- guidance values `preliminary`, `engineering` and `info`.

This was prototype-specific persistence and API behavior, not a Florial-compatible contract.

### 2.3 LLM layer

The previously reviewed `backend/lib/llm.py` used Gemini model `gemini-3-flash-preview` through `emergentintegrations` and the `EMERGENT_LLM_KEY` environment variable. The Russian base prompt instructed the model to collect and discuss site information. The integration used recent conversation history (up to 20 messages), extracted site metadata from a special marker/JSON segment and merged it into the site record while streaming user-visible text and hidden metadata.

Reuse the conceptual separation between conversational text and structured site fields. Do not reuse the Emergent SDK, its key name, prompt parser or trust model. Florial needs its own provider adapter, structured output schema, strict runtime validation, explicit provenance/confidence and confirmation of extracted measurements.

### 2.4 Knowledge retrieval

The reviewed `backend/lib/knowledge.py` was a simple keyword retriever, not semantic RAG:
- split document text into paragraph-like chunks around 900 characters, with a split threshold around 1,350 characters;
- tokenized and applied a crude stem based on the first five characters for words of at least three characters;
- searched active MongoDB documents;
- applied a title-match bonus and a minimum score;
- returned up to four matching fragments.

No embeddings/vector search were present in the reviewed implementation. A critical issue was that active sample/demo documents were not reliably excluded from retrieval. Production Florial retrieval must use approved, versioned sources and exclude sample, draft, unverified, obsolete and blocked content by default.

### 2.5 Documents, leads and sample data

The reviewed prototype had separate document and lead routes/models. The seed routine used idempotent `$setOnInsert` operations to add three Russian demonstration knowledge documents and three sample conversations. These examples were not approved technical references.

A specialist request must distinguish:
1. the request being accepted and persisted;
2. notification delivery being accepted by the mail provider;
3. an actual Florial specialist reviewing and responding.

A UI confirmation alone does not prove that a human was notified.

## 3. Public preview check — 2026-11-16

Read-only public inspection:
- Home: https://florial-ai-advisor--2b6fjadu.preview.emergentagent.com/
- Knowledge page: https://florial-ai-advisor--2b6fjadu.preview.emergentagent.com/knowledge
- Resume link: https://app.emergent.sh/open/florial-ai-advisor--2b6fjadu

Observed:
- Bulgarian lawn-irrigation assistant shell, Florial branding, five suggested questions and five site-data fields (area, source, pressure, flow and settlement).
- The site-data panel showed 0/5 fields.
- The knowledge page showed 0/0 documents and 0 requests, with document-entry controls.
- The home page explicitly disclosed that this was a prototype not connected to Florial's catalogue, prices, stock or website; the knowledge page stated there was no Sanity/Cloudflare/GitHub/catalogue integration.
- A harmless sample question and a neutral test prompt both returned `Не удалось получить ответ ассистента`.
- The public page identified itself as a static preview. “Resume Preview” redirected to Emergent login; no login was attempted.

Interpretation: the public preview currently does not demonstrate a working end-to-end chat or populated knowledge base. The observed response failure does not prove that the underlying backend is absent; it may reflect static-preview mode, unavailable service or access restrictions. Source, runtime configuration and backend behavior were not independently verified through the public preview.

## 4. Security and reliability findings from the prior source review

The prior code review identified these prototype weaknesses:
- conversation/document/lead routes lacked an adequate authentication and ownership boundary;
- CORS used a wildcard origin together with credentials;
- sample knowledge records could enter retrieval;
- model-extracted metadata was parsed from generated text and merged without a sufficiently strict domain contract;
- the frontend SSE parser had limited framing/buffering/cancellation/reconnect behavior;
- lead persistence and successful human notification were not equivalent;
- seed knowledge included illustrative irrigation statements that must not be treated as validated engineering data.

These are reasons to rebuild the backend boundary, not to copy the prototype implementation.

## 5. Florial current state — verified against main

**Reviewed main SHA:** `d68ea5dbdd6618f158a6d7584f91347026f84d13`

### 5.1 Existing customer-facing page

`src/pages/IrrigationAssistantPage.tsx` currently implements a localized BG/RU/EN three-step wizard:
1. one rectangle or one-corner orthogonal L-shape, dimensions, SVG preview, calculated area/perimeter and customer geometry confirmation;
2. water source plus optional flow and reported pressure;
3. notes and a local summary.

The page sets noindex metadata. It does not import or call `generateLawnSprinklerLayout`; it does not call an AI endpoint, save a conversation/project, retrieve products, display a bill of materials, or add items to the cart. The final action only changes local UI state to show the collected summary.

The current flow does not distinguish static from dynamic pressure, does not capture the pressure/flow test point and conditions, and does not collect enough pipe-network information for hydraulic feasibility.

### 5.2 Existing deterministic foundation

Main already contains:
- metric geometry construction and validation in `lawnGeometryInput.mjs` / `lawnGeometry.mjs`;
- a deterministic sampled lawn sprinkler placement engine in `lawnSprinklerLayout.mjs`;
- exact Rain Bird R-VAN and HE-VAN performance datasets and lookup functions;
- Florial owner selection preferences that prioritize R-VAN for suitable small residential lawns and treat HE-VAN as a conditional lower-cost alternative;
- a measured catch-can DUlq utility.

The placement engine supports one confirmed rectangle or orthogonal L-shape, one nozzle model/family/pressure per run, and sampled geometric coverage/head-to-head diagnostics. It is not a hydraulic solver and does not establish continuous coverage, overspray safety, precipitation uniformity, body/nozzle compatibility, pipe sizing, zoning or source feasibility. Exclusions are currently rejected by the layout solver.

### 5.3 Catalogue and commerce boundary

The existing catalogue audit found published prices for the inspected sprinkler/nozzle products, but their stock status was `onRequest`. Product family datasets bind nozzle models to Sanity records, but do not certify every complete body/nozzle/regulator assembly. A live price lookup and stock label must come from Sanity; neither should be hardcoded into an AI prompt. The current evidence does not authorize a fully automatic bill of materials or cart handoff.

## 6. KEEP / ADAPT / REPLACE

| Emergent capability | Decision | Florial treatment |
|---|---|---|
| Conversational progressive intake | ADAPT | Rebuild within the existing Florial route and design system |
| Suggested questions and follow-ups | KEEP concept | Localized BG/RU/EN, context-aware and safe |
| Visible site-parameter summary | ADAPT | Bind to validated Florial domain state with provenance |
| Streaming chat presentation | ADAPT later | Implement only with a documented, tested SSE contract |
| Conversation history | ADAPT later | Add secure persistence only after retention/privacy design |
| Specialist escalation | ADAPT | Persist request and separately verify Resend notification; no false “specialist notified” state |
| Knowledge cards/source links | ADAPT | Use approved Florial technical sources with traceable references |
| FastAPI + MongoDB | REPLACE | Cloudflare Pages Functions + D1 only where persistence is approved |
| Emergent Gemini integration/key | REPLACE | Florial-owned provider adapter and Cloudflare secret, separately approved |
| Keyword retriever | REPLACE | Curated source registry and deterministic retrieval first; semantic retrieval only if it adds measurable value |
| Regex/text marker metadata extraction | REPLACE | Strict structured schema and runtime validation |
| Prototype seed documents | REPLACE | No sample statements in production knowledge |
| Prototype UI component library | ADAPT/REBUILD | Reuse interaction concepts, not dependency assumptions or wholesale component imports |

## 7. Target Florial architecture

1. **Florial UI** owns the conversation, progressive questions, confirmation states, source cards, site summary and next actions.
2. **Conversation/domain contract** owns canonical units, provenance, confidence, immutable user-confirmed inputs and explicit missing-data states.
3. **Gemini orchestration** asks questions, explains validated outputs, summarizes and requests missing information. It cannot invent manufacturer values, calculate final hydraulics or directly select purchasable SKUs.
4. **Deterministic Florial engine** owns geometry, manufacturer lookup, layout coverage and later separately validated zoning/hydraulic modules.
5. **Sanity catalogue adapter** resolves current published products, exact product IDs, price and stock only after engineering eligibility and complete assembly compatibility are established.
6. **Specialist handoff** uses a controlled server endpoint and Resend; status must separately represent saved request, accepted notification and human follow-up.
7. **D1 persistence** is introduced only after conversation/project ownership, retention, deletion, consent and access controls are designed and approved.

No Supabase, MongoDB or Emergent runtime is part of the target architecture.

## 8. Recommended implementation sequence

### Phase A — close the source/documentation gap
- Keep this audit as the reproducible record of what was reviewed and what was not.
- If the user can export the full Emergent project, preserve it as an isolated source archive including manifests, lockfiles and licenses. Do not import it into the runtime.
- Recover the exact prior source text only where needed; summaries are not substitutes for a reproducible source export.

### Phase B — finish the first useful Florial lawn-assistant journey
- Replace the static three-step “collect and finish” endpoint with a guided flow that produces a validated, reviewable preliminary result.
- Add geometry/measurement provenance, pressure type and test conditions, and explicit missing-data prompts.
- Invoke the existing deterministic layout engine only for supported, confirmed geometry and exact manufacturer operating points.
- Present sampled coverage, selected nozzle family/model, head count, per-head operating point and total nominal flow with clear preliminary/non-hydraulic status.
- Compare total nominal demand with measured source flow only as an intake warning, never as proof of hydraulic feasibility.
- If inputs do not match exact supported manufacturer rows or geometry is unsupported, ask for the missing measurement or offer specialist review rather than guessing.

### Phase C — product selection and commerce
- Verify complete sprinkler body/nozzle/regulator assembly compatibility.
- Resolve published Sanity product IDs, live prices and `onRequest` availability.
- Present a traceable equipment list and quantities; cart handoff only after the compatibility and price contract is tested.

### Phase D — AI, persistence and specialist operations
- Add Gemini only after the Florial server endpoint, schema validation, rate limits, privacy/consent and cost controls are designed.
- Add secure conversation/project persistence and retention controls.
- Add specialist request persistence and verified Resend notification.
- Add approved-source retrieval and source citations.

### Phase E — validation and release
- Engineer-reviewed golden cases for rectangles and L-shapes.
- Unit, contract, accessibility and BG/RU/EN tests.
- Full browser journey on mobile and desktop.
- Preview QA and exact-SHA CI.
- Separate explicit approval for Production deployment and any live D1/secret changes.

## 9. Explicit open decisions / blockers

- Complete Emergent source export and dependency/license inventory: **not preserved / not confirmed**.
- Gemini production key, budget and privacy policy: **not confirmed**.
- Pressure/flow measurement semantics in the current page: incomplete.
- Hydraulic method, source model, pipe loss coefficients, velocity limits and zoning acceptance: require engineering decisions documented in the lawn-engine specifications.
- Exact compatible body/nozzle/regulator assembly for R-VAN/HE-VAN: not fully confirmed.
- Exclusion polygons and obstacles in the placement solver: not supported.
- Conversation/project persistence, retention and deletion policy: not designed/approved.
- Specialist notification workflow: not implemented in the assistant.
- Cart handoff and final purchasable bill of materials: not implemented.

## 10. Safety and change boundary

This audit changed documentation only. No runtime source, package dependencies, Sanity data/schema, D1 schema/data, Cloudflare settings/secrets, Resend, Header, menu, Footer or Production deployment was changed. The public preview tests did not submit personal data, upload/save documents, create leads or send messages.
