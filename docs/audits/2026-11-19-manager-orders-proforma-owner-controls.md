# Manager orders — proforma email and Owner-only controls

**Date:** 2026-11-19  
**Branch:** `feat/manager-orders-proforma-and-owner-controls`  
**Base:** `main` at `ab8f69d7ed34bc087dcbe8302aa4fd5fe7900810`

## Scope

- Remove the redundant client-order-list subtitle; keep the explicit list refresh action.
- Render the four order workflow counters in a two-column, two-row summary.
- Remove the generic status-change toast while retaining the actual status update and audit event.
- Keep the edit/save/cancel controls in a stable toolbar position; cancel closes the selected order, and successful save retains the existing close behavior.
- Place status and payment controls in two columns.
- Restrict order archiving and event history to Owner in both the UI and the D1-backed API.
- Add an action that generates the existing Florial order proforma PDF and emails it to the customer's saved email address as an attachment through Resend.
- Retain the standalone PDF download action. The existing document remains a proforma / order confirmation, not a tax invoice.

## Runtime and data boundaries

- No D1 schema or order data migration.
- No Sanity reads/writes, Cloudflare configuration/secrets, or Production settings changed.
- No email was sent during implementation or automated verification.
- Proforma sending is an explicit Manager UI action and is audited in the existing `order_events` table.
- Existing final-order guard remains in place for email actions.

## Verification

- Pending exact-head GitHub Actions for this branch.
- No live authenticated role QA, live Resend delivery test, or Production deployment is claimed.
