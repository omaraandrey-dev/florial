## 2026-11-16 — Intake v1 Preview verification

- PR #329 runtime commit `662936768b311050699ebfb9c77c6857759aeedf` passed Blog/Studio run `43834815047` and D1 validation run `43834815101`.
- Preview deployment `28c55ebd-71d4-49eb-952e-2d2cffd50115` and read-only browser QA passed in BG/RU/EN and mobile 390 × 844. No console/runtime errors or horizontal overflow.
- QA verified geometry confirmation and the new pressure/flow controls. Hydraulic feasibility remains not evaluated; no solver, Gemini, catalogue, cart or persistence is connected.
- Privacy caveat: baseline page-use events are described as recorded in D1 regardless of optional PostHog consent. Project/lead data was not submitted.
- Remaining: keyboard/accessibility review, deterministic solver integration, verified product compatibility, Gemini server contract and cart revalidation. No Production release.

## 2026-11-16 — Conversational intake v1 validation and next gates

- Guided conversation-style intake implementation is merged in PR #329; exact runtime commit `662936768b311050699ebfb9c77c6857759aeedf` passed CI and Preview QA; see `docs/audits/2026-11-16-irrigation-assistant-conversational-intake-v1.md`.
- Intake distinguishes static from dynamic pressure, requires a customer assertion that dynamic pressure was measured while flowing and a known test point, and requires a declared flow measurement method.
- Hydraulic feasibility must remain `not_evaluated` until pipe network, elevation, restrictions, source behavior and approved hydraulic method are implemented. Current increment does not invoke the layout solver or Gemini and does not persist/transmit data.
- Remaining: full keyboard/accessibility review; next deterministic solver connection; exclusion/overspray support; engineering-approved manufacturer/body compatibility; server-side Sanity and cart contract; Gemini model/privacy/rate-limit/cost and secret configuration.
- PR #329 was subsequently merged and Cloudflare Pages Production deployment succeeded for main SHA `77ee6047879db9112ea0eee7c542aa1e795ebcc9` (deployment `38e83739-a57f-4e10-8d13-d2e40c60c0cc`). Production browser visual smoke is inconclusive due browser-environment QUIC/SOCKS errors; response metadata confirmed noindex. Preview full-flow QA passed.

## 2026-11-16 — Final Gemini review sequence and cart handoff approved

- Owner decision: Gemini performs a final second-pass review only after Florial's deterministic engineering result and exact catalogue proposal have been prepared. It checks consistency/completeness and produces an explanation; it cannot change calculation outputs, select/replace products, alter quantities/prices/availability or mutate cart state.
- UI should show a real review-in-progress state, then separate engineering status from AI review status. Do not show a fabricated countdown or imply engineer certification.
- Explicit user action is required to add the proposal to cart. The server must revalidate current published Sanity product IDs, compatibility, price and availability before passing validated IDs/quantities to the existing cart.
- Material AI findings require clarification/escalation or a new deterministic calculation after validated input changes. Gemini outage/malformed output must be represented honestly.
- Detailed contract: FLORIAL_AI_IRRIGATION_CONSULTANT_SPEC_V1.md §9.4.
- Still open: exact cart integration contract and current price/availability revalidation path; final review schema and approved Gemini model/privacy tier; actual latency baseline for any duration estimate; engineer-approved calculation and catalogue compatibility rules.

## 2026-11-16 — Emergent audit and next implementation gates

- **Source archive:** additional Emergent files were supplied/reviewed in the earlier conversation (FastAPI chat/documents/leads routes, Gemini LLM module, keyword retrieval, seed data, Pydantic models, React app shell/styles), but only `Chat.tsx` and `models/chat.py` are stored in GitHub. Complete export, manifests/lockfiles, licenses and tests are not preserved. Audit: `docs/audits/2026-11-16-emergent-irrigation-assistant-source-audit.md`.
- **Public preview:** static preview; 0/5 site parameters, knowledge 0/0, 0 requests; two harmless chat prompts returned an assistant error. Backend absence is not proven.
- **Current Florial gap:** assistant UI is still a three-step local intake/summary; it does not call the existing deterministic layout solver, AI, persistence, live catalogue selection or cart.
- **Next product milestone:** native guided flow with provenance-aware inputs, explicit static/dynamic pressure and measurement conditions, supported geometry confirmation, exact manufacturer-point selection, sampled layout preview and honest non-hydraulic status. Do not claim hydraulic feasibility from source flow alone.
- **Before automatic purchasable BOM:** verify complete body/nozzle/regulator compatibility, source pressure-flow model, pipe internal diameters and losses, zoning constraints, precipitation matching and overspray rules; resolve live Sanity price/stock.
- **AI/persistence gates:** define structured output validation, approved-source retrieval, authentication/ownership, consent, retention/deletion, rate limits and cost controls. Gemini must not invent manufacturer data or override the deterministic solver. D1 schema/secret/Production changes require separate approval.
- **Specialist handoff:** distinguish request persistence, Resend acceptance and human follow-up; this assistant workflow is not implemented.
- PR #326 documentation audit merged as `0bdbc5e3acbcc65c1a372b7b77706bd766edd0cf`; exact-head CI passed (Blog/Studio `43831658469`, D1 `43831658324`).

## 2026-11-16 — Emergent capture and AI irrigation consultant design

- **Captured:** PR #312 merged as `7a4e4b03d10b4df9d3123f268c31e4c4b594e2b2`. The repository now contains the Emergent prototype review, migration roadmap and partial `Chat.tsx` / `chat.py` source snapshots.
- **Specified in main:** PR #324 merged as `859937c09e4a86dbf8f8e131e6803daaa239c1f3`, adding the Florial AI irrigation consultant v1 specification, lawn-engine domain model and proposed layout/hydraulic algorithms. These remain design proposals, not implementation approval or proof of hydraulic feasibility.
- **Still open — Emergent source:** complete export/commit, package manifests and lockfiles, dependency licenses, all remaining frontend/backend files, LLM provider/model configuration, prompt/tool flow, retrieval implementation, persistence and deployment assumptions.
- **Still open — Florial decisions:** engineer review of algorithm limits, source-pressure models, pipe-loss method/coefficient sources, coverage resolution/tolerance, compatibility rules and approved reference scenarios.
- **Not implemented by these documentation changes:** Gemini endpoint/secret, conversation persistence, RAG, customer-facing chat integration, hydraulic solver, catalogue selection, cart handoff or project PDF. No Sanity/D1/Cloudflare/Production changes.



## 2026-11-16 — Irrigation assistant initial Production browser QA

- **Verified:** read-only browser inspection loaded the public home, automatic-irrigation service and assistant initial step in BG/RU/EN. Floating assistant launcher opens the dedicated route; no browser runtime errors/log entries were observed.
- **Not verified:** geometry submission/confirmation, later steps, water-source/flow/pressure entry, summary, responsive viewport comparisons and form submission. No data was entered.
- **Still not integrated:** the customer-facing assistant page does not call the deterministic placement engine. Do not expose layout recommendations before engineer-reviewed reference layouts and hydraulic/compatibility gates.
- Audit: `docs/audits/2026-11-16-irrigation-assistant-production-browser-smoke.md`.



## 2026-11-16 — Catch-can DUlq utility and field validation

- **Implemented:** PR #321 merged as `e8ee7bb477b2382ac60562428d8aa7e39b9b0491`. Exact-head Blog/Studio run `43822321587` and D1 run `43822321498` passed.
- **Available:** a deterministic utility calculates measured DUlq from catch-can volumes/depths using the lowest-quarter mean divided by the overall mean. It warns below 24 samples and assumes equal-area weighting.
- **Not implemented:** predicted DUlq for a proposed layout, radial distribution modelling, SC, net precipitation rate, weighted sample areas, measurement UI or customer-facing integration.
- **Next field-validation input:** collect an engineer-reviewed catch-can grid for a real zone, including sprinkler/nozzle model, arc, measured pressure, run time, wind conditions, can spacing and individual readings. Use the measurement utility only when sample placement represents equal areas; otherwise a weighted method is needed.
- **Production deployment:** Pages deployment `ac221f58-000d-479c-a9ed-d403b416efd9` completed successfully for the exact merge SHA; aliases `florial-bg.com` and `www.florial-bg.com` were assigned. No live data/configuration changes.
- Audit: `docs/audits/2026-11-16-catch-can-distribution-uniformity.md`.



## 2026-11-16 — Lawn layout acceptance hardening

- **Merged:** PR #319 as `df1592ba5519d75487cff030ae8b165a11d5ec35`. Exact-head Blog/Studio run `43821654485` and D1 run `43821654670` passed.
- **Strengthened:** rectangle widths 4/5/6/8m and three L-shape orientations now require 100% sampled coverage, zero uncovered samples and head-to-head pass; baseline rectangle/L-shape also tested at 0.125m resolution.
- **Still preliminary:** sampled coverage is not a continuous proof. Hydraulic feasibility, dynamic pressure, pipe losses, precipitation uniformity, overspray, wind and body/nozzle compatibility remain unevaluated.
- **UI integration intentionally deferred:** `IrrigationAssistantPage.tsx` currently collects/validates geometry but does not import or call `generateLawnSprinklerLayout`. Do not expose automatic layout recommendations until engineer-reviewed reference cases, manufacturer-data gates and the hydraulic/compatibility safeguards are satisfied.
- **Production deployment:** Cloudflare Pages deployment `d69f3379-bb36-4a1b-ba95-3114b35b5ba3` completed successfully for the exact merge SHA; aliases `florial-bg.com` and `www.florial-bg.com` were assigned. This was a test/audit-only change.
- Audit: `docs/audits/2026-11-16-lawn-layout-coverage-acceptance.md`.



## 2026-11-16 — Lawn layout engine release and engineering gates

