## 2026-11-24 — Irrigation mixed R-VAN selection and result UX (implementation pending)

- **CLOSED — per-position nozzle selection:** do not choose one R-VAN model for the entire lawn. Select corner, edge and interior candidates from local geometric reach/spacing, with each sprinkler retaining its own radius and exact model/arc performance lookup.
- **CLOSED — 8 × 8 m reference:** four corner R-VAN24 heads at 6 m and four side-midpoint R-VAN18 heads at 4 m; test sampled coverage and head-to-head with mixed radii.
- **CLOSED — customer result:** use Rain Bird nozzle identification colors, show a model legend and per-zone model quantities; remove fixed planning-radius explanation and flex-pipe metres/coil wording from the kit summary.
- Implementation is on `fix/irrigation-mixed-rvan-visual-layout`. Exact code/test commit `53e73149644a5e567f6c272eb0479242e35959a8` passed Blog/Studio CI #2498 and D1 validation #2683; Preview deployment `0f21ec49-6e44-4e8a-b3dc-41a2ac1faa09` succeeded for the same commit. Manual browser visual QA remains unconfirmed; Production merge/deployment awaits owner approval.

## 2026-11-24 — Irrigation layout owner decisions

- **CLOSED — fixed Florial R-VAN planning radii:** R-VAN14 = 3 m; R-VAN18 = 4/5 m; R-VAN24 = 6 m. Radius does not change with arc.
- **CLOSED — control mesh:** 0.5 m default.
- **CLOSED — L-shape interior candidates:** rectangular axis-aligned grid clipped to the original L polygon; no triangular/staggered lattice.
- **CLOSED — RCS strip layout:** rectangular 1 m / 2 m widths use R-VAN-RCS SKU A84668; planning throw 2 m / 4 m; first head lower-right; further heads evenly distributed along the same long side. For 2 m width, lengths 4/6/8 m require 1/2/3 heads.
- **CLOSED — mixed zones:** R-VAN14, R-VAN18, R-VAN24 and R-VAN-RCS may coexist in one zone; model, radius, arc and strip/circular pattern are not zone boundaries.
- **CLOSED — precipitation-intensity compatibility:** owner confirms the manufacturer compatibility of these R-VAN models/patterns. Do not add a separate per-zone precipitation-intensity matching gate.
- **OPEN — 1804 body / selected R-VAN nozzle assembly and pressure-regulation compatibility:** this remains a distinct product-assembly question and is not the precipitation-intensity matching rule above.
- Implementation PR #515: CI passed; Cloudflare Pages Preview deployment succeeded (ba29688a-1117-4c5b-bbfc-1c84260cef0b). PR #515 merged to main (commit 6057a28159282e1449fde961613dee301480d93c); Cloudflare Pages Production deployment 5be817f9-e59e-4744-92bb-3f88cfceffa8 succeeded. This implementation/release item is closed.

## 2026-11-24 — Blog article performance release: measurement follow-up

- **CLOSED — runtime implementation and merge:** PR #512 merged at `2fe92f6b269fa29183cd02e7bc334d27ccb8006c`; exact Production Pages deployment `e2b84205-e7a2-4164-ba20-d657dbad0a8e` succeeded. Article loading skeleton, initial HTML viewport reservation, Sanity CDN hints, responsive high-priority cover preload and image sizing/quality changes are live.
- **CLOSED — exact-head CI and browser smoke:** Blog/Studio run `45272014683` and D1 validation run `45272014645` succeeded on PR head `fd0ef9c279bb5d484440ff77ba3903198baac98c`. Production Browser Rendering confirmed raw HTML hints/reserved height and hydrated article content with skeleton removal.
- **CLOSED — documentation and main publication:** PR #513 merged at `739ce9a12b9b1ef8f816a388cddce65949a6f01e`; documentation-integrated Production Pages deployment `2d9b3529-336f-4f01-90c4-ed093d8d45f8` succeeded from exact `main` SHA.
- **OPEN — matched post-release performance measurement:** the supplied PageSpeed report was captured 23.11.2026 at 23:28 GMT+2, before the runtime merge at 23:41. It is the baseline (Performance 66, FCP 0.9 s, LCP 3.6 s, TBT 10 ms, CLS 0.760, Speed Index 1.7 s), not a post-release measurement. Run PSI three times on Production with the same Moto G Power / Lighthouse 13.6 / low-end 4G profile and compare medians. Until then, do not claim a numeric improvement in Performance, LCP or CLS.
- **OPEN — regular-browser visual/interaction QA:** independently inspect article rendering on mobile/desktop after the matched measurement; prior Production Browser Rendering is evidence of HTML markers, not a substitute for full visual and interaction testing.
- Evidence: `../audits/2026-11-23-blog-article-performance-remediation.md`.

## 2026-11-23 — Blog/portfolio correction release (PR #509)

- **CLOSED — Production deployment and localized HTML smoke:** Cloudflare Pages Production deployment `e006bf14-6b8c-4796-924e-761e40a150a6` succeeded from `main` SHA `c44e3bbd007c7ae4599dad84a540043ee0ecd2f8`; aliases `https://florial-bg.com` and `https://www.florial-bg.com` are attached. Live rendered HTML checks on Production confirmed the BG page (mobile), RU page (mobile) and EN page (mobile) each have their localized intro/H1, all four localized category labels and the compact filter button; publication-type filter is absent.
- **OPEN — full visual and interaction QA:** screenshot inspection and actual dropdown/category clicks, combined-filter behavior, empty/reset states and detailed visual review remain unconfirmed. Browser Use could not run because project credits were unavailable; rendered HTML is not a substitute for interaction testing.
- Evidence: `../audits/2026-11-23-blog-filter-localization-corrections.md`.

