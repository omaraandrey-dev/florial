# Documentation reconciliation handoff — 2026-11-25

## Scope completed on documentation branch

- Updated the repository-wide branch policy: `develop` is the single permanent development branch; `main` remains Production.
- Updated AI instructions, START_HERE, WORK_PROTOCOL and BRANCH_HYGIENE to describe the same workflow.
- Reconciled the SSR Content v1 roadmap against merged PRs #533–#542 and the open product SSR PR #543.
- Preserved explicit distinctions between Preview evidence, main integration and separately verified Production evidence.

## Owner boundary: PR #409 untouched

PR #409 remains open exactly as requested. Its base/head, comments, status and branch were not changed. The following files are in its diff and were deliberately not edited:
- `CHANGELOG.md`
- `docs/AI/CURRENT_STATE.md`
- `docs/AI/OPEN_QUESTIONS.md`
- `docs/TECHNICAL_PASSPORT.md`
- `docs/audits/2026-11-18-google-shopping-seo-stage-1-audit.md`
- `docs/roadmaps/GOOGLE_SHOPPING_SEO_ROADMAP_2026-11-18.md`

These shared records require a later reconciliation after the owner decides what to do with PR #409. Do not copy its older-base diff over newer main content.

## Current SSR state

- Homepage, services directory and service detail work have been merged; production evidence exists for homepage and service details.
- Blog index and article detail PRs #540/#541 are merged to main. Preview evidence exists; separate Production raw-HTTP verification should be confirmed before describing them as fully Production-verified.
- Equipment category SSR PR #542 is merged to main. Its audit records exact Preview validation; separate Production smoke should be confirmed.
- PR #543 remains open for individual equipment product pages. It is the next active SSR acceptance task; no Production release is included.

## Branch migration

The permanent `develop` branch is to be created from the latest `main` after this documentation policy is merged. Existing PR #543 is a transition exception and should be completed without opening additional feature branches. Future work proceeds only on `develop`; releases go through a single `develop → main` PR.

## Verification boundary

This document records repository/documentation state only. It does not claim application CI, Cloudflare Preview, Production deployment, or live route verification.
