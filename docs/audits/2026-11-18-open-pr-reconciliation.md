# Florial — open PR reconciliation and main consolidation

Date: 2026-11-18  
Repository: `omaraandrey-dev/florial`  
Target branch: `main`

## Objective

Reconcile the long-lived open PR queue without merging stale branches blindly. Preserve unique historical audits, Sanity pre-write backups, release evidence and unresolved decisions in one current main history. Do not discard source branches or commits.

## Consolidation already merged

- PR #391 — rolled-turf article audit and two Sanity snapshots. Squash merge commit: `6cd8ebb8a853c37283c8e03093f360ae746407c1`.
- PR #397 — November 18 olive article, palm article and plant-category audit/backup integration; consolidated CHANGELOG, Technical Passport and OPEN_QUESTIONS. Merge commit: `7ba4660176d8520db41fc89d9b914e140612b209`.
- PR #398 — verified historical audit artifacts from PRs #381, #364, #355, #352, #298 and #278. Merge commit: `6ec7f35b87119296bc12c2d36e190dd1660424af`.

Superseded source PRs #392, #393, #396, #381, #364, #355, #352, #298 and #278 were closed after their unique content was integrated. PR #105 was closed because `/about` is already in the current sitemap; PR #78 because current CategoryPage already contains later pagination and irrigation-order logic; PR #1 because it is an obsolete Supabase checkout implementation incompatible with the current D1 architecture. No branches or commits were deleted.

## Historical documentation and backup integration in this branch

This integration preserves the unique artifacts and reconciles shared records from:
- #281 — eight missing category SEO articles across 71 categories; two pre-write snapshots.
- #279 — root flowers category BG/RU/EN SEO content and its pre-write snapshot.
- #277 and #276 — Yucca/Cycas read-only SEO audit, approved editorial corrections and pre-write snapshot.
- #258 — read-only inventory of 275 irrigation products and missing localized SEO fields.
- #234 — audit, full 14-blog-post pre-write snapshot and release record for 42 localized CTAs / 84 commercial links.
- #224 — pre-write snapshot of eight Sanity photo documents and localization audit history.
- #218 — stable code baseline and explicit recovery boundaries (not a complete D1/Sanity backup).
- #236 and #231 — category publication records for solitaires and olives.
- #208 and #206 — historical PR #207 D1-binding deployment incident and PR #205 release/protocol correction.
- #166 — performance rollback/release verification limits.
- #123 and #121 — delivery Stage 3 Production verification and mobile table correction.

The branch also reconciles `CHANGELOG.md`, `docs/TECHNICAL_PASSPORT.md`, `docs/AI/OPEN_QUESTIONS.md`, `docs/ROADMAP_PERFORMANCE_OPTIMIZATION.md` and `docs/ROADMAP_SERVICES_AND_LEADS.md`. Old content is not copied wholesale over newer files; only the unique evidence and verified status summaries are carried forward.

## PRs intentionally not imported as-is

- #334 — its 16 Nov note says the 3500 rotor is not integrated; later PRs #339/#340 added a separate 3500 candidate generator. Current prototype README and engineering gate records are newer. The owner-approved family scope and MPR exclusion are summarized in current history.
- #270 — the palm SEO plan already exists in main; the branch adds a temporary backup-policy statement that conflicts with the current mandatory Sanity backup protocol. Do not import that obsolete policy.
- #274 — the legacy Supabase environment question was later revisited in the 17 Nov open-questions record; the newer state is retained.
- #271 — Washingtonia/category verification is already represented in current CHANGELOG, Technical Passport and OPEN_QUESTIONS.
- #241 — PR #240 release is already recorded in current main.
- #103 — homepage structure work is already recorded in current main.
- #42 — current Manager architecture/setup documents are newer than the old staff-admin branch.
- #35 — current Studio schema changelog and Technical Passport are newer than the old Studio status branch.

## Verification and boundaries

- All imported Sanity backup JSON files were parsed successfully before integration.
- Backups are preserved as historical source snapshots; they are not proof of a current live backup/restore capability.
- Sanity Production content itself was not modified by this documentation consolidation.
- No runtime code, schema, D1, Resend, Cloudflare configuration/secrets, DNS, global navigation or Production deployment configuration was changed.
- No tests/build are required for documentation-only changes; GitHub Actions may not start for these files. The mergeability and exact base/head SHAs must be checked before merging.
- Production deployment status after merge must be checked separately; documentation merges can still trigger Pages deployments.

## Final reconciliation — 2026-11-18
- PR #399 merged successfully as `7e10472e999e99cebd5dd31e16f11419dd560067`, integrating the historical category, product, irrigation SEO, blog CTA, photo-media, stable-baseline and delivery/performance records listed above.
- Final consolidated main sequence for this cleanup: #391 `6cd8ebb8a853c37283c8e03093f360ae746407c1`, #397 `7ba4660176d8520db41fc89d9b914e140612b209`, #398 `6ec7f35b87119296bc12c2d36e190dd1660424af`, #399 `7e10472e999e99cebd5dd31e16f11419dd560067`.
- All 36 PRs that were open at the start of this reconciliation were reviewed. The relevant documentation and backups were integrated; superseded PRs were closed with an explanatory comment. Obsolete code PRs #1 (Supabase checkout), #78 (older catalogue pagination/sorting) and #105 (About sitemap entry already present in main) were closed without merging their stale branches.
- The remaining old PRs were closed because their unique records were already present in current main or their proposed content was superseded by later implementation/policy. No branches or commits were deleted.
- Final GitHub check: current `main` contains this reconciliation record and the subsequent documentation-only finalization updates. Open PR count is **0**. The exact current HEAD is always obtained from the live GitHub branch reference at the next project startup.
- All four merges in this consolidation were documentation-only. No runtime code, Sanity live data/schema, D1, Resend, Cloudflare configuration/secrets, DNS or Production settings were changed. Pages deployment status must still be checked separately.
