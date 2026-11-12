# FLORIAL — Stable Baseline 2026-11-12

## Purpose

This record identifies the Florial Production code version accepted by the owner as the stable recovery baseline on 2026-11-12. It is a code recovery reference, not a complete infrastructure or data backup.

## Verified Production deployment

- Cloudflare Pages project: `florial`
- Production deployment: `df1c81a8-4646-4d0e-9871-d389e5523a89`
- Deployment status: `success`
- Created: `2026-11-11T21:11:11.72945Z`
- Production aliases: `https://florial-bg.com`, `https://www.florial-bg.com`
- Source branch: `main`
- Source commit: `d72b9bfdd7036359e1eb2d13f819d24a8bb6c388`
- Commit: `docs: add current state and D1 audit`
- Cloudflare reports `commit_dirty: false`.

## Git recovery reference

- Stable branch: `stable/FLORIAL-STABLE-2026-11-12`
- It was created from exact commit `d72b9bfdd7036359e1eb2d13f819d24a8bb6c388`.
- This is a branch reference, not an immutable Git tag. Do not move or delete it. An immutable tag/Release was not created because the connected GitHub actions expose branch creation but not Git tag/Release creation.

## Cloudflare D1 export

- Database: `florial-db`
- Database ID: `5fbb0e47-8439-493c-821a-6945eef7d8b2`
- Export type: D1-compatible SQL
- Export status: `complete`
- Export bookmark: `000002fc-00000000-00005121-873c7bd479797dbde731b84db92aba66`
- Export filename: `5fbb0e47-8439-493c-821a-6945eef7d8b2-000002fc-00000000-00005121-873c7bd479797dbde731b84db92aba66.sql`
- Cloudflare returned a temporary signed download URL valid for 1 hour. The SQL export must be downloaded and stored by the owner in a secure backup location. The URL itself is not persisted in this repository.
- The export was read-only with respect to the live D1 database; no writes or migrations were performed.

## Sanity datasets

- Project: `bxvcy0qs` (Florial)
- Datasets: `production`, `plants`.
- Sanity dataset-copy attempts were rejected because the current plan does not include advanced dataset management.
- Enabling managed dataset backups was also rejected because the current plan does not include the backups feature.
- Therefore no independent Sanity dataset snapshot was created. Do not claim that Sanity data is backed up by this baseline.
- A durable Sanity backup requires a supported plan/backup capability or a separately implemented and verified export process.

## Recovery boundaries

- The Git branch restores the website source at the recorded commit; it does not restore live Sanity content, D1 state, Cloudflare bindings/secrets, DNS or Resend configuration.
- Restoring an old D1 export over the live database can erase newer orders and Manager activity. Any restore must be separately approved and planned.
- The Sanity backup gap remains open until a successful export/copy is verified.
- Before any future rollback, compare the target commit with current production data/schema and current Cloudflare configuration.

## Verification classification

- Production deployment and aliases: checked against live Cloudflare Pages API.
- Deployment source commit: checked against live Cloudflare Pages deployment metadata.
- Stable branch creation: GitHub API returned success; branch search confirms the branch exists.
- D1 export: Cloudflare API returned `status: complete` and a SQL filename/download URL.
- Sanity copy/managed backup: not completed; blocked by current Sanity plan.
