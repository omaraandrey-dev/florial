# Florial runtime and dependency inventory — 2026-11-15

## Scope and evidence standard

Read-only audit of GitHub `omaraandrey-dev/florial` and the connected Cloudflare account. Source revision: `375064324205c85f3b47e87106822130ed4cf8f6` (main). Production Pages deployment `ca3c52e0-baa9-4bd2-9fdc-95968b043022` points to the same commit and reports deployment stage `success`.

Evidence is separated into:
- **Repository:** source files, package manifests, lockfiles and instructions at the exact main revision.
- **Production:** read-only Cloudflare API reads and SELECT-only D1 queries.
- **Not confirmed:** any item without direct source or live-service evidence.

No application code, Sanity documents/schemas, D1 data/schema, Cloudflare configuration/secrets, Resend settings, DNS, or Production deployment was changed. Secret values were not read or displayed.

## Canonical project instructions

Read:
- `AI_INSTRUCTIONS.md`
- `docs/AI/START_HERE.md`
- `docs/AI/WORK_PROTOCOL.md`
- `docs/AI/MASTER_SPEC.md`
- `docs/AI/OPEN_QUESTIONS.md`
- `docs/TECHNICAL_PASSPORT.md`
- `CHANGELOG.md`

GitHub `main` is the sole permanent source for Florial code and technical documentation. Sanity is the published content/catalogue source; Cloudflare Pages/Functions hosts the app and backend; D1 stores Manager and order data; Resend handles transactional email. Supabase is excluded from the active runtime. Existing published `service`, `blogPost`, and portfolio documents are protected: any edit requires a precise plan and separate owner approval.

The current main instructions also say not to maintain technical-document copies in Notion. The Notion entry created during the earlier Context7 discovery was therefore converted to a pointer-only page linking back to this repository.

## Actual frontend and package versions

The application is a **Vite + React SPA**, not Next.js. It is deployed as Cloudflare Pages static assets with Pages Functions. No Next.js runtime or Next.js adapter is present in the root package manifest.

Root `package.json` scripts:
- `dev: vite`
- `build: vite build`
- `lint: oxlint`
- `preview: vite preview`
- `test: node --test tests/*.test.mjs`

Root `package-lock.json` (lockfile v3) pins:
- `vite` 8.3.6
- `@vitejs/plugin-react` 6.2.1
- `react` / `react-dom` 18.3.1
- `@sanity/client` 6.29.1
- `typescript` 6.0.3
- `tailwindcss` / `@tailwindcss/postcss` 4.3.5
- `oxlint` 1.92.0
- `postcss` 8.5.32
- `autoprefixer` 10.6.2
- `pdf-lib` 1.17.1
- `@pdf-lib/fontkit` 1.1.1
- `@types/node` 24.19.2
- `@types/react` / `@types/react-dom` 19.3.0

Studio `studio/package-lock.json` (lockfile v3) pins:
- `sanity` / `@sanity/vision` 3.99.0
- `react` / `react-dom` 18.3.1
- `styled-components` 6.6.0
- `typescript` 5.8.3

A version-alignment item to review before adding a full type-check gate: the application runtime uses React 18.3.1 while its locked React type packages are 19.3.0. This is a potential compatibility mismatch, not a confirmed runtime defect.

## Cloudflare Production — live read-only evidence

Pages project:
- Project: `florial`
- Production branch: `main`
- Domains: `florial-bg.com`, `www.florial-bg.com`, `florial.pages.dev`
- Build command: `npm run build`
- Build output: `dist`
- Pages Functions: enabled
- Latest Production deployment: `ca3c52e0-baa9-4bd2-9fdc-95968b043022`
- Deployment commit: `375064324205c85f3b47e87106822130ed4cf8f6`
- Deployment status: `success`

Production bindings:
- D1 binding `DB` → database `florial-db`, UUID `5fbb0e47-8439-493c-821a-6945eef7d8b2`
- Workers AI binding `AI`
- Service binding `PLANT_CARE_WORKFLOW` → Worker `florial-plant-care-workflow`

A separately deployed Worker `florial-plant-care-workflow` exists. Its code extends `WorkflowEntrypoint`, creates a durable `step.do` step, and calls the Pages Function endpoint for the botanical review process. Its live settings show the `PLANT_CARE_WORKFLOW` workflow binding.

D1 was queried read-only. The database contains Manager/order tables including `orders`, `order_events`, `catalog_staff_profiles`, `catalog_submissions`, `manager_sessions`, `site_events`, and `schema_migrations`. The live migration ledger confirms `0001_initial` through `0014_contract_withdrawals` are applied. No SQL writes were issued.

Preview environment is not equivalent to Production: the live Pages Preview configuration does not show the `DB` D1 binding or the Production-only secrets/service bindings. Manager/AI behavior in Preview must not be assumed to work until separately configured and tested.

## Production environment variable names and types

Only names and Cloudflare-reported types were inspected; values were not retrieved.

