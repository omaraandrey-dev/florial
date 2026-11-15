# TypeScript and CI validation — 2026-11-15

## Baseline

- Base commit: `375064324205c85f3b47e87106822130ed4cf8f6`.
- Root TypeScript version: `6.0.3`; Sanity Studio TypeScript version: `5.8.3`.
- The root package had no `typecheck` script. The app TypeScript project included only `src/`; Cloudflare Pages Functions were excluded.
- Sanity Studio had no `tsconfig.json` or TypeScript-check script.
- Existing GitHub Actions ran lint, tests, Vite build, migration checks and Studio build, but did not run `tsc`.

## Changes in this PR

- Added root `npm run typecheck` using `tsc -b --pretty false`.
- Added `functions/` to `tsconfig.app.json`, so application code and Cloudflare Pages Function TypeScript are checked together.
- Explicitly set `strict: false` in the root app and Node/Vite TypeScript projects. TypeScript 6 changed the default of `strict` to `true`; this pins the existing pre-6 behavior rather than silently introducing a strict-mode migration. See the [TypeScript 6.0 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html).
- Added `studio/tsconfig.json` and `npm run typecheck` for Sanity Studio.
- Updated the existing Blog and Studio validation workflow to run both TypeScript checks and to run on pushes to `main` as well as pull requests targeting `main`.
- Kept the existing lint, test, website build, migration validation, dry-run and Studio build steps.

## Type issues uncovered and corrected

The first full run reported 94 diagnostics. After pinning the previous TypeScript strictness default, 54 remained. The remaining diagnostics were corrected rather than suppressing the compiler:

- Corrected locale type imports to the actual `src/lib/i18n/types.ts` module.
- Made the Sanity image helper return one stable optional-property type for both transformed and fallback images.
- Fixed the plant catalog offer union typing and category filter type predicate.
- Added the missing category SEO `noIndex` type and retained its existing middleware behavior.
- Typed the middleware language as the supported `bg | ru | en` union.
- Made the Manager ID helper return `string` explicitly.
- Corrected PDF response body typing, service-lead value conversion and the optional submission title type.
- Moved the Gemini retry counter to the enclosing stream scope so error diagnostics can report it.
- Removed unused imports and unused local declarations that the existing TypeScript compiler options already prohibited.
- Typed the Sanity kit preview against `PreviewProps`, retained the hosted Studio `deployment.appId` config while satisfying the installed CLI types, and replaced the unsupported string-rule `.valid()` call with an equivalent custom allowed-value validator.

No dependency versions or lockfiles were changed.

## CI validation

Validated exact head commit: `e5efbdbc345e51f3eef2160c2701b1ae32b81953`.

- Blog and Studio validation — run `1312` — **success**.
  - Root TypeScript check — success.
  - Oxlint — success.
  - Node test suite — 167 tests, success.
  - Vite production build — success.
  - Migration script syntax and read-only description migration dry-run — success.
  - Sanity Studio TypeScript check — success.
  - Sanity Studio build — success.
- Florial D1 migration validation — run `1643` — **success**.
- Sanity Studio validation — run `169` — **success**.

## Scope and remaining work

- No Production deployment, Sanity content/schema write, D1 data/schema write, Cloudflare binding/secret change, DNS change or dependency upgrade was performed.
- Root and Studio type checks currently preserve their existing non-strict mode. A deliberate migration to `strict: true` is a separate task and should be done incrementally with its own diagnostics and tests.
- The installed React runtime is 18.x while the current React type packages resolve to 19.x. The type checks pass, but aligning those major versions remains a separate dependency-maintenance decision.
- This PR adds CI checks but does not change GitHub branch-protection rules; whether these checks are required before merge was not changed or verified.
