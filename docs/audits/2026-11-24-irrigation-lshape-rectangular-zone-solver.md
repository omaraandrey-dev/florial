## Verification update — 2026-11-24

- Follow-up fix: `buildRvanStripLayout(geometry, shortSideM, connectedEnd = null)` now receives the connected edge from `buildConnectedRvanStripLayout`; connected orientation is derived from `connectedEnd`, including square bounds. The non-connected rectangular path uses its bounds as a fallback.
- Exact PR head: `dbf49336b58cb093dac7f125c6b97ac6f6a4c063`.
- Blog/Studio CI run `45347161890`: 448 passed / 0 failed; app/Pages Functions type-check, lint, website build, D1 script syntax/read-only dry-run, Studio type-check and Studio build passed.
- D1 validation run `45347161809`: success.
- Cloudflare Pages Preview deployment `980c2271-6a36-4456-86b9-59613259aa3e`: all deployment stages succeeded from the exact PR head; https://980c2271.florial.pages.dev.
- The earlier two Browser Rendering interaction cases were run on commit `16b537442d949751cb22650389681806b6a7f9f4`; they do not replace visual acceptance on this latest fix. Visual QA for all four cut-out orientations remains open.

---

# Audit — Florial L-shape rectangular-zone sprinkler layout (2026-11-24)

## Scope

Follow-up to PR #518 after owner reported that an L-shaped lawn with a narrow 16 × 2 m arm received circular R-VAN18/R-VAN24 heads and the diagram appeared to show spray outside the lawn.

## Root cause

- The special 1 m / 2 m strip branch in `irrigationLayoutBridge.mjs` was selected only for an overall rectangle.
- A six-vertex L-shape was sent to the general solver using the overall bounding dimensions, so its narrow arm was not independently classified.
- The diagram drew full-radius circles for partial 90°/180°/270° heads instead of the actual directional sector. Strip SVG arrow markers were also 4 m in user-space units, making arrowheads look like large filled spray areas.

## Implemented in PR #520

- Decompose supported orthogonal L-shapes into exact, non-overlapping rectangular calculation regions.
- Use each region's local dimensions; use the connected directional strip pattern for a supported 1 m / 2 m arm.
- Avoid duplicate heads at the shared seam; return incomplete for a conflicting short-strip corner rather than silently placing overlapping heads.
- Constrain circular candidates to their rectangle and sample the combined spray footprints against the original polygon.
- Draw partial circular sectors rather than full circles and reduce strip arrow markers to 0.32 m.
- Preserve existing pipe-network, zones, BOM, cart snapshot and PDF contracts. Fixed top-right connection point remains unchanged.

## Evidence

- PR: https://github.com/omaraandrey-dev/florial/pull/520
- Branch head: `16b537442d949751cb22650389681806b6a7f9f4`
- Blog/Studio CI: run `45342615527`, 447 passed / 0 failed; type-checks, lint and both website/Studio builds succeeded.
- D1 validation: run `45342615577`, success; read-only migration description dry-run only.
- Cloudflare Preview: deployment `e320d6d7-ae8f-4456-a91d-29572e9dbbb1`, exact source commit, all deployment stages successful; https://e320d6d7.florial.pages.dev.
- Browser Rendering preview: 28 × 14 m / 16 × 12 m top-right cut-out and transposed 14 × 28 m / 12 × 16 m top-right cut-out both produced 15 heads, 3 zones, 100% circular-zone sampled coverage, 0 uncovered circular samples and passed head-to-head.
- Automated tests cover all four cut-out corners, vertical strip, two narrow arms, arrow marker size and geometry exclusion.

## Verification boundaries

- The overspray check is sampled at 1° angular / 0.2 m radial intervals for circular sectors and 0.2 m grid spacing for strip footprints. It is not a continuous proof.
- Orange schematic line is the pipe route, not spray. The existing fixed top-right connection point is preserved and may lie in the cut-out for a top-right notch.
- Hydraulic flow/pressure, losses, precipitation uniformity, field validation and body/nozzle assembly compatibility remain outside scope.
- Only top-right horizontal and vertical preview cases were manually inspected; the remaining three corners have automated regression coverage but still need visual acceptance.
- No Production release or live data/configuration writes were made. PR #520 awaits owner approval to merge.
