# SSR Phase 7 Production smoke and Phase 8 Contacts discovery

**Date:** 2026-11-25  
**Production code commit:** `2b008089e1134dc72bf3b3f592b5102fdd52b6b9`  
**Development branch at discovery:** `develop` — `5589fbc3395bd019683d6989320793ecf31c0e36`  
**Production domain:** https://florial-bg.com  
**Mode:** read-only live HTTP and published Sanity queries; no source or service mutations.

## 1. Plant SSR — Production verification completed

The plant SSR implementation was deployed to Production by PR #545. This separate Production-specific raw HTTP check closes the remaining verification item from the plant SSR implementation audit.

Published Sanity inventory queried at execution time:
- 60 active published plant products in dataset `plants`.
- 17 published plant categories in dataset `plants`.

Raw HTTP results against `https://florial-bg.com`, without executing client JavaScript:

| Route group | BG | RU | EN | Total |
|---|---:|---:|---:|---:|
| Plant product details | 60 | 60 | 60 | 180 |
| Plant categories | 17 | 17 | 17 | 51 |
| **Total** | **77** | **77** | **77** | **231** |

All 231 routes passed the Production smoke:
- HTTP 200 and HTML content type.
- Correct `html lang` for each locale.
- Plant product SSR marker and localized H1.
- Product and BreadcrumbList JSON-LD markers on plant details.
- Self-canonical URL for each localized route.
- Plant category SSR marker, localized H1 and CollectionPage JSON-LD marker.
- A non-existent plant product returned HTTP 404 and `noindex`.

This was a live read-only HTTP execution, not a GitHub Actions run; no GitHub workflow run ID is associated with it. The smoke did not re-run the deeper variant-price, image, and care-content assertions already covered by the exact Preview workflow. Those Preview checks remain separately recorded in [plant catalogue SSR audit](2026-11-25-plant-catalog-ssr-v1.md).

**Result: Production raw HTTP smoke PASS — 231/231 routes.** Phase 7's remaining Production verification is closed.

## 2. Contacts page — current source and Production behavior

### Source files checked

- `src/pages/ContactsPage.tsx` — current main blob `3610b2c9eb04faefe250db726398f164f96d52c6`.
- `functions/_middleware.ts` — current main blob `abdfc7c045d011160b5a86c0e909d53ea0d396e1`.
- Current `develop` is 49 commits ahead of `main`, 0 behind; the ContactsPage component is byte-identical to main at discovery.

### Current Production initial HTML

Read-only requests to:
- `https://florial-bg.com/contacts`
- `https://florial-bg.com/contacts?lang=ru`
- `https://florial-bg.com/contacts?lang=en`

All three returned HTTP 200 HTML. Canonical and four hreflang links are present for each locale. The first-response `<main>` contains only a short localized H1 and introductory paragraph; it does **not** contain the garden-centre cards, addresses, maps, photographs, opening hours, or telephone links. These are currently supplied by the client-side `ContactsPage` after JavaScript starts.

Existing initial-response structured data contains four entities:
- `OnlineStore` organization.
- `WebSite`.
- Nessebar `GardenStore`.
- Ravda `GardenStore`.

The current middleware emits these entities on the contacts route. This audit does not propose changing their NAP fields or business facts.

### Current ContactsPage content in source

- Two location cards: Nessebar and Ravda.
- Nessebar display address: ul. Khan Krum, 8230 Nessebar, next to Janet store.
- Ravda display address: Ravda, Bulgaria (no street address in the visible card).
- Existing Google Maps links:
  - Nessebar: https://maps.app.goo.gl/pK8qGHh9b1xoCc4P9
  - Ravda: https://maps.app.goo.gl/3fiLaRgwSLDTH77U6
- Two published Sanity `photo` documents are present in dataset `production`:
  - `Florial-nesebr`, document `d13f25ae-fb64-493d-850b-02fffc7f04a0`.
  - `Florial-ravda`, document `162d050c-e444-4f95-83be-48bdd4236676`.
  Both have an image asset URL. The existing component retrieves these images by slug at runtime.
- Visible shared opening-hours block in `ContactsPage.tsx`: Monday–Saturday 09:00–18:00; Sunday is not listed; Resurrection/Easter is marked closed.
- Visible telephone block:
  - +359 876 777 902.
  - +359 885 834 860, labelled ENG / UA / RU.
  - +38 067 480 74 86 is shown only on RU/EN pages.
