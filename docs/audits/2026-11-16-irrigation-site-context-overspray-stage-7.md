# Irrigation site context and overspray validation — stage 7

Date: 2026-11-16  
Status: merged into main as preliminary stage-7 implementation; engineering validation gates remain open.

## Scope

Adds a separate, confirmed whole-site spray context without changing the existing lawn geometry contract:

- `siteBoundary`: the confirmed property/site polygon;
- `permittedSprayRegions`: explicit adjacent areas where spray from the evaluated lawn zone is allowed;
- `noSprayRegions`: explicit forbidden polygons (pool, building, path, water-sensitive area, etc.); these take precedence over all permissions;
- the target lawn remains the separate `LawnGeometryInput`.

A sample outside the target lawn is therefore not automatically a violation: it is classified as permitted adjacent spray, no-spray, unapproved on-site, or outside the site boundary.

## Code

- `src/lib/irrigation/irrigationSiteContext.mjs` and declaration: validates a confirmed context, polygon topology via the existing geometry validator, unique region IDs and containment of policy zones within the site boundary; classifies spray samples.
- `src/lib/irrigation/rainBird3500RotorEngine.mjs`: accepts optional `siteContext`; counts outside-lawn samples separately from forbidden samples and reports permitted-adjacent, no-spray, off-property and unapproved on-site counts.
- `src/lib/irrigation/rainBird3500LayoutGenerator.mjs`: validates and forwards the optional context to the independent evaluator. The current search does not yet optimize candidate directions/positions against the forbidden zones; a detected violation keeps the result preliminary.
- Tests cover confirmed context, invalid/unconfirmed geometry, permitted adjacent area, pool/no-spray area, off-property spray and precedence of no-spray policy.

## Compatibility and safety

- Existing calls without `siteContext` remain supported. They retain conservative lawn-boundary overspray detection and explicitly warn that whole-site context is missing.
- The context is optional at this isolated library stage; no customer-facing design can be called fully checked until confirmed site context is supplied.
- Spray checking remains a sampled approximation, not a continuous proof. Site-zone containment currently uses boundary sampling at 0.25 m and needs additional adversarial geometry tests / exact segment-containment hardening before high-confidence claims.
- No change to manufacturer performance data, 180° arc restriction, nozzle pressure requirements or H2H semantics.
- Hydraulics, precipitation uniformity, wind drift, installation clearance and body/nozzle/package compatibility remain `not_evaluated`.
- No 5000 MPR engine, customer-facing wiring, Sanity/D1 writes, Cloudflare settings/secrets, Resend or Production changes.

## Next engineering gates

1. Exact-head Blog/Studio and D1 CI passed before merge; PR #349 is merged. Future changes must run CI against their own exact head.
2. Add adversarial concave-site / zone-boundary tests and strengthen containment beyond sampled checks.
3. Make candidate generation reject/avoid no-spray and unapproved site areas during selection, not only after selection.
4. Add whole-site context capture to the assistant conversation, including provenance and explicit customer confirmation.
5. Obtain engineer-reviewed reference layouts and field evidence before declaring design feasibility.
6. Continue with pipe-network hydraulics, elevation, source curve / measured operating-point method and zone constraints as separate validated modules.

No manual Production deployment or live-service write was performed by this stage.


## CI follow-up

- Initial PR head `722748808f370d1dc59ff129ed09a1c862e8b84e`: D1 validation run `43855290730` passed; Blog/Studio run `43855290610` failed one new permitted-adjacent-spray fixture assertion. All other website tests passed (277/278); type-check and lint had passed.
- Root cause was the test fixture: the half-circle sector extended beyond the synthetic property's north/south edges, while the fixture expected every non-lawn sample to be permitted. The engine correctly counted those samples as outside-site forbidden spray.
- Corrected fixture now places the entire sampled sector inside the property and the explicit permitted adjacent region. Updated PR head: `2f7d9bab6883d8d6aeea3f1cfb967c4e2951eb7d`; Blog/Studio run `43855505976` was in progress at the time of this note. D1 rerun result is not yet confirmed.
- The initial fixture failure was corrected; do not treat that first failed run as a pass. Final exact-head validation is recorded below.


## Final exact-head CI verification

- Exact runtime/test code commit: `b64f6f18cdac31c0fa29064dfd2b20719a688b03`.
- Blog/Studio validation run `43855876224`: success. Type-check application/Pages Functions, lint, website utility tests, website build, migration syntax/dry-run, Studio type-check and Studio build all passed.
- D1 migration validation run `43855891392`: success.
- The corrected permitted-adjacent fixture now passes; the earlier failure was a test-fixture boundary issue, not an engine failure.
- PR #349 merged successfully at `1ddd1d99dd6cf086303c09ff2f856e96db84a8e6`; GitHub reports `merged=true` and closed.
- Later documentation-only PR head `efd03a2d7b850e37e19599e28e8d509c266636e0` passed Blog/Studio run `43860117598` and D1 run `43856450266`.
- Post-merge reads confirmed the site-context module, evaluator/generator changes, tests and this audit are present in `main`. No Production deployment or live-service write was performed.

## Merge verification

- Final PR head after synchronizing with current main: `c7eeff0b8214d2f1571ceaf0f55964975bf714a3`.
- GitHub merge commit: `1ddd1d99dd6cf086303c09ff2f856e96db84a8e6`; PR state `closed`, `merged=true`, merged at `2026-11-16T11:57:32Z`.
- Current main contains this audit and all stage-7 runtime, declaration and regression-test files.
- The merge did not deploy Production and did not modify Sanity, D1 data/schema, Cloudflare settings/secrets or Resend.
