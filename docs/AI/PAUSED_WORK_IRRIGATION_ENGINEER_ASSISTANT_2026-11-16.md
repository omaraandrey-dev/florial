# Handoff: irrigation engineer assistant — paused work (2026-11-16)

## Purpose of this document

This is the authoritative resume instruction for a future ChatGPT/Claude/Gemini session. The owner is temporarily switching to other Florial website work. The irrigation-engineering-assistant / Rain Bird 3500 work is paused, not cancelled. Resume only when the owner explicitly asks to return to this task.

**Resume trigger:** the owner says, for example, “Вернёмся к помощнику инженера полива” or “Продолжи работу над инженерным помощником”. Then follow the mandatory procedure below before changing anything.

## Repository and verified checkpoint

- Repository: `omaraandrey-dev/florial`
- Branch: `main`
- Main HEAD after PR #349 merge verified on 2026-11-16: `1ddd1d99dd6cf086303c09ff2f856e96db84a8e6`.
- This is a verified merge checkpoint; on any future resumption, fetch the live current main rather than assuming it is unchanged.
- Current repository instructions and core docs were reachable/read during this handoff: `AI_INSTRUCTIONS.md`, `docs/AI/START_HERE.md`, `docs/AI/WORK_PROTOCOL.md`, `docs/AI/MASTER_SPEC.md`, `docs/TECHNICAL_PASSPORT.md`, `CHANGELOG.md`, `docs/AI/OPEN_QUESTIONS.md`, and `docs/prototypes/emergent-irrigation-assistant/README.md`.
- GitHub connector connection was verified by successful reads and commit search.

## Owner's explicit pause decision

1. Do not continue the irrigation assistant or Rain Bird 3500 engineering stages now.
2. PR #349 has been successfully merged into `main` at `1ddd1d99dd6cf086303c09ff2f856e96db84a8e6`. Do not begin stage 8 or other engineering work while this workstream remains paused.
3. Do not attempt to “fix” the earlier GitHub merge timeout or 405 response now.
4. Do not resume this task just because another Florial task/chat is active.
5. The owner will work on other areas of the shared Florial website in separate chats.
6. Keep this handoff and all project knowledge in GitHub. GitHub `main` is the only permanent source of technical truth; do not rely on ChatGPT memory or Library copies.

## Exact PR state at pause

### Merged and present in main
- PR #347 — Rain Bird 3500 search-sensitivity benchmark / stage 5. Main commit: `c6ff671438f2939e93114776c24022fb1f9abd86`.
- PR #348 — Rain Bird 3500 mutual Head-to-Head-aware selection / stage 6. Main HEAD at pause: `ac705db95e87e2cd51fe74e70d15128d2833b5f7`.
- These are merged main history. Reconfirm against current main on resumption.

### PR #349 — merged and verified
- URL: https://github.com/omaraandrey-dev/florial/pull/349
- Title: `feat(irrigation): add confirmed site context and whole-site overspray checks`
- Branch: `feat/irrigation-site-context-overspray-v1`
- Final PR head: `c7eeff0b8214d2f1571ceaf0f55964975bf714a3`
- Merge commit on main: `1ddd1d99dd6cf086303c09ff2f856e96db84a8e6`
- GitHub state: `closed`, `merged=true`, merged at `2026-11-16T11:57:32Z`.
- Final branch sync commit `c7eeff0b8214d2f1571ceaf0f55964975bf714a3` has parents PR head `f7296527caf40b00dfb277bbba5e31bc579e550b` and main `5183d38231a0de608de31689f60a7f6355b050ec`; compare confirmed the PR branch was ahead of main and no longer behind before merge.
- Exact code commit `b64f6f18cdac31c0fa29064dfd2b20719a688b03`: Blog/Studio run `43855876224` and D1 run `43855891392` succeeded. Later PR head `efd03a2d7b850e37e19599e28e8d509c266636e0`: Blog/Studio run `43860117598` and D1 run `43856450266` succeeded. Changes after the code commit were documentation-only and merge synchronization.
- Post-merge reads confirmed stage-7 code, tests and audit are present on main. No Production deployment or live-service writes were performed.
- **Do not infer design readiness:** candidate search still does not optimize around forbidden zones; containment is sampled at 0.25 m; spray checks are not a continuous proof; hydraulics, DU/SC, wind drift, installation clearances and full product compatibility remain unevaluated.