## 2026-11-23 — Blog/portfolio correction release (PR #509)

- **CLOSED — merge and exact-head CI:** PR #509 merged to `main` at `f899e0592bcab4221d606568ddb459ba39941e35`. Blog/Studio runs `45245064385` and `45245088129`, plus D1 run `45245064540`, succeeded. Preview `01588588.florial.pages.dev` deployed from the exact PR head.
- **CLOSED — rendered HTML localization smoke:** RU mobile and EN desktop preview responses contain localized intro, H1, all four category labels and Filters button. Publication-type filter and Project/Article card chips are absent.
- **OPEN — full visual and interaction QA:** screenshot inspection and actual dropdown/category clicks, combined-filter behavior, empty/reset states and full BG/RU/EN visual review remain unconfirmed. Browser Use could not run because project credits were unavailable; rendered HTML is not a substitute for interaction testing.
- **OPEN — Production deployment verification:** confirm Cloudflare Pages deployment from the final documentation-integrated `main` SHA and live `florial-bg.com/blog` rendering.
- Evidence: `../audits/2026-11-23-blog-filter-localization-corrections.md`.

## 2026-11-23 — Blog and portfolio UX release verification

- **CLOSED — Pages Production deployment and BG HTML smoke:** final `main` SHA `f0c5fe6121e4733273877cad61e73e86fd1068e7` deployed successfully as `e0a2dbef-d9fa-47e4-b114-d3172b6a8b0d`; aliases `florial-bg.com` and `www.florial-bg.com` are attached. Live rendered HTML confirmed the correct title/H1, one current breadcrumb, no redundant Florial eyebrow, four category labels and search control.
- **OPEN — full desktop/mobile visual and interaction QA:** visually inspect category card images, responsive layout, BG/RU/EN versions, combined filters, empty/reset states and click behavior. Browser Use was blocked by insufficient credits; a follow-up Cloudflare Browser Rendering request was rate-limited. Static rendered-HTML smoke is not a substitute for visual or interaction QA.
- Evidence: `../audits/2026-11-23-blog-portfolio-ux.md`.

## 2026-11-23 — Published Florial Irrigation Assistant service: remaining QA

- **CLOSED — publication:** Sanity Production service `c265afd2-f31d-41f0-b377-ed95664a6d20`, slug `inzhener-pomoshtnik-florial-online`, BG/RU/EN content, localized SEO/ALT, linked cover image and four related irrigation categories. Published-perspective read-back succeeded. Evidence: `../audits/2026-11-23-irrigation-assistant-service-publication-closeout.md`.
- **OPEN — service lead form configuration:** existing `/api/service-leads` requires `name`, `phone`, and `location`; it reads project details from `details` or `comment`. The newly published service currently has no `location` field and uses `message`. Owner approval is required before correcting the protected published service document. No test submission or D1 lead was created.
- **OPEN — public visual QA:** confirm BG/RU/EN rendering, hero image load, image click-through to `/irrigation-assistant`, and the four category image links. Browser Use was unavailable due insufficient credits; web fetch could not access the public page.
- No code/schema/API/Cloudflare/D1/Resend changes. No public form submission.

## 2026-11-23 — Local SEO public audit; owner confirmations updated

- **CLOSED — read-only audit:** public Google Maps listings for Nessebar and Ravda, website NAP/hours, live GardenStore/Organization JSON-LD, service-area statements and indexed external mentions reviewed. Evidence: `../audits/2026-11-23-local-seo-readonly-audit.md`.
- **CLOSED — Ravda status:** owner confirms Ravda is a new, active Florial garden centre where customers can visit in person. Keep its separate Maps record and `GardenStore` entity; do not merge it with Nessebar or treat it as service-area-only.
- **CLOSED — Ravda hours:** owner confirms daily opening hours of 09:00–17:00. Public Maps/site/schema values have not yet been updated or independently verified against this schedule.
- **CLOSED — legacy Bulgarian DROP site status:** owner confirms Bulgarian-language legacy DROP pages redirect to the current Bulgarian Florial website. The exact redirect chain and page-to-page destination mapping have not been independently tested; do not treat the old URL in a citation as a separate active-site conflict solely on that basis.
- **OPEN — Nessebar hours:** confirm actual opening hours for Nessebar, including Sunday and seasonal schedules. Website, JSON-LD and public Maps values currently conflict; Ravda Maps Friday/Saturday values appear anomalous.
- **OPEN — phone assignment:** confirm +359876777902 as Nessebar's primary Bulgarian number and +359877055605 as Ravda's local number; current Nessebar JSON-LD uses the additional ENG/UA/RU number +359885834860.
- **OPEN — service areas:** confirm whether Burgas and Varna are current on-site service areas or delivery-only areas.
- **OPEN — related web/social properties:** confirm whether `palmandolivetrees.com` is an official/current Florial property and identify canonical Facebook/Instagram profiles.
- No Google Business Profile, directory, website, Sanity or Production edits were made. Do not change public listings until the remaining facts are confirmed and an exact plan is approved.


## 2026-11-23 — SEO roadmap: desktop GSC checkpoint and next stage

- **CLOSED AS PRELIMINARY CHECKPOINT — SEO Step 5 (GSC opportunities):** desktop-only Search Console aggregate for 2026-10-24–2026-11-20: 392 impressions, 10 clicks, CTR 2.55%, average position 22.9. Detailed query/page rows are incomplete; the short site history is insufficient for broad SEO conclusions or content changes. Repeat GSC analysis around 2026-12-23 using the latest 28 finalized days.
- **NOT A BLOCKER — SEO Step 1 (indexability):** historical saved URL Inspection anomalies remain unresolved by a new Google live test, but the owner instructed that later roadmap stages should proceed. Schedule a separate read-only recheck around 2026-12-23; no code/Sanity changes without new evidence and approval.
- **NEXT — SEO Step 6 (Local SEO):** read-only review of actual Google Business Profiles, NAP, service areas and citations. Do not create doorway pages or edit profiles/listings without approval.
- Evidence: `docs/audits/2026-11-23-gsc-desktop-preliminary-analysis.md`.
- No website, Sanity, Google settings or Production changes were made.

