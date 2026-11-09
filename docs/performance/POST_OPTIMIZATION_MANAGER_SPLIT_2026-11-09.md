# Florial — lazy-load Manager JavaScript report (09.11.2026)

**Production:** https://florial-bg.com  
**PR:** https://github.com/omaraandrey-dev/florial/pull/146  
**Merge commit:** `eef48358030cc04c7c8105f66b74013cfc20997a`  
**Cloudflare deployment:** `5ae924f2-29ba-446b-ab8c-be44e121eabb` — success  
**Changed runtime file:** `src/main.tsx`

## 1. Change

- Replaced static `ManagerApp` import with `lazy(() => import('./manager/ManagerApp'))`.
- Dynamic component is rendered only when the initial path is `/manager` or starts with `/manager/`.
- Added a small Bulgarian Suspense fallback: `Зареждане на панела за управление…`.
- Public `LanguageProvider + App` branch and the route predicate remain unchanged.
- ManagerApp source, authentication, permissions, API, UI and D1 were not modified.

## 2. CI and Production

- Blog and Studio validation run `42591541092`: success (lint, utility tests, website build, migration syntax, read-only migration dry-run, Studio install/build).
- D1 validation run `42591541240`: success.
- Cloudflare Pages deployment `5ae924f2-29ba-446b-ab8c-be44e121eabb`: success; commit matches merge commit; aliases `florial-bg.com`, `www.florial-bg.com`.

## 3. Live route verification

- `/` and `/?lang=ru` render the public site.
- `/manager` and `/manager/` render the existing Bulgarian employee login screen.
- Resource inspection on public homepage: `index-yNnEwJtM.js` and `rolldown-runtime-WkwZ5CU-.js`; no `ManagerApp` or manager-specific chunk loaded.
- Resource inspection on `/manager`: separate `ManagerApp-BJhBJlxh.js` is loaded and `/api/manager/auth/bootstrap-status` is requested. No sign-in was attempted.

## 4. JavaScript resource sample

Remote browser default viewport was 1920×993. This was a single unthrottled sample; cache disable, CPU slowdown and network throttling were not applied.

| Capture | Public JS resources | Transfer |
|---|---|---:|
| Before PR #146 | `index-CGAfj3gd.js` | 209,165 B |
| After PR #146 | `index-yNnEwJtM.js` + runtime | 160,495 B + 656 B = 161,151 B |

- Difference: 48,014 B less public-route JS transfer (≈22.96%).
- Manager-only chunk: `ManagerApp-BJhBJlxh.js`, 47,518 B transfer, loaded on `/manager` only.
- This is not a controlled mobile baseline, not a Lighthouse score, and not an overall page-speed percentage. Use only as a single remote-browser resource sample.

## 5. Scope

- Only `src/main.tsx` changed.
- No ManagerApp source/auth/API/permissions changes; no D1 or Sanity writes; no cart/checkout, Header/menu/Footer or Cloudflare configuration changes.
- No user login or real data changes.

## 6. Next

Continue Stage 5 by mapping static page imports in `src/App.tsx` and identifying safe route-level lazy boundaries. Preserve direct URLs, navigation, SEO, scroll state and localized fallback behavior. Controlled mobile CDP capture and Lighthouse/CWV remain open.