### Older PR #334
- Historical docs-only PR, not part of the current #347–#349 sequence. It was previously observed stale/non-mergeable. It was not modified or merged. Reassess only if directly relevant after resumption; do not merge automatically.

## What stage 7 (#349) contains

The PR introduces an optional site-context contract with:
- confirmed site boundary;
- permitted adjacent spray regions;
- forbidden/no-spray regions;
- classifications: `target_lawn`, `permitted_adjacent`, `no_spray`, `unapproved_on_site`, `outside_site`;
- optional integration into the Rain Bird 3500 evaluator and layout generator;
- conservative legacy lawn-boundary checks when site context is absent, with a notice that whole-site context is unavailable.

The test fixture was corrected so permitted spray regions actually cover the complete on-site area outside the target lawn. Do not weaken the engine to hide out-of-site samples.

Known limitations recorded for #349:
- candidate search does not yet optimize rotor position/direction around forbidden regions; violations are detected after selection and output remains preliminary;
- zone containment uses 0.25 m sampling and needs exact-geometry/adversarial hardening;
- sampled spray checks are not a continuous mathematical proof;
- hydraulics, DU/SC, wind drift, installation clearances and complete body/nozzle/package compatibility remain unevaluated;
- no customer-facing integration, Sanity/D1 live writes, Cloudflare settings/secrets, Resend or Production changes were included.

Previously reported exact-head checks for the #349 branch:
- Blog/Studio run `43856450056` — success;
- D1 run `43856450266` — success;
- Cloudflare Pages Preview — successful for Preview only, not Production.
These run statuses and the branch head must be rechecked before any future merge.

## Engineering architecture and accepted decisions

The target workflow is:

1. Conversational Florial assistant gathers facts, asks clarifying questions and gets owner/customer confirmation.
2. Site context and geometry describe the lawn, whole property, boundaries, beds, pool, paths, buildings, neighboring areas, permitted and forbidden spray areas.
3. Deterministic Florial engineering engines calculate supported geometry, coverage, head-to-head, overspray, hydraulics and uniformity only to the extent actually implemented and validated.
4. Florial maps eligible engineering components to exact compatible published Sanity products and current price/availability.
5. Gemini performs a second-pass consistency/completeness review of the frozen deterministic proposal and explains it. Gemini must not change engineering values, select/replace products, quantities, prices, availability or cart contents.
6. The customer sees engineering status separately from AI-review status and explicitly chooses whether to add the validated proposal to cart. Server revalidates current Sanity product IDs, compatibility, price and availability.

AI collects, normalizes, clarifies and explains. Deterministic versioned Florial code is the engineering source of truth. Gemini review is not engineer certification and cannot override the calculation.

## Current technical state to preserve

