# Florial — CURRENT STATE

> Snapshot date: 2026-11-12. This is a concise handoff document for ChatGPT, Claude, Gemini and developers. It does not replace the mandatory startup protocol, detailed technical passport, source code or live-service checks.

## 2026-11-12 — FLORIAL STABLE BASELINE

- Stable baseline name: `FLORIAL-STABLE-2026-11-12`.
- Immutable source commit: `d72b9bfdd7036359e1eb2d13f819d24a8bb6c388` ([GitHub commit](https://github.com/omaraandrey-dev/florial/commit/d72b9bfdd7036359e1eb2d13f819d24a8bb6c388)).
- Stable reference branch created: `stable/florial-2026-11-12`, pointing to the exact commit above. The commit SHA is the authoritative immutable identifier; the branch is a convenient pointer and must not be moved.
- Cloudflare Pages Production deployment: `df1c81a8-4646-4d0e-9871-d389e5523a89`, URL `https://df1c81a8.florial.pages.dev`, environment `production`, deployment stage `success`; deployed from the same commit SHA. Production aliases at verification: `https://florial-bg.com` and `https://www.florial-bg.com`.
- GitHub Actions run `43100886700` for the exact commit completed with conclusion `success`: [workflow run](https://github.com/omaraandrey-dev/florial/actions/runs/43100886700).
- The baseline captures the repository source and the successful Pages deployment identity. It is **not** a database snapshot: no D1 backup or Sanity export was created as part of this checkpoint. No D1/Sanity/Resend data, schema, Cloudflare settings, secrets, bindings or DNS were changed.
- The latest documented D1 audit remains the read-only audit dated 2026-11-11 in this passport; its table-count metadata discrepancy and unconfirmed full SQLite integrity check remain open. Do not imply that this baseline can restore D1 or Sanity data.
- A Git tag/GitHub Release was not created in this operation because the connected GitHub actions available here expose branch creation but not Git tag or Release creation. The immutable commit SHA plus stable branch and deployment ID provide the current code/deployment reference. Create a true tag/release separately when a Git tag write operation is available.
- Restore target for application code: deploy the exact commit `d72b9bfdd7036359e1eb2d13f819d24a8bb6c388`; verify compatibility with the current D1 schema and external services before any rollback. Do not roll back D1 or Sanity by restoring this code reference alone.

---

## Project and source of truth

- Repository: [omaraandrey-dev/florial](https://github.com/omaraandrey-dev/florial), primary branch: `main`.
- Main code/documentation source: GitHub `main`. Permanent technical knowledge belongs only in this repository.
- Business: Bulgarian online store for irrigation equipment, ready-made kits and plants, with related landscaping, planting, irrigation design/installation and maintenance services.
- Main language: Bulgarian; additional languages: Russian and English. Currency: EUR. Production domain: https://florial-bg.com.
- Priority geography: Bulgarian Black Sea coast, including Nessebar, Ravda, Sunny Beach, Sveti Vlas, Aheloy, Pomorie and nearby settlements. Do not add Sozopol to new geo-content without owner approval.

## Active architecture

- Sanity — products, plants, categories, services and editorial content.
- Cloudflare Pages and Pages Functions — website hosting and server-side APIs.
- Cloudflare D1 — orders and Manager data.
- Resend — transactional email.
- Supabase is retired and excluded from the active runtime. Historical Supabase material under `docs/archive/supabase/` is archival only; do not execute or restore it.
- Wix and Lovable are not the foundation of Florial.

## Latest verified repository and CI state

- Latest main commit checked for this snapshot: `2dba36582e8e19079eef6ad80108d882bd85c218` (PR #216 documentation merge).
- GitHub Actions run [43099079700](https://github.com/omaraandrey-dev/florial/actions/runs/43099079700) on that commit: **success**. Job `validate` passed dependency installation, lint, website build, Pages Functions syntax, additive plant audit migration validation and contract withdrawals migration validation.
- Older run `43095667280` for `6c65e01e7c8d99994669158fe0aeb120136bebfa` remains queued with no jobs/conclusion. The newer run passed; the older run was not cancelled or rerun.
- Cloudflare Production deployment previously verified for commit `6c65e01e7c8d99994669158fe0aeb120136bebfa`: deployment `f2114ff2-9efe-480b-a4c9-ced4d24da3dc`, status success, aliases `florial-bg.com` and `www.florial-bg.com`. A deployment specifically for docs-only commit `2dba365...` was not established in this audit and is not required to infer runtime changes.

## Production D1 — read-only audit 2026-11-11

- Database: `florial-db`, region `EEUR`, approximately 1.9 MB.
- `sqlite_master` query returned 17 application tables. Cloudflare database-list metadata reported `num_tables: 0`; this mismatch is unresolved and should be rechecked.
- Live migration ledger: continuous `0001` through `0014`; latest recorded migration: `0014_contract_withdrawals`.
- Observed counts: orders 7; order_events 26; catalog_staff_profiles 2 (Owner and Manager, both active); manager_sessions 2 (expired 0); catalog_submissions 15; catalog_submission_events 57; catalog_stock_events 60; manager_product_audit 120 (60 started, 60 success, 0 failed); service_leads 2; contract_withdrawals 1 (confirmation status `sent`).
- `api_rate_limits`: 5 expired records. Current code has 1% best-effort cleanup on eligible requests; this count alone is not evidence of malfunction.
- Relationship checks: zero orphan permission events, stock events, submission events, manager sessions, product audit rows and order events. No negative order amounts found.
- Full `PRAGMA integrity_check` and `PRAGMA foreign_key_check` were not reliably confirmed through the API invocation. **Full SQLite integrity is not confirmed.**
- Audit was read-only: no D1 writes, migrations, schema changes or data changes.

## Cloudflare legacy variables

- A live audit of Pages project `florial` found four legacy Supabase-named variables in Production and two in Preview. Values were not read or exposed.
- A static scan of 115 tracked source/functions/workflow/config files at commit `6c65e01...` found no Supabase runtime references in `src/**`, `functions/**` or `.github/workflows/**`; no Supabase SDK in `package.json`; `.env.example` documents public Sanity settings; `src/lib/sanity.ts` reads `VITE_SANITY_*`.
- They appear unused by current code, but **must not be deleted without explicit owner approval**. No Cloudflare settings or secrets were changed.

## Open checks and boundaries

- Hosted Sanity Studio build/deployment after recent plantCare schema additions: not confirmed in the latest documented check.
- Repeat Gemini live smoke test with an authorized Manager session and approved test record; previous root cause remains unconfirmed.
- Recheck the D1 metadata/table-count discrepancy and, if supported, run a reliable read-only SQLite integrity/foreign-key check.
- D1 migration 0014 has been seen in the live migration ledger; resolve historical roadmap status conflicts before any future D1 migration work.
- Legacy Cloudflare variable removal requires explicit owner approval.
- Never infer live service status from this snapshot alone. Re-read current `main`, the relevant source/configuration and the live service before changes.

## Required startup reading

1. [AI_INSTRUCTIONS.md](../../AI_INSTRUCTIONS.md)
2. [START_HERE.md](START_HERE.md)
3. [WORK_PROTOCOL.md](WORK_PROTOCOL.md)
4. [MASTER_SPEC.md](MASTER_SPEC.md)
5. [TECHNICAL_PASSPORT.md](../TECHNICAL_PASSPORT.md)
6. [CHANGELOG.md](../../CHANGELOG.md)
7. [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md)
8. Relevant source, tests, workflows and live services for the task.

This file is a dated summary. Update it only when new evidence materially changes the confirmed state, and record substantial updates in `CHANGELOG.md`.
