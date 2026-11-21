# Company and bank details on the About page — 2026-11-21

## Scope

Add a compact public company-details section to the existing About page, directly after the garden-centre cards and before the existing “From idea to garden care” process section.

## Owner-provided business details

- Legal name: „Флориал“ ООД / FLORIAL OOD / FLORIAL LTD.
- UIC: 206978288.
- VAT number: BG206978288.
- Company manager (МОЛ): Десислав Бараков.
- Registered address: гр. Несебър, ул. „Черно море“ №28, България.
- Garden-centre address: „Флориал“, ул. „Хан Крум“, 8230 Несебър, България (до магазин Janet).
- Bank: Банка ДСК (DSK Bank).
- IBAN: BG88STSA93000029605234.
- BIC/SWIFT: STSABGSF.
- Public contact phone: +359 876 777 902.
- Public contact email: barakov1971@abv.bg.

These details were supplied and confirmed by the owner in the conversation on 2026-11-21. The registered address and garden-centre address are shown separately.

## Implementation

- Runtime file: `src/pages/AboutPage.tsx`.
- Added the company/legal registration details, bank details, telephone, email and separate garden-centre address.
- Added Bulgarian, Russian and English labels and localized address text.
- Added `tel:` and `mailto:` links.
- Added an IBAN copy action using the browser Clipboard API, with localized success text.
- Existing About page sections, global navigation, Header, Footer, Sanity content/schema and backend services are unchanged.

## Verification status

- Static regression test: `tests/about-company-details.test.mjs`.
- Base main SHA: `5fdbd21a056ee4ea3c8973c7dafda0e0564c885b`.
- Implementation commits: `bed3999bf291cd094207127276ea3768d61d0bfb`, `f1906a49c27ad8519d7488b22f248724a2074ff3`.
- GitHub Actions Blog and Studio validation run `44894825680` on exact PR head `51a61f860a5129b16625cba8ab4dbdd1cd7f39bd` — success. Type-check, lint, complete `npm test` suite (including the new regression test), website build, read-only migration dry-run, Studio type-check and Studio build all passed.
- GitHub Actions D1 migration validation run `44894825764` on the same exact PR head — success; lint, website build, Pages Functions syntax and all D1 migration validation steps passed.
- Cloudflare Pages Preview deployment for runtime commit `f1906a49c27ad8519d7488b22f248724a2074ff3` — successful; Preview URL `https://95850e4e.florial.pages.dev`. The subsequent PR-head commits only added the regression test and this audit; runtime source was unchanged.
- Live Preview browser checks: BG/RU/EN content and order verified; 390px mobile inspection found no horizontal overflow and confirmed IBAN wrapping; clicking the Bulgarian IBAN button changed its label to `Копирано`.
- Production deployment and Production browser verification have not been performed; the change remains in PR #461 pending owner approval to merge.
- No Sanity, Cloudflare configuration/secrets, D1, Resend or Production data was changed.

## Documentation integration

Open PR #409 edits shared documentation files, so this task uses a unique audit record rather than editing shared `CHANGELOG.md`, `docs/TECHNICAL_PASSPORT.md`, `docs/AI/OPEN_QUESTIONS.md` or `docs/AI/CURRENT_STATE.md` in parallel. Integrate the release record into shared documents after PR #409 is resolved, following the repository work protocol.
