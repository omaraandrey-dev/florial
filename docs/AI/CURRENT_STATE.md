# Current implementation under review — L-shape rectangular-zone solver (2026-11-24)

- PR #520 is open: https://github.com/omaraandrey-dev/florial/pull/520.
- Branch: `fix/irrigation-lshape-rectangular-zone-solver`; exact reviewed head: `16b537442d949751cb22650389681806b6a7f9f4`.
- Supported L-shapes with a 1 m / 2 m arm are split into two exact rectangular calculation regions; the wide region uses boundary-safe R-VAN placement and the narrow connected arm uses directional LCS/RCS/SST placement.
- The 28 × 14 m / 16 × 12 m top-right cut-out and the transposed 14 × 28 m / 12 × 16 m top-right cut-out both passed Preview interaction: 15 heads, 3 zones, 100% sampled coverage in the circular zone, 0 uncovered circular samples and head-to-head passed.
- Blog/Studio CI run `45342615527`: 447/447 tests passed; TypeScript, lint, website build, Studio type-check and Studio build succeeded. D1 validation run `45342615577` succeeded. Cloudflare Pages Preview deployment `e320d6d7-ae8f-4456-a91d-29572e9dbbb1` succeeded from the exact head.
- Other three cut-out corners have automated regression coverage but still need visual Preview acceptance. Hydraulic/field validation remains open.
- PR #520 has not been merged; Production remains on the existing `main` release. No Sanity writes, D1 schema/data changes, Cloudflare settings/secrets changes, Production orders/emails or Production deployment were performed.
- Engineering details: `docs/engineering/IRRIGATION_ASSISTANT_L_SHAPE_RECTANGULAR_ZONES_V1.md`; evidence: `docs/audits/2026-11-24-irrigation-lshape-rectangular-zone-solver.md`.

---

# Latest merged main release — irrigation assistant L-shape orientation and narrow-strip layout (2026-11-24)
