# Service specialist landing pages and breadcrumbs — 2026-11-15

## Scope

Implemented four dedicated, localized service-direction landing pages and inserted the specialist level into service-detail breadcrumbs. Added an additive `serviceDirection` type to the existing `florial-admin` Studio source. Four new Sanity Production documents have not yet been created.

## Source and live data checks

- GitHub source base: `main` at `9330c99cc19c1f8739f77f4451b1365a19c68e12`.
- Sanity Production read-only query: project `bxvcy0qs`, dataset `production`, perspective `published`.
- Query returned 22 active published service documents. Categories observed:
  - `landscaping`: landscape design and site landscaping.
  - `planting`: planting, planting of olive trees/palms/conifers/lavender, flower beds and topiary pruning.
  - `irrigation`: automatic irrigation, irrigation design/installation, drip irrigation, sprinkler/controller/valve work.
  - `maintenance`: irrigation repair, modernization and annual maintenance.
  - `lawn`: rolled turf and lawn replacement.
  - `delivery`: irrigation equipment delivery and engineer consultation.
- Existing four specialist directions remain authoritative. Irrigation page groups `irrigation`, `maintenance`, and `delivery`; gardener maps to `planting`.
- No Sanity documents, assets, existing published content, or relationships were written. The schema source change is additive and does not modify existing document types.

## Implemented

- Added `src/pages/ServiceDirectionPage.tsx` with unique BG/RU/EN content for four specialist pages, localized metadata, H1/H2 structure, practical service explanations, FAQ accordions, live service cards, BreadcrumbList and CollectionPage JSON-LD.
- Added route handling and lazy loading in `src/App.tsx` for:
  - `/services/category/landshaften-arhitekt`
  - `/services/category/polivni-sistemi`
  - `/services/category/gardinar`
  - `/services/category/trevni-ploshti`
- Added links from the existing services directory to all four landing pages without removing its interactive filters.
- Updated `src/pages/ServicePage.tsx`: the visual breadcrumb and BreadcrumbList JSON-LD now include the mapped specialist category between All Services and the service itself.
- Added all four pages and BG/RU/EN alternates to `functions/sitemap.xml.ts`.
- Added source-level regression tests in `tests/service-direction-pages.test.mjs`.

## SEO and content safeguards

- Each page has unique localized title, meta description, article headings, body copy and FAQs; no generic keyword-stuffed template was used.
- Content references only Florial's current service scope and local coverage already used in the project. It avoids unsupported fixed prices, guaranteed outcomes, credentials and universal horticultural claims.
- Local place names are used naturally: Nessebar, Ravda, Sunny Beach, Sveti Vlas, Aheloy and Pomorie. Sozopol is excluded.
- FAQ content is rendered as accessible HTML disclosure elements; no FAQ rich-result schema is asserted.
- Category pages are included in the sitemap for all three locales.
- Google crawling, selected canonical, indexing and ranking impact remain unconfirmed until Production release and Search Console inspection.

## Files

- `src/pages/ServiceDirectionPage.tsx`
- `src/App.tsx`
- `src/pages/ServicePage.tsx`
- `src/pages/ServicesListPage.tsx`
- `functions/sitemap.xml.ts`
- `tests/service-direction-pages.test.mjs`

## Verification status

- GitHub source review: completed on the feature branch.
- Additive schema source: `studio/schemaTypes/index.ts`, commit `e0bfb939` followed by syntax correction `0533f085`.
- CI for `0533f085`: website lint, utility tests, website build, Pages Functions syntax, read-only D1 migration validation and Sanity Studio build all passed. Runs: `43726056390`, `43726056393`, `43726056441`.
- Sanity Production service classification: read-only query completed; 22 records returned.
- PR CI on code commit `a8356c6766d0df2fa9d34349263e16dd1d245d16`: website lint passed; website utility tests passed (including the new specialist-page tests); Vite build passed; Pages Functions syntax and read-only D1 migration checks passed. D1 workflow run `43722398178` completed successfully.
- Blog and Studio validation run `43722398074` completed successfully: website lint/tests/build, migration dry-run and Sanity Studio build all passed.
- Production deployment, live route smoke tests, metadata/canonical/hreflang verification, mobile visual QA and Google indexing remain unconfirmed.
- **Content ownership note:** localized editorial copy currently lives in the source-controlled React component, not Sanity Studio. The new `serviceDirection` schema type is now present in the PR source but is not yet deployed. The frontend is not yet wired to read these documents. After merge/deployment, four documents must be created and the frontend data integration completed before this is considered Studio-managed.

## Shared documentation integration

- The audit remains a unique, task-specific record in this PR.
- Shared files `CHANGELOG.md`, `docs/TECHNICAL_PASSPORT.md` and `docs/AI/OPEN_QUESTIONS.md` are intentionally not changed here. Several older open documentation PRs still modify those same shared files from stale base commits.
- Integrate this audit into the shared documents only after those documentation branches are reconciled with the then-current `main`; this avoids dropping or duplicating their records.
