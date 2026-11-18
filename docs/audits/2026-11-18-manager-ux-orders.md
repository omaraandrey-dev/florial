# Manager UX — responsive order workspace

**Date:** 2026-11-18  
**PR:** #382  
**Scope:** Presentation-only refinement of the existing orders module.

## Changes

- Reflowed the order filters to use two columns on small screens and five columns on wide screens.
- Made the order list a separately scrollable column on wide screens and kept the selected order details visible while browsing.
- Improved order-card hover, keyboard focus, and selected-state semantics with `aria-pressed`.
- Improved the order page refresh action and detail-card spacing/visual hierarchy.
- Preserved all existing filters, pagination, status/payment controls, edit form, catalogue picker, PDF/email actions, internal notes, deletion confirmation and event history.

## Boundaries

- No role checks, permission props, server authorization, API calls/contracts, D1 schema/data, Sanity data, Cloudflare settings/secrets, Resend, or public storefront components changed.
- No order was created, edited, deleted, emailed or otherwise written during this UI change.
- All visible interface copy remains Bulgarian.

## Verification

- Source diff reviewed against the existing component; only JSX presentation attributes/classes and the selected-card accessibility state were changed.
- GitHub Actions for the current branch head must be checked against the exact final SHA.
- Local build/type-check not run because this environment cannot resolve `github.com` for repository checkout.
- Cloudflare Pages Preview is disabled for feature branches in the recorded project configuration. Browser visual QA and role-based live QA are not claimed.

## Follow-up

- Review service-lead and contract-withdrawal responsive layouts.
- Run exact-head CI, review the complete PR diff and confirm no changes to business behavior.
- Merge and Production release require the owner's separate explicit approval.
