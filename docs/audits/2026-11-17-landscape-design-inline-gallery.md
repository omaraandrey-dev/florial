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


## Final activation and Production verification — 2026-11-17

This section supersedes the earlier staging note above, which accurately described the state before runtime deployment and marker activation.

### Sanity marker activation
- Before adding markers, the current published service document was backed up to `docs/backups/sanity/service-landshaften-dizain-before-inline-gallery-activation-2026-11-17.json`.
- Backup/current base revision: `kG84M8L0NjpttWhMhrDNju`.
- After runtime deployment succeeded, seven markers were added to the BG Portable Text description and seven markers to each RU/EN Markdown description, using a revision guard. The draft was read back and validated before publication.
- Published document revision: `y2TDpG5qG8p5QpVOSxSVtG`. All three language versions contain exactly the seven supported groups: `intro`, `design`, `pipeline`, `equipment`, `trenches`, `watering`, `automation`.
- Gallery mapping uses 12 non-hero keys exactly once: intro (2), design (2), pipeline (1), equipment (2), trenches (3), watering (1), automation (1). The remaining gallery item `img0` is the existing hero image and is not duplicated in the inline groups.

### Runtime correction and release
- PR #365 merged as `c5aeca1da14f1984059ba9b8684e0b506548e04f`; initial Production deployment `4e2d5088-50fe-4357-ae1e-30d358038026` succeeded.
- Production QA found that the shared `hasIntroGallery` branch rendered the intro group instead of the hero for this service. This was corrected in PR #366 by excluding `landshaften-dizain` from that pre-hero branch and adding regression assertions.
- PR #366 exact head `de9af6a1cc0ecfd5a0d42e6aef60e7a15e7ca7fe`: Blog/Studio validation `44033320526`, D1 validation `44033320528`, Cloudflare Pages Preview deployment `132846fa-e691-4089-9307-aea448349c5b` all succeeded.
- PR #366 merged as `d5cdf42f9de85a7ae633fe535470761886ba7ca9`. Final Production deployment `f02d0bed-5390-493f-ae94-519c382c1dff` completed successfully and is associated with both public domain aliases.

### Final read-only Production checks
- Firecrawl live HTML reads for BG, RU and EN all returned HTTP 200.
- In each locale the hero image is present immediately after the site logo. All 12 expected gallery assets occur exactly once and in the intended editorial order; the intro images follow the introductory paragraphs and precede the first numbered section.
- No raw `[[gallery:...]]` marker strings appear in rendered HTML.
- Full-page desktop screenshots were captured for BG/RU/EN; a full-page mobile BG screenshot was also captured. No formal mobile overflow/console audit or PageSpeed/Lighthouse comparison was performed.
- Comparison against the pre-activation backup confirmed the original BG Portable Text blocks are unchanged after excluding the seven inserted marker blocks; RU/EN descriptions match exactly after removing the seven marker lines. Hero, gallery assets/order/ALT, lead form, related content, SEO, advantages, steps and CTA are unchanged. The price paragraphs are unchanged because the descriptions differ only by marker insertions.
- The separate blog article `52238416-ea46-4ba0-aa25-31c8b46ed6b8` was not modified. No Sanity schema, D1, Resend, Cloudflare settings/secrets, Header, navigation or Footer changes were made.