## 2026-11-23 — Product description refresh (separate owner-approved content stream)

- CLOSED — spray/rotary nozzle category: 26/26 active products published in BG/RU/EN; published read-back confirmed all target IDs and zero remaining drafts. Detailed evidence: `../audits/2026-11-23-nozzle-product-descriptions-refresh.md`.
- CLOSED — ready-made kits: 12/12 products published in BG/RU/EN. Owner confirmed from personal installation experience that ESP-BAT-BT1 works with 100-HV-9V production versions manufactured from 01.01.2026 when fitted with a suitable 9 V DC latching solenoid; earlier versions are not claimed compatible. The 10 × 5 m kit and both product cards were synchronized; kit components/quantities were preserved. Evidence: `../audits/2026-11-23-irrigation-kit-descriptions-refresh.md` and `../audits/2026-11-23-esp-bat-bt1-100-hv-9v-compatibility-copy.md`.
- OPEN — controller inventory mismatch: live Sanity returns 23 products (including 23 active), while the 15.11.2026 controller audit records 24. Reconcile exact IDs/SKUs before editing.
- CLOSED — sprinklers: 20/20 published products now have the localized delivery/service closing section in BG/RU/EN; published read-back confirmed all 20 and zero remaining drafts. Existing descriptions and technical fields were preserved. Evidence: `../audits/2026-11-23-sprinkler-delivery-refresh.md`.
- Humanizer connector was searched for but not available; no Humanizer use is claimed.
- This content-refresh approval is separate from SEO Step 4. SEO metadata work remains read-only until its own exact field/ID review and approval.
## 2026-11-23 — Plant description editorial pilot stopped by owner

- STOPPED — the 13 published «Палми и юки» descriptions in BG/RU/EN were not accepted by the owner; no further plant description editing is authorized. No rollback was requested or performed. The six «Маслини» documents were confirmed unchanged by published read-back. No backup export was made for the palm batch under the owner's explicit one-task instruction. See `../audits/2026-11-23-plant-description-editing-stop.md`.

## 2026-11-23 — Sanity SEO partial remediation

- PARTIAL — published/read-back verified BG/RU/EN metaTitle for two Irritec Connecto elbows and Rotor Sprinklers category, plus BG/RU/EN ALT for Nipel-mufa category image. Four documents are complete; remaining Step 4 work is read-only audit and proposal preparation. Evidence: `../audits/2026-11-23-sanity-seo-partial-remediation.md`.

## 2026-11-23 — Roadmap synchronization / next active work

Единый актуальный статус всех основных дорожных карт: [ROADMAP_STATUS_INDEX_2026-11-23.md](../roadmaps/ROADMAP_STATUS_INDEX_2026-11-23.md).

- **NEXT — SEO Step 4 (read-only):** re-audit published Sanity product/category/service content and localized SEO fields; verify the four already-published partial-remediation documents, inspect frontend ALT fallback, and prepare BG/RU/EN proposals for remaining gaps. No Sanity writes. Any future write requires a fresh exact ID/field plan and separate approval.
- **OPEN — SEO indexability:** live Production sample passes index/follow and self-canonical, but Google live URL Test and post-recrawl are not verified; saved GSC state remains historical.
- **OPEN — GA4:** PR #488 integration deployed; verify real consented-session events in Realtime/DebugView. No test order without approval.
- **OPEN — Google Shopping:** dedicated Rich Results / URL Inspection evidence; Merchant Center account creation and later feed work remain separate stages.
- **OPEN — Manager Web Push:** authenticated Owner self-test and real Android/Chrome delivery/click/unsubscribe QA.
- **PAUSED — Performance:** no measured current Core Web Vitals baseline; resume only with separate owner direction.

Подробные границы и evidence — в едином реестре; старые датированные записи ниже сохраняются как история.
 
---

## 2026-11-23 — Irrigation assistant automation/BOM owner corrections

- CLOSED — default TM2 variants are indoor-mount SKUs F54234/F54236/F54238; RC2 remains indoor-mount.
- CLOSED — TM2 and RC2 display one standard 100-HV valve per zone as a priced automation line, alongside controller(s); total automation cost includes valves. Snapshot validation accepts the indoor TM2 SKUs and validates valve quantity/pricing from server-resolved order lines.
- CLOSED — manual mode excludes valve-only items: H01000/H01040, VBA02672, IQ21120M0N25D and IQ2142000N250. Sprinkler-side fittings remain.
- CLOSED — cable notes for TM2/RC2 no longer claim separately priced installation labour; only required cable is stated. RC2 also requires stable Wi-Fi.
- CLOSED — flex installation allowance range is 0.5–1.5 m/head. Coil estimate uses 0.5 m/head; 30 m coil-only sales means one coil through 60 heads, then additional coils by that baseline. Cutting/by-metre sales remain out of scope.
- NOT VERIFIED — exact-head CI/build, Production deployment, live UI review of revised prices, and real order/PDF/email delivery. No real order or email test is authorized by this change.

## 2026-11-23 — Irrigation engineer scope and installation PDF decisions