- **Released:** PR #317 merged as `95c32aa4570499b61252f92fc8755e25ee314856`; exact PR-head Blog/Studio and D1 validation runs `43819093067` and `43819094228` passed. Cloudflare Pages Production deployment `3b39ef74-3fc8-46a3-8cd0-e4cf36d6fbdb` deployed that exact SHA successfully.
- **Implemented:** exact R-VAN/HE-VAN performance lookup data and preliminary deterministic sampled placement for one confirmed rectangle or orthogonal L-shape. R-VAN is prioritized per owner preference; HE-VAN remains conditional. See `docs/audits/2026-11-16-lawn-engineering-stage-gate.md`.
- **Not a finished design:** hydraulic feasibility, dynamic pressure, pipe losses, zones, precipitation uniformity, overspray, wind and exact body/nozzle compatibility are not evaluated. Browser visual QA and engineer field validation are not confirmed.
- **3500 gate:** Rain Bird D42378 supports adjustable 40°–360° arcs but states precipitation table values are based on half-circle operation. Do not infer arc-specific precipitation or scale values by angle. Confirm radius/flow applicability, exact nozzle-tree/package mapping and boundary overspray before integrating the rotor in the solver.
- **Uniformity gate:** manufacturer DU/SC claims are not per-layout results. A layout-specific estimate requires exact radial distribution profiles or engineer-reviewed catch-can measurements; do not calculate DU from binary coverage or average precipitation alone.
- **Next:** engineer-review reference layouts; resolve 3500 data gate; define precipitation-uniformity validation; then start hydraulic zoning/pipe-loss work using measured dynamic pressure/flow and actual network details.

## 2026-11-16 — Irrigation introduction video follow-up

- **Released:** PR #305 merged as `5ff280711c0b8926e420a2594428941085fc2824`; the approved 60.33-second Bulgarian Florial video is embedded only on `/services/category/polivni-sistemi`. Exact-SHA CI and Cloudflare Pages Production deployment succeeded. Details: `docs/audits/2026-11-16-irrigation-introduction-video.md`.
- **Not yet verified:** real playback and visual layout on mobile and desktop browsers. A Firecrawl browser check could not run because the connected account had insufficient credits; no pass is claimed.
- **Hosting risk:** current captioned MP4 URL is served from HeyGen `resource2.heygen.ai` and contains an `avatar_tmp` path. Long-term availability/retention is **НЕ ИЗВЕСТНО — нужно уточнить** with HeyGen. If the URL is temporary, prepare a durable Florial-controlled hosting proposal (e.g. Cloudflare storage), but do not upload media or change production storage/bindings without explicit owner approval.

## 2026-11-15 — Irrigation assistant next-stage decisions

- **Specified:** first engineering module is automatic lawn irrigation; detailed scope and acceptance criteria are in `docs/engineering/IRRIGATION_ASSISTANT_LAWN_ENGINEERING_SPEC.md`.
- **Specified:** Gemini is not the hydraulic solver. It may normalize customer answers, identify missing inputs, interpret drawings as unconfirmed drafts and explain verified results. The Florial deterministic engine owns geometry/coverage/hydraulic calculations and exact SKU compatibility.
- **Released in PR #303:** merged as `69ac9e5d2a5762f0bba97b8225fbb79ba85a3dd7`; exact-head CI passed and Production deployment `28954ce2-d134-4a56-9eb7-dad7576ea116` succeeded. Preview QA verified eligible/ineligible route behavior; Production QA confirmed the irrigation catalogue root and `polivni-sistemi` direction. Production route checks are complete: launcher/photo confirmed on irrigation catalogue root and `polivni-sistemi` direction; confirmed absent on homepage and plants category. Preview additionally confirmed equipment product/service inclusion and planting-service exclusion.
- **Required before calculator implementation:** exact Rain Bird SKU/performance-table audit; measured dynamic flow and pressure; scaled geometry and exclusions; engineer-reviewed baseline cases; paid Gemini API privacy/cost review before customer data is sent.
- **Not implemented:** hydraulic engine, Gemini endpoint, Cloudflare secret, product selector, cart integration or project PDF.

## 2026-11-15 — TypeScript and CI coverage completed (PR #299 merged)

- **Resolved:** root TypeScript check covers `src/` and Cloudflare Pages Functions; Sanity Studio has its own TypeScript check; both are part of CI for PRs to `main` and pushes to `main`.
- **Verified:** PR #299 merged as `e2329572f8af211a109434a8d9807610e59b7926`; exact-head CI passed (Blog/Studio #1315, Sanity Studio #170, D1 #1644; 167 tests passed); Cloudflare Pages Production deployment `a9588c4c-cc85-46fa-b3c8-4d8f7e3e2e36` succeeded for the same SHA.
- **Separate follow-ups, not blockers:** plan an incremental `strict: true` TypeScript migration; review React 18 runtime versus React 19 type package alignment. GitHub branch-protection required-check settings were not changed or verified.
- Audit: `docs/audits/2026-11-15-typescript-ci-validation.md`.

## 2026-11-15 — Nozzle product descriptions published; storefront visual check remains open

- All 26 published products in Sanity category `nozzles` and its two child categories have expanded BG/RU/EN descriptions; Production read-back confirmed 26/26 published and zero remaining drafts.
- Visual QA remains open for representative VAN, HE-VAN, R-VAN and strip-nozzle pages in BG/RU/EN, including mobile layout and internal-link navigation. Google recrawl/indexing is unconfirmed.
- Backup: `docs/backups/sanity/2026-11-15-nozzles-before-description-refresh.json`; audit: `docs/audits/2026-11-15-nozzle-product-descriptions.md`.

## 2026-11-15 — Valve product descriptions published; storefront visual check remains open

- All 17 published products in Sanity category `klapani` and its 24 V / 9 V child categories have expanded BG/RU/EN descriptions; Production read-back confirmed 17/17 published and zero remaining drafts.
- Visual QA remains open for representative DV/DVF, HV/HVF, PGA, PEB and LFV pages in BG/RU/EN, including mobile layout and internal-link navigation. Google recrawl/indexing is unconfirmed.
- Backup: `docs/backups/sanity/2026-11-15-valve-products-before-description-refresh.xml`; audit: `docs/audits/2026-11-15-valve-product-descriptions.md`.

## 2026-11-15 — Valve boxes and hydrant descriptions published; storefront visual check remains open

- All 7 products in Sanity category `shahti` have expanded BG/RU/EN descriptions; Production read-back confirmed 7/7 published and zero remaining drafts.
- Visual QA remains open for P33/P33DK, round VBA02672/VBA02673 and rectangular VBA02674/VBA02675 pages in BG/RU/EN, including mobile layout and internal-link navigation. Google recrawl/indexing is unconfirmed.
- Backup: `docs/backups/sanity/2026-11-15-valve-box-products-before-description-refresh.xml`; audit: `docs/audits/2026-11-15-valve-box-product-descriptions.md`.

## 2026-11-15 — Drip-tube product descriptions published; visual QA and one specification correction remain open

- All four products in `category-drip-tubes` have expanded BG/RU/EN descriptions; Production read-back confirmed all four published.
- Visual QA remains open in BG/RU/EN on desktop/mobile, including internal-link click-through. Google recrawl/indexing is unconfirmed.
- **Catalog data follow-up:** XFD1600-100's existing compatibility specification says generic 16 mm fittings, while Rain Bird's official XF blank-tubing documentation says it is not compatible with generic 16 mm fittings and specifies XF insert, Easy Fit compression and compatible 17 mm fittings. The description warns about this; the specification row was deliberately not changed and needs a separate review.
- Backup: `docs/backups/sanity/2026-11-15-drip-tube-products-before-description-refresh.xml`; audit: `docs/audits/2026-11-15-drip-tube-product-descriptions.md`.

## 2026-11-15 — Drip-fitting product descriptions published; storefront QA remains open

- All six products in `category-drip-fittings` have expanded BG/RU/EN descriptions; Production read-back confirmed 6/6 published and no remaining drafts.
- Visual QA remains open in BG/RU/EN on desktop/mobile, including internal-link navigation. Google recrawl/indexing is unconfirmed.
- Backup: `docs/backups/sanity/2026-11-15-drip-fitting-products-before-description-refresh.xml`; audit: `docs/audits/2026-11-15-drip-fitting-product-descriptions.md`.

## 2026-11-15 — Resolved process finding: prevent shared-document PR conflicts

- **Root cause identified:** PRs #283–#288 were created from the same base commit `e7ba53839775599c7a9625d8eef4b21a520efebd`. After #283 changed the top sections of `CHANGELOG.md` and `docs/AI/OPEN_QUESTIONS.md`, PRs #284–#288 remained based on the old commit and attempted overlapping top-of-file insertions; those PRs also independently edited `docs/TECHNICAL_PASSPORT.md`.
- **Classification:** Git integration/documentation conflict. This does not indicate a conflict in published Sanity product data.
- **Preventive rule added:** new branches must start from latest `main`; parallel tasks must not independently edit shared documentation; shared updates should be consolidated or branches synchronized sequentially; PR changed-file overlap and mergeability must be checked before opening and immediately before merge; refresh `main` after every merge.
- Rules are recorded in `AI_INSTRUCTIONS.md` and `docs/AI/WORK_PROTOCOL.md` and were merged into `main` by PR #289.
- **Remediation completed:** PR #290 was merged into `main` as commit `2298c421daef6e830a94b333723ace2751c15db0`. The five original PRs (#284–#288) were then closed as superseded. All five unique audits and all five original Sanity backup files are present in `main`; shared-document entries were integrated once. The original PR branches were not merged, so their duplicate/conflicting edits cannot be reintroduced.

## 2026-11-15 — Sprinkler product descriptions published; storefront visual check remains open

