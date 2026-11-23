# Blog and portfolio landing page UX refresh — 2026-11-23

## Scope
- Redesign the existing `/blog` listing page as a combined blog and portfolio index.
- Remove the redundant standalone “Florial” eyebrow; use one breadcrumb: Home / Blog and portfolio.
- Replace the automatic list of every Sanity tag with four curated visual directions: landscape design, automatic irrigation, rolled turf, and planting/greenery.
- Add curated secondary topic chips from tags that are actually present in published content.
- Add combined search, topic, publication type, year and sort controls.
- Improve the introduction and localize page UI in BG/RU/EN.

## Evidence before implementation
- GitHub `main` HEAD at task start: `3aa2c2d5a4e583c759182f5d9f66e0db2aa3a81b`.
- Existing implementation inspected: `src/pages/BlogPage.tsx`, `src/lib/blog.ts`, `src/components/BlogSection.tsx`, `src/lib/sanityImage.ts`, `src/lib/i18n.tsx`, `tests/content-route-performance.test.mjs`.
- Read-only Sanity Production query in project `bxvcy0qs`, dataset `production`, perspective `published` returned 19 published blogPost documents. Existing tags include landscape/planting, irrigation, turf, sprinklers, drip irrigation, controllers and the project tag. Three latest published posts without tags are still shown in the full listing and searchable.
- The four category cards derive their images and counts from existing blog post tags and cover assets. No new Sanity fields or tags are required.

## Implementation
- `src/pages/BlogPage.tsx`: localized blog/portfolio introduction, single breadcrumb, four visual category cards, three curated secondary topic chips, combined filters, result count, empty state, localized card labels and CollectionPage name.
- `tests/blog-portfolio-page.test.mjs`: regression assertions for navigation, curated categories, filter composition, topic curation and read-only Sanity behavior.
- No Sanity documents, schema, datasets, assets, Cloudflare configuration, D1, Resend, routes, Header, menu or Footer changed.

## Verification
- Exact implementation commit `23aca83c6c6b06e7c1ef02b43922affbb82e111b`: Blog and Studio validation run `45240914119` succeeded; D1 migration validation run `45240914648` succeeded. Website type-check, Pages Functions type-check, lint, tests, website build, migration syntax/dry-run, Studio type-check and Studio build all passed.
- Live browser/mobile visual QA is not confirmed. Firecrawl reported insufficient credits; no screenshot or visual browser inspection is claimed. Sanity was queried read-only only.
- No Production deployment has been performed; the PR is awaiting integration approval.
