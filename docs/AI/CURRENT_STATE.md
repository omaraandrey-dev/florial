# Current implementation handoff — irrigation assistant PAUSED by owner (2026-11-24)

**Status: PAUSED. Do not continue development until the owner explicitly returns with an error report or a new task.** No proactive refactoring, optimization, solver adjustment, visual redesign or code fix is authorized.

## 2026-11-24 — irrigation assistant paused by owner

- **Owner decision:** pause all further development of the irrigation-design assistant until the owner returns with observed errors or a new task. This is an intentional project pause, not a request to continue polishing, optimize, refactor, or proactively fix anything.
- **Frozen baseline:** PR #530 is merged. Its merge commit is `ac29eafb5e4e1af4706c05e28e9de9fe31743336`; PR #530 integrates PR #527 and #528. The geometric 3504-PC corner-first/shared-cell algorithm and the existing R-VAN algorithm (with only the previously approved narrowly scoped 7.5 cm seam-corner adjustment) are accepted as the current baseline. Do not change algorithm behavior, solver ordering, rotor placement, radius choices, R-VAN selection/placement, geometry decomposition, or zone grouping without a new explicit owner request and prior explanation/approval.
- **Current main at pause:** `1bbda90dfd1789357d2b1a5e95c6361981cdbf7d`. This HEAD contains documentation-only handoff updates after the successful code/Production release. No application source, tests, Sanity content, D1 schema/data, Cloudflare settings/secrets, orders, or email behavior is changed by this pause record.
- **Production baseline:** Cloudflare Pages deployment `3304a92b-4284-4293-88a4-8d5605d5c437` succeeded from the PR #530 merge commit `ac29eafb5e4e1af4706c05e28e9de9fe31743336`, URL https://3304a92b.florial.pages.dev. A later docs-only deployment attempt from `1bbda90dfd1789357d2b1a5e95c6361981cdbf7d` (`fa46d684-d18a-4f7f-b576-c44937a59c45`) built successfully but Cloudflare failed while publishing assets with an internal error. This did not change application code; the successful PR #530 Production deployment remains the verified code baseline. Do not repeatedly retry this docs-only deployment unless requested or a new relevant deployment is needed.
- **Recorded verification:** exact PR head passed 475/475 tests, app/Pages Functions type-check, lint, website build, read-only D1 migration dry-run, Studio type-check/build; D1 validation passed without applying a migration. Preview calculations passed for 8×8 m, 10×10 m, 38×16 m, 28×14 m with a 16×12 m top-right cut-out, and 28×4 m with a 16×2 m top-right cut-out. Preview screenshots were reviewed for 8×8, 38×16 and 28×14. Automated PDF regression tests passed.
- **Known items deliberately left for later owner review:** rendered-PDF visual inspection; Production browser-interaction smoke test; the explanatory `modelSelectionBasis` text in `src/lib/irrigation/irrigationLayoutBridge.mjs` appears inconsistent with the radius-stage descriptions in the solver documentation and must be reconciled against code before any edit; hydraulic pressure/flow, pipe losses, precipitation uniformity and real field performance have not been validated. These are not authorization to proceed while paused.
- **Design boundaries:** this is sampled geometric layout planning, not a full hydraulic design or manufacturer-certified throw guarantee. Existing documented geometry support limits remain in force.
- **Resume rule:** do not resume automatically. Wait until the owner explicitly returns with a reported issue or asks for the next task. On resumption, first read the current GitHub `main` instructions and handoff, then address only the requested scope. Preserve this frozen baseline unless a change is explicitly approved.


# Current implementation handoff — PR #530 merged and Production deployed (2026-11-24)

