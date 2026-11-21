# Florial — branded proforma and confirmation lifecycle audit

Date: 2026-11-21  
Base: `main` at `edc7d63f7eff1126398f271f51768018eba85392`  
Working branch: `feat/proforma-confirmation-branded-pdf`

## Scope

- Replace the text-only PDF with an A4 portrait branded proforma.
- Reuse the official Florial logo already published in Sanity and used by the website header; do not change the website Header or edit Sanity.
- Separate pending and confirmed proforma states.
- Start the five-calendar-day payment term from the confirmation event, not order creation or PDF generation.
- Invalidate confirmation after changes to item identity, quantity, unit price, delivery method or delivery fee.
- Preserve the existing D1 schema and order audit log; no migration.

## Official logo source

Published Sanity document:
- Slug: `oficialno-logo-florial-gradinski-centar`
- Document ID: `bf2d25a6-cefe-4d25-9145-3b45a206299b`
- Asset ID: `image-70904998847fbf96afd2f2994203b4ddc45a75f2-841x289-png`
- Published CDN URL: `https://cdn.sanity.io/images/bxvcy0qs/production/70904998847fbf96afd2f2994203b4ddc45a75f2-841x289.png`
- PNG dimensions: 841 × 289.

The PDF embeds the published PNG bytes. No Sanity document or asset is modified.

## Document behavior

### Pending

- Status: `ОЧАКВА ПОТВЪРЖДЕНИЕ`.
- Prominent warning: `ВАЖНО — МОЛЯ, НЕ ИЗВЪРШВАЙТЕ ПЛАЩАНЕ`.
- No payment deadline is shown.
- The provisional order total may be displayed, but the customer is explicitly told not to transfer funds before final confirmation.

### Confirmed

- Manager action: `Потвърди наличност и сума + изпрати окончателна проформа`.
- Allowed only for Owner/Manager, bank-transfer orders, known final total/delivery and valid customer + active owner email addresses.
- Writes `proforma_confirmed` into the existing `order_events` table.
- Sends the same final PDF to the customer and active owner (owner as BCC unless the addresses are identical).
- The issue/confirmation date is the confirmation event timestamp. The due date is five calendar days later in Europe/Sofia.
- Resend idempotency key is deterministic for the order version to reduce duplicate sends on retry.

### Invalidation

An edit that changes item identity, quantity, unit price, delivery method or delivery fee writes `proforma_confirmation_invalidated`. The latest lifecycle event determines whether the PDF is pending or confirmed. A new confirmation is required before the final deadline is reactivated.

## PDF layout

- A4 portrait.
- Three-column header: official logo + seller details, document number/dates/status, customer details.
- Dark green table heading with white labels; alternating pale-green/white rows; thin separators.
- Columns: line number, product name/SKU, quantity, unit price, line total.
- EUR amounts with two decimals.
- Totals include goods, delivery, taxable base, VAT component extracted from VAT-inclusive gross (20/120), total payable and Bulgarian amount in words.
- Bank details, payment reference, issuer/recipient signature and stamp fields.
- Repeated item-table header on subsequent pages, no row splitting, page numbers.

## Files changed

- `functions/api/_lib/order-documents.ts`
- `functions/api/manager/order-documents.ts`
- `functions/api/manager/orders.ts`
- `src/manager/OrdersManager.tsx`
- `tests/bank-transfer-proforma.test.mjs`
- `CHECKOUT_SETUP.md`
- `CHANGELOG.md`
- `docs/TECHNICAL_PASSPORT.md`
- `docs/AI/OPEN_QUESTIONS.md`

## Verification limits

At audit creation time, implementation has not yet passed exact-commit CI, Pages Preview or Production deployment verification. PDF visual rendering has not been independently inspected. No Production order, customer email, D1 data/schema, Sanity content/schema, Cloudflare setting or secret was changed. Do not claim release readiness until exact-SHA CI and deployment results are recorded.
