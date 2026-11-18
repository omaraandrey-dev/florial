# Manager UX — service leads and contract withdrawals

**Date:** 2026-11-18  
**PR:** #382  
**Scope:** Responsive presentation and keyboard interaction for existing service-lead and contract-withdrawal screens.

## Changes

- On wide screens, the request list is independently scrollable and the selected request details remain visible while browsing.
- The two-column layout now activates at extra-large viewport widths, allowing narrower tablets to keep a readable stacked layout.
- Request cards expose their selected state through `aria-pressed` and have visible keyboard focus treatment.
- Refresh actions have a consistent minimum touch target and focus styling.
- Existing search/filter fields, request details, assignment/status controls, internal notes, confirmation resend, and event history are preserved.

## Boundaries

- No permission checks, API contracts, D1 schema/data, email delivery, Cloudflare configuration/secrets, Sanity content, or public storefront components changed.
- No live service request or contract-withdrawal record was changed; no email was sent.
- Interface text remains Bulgarian.

## Verification

- Source-level diff reviewed for the two components; modifications are limited to responsive layout, focus/selection presentation and accessible selected-state attributes.
- Exact-head GitHub Actions must be checked for the final branch SHA.
- Local build/type-check not run because the execution environment cannot resolve `github.com`.
- Feature-branch Pages Preview is disabled in the recorded project configuration; no browser visual QA is claimed.

## Follow-up

- Perform desktop/mobile visual QA and role-based QA when a safe Preview path is available.
- Recheck the final PR diff and exact-head CI before merge. Merge and Production release require separate explicit owner approval.