- All 20 published products in Sanity category `sprinklers` and its two child categories now have expanded BG/RU/EN formatted descriptions.
- Each locale has five H2 sections, bold emphasis and two internal links. Production read-back confirmed 20/20 published and no remaining drafts.
- Prices, stock, SKUs, slugs, category references, images, product specifications, related-content references and SEO were preserved.
- Pre-change snapshot: `docs/backups/sanity-sprinklers-before-description-refresh-2026-11-15.json`; detailed audit: `docs/audits/2026-11-15-irrigation-sprinkler-product-descriptions.md`.
- **Still to verify:** visually inspect representative 5000/Falcon/8005 rotor pages and 1800/UNI-Spray static pages in BG/RU/EN, including both internal links and mobile layout. The live fetch was blocked by exhausted Firecrawl credits; direct web access to the storefront page also failed.
- Google recrawl/indexing and search impact are not confirmed. No code/schema or Pages deployment was required for this content-only update.

## 2026-11-15 — Controller product descriptions published; storefront visual check remains open

- All 24 published products in Sanity category `controllers` and its four child categories now have expanded BG/RU/EN descriptions with H2 structure, bold emphasis and internal links.
- Production read-back confirmed 24/24 published and no remaining drafts. Prices, stock, SKUs, slugs, category references, images, product specifications, related content and SEO were preserved.
- Pre-change snapshot: `docs/backups/sanity-controllers-before-description-refresh-2026-11-15.json`; detailed audit: `docs/audits/2026-11-15-irrigation-controller-product-descriptions.md`.
- **Still to verify:** visually inspect at least one representative ESP-TM2, ESP-RC2, ESP-BAT-BT and ESP-9V product page in the live storefront (BG/RU/EN), including internal link navigation and mobile layout. The public page fetch did not complete in this run.
- Google recrawl/indexing and any resulting search changes are not confirmed. No code/schema or Pages deployment was required for this content-only update.

## 2026-11-15 — Flower subcategory SEO publication and catalog follow-ups

- Published BG/RU/EN SEO footer content (27 blocks / 9 H2 per locale) for all four Sanity child categories of `plants-flowers`: `plants-perennials`, `plants-seasonal-flowers`, `plants-groundcovers`, `plants-ornamental-grasses`.
- Live BG rendering verified for all four; RU seasonal and EN perennial rendering also verified. Google indexing/recrawl remains unconfirmed.
- Catalog review needed before any correction: `plants-groundcovers` currently has zero linked products; `plants-ornamental-grasses` currently references `tree-laurel` (`Laurus nobilis`, `productType: tree`), which appears inconsistent with the category label. No product or relationship data changed.
- Pre-write backup and detailed evidence: `docs/backups/sanity/2026-11-15-flower-subcategories-before-seo-content.json`, `docs/audits/2026-11-15-flower-subcategories-seo.md`.
## 2026-11-15 — Irrigation services restored as two separate published pages

- Completed in Sanity Production: original `avtomatichno-napoyavane` service restored from backup and new design service published at `proektirane-sistemi-avtomatichno-napoyavane-nesebar`.
- Both service documents are active and indexable in BG/RU/EN; IDs: `04c7ab3b-1888-41cb-9917-6b9014cd1ac3` and `ddb0b366-4198-4049-b947-680df47f8c6b`.
- Both Production URLs were verified with Cloudflare Browser Rendering: HTTP 200, expected BG title/H1/canonical on the restored old page and new design page. The first old-page render was stale immediately after publication; a fresh render after cache expiry confirmed the restored content.
- No application code, schema, navigation or Cloudflare settings changed. No production deployment was triggered.
- Owner's permanent rule: existing service, blog and portfolio documents must not be edited, replaced, unpublished or deleted without first showing the exact change plan and receiving separate explicit approval.
## 2026-11-15 — Irrigation design service: completion and remaining checks

- The existing service `avtomatichno-napoyavane` is published in Sanity Production in BG/RU/EN, with `noIndex=false` in each locale. Five inline illustrations and one hero image have localized ALT values and are assigned to the relevant article sections.
- PR #272 is merged and Cloudflare Pages Production deployment for commit `24e03b9cdb7b15dfac829e01b4973b104f7cd937` succeeded. Live BG metadata/canonical/hreflang and EN HTTP 200/title/description/canonical/H1/H2 were confirmed through Cloudflare Browser Rendering. RU page text/metadata/headings were returned by the renderer, but its structured JSON extraction ended with HTTP 422; Sanity content is confirmed published.
- Remaining verification: inspect the rendered page visually on desktop/mobile; confirm Google indexing/recrawl later in Search Console. These are not blockers to publication.
- Separate infrastructure observation, not changed as part of this task: the live Cloudflare Pages project configuration still exposes legacy `SUPABASE_*` / `VITE_SUPABASE_*` environment-variable names in preview/production. Current runtime usage and whether any are inert are **NOT KNOWN — needs a separate source/config audit**. Do not delete or modify these variables until code/workflow references are checked and the owner approves.
## 2026-11-14 — Palm category page-level GSC metrics and rendering follow-up

- Page-only GSC last-28-day report returned 5 impressions / 0 clicks for `/category/palmi-yuki`: BG base URL 1 impression (position 60), EN `?lang=en` 2 (position 3), RU `?lang=ru` 2 (position 7.5). The query-level report exposed no query text; this is not zero total impressions.
- Source code inspection confirms canonical/hreflang generation, index/follow unless `noIndex=true`, and CollectionPage JSON-LD. RU/EN `?lang=` URLs are intentional language routes.
- Cloudflare Browser Rendering verified HTTP 200 and the full JavaScript-rendered category SEO section in BG/RU/EN; localized title/description, index/follow, canonical, hreflang and CollectionPage JSON-LD are present. **Pending:** use Google Search Console URL Inspection to confirm Google's selected canonical for all locale URLs.
- GSC has shown apex/www page variants for Washingtonia. Source code uses apex canonical URLs; Google's selected canonical is not confirmed and needs URL Inspection.
- No app code or Sanity content was changed. The docs-only merge to main triggered a successful Cloudflare Pages Production build and deploy at commit `91c9bb859eb3a7bc9a6a246b3a3b29dbc36cd181`.

## 2026-11-14 — Palm category and Washingtonia verification findings

- **Category metadata correction proposed, not applied:** `plants-palms` Meta Descriptions are 170 BG / 163 RU / 191 EN characters; the project target is 160 or fewer. Meta Titles are 48 / 47 / 51 characters. `noIndex` is null in all three locales.
- The category already has 32 SEO content blocks in each language, including local coastal context, species guidance, winter protection and FAQs. Verify live rendering and internal links before adding any more copy.
- **Washingtonia identity check completed:** two distinct offers exist — standard 240 cm / 50 L / EUR 600 / stock 50 and large 475–525 cm / 300 L / EUR 3,000 / stock 1. Keep both product records; assign different query targets.
- GSC last-28-day sample returned five Bulgarian Washingtonia query/page rows, all to the standard product URL; no row for the large-specimen URL in this sample. Both apex and www variants appeared for the standard page; canonical verification remains open.
- No Sanity writes or product/category changes were made. Updated reports: `docs/audits/2026-11-14-palm-keyword-map.md` and `docs/audits/2026-11-14-palm-seo-priorities-and-90-day-plan.md`.

## 2026-11-14 — Stages 9.5–9.6: palm SEO priorities and 90-day plan recorded

- The prioritized action list and 90-day calendar are documented in `docs/audits/2026-11-14-palm-seo-priorities-and-90-day-plan.md`.
- First gates are technical verification of the existing palm category, separate SEO targeting for the two confirmed distinct Washingtonia offers, apex/www canonical consistency, and confirmation of second-domain control and intended business role.
- The existing category and species product pages remain the planned SEO targets. No new category, duplicate catalogue, domain redirect or canonical change is approved by this planning report.
- No Sanity writes, code/schema changes, Cloudflare/DNS settings or GBP writes were performed.
- Execution remains conditional on the relevant owner approvals and the evidence checks listed in the plan.

## 2026-11-14 — Stage 9.4: second-domain review completed; owner/control verification remains open

- Public indexed content on `www.palmandolivetrees.com` explicitly names Florial, Nessebar and the same phone as the connected Google Business Profile. The live GBP record links to `https://florial-bg.com/`.
- The secondary domain overlaps strongly with the primary site on palm sales, cold-hardy palms, species names, olives, planting, landscaping and irrigation. Exact verbatim duplication has not been proven.
- The connected Windsor.ai account list does not include a separate Search Console property for the second domain. Its clicks, impressions, queries and indexing data are unknown.
- **Owner confirmation needed:** does the user/business control `palmandolivetrees.com` (registrar, DNS and hosting/CMS), and is it intended to remain a separate lead-generation site or be retired?
- **Technical verification pending:** robots.txt, sitemap.xml, HTTP status/redirects, canonical, hreflang, meta robots, registrar/DNS/hosting and full URL inventory. The available web reader could not fetch the technical endpoints.
- Do not redirect, remove, canonicalize or rewrite the second domain before ownership/control and the intended business role are confirmed.
- Primary Florial commercial domain remains `florial-bg.com`, matching the connected Google Business Profile website field.
- Full report: `docs/audits/2026-11-14-second-domain-seo-review.md`.

## 2026-11-14 — Palm keyword map (stage 9.3) completed; follow-ups remain