- Plain text: `EMAIL_FROM`, `ORDER_NOTIFICATION_EMAIL`, `VITE_POSTHOG_PROJECT_KEY`, `VITE_SANITY_DATASET`, `VITE_SANITY_PROJECT_ID`, `SUPABASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Secrets: `GEMINI_API_KEY`, `MANAGER_BOOTSTRAP_SECRET`, `RESEND_API_KEY`, `SANITY_API_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`.

The Supabase-named variables are legacy configuration only; no `@supabase/*` package or Supabase references were found in `src/` or `functions/`. They were not removed or modified. Open PR #274 separately records a proposed owner decision to retain them as contingency; that PR was still open during this audit, so it is not represented as a merged main-branch rule.

## Confirmed application integrations

### Sanity
- Project ID: `bxvcy0qs`.
- Datasets used by the project: `production` and `plants`.
- Root app uses `@sanity/client` 6.29.1; Studio uses `sanity` 3.99.0.
- Production Pages includes `SANITY_API_TOKEN` as a secret; its value was not read.

### Resend
- Transactional email is sent by direct REST requests to `https://api.resend.com/emails` from Pages Functions.
- `RESEND_API_KEY` exists as a Production secret.
- No Resend SDK package is pinned in the root manifest.

### AI and botanical data
- Manager plant-copy and botanical workflows use Cloudflare Workers AI models `@cf/meta/llama-3.3-70b-instruct-fp8-fast` and `@cf/meta/llama-3.2-11b-vision-instruct`.
- A separate Owner-only Gemini test endpoint uses Google's Generative Language API and `GEMINI_API_KEY`.
- Botanical taxonomy matching uses the public GBIF Species API.
- Cloudflare Production has the `AI` binding and the Gemini key secret. Their values were not read. Key validity/quota and successful Owner acceptance tests are not established by this configuration audit.

### Analytics
- Basic first-party usage events are written to D1 through `/api/track`.
- Additional PostHog EU events are consent-gated in `src/services/trackingService.ts`; the public `VITE_POSTHOG_PROJECT_KEY` is now present in Cloudflare Production.
- No GA4 or Google Tag Manager implementation was found in the current app source.
- Cloudflare Pages Web Analytics tag/token are unset in the project configuration.
- The earlier PostHog project note saying the Production key was absent is stale relative to the live Cloudflare configuration read on 2026-11-15.

### External services and non-runtime tools
- Econt: current repository search found no Econt API integration, office lookup, or live tariff calculation. `CHECKOUT_SETUP.md` explicitly states those are not part of the current checkout endpoint. Delivery rules/manual agreement should not be described as an Econt API integration.
- Wix: not part of the Florial runtime. DROP's Wix store is a separate project and is not audited by this Florial repository inventory.
- Dropbox and Notion are work/connectivity tools, not Florial runtime dependencies.

## CI and type-checking gap

The root build script is `vite build` and does not invoke `tsc`. Vite's official TypeScript guidance confirms that Vite transpiles TypeScript but does not type-check it. There is no dedicated root `typecheck` script in `package.json`.

This does not mean the production build is failing: the latest matching Cloudflare Production deployment succeeded. It does mean a successful Vite build alone is not proof that all TypeScript types are valid. Recommend a separate, intentional type-check gate after resolving or confirming the React 18 / @types/react 19 alignment. No scripts or CI workflows were changed in this audit.

The latest production deployment was verified against the exact main commit. A separate GitHub Actions run for this SHA was not independently confirmed in this audit; do not infer one from the successful Pages deployment.

## Context7 documentation targets for the actual stack

Use the pinned project versions first, then query the relevant documentation:
- Vite: `/vitejs/vite`
- React: `/reactjs/react.dev`
- TypeScript: `/microsoft/typescript`
- Sanity Studio: `/sanity-io/sanity`
- Sanity Client: `/sanity-io/client`
- GROQ: `/sanity-io/groq`
- Cloudflare: `/cloudflare/cloudflare-docs`
- Cloudflare D1: `/llmstxt/developers_cloudflare_d1_llms-full_txt`
- Cloudflare Workflows: `/websites/developers_cloudflare_workflows`
- Resend: `/websites/resend`

Econt did not resolve to a suitable official Context7 library in the discovery pass; use the official Econt developer portal/OpenAPI directly. Wix/Dropbox/Notion documentation is relevant only to their separate operational workflows, not to the Florial runtime.

## Recommended follow-ups (not performed)

1. Decide whether to add `tsc -b --pretty false` (or equivalent project type-check) to CI, after checking React type-package compatibility and the Pages Functions type strategy.
2. Decide whether Manager Preview is required; if so, configure isolated Preview D1/service bindings and safe Preview secrets without pointing tests at Production data.
3. Confirm PostHog event ingestion in the connected PostHog project; presence of the public key does not prove events have arrived.
4. Verify the Google Gemini Owner test endpoint with an authorized owner session; configuration presence does not prove key validity/quota.
5. Review the legacy Supabase-named Cloudflare variables only under the already documented owner decision; do not delete or rotate them as part of routine cleanup.
6. Reconcile the open documentation PR batch before consolidating shared CHANGELOG/Technical Passport/Open Questions entries. This audit is intentionally a unique file so it does not conflict with open PRs.

## Validation summary

- Repository files/lockfiles: inspected at main SHA above.
- Cloudflare Pages project, production deployment, bindings, environment variable names/types, D1 database and migration ledger: read-only API checks.
- D1 queries: SELECT-only; zero rows written.
- Secret values: not read.
- Code/config/production mutations: none.
- Pages production deployment: already successful for the audited main commit.
- Live user-flow tests for Gemini, PostHog, Resend email delivery, Econt, and Manager Preview: not performed.
