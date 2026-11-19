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

## Verification
- Pending exact-head CI and Pages Preview.
- Live Resend delivery, authenticated role QA and Production deployment are not claimed.