- A read-only BG/RU/EN keyword map and page ownership plan is recorded in `docs/audits/2026-11-14-palm-keyword-map.md`.
- GSC data was retrieved through the connected Windsor.ai Search Console property. Trial access currently allows only the last 30 days; a 12-month request was rejected. Last-28-day metrics are a small directional sample, not a search-volume estimate or stable ranking baseline.
- No visible query strings were returned for `/category/palmi-yuki` in the last-28-day query report; a page-only report shows 5 impressions / 0 clicks across BG (1), EN (2) and RU (2). Monitor query visibility and clicks after the technical rendering review; this does not prove the category has never ranked.
- Existing category/product URL ownership is mapped. No Sanity content, category structure, schema or application code was changed.
- **Next:** execute the P0 checks in the 90-day roadmap: verify the category's live/Google-rendered HTML and selected canonicals; assign separate SEO targets to the two distinct Washingtonia offers; confirm ownership/control and intended role of `palmandolivetrees.com`. Do not redirect or rewrite the secondary domain before that confirmation.
- **Still unknown:** keyword volumes/difficulty; GSC history beyond 30 days; Google recrawl/indexing; initial HTML and canonical/hreflang for the palm category; the second domain's technical relationship to Florial.

## 2026-11-14 — Trachycarpus fortunei priority-2 completed

- Duplicate two-trunk variant removed from `palm-trachycarpus`; retained the owner-selected variant with stock 5, EUR 1,000 and 50 L container.
- Product H1, Meta Title and Meta Description completed in BG/RU/EN; missing second-gallery ALT fields completed in all three languages.
- Post-publication read-back confirmed the change. Pre-change field backup and audit are in `docs/backups/trachycarpus-before-priority-2-2026-11-14.json` and `docs/audits/2026-11-14-trachycarpus-priority-2.md`.
- No code deployment. Google recrawl/indexing remains unverified.

## 2026-11-14 — Palm priority-1 SEO remediation completed in Sanity

- All 11 published palm-type product documents in `bxvcy0qs/plants` were reviewed and corrected where needed.
- 23 overlength BG/RU/EN Meta Descriptions were shortened; final published check: zero descriptions over 160 characters and zero Meta Titles over 70 characters across the 11 products.
- Cycas revoluta now has accurate cycad wording in all three SEO locales and image ALT values. Its `productType` is `other`; category references now point to `plants-exotic`, not `plants-palms`.
- The second Washingtonia product now has all three main-image ALT values. Final check: zero missing ALT among these 11 products.
- Revision-guarded drafts were published. Affected-field backup and original revisions are in `docs/backups/palm-seo-before-priority-1-2026-11-14.json` on the SEO remediation branch. A separate Sanity dataset copy was not possible because the project quota was exceeded; the backup is field-scoped, not a full dataset export.
- No code or Production deployment changes. Google recrawl/indexing remains unverified.
- Detailed audit: `docs/audits/2026-11-14-palm-priority-1-remediation.md`.

## 2026-11-14 — Product SEO content remediation completed; Google verification remains open

- Manual SEO review and corrections are complete for all 275 published equipment products in Sanity Production. All 2,475 BG/RU/EN H1, Meta Title and Meta Description fields are populated.
- 228 product documents received one or more manual SEO corrections (1,130 field values); 47 products were retained unchanged because their existing metadata passed review. The generator was not used to populate Sanity SEO content.
- Final read-only checks: zero missing SEO fields; zero titles over 70 characters; zero descriptions over 160 characters; zero ellipses/truncation; zero suspicious empty/dangling punctuation; zero Cyrillic in English SEO; zero Sozopol references; zero product noIndex=true in BG/RU/EN.
- Pre-write backup of all 275 products' original SEO subdocuments and revisions is saved in docs/backups/product-seo-before-manual-repair-2026-11-14.json and parts 01–11. Detailed results: docs/audits/2026-11-14-manual-product-seo-remediation.md.
- PR #260 was merged to main at 9b49f56591cc9297e725bec24c40b7219f5dc287. Cloudflare Pages Production deployment bc022ecf-8777-4575-9f11-e1f6fa33072f succeeded for that commit.
- **Still open for Google verification:** GSC sitemap processing, URL Inspection, Google-selected canonical, indexing and recrawl status have not been accessed. The current live sitemap XML and representative production HTML were not re-fetched after deployment; last live sitemap verification was 2026-11-13 (1,312 unique URLs).
- OpenSEO can connect Search Console data, but it is not connected in this session. After connection, verify sitemap status, coverage, canonical selection, impressions/clicks and representative product URLs.
- Legacy SUPABASE_/VITE_SUPABASE_ variable names remain visible in Cloudflare Pages configuration. They were not changed; separate code-reference verification and explicit approval are required before removal.

## 2026-11-13 — Manager product SEO safe mode deployed; content apply pending

- PR #259 is merged into `main` at `3c909da0fc235aff2cc19ccdb73a1edba7960670`; Production Pages deployment `4db8a0e1-ff55-4470-9fd5-c179f2993ba7` completed successfully.
- Fresh read-only Sanity recount remains 275 published products, 193 with gaps, 1,153 missing fields and 1,322 populated fields to preserve. First six product samples were inspected for fill/preserve decisions.
- No Sanity writes or publication have been run. **Open owner decision:** after reviewing the live Manager preview, explicitly authorize the separate Apply operation if desired.
- Direct Manager UI click-through remains unconfirmed because verification did not have an authenticated Owner session; read-only Sanity recount and sample inspection match the Manager preview code.
- Cloudflare Pages still lists legacy `SUPABASE_*` / `VITE_SUPABASE_*` environment-variable names. They were not changed. Separately verify code references and remove obsolete variables only with owner approval.

## SEO release checkpoint 13.11.2026