- **PR #530 merge commit:** `ac29eafb5e4e1af4706c05e28e9de9fe31743336`; PR #530 is closed and merged into `main`.
- **Production:** Cloudflare Pages deployment `3304a92b-4284-4293-88a4-8d5605d5c437`, environment `production`, build and deploy stages succeeded from the exact merge SHA. Deployment URL: https://3304a92b.florial.pages.dev.
- **CI on exact PR head:** Blog/Studio run `45451360534` passed 475/475 tests, application/Pages Functions type-check, lint, website build, read-only D1 dry-run, Studio type-check/build. D1 validation run `45451040299` passed; no migration was applied.
- **Preview:** final PR-head Preview deployment https://bdbe70cc.florial.pages.dev succeeded.
- **Current geometry order:** decompose supported orthogonal lawn/exclusion geometry into non-overlapping rectangles; process rectangles from smallest area to largest; pass actual previously placed heads to the next rectangle. Validate final sampled coverage and spray footprints against the original lawn and exclusions. Group zones only after the complete head set is assembled; maximum six heads per zone.
- **3504-PC:** for each non-strip rectangle, test four true geometric corner rotors first. If they do not pass, build a complete shared-cell grid with deduplicated shared nodes. Require complete sampled coverage and mutual Head-to-Head. Prefer 8 m; 9/10 m are alternatives when they materially reduce head count; use local 7/6/5 m where safe clearance requires. A failed rotor candidate set is discarded before the existing R-VAN fallback.
- **R-VAN protection:** all established model/nozzle/radius selection, normal candidate placement, perimeter/interior ordering and spacing remain unchanged. The only approved extension is the opt-in 7.5 cm inward offset for the exact matching R-VAN corner candidate at a shared narrow-strip/rectangle seam when the adjacent rectangle falls back to R-VAN. No offset is passed to the 3504-PC solver.
- **Functional Preview cases:** 8×8, 10×10, 38×16, 28×14 L-shape with 16×12 cut-out, and 28×4 L-shape with 16×2 cut-out all passed the recorded browser-rendered calculations. Screenshots were reviewed for 8×8, 38×16 and 28×14.
- **Still open:** separate rendered-PDF visual review; hydraulic pressure/flow, pipe losses, precipitation uniformity and field performance are not evaluated. Production browser-interaction smoke was not completed in this run.
- **No live data/config writes:** no Sanity writes, D1 schema/data changes, Cloudflare settings/secrets changes, Production orders or emails.

---


# Current implementation handoff — orthogonal lawn solver Production release (2026-11-24)

- **Main:** `a14e2e3294f96f76542623e7956f5cece78919d0`; PR #525 is merged.
- **Production:** Cloudflare Pages deployment `1e048889-5840-4aad-9411-f50d8dd1d4d6`, environment `production`, stage `success`, exact source SHA matches main. Deployment URL: https://1e048889.florial.pages.dev; configured project aliases include https://florial-bg.com and https://www.florial-bg.com.
- **CI:** Blog/Studio run `45369756924` passed; D1 validation run `45369757211` passed.
- R-VAN model selection: 4 m and 5 m rectangular short sides use R-VAN18; corner reach is capped by local short-side width to avoid overspray. R-VAN24 remains the 6 m corner-reach class; edge heads continue to use local spacing.
- Geometry solver: one simple orthogonal lawn polygon and one or more rectangular non-irrigated exclusions are decomposed into exact non-overlapping rectangles. Rectangles are processed by ascending short-side width, then length. Each next rectangle reuses the actual coverage of previously placed circular/strip heads.
- Final validation: 0.5 m sampled target mesh against the full irrigated geometry; spray footprints sampled against the original boundary and all exclusions; zones grouped after the complete sprinkler set is assembled.
- Customer UI: multiple non-irrigated rectangles can be entered in BG/RU/EN; X/Y are measured from the lower-left lawn corner.
- **Owner verification pending:** test the new 4 m / 5 m R-VAN18 behavior and several orthogonal layouts with exclusions on the deployed site. Hydraulic feasibility, precipitation uniformity and field validation remain outside this geometric solver.
- Geometry boundaries: one lawn region; simple orthogonal outer boundary; rectangular, non-overlapping exclusions. Curved boundaries, non-rectangular exclusions and multiple separate lawn regions are unsupported.

---

# Current implementation handoff — orthogonal lawn decomposition (2026-11-24)

