# Florial Manager — online-only PWA implementation

Date: 2026-11-20  
Base: `main` at `4aa95f43abdc7fedcb4a96b1ab2ad3c8fae64223`  
Working branch: `feat/manager-online-pwa`

## Scope and decisions

- Manager remains the existing React SPA selected only for `/manager` and `/manager/*`.
- The PWA manifest uses `start_url: /manager/`, `scope: /manager/` and `display: standalone`.
- Manifest and icons live below `/manager/`; the manifest link is injected only into Manager HTML by the existing Manager-specific middleware branch.
- Service worker registration occurs inside `ManagerApp`, which is rendered only on Manager routes.
- This is an online-only application. The worker does not use Cache Storage, does not cache the shell or data, and does not provide an offline fallback. Manager navigation requests are passed through to the network. When offline, the application cannot load or perform operations.
- Public asset URLs and the global Vite build configuration are unchanged.

## Security and data handling

- The existing `/manager/*` middleware continues to set `X-Robots-Tag: noindex, nofollow, noarchive` and the matching robots meta tag.
- Manager HTML is marked `Cache-Control: no-store`.
- The shared Manager JSON response helper already sets `cache-control: no-store`; this applies to login, session, order, plant, service-lead, staff and other JSON handlers using that helper.
- Order PDF/proforma responses already set `Cache-Control: no-store`.
- The Gemini streaming endpoint was changed from `no-cache, no-transform` to `no-store, no-transform`, preserving streaming while preventing storage.
- Existing session model is unchanged: the `florial_manager_session` cookie remains HttpOnly, Secure and SameSite=Strict, with Path=/api/manager. Owner/Manager/Seller authorization and server-side permission checks are untouched.

## Files changed

- `src/manager/ManagerApp.tsx`
- `functions/_middleware.ts`
- `functions/api/manager/plants/gemini-test.ts`
- `public/manager/manifest.webmanifest`
- `public/manager/sw.js`
- `public/manager/icons/icon-192.svg`
- `public/manager/icons/icon-512.svg`
- `tests/manager-online-pwa.test.mjs`

## Verification status

- Source audit: complete for Manager routing, session cookie, shared JSON response helper, Manager robots middleware, Gemini stream and order PDF handlers.
- Regression tests: added; execution is pending CI.
- Build and typecheck: pending CI.
- Browser installation test on Android/iOS: not performed.
- Production deployment: not performed; this branch is not merged.
- No D1, Sanity, Cloudflare settings, bindings, secrets, DNS, Resend or Production data were changed.

## Documentation coordination

The shared `CHANGELOG.md` and `docs/TECHNICAL_PASSPORT.md` are not edited in this implementation commit because open PR #409 also changes shared documentation and the repository work protocol prohibits parallel edits to common files from stale branches. Complete those shared-document updates in a synchronized documentation pass after PR #409 is resolved or explicitly superseded.
