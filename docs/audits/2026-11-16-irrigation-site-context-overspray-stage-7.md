# Irrigation site context and overspray validation — stage 7

Date: 2026-11-16  
Status: implementation candidate; CI and engineering review pending.

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

1. Run exact-head Blog/Studio and D1 CI; inspect failures and fix before merge.
2. Add adversarial concave-site / zone-boundary tests and strengthen containment beyond sampled checks.
3. Make candidate generation reject/avoid no-spray and unapproved site areas during selection, not only after selection.
4. Add whole-site context capture to the assistant conversation, including provenance and explicit customer confirmation.
5. Obtain engineer-reviewed reference layouts and field evidence before declaring design feasibility.
6. Continue with pipe-network hydraulics, elevation, source curve / measured operating-point method and zone constraints as separate validated modules.

No manual Production deployment or live-service write was performed by this stage.
