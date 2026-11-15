# Service detail runtime safeguard — 2026-11-15

## Scope

Investigate the owner-reported failure where opening any individual service page briefly flashes and then becomes blank. No Sanity documents, service content, SEO fields, routes, Header, menu, Footer, D1 data, Cloudflare configuration, or secrets were changed.

## Read-only findings

- GitHub source baseline: `main` at `7926ce8f5308263d9f482aacec1e97509ee05982`.
- Sanity Production project `bxvcy0qs`, dataset `production`: the exact service-detail GROQ projection returned the published `avtomatichno-napoyavane` document (`04c7ab3b-1888-41cb-9917-6b9014cd1ac3`) with populated hero, description, content blocks, gallery, form and SEO fields.
- Production route `/services/avtomatichno-napoyavane` returned HTTP 200 with correct canonical and localized SEO metadata.
- `ServicePage.tsx` created its lead idempotency key by calling `crypto.randomUUID()` unconditionally during component initialization. This can throw before the page renders in browser contexts that expose Web Crypto without `randomUUID`.
- A direct browser JavaScript stack trace for the reported device was not available. Therefore the unguarded API call is a confirmed runtime fragility, but is not claimed as the conclusively observed exception on the owner's device.

## Changes in this hotfix

- Generate the lead idempotency key using `crypto.randomUUID` when supported, otherwise use `crypto.getRandomValues`, with a final non-cryptographic fallback so the page itself does not fail to mount.
- Wrap the individual service page in a localized React error boundary. Unexpected render failures now show a recovery screen with navigation back to the services list rather than an empty page; the exception is logged to the browser console.
- Add regression checks for both safeguards.

## Safety

- No Sanity writes or schema changes.
- No changes to existing service documents or their publication state.
- No Cloudflare settings, bindings, D1 data/schema, Resend or secrets changed.
- Production deployment has not been performed by this branch.

## Verification status

- Automated checks and Preview deployment: pending CI on the exact PR head.
- Direct browser smoke test on owner device: not available from this environment.
- Root-cause attribution: not confirmed until the actual device/browser stack trace is available. This hotfix removes a concrete compatibility hazard and guarantees a visible recovery state for unexpected service-page render exceptions.
- Shared documentation updates are deferred to the next synchronized integration pass to avoid conflicts with the existing documentation PR batch.
