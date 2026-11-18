# Florial — main branch authority and historical refs

Policy updated: 2026-11-18  
Repository: `omaraandrey-dev/florial`  
Main branch: `main`

## Authoritative branch

**`main` is the only main, authoritative and permanent branch of Florial.** GitHub code, project documentation and technical decisions are considered current only when present in the latest `main` HEAD.

Cloudflare Pages Production deploys from `main`. A non-main branch does not become a Production source merely because it exists or receives a push.

## Other branches

All non-main branches are classified as historical or auxiliary refs. The owner has decided that no further branch-by-branch inventory, comparison, recovery exercise or cleanup is required for ordinary project work.

- Do not inspect, compare, resume, merge or delete old branches as routine maintenance.
- Do not use an old branch as the base for new work.
- Start each new task from the current live `main` HEAD.
- Return to a particular historical branch only when the owner explicitly names it and asks to recover or inspect it.
- Existing historical refs may remain in GitHub indefinitely. Their presence alone is not an open task, a release blocker or evidence of unmerged work.

## New work and shared documentation

1. Fetch the current `main` HEAD before creating a working branch.
2. Create the working branch from that exact SHA.
3. Keep shared documentation changes consolidated: `CHANGELOG.md`, `docs/TECHNICAL_PASSPORT.md`, `docs/AI/OPEN_QUESTIONS.md`, `AI_INSTRUCTIONS.md` and `docs/AI/WORK_PROTOCOL.md`.
4. Before merge, check the exact PR diff, current base/head, mergeability and overlapping changes.
5. After merge, verify the resulting `main` and update documentation as required.

## Repository governance

The GitHub metadata check on 2026-11-18 reported `main.protected=false` and no repository rulesets. This is separate from branch authority: `main` remains the sole source of truth regardless. The owner may configure branch protection in GitHub settings if desired; this is not a reason to inspect or clean historical refs.

## Status

- Main authority: established.
- Non-main refs: historical/auxiliary; intentionally retained and ignored in routine work.
- Branch-by-branch cleanup: not required by owner decision.
- Production source: `main`.
