# Irrigation assistant — perimeter-first standard design basis

> **Final status update — 2026-11-22:** This audit is an implementation history, not a pending branch. PR #473 was squash-merged into `main` at `1926d632cc0861341a46ec932a2130ca94dfa103`; exact-merge Cloudflare Pages Production deployment `0da20669-6b24-4697-8ac4-b281eebec9a2` succeeded. The owner manually accepted the Preview UI. The complete current behavior and limitations are documented in [IRRIGATION_ASSISTANT_PERIMETER_FIRST_IMPLEMENTATION_V1.md](../engineering/IRRIGATION_ASSISTANT_PERIMETER_FIRST_IMPLEMENTATION_V1.md). The current runtime constant is Ø25 mm for both main and zone pipe routes; an earlier audit paragraph below states Ø32 mm for the main, and this discrepancy remains open rather than silently reconciled.


Date: 2026-11-22  
Branch: `feat/irrigation-perimeter-first-standard-basis`  
Base: `b48d6c5b354c500250957355b4eb90751be072d0`  
Status: implementation in progress; CI and browser QA pending.

## Owner-approved scope

The first customer-facing design stage is limited to small residential lawns and relatively small private hotels. Large hotel complexes, parks, sports fields and other large-scale systems require a separate professional engineering project and are outside this automatic assistant scope.

Current geometry scope remains one confirmed rectangle or orthogonal L-shaped lawn. The site is treated as flat. Plants, trees, shrubs, flower beds, drip irrigation and other landscape zones are later phases and are not part of this increment.

## Standard design assumptions

The customer is not asked to identify the water source or enter pressure/flow measurements during the initial lawn layout. The calculation snapshot records the following Florial standard assumptions:

- 4 atm at the 1-inch inlet tap (normalized as 4.053 bar);
- incoming supply pipe: nominal Ø25 mm;
- calculation starts at the 1-inch tap;
- main line: nominal Ø32 mm;
- zone laterals: nominal Ø25 mm;
- project allowance for pipe pressure loss: 1 bar per 100 m;
- project allowance for elevation pressure loss: 1 bar per 10 m;
- flat-site assumption, so no elevation-loss term is applied to the current lawn geometry.

These are owner-approved standard project assumptions for this target market, not universal hydraulic laws and not a measurement of the customer's actual supply. If the actual site differs, that is handled in a later engineer/customer dialogue. The present implementation does not claim hydraulic feasibility and does not yet calculate zone pipe losses, valve limits, pump duty or residual nozzle pressure.

## Intake UX

`src/pages/IrrigationAssistantPage.tsx` now limits customer intake to:
1. lawn shape and dimensions, with customer confirmation of the outline;
2. optional site notes.

Water source, static/dynamic pressure, measured flow, test-point and elevation questions have been removed from the initial customer flow. The standard design basis is displayed in the project summary.

`src/lib/irrigation/irrigationIntake.mjs` stores the standard assumptions in the immutable intake snapshot. Geometry readiness is independent of customer water measurements. Hydraulic readiness deliberately remains false / `not_evaluated`.

## Perimeter-first placement

`src/lib/irrigation/lawnSprinklerLayout.mjs` now uses a two-pass deterministic strategy:

1. Generate and evaluate boundary candidates (corner and straight-edge heads).
2. Run greedy sampled coverage using boundary candidates only.
3. Only if the perimeter pass leaves sampled lawn points uncovered, evaluate interior candidates to fill the remaining points.
4. Run the existing head-to-head repair pass. It may add a further candidate, including an interior head, if a selected head has no valid mutual head-to-head neighbour.
5. Return diagnostics describing whether the perimeter-only pass was sufficient and why the interior pass was activated.

Boundary edge spacing is constrained by the smaller 90°/270° corner-arc radius, not just the 180° edge-head radius. Even segment division also places a candidate at each edge midpoint, so a corner's shorter throw does not leave an unsupported gap at the start of an edge.

This is still sampled geometric coverage at the configured sample interval. It is not a continuous mathematical proof, a precipitation-uniformity calculation or a finished hydraulic design.

## Rain Bird preference and current manufacturer-data boundary

Rain Bird R-VAN is the preferred rotary-nozzle family. Model selection uses half the lawn's short side as the initial cross-lawn head-spacing target, consistent with the manufacturer's 50%-of-throw-diameter spacing basis. The bridge uses:
- R-VAN14 for a half-short-side target of 4.0–4.6 m (lawn short side 8.0–9.2 m);
- R-VAN18 for above 4.6 m through 5.5 m (lawn short side above 9.2 m through 11.0 m);
- R-VAN24 for above 5.5 m through 7.5 m (lawn short side above 11.0 m through 15.0 m);
- the existing Rain Bird HE-VAN dataset for narrower geometry (half-short-side target 1.8 m to below 4.0 m).