- The component tracks clicks on the first two phone links; this behavior must be preserved if the markup is moved into SSR.

### Existing data conflicts — do not silently normalize

The earlier Local SEO read-only audit records owner confirmation that Ravda is an active customer-facing garden centre and its hours are daily 09:00–17:00. This conflicts with the shared ContactsPage block (Monday–Saturday 09:00–18:00, Sunday omitted).

The current source's Nessebar schedule also conflicts with its existing GardenStore JSON-LD:
- Visible ContactsPage: Monday–Saturday 09:00–18:00.
- JSON-LD: Monday–Friday 09:00–17:00.
- The actual current Nessebar hours, including Sunday/seasonality, remain unconfirmed in the referenced Local SEO audit.

There is also a known NAP mismatch that must not be changed as part of an SSR-only task:
- Visible main Bulgarian number: +359 876 777 902.
- Nessebar GardenStore JSON-LD telephone: +359 885 834 860.
- Ravda GardenStore JSON-LD telephone: +359 877 055 605; this number is not shown beside the Ravda card in the current component.

The current page and JSON-LD values are documented as observed, not endorsed as correct. Do not alter phones, opening hours, addresses, maps, or existing structured-data values without a precise owner-approved content decision.

## 3. Implementation boundary for Phase 8

Safe SSR scope after business facts are resolved:
- Render both existing location cards in the initial HTML.
- Render existing localized address labels and existing map links without changing their destinations.
- Query the two existing published `photo` documents read-only and render responsive image markup with meaningful localized alt text derived from the location name if no dedicated localized alt value is available.
- Render the existing telephone links and locale-specific WhatsApp number, preserving click tracking after client handoff.
- Render localized headings and page content in BG/RU/EN.
- Preserve canonical/hreflang and the four existing structured-data entities; do not silently edit their NAP/hours.
- Add tests for all three locales, initial HTML, links, images, phone targets, JSON-LD parity, missing-image fallback and graceful Sanity query failure.
- Do not modify Header, menu, Footer, global bootstrap, routing, Sanity documents/schema, D1 or Cloudflare settings.

**Owner confirmation received 2026-11-25:** both customer-facing garden centres are open daily, 09:00–17:00. The owner clarified Nessebar hours as 09:00–17:00 every day; Ravda's earlier confirmation is the same. This confirmation authorizes the schedule to be shown consistently in the contacts page and the two GardenStore opening-hours properties. Phone assignments and addresses remain unchanged.

## 4. Safety and completion

- No Sanity writes or schema changes.
- No Cloudflare configuration, secrets, DNS, Pages settings or Production changes.
- No D1 or Resend changes.
- No edits to PR #409 or files in its diff.
- No changes to `CHANGELOG.md`, `docs/TECHNICAL_PASSPORT.md`, `docs/AI/CURRENT_STATE.md`, or `docs/AI/OPEN_QUESTIONS.md`.
- This audit is a new, unique SSR document and does not overlap the protected PR #409 file set.


## 5. Phase 8 implementation progress — code on develop

After the owner confirmed daily opening hours of 09:00–17:00 for Nessebar (with Ravda already confirmed at the same schedule), implementation was started on the existing `develop` branch.

Changes made:
- Added `functions/_lib/contactsHtml.mjs` and `contactsHtml.d.mts`: localized BG/RU/EN initial HTML for the two garden-centre cards, existing map links, published location photos, opening hours and current phone links.
- Updated `functions/_middleware.ts`: contacts route now queries only the two existing published photo documents in Sanity `production` through the existing bounded/cache-aware Sanity query helper; renders the complete contacts body in the first response; keeps a no-image fallback and `no-store` behavior if Sanity query fails.
- Updated `src/pages/ContactsPage.tsx`: client view now also shows all seven days, 09:00–17:00, matching SSR; the previous Easter-closed row and 09:00–18:00 schedule were removed from this page.
- Updated the two existing GardenStore JSON-LD entities in middleware to show Monday–Sunday, 09:00–17:00. Existing phone/address values were deliberately not changed because assignment/visibility mismatches remain unresolved.
- Added `tests/contacts-ssr.test.mjs` for localized rendering, both map links, photo handling, safe image URL filtering, unchanged phone assignments, middleware wiring and client-hours parity.

