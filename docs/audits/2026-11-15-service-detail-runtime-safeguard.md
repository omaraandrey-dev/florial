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
- A second route-level defect affected the four new `/services/category/{slug}` specialist pages: the Pages Middleware only resolved two-segment Sanity document routes and sent these three-segment SPA routes to its 404 handler.

## Changes in this hotfix

- Generate the lead idempotency key using `crypto.randomUUID` when supported, otherwise use `crypto.getRandomValues`, with a final non-cryptographic fallback so the page itself does not fail to mount.
- Wrap the individual service page in a localized React error boundary. Unexpected render failures now show a recovery screen with navigation to the homepage rather than an empty page; the exception is logged to the browser console.
- Add regression checks for the render-scope fix, error boundary, idempotency key compatibility and specialist route fallback.

## Safety

- No Sanity writes or schema changes.
- No changes to existing service documents or their publication state.
- No Cloudflare settings, bindings, D1 data/schema, Resend or secrets changed.
- Production deployment has not been performed by this branch.

## Verification status

- Root-cause attribution: confirmed by the Preview browser's exact exception `direction is not defined`.
- Preview deployment for implementation head `4dc95435a57ce562e3028cefa8a93f327b3d5bd4`: success; documentation-updated final PR head `92a5597ce264754f4b37977ae788cef021645fc5` also has a successful Preview deployment.
- Browser Rendering smoke tests on that Preview returned HTTP 200 with page content and no error fallback for individual services `avtomatichno-napoyavane` (BG/RU/EN), `landshaften-dizain`, `zasazhdane-na-rasteniya`, `rulonna-treva`; all four specialist direction routes also returned HTTP 200 with their expected localized H1/content.
- CI on final PR head `92a5597ce264754f4b37977ae788cef021645fc5`: Blog and Studio validation run `43732030271` — success; 167/167 utility tests passed, website lint/build and Sanity Studio build passed. D1 migration validation run `43732029062` — success.
- Direct owner-device QA: still recommended after Production release; the owner's browser is not accessible from this environment.
- Shared documentation updates are deferred to the next synchronized integration pass to avoid conflicts with the existing documentation PR batch.