- Implementation PR: [#525](https://github.com/omaraandrey-dev/florial/pull/525), based on main `8444f4b63d074887a45b35c4aa92e650513d7cc7`; exact validated head `696ff3b71972797bf4a2f643da07784cbcd28cec`.
- R-VAN model selection: 4 m and 5 m rectangle widths use R-VAN18. Corner reach is bounded by the local rectangle short side to keep the spray envelope inside the lawn. The 6 m reach class retains R-VAN24 for corners; edge heads continue to use their own local spacing.
- Geometry solver: simple orthogonal polygons and one or more rectangular exclusions are decomposed into exact, non-overlapping rectangular calculation regions. Regions are sorted by ascending short-side width, then length. Each next region reuses coverage from previously placed actual sprinkler heads.
- Final validation: 0.5 m target sampling against the complete irrigated geometry; spray footprints sampled against the original boundary and exclusions; head-to-head checks are kept within each rectangular region and for cross-region pairs that mutually reach. Irrigation zones are grouped after the full sprinkler set is assembled.
- Customer UI: multiple non-irrigated rectangular areas can be entered in BG/RU/EN; X/Y are measured from the lower-left lawn corner.
- Exact head checks: Blog/Studio validation 45368758939 and D1 validation 45368759097 succeeded. Cloudflare Pages Preview `7f783b21-1404-42c8-aba1-f3927d1bd02a` succeeded: https://7f783b21.florial.pages.dev.
- **Owner Preview review pending.** No Production deployment was made. Hydraulic feasibility, precipitation uniformity and field validation remain outside this sampled geometric solver.
- Remaining geometry boundaries: one lawn region; simple orthogonal outer boundary; rectangular, non-overlapping exclusions. Curved boundaries, non-rectangular exclusions and multiple separate lawn regions are not covered by this implementation.

---

# Current implementation handoff — irrigation solver integration (2026-11-24)

- Irrigation code baseline: PR #522 merged at 9ecdb05506e6f1bc28b5debc046cdd37972856d3; the subsequent documentation consolidation PR #523 merged into main at ad6f8ebdbccf68477b69b6be3ff87e2d7c72e1c6.
- PR #520 merged at 3387e8ff140756e69339b11215b82f5c6acbc9ed, delivering the supported narrow-arm L-shape rectangular solver.
- PR #522 merged at 9ecdb05506e6f1bc28b5debc046cdd37972856d3, integrating the 3 m-wide rectangle corner-sizing correction after PR #520. Exact PR head 9e4973ad5b4c4fbd45fbc57059715e0e91421c83: Blog/Studio run 45358607939 and D1 validation 45358607880 succeeded; Preview 80bc2842-cdd2-415b-8630-6e8276958127 succeeded at https://80bc2842.florial.pages.dev.
- Regression targets: 18 × 3 m and 3 × 18 m use R-VAN14 / 3 m, no interior row, full sampled coverage, head-to-head pass and in-bounds positions. No Production deployment was made.
- PR #521 was closed as superseded by #522; it was not merged separately.
- **Still open:** generalized decomposition of arbitrary orthogonal lawns/multiple cut-outs into rectangles, processing by ascending short-side width, reusing actual selected sector/strip coverage, final 0.5 m sampled coverage/no-overspray validation against the original polygon, and grouping zones after the full sprinkler set. Visual owner QA of the integrated Preview is also pending.
- The previous handoff entries below are historical snapshots and must be interpreted using their own timestamps; where their PR state differs, this section and the current main HEAD are authoritative.

---

# Current implementation handoff — 3 m rectangle sizing after L-shape merge (2026-11-24)

- PR #520 merged into main at `3387e8ff140756e69339b11215b82f5c6acbc9ed`; supported narrow-arm L-shapes now use the rectangular-zone calculation.
- The 3 m-wide rectangle corner-sizing correction from former PR #521 has been reapplied on a fresh branch based on that merge; implementation and regression test are included in the current integration PR.
- Important boundary: current L-shape decomposition is still limited to supported narrow-arm geometry. The owner's generalized rule — decompose orthogonal lawns into rectangles, process in ascending short-side width while reusing prior real spray coverage, then validate the original polygon and zone the complete sprinkler set — is not yet implemented.
- No Production release is claimed for this integration. CI/Preview evidence will be attached to the PR after it runs.

# Current implementation under review — L-shape rectangular-zone solver (2026-11-24)

- PR #520 is open: https://github.com/omaraandrey-dev/florial/pull/520.
- Current exact PR head: `dbf49336b58cb093dac7f125c6b97ac6f6a4c063` (branch `fix/irrigation-lshape-rectangular-zone-solver`; based on current main with 19 commits ahead, 0 behind at verification).
- Corrected the `connectedEnd is not defined` runtime failure by passing the connected edge into the strip solver. Square connected rectangles now take their axis from the shared edge rather than a width/height comparison.
- Blog/Studio CI run `45347161890`: 448/448 tests passed; type-checks, lint, website build, read-only D1 validation, Studio type-check and Studio build succeeded. D1 workflow `45347161809` succeeded.
- Exact-head Cloudflare Pages Preview deployment `980c2271-6a36-4456-86b9-59613259aa3e` succeeded: https://980c2271.florial.pages.dev.
- The prior manual Browser Rendering checks cover the top-right horizontal and transposed vertical examples on an earlier code revision. All four corners and square-axis regression are automated; visual interaction acceptance of all four orientations on the latest preview remains open.
- PR #520 has not been merged; Production remains on main. No Sanity writes, D1 schema/data changes, Cloudflare settings/secrets changes or Production deployment were performed.

---

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

# Latest merged main release — irrigation assistant L-shape and narrow-strip layout (2026-11-24)

- PR #518 merged to `main` at `bcc2afa32cded5359d3a52807f2a13c8d92627f4`.
- The fix aligns all four L-shape cut-out corners with the solver's Y-up coordinates and makes the preliminary/calculated SVG transforms consistent.
- The 1 m / 2 m strip algorithm now uses directional R-VAN-LCS/RCS/SST selection; catalogue SKUs A84667/A84668/A84669 were read-only verified active in Sanity Production.
- Exact PR-head Blog/Studio validation #2512 and D1 validation #2693 passed; Blog/Studio reports 442/442 tests, plus type checks, lint, website and Studio builds.
- Cloudflare Pages Production deployment `ef950cfb-2c24-48d0-ab9e-7f46cd0f89a3` completed successfully from this exact main SHA; deployment URL `https://ef950cfb.florial.pages.dev`.
- No Sanity writes, D1 schema/data changes, Cloudflare settings/secrets changes, Production orders or emails. Browser-based live interaction QA remains open.
- Audit: `docs/audits/2026-11-24-irrigation-l-shape-and-narrow-strip-layout.md`.

---

# Latest content publication — Florial Irrigation Assistant service (2026-11-23)

- Sanity Production service: `c265afd2-f31d-41f0-b377-ed95664a6d20`, slug `inzhener-pomoshtnik-florial-online`, route `/services/inzhener-pomoshtnik-florial-online`.
- Published BG/RU/EN content, localized SEO/ALT, original linked cover image and four related irrigation category references. Sanity published read-back succeeded.
- The service explains the existing online Irrigation Assistant as a preliminary geometric layout and catalogue-selection tool; it does not claim hydraulic calculation.
- Backup and audit: `docs/backups/sanity/2026-11-23-irrigation-assistant-service-before-edit.json`, `docs/audits/2026-11-23-irrigation-assistant-service-content.md`, and `docs/audits/2026-11-23-irrigation-assistant-service-publication-closeout.md`.
- **Owner action required before considering the lead form ready:** add required `location` and rename `message` to `details` in the three localized form configurations. No further Sanity write was made because the page is now protected published content and this exact correction awaits separate approval.
- Public visual QA was not possible in this session (Browser Use insufficient credits; public fetch inaccessible). Sanity publication is confirmed, not browser rendering.
- No schema, frontend, infrastructure or deployment changes.

---

# Latest main and Production — irrigation automation selection (PR #481 merged and deployed)

- PR #481 squash-merged into `main`: `1ce629772e8a1e3f7be6d0af6d20d60e76849202`.
- Added a customer choice after reviewing the lawn BOM: manual, TM2 wired, RC2 Wi-Fi or BAT-BT battery/Bluetooth. Manual excludes both the electromagnetic valve SKU and VBA02672 valve boxes. TM2/RC2 add real Sanity controllers and retain standard valves/boxes; BAT adds ESP-BAT-BT controller(s) and replaces the standard valve with 100-HV-9V SKU H01040 per zone. H01040 compatibility requires the updated HV bonnet manufactured from 30.06.2025 and a compatible TBOSPSOL 9 V DC latching solenoid.
- Controller allocations follow the owner-approved 9-zone 6+4 and 10–12-zone 6+6 rules. The UI displays catalog photos, live EUR prices, quantities and totals; TM2/RC2 explicitly show cable-routing work, RC2 additionally requires stable Wi-Fi.
- Automation metadata and resolved price lines are validated server-side against order items and included in the owner project PDF. Existing D1 `order_events.metadata` is reused; no migration is required.
- Catalog prices were read from published Sanity Production; checked products currently report `onRequest`. No Sanity writes were performed.
- Exact PR-head Blog/Studio run `45053370930` and D1 validation run `45053357011` succeeded for `71cf237e5523dc18dc9594816a26499ada2bc2cc`. Preview `97fc94d3-ca3b-4ff0-8a0e-33111b86ae63` and Production `eb9110fc-1b98-41cc-8b65-a63272cf8049` both deployed successfully. Production aliases: https://florial-bg.com and https://www.florial-bg.com.
- No D1 migration, Sanity write, Cloudflare settings/secrets change, real order or test email. Owner review of the latest live revision and a safe checkout/E2E test remain open; Browser was not used.
- Full audit: `docs/audits/2026-11-22-irrigation-automation-selection.md`.

---

# Latest main and Production — owner irrigation PDF handoff correction (PR #480 merged and deployed)

- PR #480 squash-merged into `main` at `8214cdeef0183af6011f7f27aae5dd3730ef8ad5` (runtime release commit). The documentation closeout was then committed to `main`; read the live branch head for the latest documentation SHA.
- Cloudflare Pages Production deployment `e2469d28-10f3-4efc-b1b7-9e9290f3d02b` completed successfully from that exact SHA. Production: https://florial-bg.com.
- Root cause: the owner notification guard in `functions/api/orders.ts` used a double-escaped email regex, rejecting ordinary email addresses and skipping the project-PDF branch.
- The owner receives one notification with two separate attachments: order/proforma PDF and irrigation project PDF. Missing PDF generation is reported explicitly in the email.
- The project PDF is not sent to the customer during checkout. Bank-transfer orders send it with the final proforma through `confirm_proforma`; other payment methods require the Owner-only Manager action `approve_irrigation_project`, which sends both PDFs to the customer, copies the owner and records approval in `order_events`. Repeated approval sends are blocked.
- PR-head SHA `2529cc88dfa7fbb1d972bdbad21699add43f89b7`: D1 validation run `45042467098` and Blog/Studio validation run `45042467160` succeeded, including lint, type-checks, website tests/build, migration dry-run and Studio build. Preview `https://9c15b61d.florial.pages.dev/irrigation-assistant` succeeded.
- No Sanity writes, D1 schema/data changes, Cloudflare settings/secrets changes or test orders/emails were performed. Actual Resend inbox receipt and full checkout end-to-end delivery remain unverified; a safe owner-approved test is still required.

---

# Latest main and Production — balanced irrigation zones and owner project PDF (2026-11-22)

- Runtime PR #476 merged into `main` at `dbcf63e2ad05e2132ba39b2ec30936fdb6c6abe1`; PDF-detail follow-up PR #477 merged at `6ae20420380f5794aba331b65427ac31d3160e2d`.
- Documentation closeout PR #478 merged at `6ce23f86620b466b9a8a40cd65556bfd5df14342`; this is the current `main` HEAD for this snapshot.
- Perimeter and interior sprinkler heads share one deterministic sequence. Arc 90°/180°/270°/360° does not split zones; groups are balanced with at most six heads each.
- Checkout submits the versioned project snapshot; the server validates BOM SKU quantities and zone membership, then persists it in existing D1 `order_events.metadata`. No D1 migration is required.
- A separate owner-only PDF includes overall/cut-out dimensions, lawn outline, sprinkler positions/arcs/models, balanced zones, drawn main/zone/lateral routes, catalogue names and BOM SKU/quantities. Customer proforma email remains unchanged.
- Exact PR-head CI: #476 runs `45014451568` / `45014451557`; #477 runs `45014880321` / `45014880308`; #478 docs run `45015264344` / `45015264325`; all succeeded.
- Main CI after #476: `45014654327` / `45014654333`; after #477: `45015013305` / `45015013373`; after docs PR #478: `45015394038` / `45015394028`; all succeeded.
- Final code Preview: `https://988ce669.florial.pages.dev/irrigation-assistant`. Runtime Production deployment `c122e2dd-e854-44fd-a68b-bfc2bcb4524a` succeeded from #477 merge SHA. Documentation-only Production deployment `9d0f5458-5d55-4062-83a7-43acd7fea564` succeeded from current main SHA `6ce23f86620b466b9a8a40cd65556bfd5df14342`; aliases remain `https://florial-bg.com` and `https://www.florial-bg.com`.
- No Production order or test email was created. Actual Resend inbox delivery and checkout E2E remain unverified pending an owner-approved safe test. No Sanity write, D1 schema/data migration, Cloudflare settings/secrets change.
- Live Production D1 was checked read-only: `order_events` contains the required `id`, `order_id`, `order_number`, actor, event, note, metadata and timestamp columns; `schema_migrations` confirms versions `0001_initial` through `0017_manager_push_subscriptions`. Both queries reported zero rows written.
- Hydraulic sizing, dynamic pressure/flow, six-head hydraulic suitability, Ø25/Ø32 mainline confirmation, overspray/DU/CU and field validation remain open. The six-head limit is a grouping rule only.
- Technical guide: `docs/engineering/IRRIGATION_ASSISTANT_BALANCED_ZONES_AND_ORDER_PDF_V1.md`.


---

# Florial — CURRENT STATE

> Snapshot date: 2026-11-21. Verified against live GitHub main, GitHub Actions and Cloudflare Pages. This is a handoff summary, not a substitute for the mandatory startup protocol or live checks before future changes.

## Latest main and Production release — 2026-11-21

- PR #450 (Manager Web Push) merged into main at 54026c75030e5f950576cc1b99f7ebf8903006f1.
- Exact merge-commit Blog/Studio validation run 44859242349 and D1 validation run 44859242327 both succeeded.
- Cloudflare Pages Production deployment e80238e2-af1a-4441-8134-4388124accee succeeded from the exact merge SHA; production aliases remain https://florial-bg.com and https://www.florial-bg.com.
- Manager Web Push implementation is deployed. D1 migration 0017 and VAPID Production configuration were applied and verified before merge under owner approval.
- Actual Android/Chrome subscription, persistence, push delivery, notification click, unsubscribe and re-subscribe are not yet independently verified. Do not create real Production orders/leads without an agreed test procedure.

## Latest documentation closeout — 2026-11-20

- PR #434 and final documentation closeout PR #435 are merged into `main`; PR #435 is documentation-only. Latest runtime changes remain PR #433 merge `0ec090932007d49c04f633875534af8eacbe49a6` and PR #432 merge `0f6368e0f758e8a16a7ddd321d598c61790e1373`; their Production deployments are recorded below and in CHANGELOG.
- Owner confirmed that the remaining Manager direct-catalog acceptance, password-reset acceptance and decision on the existing plant-care binding are complete/accepted. This is owner-confirmed acceptance, not a claim of independently captured browser or Resend delivery logs. No test email was sent during implementation.
- The legacy Cloudflare plant-care binding remains unchanged and accepted in its current state; do not disable it without separate approval.

## Latest main and Production release — 2026-11-19

- Latest application/runtime code commit in `main`: `9b697379c43db5e19a15bd91b48fb8d507da8479` (PR #410). PR #411 is documentation-only and merged at `93955895baa8777286cccacda2ef6731b0f392db`; it does not change runtime code.
- PR #410 synchronizes optional Schema.org Product `brand` between middleware and client ProductPage. Plant product-detail GROQ now fetches `brand->name`; equipment already did.
- Exact code commit `6b4c78f` passed Blog/Studio validation run `44432432693` (317/317 tests, TypeScript, lint, website build, migration syntax/dry-run, Studio typecheck/build) and D1 validation run `44432432898`. Latest PR head `8ce3257` also passed Blog/Studio run `44432666988` and D1 run `44432666815`.
- On merge commit `9b69737`, D1 validation run `44432799931` succeeded; Blog/Studio validation run `44432801621` succeeded on the exact merge commit.
- Cloudflare Pages Production deployment `ed8a8b40-bff1-4e35-948f-6b33970bcfff` succeeded from exact merge commit `9b69737`; aliases remain `https://florial-bg.com` and `https://www.florial-bg.com`.
- Google Rich Results Test on Production and Search Console URL Inspection remain pending. No Sanity documents/schema, Cloudflare settings/secrets, D1 data/schema, Resend or Google settings changed.

## Project and source of truth

- Repository: [omaraandrey-dev/florial](https://github.com/omaraandrey-dev/florial), default and production branch: `main`.
- GitHub `main` is the only main, authoritative and permanent source for code and technical documentation. All non-main refs are historical/auxiliary; ignore them during ordinary work. Start new work from the live HEAD of `main`.
- Business: Bulgarian online store for irrigation equipment, ready-made kits and plants, with related landscaping, planting, irrigation design/installation and maintenance services.
- Main language: Bulgarian; additional languages: Russian and English. Currency: EUR. Production: https://florial-bg.com.
- Priority geography: Bulgarian Black Sea coast, including Nessebar, Ravda, Sunny Beach, Sveti Vlas, Aheloy, Pomorie and nearby settlements. Do not add Sozopol to new geo-content without owner approval.

## Active architecture

- Sanity — published products, plants, categories, services and editorial content.
- Cloudflare Pages / Pages Functions — website hosting and server-side APIs.
- Cloudflare D1 — orders and Manager data.
- Resend — transactional email.
- Supabase is excluded from active architecture. Historical files under `docs/archive/supabase/` are for reference only; never execute or restore them.
- Owner-confirmed: legacy `SUPABASE_*` / `VITE_SUPABASE_*` variables that remain in Cloudflare Pages are intentionally retained dormant reserves, unused by Florial. Do not audit again, remove, change or read their values unless the owner explicitly starts a future Supabase activation project.
- Wix and Lovable are not the foundation of Florial.

## Latest verified main / CI / Production

- Latest verified application/Production source commit: `3ff2c96d208d7c871cbf6b5975b5458e6efff4ea`. PR #405 (Manager PostHog analytics) and PR #403 (15 Bulgarian plant category editorial updates plus audit/backups) are both merged. Documentation-only status updates do not change this runtime baseline; no open PRs after integration.
- PR #405 runtime implementation was merged at `a7da7916d2fc728432f116f395cc16038b0258ce`; the subsequent PR #403 merge is documentation/backups only and leaves that runtime unchanged.
- GitHub Actions on exact current main SHA `3ff2c96d208d7c871cbf6b5975b5458e6efff4ea`:
  - Blog and Studio validation run `44321010828` — success.
  - D1 migration validation run `44321010791` — success.
  - Cloudflare Pages check run `134859953008` — success.
- Cloudflare Pages Production deployment: `3edf0d48-e8ca-4d29-878d-a8e308c4d4c8`, URL `https://3edf0d48.florial.pages.dev`, exact source commit `3ff2c96d208d7c871cbf6b5975b5458e6efff4ea`; queued, initialize, clone, build and deploy stages all succeeded. Production aliases remain `florial-bg.com` and `www.florial-bg.com`.
- PostHog Manager feature was introduced by PR #405 and deployed in Production. The owner personally confirmed on 18.11.2026 that the Manager analytics page loads and displays PostHog data correctly; functional acceptance is complete. Cloudflare metadata confirms server secret `POSTHOG_API_KEY` as `secret_text`; its value was not read. Keep this credential server-side.
- Deployment success proves build/publication for this commit. Manager PostHog functional acceptance was separately confirmed by the owner in Production on 18.11.2026. Other unrelated visual/browser QA items remain tracked separately.
## Git branches and release governance

- GitHub returned 417 branch refs including `main`; 416 refs are non-main historical branches (including this cleanup branch). No open PRs.
- Only `main` is authoritative. Do not continue from an old branch without comparing it to the latest main and confirming the exact task.
- GitHub branch metadata at the 2026-11-18 audit reported `main` as `protected=false`; this is a separate optional repository-governance setting, not a reason to audit or clean old branches. The owner may enable PR/check protection in GitHub settings.
- Old refs are intentionally left alone as historical/auxiliary references. No branch-by-branch audit or cleanup is required; do not use them in ordinary work. See [BRANCH_HYGIENE](../operations/BRANCH_HYGIENE.md).

## Important infrastructure caveats

- Legacy Supabase-named Cloudflare Pages variables are intentionally retained dormant reserves by owner decision (18.11.2026). They are not part of the active Florial architecture. Do not remove or alter them; no further audit is required unless the owner explicitly proposes activating Supabase.
- Production has D1 binding `DB`. Preview is not equivalent to Production and does not have the same D1/server-side bindings; do not use Preview as a Manager/order acceptance environment without a separate safe test setup.
- D1's latest documented live audit is 2026-11-11; the migration 0014 status and table-count metadata discrepancy require a fresh read-only check before the next D1 migration.
- The legacy Supabase archive and old Manager setup documents are not current implementation instructions. Follow the current architecture and Manager Technical Passport.

## Active Google Shopping / SEO visibility workstream

- Roadmap: [GOOGLE_SHOPPING_SEO_ROADMAP_2026-11-18](../roadmaps/GOOGLE_SHOPPING_SEO_ROADMAP_2026-11-18.md). Any follow-up chat or implementation must read this roadmap first, update it with evidence, and continue from the first unfinished stage.
- Stage 1 is in progress; source audit and Search Console baseline are recorded in [stage-1 audit](../audits/2026-11-18-google-shopping-seo-stage-1-audit.md). Fresh Production Product HTML, Rich Results validation and URL Inspection remain pending. Windsor.ai Google Merchant Center connector has no connected account; standalone account status is unknown.

## Google Shopping / Product Schema workstream

- Active roadmap: [GOOGLE_SHOPPING_SEO_ROADMAP_2026-11-18.md](../roadmaps/GOOGLE_SHOPPING_SEO_ROADMAP_2026-11-18.md). Continue from its earliest unfinished item and update it after each material step.
- PR #407 was merged into `main` at `458dd9d8e8edb78973a4660f3796f43d4d1c22d2`; the Product Offer remediation is deployed to Production in Pages deployment `3deb2a5d-cd16-4201-821e-7b6d6c7bba09` from that exact SHA.
- Product Offer builder is shared between middleware and ProductPage. Plants use only the default first variant Offer; onRequest is not PreOrder. AggregateOffer is not used for a set of variants.
- ProductGroup is deferred because the published plants dataset has no non-empty variant SKU and the current route does not provide crawlable per-variant URLs.
- Product Offer implementation and tests passed full Blog/Studio validation run 44355759803 and D1 validation run 44355682858 (source code commit 8fd6704). Cloudflare Preview for functional code plus the updated roadmap succeeded at https://811f1545.florial.pages.dev (Preview commit df414aa). Later PR commits are documentation-only; latest checked PR head 7305780 had CI and Preview in progress.
- Google Rich Results Test and URL Inspection remain pending. The interactive Google test app and Preview pages were inaccessible through the available web reader; prefilled owner-run Rich Results links are in the roadmap/audit. Windsor.ai Search Console fields do not expose URL Inspection.
- ProductGroup remains deferred: no plant variant SKU is populated in published Sanity, and there are no crawlable per-variant URLs.

## Current work boundaries / pending verification

- Manager PostHog on-demand analytics is deployed and owner-accepted. The owner confirmed successful PostHog data display in Manager Production on 18.11.2026.
- The irrigation engineer assistant is intentionally paused after stage 7; PR #349 is merged. Do not begin stage 8 without the owner's explicit request.
- Live rendered HTML QA is still pending for the refreshed plant root category and olive article BG/RU/EN; winter landscape article RU/EN rendering also remains pending. Published Sanity read-back is not the same as browser rendering.
- Service hreflang projection, Manager Gemini smoke, irrigation product SEO inventory refresh, Google Search Console indexing checks and matched performance measurements remain listed in [OPEN_QUESTIONS](OPEN_QUESTIONS.md).
- Historical open-question notes were preserved in [OPEN_QUESTIONS_HISTORY_2026-11-18.md](../archive/OPEN_QUESTIONS_HISTORY_2026-11-18.md).

## Required startup reading

1. [AI_INSTRUCTIONS.md](../../AI_INSTRUCTIONS.md)
2. [START_HERE.md](START_HERE.md)
3. [WORK_PROTOCOL.md](WORK_PROTOCOL.md)
4. [MASTER_SPEC.md](MASTER_SPEC.md)
5. [TECHNICAL_PASSPORT.md](../TECHNICAL_PASSPORT.md)
6. [CHANGELOG.md](../../CHANGELOG.md)
7. [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md)
8. Relevant source, tests, workflows and live services for the task.


### Latest Google structured-data QA (18.11.2026)

- Schema.org Validator: corrected PR Preview equipment and plant each report 5 items, 0 errors, 0 warnings; Product and BreadcrumbList appear twice because the middleware canonical URL is Production while client markup uses the Preview host.
- Current Production equipment baseline: 3 items, 0 errors, 0 warnings (Organization 1, BreadcrumbList 1, Product 1); this is pre-PR code.
- Official Google Rich Results Test requires login/reCAPTCHA and returned “Log in and try again”; no Google test outcome confirmed. Owner-authenticated run and later Production retest remain pending. Details in roadmap and audit.


## Google Shopping / Product Schema — merge and Production release

## 2026-11-18 — PR #407 merged and Product Offer remediation deployed to Production

- PR #407 (Product Offer JSON-LD remediation, Google Shopping roadmap and stage-1 audit) merged into `main`; merge commit / exact `main` HEAD at verification: `458dd9d8e8edb78973a4660f3796f43d4d1c22d2`.
- Pre-merge comparison confirmed PR head `f30af1e940d8bccb627a55265c6fa6468651b520` was 42 commits ahead and 0 behind current `main`; the merge used expected head SHA protection.
- GitHub Actions on exact PR head `f30af1e`: Blog and Studio validation run `44358163151` — success; D1 migration validation run `44358126198` — success. A subsequent Blog and Studio run `44358126185` also succeeded. No workflow runs were returned for the merge commit itself; do not describe those PR-head checks as merge-commit CI.
- Cloudflare Pages Production deployment `3deb2a5d-cd16-4201-821e-7b6d6c7bba09` succeeded at `2026-11-18T18:08:28Z`; source branch `main`, exact source commit `458dd9d8e8edb78973a4660f3796f43d4d1c22d2`. Production aliases are `https://florial-bg.com` and `https://www.florial-bg.com`.
- The shared Product Offer implementation is now in Production. Schema.org Validator evidence in the PR applies to the Preview pages; the previous Production validator result is a pre-release baseline. Google Rich Results Test on Production has not yet been run and is not claimed as passed.
- Owner-run Google Rich Results Test links for Production:
  - Equipment: https://search.google.com/test/rich-results?url=https%3A%2F%2Fflorial-bg.com%2Fproduct%2Frain-bird-100-pga-9v
  - Plant: https://search.google.com/test/rich-results?url=https%3A%2F%2Fflorial-bg.com%2Fproduct%2Fcitrus-japonica-kumquat
- Stages 1 and 2 of the roadmap remain open pending authenticated Google Rich Results evidence and the remaining Search Console URL Inspection checks. Merchant Center account was confirmed by the owner as not yet registered; Merchant Center setup remains a later roadmap stage.
- No Sanity schema/documents, Cloudflare settings/secrets, D1 data/schema, Resend or Google settings were changed. The only Production change was the automatic Pages deployment from the explicitly approved PR merge.

