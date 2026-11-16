# Automatic irrigation service — localized editorial refresh

**Date:** 2026-11-16  
**Repository:** `omaraandrey-dev/florial`  
**Base main:** `5a527185bedd4b84cb588d1d01908582412655ec`  
**Sanity:** project `bxvcy0qs`, dataset `production`  
**Document:** `04c7ab3b-1888-41cb-9917-6b9014cd1ac3`  
**Slug:** `avtomatichno-napoyavane`  
**Public route:** `/services/avtomatichno-napoyavane`

## Source and editorial approach

The original DROP page was reviewed as a structural and technical reference: https://www.drop.od.ua/avtomaticheskij-poliv

The Florial page has been rewritten for the Bulgarian market and the actual Florial service scope. DROP-specific claims were not transferred: years in business, quantities of completed projects, installation deadlines, free estimates, maintenance portfolio, Odessa/Ukraine locations and other unverified promises. No fixed installation depth, guaranteed water saving, fixed completion time or universal equipment configuration is claimed.

## Sanity backup and write

- Exact pre-write document snapshot: `docs/backups/sanity/2026-11-16-automatic-irrigation-service-before-editorial-update.xml`
- Snapshot source: read-only `get_document` response, retrieved before the first write.
- Original published revision: `1qyPYQSEDVHtpwb6uCOdbD`
- First revision-guarded patch created draft `drafts.04c7ab3b-1888-41cb-9917-6b9014cd1ac3`.
- Follow-up revision-guarded patch added explicit underline markup for RU/EN Markdown and underline + bold Portable Text marks for BG.
- Current draft revision at validation: `y2TDpG5qG8p5QpVOSw8DTq`.
- Schema validation: 1 document reported `valid`; result is incomplete because custom validation callbacks (including custom slug uniqueness callbacks) are not executed by the validator. Built-in checks, including built-in slug uniqueness, ran.
- The revision-guarded draft was published after PR #350 merged. Published read-back revision: `kG84M8L0NjpttWhMhq10il` (`_updatedAt`: `2026-11-16T14:34:49Z`).
- Published document read-back confirmed the new content and localized ALT fields; the document ID and slug remain unchanged.

## Content changes

- Replaced the short BG article with a complete Portable Text article covering site survey, water-source assessment, flow and dynamic pressure, zoning, sprinkler/drip technologies, pipework, valves, filtration, controls, installation, commissioning and maintenance.
- Replaced RU and EN descriptions with complete localized Markdown articles using H2/H3 structure, paragraphs, bold emphasis, underlining, bullet lists and numbered installation checks.
- Updated BG/RU/EN short descriptions, hero subtitles, SEO title/description, advantages, work steps and CTA text.
- Updated text and localized image alt text in the three existing image-and-text content blocks.
- Added localized BG/RU/EN ALT text to the five existing gallery images.

## Preserved fields and assets

- Document ID, slug, active status, service type and route.
- Hero image asset reference.
- All three content-block image asset references.
- All five gallery image asset references.
- Existing lead form field keys, labels, required flags, submission label and structure.
- Existing CTA button label and form wiring.
- Existing document relationships and all fields not listed above.

The backup and the draft read-back contain the exact asset references. No image asset was replaced or deleted.

## Frontend formatting

Updated `src/pages/ServicePage.tsx` so the RU/EN inline Markdown renderer recognises the explicit safe `<u>…</u>` notation and renders it as a React `<u>` element. Raw HTML is not injected. Existing bold and link handling is preserved. BG underline continues to use the existing Portable Text `underline` mark renderer.

## Preview build verification

- Cloudflare Pages Preview deployment `419db0ca-5da9-4299-a0ab-58d9fb71cea0` succeeded for exact branch commit `1f485b9e27dd04b88ff4ddeede243f0ea0666394`.
- Build command: `npm run build`; build and deploy stages both reported `success`.
- Preview URL: https://content-automatic-irrigation.florial.pages.dev
- GitHub Actions PR workflow runs and commit status checks were not returned by the GitHub connector for this commit. The Cloudflare Pages build is the verified build result; lint/test scripts were not separately executed.

## Verification still required

- Review the preview rendering in BG/RU/EN, desktop and mobile.
- Review the PR diff and preview rendering in BG/RU/EN, desktop and mobile.
- Publish the Sanity draft only after the frontend formatting change is integrated; then read back the published document and verify all image references, SEO fields, CTA and lead form.
- Confirm the production page renders correctly. Google recrawl/indexing is not implied by publication.

## Scope exclusions

No Sanity schema changes, slug/URL changes, image replacement, lead-form changes, related-content changes, header/menu/footer changes, Cloudflare settings, D1, Resend or Production deployment were made in this work item.
