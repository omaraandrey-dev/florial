# Homepage SSR client handoff — implementation audit

**Date:** 2026-11-25  
**Repository:** `omaraandrey-dev/florial`  
**Base main SHA:** `5772a3e567bd77e69854d647fca08a6f3ff732cd`  
**Branch:** `fix/homepage-ssr-client-handoff-v1`  
**PR:** [#534](https://github.com/omaraandrey-dev/florial/pull/534)  
**Latest audit/code-workflow head:** `55c2a0f0a0cb3579af3db7de48e9dd7d8eacb42f`  
**Application code head used for Preview:** `d13d3a3dc011d62942b478a4680368a6f6ce9df2`  
**Status:** implementation in review; no merge or Production release.

## Goal

Keep the homepage's first-response server HTML visible while the React application starts and loads the data required to render the same homepage. Avoid the previous immediate replacement of `#root` by React `createRoot`.

This is a controlled DOM handoff, **not React hydration**. React still uses `createRoot`; no claim of hydration or zero CLS is made.

## Implementation

- `index.html` adds an initially hidden sibling `#app-root`; the existing `#root` remains the server-rendered homepage container.
- `src/main.tsx` uses `#app-root` only for the exact homepage path `/`. All non-homepage routes continue to mount React in `#root` as before.
- `App.tsx` tracks readiness for all homepage-critical client data:
  - Header equipment/plant categories, services, site settings and logo;
  - complete equipment and plant category collections;
  - six selected homepage plant categories and the hero image request;
  - featured plants and featured irrigation equipment;
  - the pinned/latest blog teaser.
- A pure readiness helper requires every group to succeed before the handoff.
- The handoff reveals `#app-root` and hides the SSR `#root` synchronously in the same JavaScript task.
- `BlogSection` reports successful data completion. A blog fetch error does not authorize the handoff.
- A failed request or invalid collection leaves the server HTML visible rather than replacing server content with empty client sections. In that fallback state, normal HTML links remain usable, but React-only controls are not activated.
- The handoff is one-way for the initial page load. Later in-app language changes continue using the existing client behavior.

## Scope

Changed:
- `index.html`
- `src/main.tsx`
- `src/App.tsx`
- `src/pages/HomePage.tsx`
- `src/components/BlogSection.tsx`
- `src/lib/homepageHandoff.mjs`
- `src/lib/homepageHandoff.d.mts`
- `tests/homepage-handoff.test.mjs`
- `tests/homepage-conversion.test.mjs`
- `scripts/smoke-homepage-ssr.mjs`
- `.github/workflows/homepage-ssr-smoke.yml`

No Header, main-menu or Footer component was changed. No routing, Sanity schema/content, D1 schema/data, Cloudflare settings/secrets, Production configuration, orders or email behavior was changed. No Sanity writes were performed.

## Verification

- **Preview build:** Cloudflare Pages deployment `1f55f12e-a3ec-40be-936e-69887fd43155` succeeded for application code head `d13d3a3dc011d62942b478a4680368a6f6ce9df2`.
- **Raw HTTP smoke:** workflow run `45549224568` passed on branch head `55c2a0f0a0cb3579af3db7de48e9dd7d8eacb42f`. BG/RU/EN were checked using native fetch without executing JavaScript. The optional handoff assertion was enabled and verified that server content is inside `#root` and the unique `#app-root` follows it in the initially hidden state.
- **D1 validation:** workflow run `45549229317` succeeded; no migration was applied.
- **Blog and Studio validation:** workflow run `45549229352` was still running when this audit was written. Update this record with its final result before merging.
- **Browser-level visual/interactivity verification:** not completed. The browser automation service returned `insufficient_credits`; no browser pass is claimed.
- Earlier exact-head failures were corrected: the DOM hidden-attribute declaration was aligned with the TypeScript DOM type, and the existing homepage conversion test was updated to expect the new BlogSection readiness callback.

## Failure behavior and remaining limits

- If any critical client query fails, the SSR page remains visible and the hidden React root is not revealed. This is intentionally safer than showing an empty or partial homepage, but React-only interactions remain unavailable until a successful page reload.
- The client root is rendered while hidden, so a browser-level test is still needed to inspect resource loading, visual swap, layout shift and duplicate image requests.
- This does not preserve the SSR DOM through React hydration; it swaps to a separately rendered React tree after readiness.
- No browser-based CLS measurement or real-device mobile verification is claimed.
- No merge or Production deployment has occurred for PR #534.

## Documentation synchronization note

The open PR #409 also edits shared files `CHANGELOG.md`, `docs/TECHNICAL_PASSPORT.md` and `docs/AI/OPEN_QUESTIONS.md`. To avoid parallel edits to shared documentation, this task records its unique audit here and updates the SSR-specific roadmap only. Shared-document entries must be integrated after PR #409 is reconciled with the latest `main`, without overwriting either change set.
