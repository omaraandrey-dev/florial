## 2026-11-16 — Irrigation assistant breadcrumbs and first Rain Bird dataset (PRs #308–#310)

- Assistant navigation: the top of `/irrigation-assistant` now has localized semantic breadcrumbs to `/`, `/category/vsichko-za-polivane` and `/services/category/polivni-sistemi`; the current assistant page is the final non-linked item. PR #308 merge SHA `56ce170dc100f900d55c0cfb85bdfc402fb3345e`.
- Sanity Production read-only inventory: 20 sprinkler/body and 26 nozzle products; all 46 have published EUR prices and `stockStatus: onRequest`; all 46 have `productType: null`. Use category references for equipment membership. Exact IDs/SKUs and verified manufacturer references: `docs/audits/2026-11-16-irrigation-assistant-rainbird-data-audit.md`. PR #309 merge SHA `40c0e06e077a389f3b2f15bd6d4d89792a41ae69`.
- Code-owned Rain Bird 3500 dataset: `src/lib/irrigation/irrigationPerformanceData.mjs` plus `.d.mts`, with 36 exact metric operating points from D42378 (2023), mapped to Florial 3504-PC SKU Y34001 and 3504-PC-SAM SKU Y34500. Exact lookup only; no interpolation or extrapolation. Six Node tests added. PR #310 merge SHA `a9dc18be8a0d0c2266bd77170c0f8dd6b1ce8219`.
- Exact-head Blog/Studio and D1 CI succeeded for all three PRs: #308 runs `43789182046` / `43789182043`; #309 `43789391620` / `43789391605`; #310 `43789456998` / `43789457001`.
- Final main Pages deployment for `a9dc18be8a0d0c2266bd77170c0f8dd6b1ce8219` was queued when this entry was written; production success remains to be confirmed.
- Calculator, geometry editor, hydraulic zones/pipe solver, cross-family catalogue selector, cart/PDF and Gemini integration remain unimplemented. No Sanity writes/schema changes or Cloudflare/D1/Resend settings/data changes were made.

## 2026-11-16 — Irrigation direction introduction video (PR #305)

