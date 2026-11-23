# Florial Irrigation Assistant service lead form correction (2026-11-23)

## Scope and approval

- Owner explicitly approved the exact correction on 2026-11-23 after the publication close-out identified a form/API mismatch.
- Protected published service: `c265afd2-f31d-41f0-b377-ed95664a6d20`.
- Slug: `inzhener-pomoshtnik-florial-online`.
- Public route: `https://florial-bg.com/services/inzhener-pomoshtnik-florial-online`.
- Sanity project/dataset: `bxvcy0qs` / `production`.

## Backup and guarded write

- Full published document snapshot saved before the write at `docs/backups/sanity/2026-11-23-irrigation-assistant-service-published-before-form-fix.json`.
- Captured published revision: `cwcbrYHwLb4OEgYEhdkEsW`.
- No draft existed before the correction.
- Created a draft from the exact published revision using the revision guard, then published with draft revision guard `O505nbDAUJaZHGA4U1XGu5`.
- Published revision after correction: `cwcbrYHwLb4OEgYEhdlEtY`.

## Corrected fields in all locales

Each localized form now contains the same technical field names:

- `name` — required.
- `phone` — required.
- `location` — required; localized label and placeholder for BG/RU/EN.
- `email` — optional.
- `details` — optional textarea for project description.

The former `message` field was renamed to `details`. Existing field labels, placeholders and keys were preserved where applicable; the new `location` field received a unique key in each locale.

## Compatibility checks

- Read-only code review of `src/pages/ServicePage.tsx`: the renderer dynamically creates controls from configured field names, collects each field by its configured `name`, and submits the resulting fields object to `/api/service-leads`.
- Read-only code review of `functions/api/_lib/service-leads.mjs`: `normalizeLeadFields` accepts configured field names matching the generic identifier rule, checks required values, and supports `details` as the extended text field.
- Read-only code review of `functions/api/service-leads.ts`: the endpoint requires `name`, valid `phone`, and `location`, and maps `details` (or legacy `comment`) to the lead comment.
- `getLeadFieldLabel` in the current ServicePage has localized mappings for both `location` and `details`.
- Sanity built-in validation reports the published service as valid. Validation is incomplete because custom callbacks (including custom slug uniqueness callbacks) are not executed by the available validator.

## Verification boundary and impact

- Sanity published-perspective read-back confirms the corrected five-field configuration in BG/RU/EN.
- No draft remains for this document.
- No Sanity schema changes, source-code changes, API changes, D1 schema/data writes, Cloudflare settings/secrets changes, Resend changes, or deployment were made.
- Database structure was not changed; this correction only updates the published Sanity service document's form configuration.
- No real enquiry was submitted; no D1 lead or email was created. End-to-end submission and email delivery remain unverified.
- Public visual/browser QA (rendered labels, language switching and live interaction) remains unconfirmed; do not claim it passed.

## Documentation coordination

- This audit and its pre-write backup are isolated artifacts in this PR.
- Shared files (`CHANGELOG.md`, `docs/TECHNICAL_PASSPORT.md`, `docs/AI/OPEN_QUESTIONS.md`, `docs/AI/CURRENT_STATE.md`) are intentionally deferred while other documentation PRs are open and touch shared documentation. Add the shared close-out entry in the next synchronized integration pass after those PRs are resolved.