- CLOSED — geometric-only irrigation assistant. No hydraulic calculations: no flow/pressure sizing, friction/minor losses, velocities, residual pressure or hydraulic zone capacity calculations. Manufacturer nozzle performance tables may be used only as reference inputs for geometric sprinkler selection; this is not site hydraulic verification.
- CLOSED — all schematic pipe routes use fixed PE Ø25 mm: main and zone lines. No Ø32 mm option is exposed. Server normalizes submitted project snapshot pipe diameters to 25 mm.
- CLOSED — generated project PDF appends the owner's original three-page Bulgarian installation guide after the generated project pages, preserving original PDF pages and illustrations without redraw or abridgement.
- NOT VERIFIED — exact PR-head CI/build, Preview/Production deployment, visual review and actual owner/customer email delivery. Browser visual QA is not performed unless the owner separately authorizes Browser use.
- Remaining non-hydraulic engineering questions stay open where applicable: 1804/regulator compatibility, out-of-stock cart policy, full PE pipe/accessory installation BOM, exclusions/obstacles/overspray/wind/DU-CU and field validation.

---

## 2026-11-22 — Irrigation automation selection (PR #481 merged; Production deployed)

- CLOSED — customer chooses manual, TM2, RC2 or BAT-BT before the generated kit is added to the cart.
- CLOSED — manual mode omits the assistant BOM's electromagnetic valve SKU and VBA02672 valve boxes; TM2/RC2 add selected controller SKUs and preserve standard valves/boxes; BAT replaces the ordinary valve with Rain Bird 100-HV-9V (H01040) per zone and adds BAT-BT controllers. H01040 requires the updated HV bonnet (manufactured from 30.06.2025) and compatible TBOSPSOL 9 V DC latching solenoid.
- CLOSED — live catalog images/prices, controller zone allocation, cable notice for TM2/RC2, Wi-Fi notice for RC2, server-side snapshot validation and owner project-PDF automation section.
- CLOSED — exact-head CI and Pages Preview succeeded. Owner visual review of the latest Production revision remains open; Browser use requires owner permission.
- OPEN — safe checkout test with owner approval to confirm cart contents, server validation, both PDF attachments and Resend inbox delivery. Do not create Production orders or test emails before agreement.
- OPEN — owner confirmation whether to expose indoor/outdoor model variants as an additional choice. Current defaults: TM2 outdoor; RC2 indoor.
- Catalogue note: checked automation products currently have `stockStatus=onRequest`; the displayed price is the current published Sanity price, not a live stock guarantee. H01040's published Sanity description still contains an older incompatibility statement; verify the supplied bonnet revision and TBOSPSOL fitment before fulfilment.
- Release: PR #481 merged at `1ce629772e8a1e3f7be6d0af6d20d60e76849202`; Production deployment `eb9110fc-1b98-41cc-8b65-a63272cf8049` succeeded. Catalog audit: `../audits/2026-11-22-irrigation-automation-selection.md`.

---

## 2026-11-22 — Owner irrigation PDF handoff correction (PR #480 merged; Production deployed)

- CLOSED — исправлена проверка `ORDER_NOTIFICATION_EMAIL`: двойное экранирование regex не пропускало обычный email владельца и блокировало ветку отправки PDF проекта.
- CLOSED — владелец получает одним письмом два отдельных вложения: PDF заказа/проформа и предварительный PDF проекта. Если один из PDF не сформирован, письмо явно сообщает об отсутствующем вложении.
- CLOSED — проект не отправляется клиенту при checkout. Для банковского перевода он прикладывается к окончательной проформе через `confirm_proforma`; для остальных способов оплаты Owner запускает `approve_irrigation_project`, отправляющий оба PDF клиенту с копией владельцу. Повторная отправка блокируется; факт одобрения записывается в `order_events`.
- PR #480 merged SHA: `8214cdeef0183af6011f7f27aae5dd3730ef8ad5`. Production deployment `e2469d28-10f3-4efc-b1b7-9e9290f3d02b` успешно завершён. PR-head D1 и Blog/Studio validation runs `45042467098` / `45042467160` — success.
- OPEN — фактическое получение писем Resend в почтовом ящике и полный checkout E2E не подтверждены. Нужен безопасный тестовый сценарий с разрешением владельца; не создавать реальные Production-заказы и тестовые письма до согласования такого сценария.

---

## 2026-11-22 — Irrigation assistant balanced zones and owner PDF release

- PR #476 and PDF-detail follow-up PR #477 are merged into `main`; final merge SHA: `6ae20420380f5794aba331b65427ac31d3160e2d`.
- CLOSED — zoning behavior: perimeter and interior 90°/180°/270°/360° heads may share one zone. The complete deterministic sequence is evenly partitioned into the minimum number of zones, max six heads each (14 → 5+5+4; 13 → 5+4+4; 12 → 6+6). Mixed zone branch direction is handled per head.
- CLOSED — project handoff implementation: checkout sends a versioned snapshot, server validates it against resolved order SKU quantities, and D1 persists it in existing `order_events.metadata` (`irrigation_project_attached`) without schema migration.
- CLOSED — owner PDF implementation: separate A4 preliminary project PDF includes geometry/dimensions, sprinkler positions/arcs, zones, pipe-route drawing, catalogue names and BOM SKU/quantities. It is emailed only to the owner through existing Resend helper with a per-order idempotency key. Existing customer proforma/confirmation remains separate.
- NOT VERIFIED — actual end-to-end checkout and Resend inbox delivery. No Production order or test email was created by the assistant. Arrange a safe owner-approved test before claiming delivery is confirmed.
- OPEN engineering decisions remain: resolve mainline Ø25 vs earlier audit Ø32; measure dynamic source pressure/flow and prove nozzle operating pressure; hydraulically size zones and verify six-head suitability; confirm 1804/regulator compatibility; decide out-of-stock cart policy; complete PE mainline/accessory BOM; add exclusions/obstacles/overspray/wind/DU-CU and field validation.
- Production deployment `c122e2dd-e854-44fd-a68b-bfc2bcb4524a` succeeded from merge SHA above. No Sanity write, D1 schema/data migration, Cloudflare settings/secrets change or test order/email was performed.