- PR #257 merged and deployed to Production; exact details and limitations recorded in `docs/audits/2026-11-13-sitemap-and-structured-data-audit.md`.
- Next read-only task: after Browser Rendering rate limit clears, verify representative Production product (BG/RU/EN), plant variant product, irrigation/plant category, service, blog article and RU/EN `/terms`; inspect robots, canonical, hreflang and JSON-LD. Do not treat GSC historical noindex report as current until Google re-crawls.
- Then review the separate Sanity content gaps with owner before any writes; backup is mandatory before batch changes.
- Cloudflare Pages Preview deployment for implementation SHA 766309804eff29ffe36033fe464cb2603bd84a0c succeeded: 27b617f5-807c-4a43-a264-0bd2e613fc37 (https://27b617f5.florial.pages.dev). This is Preview only, not Production.
- Mobile visual/browser QA remains open: the attempted browser inspection could not run because the connected browser service had exhausted its credits. Do not infer successful mobile QA from the Pages deployment.
## 2026-11-13 — Cart quantity input and equipment weight (PR #256)

- PR #256: https://github.com/omaraandrey-dev/florial/pull/256 — direct numeric quantity editing on product details and cart rows; plus/minus controls retained.
- Existing Sanity weightKg is now projected into equipment products and persisted cart items. The cart summary shows the sum of equipment weights only, beneath order/delivery totals; plant-only carts omit it. Mixed carts explicitly label the value as equipment weight. If any equipment weight is missing, the UI avoids a partial sum and reports missing weight data.
- Old persisted carts are handled by a read-only Sanity Production lookup when the cart is opened.
- Still to verify: final CI including Studio build on the exact latest PR head; mobile browser QA for direct entry, focus/select behavior and plus/minus synchronization; verify equipment-only, plant-only and mixed carts, including one missing-weight edge case; after owner-approved merge, verify Production deployment and live storefront behavior.
- No Sanity writes/schema changes, D1, Resend, Cloudflare configuration/secrets or global layout/navigation changes.

## 2026-11-13 — Remaining irrigation category SEO published

- Completed the remaining category SEO batch: 42 published Sanity category documents in `bxvcy0qs/production`, including the irrigation catalogue root and every remaining category with product references. Together with the previous 10 primary categories, **52/54 category documents** now have the full BG/RU/EN SEO treatment.
- Published 126 localized SEO articles with four visible FAQ pairs each. All have 13 Portable Text blocks; article lengths are 1,676–2,061 characters. All localized titles are <=70 characters and descriptions <=160 characters.
- Two zero-product categories were deliberately left unchanged: `electromagnetic-valves` and `troynik-90-plastmasov-vatreshna-rezba`. Do not create SEO copy for them until they have an actual assortment or a separate indexing decision is approved.
- Backup and exact verification: `docs/backups/sanity-irrigation-remaining-categories-before-seo-2026-11-13.json`; full audit: `docs/audits/2026-11-13-irrigation-remaining-category-seo.md`.
- Post-publish comparison confirms IDs, slugs, parent references, images, sort order, help blocks and all `noIndex` values are unchanged. No code/schema/Production deployment changes.
- **Still to verify:** inspect initial HTTP HTML and rendered Production category routes in BG/RU/EN for H1, metadata, canonical/hreflang and article placement. Google recrawl/index refresh is not confirmed.
- **Existing schema warnings:** six documents still trigger Sanity beta validator errors for pre-existing root-level `seoTitle` / `seoDescription`; the root category also has legacy `order`. These fields were preserved. No cleanup without a separate approved migration and backup.

## 2026-11-13 — Related service priority for irrigation product categories

- Owner approved applying the category-first related-content rule to every irrigation equipment category, including future categories and subcategories.
- Implementation is in PR work branch `feat/category-related-services-for-equipment`: resolve the assigned category's `helpBlock.buttonUrl` (falling back to the same default irrigation-installation service as `CategoryPage` when empty/invalid), show the active service/published article first, append product-specific related content in Sanity order, and suppress duplicates. Existing four-card limit remains.
- No category data migration is needed; this is runtime logic driven by the existing category field. Verify CI/build and review the exact PR diff before merge. After merge, verify one product from a category with a matching individual link and one without a match, then confirm a subcategory route.

## 2026-11-13 — Irrigation category SEO follow-up

- 10/10 primary irrigation categories are published with BG/RU/EN H1, Meta Title, Meta Description, concise descriptions and localized SEO articles/visible FAQ. Details: `docs/audits/2026-11-13-irrigation-category-seo.md`.
- **Still to verify:** inspect the initial HTTP HTML and rendered Production routes for representative categories in BG/RU/EN; confirm metadata, canonical/hreflang and the SEO article are visible to crawlers. No application deployment was made in this content-only update.
- **Still to do:** monitor/request Google recrawling after route verification. Search results may continue to show cached metadata temporarily.
- **Schema follow-up:** four existing category documents contain root-level legacy `seoTitle` and `seoDescription` fields absent from the deployed category schema. They were preserved. Any schema registration or data cleanup requires a separate approved migration and backup.
- Visible FAQ content was added, but FAQPage structured data was not. Revisit only if there is a concrete search-feature requirement; do not assume FAQ rich snippets will be displayed.

## 2026-11-13 — Plant category SEO metadata published

- Completed the category-wide SEO update: 17/17 published plant categories in Sanity dataset `plants`.
- BG/RU/EN each have category-specific Meta Title and Meta Description values (51 pairs in total). All titles are 70 characters or shorter; descriptions are localized and include relevant local intent.
- The H1 fields, category descriptions, slugs, images, category tree and product data were preserved. Backup and exact verification details: `docs/backups/sanity-plant-categories-before-seo-2026-11-13.json` and `docs/audits/2026-11-13-plant-category-seo.md`.
- **CI on exact content/docs head `6100fbe1ba79f977700c4a442005b37266f4f4c7`:** Blog and Studio validation run `43406072024` — success (lint, website utility tests, website build, read-only migration dry-run and Studio build); D1 migration validation run `43406071860` — success. No application code changed.
- No code/schema/deployment changes. **Still open:** verify the initial HTTP HTML metadata for representative plant category routes in BG/RU/EN and request/observe Google recrawl; Google AI/search results may continue to reflect previously indexed metadata until refreshed.

## 2026-11-13 — PR #251 merged and deployed; owner QA pending

- PR #251: https://github.com/omaraandrey-dev/florial/pull/251 — squash-merged.
- Merge commit: `eb8553f73732bc18d8b64cdcf112f8f2d00fd4d4`.
- Cloudflare Pages Production deployment `928ed2ca-fffb-4941-8942-529bf3119c3b` — **success** on the exact merge commit; deployment URL: https://928ed2ca.florial.pages.dev.
- Preview deployment policy remains `all` with branch include `*`; Production branch remains `main`.
- CI passed on final PR head `6170907cc7aefbf0b92cd94641590cd4a1ed46b7`: Blog and Studio runs `43400080140` and `43400000309` — success; D1 migration validation run `43400000333` — success. Documentation-only follow-up commits did not alter implementation code.
- Phase 1 implements server-rendered plant category product fallback and ItemList JSON-LD. Existing React catalogue remains responsible for interactive browsing; equipment-category SSR is deferred to Phase 2.
- **Owner QA remains pending:** check live category pages in BG/RU/EN, product cards, links, prices/availability, layout and browser console.
- **Initial-response QA limitation:** the earlier browser scrape captured the DOM after React startup, not a proven JavaScript-disabled first HTTP response. The documentation does not claim that raw initial HTML was independently inspected.
- No Sanity writes, D1 schema/data changes, Resend changes, Production secrets/bindings/DNS changes, or Header/menu/Footer/global React architecture changes. Cloudflare Preview deployment policy was changed earlier with owner approval.

## Current checkpoint — PR #251 / Cloudflare Preview (13.11.2026)

- PR #251 is open on `feat/plant-category-server-rendering`. Code implementation SHA `0ef46d74d7fd5e48af38c80985a1604e968bbf30` passed exact-SHA GitHub Actions: `43396561749` (Blog and Studio) and `43396561879` (D1 migration validation). Later commits in the PR update documentation only.
- Cloudflare Pages project `florial`: Preview setting is now `all` with include pattern `*`, changed after explicit owner approval. Production branch `main` and automatic Production deployments remain enabled.
- Preview deployment `5fc9f0fb-3f3c-4e82-b1a1-8556866f093c` (`https://5fc9f0fb.florial.pages.dev`) completed successfully on documentation-updated PR head `73c2132f4ac69546c26697d48b33a156991460d3`. Initial HTTP HTML QA for BG/RU/EN remains unconfirmed: the available scrape returned the client-rendered DOM after React startup, not the original response.
- Production D1 binding `DB` remains configured; Preview has no D1 binding. Legacy Supabase-named environment keys remain in Cloudflare configuration: Preview has `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`; Production has those two plus `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Only key names were inspected; values were not read. Their current runtime usage was not re-audited in this task. These residual keys are not evidence that Supabase is part of the active Florial architecture; do not remove them without a separate code-usage audit and owner approval. Do not copy Production bindings or secrets into Preview as part of this task. Preview URLs are public unless protected separately.
- Production remains on `main` commit `0df7a52bb2a923f71096179c3837141382446554`; deployment `5c52db09-707f-47a7-a4c7-1ffea0300130` succeeded on that commit. PR #251 has not been merged.

## Plant category server-rendered catalogue — PR #251 open (13.11.2026)

- Branch: `feat/plant-category-server-rendering`. Plant categories only; equipment categories remain Phase 2.
- The Middleware includes published plant products in initial category HTML and emits localized product links plus ItemList JSON-LD. React continues to load live catalogue data and replaces the server fallback after JavaScript starts.
- Sanity read-only GROQ check: 12 products for `plants-palms`; 50 for `plants-root` across 17 category documents. No Sanity writes.
- CI on exact implementation head `0ef46d74d7fd5e48af38c80985a1604e968bbf30`: Blog/Studio `43396561749` and D1 validation `43396561879` — success.
- Cloudflare Preview setting is `all`; the Preview deployment on head `73c2132f4ac69546c26697d48b33a156991460d3` completed successfully. Initial no-JavaScript HTML QA remains pending; post-JS DOM inspection is not a substitute.
- Preview has no D1 binding; Manager/orders checks are excluded. Production remains on `main` commit `0df7a52bb2a923f71096179c3837141382446554`; PR #251 is not merged or deployed.
- Do not extend to equipment categories until Phase 1 Preview HTML/browser QA passes.
- Details: `docs/audits/2026-11-13-plant-category-server-rendering.md`.

## Production incident — blank storefront after PR #249 (13.11.2026)

- Confirmed source-level cause: temporal-dead-zone `ReferenceError` in `src/App.tsx` because the SEO effect dependency array reads `currentService` before its `const` initialization later in `App`. This causes initial render failure and an empty root.
- Cloudflare deployment `467d9866-0d04-4ef1-b265-3f84b6533950` reports build/deploy success; client-side JS startup was not exercised by that pipeline.
- Hotfix branch `hotfix/app-current-service-initialization` moves the declaration before the SEO effect and adds a test guarding declaration order.
- Open: wait for CI; obtain owner authorization before rollback or Production release; verify browser console, root render, homepage, service routes, blog and locales after recovery.

## PR #249 — services and blog route loading optimization (merged/deployed, browser QA pending, 13.11.2026)

- PR #249: https://github.com/omaraandrey-dev/florial/pull/249; squash merge commit `d4b19a59775cb6370ed28a3d90dd4ef36760db9f`.
- Code separates the full service directory from global route loading while preserving a compact Header service query. That compact query also carries the small image fields required by homepage service cards and About-page service images; both pages use it instead of the `/services` full directory state. Individual service routes fetch one localized service document by slug.
- During final review, a regression was found where homepage and About page still consumed the now route-specific full service state. It was corrected before merge and covered by new tests.
- Homepage's sixth plant category is now the published Sanity category `plants-solitaires` (slug `soliteri-edrorazmerni`) instead of `plants-citrus`; no Sanity content was written.
- Blog card queries are locale-specific. Blog article details are fetched independently from the full blog index; related posts are a separate query limited to three.
- Responsive Sanity image sizing and selective eager loading were added for service pages. Blog article cover remains eager/high priority; galleries and cards are lazy.
- Automated regression tests cover route-specific loading, localized blog data, homepage specimen category and compact service-card data. CI on final PR head `91bc8abd042f6624dc531081bbde077d254d76cc`: Blog and Studio run `43389185896` — success; D1 validation run `43389169540` — success.
- Cloudflare Pages Production deployment `467d9866-0d04-4ef1-b265-3f84b6533950` — `success` на точном merge commit `d4b19a59775cb6370ed28a3d90dd4ef36760db9f`; URL `https://467d9866.florial.pages.dev`; production aliases `https://florial-bg.com` и `https://www.florial-bg.com`.
- Studio dependency installation reported 23 npm audit findings (13 moderate, 9 high, 1 critical). Affected packages and production exposure have not been investigated; no dependency changes were made as part of PR #249.
- **Required browser QA:** `/services` list and all visible service links; direct service URLs and SPA navigation; lead form, related content and image galleries; blog index/filtering; direct blog article and related links; BG/RU/EN content; Header service navigation on non-`/services` routes.
- **Required Network QA:** confirm full service directory query is absent on unrelated routes; confirm service detail issues one detail query, not full list; confirm blog article does not request the entire blog index; inspect query payload sizes and responsive image currentSrc/transfer bytes.
- **Required measurement:** repeat Lighthouse mobile and desktop on matched URLs/network profiles; record FCP/LCP/TBT/CLS/Speed Index and transfer bytes. Do not infer an improvement before measurement.
- Production deployment is complete. Owner visual/functional QA and browser Network/Lighthouse measurements remain pending. Sanity documents/schema, D1, Resend and Cloudflare settings/secrets were not changed.

## Category-specific catalogue loading — PR #248 merged/deployed; browser QA pending (13.11.2026)

- PR #248 объединён в `main` squash commit `fe3e528320b88eebe3331e288bbf45591df64482`.
- Cloudflare Pages Production deployment `db437e51-7794-4bcd-93d0-e2ca004d59f7` — success на точном commit; URL `https://db437e51.florial.pages.dev`; aliases apex и www.
- CI на точном PR head `d70ec7936a8d58c8f16550688536bd0f918a4089`: Blog/Studio runs `43379996722` и `43380019954` — success; D1 validation `43379996726` — success.
- По коду plant categories загружают только dataset `plants`, equipment categories — только `production`; product detail routes по-прежнему загружают оба индекса. Независимое кэширование предотвращает повторную загрузку уже полученного каталога.
- **Остаётся проверить в браузере:** direct URL и SPA для `/category/maslini`, других plant categories и equipment category; отсутствие полного product-index запроса противоположного dataset; переходы plant ↔ equipment; product detail из обоих datasets; search, cart, BG/RU/EN; ошибки/пустые результаты.
- Не путать небольшие необходимые `production` запросы категорий/услуг/help content с полным каталогом оборудования.
- **Не подтверждено:** browser Network capture, фактический transfer saving, повторный Lighthouse и изменение LCP/critical request chain. Production deployment подтверждён, но не заменяет browser QA и performance measurement.
- Sanity documents/schema, D1, Resend, Cloudflare settings/secrets не затрагивались.


## Каталог растений — fallback image и responsive image sizing (PR #247 merged/deployed; QA open, 13.11.2026)

- PR #247 merged в `main`: commit `5801d390a468952563f8f339b233d15774ca74d9`.
- Cloudflare Pages Production deployment `579f4c88-fc98-4357-ab61-21c57f7fed23` — success на точном commit; URL `https://579f4c88.florial.pages.dev`; production aliases apex и www.
- CI на точном PR head `c94f0c5ba481a7d1a386b242629d6c376b82822c`: Blog and Studio `43376289807` — success; D1 validation `43376289788` — success.
- Кодовая реализация: category raw fallback `<img>` удалён из HTML внутри `#root`, og:image сохранён; desktop React hero responsive от 1024 px; catalog card sizes согласованы с grid, Sanity quality 65, desktop hero quality 70 / cap 408 px; eager только первые две карточки.
- **Остаётся:** проверить на реальном mobile Network отсутствие category fallback request; на desktop проверить responsive hero/currentSrc и качество; измерить фактический transfer size; повторить Lighthouse mobile/desktop. Визуальная browser QA после публикации не заявлена.
- Baseline владельца mobile 13.11.2026 07:35 GMT+2: Performance 84, FCP 0.9 s, LCP 4.5 s, TBT 0 ms, CLS 0.001, Speed Index 2.4 s. Post-deploy metrics отсутствуют; transfer savings и LCP improvement НЕ ПОДТВЕРЖДЕНЫ.
- Изменения не затрагивали Sanity, D1, Cloudflare settings/secrets, SEO metadata, Header/Footer или routing.



- На main report владельца от 13.11.2026 07:35 GMT+2: Performance 84, FCP 0.9 s, LCP 4.5 s, TBT 0 ms, CLS 0.001, Speed Index 2.4 s. Lighthouse показал категорийное изображение «Всички растения» 1021×979, 268 KB, и plant card images 480×640 при фактическом контейнере около 168×224.
- Кодовая причина найдена: functions/_middleware.ts documentBody() вставлял category doc.imageUrl как raw HTML <img src> до запуска React. CSS desktop-only hero в index.html не отменяет сетевой запрос уже присутствующего HTML image.
- PR branch fix/category-image-responsive-loading-2026-11-13 suppresses that category fallback <img> while preserving og:image, responsive desktop React hero, and all product metadata. It also aligns catalog sizes to grid geometry, sets per-image quality 65 for catalog cards / 70 for desktop hero, and limits eager loading to two first cards.
- Остаётся: CI on exact PR SHA; mobile raw HTML/Network verification that category fallback image is not requested; desktop verification that responsive category hero is requested and correctly sized; visual quality review; repeat Lighthouse mobile and desktop. Actual transfer savings and LCP change are NOT CONFIRMED.
- No Sanity, D1, Cloudflare settings/secrets, SEO metadata, image assets, Header/Footer or routing changes.

## Каталог растений — loading skeleton опубликован; визуальная QA и повторные метрики открыты (13.11.2026)

- PR #246 объединён в `main` (commit `3f2099e6ac2c11c2461c4c14618128c618a8d413`) и опубликован Cloudflare Pages Production deployment `6208bca0-23a6-48b0-a84b-b1861bac9523` на том же commit. Category-specific skeleton в `src/App.tsx` используется и для загрузки данных, и как React.Suspense fallback.
- Кодовый осмотр: `index.html` скрывает `.category-page-hero-image` на ширине менее 1024 px. Подкатегорийные thumbnails в `CategoryPage.tsx` отображаются 48×48 px на mobile / 56×56 px на desktop.
- Baseline владельца (mobile, 13.11.2026 06:52 GMT+2): Performance 61, LCP 4.507 s, CLS 0.693, TBT 10 ms.
- **Остаётся:** проверка прямого URL `/category/rastenia` и SPA navigation; visual QA на Android/mobile и desktop; повторный Lighthouse; layout-shift attribution. После skeleton отдельно оптимизировать plant catalogue GROQ projection/payload только после измерения Network waterfall.
- Не утверждать, что Footer был единственной причиной CLS или что skeleton улучшил метрики до фактического повторного замера. Sanity не менялся.

## JavaScript split — PR #244: функциональная browser QA закрыта владельцем (13.11.2026)

- PR #244 merged в `main`: `c97255f4fc843714f0a453727a77f22b75fdf0f7`.
- Cloudflare Pages Production deployment `cc421986-4aa0-49e3-85db-33d78d8546ce` — build/deploy success; deployment commit совпадает с merge commit.
- CI: Blog and Studio run `43359151357` — success; D1 validation run `43359151359` — success.
- Владелец вручную проверил переключение языков в обе стороны, категории, товары, корзину, поиск и переводы; сообщил, что всё работает корректно. Функциональная проверка владельца закрыта. Автоматизированный browser test или отдельный Network capture не заявляются.
- Initial JS entry: 398.12 kB raw / 108.66 kB gzip → 336.08 kB raw / 97.95 kB gzip. Это сравнение build artifacts, не измерение LCP.
- **Остаётся только performance measurement:** Network waterfall по маршрутам и языкам; повторный Lighthouse mobile/desktop; сравнение LCP/INP/CLS. Lighthouse unused-JS estimate «32 KiB» считать закрытым только при новом отчёте.
- Sanity, D1, Resend и Cloudflare settings/secrets не менялись.

## Категория хвойных — SEO-текст подготовлен, публикация ожидает владельца (13.11.2026)

- Sanity draft `drafts.plants-conifers` содержит новые локализованные BG/RU/EN статьи в `seoContent` (по 25 Portable Text блоков на язык).
- Backup до записи: `../backups/sanity/2026-11-13-plants-conifers-before-seo-content.json`.
- Read-back успешен; beta schema validator сообщил `valid`, но `complete=false` (custom validation не выполнялась).
- **Ожидает:** визуальная проверка всех трёх языков в Sanity Studio и отдельное разрешение владельца на публикацию. Не публиковать автоматически.

## Homepage hero — release deployed (12.11.2026, PR #242)

- PR #242 merged to `main`: `16bd410ad4b246f4d20594823ea5fe7be2f20bdd`.
- Production deployment `4f4dc307-3f6d-416b-b411-4bceccbc3661` is successful on that exact commit; deployment aliases include apex and www.
- Sanity photo document `ec5582be-f4bd-4e3c-9dd7-b5d8e4b31fd1` points to compressed image asset `image-460eba3d596671187e5a382f4449ed09fcf78bfc-1518x957-png` (1,015,107 bytes, 1518×957); homepage fallback URL is synchronized.
- CI passed on exact PR head `a7270d4b931009dba4fd27c35a99b5375dbcca3e`: Blog/Studio run `43271610071`, D1 run `43271609865`.
- **Still open:** visual owner QA, actual browser network candidate/transfer measurement and repeat mobile/desktop Lighthouse. Do not equate Sanity asset byte reduction with measured LCP improvement.

## Homepage hero — compressed Sanity photo asset (12.11.2026)

- Published photo record `ec5582be-f4bd-4e3c-9dd7-b5d8e4b31fd1` now references compressed asset `image-460eba3d596671187e5a382f4449ed09fcf78bfc-1518x957-png` (1518×957; 1,015,107 bytes).
- Homepage immediate fallback URL is synchronized with this asset on the PR branch; the first render and Sanity query resolve to the same URL.
- CI must be green on the updated PR head; after merge, verify Cloudflare Pages deployment and inspect mobile/desktop image selection, network transfer and Lighthouse LCP. No measured LCP gain is claimed yet.

## WWW → non-WWW redirect — practically verified by owner, 12.11.2026

- **Cloudflare rule repaired:** production Redirect Rule `WWW to non-WWW`, ruleset version 5, condition `(http.host eq "www.florial-bg.com")`, HTTP 301 to apex with original path and query string preserved. Cloudflare API write/read-back successful.
- **Cloudflare Request Tracer simulated:** www `/services` → 301; www homepage with query → 301; apex `/services` → 200.
- **Owner browser verification (12.11.2026):** owner tested real requests in a regular browser and confirmed that opening the `www.florial-bg.com` address automatically redirects to `florial-bg.com` without `www`. The practical www → non-www behavior is confirmed by the owner.
- **Still open — Google only:** Google Search Console URL Inspection for apex/www homepage and `/services`; Google-selected canonical and index consolidation remain NOT CONFIRMED. Do not report Google's canonical choice as confirmed until Search Console verifies it.
- Detailed evidence: `../audits/2026-11-12-www-canonical-redirect.md`.

8. **Мобильное изображение категории и зимний индикатор — визуальная Android QA закрыта 12.11.2026:** PR #222 объединён в main (`79e96ce419b4be6513a112deee7c48bb3b0564e5`), CI и Cloudflare Pages Production deployment прошли успешно; владелец подтвердил корректное отображение на физическом Android-устройстве. Индикатор вынесен в отдельную строку над фото в карточках растений и на странице товара; desktop-only category hero использует `<picture>` с media source от 1024 px и fallback `img` без `src/srcSet`. **Не подтверждено отдельно:** Android Network/DevTools capture отсутствует, поэтому отсутствие фактического HTTP-запроса не заявляется как независимо измеренное. Ранее зафиксированный CLS около 0.34385 не был атрибутирован конкретному DOM-узлу и не считается устранённым этим изменением; для его расследования потребуется отдельный замер. Не менять `src/App.tsx`, Header или Footer без отдельного согласования.
# Florial — открытые вопросы и проверки

**PR #240 — независимая загрузка Header / главной / каталога (12.11.2026):** Кодовый commit `8953f913be649f62af34d7123b15c6373c68171a`; последующие commits PR содержат документационные уточнения. CI для этого branch snapshot (workflow runs на документационном commit `e067660f1896fbce3cb575541434a362ba37c740`) прошёл: Blog and Studio validation run `43261832983` — success (lint, utility tests, website build, migration syntax/dry-run, Sanity Studio build); D1 validation run `43261833064` — success (lint, website build, Pages Functions syntax и обе migration validations). До merge обязательны браузерная регрессионная проверка прямых URL и SPA-навигации: главная; все шесть plant categories; equipment category; product detail; search; services list/detail; About; Blog/list/article; contacts; cart; BG/RU/EN; mobile/desktop. В Network нужно подтвердить, что на homepage не запрашивается полный product index, а на service/blog/about/contact/cart routes он не запускается; Header queries не блокируют page rendering. Проверить, что все категории растений остаются в Header menu, а homepage показывает только шесть утверждённых карточек. Lighthouse/Network waterfall и визуальная QA ещё не выполнены; performance gain НЕ ИЗМЕРЕН. PR: https://github.com/omaraandrey-dev/florial/pull/240.


14. **Изображения блога восстановлены и миниатюры/ALT улучшены 12.11.2026:** шесть legacy Wix images восстановлены в четырёх статьях; дополнительно три низкоразмерных изображения заменены оригиналами 925×855, 2048×2048 и 640×468; шесть BG ALT исправлены после визуальной проверки Wix originals. Backups перед записями: docs/backups/2026-11-12-blog-images-before-write.json, blog-small-images-before-write.json, blog-alt-before-write.json, blog-sketch-before-write.json. Read-back подтвердил публикацию и отсутствие drafts. **Остаётся:** live visual QA страниц через браузер владельца; 12 повторов cover asset в body не удалялись автоматически; принять решение о трёх нерелевантных к оливе изображениях в статье об оливе. CDN HTTP smoke через viewer недоступен. Код/schema не менялись; deployment не запускался. Детали: ../audits/2026-11-12-blog-seo-images.md.

15. **Повторы cover/body — редакционная проверка:** в выборке 22 blogPost обнаружено 12 image blocks, где asset ref полностью совпадает с cover статьи. Один и тот же cover 1000×638 также используется двумя статьями о ландшафтном проектировании. Ничего не удалять автоматически: повтор может быть намеренной иллюстрацией в контексте body. Требуется визуальная проверка владельцем и решение по каждой статье.


12. **Блог — этап 1 merged и опубликован 12.11.2026:** PR #232 объединён squash в `main`, commit `75fcc9226fc05be2bf56e669b1ddd5ee83094a20`. CI по точному PR head `de12df4f0d55dea6b57fa2ec91b80f32638d41eb`: Blog and Studio validation run `43198224064` — success (lint, utility tests, website build, migration syntax/dry-run, Sanity Studio build); D1 validation run `43198224015` — success. Cloudflare Pages Production deployment `fba87951-81aa-406b-a1a7-f8894bf47c7f`, точный commit `75fcc9226fc05be2bf56e669b1ddd5ee83094a20`, deploy stage `success`, aliases `florial-bg.com` и `www.florial-bg.com`. Изменения блога работают в Production. **Остаётся:** визуальная проверка владельцем BG/RU/EN и мобильных ширин 320–360 px; CI/deployment не заменяют визуальную QA. Sanity schema/documents и Production data не менялись. Подробности: `docs/releases/2026-11-12-blog-stage1.md`.


Повторно проверять в актуальном main и соответствующих live services. Не считать вопрос закрытым по старой записи.

1. **Hosted Sanity Studio:** hosted build/deployment после добавления plantCare-полей AI-рекомендации и причины пригодности к Черноморскому побережью отдельно не подтверждён в последней записи паспорта.
2. **Gemini live smoke test:** требуется повторить тест с авторизованной Manager-сессией и согласованной тестовой записью. Root cause предыдущей ошибки не подтверждён.
3. **Старый CI run для `6c65e01e7c8d99994669158fe0aeb120136bebfa`:** D1 validation run `43095667280` остаётся `queued` без jobs и conclusion; причина задержки НЕ ИЗВЕСТНА. Позднее, на более новом main commit `2dba36582e8e19079eef6ad80108d882bd85c218`, GitHub Actions run `43099079700` завершился `success`: lint, website build, Pages Functions syntax и обе D1 migration validations прошли. Поэтому текущий подтверждённый main CI имеет успешный запуск; старый queued run не отменяли и не перезапускали. Ссылка: https://github.com/omaraandrey-dev/florial/actions/runs/43099079700.
4. **D1 migration 0014:** исторические записи `docs/ROADMAP_SERVICES_AND_LEADS.md` содержат разные статусы. Перед следующей D1 работой сверить живой migration ledger read-only и обновить паспорт/roadmap. Не запускать миграцию в рамках сверки.
5. **Legacy Cloudflare variables — аудит выполнен 11.11.2026:** live Pages project `florial` подтверждает Production: `SUPABASE_URL` (plain text), `SUPABASE_SERVICE_ROLE_KEY` (secret), `VITE_SUPABASE_URL` (plain text), `VITE_SUPABASE_PUBLISHABLE_KEY` (plain text); Preview: `VITE_SUPABASE_URL` и `VITE_SUPABASE_PUBLISHABLE_KEY`. Значения переменных/секретов не читались и не выводились. Статически проверены 115 файлов `src/**`, `functions/**`, `.github/workflows/**` и ключевые конфигурации на merge commit `6c65e01e7c8d99994669158fe0aeb120136bebfa`: упоминаний Supabase в runtime source/functions/workflows нет; `package.json` не содержит Supabase SDK; `.env.example` содержит только Sanity-переменные; `src/lib/sanity.ts` читает только `VITE_SANITY_*`. По текущему коду эти шесть Cloudflare variables выглядят неиспользуемыми. **Не удалять без отдельного явного согласования владельца**, так как это изменение Production/Preview settings. Вопрос остаётся открытым только до разрешения и удаления.
6. **Старые Manager документы:** setup/mobile QA/часть architecture содержат прежние Supabase Auth/Storage/RLS шаги. Они помечаются как исторические; актуальные рабочие инструкции поддерживать в Manager architecture и Technical Passport.

7. **Cloudflare D1 audit 11.11.2026:** live read-only inspection of `florial-db` found 17 tables via `sqlite_master`, while Cloudflare database-list metadata reported `num_tables: 0`; discrepancy unresolved. Live migration ledger is continuous `0001`–`0014`, latest `0014_contract_withdrawals`. Core relationship checks returned zero orphans and no negative order amounts. Full SQLite integrity/foreign-key PRAGMAs were not reliably confirmed; do not claim full integrity passed. Details and row counts are in [Technical Passport](../TECHNICAL_PASSPORT.md) and [CURRENT_STATE](CURRENT_STATE.md). No D1 changes were made.

Закрывать вопрос только с доказательством: commit/file, CI run, deployment ID, live query или smoke test. Production writes, Sanity publish, email, D1 migration и secrets требуют отдельного согласования.

9. **Фильтр направлений на странице услуг — PR #225 объединён в main:** merge commit a8db72ffda86e8d678cfe233a92ae88b0f82a892. CI по точному PR head d51a04b53f2393b824a78b7affe2700ac75f7014 завершился успешно: D1 validation run 43165329360 и Blog/Studio validation run 43165329362; lint, tests, website build, Pages Functions syntax, D1 checks и Sanity Studio build прошли. Используются четыре опубликованные Sanity photo documents; Sanity documents/schema не изменялись. **Проверено:** Cloudflare Pages Production deployment для merge commit a8db72ffda86e8d678cfe233a92ae88b0f82a892 завершился success (deployment 6a9c87fd-a424-4ab8-8895-9c560a0e2336); следующий успешный deployment aa669cbe91d5d467e66e7ccbb02b25b7a06569b8 включает тот же код и aliases florial-bg.com / www.florial-bg.com. **Ожидает:** мобильный визуальный QA (320–360 px), читаемость подписей и соответствие фотографий специалистам. Последующие документационные commits вызвали дополнительные Production builds, которые на момент записи ещё выполнялись.

10. **Перенос коммерческих статей блога в услуги — завершён 12.11.2026.** PR #226 merged (`7acdc09e0ea01739bb69eca1ee4a2711a8fbe75f`), Cloudflare Pages Production deployment `f22c3b8f-6d75-4228-b764-5bf32bbce497` success. Восемь service pages опубликованы; 99 product.relatedContent ссылок переведены на service IDs; старые восемь blogPost документов сохранены с `isPublished=false`. Все восемь старых URL проверены через live redirect до service page (final HTTP 200, query `lang` сохранён). Проектная статья `landshaften-dizain-proekt-zasazhdenie` остаётся опубликованной в блоге и связана с существующей услугой. Backups и детальный протокол — `docs/migrations/2026-11-12-blog-posts-to-services.md`. **Остаточная QA:** ручной визуальный осмотр всех восьми услуг в hosted Studio на BG/RU/EN. Sitemap.xml также проверен: все восемь service URL включены, восемь старых blog URL исключены; ландшафтный case study остаётся.


11. **RSS-лента услуг — опубликована и проверена 12.11.2026.** PR #229 объединён в main, commit `d9f8ded8a10ba3f477026e2ba04affeb427e5480`. Cloudflare Pages Production deployment `c1e03dc4-3b28-4575-920e-dae1e152ef02` — success, все build/deploy stages завершены. CI: Blog/Studio run `43176887544`, D1 PR run `43176887495` и post-merge D1 run `43177889083` — success. Live feed `https://florial-bg.com/feeds/services-bg.xml`: HTTP 200, `application/rss+xml; charset=utf-8`, RSS 2.0 XML; live homepage HTML содержит autodiscovery link на этот URL. **Осталось:** выбрать релевантные RSS-агрегаторы/каталоги и отправить туда URL; регистрация ещё не выполнялась.


## 2026-11-12 — Reconfirmed legacy Cloudflare variables (read-only)

- The service-page audit rechecked the live Cloudflare Pages project `florial`; legacy Supabase-named variables remain configured in Preview/Production. No values were added to documentation, and no variables, secrets, bindings or settings were changed.
- This confirms the existing 11.11 entry above; the previously recorded static audit found no Supabase references in 115 runtime/source/workflow files and no Supabase SDK in `package.json`. Removal still requires separate owner approval.
- Status: unchanged; this is not part of the service-content release.

13. **Блог — этап 2, featured landing card:** PR #233 объединён squash в `main`, commit `5e0c895c38a0903616d25f4dccde6cd596d20aed`. CI по точному PR head `28854bc4c92fb9faa0fa59a6322d6e0eb5cd3ad2`: Blog and Studio run `43201350601` — success (включая Studio build); D1 validation run `43201349713` — success. Cloudflare Pages Production deployment `392ec129-5551-48b2-a63f-cab5ead23c8c` для точного commit прошёл build и находится на стадии deploy; все стадии завершились `success`; aliases `https://florial-bg.com` и `https://www.florial-bg.com`. **Остаётся:** визуальная QA BG/RU/EN и мобильных 320–360 px. Pagination сознательно не добавлялась при текущих 14 опубликованных публикациях. Подробности: `docs/releases/2026-11-12-blog-stage2.md`.

14. **SEO-метаданные блога опубликованы 12.11.2026; image QA остаётся открытой:** в Sanity Production опубликованы 14 `blogPost`, 42 языковые версии BG/RU/EN и 126 значений `shortDescription`, `seoTitle`, `seoDescription`. Полный backup 14 исходных документов сохранён в `docs/backups/2026-11-12-blog-seo-before-draft-write.json`; post-publish read-back подтвердил 14/14 и 0 drafts. Уточнены болгарские формулировки четырёх статей. Slug отдельно проверены на уникальность среди всех 22 документов. **Остаётся:** визуально проверить 6 Wix href в четырёх BG статьях, 4 ALT-кандидата, повторы cover и 3 малых изображения; оригиналы не заменять без проверки. PR #235 остаётся draft до закрытия image follow-up: https://github.com/omaraandrey-dev/florial/pull/235. Детали: `docs/audits/2026-11-12-blog-seo-images.md`.

## Performance — responsive Header logo (12.11.2026)

- Ветка `perf/header-logo-responsive-srcset`, commit `7923e1534f028e57911109fd30a878dd3f400389`: применён существующий Sanity image helper к логотипу в Header. Визуальные CSS-параметры десктопа и мобильного Header не менялись.
- PR #239 закрыт; responsive logo implementation присутствует в `main` commit `c80d3f491d399c4df3ddc2662e3157fce7b953f4`. CI website lint/tests/build прошёл в рамках PR #240 (run `43260945549`). **Остаётся:** проверить выбранный srcset candidate и transfer size на DPR1/DPR2, визуальную регрессию desktop/tablet/mobile и повторный Lighthouse mobile/desktop. PSI исходный отчёт владельца: mobile Performance 96, LCP 2.7 s; logo image 887×444 / 331.2 KiB, Lighthouse estimate 267.1 KiB potential savings. Production для этого PR не менялся.


15. **SEO sitemap и структурированные данные — PR #257 объединён и опубликован 13.11.2026:** merge commit `1e5344a6faa8053f2020f1f3fbdb03f1200a149e`; Cloudflare Pages Production deployment `e3408322-80c3-4663-9dcd-48d8feec3e42` success на точном commit. Exact-head CI: Blog/Studio runs `43433210752`, `43433196806`; D1 run `43433196666` — success. Live Production smoke Kumquat, JS disabled: HTTP 200, index/follow, self-canonical, Product Offer `25 EUR` вместо прежних `3 000 EUR`. Полный аудит: `docs/audits/2026-11-13-sitemap-and-structured-data-audit.md`. Остаются отдельные решения владельца: (a) 193 irrigation products без отдельного H1; (b) 143 из них без полной пары RU/EN metaTitle/metaDescription; (c) у `irritec-iq20120f0n20b` отсутствуют BG metaTitle/metaDescription; (d) три услуги без `hero.title`; (e) четыре пустые категории в sitemap; (f) root `priceEUR` у 19 растений отличается от первого sale variant — runtime уже использует saleVariants, Sanity не менялся. Массовые Sanity writes требуют backup и отдельного согласования. Browser Rendering rate limit не позволил выполнить полный повторный Production smoke; Google Search Console recrawl/indexing не подтверждены.

**Уточнение 13.11.2026:** выполнено точное сравнение slug URL Sanity с Production sitemap, не только сравнение counts. Для products 325/325, categories 71/71, services 21/21, blog posts 14/14: missing=0, extra=0, duplicate paths=0. URL-карта по опубликованным документам полная; открытые вопросы относятся к SEO-полям, пустым категориям и нормализации цен, а не к пропущенным URL.

**Preview smoke update 13.11.2026:** кроме двух вариантов Product и обеих категорий, без JavaScript проверены service detail (`Service`) и blog article (`BlogPosting`); HTTP 200, ожидаемые JSON-LD типы найдены.
**Terms locale correction 13.11.2026:** sitemap correctly contains only BG `/terms`, because RU/EN pages show the Bulgarian draft with an untranslated-content notice. PR now applies server/client noindex to RU/EN variants; BG remains indexable.

**H1/content completeness 13.11.2026:** 193/275 irrigation products lack separate H1 in BG/RU/EN (fallback name is rendered); 143 of those also miss at least one RU/EN metaTitle/metaDescription; one product `irritec-iq20120f0n20b` misses BG metaTitle/metaDescription. All 50 plants and all 71 categories have H1/meta complete in BG/RU/EN. Three services miss `hero.title` in all three locales: `avtomatizirano-kapkovo-napoyavane`, `dostavka-poliv`, `montaj-avtomatichni-polivni-sistemi-nesebar`. No Sanity writes; plan separate content pass after backup and approval.


## 2026-11-16 — Rain Bird 3500 evaluator follow-up

1. **Arc-specific performance:** D42378 precipitation is based on half-circle operation. No validated manufacturer conversion for other arcs is confirmed. Keep the evaluator restricted to 180° until Rain Bird supplies written clarification or a separately approved, field-validated method.
2. **Radius reduction:** D42378 contains conflicting 25% and 35% statements. Do not apply either automatically until Rain Bird clarifies the applicable value and conditions.
3. **3504 package/nozzle tree:** confirm the exact factory nozzle-tree contents for Florial 3504-PC (Y34001) and 3504-PC-SAM (Y34500) before any BOM or catalogue mapping. Existing Sanity publication/stock has not been rechecked in this engine increment.
4. **Layout generation:** PR #339 evaluates explicitly supplied rotor positions; it does not generate or optimize positions. Next work must establish a rotor-specific candidate-generation strategy with engineer-reviewed rectangle and L-shape reference cases, overspray limits and spacing rules.
5. **Hydraulics and uniformity:** nozzle pressure must be distinguished from source pressure; zone flow, pipe losses, DU/SC and precipitation matching remain unimplemented/not evaluated. Do not mark design_ready.
6. **Customer release:** PR #339 is not merged or deployed. No customer-facing 3500 recommendations are enabled.


## 2026-11-16 — Rain Bird 3500 candidate generator follow-up

- PR #339 (isolated 180° evaluator) and PR #340 (heuristic candidate generator) are merged. Exact-head CI passed for both PRs; #340 runs: Blog/Studio `43847530293`, D1 `43847530296`. Main CI for merge SHA `9da44168e6c7d877ac914a8dc7dde13fd2129b95` was pending at documentation time.
- **Reference-case validation remains open:** create engineer-reviewed rectangle and L-shape baselines, including mirrored/rotated L-shapes and representative width/radius cases. Compare generated candidate layouts against manual placements.
- **Search convergence remains open:** compare 0.5 m, 0.25 m and 0.125 m target sampling and evaluate sensitivity to half-radius candidate-position grid and 45° direction increments. These increments are heuristic discretization, not manufacturer rules.
- **Selection quality remains open:** current greedy pass maximizes newly covered samples; head-to-head and overspray are evaluated afterward, not included in candidate scoring. Improve selection only against approved engineering reference cases.
- **Geometry limitations:** exclusions and multiple regions are not supported. Do not silently ignore obstacles, paths or planting beds.
- **Hydraulics/uniformity:** dynamic pressure at the nozzle, zone flow, pipe losses, elevation, DU/SC and precipitation matching remain unimplemented. Source pressure must not be substituted for nozzle pressure.
- **Manufacturer/product gates:** obtain Rain Bird clarification for arc-specific performance and conflicting 25%/35% radius reduction; verify 3504-PC and 3504-PC-SAM package/nozzle-tree contents before catalogue/BOM mapping.
- The 3500 modules remain disconnected from customer-facing assistant, catalogue, cart and Production workflow. No 5000 MPR engine is in scope.
