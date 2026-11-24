# Florial 3504-PC — global rectangular rotor layout v2

## Purpose

Replace greedy point-by-point rotor placement with a whole-rectangle layout search. The specific regression target is a 38 × 16 m rectangle where the previous greedy rotor pass overpopulated the far end.

This is a bounded change to the 3504-PC rotor path. The existing R-VAN solver in \`src/lib/irrigation/lawnSprinklerLayout.mjs\` is not modified.

## Owner-approved planning values

- Default rotor planning radius: 8 m.
- Local increase: 9 m when the 8 m whole-rectangle arrangement leaves sampled gaps and the selected head has sufficient geometric clearance.
- 10 m is the last expansion step and should be exceptional.
- Shorter local planning radii: 7 m, 6 m and 5 m when the geometry cannot safely accommodate the default reach.
- These are Florial geometric planning assumptions. They are not Rain Bird manufacturer performance-chart guarantees, measured field throws or hydraulic design values.

## v2 placement process

1. The bridge continues to decompose supported orthogonal lawns and rectangular exclusions into non-overlapping rectangular calculation zones, in its existing order.
2. Each circular calculation rectangle first enters the dedicated 3504-PC solver. Existing narrow 1 m / 2 m directional R-VAN strip rules remain unchanged.
3. The rotor solver begins with an 8 m anchored rectangular grid. The grid is generated for the entire rectangle, not as a sequence of greedy repairs to the currently uncovered tail.
4. Each position receives a sector appropriate to its geometry: 90° at corners, 180° on an edge and 360° in the interior. The complete sampled sector footprint must remain inside the calculation rectangle.
5. A head's radius is capped by its local geometric clearance. If sampled points remain uncovered, the solver increases only the useful local candidates, one metre at a time, up to 9 m and then 10 m, and only where the enlarged sector still fits inside the rectangle.
6. Redundancy pruning then attempts to remove heads. A head is removed only when the remaining set still has complete sampled coverage and every remaining head still passes the mutual Head-to-Head check.
7. If the 8 m grid plus local extensions cannot produce a valid layout, the solver tries the remaining global planning stages in order: 9 m, 10 m, then 7 m, 6 m and 5 m. The first complete, Head-to-Head-valid stage wins.
8. If no rotor-only layout passes, the bridge invokes the existing R-VAN solver unchanged for that rectangle.
9. Final composite spray-boundary validation, zone grouping, pipe schematic and BOM remain in the existing bridge flow.

## Shared-region handling

Previously placed heads are passed into the rotor solver for sampled coverage reuse. A candidate that would exactly coincide with an existing head is shifted 7.5 cm toward the rectangle interior before sector validation. This supports the owner-approved small physical separation at a shared seam rather than suppressing the adjacent rectangle's candidate outright.

## Acceptance cases

- 38 × 16 m: 8 m is the selected default stage; complete sampled coverage, Head-to-Head pass, no R-VAN heads in the rectangle, no greedy tail cluster.
- 10 × 10 m: local clearance may reduce an interior head's radius while preserving coverage and Head-to-Head.
- 18 × 4 m: rotor-only path declines because the short side is below the 5 m minimum planning envelope; unchanged R-VAN fallback remains responsible for this geometry.
- Rectangular exclusion: the dedicated rectangle solver refuses geometry with exclusions; the existing decomposition bridge supplies exclusion-free rectangular calculation zones.

## Engineering limits

- Coverage is checked on a 0.5 m sampled grid by default. It is not a continuous mathematical proof.
- Head-to-Head is a geometric sector/reach check, not a precipitation-uniformity, DU/CU or hydraulic test.
- No nozzle-specific flow, dynamic pressure, pipe loss or zone hydraulic feasibility is inferred for the 3504-PC.
- The 5–10 m radii are planning assumptions only.
- The solver is deliberately limited to one axis-aligned rectangle per invocation; decomposition remains the bridge's responsibility.