Implementation: [balanced zones and order PDF](../engineering/IRRIGATION_ASSISTANT_BALANCED_ZONES_AND_ORDER_PDF_V1.md).

---

## 2026-11-22 — Irrigation engineer: release accepted; hydraulic decisions remain open

- PR #473 merged into `main` at `1926d632cc0861341a46ec932a2130ca94dfa103`; Production Pages deployment `0da20669-6b24-4697-8ac4-b281eebec9a2` succeeded from the exact SHA.
- Owner manually accepted the Preview UI and will provide detailed product/engineering feedback later. Do not treat this as field validation.
- CLOSED by owner decision 23.11.2026: all schematic main and zone pipes are PE Ø25 mm; Ø32 mm is not an option.
- CLOSED by scope decision 23.11.2026: no site pressure/flow measurements or hydraulic verification are performed by this geometric assistant. Manufacturer table values are geometric selection references only.
- CLOSED by scope decision 23.11.2026: hydraulic zone capacity is not calculated; six-head maximum remains only a geometric grouping rule.
- OPEN: verify 1804 + R-VAN assembly/regulation compatibility for the selected sprinkler model; this is a product compatibility question, not a hydraulic calculation.
- OPEN: decide cart policy for active catalogue products with `stockStatus=outOfStock`; current irrigation module resolves `isActive != false` and passes stockStatus to cart but has no independent out-of-stock gate.
- OPEN: determine exact PE mainline product/length and full installation BOM; current cart deliberately omits unverified mainline and hydraulic accessories.
- OPEN: extend engineering validation to exclusions/obstacles/overspray, wind, precipitation uniformity (DU/CU), multiple regions and field testing.
- Scope of owner-approved resumption on 22.11 is the perimeter-first lawn assistant, sequential zones and cart kit documented in `docs/engineering/IRRIGATION_ASSISTANT_PERIMETER_FIRST_IMPLEMENTATION_V1.md`. It does not automatically authorize all historical Rain Bird 3500/stage-8 roadmap work.
- No D1 schema/data, Cloudflare settings/secrets, Resend or order data changed. Sanity Production change was limited to the separately approved IQ21520F0N25C correction.

---

## 2026-11-22 — Storefront plant product page UX acceptance

- PR pending: `feat/plant-product-page-ux` improves plant purchase hierarchy, groups botanical information, consolidates variant details, collapses the care guide and adds a mobile sticky add-to-cart action.
- OPEN: exact-branch CI and Preview deployment; visual acceptance on desktop/mobile in BG/RU/EN; test variant changes, inStock/onRequest/outOfStock, missing price, no sale variants, long plant names and sticky action visibility/overlap with the mobile safe area.
- No Production release until the PR is reviewed and the owner explicitly authorizes merge/deployment. No Sanity/D1/Cloudflare/Resend writes are part of this UI-only task.
- Audit: `docs/audits/2026-11-22-plant-product-page-ux.md`.

## 2026-11-21 — Manager plant editor UX acceptance

- Exact PR head `a7219381ed47ebaa6cc44f3ee2365d3cb08be7a1`: Blog and Studio run `44921957018` and D1 validation run `44921957051` both succeeded.
- OPEN: Owner acceptance of Seller/Manager and Owner editor workflows on phone and desktop. Confirm unsaved-change warnings and role-specific field visibility in authenticated sessions.
- No Preview/Production deployment was performed; do not treat CI success as live UI acceptance.
- GitHub initially returned `mergeable=false` for PR #467; a subsequent refresh returned `mergeable=true`. No merge was attempted; recheck mergeability immediately before any future merge.

---

## 2026-11-21 — Bank transfer checkout / proforma release checks


- Implementation is on `feat/bank-transfer-proforma-invoice`; PR and CI verification are pending.
- OPEN: verify Blog/Studio validation, D1 validation and Pages Preview on the exact PR head. Confirm PDF font loading and inspect generated Bulgarian PDF visually, including a long item list and multiple-page behavior.
- OPEN: owner acceptance of bank transfer checkout wording and the rule that bank transfer is unavailable while plant delivery cost is still being agreed.
- OPEN: after merge and Production deployment are explicitly approved, use an agreed safe test order/email procedure; do not create a real Production order or send a test email without approval.
- The implementation does not create a tax invoice. The PDF is a proforma/payment request. Confirm with the company's accountant the exact tax-document issuance point and whether the five-day term should be attached to the proforma or only to a later tax invoice before representing it as a legally issued invoice.

## 2026-11-21 — Manager real-event visibility and push follow-up

- Owner reports the Owner-only push self-test and lifecycle checks 2.1, 2.2 and 2.3 as working.
- Owner created a service enquiry and a plant order in Production. The new records did not appear in Manager until a manual pull-to-refresh.
- Code review found the UI cause: order list polling was 15 minutes; service-lead list had no polling. PR #453 proposes 20-second visible-tab polling for both, plus focus/visibility refresh and overlap protection.
- [x] Exact-head CI and Preview for PR #453 passed (Blog/Studio 44867072658; D1 44867072702; Preview https://fab55962.florial.pages.dev). OPEN: merge and verify exact-SHA Production deployment.
- OPEN: independently confirm actual push reception for a real order on active Owner/Manager/Seller subscriptions and a service enquiry on Owner only. The owner report about list visibility does not establish whether the push notification itself arrived.
- OPEN: confirm notification tap opens the correct Manager section. No additional test orders/leads/emails should be created for QA without an agreed safe scenario.

