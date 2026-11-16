# Rain Bird 3500 — mutual head-to-head-aware candidate selection, stage 6

Date: 2026-11-16
Status: implementation candidate; exact-head CI and benchmark verification pending.

## Problem found in stage 5

The coverage-only greedy selector returned 100% sampled coverage while every benchmark case failed mutual directional head-to-head. Several L-shape layouts used a single rotor, which cannot have a head-to-head neighbour. The rectangle layouts selected two rotors whose sectors did not mutually reach one another.

## Change in this increment

- Candidate selection now searches for a seed pair of distinct rotor positions that mutually reach each other within the exact D42378 throw radius and their respective 180° sectors.
- The seed pair is selected by combined sampled target coverage, then minimum individual coverage and total coverage as deterministic tie-breakers.
- Additional rotors may be selected only when they mutually connect to at least one already selected rotor and add uncovered sampled targets.
- If no mutually connected seed pair exists, the generator returns `no_head_to_head_layout` with no sprinkler recommendations.
- The independent evaluator remains the final check; every selected rotor must have at least one mutual neighbour according to its current nearest-mutual-neighbour diagnostic.

## Limits intentionally not solved

- This does not constrain or optimize overspray. Stage 5 showed overspray on every tested 180° layout. The generator must keep returning preliminary status where overspray is detected.
- The current geometry contract knows the lawn polygon, not the complete site boundary, no-water surfaces, or adjacent permitted irrigated areas. Outside-lawn spray is therefore a conservative diagnostic, not a full site-context judgement.
- The evaluator checks at least one nearest mutual neighbour per rotor, not every engineer-defined head-to-head edge.
- Exact D42378 operating points and 180° only remain. No interpolation, radius adjustment, other arcs or 5000 MPR.
- Hydraulics, zone sizing, precipitation uniformity/DU/SC, exclusions, product package compatibility, Sanity catalogue mapping and customer-facing integration remain unevaluated.

## Validation required

1. Exact-head CI passes.
2. Existing rectangle, L-shape, mirror and rotation regression tests pass and all returned layouts have H2H checks passed.
3. Re-run stage-5 benchmark matrix against this branch and compare rotor count/coordinates, coverage and overspray. Do not claim success if overspray persists.
4. Manual engineer-reviewed reference layouts are still required before treating the generator as a design tool.

No Sanity/D1 writes, Cloudflare settings/secrets, Resend, customer-facing wiring or Production changes are included.
