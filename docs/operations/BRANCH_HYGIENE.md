# Florial — Git branch hygiene and source-of-truth policy

Snapshot: 2026-11-18  
Repository: `omaraandrey-dev/florial`  
Default branch: `main`

## Verified inventory

- GitHub branch listing returned **416 refs total**, including `main`; therefore **415 non-main refs** existed at this snapshot.
- Open Pull Requests: **0**.
- The repository default branch is `main`.
- GitHub branch metadata reports `main` as `protected=false`; the repository rulesets query returned an empty list. The branch-protection details endpoint was not accessible to the connected integration. Treat `main` as not protected until the owner verifies and configures it.
- Cloudflare Pages Production is configured to deploy from `main`. Preview deployment setting includes all branches (`*`).

## What the branch list means

The 415 non-main refs are historical working branches, checkpoints, content/audit branches and earlier feature experiments. They are **not** current project baselines and must not be used as the starting point for new work.

A branch name alone does not prove its contents are merged. Some refs may contain unique commits, recovery checkpoints or paused engineering work. They have not been deleted or force-updated in this cleanup. The current GitHub connector exposes no branch-delete operation, and a bulk deletion without a branch-by-branch comparison would be unsafe.

## Explicit source-of-truth rules

1. **Only `main` is authoritative.** Always fetch its live HEAD before any new technical work.
2. Create every new working branch from the exact current `main` SHA.
3. Do not resume an old `feat/*`, `feature/*`, `fix/*`, `content/*`, `design/*`, `docs/*`, `audit/*`, `perf/*`, `test/*` or other non-main branch just because it exists.
4. Before reusing an old branch, compare it with current `main`, inspect its unique commits and changed files, check whether its PR was merged/closed, and reconcile any useful work through a fresh branch from main.
5. Preserve `backup/*`, `checkpoint/*` and `stable/*` refs until their recovery value is individually reviewed. Do not treat a code checkpoint as a Sanity or D1 data backup.
6. The irrigation engineer assistant is an intentionally paused workstream after stage 7. PR #349 is merged into main at `1ddd1d99dd6cf086303c09ff2f856e96db84a8e6`; stage 8 must not start without explicit owner approval.
7. After a PR is merged, its source branch is no longer an active development baseline. Delete it manually in GitHub only after verifying the merge commit and confirming it is not a recovery checkpoint or a separately paused workstream.

## Recommended GitHub main protection

The owner should configure a branch ruleset for `main`:

- Require a pull request before merging; disallow direct pushes.
- Require successful checks: `Blog and Studio validation` and `Florial D1 migration validation`.
- Require the branch to be up to date before merge.
- Block force pushes and deletion of `main`.
- Require conversation resolution.
- Prefer squash merges for the repository's documented one-PR/one-change history; disable merge commits/rebase merges if the owner wants one consistent history.

The current integration cannot create or update GitHub branch rulesets. This is an owner-side repository setting, not a code change.

## Deployment impact

- Old refs do not change Production by themselves. Cloudflare Pages Production is tied to `main`.
- Because Preview includes all branches, a future push to an old branch may create a Preview deployment. It does not make that branch Production.
- Do not change the Cloudflare Preview pattern or delete old refs as part of this documentation cleanup.

## Cleanup status

- Open PR queue: clean (0).
- Source of truth: clear (`main` only).
- Non-main refs: retained as historical; not individually audited for unique unmerged commits and not deleted.
- Main protection: owner action still required.
- Next work: always branch from current `main`; do not use any old branch as a base.
