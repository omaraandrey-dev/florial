# Landscape design — inline gallery implementation

Date: 2026-11-17
Project: `bxvcy0qs`
Dataset: `production`
Service document: `c7d2c120-6024-4876-b240-ff6585df91e4`
Slug: `landshaften-dizain`
Public route: `/services/landshaften-dizain`

## Owner approval

The owner explicitly approved the exact scope on 2026-11-17:
- Keep the existing hero image at the top.
- Remove the 12-image gallery strip from immediately below the hero.
- Distribute all 12 remaining images through relevant article sections.
- Localize image ALT text in BG/RU/EN and add natural service-area context for Nessebar, Ravda, Sunny Beach, Kosharitsa, Kableshkovo, Pomorie, Aheloy, Sveti Vlas and Elenite.
- Do not change the new project blog article, prices, lead form, related content or hero image.

## Sanity Production

- Before the write, the complete published service document was backed up to:
  `docs/backups/sanity/service-landshaften-dizain-before-inline-gallery-2026-11-17.json`.
- Backup source revision: `kG84M8L0NjpttWhMhrCNAn`.
- 12 non-hero gallery image ALT values were updated in BG/RU/EN (36 localized ALT strings total); all 12 were read back successfully.
- Current published revision after ALT update: `kG84M8L0NjpttWhMhrDNju`.
- Hero image, image assets, gallery order, descriptions, translations, SEO, prices, form, related references and the separate project blog article were preserved.
- The seven inline gallery markers were validated in a draft, but then intentionally removed from the published descriptions before runtime deployment. This prevents raw marker strings from appearing while Production still runs the old page renderer. The next Sanity content activation must add the seven markers only after the matching runtime version is deployed.
- The current published page therefore continues to use the old top-gallery layout until the runtime change is merged/deployed and markers are activated. This is an intentional safe staging boundary, not a completed visual rollout.

## Runtime implementation in this PR

- `src/pages/ServicePage.tsx` supports localized inline gallery markers for Portable Text and Markdown service descriptions.
- Only `landshaften-dizain` maps its 12 gallery images into seven editorial groups: site/context, concept, master plan, planting plan, landscape features, irrigation and visualisations.
- The single large gallery immediately after the hero is suppressed only for this service. Other service-page layouts are unchanged.
- A regression test covers marker support, all 12 image placements and suppression of the top gallery.

## Verification and limits

- Live Sanity read-back: passed for the 12 localized ALT sets; zero marker strings in currently published BG/RU/EN descriptions.
- Source review: code paths and image-key mapping inspected on branch.
- GitHub Actions Blog and Studio validation run `44031002884` passed on commit `77e1a50304b5950bf5cb6b39838a727198981214`: website typecheck, lint, Node tests, website build, Studio typecheck and Studio build all succeeded.
- GitHub Actions D1 validation run `44031002892` also passed; this task made no D1 changes.
- Live Firecrawl reads (`maxAge=0`) retrieved BG, RU and EN production routes with their localized SEO titles. HTML contained the new localized ALT/geography strings and no raw gallery marker tokens.
- The currently live layout remains the old top-gallery layout until this runtime PR is merged/deployed and the seven markers are then activated. Final browser visual review of the new inline layout is pending that release.
- No Cloudflare settings, secrets, D1, Resend, Sanity schema, Header, navigation or Footer were changed.