# Florial — текущие открытые вопросы и проверки

Дата сверки: 2026-11-21.

## 2026-11-21 — Manager Web Push: post-release QA

- PR #450 merged into main at 54026c75030e5f950576cc1b99f7ebf8903006f1.
- Exact merge-commit Blog/Studio validation run 44859242349 — success; D1 validation run 44859242327 — success.
- Cloudflare Pages Production deployment e80238e2-af1a-4441-8134-4388124accee succeeded from the exact merge SHA; aliases florial-bg.com and www.florial-bg.com.
- Production D1 migration 0017 and VAPID variables were configured and verified before merge. Push implementation is deployed, but actual device subscription/delivery is not independently verified.
- OPEN: verify authenticated Manager Push UI and GET/POST/DELETE /api/manager/push/subscriptions on a real device; verify D1 subscription ownership without exposing endpoint/key material.
- OPEN: Android/Chrome permission, subscribe, persistence after reload, real push delivery, notification click to correct Manager section, unsubscribe and re-subscribe for Owner, Manager and Seller.
- OPEN: verify order push recipients (active Owner/Manager/Seller), service-lead recipients (active Owner only), test-order exclusion (is_test=1) and no customer PII in payload.
- Do not create real Production orders/leads or send test emails without an agreed safe test scenario. A safe way to trigger events without affecting real customers/data is required.
- Live Production scrape returned HTTP 200 for /manager/ (Bulgarian staff sign-in page, robots noindex/nofollow) and HTTP 401 Authentication required for unauthenticated GET /api/manager/push/subscriptions. Route presence/auth gating are verified; authenticated behavior and delivery remain open. Owner reports Manager appears to work.
- PRAGMA integrity_check remains unavailable through the current D1 API (SQLITE_AUTH); PRAGMA foreign_key_check after migration 0017 returned zero violations.

## 2026-11-20 — Manager Web Push: release prerequisites (historical snapshot; superseded by the 2026-11-21 status above)

- PR #450 contains the Manager Web Push implementation and remains Draft. Exact implementation/test head `a908426f3355c793e369ea0e0adaae170bbac6de` passed Blog/Studio run `44793855068`, D1 run `44793855086`, and Preview deployment `33d99b8b-e866-4701-85a9-d6809c9c62df`.
- Production D1 migration and VAPID setup were pending at that historical checkpoint; both were later completed with separate owner approval.
- Real Android Chrome install/permission/subscribe/push/click/unsubscribe verification remains pending.

## 2026-11-20 — Sanity category schema descriptor: legacy SEO fields

- При публикации контекстной ссылки в категории `Ротаторни дюзи` (`6690848d-a4a5-4386-b9ae-5f63604914b1`) Sanity document validator отметил существующие root-поля `seoTitle` и `seoDescription` как unknown fields для текущего descriptor типа `category`.
- Сами поля не изменялись в задаче переноса статьи; публикация категории прошла успешно, а локализованные ссылки на статью присутствуют в SEO content.
- Нужно сверить deployed schema descriptor с исходниками единственной Studio в GitHub и определить, являются ли эти поля историческим остатком или пропущенными schema fields. Не удалять значения и не менять schema до отдельной проверки и согласования.

Полная предыдущая история, включая закрытые задачи и старые проверки, сохранена без изменений в [OPEN_QUESTIONS_HISTORY_2026-11-18.md](../archive/OPEN_QUESTIONS_HISTORY_2026-11-18.md).



## 2026-11-20 — rotary nozzle replacement service: remaining verification

- Owner confirmed the published service changes work in the live interface. Sanity Production read-back confirmed the edited fields, unchanged slug/ID and preserved image assets.
- **Not independently verified:** browser-based visual/rendered HTML check of the public service URL and an end-to-end lead-form submission. The external page reader could not retrieve the URL. Do not claim those tests passed.
- Sanity beta validator reports `valid` but `complete=false`: custom validation callbacks (including custom slug uniqueness callbacks) were not executed. Built-in validation passed.
- Documentation PR #442 is merged in `main` at `ef1c0b5881759ee114665c6231fe09d80d52f362`; PR-head Blog/Studio and D1 workflows passed. No frontend/schema/runtime change or Production deployment was made.



## 2026-11-20 — Manager: приёмка закрыта подтверждением владельца

- Owner/Manager/Seller: владелец подтвердил, что приёмку прямого каталога считает пройденной.
- Password reset: владелец подтвердил, что проверку считает пройденной. Важно: во время реализации отдельное тестовое письмо не отправлялось; это owner-confirmed acceptance, а не сохранённый нами Resend delivery log.
- Cloudflare plant-care service binding: оставлен без изменений; владелец принимает его текущий статус. Отключение не требуется в рамках этой задачи и запрещено без отдельного согласования.
- Эти пункты закрыты как задачи текущего workstream. При будущих изменениях соответствующие сценарии проверяются повторно.

## 1. Главная ветка и репозиторий

- `main` — единственная главная и авторитетная ветка Florial. Все остальные ветки — исторические/вспомогательные refs; владелец решил не проводить их дальнейшую инвентаризацию, сравнение или удаление. В обычной работе их игнорировать и начинать новые задачи от актуального HEAD `main`.
- На дату последней проверки открытых PR было 0. Наличие старых веток не считается открытой задачей и не влияет на Production.
- GitHub branch metadata на 18.11.2026 показывала `main.protected=false`. Настройка защиты main — отдельная опция GitHub governance; не блокирует использование main как единственного источника истины.

## 2. Cloudflare Pages — dormant legacy variables

