# Audit — 3504-PC global rotor layout v2

Date: 2026-11-24  
Base: \`main\` at \`d9a24afc4ba04f36b4bf027646eba986e38156f5\`  
Working branch: \`feature/irrigation-3504pc-global-layout-v2\`

## Scope

Implement a whole-rectangle 3504-PC rotor placement algorithm in a fresh branch from current main. Preserve the existing R-VAN placement algorithm and narrow-strip rules.

## Changes

- Added \`src/lib/irrigation/rainBird3504Layout.mjs\`: 8 m default global rectangular grid, local 9/10 m extension for remaining samples where geometry permits, smaller 7/6/5 m fallback stages, sampled coverage, sector boundary fit, mutual Head-to-Head validation and redundancy pruning.
- Integrated rotor-first selection in \`src/lib/irrigation/irrigationLayoutBridge.mjs\` for ordinary rectangles and decomposed circular rectangles. R-VAN is used only when the rotor-only solver does not produce a complete valid layout.
- Kept \`src/lib/irrigation/lawnSprinklerLayout.mjs\` unchanged.
- Added the 3504-PC rotor SKU to BOM generation; rotor heads do not receive an 1804 body through the R-VAN body path.
- Extended project snapshot validation/persistence to retain \`pattern: rotor\` and accept only 3504-PC rotor heads with planning radii 5–10 m.
- Distinguished rotor heads in the customer diagram with a triangle marker and explicit radius in the positions list.
- Added regressions for 38 × 16 m, 10 × 10 m, narrow-rectangle fallback, exclusions, BOM and project snapshot persistence.

## Validation boundary

CI has not yet been run for this branch at the time of this audit. No Preview or Production deployment is claimed. No Sanity writes, D1 writes/migrations, Cloudflare configuration changes or Production changes were made.

## Owner acceptance still required

Review the 38 × 16 m Preview and confirm the whole-rectangle rotor distribution, especially the far end. The exact selected head count and positions are determined by the validated grid/pruning result; do not treat the automated coverage metric as proof of field uniformity.
