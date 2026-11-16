# Irrigation assistant — conversational intake v1 implementation audit

**Date:** 2026-11-16  
**Base main:** `1be8fc11ff33ca0e18ec38895c8714669eceedf7`  
**Branch:** `feat/irrigation-assistant-conversational-intake-v1`  
**Status:** PR #329 merged; Production deployment succeeded; Preview full QA passed; Production visual smoke inconclusive

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

## Verification evidence

- Exact tested runtime commit: `662936768b311050699ebfb9c77c6857759aeedf`.
- Blog/Studio validation run `43834815047`: success. Application/Pages TypeScript, oxlint, all Node tests, website build, migration syntax/dry-run, Studio TypeScript and Studio build all passed.
- D1 validation run `43834815101`: success (lint, website build, Pages Functions syntax and migration validation).
- Cloudflare Pages Preview deployment `28c55ebd-71d4-49eb-952e-2d2cffd50115`, URL `https://28c55ebd.florial.pages.dev/irrigation-assistant`, deployed the exact tested runtime commit; build and deploy stages succeeded.
- Read-only browser QA passed rectangle `12 × 8 m` → `96 m²` and `40 m` perimeter, geometry confirmation, source selection, dynamic/static pressure, dynamic measurement confirmation, all test-point options, flow measurement methods, notes and summary.
- Russian and English variants loaded at `?lang=ru` and `?lang=en`; mobile viewport `390 × 844` had no horizontal overflow. No console errors, warnings, runtime errors or unhandled rejections were observed.
- No lead, message, cart, Production, Sanity write or intentional project-data D1 write was performed.
- Privacy caveat: the existing consent notice says baseline page-use events are recorded in D1 regardless of optional PostHog consent. The QA did not submit project/lead data; the existing analytics event path was not modified or re-audited here.
## Production release checkpoint

- PR #329 merged at `2026-11-16T08:59:04Z` as main SHA `77ee6047879db9112ea0eee7c542aa1e795ebcc9`.
- Cloudflare Pages Production deployment `38e83739-a57f-4e10-8d13-d2e40c60c0cc` succeeded for that exact main SHA; aliases include `https://florial-bg.com` and `https://www.florial-bg.com`.
- Read-only Production browser smoke could not verify page rendering because the browser environment returned `ERR_QUIC_PROTOCOL_ERROR` and `ERR_SOCKS_CONNECTION_FAILED`. Response metadata did confirm `noindex, nofollow, noarchive`. This is an inconclusive browser/network check, not evidence that the website is down.
- Preview full-flow QA remains the successful functional browser test. No customer data, lead, cart, Sanity write, intentional project-data D1 write or Resend email was submitted.

## Next implementation gates

1. Connect the intake snapshot to the existing deterministic sampled layout solver only when geometry is supported/confirmed and the customer selects or supplies an exact operating point from a verified dataset. Do not assume a pressure point from a static measurement.
2. Present layout output as sampled geometric coverage only, with all current engine warnings and explicit `hydraulicFeasibility: not_evaluated`.
3. Complete engineering validation of selection rules and exclusion/overspray behavior before enabling automatic product selection.
4. Design the separate Gemini endpoint and structured review schema after privacy, model, rate-limit, secret and cost controls are confirmed.
5. Resolve exact Sanity product/assembly compatibility and server-side cart revalidation before any purchasable BOM.

