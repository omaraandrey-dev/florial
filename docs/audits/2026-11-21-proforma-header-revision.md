# Proforma header revision — 2026-11-21

## Owner-approved changes

The owner reviewed the first Production proforma email/PDF and approved these presentation corrections:

- Use the same legal registration and bank details shown on the published About page.
- Keep only the public contact phone `+359 876 777 902`.
- Place a single centered `ПРОФОРМА` heading at the top. Do not label the document `ФАКТУРА`.
- Remove the separate `ДЕТАЙЛИ НА ПОРЪЧКАТА` section heading; show the delivery line and then the items table directly.
- Preserve the existing footer/signature area.

## Implementation scope

- Updated `functions/api/_lib/order-documents.ts` only for the first-page header and the transition into the items table.
- Seller details now include legal name, UIC, VAT number, manager, registered address, DSK Bank, IBAN, BIC/SWIFT, the approved phone and company email.
- Existing totals, VAT calculation, payment warning/terms, page continuation, signatures and footer are unchanged.
- Added source-level regression assertions in `tests/bank-transfer-proforma.test.mjs`.

## Verification

- Base branch: `main` at `9680026a417e312a145bf7ea03d96e62222e2d23`.
- Production data, Sanity, D1, Cloudflare settings/secrets and Resend were not changed.
- No live orders or emails were created for this code change.
- Visual rendering and CI status are pending PR validation and a fresh owner-side PDF check.
