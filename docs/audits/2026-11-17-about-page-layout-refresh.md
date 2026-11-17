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

## Not yet verified

- Cloudflare Pages Preview deployment and browser rendering were not confirmed in this audit.
- Production deployment and live production visual QA were not performed.
- Google recrawl/indexing was not checked.

## Protected scope

No changes were made to Header, navigation, Footer, routing, Sanity content/schema, Cloudflare settings/secrets, D1, Manager, Resend or other production services.

## Documentation integration note

The shared `CHANGELOG.md` and `docs/TECHNICAL_PASSPORT.md` updates are intentionally deferred to the next single documentation-integration pass. At the time of this PR, other open PRs (#334, #281 and #274) also modify those shared files. This avoids parallel edits and prevents overwriting or duplicating their records, in accordance with the repository work protocol.