- Existing customer-facing `IrrigationAssistantPage.tsx` conversational intake v1 is merged in PR #329 and was deployed to Production for main SHA `77ee6047879db9112ea0eee7c542aa1e795ebcc9`; deployment `38e83739-a57f-4e10-8d13-d2e40c60c0cc`. Its intake snapshot is in-memory and not persisted/transmitted. It does not yet invoke the solver, Gemini, catalogue, cart or project persistence.
- Existing geometry foundation: `lawnGeometry.mjs`.
- Existing R-VAN/HE-VAN data and sampled layout solver: `lawnSprinklerLayout.mjs` plus exact datasets.
- Catch-can measured DUlq utility exists (`distributionUniformity.mjs`); it calculates measured DUlq, not predicted design DU/SC.
- Rain Bird 3500 evaluator and candidate generator are separate modules; they are not integrated into the R-VAN/HE-VAN solver or customer UI.
- 3500 evidence gate: exact Rain Bird D42378 manufacturer data; verified calculation basis currently 180° only. Do not interpolate unsupported arcs, do not infer arc-specific precipitation, and do not apply disputed 25%/35% radius reduction without authoritative resolution.
- 3500 stage 5 (#347) benchmarks search-resolution sensitivity. Stage 6 (#348) constrains mutual head-to-head selection. Stage 7 site context/whole-site overspray is only in PR #349 until verified merged.
- 100% sampled geometric coverage is not proof of a correct engineering design.
- Hydraulics, pipe losses, zoning, pressure at nozzle, precipitation matching, predicted DU/SC, wind, installation clearances and complete body/nozzle compatibility are not fully implemented/validated.
- Rain Bird 5000 MPR is not an approved engine in this scope. Approved directions include R-VAN, HE-VAN and 3500.

## Roadmap when the owner resumes

Do not start automatically. First reconcile the roadmap with the then-current main and audit files.

1. **Stage 7 integration checkpoint — complete:** PR #349 is merged and its code/audit are present in main. On resumption, verify current main and review the merged stage-7 limitations before beginning stage 8.
2. **Stage 8 — overspray-aware candidate optimization:** make no-spray and permitted regions part of position/direction candidate scoring/search, not merely post-selection warnings. Validate against explicit test cases.
3. **Stage 9 — complex site geometry:** concave boundaries, narrow strips, multiple regions, pools, paths, buildings and neighboring property; harden containment and sampling, including adversarial cases and exact boundary behavior.
4. **Stage 10 — conversational project context:** guided collection of geometry/site facts, provenance, missing data, assumptions and explicit confirmation before calculation.
5. **Stage 11 — engineering verification:** source and nozzle dynamic pressure, flow, pipe internal diameter/material/length, friction losses, elevation, restrictions, zones, precipitation rates, DU/SC, wind and installation clearances. Mark unsupported outputs as `not_evaluated`.
6. **Stage 12 — reference validation:** engineer-approved real/manual layouts, rectangles and L-shapes, mirrored/rotated cases, field catch-can data, repeatability, convergence and regression acceptance.
7. **Stage 13 — commercial integration:** exact Sanity product compatibility and live price/stock, validated BOM, server-side cart revalidation, then Gemini final review under the fixed contract above.

## Mandatory resume procedure for the next chat

When the owner asks to return:

1. Fetch the live latest `main` SHA from GitHub. This recorded SHA is only a pause checkpoint.
2. Read `AI_INSTRUCTIONS.md`, `docs/AI/START_HERE.md`, `docs/AI/WORK_PROTOCOL.md`, `docs/AI/MASTER_SPEC.md`, this handoff, `docs/TECHNICAL_PASSPORT.md`, latest `CHANGELOG.md`, and `docs/AI/OPEN_QUESTIONS.md`.
3. Inspect the current prototype roadmap and relevant audit files, then inspect the actual source/tests/workflows/configuration for the next stage.
4. Verify PR #349 remains merged and confirm its merge commit and stage-7 files are present in current main.
5. Reconcile #347/#348/#349 and all related documentation against current main. Resolve any duplicate or stale status notes without deleting unrelated owner/project history.
6. Present a factual resume checkpoint: stage 7 is merged; summarize its verified scope and limitations, then propose stage 8.
7. Only then continue the next approved engineering stage. No Production, Sanity, D1, Cloudflare settings/secrets or Resend changes without the required separate owner approval.

## Out of scope while paused

All other Florial website work is allowed to continue in separate chats under the normal repository protocol. Do not mix unrelated website work into the paused irrigation branch/PR. Do not let this handoff block work on the main Florial website.

## Accuracy rule

Never describe this work as a complete automatic irrigation design. Always separate:
- code implemented;
- CI-tested at an exact SHA;
- Preview-verified;
- Production-deployed;
- live-service verified;
- owner/engineer validated;
- not yet implemented or not confirmed.