Model choice remains a preliminary candidate rule and requires engineering review. Exact manufacturer operating points are used; there is no interpolation. At the 3.1 bar design point, the R-VAN18 radius is 5.2 m and the R-VAN24 radius is 7.0 m.

### Owner reference cases: 20 × 10 m and 20 × 15 m

The solver now has regression scenarios for both owner examples:
- **20 × 10 m:** the initial target is 5.0 m; R-VAN18 is selected. The perimeter-only pass is expected to cover the sampled lawn, so no central row is selected.
- **20 × 15 m:** the initial target is 7.5 m; R-VAN24 is selected. The perimeter-only pass leaves a central coverage band, so a single central row parallel to the long side is evaluated and selected to fill it.

For rectangles, interior candidates are generated as one central row parallel to the long side, not a generic triangular lattice. That row is only used if the perimeter pass leaves sampled points uncovered. L-shaped lawns retain the existing conservative interior lattice.

These are sampled-geometry scenarios, not continuous coverage proofs or hydraulic certification. The 3500 dataset remains outside the placement solver because its existing evaluator accepts supplied 180° positions only and the manufacturer precipitation table is based on half-circle operation. Do not copy those values to other arcs.

## Not implemented in this increment

- Automatic Rain Bird 3500 position generation.
- A complete pipe hydraulic calculation, pipe-sizing verification or zone grouping.
- Valve/controller/pump/tank selection.
- Verified body/nozzle assembly and package compatibility.
- Overspray/exclusion geometry.
- Precipitation uniformity / distribution uniformity.
- Sanity SKU, live price/stock, BOM or cart handoff.
- Plants and non-lawn irrigation types.

No Sanity, D1, Cloudflare settings/secrets, Resend, catalogue or Production data are changed by this work.

## Verification status

Verified on PR head `db08cb760bdab283e57c719008194671c1094e3a`:

- Blog and Studio validation run `44986079873`: success. Application/Pages Functions type-check, lint, 390 website utility tests, website build, migration syntax check, read-only description-migration dry-run, Studio dependency install, Studio type-check and Studio build all passed.
- D1 migration validation run `44986079881`: success.
- Cloudflare Pages Preview deployment `982809fe-9e0c-4ec0-a8b5-bc033ab7b94c`: success. Preview URL: https://982809fe.florial.pages.dev.
- Read-only browser QA on the Preview confirmed Bulgarian, English and Russian variants; customer intake asks only for lawn shape/dimensions and optional notes. Water-source, pressure, flow and elevation questions are absent. Standard assumptions are shown in the project summary.
- Confirmed **20 × 10 m** rectangle: 200 m²; Rain Bird R-VAN18 at 3.1 bar; 14 heads, all on the perimeter; 100% sampled coverage; zero uncovered control points; head-to-head passed; no central heads.
- Confirmed **20 × 15 m** rectangle: 300 m²; Rain Bird R-VAN24 at 3.1 bar; 11 heads total (9 perimeter + 2 central-row heads); central heads at (6.67, 7.5) and (13.33, 7.5), both 360°; 100% sampled coverage; zero uncovered control points; head-to-head passed.
- No external forms were submitted and analytics consent was not changed.

These are preliminary geometric scenarios based on exact manufacturer-table points and the configured sample grid. They are not continuous coverage proofs or hydraulic certification. No Sanity, D1 application data, Cloudflare settings/secrets, Resend, catalogue or Production data changed. No merge to `main` and no Production deployment have been performed.


---

## Owner feedback follow-up — sequential zones, catalog BOM and cart handoff (2026-11-22)

### Sequential perimeter zone assignment

The owner tested the 30 × 30 m Preview and requested that zone membership follow the actual perimeter walk rather than balancing heads across opposite sides.

- Start at the top-right source corner and follow the polygon boundary continuously: left along the top edge, then down and around the remaining perimeter.
- Assign each consecutive group of up to six perimeter heads to one zone. Never balance a zone by borrowing heads from the opposite side of the perimeter.
- After all perimeter heads are assigned, group interior 360° heads into the final zone(s), up to six per zone.
- Perimeter zone pipe routes now retain the same continuous forward perimeter direction. Interior zone routes may use the nearest side of the source connection.
- The 30 × 5 m reference test changes from balanced 5+5+4 to sequential 6+6+2 (14 perimeter heads). The 30 × 30 m test asserts that interior groups come after all perimeter groups.

This is a routing/zone grouping rule, not a hydraulic validation. The six-head limit remains the current Florial project standard and must not be interpreted as a universal valve or hydraulic limit.

### Equipment bill of materials

Added `src/lib/irrigation/irrigationBillOfMaterials.mjs` to create a deterministic SKU/quantity list from the selected layout and zone assignment. The assistant loads the exact active published Sanity products and only enables the cart action when the layout is generated, head-to-head checks pass, every sprinkler is assigned to a zone, and every required SKU resolves to an active product.