- Решение владельца от 18.11.2026: legacy-переменные `SUPABASE_*` / `VITE_SUPABASE_*`, которые могут оставаться в Cloudflare Pages Production/Preview, намеренно сохранены как неактивный резерв «на всякий случай».
- Они не являются частью действующей архитектуры Florial и не используются проектом. Не удалять, не изменять, не читать значения и не проводить повторные проверки только из-за их наличия.
- Возвращаться к этому вопросу только если владелец отдельно решит активировать Supabase или изменить инфраструктурную политику.

## 3. Текущие QA и технические вопросы

- **PostHog telemetry coverage:** live ingestion is active and five Florial events are confirmed in project `349453`. The code paths for `florial_phone_click`, `florial_chat_click` and `florial_checkout_start` were not present in the live event schema on 18.11.2026. Investigate delivery/trigger coverage before treating these as available analytics. Dashboard and evidence: `docs/FLORIAL_ANALYTICS_CONSENT_POSTHOG.md`.
- **Hreflang услуг:** ранее Production QA выявил неполные alternates для `avtomatizirano-kapkovo-napoyavane`. Проверить текущие BG/RU/EN HTML, исправить только SEO projection при подтверждении дефекта и повторно проверить все локали.
- **Растения и статьи:** Sanity Published read-back подтверждён, но live rendered HTML/browser QA остаётся неподтверждённым для категории `/category/rastenia` и статьи об оливе BG/RU/EN; для зимней статьи BG проверен, RU/EN остаются pending. Google recrawl/indexing не подтверждены. См. соответствующие audits в `docs/audits/`.
- **Hosted Sanity Studio:** проверить фактический hosted Studio deployment после последних schema updates, если работа затронет Studio; успешный Studio build в CI сам по себе не доказывает hosted deployment.
- **Gemini Manager smoke:** повторить только с авторизованной Manager-сессией и согласованной тестовой записью; root cause прежней ошибки не подтверждён.
- **D1 migration ledger:** актуальная Production сверка 2026-11-21 подтвердила миграцию `0017_manager_push_subscriptions`, таблицу и индексы; `PRAGMA foreign_key_check` — 0 нарушений. `PRAGMA integrity_check` остаётся недоступным через Cloudflare D1 API (`SQLITE_AUTH`); повторять его без изменения метода доступа не требуется.
- **Irrigation product SEO:** базовый аудит 2026-11-13 выявил 193/275 товаров без отдельного локализованного H1 и 143 с неполными RU/EN meta-полями. Это исторические counts, не актуальная перепись. Перед любым исправлением повторно получить live inventory; bulk apply, перезаписывающий заполненные поля, не использовать.
- **Google Shopping / Product Schema / Search Console:** продолжать строго по [дорожной карте](../roadmaps/GOOGLE_SHOPPING_SEO_ROADMAP_2026-11-18.md). PR #407 and PR #410 are merged; Product Offer remediation and brand parity are deployed to Production. CI for the corrected Product Schema and merge commit passed (see CHANGELOG and roadmap). Owner-provided Google Inspection Tool output on 19.11.2026 confirms successful crawl, indexing allowed, and Product, Merchant listings and Breadcrumbs detected without errors for Kumquat; the valve's later indexed state is owner-reported. These are URL Inspection observations, not a separately authenticated standalone Rich Results Test. Optional warnings remain: review/aggregateRating (do not fabricate), availability for `onRequest` (intentionally omitted), and shipping/return policy fields (blocked on confirmed business terms). Plant stock statuses for three palms were normalized in published Sanity; active plant counts are 26 inStock / 3 outOfStock / 21 onRequest with no root-vs-first-variant mismatch. The Offer helper files in `src/lib` and `functions/_lib` are currently identical but duplicated; consider a parity test or consolidation before future behavior changes. The BG `/terms` page remains marked as a legal-review draft, but the owner instructed to use the existing published rules for Google policy markup. Organization-level `MerchantReturnPolicy` now links to `/terms` using `merchantReturnLink` without inventing universal return conditions. Shipping markup remains open: current delivery terms do not specify the exact supported destination list or rate/transit-time values; do not infer country-wide or worldwide delivery. Dedicated Rich Results Test, broader URL Inspection/sitemap checks, Merchant Center account setup and commercial policy confirmation remain open. Merchant Center was confirmed not registered by owner on 18.11.2026.
- **Performance:** несколько старых release audits не имеют сопоставимых post-release Lighthouse/CLS/INP замеров. Не приписывать улучшение производительности без повторных измерений.

- **Google ProductGroup readiness:** Product Offer remediation passed CI on commit 92da3ec (Blog/Studio validation run 44355682859; D1 validation run 44355682858) and Cloudflare Preview deployed at https://9ba37c43.florial.pages.dev. Google Rich Results Test remains pending because the interactive testing application was not accessible through the available web reader; prefilled owner-run links are in the active roadmap/audit. Published plants dataset has 50 product documents with saleVariants and 0 documents with a non-empty SKU on any variant; current routing does not provide crawlable per-variant URLs. Do not implement ProductGroup or fabricate SKU/GTIN until real variant identifiers and variant URLs are added. Windsor.ai Search Console connector does not expose URL Inspection fields; use Search Console UI/API. Roadmap: [GOOGLE_SHOPPING_SEO_ROADMAP_2026-11-18.md](../roadmaps/GOOGLE_SHOPPING_SEO_ROADMAP_2026-11-18.md).

## 4. Намеренно приостановленная инженерная работа

