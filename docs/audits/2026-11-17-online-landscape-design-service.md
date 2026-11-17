# Online landscape design service — 2026-11-17

## Request and approval
- Owner approved a separate online landscape-design service and confirmed the existing project tariff, without the site-visit fee.
- Source material reviewed: https://www.drop.od.ua/post/landscape-online
- Existing service `/services/landshaften-dizain` and existing portfolio/blog documents were preserved.

## Published Sanity document
- Project: `bxvcy0qs`
- Dataset: `production`
- Document ID: `7b5ea19c-4001-4045-aad2-88e4a4685011`
- Slug / route: `landshaften-proekt-online` / `/services/landshaften-proekt-online`
- Published revision after the final localized gallery correction: `kG84M8L0NjpttWhMhrIfOA`
- `isActive=true`, `serviceCategory=landscaping`, `serviceLayout=standard`, `sortOrder=11`, `startingPriceEUR=250`.
- The service is active and therefore appears through the existing data-driven services listing/dropdown; no Header or navigation source code was changed.

## Content, SEO and price
- Full independent BG/RU/EN descriptions, localized H1/hero, short descriptions, advantages, steps, CTA, SEO title/description/keywords and enquiry form.
- BG title: `Онлайн ландшафтен проект за градини в Европа`.
- RU title: `Ландшафтный проект онлайн для сада в Европе`.
- EN title: `Online Landscape Design for Gardens Across Europe`.
- All three locales have `noIndex=false`; live HTML metadata reports `robots=index, follow`.
- Countries named in the copy: Bulgaria, Romania, Greece, Serbia, Croatia, North Macedonia, Slovenia, Hungary, Slovakia, Czech Republic, Poland, Austria, Germany and Italy. Physical delivery/installation outside Bulgaria is explicitly not promised as part of the online service.
- Owner-approved tariff: up to 2 dka €250; up to 4 dka €450; up to 6 dka €600; up to 10 dka €750; each additional dka above 10 €50. No site-visit fee for the online format. Additional visualisations, specialist drawings, surveys and individual requirements are quoted separately.

## Gallery and portfolio
- One hero image plus eight gallery assets reused from the existing published Florial service/blog image archive; no duplicate uploads.
- All eight gallery assets have separate Bulgarian, Russian and English ALT text.
- Three garden/concept photographs appear after the introductory text.
- Five images from the detailed landscape project (master plan, planting plan, plant schedule, irrigation plan and 3D visualisation) appear together directly after the central portfolio paragraph and link to `/blog/podroben-landshaften-proekt-gradina`.
- Related references: detailed project blog, existing landscape-design service, automatic-irrigation design service and landscape-project stages article. Inline body links also connect to landscaping and planting services.

## Enquiry form
Seven localized fields: name (required), phone (required), email (optional), property country (required), city/town (required), property area (optional) and project details (optional). The existing service-leads API and Manager data model store extra configured fields in `fields_json`; Manager detail UI displays these additional fields. No API, D1, Manager or Resend code was changed.
- Form labels were verified in live BG/RU/EN HTML.
- The form was not submitted; no real lead or email was created. End-to-end lead → Manager → Resend delivery remains untested for this new service.

## Runtime and GitHub
- Runtime support: `src/pages/ServicePage.tsx` maps the new service's gallery keys into inline article groups and suppresses the legacy full gallery before the article.
- Regression coverage: `tests/service-landscape-inline-gallery.test.mjs`.
- PR #368 merged to main as `73777db109e5524ca23e5b6ca85ab505ef9488ad`.
- Exact PR head `27c07a46c2379da9cb5c7598baf87340e0fe3fb8`: Blog/Studio validation run `44037137577` success; D1 validation run `44037137558` success. Type-check, lint, website tests/build, migration checks, Studio type-check/build passed.
- Cloudflare Pages Production deployment for merge SHA: `6ffc908a-bd92-4d35-9dbe-23b0f12e54a0`, status success.
- After the Sanity final copy update and backup commit, latest Production deployment at audit time: `78ce3168-158d-4ed8-9af0-d6fa7234969c`, commit `f9661a80e28e71d976893844ec2e0691501507e3`, status success; aliases include `https://florial-bg.com` and `https://www.florial-bg.com`.

## Live verification
- Firecrawl live fetch of BG, RU and EN routes returned HTTP 200.
- Localized page titles/descriptions and indexable robots metadata were verified.
- RU and EN live article extraction confirms all five detailed portfolio images are positioned after the central project paragraph; total extracted images include hero, intro gallery, portfolio gallery and related-content cards.
- BG live extraction confirms the central portfolio block, its internal link and five project images.
- The form's country, city and area labels were verified in all three locale HTML responses.
- A visual screenshot review, formal mobile overflow test, PageSpeed/Lighthouse comparison and form submission/email end-to-end test were not performed. No performance improvement is claimed.

## Backups
- Pre-publication draft snapshot: `docs/backups/sanity/service-landshaften-proekt-online-before-publication-2026-11-17.json` (draft revision `kG84M8L0NjpttWhMhrI0TN`).
- Final published snapshot: `docs/backups/sanity/service-landshaften-proekt-online-final-2026-11-17.json` (published revision `kG84M8L0NjpttWhMhrIfOA`).

## Scope exclusions
No existing published service/blog/portfolio document was modified. No Sanity schema, D1, Resend, Cloudflare settings/secrets, Header source, menu source, Footer or global route architecture changes.

## Shared documentation integration note
The shared `CHANGELOG.md`, `docs/TECHNICAL_PASSPORT.md` and `docs/AI/OPEN_QUESTIONS.md` updates are deferred to avoid a conflicting concurrent edit: open PR #334 is based on an older main SHA and changes those same shared files. The release facts are preserved in this unique audit and the service roadmap snapshot; integrate the shared-file entries after PR #334 is reconciled.
