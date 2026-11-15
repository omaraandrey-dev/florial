# Service detail runtime safeguard — 2026-11-15

## Scope

Investigate the owner-reported failure where opening any individual service page briefly flashes and then becomes blank. No Sanity documents, service content, SEO fields, routes, Header, menu, Footer, D1 data, Cloudflare configuration, or secrets were changed.

## Read-only findings

- GitHub source baseline: `main` at `7926ce8f5308263d9f482aacec1e97509ee05982`.
- Sanity Production project `bxvcy0qs`, dataset `production`: the exact service-detail GROQ projection returned the published `avtomatichno-napoyavane` document (`04c7ab3b-1888-41cb-9917-6b9014cd1ac3`) with populated hero, description, content blocks, gallery, form and SEO fields.
- Production route `/services/avtomatichno-napoyavane` returned HTTP 200 with correct canonical and localized SEO metadata.
- `ServicePage.tsx` created its lead idempotency key by calling `crypto.randomUUID()` unconditionally during component initialization. This can throw before the page renders in browser contexts that expose Web Crypto without `randomUUID`.
- Browser Rendering against the first Preview caught the service component's actual render exception: `direction is not defined`.
- Root cause confirmed in `src/pages/ServicePage.tsx`: `direction` was declared inside the SEO `useEffect`, but also referenced by the breadcrumb JSX outside that effect. TypeScript/Vite build did not type-check this scope error, so the normal build passed while the browser component crashed.
- The unguarded `crypto.randomUUID()` was a separate compatibility hazard and has also been hardened; it was not the exception observed in the Preview.

## Changes in this hotfix

- Generate the lead idempotency key using `crypto.randomUUID` when supported, otherwise use `crypto.getRandomValues`, with a final non-cryptographic fallback so the page itself does not fail to mount.
- Wrap the individual service page in a localized React error boundary. Unexpected render failures now show a recovery screen with navigation to the homepage rather than an empty page; the exception is logged to the browser console.
- Add regression checks for both safeguards.

## Safety

- No Sanity writes or schema changes.
- No changes to existing service documents or their publication state.
- No Cloudflare settings, bindings, D1 data/schema, Resend or secrets changed.
- Production deployment has not been performed by this branch.

## Verification status

- Root-cause attribution: confirmed by the Preview browser's exact exception `direction is not defined`.
- Latest automated checks and Preview deployment: pending CI on the final PR head.
- Direct owner-device QA: still required after Production release; the owner's browser is not accessible from this environment.
- Shared documentation updates are deferred to the next synchronized integration pass to avoid conflicts with the existing documentation PR batch.
