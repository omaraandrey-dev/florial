# Manager orders — refined order card and dual-recipient proforma delivery

Date: 2026-11-19
Base: main at b5d68acfb45b4c138e61b581f81bc03a66f47bf8

## Scope
- Improve the expanded order card hierarchy: order/status header, customer contacts, delivery/payment summary, compact item rows with images/SKU/quantity/line totals, and stronger total amount.
- Make telephone and email contacts actionable.
- Keep edit/save/cancel placement stable, preserve PDF download, and make proforma sending the prominent combined action.
- A single proforma action generates one PDF, emails it to the saved customer email and BCCs the active Owner account email stored in D1 `catalog_staff_profiles`, then returns those same PDF bytes to the browser for immediate download.
- If customer and owner addresses are identical, only one delivery is made.
- The endpoint returns a PDF attachment only after successful email delivery; errors remain JSON. Audit event records the dual-recipient delivery.

## Boundaries
- No D1 schema/data migration, Sanity writes, Cloudflare settings/secrets, or Production changes.
- No real email was sent during implementation or CI.
- Owner email is resolved at request time from the active Owner profile in D1. No owner email value was read during implementation.

## Merge and post-merge verification
- PR #427 was squash-merged into `main`: [merge commit `4409b50157e2115c542893585e29d8a1a355b20c`](https://github.com/omaraandrey-dev/florial/commit/4409b50157e2115c542893585e29d8a1a355b20c).
- `main` was read back and confirmed at that exact merge commit.
- On the exact merge commit, D1 migration validation run [44588380319](https://github.com/omaraandrey-dev/florial/actions/runs/44588380319) succeeded.
- Cloudflare Pages check completed successfully and published Preview https://dcca99df.florial.pages.dev from commit `4409b50`.
- Blog and Studio validation run [44588380259](https://github.com/omaraandrey-dev/florial/actions/runs/44588380259) was still in progress at the time of this audit update. Its website tests, build, migration syntax and read-only dry-run steps had completed successfully; Studio dependency installation/typecheck/build were still running.
- Production deployment, live Resend delivery, and authenticated Owner/Manager/Seller browser QA are not claimed.
- No live order or customer email was created or modified during CI.

## Earlier PR-head verification
- Source commit checked: `3c705839a889ee0a55ebf608236c96abc494d4c7`.
- Blog and Studio validation run [44587661876](https://github.com/omaraandrey-dev/florial/actions/runs/44587661876) — success.
- D1 migration validation run [44587660642](https://github.com/omaraandrey-dev/florial/actions/runs/44587660642) — success.
- Cloudflare Pages Preview deployment `0344114c-ea00-4802-aa5d-407aa5ee60a1` succeeded from source commit `3c705839`.
