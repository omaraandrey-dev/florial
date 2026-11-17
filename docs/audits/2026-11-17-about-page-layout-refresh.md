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
