# Florial irrigation layout algorithm update — 2026-11-24

## Scope

Implement the owner's latest layout rules in the existing geometric lawn assistant. No Sanity, D1, Cloudflare configuration, Resend, checkout order or Production data writes.

## Owner-approved rules

- R-VAN14 planning radius 3 m; R-VAN18 4/5 m; R-VAN24 6 m.
- Radius is independent of arc; 90/180/270/360 changes sector shape only.
- Default sample mesh 0.5 m.
- L-shape interior positions use the same rectangular grid principle as rectangles and are clipped to the original polygon; no triangular/staggered grid.
- R-VAN14/18/24/RCS can be mixed in one zone.
- Manufacturer precipitation-intensity compatibility is owner-confirmed; no additional zone precipitation-intensity matching gate.
- R-VAN-RCS applies to rectangular widths 1 m and 2 m, with planning throw lengths 2 m and 4 m respectively. First head at lower-right, subsequent heads evenly distributed along the same long side. For width 2 m, length 4/6/8 m gives 1/2/3 heads.

## Implementation files

- src/lib/irrigation/lawnSprinklerLayout.mjs — 0.5 m default, arc-independent R-VAN planning radii, rectangular L-shape interior lattice.
- src/lib/irrigation/irrigationLayoutBridge.mjs — R-VAN model/radius selection and owner-defined RCS strip placement.
- src/lib/irrigation/irrigationBillOfMaterials.mjs — R-VAN-RCS SKU A84668.
- src/pages/IrrigationAssistantPage.tsx — RCS pattern presentation, no circular sampled-coverage claim, project snapshot metadata.
- functions/api/_lib/irrigation-project.mjs — validates and persists strip pattern metadata.
- functions/api/_lib/irrigation-project-pdf.ts — owner PDF labels RCS as a strip pattern.
- Irrigation tests and the engineering guides / changelog / passport / open questions updated.

- Read-only Sanity Production lookup confirmed the published catalogue product for SKU A84668: product ID 42f54182-8fc4-41ee-9b8c-2c50b504907d, active=true, stockStatus=onRequest. No Sanity document was written.

## Deliberate boundaries

- RCS is represented as pattern: strip with arcDeg: null. The UI/PDF display RCS strip dimensions; it is never represented as a circular sector.
- RCS strip placement is not claimed as sampled circular coverage. The page shows coverage as not applicable for this pattern.
- R-VAN manufacturer flow/precipitation rows remain exact lookup data; the Florial planning radius is the owner's fixed geometric rule.
- Hydraulic feasibility, source flow/pressure, pressure losses, actual nozzle pressure, overspray, field distribution uniformity and body assembly compatibility are not added to this work.
- Six heads per zone remains the existing grouping rule, not a hydraulic calculation.

## Verification status

- Implementation is on PR #515, branch feat/irrigation-rvan-r1-rcs-layout-rules, based on main commit ceae0797b3ca75251b275e3c17ced09773b1a6cb.
- PR-head CI passed: application/Pages Functions type-check, lint, full website utility tests, website build, Studio type-check and build, plus D1 migration validation.
- Cloudflare Pages Preview deployment ba29688a-1117-4c5b-bbfc-1c84260cef0b succeeded at https://ba29688a.florial.pages.dev for code commit 689a619296892b135e4755160c5c4b8bb126b386.
- No Sanity writes, D1 schema/data changes, Cloudflare settings/secrets changes, Production order/email writes or Production deployment.
- PR #515 merged to main as commit 6057a28159282e1449fde961613dee301480d93c. Cloudflare Pages Production deployment 5be817f9-e59e-4744-92bb-3f88cfceffa8 completed successfully on 2026-11-24. Canonical aliases florial-bg.com and www.florial-bg.com are attached. Production release verification is complete.
