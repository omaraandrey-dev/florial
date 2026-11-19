# Manager proforma — Florial company identity block

Date: 2026-11-19
Base: `main` at `4409b50157e2115c542893585e29d8a1a355b20c`

## Change

- Added the documented Florial legal/business identity and customer-facing contact details to the shared PDF proforma generator.
- The existing Manager action continues to generate one PDF, email it to the customer and active Owner, and return those same PDF bytes for immediate browser download.
- Added a regression test for the company identity block.

## Data source and limitations

The displayed company details are copied from the BG/RU/EN privacy-policy content in `src/pages/PrivacyPolicyPage.tsx`: „Флориал“ ООД / Florial Ltd; UIC 206978288; VAT BG206978288; representative Desislav Barakov; Nessebar garden-centre contact address; omaraandrey@gmail.com; +359 876 777 902; +359 885 834 860.

The project Technical Passport marks the privacy-policy/legal details as pending legal review. The contact address is not represented as a verified registered office. UIC/VAT/representative/registered-address details have not been independently checked against the Bulgarian Commercial Register or NRA.

Bank name, account holder, IBAN, BIC/SWIFT and payment reference are not present in the verified project source and were not added. No DROP project banking data was reused.

The PDF remains a proforma/order confirmation, not a tax invoice. No D1, Sanity, Cloudflare settings/secrets, Resend configuration or live email was changed or exercised.

## Verification

Pending CI and PR review. No claim of Production deployment or live email delivery.
