# Florial Irrigation Assistant service — publication close-out (2026-11-23)

## Published Sanity document

- Project: `bxvcy0qs`
- Dataset: `production`
- Document ID: `c265afd2-f31d-41f0-b377-ed95664a6d20`
- Slug: `inzhener-pomoshtnik-florial-online`
- Public route defined by the existing service renderer: `https://florial-bg.com/services/inzhener-pomoshtnik-florial-online`
- Published revision: `cwcbrYHwLb4OEgYEhdkEsW`
- Published using the exact draft revision guard `cwcbrYHwLb4OEgYEhdjUgy` after the owner's explicit instruction to publish.

## Published content confirmed by Sanity read-back

- BG Portable Text article, RU and EN Markdown articles.
- Localized service name, short description, hero, SEO title/description/keywords and image ALT.
- Existing cover asset retained: `image-cbb73eb80e8cb9abb5d0e72eab6b5aa49ebfbea1-1200x896-jpg`.
- Main image `linkUrl` points to `/irrigation-assistant`.
- Four published category references: root irrigation, sprinklers, controllers and valves.
- The content accurately states that the tool performs geometric layout and preliminary equipment selection, not full hydraulic calculation.
- No schema, frontend, category, product, Cloudflare, D1, Resend or global navigation changes.

## Frontend compatibility checks

- `src/pages/ServicePage.tsx` renders service images as links when `imageLinkUrl`/ `linkUrl` is present.
- The related-content renderer creates linked image cards for category references and localizes card text.
- Existing route pattern is `/services/{slug}`; service/API lookup accepts records unless `isActive === false`.
- No code changes or deployment were needed for the content publication.

## Form configuration issue discovered after publication

Read-only inspection of `functions/api/service-leads.ts` shows that the existing service-lead endpoint requires non-empty `name`, a valid `phone`, and non-empty `location`. It maps `details` (or `comment`) into the lead comment. The newly published form currently configures `name`, `phone`, optional `email`, and `message`; therefore it is missing the required `location` field and uses `message` instead of the endpoint's `details` field.

- This is a content configuration mismatch, not a code/API defect.
- No test submission was made and no D1 lead was created.
- The page remains published, but its lead form should not be considered ready until the owner approves a precise Sanity correction: add required localized `location` field and rename `message` to `details` in BG/RU/EN.
- Per the protected-published-content rule, no further writes to this published service were made without a separate explicit approval for that exact correction.

## Visual verification boundary

- Sanity Production published-perspective read-back succeeded.
- Public visual QA, image load, language switching and click-through were not independently confirmed. Browser Use returned `insufficient_credits`; public web fetch and direct runtime network lookup were inaccessible in this session.
- Do not claim visual/browser verification.

## GitHub

- Pre-publication backup: `docs/backups/sanity/2026-11-23-irrigation-assistant-service-before-edit.json`.
- Preparation audit: `docs/audits/2026-11-23-irrigation-assistant-service-content.md`.
- PR #505 merged into `main` at `07373e913aed1f0f9929b0e108e273690ae43209`.
- This close-out addendum and shared-document updates are delivered in the follow-up documentation PR.
