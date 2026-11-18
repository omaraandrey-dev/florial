# About page layout refresh — 2026-11-17

## Scope and implementation

- Repository: `omaraandrey-dev/florial`
- Base: `main` at `a13efc4930414a1860f69a560deb2b95b77dde76`
- Implementation branch: `feat/about-page-refresh-2026-11-17`
- Runtime file: `src/pages/AboutPage.tsx`
- PR: #380
- Final implementation SHA at audit time: `fb763ca662496d08e5ab005a5d0094d7833ed5dd`

The About page retains its existing H1, subtitle and introductory text. The localized eyebrow now names Florial's service area in Bulgaria: Nessebar, Ravda and Sunny Beach.

The former long sequence of detailed service descriptions was replaced by two compact catalogue cards, in the requested order:
1. Plant sales, linked to `/category/rastenia`.
2. Professional automatic irrigation equipment, linked to `/category/vsichko-za-polivane`.

Both cards use the existing Sanity category images and render in two columns on mobile and desktop.

A four-card team section was added. It uses the existing Sanity `photo` documents and links each role to its service direction:
- `landshaften-arhitekt` → `/services/category/landshaften-arhitekt`
- `gardinar` → `/services/category/gardinar`
- `inzhener-polivni-sistemi` → `/services/category/polivni-sistemi`
- `specialist-trevni-ploshti` → `/services/category/trevni-ploshti`

The team grid is two columns on narrow screens and four columns on desktop.

A garden-centre section was added for Nessebar and Ravda. It uses the existing centre photographs, the addresses already shown on the Contacts page and the existing Google Maps links. The existing process and service-area/CTA sections remain below these new blocks.

## Sanity read-only verification

Project `bxvcy0qs`, dataset `production`, perspective `published`.

A read-only GROQ query returned all six expected photo documents:
- Four team-role photographs.
- `Florial-nesebr` and `Florial-ravda` garden-centre photographs.

All six records have an image asset and localized BG/RU/EN ALT text. No Sanity documents, assets or schemas were written or modified.

## CI verification

The final runtime SHA `fb763ca662496d08e5ab005a5d0094d7833ed5dd` passed:
- GitHub Actions Blog and Studio validation: run `44110471744` — success.
- GitHub Actions Florial D1 migration validation: run `44110471767` — success.

For the Blog and Studio workflow, application/Pages Functions type-check, website lint, website utility tests, website build, migration syntax/dry-run, Studio type-check and Studio build all completed successfully. The D1 validation workflow passed; no D1 schema or data was changed.

## Preview and browser verification

- Cloudflare Pages Preview deployment `3fcb2722-3a09-4ab3-ac98-1ca16bfab6be` completed successfully for the final PR documentation commit `07ebfd47fdef400ca5dcb3667ea620e097b18c82`; preview URL: `https://3fcb2722.florial.pages.dev`.
- Cloudflare Browser Rendering on the BG preview at 1440×1100 confirmed the existing H1, new offerings section, all four team cards/role links, both garden-centre cards and map links, plus the retained process and service-area/CTA sections. The rendered page contained nine image elements.
- Mobile Browser Rendering at 390×844 confirmed `scrollWidth=390`, `clientWidth=390` and `bodyScrollWidth=390`; no horizontal overflow was detected. The two-column offering grid, team section and garden-centre section were present in the rendered DOM/accessibility tree.
- RU Preview Browser Rendering at 1440×900 confirmed the localized H1, offerings, team, both garden-centre cards, all four role links and nine image elements.
- EN Preview Browser Rendering was attempted but rate-limited by Cloudflare; EN remains unverified in browser rendering. The localized strings are present in the code but are not claimed as visually QA-checked.
- Production deployment, live production visual QA and Google recrawl/indexing were not performed.

## Protected scope

No changes were made to Header, navigation, Footer, routing, Sanity content/schema, Cloudflare settings/secrets, D1, Manager, Resend or other production services.

## Documentation integration note

The shared `CHANGELOG.md` and `docs/TECHNICAL_PASSPORT.md` updates are intentionally deferred to the next single documentation-integration pass. At the time of this PR, other open PRs (#334, #281 and #274) also modify those shared files. This avoids parallel edits and prevents overwriting or duplicating their records, in accordance with the repository work protocol.


## Owner review follow-up — vertical offerings layout (2026-11-17)

- Owner reviewed the About page Preview and requested that the “Какво предлагаме” / “What we offer” / “Что мы предлагаем” cards be stacked vertically rather than shown in two columns.
- Updated only the offerings grid in `src/pages/AboutPage.tsx` from a two-column grid to a single-column sequence. Plant sales remains first; professional automatic irrigation equipment remains second. Team and garden-centre grids are unchanged.
- Runtime commit: `a1f7220f9055beef9b4b10cc468b3a86beea6f56`.
- The exact source now contains `grid grid-cols-1 gap-4` for the offerings section. GitHub workflow lookup for this commit returned no PR-triggered runs; CI status for this follow-up is therefore **not confirmed**. No new Preview deployment or browser verification of this correction is confirmed yet.
- At the time of this follow-up entry, Production and `main` had not yet changed; the subsequent merge and Production release are recorded below.


## Merge and Production release — 2026-11-17

- Owner explicitly approved merge after reviewing the page and requesting the vertical offerings layout.
- PR #380 was squash-merged successfully. Merge commit and resulting `main` HEAD: `3b7177d88423fccdc562383bba25774d13932223`.
- Post-merge source verification on `main` confirmed the offerings section uses `grid grid-cols-1 gap-4`; plant sales remains first and automatic irrigation equipment second.
- PR-triggered CI for final pre-merge head `ad0dfb00efdfb87ead840184fb33cd2338548332` completed successfully: Blog and Studio validation run `44114187471`; Florial D1 migration validation run `44114153524`. The earlier Blog and Studio run `44114153451` also succeeded. Type-checks, lint, tests, website build, Studio type-check/build and D1 validation jobs all reported success.
- Cloudflare Pages Production deployment `40f28a5c-3635-4a90-b390-f26da2e0b434` completed with stage `success` for exact commit `3b7177d88423fccdc562383bba25774d13932223`. Production domains configured on the project: `florial-bg.com` and `www.florial-bg.com`.
- A post-deployment Browser Rendering request was rate-limited by Cloudflare (HTTP 429); no new post-merge visual/browser QA is claimed. The previously recorded Preview QA remains evidence for the original layout, not for a fresh Production browser session.
- Shared `CHANGELOG.md`, `docs/TECHNICAL_PASSPORT.md` and `docs/AI/OPEN_QUESTIONS.md` were not modified in this release because open PRs #334, #281 and #274 still edit these shared files. Integrate this release record into those documents in a single conflict-aware documentation pass after those PRs are resolved.