Safety:
- Sanity was queried read-only; no documents, schemas or assets were written.
- No Cloudflare settings, secrets, DNS, D1, Resend, Header, Footer, menu or global bootstrap changes.
- No change to phone assignments or either location's existing address fields.
- This implementation is not yet Production-released. CI, Preview raw HTTP and desktop/mobile browser verification are complete; owner acceptance and merge remain pending.



## 6. Verification results — PR #546

**Exact code head:** `43eaf03779392edfaca7df2a69e4653f3b32a4a8`  
**Pull request:** [#546 — SSR contacts page in BG/RU/EN with confirmed opening hours](https://github.com/omaraandrey-dev/florial/pull/546)  
**Preview deployment:** `95e04b33-8753-4a5d-8989-2f7fb83a90dd`  
**Preview URL:** https://95e04b33.florial.pages.dev/contacts

### Cloudflare Pages Preview

The exact Preview deployment was built and deployed successfully from the exact code head above. Queued, initialize, clone, build and deploy stages all report success.

### Exact-SHA CI

All checks on PR head `43eaf03779392edfaca7df2a69e4653f3b32a4a8` completed successfully.

- Blog and Studio validation: run `45586637851` — type-check, lint, **548/548 tests**, website build, Studio type-check and Studio build all passed.
- D1 migration validation: run `45586637845` — passed; read-only migration validation/dry-run only, no migration applied.
- Equipment product SSR validation: run `45586637808` — passed.
- Equipment category SSR: run `45586637718` — passed.
- Plant catalogue SSR: run `45586637884` — passed.
- Services directory SSR: run `45586637936` — passed.
- Service detail SSR: run `45586638044` — passed.
- Blog index SSR: run `45586637735` — passed.
- Blog article SSR: run `45586637772` — passed.
- Equipment SSR Preview smoke: run `45586637847` — passed.
- Cloudflare Pages check: passed.

All 12 reported commit checks concluded successfully.

### Contacts raw HTTP first-response smoke

Read-only requests against the exact Preview URL, without relying on client-rendered DOM, passed for BG/RU/EN:

- HTTP 200 and HTML response for all three locales.
- Correct `html lang`, localized canonical, and contacts SSR marker.
- Both location cards, both existing Google Maps URLs, and exactly two location images from the published Sanity assets.
- Seven daily opening-hour rows, each 09:00–17:00.
- Both GardenStore JSON-LD entities present, each with Monday–Sunday, 09:00–17:00.
- Existing telephone links preserved.
- Initial HTML size: BG 9,506 bytes; RU 9,634 bytes; EN 9,660 bytes.

### Browser QA

The fully rendered Preview was inspected in a remote browser:
- Desktop: both cards, images, addresses, maps, hours and phone block visible; no duplicate content or broken layout observed.
- Mobile 390 px viewport: cards stack vertically; both images/map links remain visible; seven hours rows are readable; phone links are visible and accessible.

This is browser QA of Preview, not an owner acceptance.

### Release boundary

- PR #546 remains open and mergeable; no merge performed.
- No Production deployment was triggered by this work.
- No Sanity writes/schema changes, D1 changes/migrations, Cloudflare configuration/secrets/DNS changes, Resend changes, Header/Footer/menu/global bootstrap changes.
- PR #409 remains open and untouched.
- Owner acceptance of the Preview and explicit merge approval remain the only release gate for this phase.


## 7. Follow-up HTML correctness fix — 2026-11-25

During release-readiness review after the initial PR #546 verification, a malformed heading close was found in `functions/_lib/contactsHtml.mjs`: each location heading opened with `<h3>` but closed with `</h2>`.

Correction on the existing `develop` branch:
- Renderer fix commit: `c7533b1017e4eec224dd77af4cb2c450ec10e20c`.
- Regression-test commit: `e2286b0a144df654273b5b3e64fab14359c14ed8`.
- Added assertions for both exact location-card heading elements and a guard against an `<h3>` closed by `</h2>`.

Status:
- **Verified in GitHub source:** corrected renderer and regression assertions are present on `develop`.
- **Not yet verified:** CI/test execution and a fresh Preview deployment for the follow-up commits. The earlier 548/548 result belongs to the original PR head `43eaf03779392edfaca7df2a69e4653f3b32a4a8` and must not be attributed to the follow-up commits.
- Owner visual acceptance and merge remain pending. Do not release until the new exact-SHA checks and updated Preview are verified and accepted.


## 8. Owner acceptance, merge and Production release — 2026-11-25

**Owner acceptance:** the owner visually checked the exact Preview contacts page and confirmed that it works. This was followed by explicit approval to merge PR #546.

**Final PR head:** `1319e75169fd4639b102ff6f3b4181891edcdef5`  
**Pull request:** [#546 — SSR contacts page in BG/RU/EN with confirmed opening hours](https://github.com/omaraandrey-dev/florial/pull/546)  
**Merge method:** squash  
**Merge commit / Production main HEAD:** `1b18d7ae7db06f8d656d539b28037889f99d8d94`

### Exact final-head CI

All 10 workflow runs associated with the final PR head completed with conclusion `success`. Blog and Studio validation reported 548/548 tests passed, plus application and Pages Functions type-check, lint, website build, Studio type-check and Studio build. D1 migration validation passed in read-only/dry-run mode; no migration was applied. The contacts-specific HTML heading regression assertion was included in this exact final head.

### Cloudflare Pages Production deployment

- Deployment ID: `b91055ec-3e33-4a7e-aa3c-8024c02b30fc`.
- Environment: `production`.
- Source branch: `main`.
- Exact source commit: `1b18d7ae7db06f8d656d539b28037889f99d8d94`.
- Build and deploy stages: `success`; deployment completed at `2026-11-25T10:14:33Z`.
- Deployment URL: https://b91055ec.florial.pages.dev.
- Production aliases reported by Cloudflare: https://florial-bg.com and https://www.florial-bg.com.

**Verification boundary:** the exact Production deployment and successful build/deploy stages are confirmed through the live Cloudflare Pages deployment record. A separate post-deployment raw HTTP smoke of `/contacts` for BG/RU/EN has **not** been completed in this session. The owner accepted the Preview visually; this is not represented as Production browser acceptance. Production raw HTTP verification remains open and should be performed before declaring the contacts route independently smoke-tested in Production.

### Branch synchronization

- `develop` was synchronized with the merged Production `main` by a non-force merge commit: `30499dabd413590ceb3e975f1be760a37a6ea32a`.
- The merge commit uses the same Git tree as both the final PR head and the Production merge commit; no source files were changed during synchronization.
- PR #409 was not modified. No Sanity writes/schema changes, D1 changes/migrations, Cloudflare settings/secrets/DNS changes, Resend changes, or Header/menu/Footer/global bootstrap changes were made.

**Next SSR phase:** Phase 9 — read-only discovery and then localized SSR for `/about`, without inventing company history, experience, qualifications, certificates or project claims.


## 9. Post-deployment Production raw HTML smoke — PASS

**Live check date:** 2026-11-25  
**Production merge commit:** `1b18d7ae7db06f8d656d539b28037889f99d8d94`  
**Cloudflare deployment:** `b91055ec-3e33-4a7e-aa3c-8024c02b30fc`  
**Source:** fresh read-only fetch of the raw Production HTML for each URL (`maxAge=0`); no client-side JavaScript was relied upon.

| Locale | URL | HTTP | `html lang` | Canonical | Result |
|---|---|---:|---|---|---|
| BG | `/contacts` | 200 | `bg` | `https://florial-bg.com/contacts` | PASS |
| RU | `/contacts?lang=ru` | 200 | `ru` | `https://florial-bg.com/contacts?lang=ru` | PASS |
| EN | `/contacts?lang=en` | 200 | `en` | `https://florial-bg.com/contacts?lang=en` | PASS |

For all three first-response HTML documents, the following assertions passed:
- Both localized garden-centre names and location cards are present.
- Both existing Google Maps destinations are present.
- Both location photographs are present with localized alt text.
- Seven opening-hour rows are present, including Sunday, each showing 09:00–17:00.
- Both GardenStore JSON-LD entities are present.
- Both location headings are valid H3 elements; no malformed H3/H2 closing pair was found.
- The route retains `robots=index, follow` and the correct locale-specific canonical.

**Result: Production raw HTML smoke PASS — 3/3 locale routes.** This closes the post-deployment verification item recorded in section 8. The check is a live raw-HTML fetch, not a GitHub Actions run or a new visual browser QA session.