- **Irrigation engineer assistant / Rain Bird 3500:** stage 7 (#349) уже объединён в `main` commit `1ddd1d99dd6cf086303c09ff2f856e96db84a8e6`. Workstream намеренно paused; stage 8 не начинать без отдельной просьбы владельца. Инженерные ограничения и порядок возобновления: [PAUSED_WORK_IRRIGATION_ENGINEER_ASSISTANT_2026-11-16.md](PAUSED_WORK_IRRIGATION_ENGINEER_ASSISTANT_2026-11-16.md).

## 5. Подтверждённое закрытие
- **2026-11-20 — внутренняя перелинковка доставки крупномерных растений закрыта:** 35 товаров, категория «Солитеры» (BG/RU/EN) и четыре страницы услуг обновлены в Sanity; Published read-back и Production HTML проверки прошли. Детали и snapshots: `docs/audits/2026-11-20-large-specimen-delivery-internal-links.md` и `docs/backups/sanity/2026-11-20-large-specimen-links-*.json`. Открытых действий по этой задаче нет.

- PR #383 (Manager plant catalog search controls / Seller permissions) merged в `main` commit `1716996c487c3dbfa6995b4eaa7a617cb90ad480`; не считать его открытой задачей.
- На момент сверки открытых PR: 0.
- Актуальный build/deployment статус зафиксирован в [REPOSITORY_RELEASE_READINESS_2026-11-18.md](../operations/REPOSITORY_RELEASE_READINESS_2026-11-18.md).


- **Google Product Schema validation:** PR #407's corrected Preview equipment and plant pages were parsed by Schema.org Validator: each 5 items, 0 errors, 0 warnings. Preview shows two Product and two BreadcrumbList nodes because middleware canonical URLs point to Production while client-rendered URLs use the Preview host; current Production equipment baseline has one Product and one BreadcrumbList. Official Google Rich Results Test is blocked by login/reCAPTCHA in the remote browser; no Google result exists yet. Rerun in an authenticated owner browser and after the corrected code is deployed to Production with approval. Roadmap: [GOOGLE_SHOPPING_SEO_ROADMAP_2026-11-18.md](../roadmaps/GOOGLE_SHOPPING_SEO_ROADMAP_2026-11-18.md).


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



## 2026-11-19 — Manager order details / proforma task closed

- PR #430 merged into `main` as `881db09ed84b0887560ddebc38fdcfa54aab4bcd`; implementation and documentation are in the authoritative branch.
- PR-head CI workflows passed and Cloudflare Preview succeeded. Cloudflare Pages Production deployment `6d8c4a4b-3cdc-43d8-a782-06223d32b55e` succeeded from the exact merge commit.
- Owner reports that the updated order workflow appears to work in the live interface; the task is paused at the owner's request.
- A separate independently observed Resend end-to-end delivery test to the customer and active Owner was not performed. Do not treat email delivery as independently verified. No live test order or test email was created by the assistant.
- Company email and IBAN are recorded in `docs/business/FLORIAL_COMPANY_PROFILE.md`.

## 2026-11-20 — delivery of large specimen plants service closeout

- Published service `df7893e8-902e-4265-921c-3cb0fd270cc8` is live at https://florial-bg.com/services/dostavka-na-edrorazmerni-rasteniya. BG/RU/EN public fetches returned HTTP 200 with localized metadata and indexable robots directives.
- No unresolved category decision remains: `planting` is the existing supported Gardener mapping in BG/RU/EN.
- Remaining verification boundary: no real Production enquiry was submitted, so the form's end-to-end delivery path was not tested. Do not create a test lead without approval.
- Detailed evidence and backups: `docs/audits/2026-11-20-delivery-plants-service-publication.md`.



## 2026-11-23 — GA4 rollout follow-ups

- **OPEN — Production analytics receipt:** PR #488 is merged and Pages Production deployment succeeded from exact merge commit `5ca0276fe3098f45a6871cb866f1ea96df325fb2`. A Realtime report immediately after deployment returned no events in the observed 30-minute window. Verify consent-gated tag loading and page/ecommerce events in Realtime/DebugView during an actual visit/session. Do not create a real order solely for testing without separate owner approval.
- **OPEN — privacy governance:** controller review of the analytics legal basis, Google provider terms, data retention and international transfer disclosures. Current BG/RU/EN copy is a technical disclosure update, not legal certification.
- **CLOSED — GA4 property configuration:** live read-back confirms EUR / Europe/Sofia, stream `16395579273`, email/query redaction and the existing `purchase` key event.


## 2026-11-23 — Blog performance release follow-up (PR #510)

- **CLOSED — implementation/merge/CI/Preview/Production:** PR #510 merged at f0913f3d379c718bc140d539e5b66beb7411a8f2; Blog/Studio CI 45267333166 and D1 validation 45267333146 succeeded; Preview 905e4a1d-f586-439e-abb9-f48802b5f177 and Production b7fd5ab1-4628-46b4-90af-8d6dd1853674 succeeded.
- **CLOSED — Production BG/RU/EN mobile HTML smoke:** localized title/intro, four category labels, localized Filters button, footer and blog preconnect hints were found in each rendered page; loading skeleton was absent after data loaded.
- **OPEN — matched performance measurement:** rerun PSI/Lighthouse at least three times on the same Moto G Power / Lighthouse 13.6 / low-end 4G profile and compare medians with the owner baseline (79 / FCP 0.9 s / LCP 2.7 s / TBT 10 ms / CLS 0.337 / SI 2.9 s). No after-change metric is claimed yet.
- **OPEN — visual/interaction QA:** screenshot review, actual filter dropdown open/close, category selection, combined filters, empty/reset state and desktop layout. Browser Use could not run due insufficient credits; rendered HTML smoke does not establish these behaviors.
- Evidence: docs/audits/2026-11-23-blog-performance-remediation.md and docs/ROADMAP_PERFORMANCE_OPTIMIZATION.md.
