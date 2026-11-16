# Irrigation lawn geometry core v1 — implementation audit

**Date:** 2026-11-16  
**Status:** implemented in draft PR #314; not merged  
**Base:** \`main\` at \`a9dc18be8a0d0c2266bd77170c0f8dd6b1ce8219\`  
**Scope:** deterministic geometry validation only

## Purpose

Introduce a small, pure geometry module for the first automatic lawn-irrigation module. The module is independent of React, Sanity, Cloudflare, D1, Resend and any LLM provider.

It validates metric lawn geometry and computes geometry facts. It does not design a sprinkler layout or establish irrigation feasibility.

## Files

- \`src/lib/irrigation/lawnGeometry.mjs\` — runtime validator.
- \`src/lib/irrigation/lawnGeometry.d.mts\` — TypeScript domain and result declarations.
- \`tests/irrigation-lawn-geometry.test.mjs\` — Node test coverage.

## Input contract

A geometry input uses schema version 1 and the local Cartesian metre coordinate system:

- \`coordinateSystem: "local_cartesian_m"\`;
- \`status: draft | needs_scale | needs_confirmation | confirmed\`;
- one or more regions, each with an ID and outer polygon ring;
- optional polygon exclusions with IDs and kinds;
- optional separately reported area in m².

Coordinates are engineering metres, not latitude/longitude or screen pixels. An open ring is normalized to a closed ring. The validator removes redundant collinear intermediate vertices where safe.

## Validation performed

- Schema version and coordinate-system checks.
- Finite coordinate and reported-area checks.
- Ring vertex count, consecutive duplicate and zero-area checks.
- Self-intersection detection, including non-adjacent crossings and adjacent collinear edge reversals.
- Region and exclusion ID uniqueness.
- Exclusion containment and overlap checks.
- Lawn-region overlap checks.
- Finite area/perimeter result checks.
- Shape classification for the v1 solver envelope.

## Supported envelope

- One rectangular lawn region.
- One orthogonal L-shaped lawn region.
- Polygon exclusions fully contained inside the outer boundary and not touching or overlapping another boundary.
- Multiple valid regions can be represented and measured, but the v1 solver status is \`unsupported\`; this module does not combine them into a sprinkler layout.

Other simple polygons may be topologically valid, but are marked unsupported for the v1 solver. Geometry validity and solver support are separate.

## Output semantics

- \`valid\` means the supplied polygon topology and numeric inputs passed validation. It does not mean the geometry is supported for automatic layout.
- \`supported\` indicates whether the geometry falls inside the v1 shape/region envelope.
- \`status: accepted\` is returned only for valid, supported geometry explicitly marked \`confirmed\`.
- \`needs_scale\` and \`needs_confirmation\` remain non-accepted states.
- \`computedAreaM2\` is the net area after subtracting valid exclusions.
- \`computedPerimeterM\` sums outer and exclusion boundary lengths.
- \`reportedAreaComparison\` reports the difference but deliberately applies no tolerance. No engineering mismatch threshold has been approved.

## Deliberate limitations

- No 2D editor or customer form integration is included.
- The validator assumes coordinates have already been transformed into metric local Cartesian coordinates. The upstream intake/editor must provide and verify scale evidence before setting \`status: confirmed\`; this module does not infer scale from images or pixels.
- Provenance, confidence and scale-evidence capture are not yet wired into this runtime input contract.
- No sprinkler candidate placement, head-to-head spacing, coverage mesh, uniformity, precipitation compatibility, zoning, pipe sizing, pressure-loss or hydraulic solver is implemented.
- No manufacturer dataset, catalogue SKU, price, stock, cart, API, database or persistence integration is performed.

## Test coverage

The test file covers rectangle and L-shape area/perimeter, ring normalization, orientation independence, scale/confirmation states, invalid coordinates and schema, duplicate vertices/IDs, too-few and zero-area rings, self-intersections, unsupported shapes, multiple regions, overlapping regions/exclusions, contained exclusions, reported-area comparison without an invented tolerance, malformed exclusion lists and numeric overflow.

## Verification boundary

The implementation is isolated to source, declaration, test and this audit file. It does not modify the existing assistant page, global site UI, routing, Sanity, Cloudflare configuration/secrets, D1 schema/data, Resend or Production deployment.

The PR remains a draft pending review. Shared \`CHANGELOG.md\`, technical passport and open-question updates are intentionally deferred to one synchronized documentation pass because other open PRs currently modify those shared files.
