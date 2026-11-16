# Irrigation assistant — conversational intake v1 implementation audit

**Date:** 2026-11-16  
**Base main:** `1be8fc11ff33ca0e18ec38895c8714669eceedf7`  
**Branch:** `feat/irrigation-assistant-conversational-intake-v1`  
**Status:** implementation candidate; awaiting exact-head CI and Preview browser QA

## Delivered in this increment

- Reworked the existing `src/pages/IrrigationAssistantPage.tsx` from a three-step static wizard into a guided conversation-style intake within the same route and Florial application shell.
- Added a localized assistant welcome, one current question at a time, prior question/answer transcript, progress indicator and a compact project facts panel.
- Preserved the existing rectangle / one-corner orthogonal L-shape geometry input, SVG preview, geometry validator and explicit customer confirmation.
- Split water-source selection from measurement capture.
- Added explicit pressure semantics: static, dynamic or unknown; a customer assertion that dynamic pressure was measured while water was flowing; and a defined measurement point (source/pump, tap or lawn entry).
- Added flow measurement method (container + stopwatch, flow meter, other verified instrument or unknown).
- Kept the obstacles/site notes as free text and clearly disclosed that they are not yet mapped as exclusion polygons.
- Added `src/lib/irrigation/irrigationIntake.mjs` as a versioned, privacy-minimized in-memory intake snapshot and conservative readiness evaluator, with TypeScript declarations and node tests.
- Readiness rules explicitly prevent static pressure from being treated as dynamic pressure, require a stated test point and measured-flow method, and always return hydraulic feasibility as `not_evaluated`. Missing pipe-network, elevation and restriction data remain visible.

## Data and safety semantics

- Geometry status is `customer_confirmed` only when the existing validator returns valid + accepted + supported. Its provenance is recorded as `customer_assertion`, not engineer approval.
- The snapshot stores metric values and the normalized geometry. It contains no customer name, phone, email, exact address or account identifier.
- The snapshot remains in page memory only. It is not persisted, sent to a server, sent to Gemini, or written to D1.
- No AI model is called. The new transcript is a deterministic guided UI, not a claim that Gemini is already connected.
- No sprinkler layout solver is invoked in this increment. No family, nozzle, operating pressure, sprinkler count, BOM or hydraulic feasibility is inferred.
- No catalogue lookup, Sanity read/write, price/stock display, cart mutation, service lead, Resend email or D1 schema/data change.
- Existing route, Header, navigation menu, Footer and launcher scope are unchanged.

## Files

- `src/pages/IrrigationAssistantPage.tsx`
- `src/lib/irrigation/irrigationIntake.mjs`
- `src/lib/irrigation/irrigationIntake.d.mts`
- `tests/irrigation-intake.test.mjs`
- `docs/prototypes/emergent-irrigation-assistant/README.md`
- `CHANGELOG.md`
- `docs/TECHNICAL_PASSPORT.md`
- `docs/AI/OPEN_QUESTIONS.md`

## Validation still required

- Exact-head CI: TypeScript, lint, all tests, website build and D1 validation.
- Preview browser QA in BG/RU/EN on mobile and desktop: transcript, geometry validation, decimal comma input, all pressure types, measurement point, flow method, back navigation, summary, no horizontal overflow and no console errors.
- Verify that the assistant remains noindex and launcher remains hidden on the assistant route.
- No Production deployment is included or authorized by this increment.

## Next implementation gates

1. Connect the intake snapshot to the existing deterministic sampled layout solver only when geometry is supported/confirmed and the customer selects or supplies an exact operating point from a verified dataset. Do not assume a pressure point from a static measurement.
2. Present layout output as sampled geometric coverage only, with all current engine warnings and explicit `hydraulicFeasibility: not_evaluated`.
3. Complete engineering validation of selection rules and exclusion/overspray behavior before enabling automatic product selection.
4. Design the separate Gemini endpoint and structured review schema after privacy, model, rate-limit, secret and cost controls are confirmed.
5. Resolve exact Sanity product/assembly compatibility and server-side cart revalidation before any purchasable BOM.