- One nozzle per sprinkler, mapped by selected model and arc:
  - R-VAN14 / 18 / 24: A84659 / A84660 / A84661.
  - Full-circle R-VAN14F / 18F / 24F: A84664 / A84665 / A84666.
- One Rain Bird 1804 body (A44120) per sprinkler.
- Two SBE-050 elbows (A46010) per sprinkler.
- One metre of SPX-FLEX per sprinkler; catalogue product A82060 is sold as a 30 m coil, so cart quantity is rounded up to complete coils.
- Per zone: one Rain Bird 100-HV valve (H01000), two 25 × 1-inch male compression adapters (IQ21120M0N25D), one smallest valve box Rain Bird VBA02672, and one 25 × ½-inch female-thread elbow (IQ21820F0N25B) for the last sprinkler.
- The published VBA02672 product record confirms it is the smallest valve box in the current Florial catalogue search: 160 mm lid diameter, 200 mm base diameter, 236.5 mm height; it is described for one valve. The BOM therefore uses one box per valve.
- Per zone, all other sprinklers use the corrected 25 × ½-inch female-thread tee (IQ21520F0N25C), one per non-terminal head.
- Between zones: one 25 mm equal tee (IQ2142000N250) for each additional valve connection; quantity = zone count − 1.

No controller, cable, source pump, mainline PE pipe length or full hydraulic pipe sizing is inferred by this BOM. The current catalogue search did not identify a published 25 mm PE mainline pipe SKU, so no such product/quantity is fabricated. The pipe-route drawing remains a preliminary geometric route, not a measured trench/installation length.

### Sanity product correction — published

Owner identified a catalogue description error for `IQ21520F0N25C` (document `19c359d0-0db5-43da-87ab-0e495c8df85a`). The published product was incorrectly described as 25 × ¾-inch female thread. Owner confirmed the correct item is 25 × ½-inch female thread.

Corrected and published BG/RU/EN name, description, short description, size specifications, SEO H1/title/description and image alt text. The exact three-way size is now stated as Ø25 × ½″ female thread × Ø25 mm (two 25 mm compression ends plus one ½″ female-thread outlet). SKU, slug, price, stock status, image asset, brand and references were preserved. Read-after-write verified the published document at revision `OponBjXsnmvGHZLuzZhRoC`. Pre-change snapshot: `docs/backups/sanity-product-IQ21520F0N25C-before-2026-11-22.json.md`.

### UI and cart

- Added an explicit “Add complete kit to cart” action to the generated layout result.
- Connected it to the existing storefront `handleAddToCart` and `navigateToCart` flows. The cart receives catalogue product IDs, current published prices, translations, image metadata, stock status and weights.
- Product lookup is read-only. No catalogue product price or stock is copied into a hardcoded BOM; the SKU mapping is limited to engineering compatibility and quantities. The GROQ cart lookup selects only translated product names (not full Portable Text translations); a full 15-SKU query exceeded Sanity's 64 KiB response limit, while the reduced query was successfully validated against all 15 active product records.
- The customer is routed to the cart after all kit lines are added. Existing cart behavior merges matching product IDs.
- Added regression tests for sequential zones, BOM quantities, unknown nozzle mapping, incomplete zone assignment and cart integration.

### Verification status after this follow-up

- Code changes are on the existing PR #473 head branch `feat/irrigation-perimeter-first-standard-basis`, based on `main` `b48d6c5b354c500250957355b4eb90751be072d0`.
- The previous PR #473 browser QA results apply to its earlier head only. GitHub Blog/Studio validation (including typecheck and website utility tests) and D1 migration validation passed on code/docs commit `4abb74a46e0087f3135c4bdce153df8a707247f4`. The latest follow-up commit `82c6f8037d05737803a9f68e26acc1c49de51cfe` narrows the Sanity cart lookup query; D1 validation passed for this commit and Blog/Studio validation was still running at the time of this audit update. Cloudflare Pages Preview deployment `eabdb214-b9bd-4aa2-97ab-2397cb3ede14` for commit `82c6f8037d05737803a9f68e26acc1c49de51cfe` completed build and deploy successfully at `https://eabdb214.florial.pages.dev`. Browser visual QA remains pending because the owner requires explicit permission before Browser Use.
- Browser Use was not invoked; owner-controlled browser QA remains pending.
- No merge, Production code deployment, D1 write, Cloudflare settings/secrets change, Resend action or order creation was performed.
- Sanity Production was changed only for the single explicitly approved product correction described above.
- Shared `CHANGELOG.md`, Technical Passport and OPEN_QUESTIONS remain deferred while overlapping documentation work is open; integrate these records once the related PRs are reconciled.
