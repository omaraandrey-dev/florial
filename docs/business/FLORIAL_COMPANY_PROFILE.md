# Florial — company identity and invoicing profile

Status: working company profile compiled from the current Florial repository on 2026-11-19. It is an operational reference, not a legal opinion or a substitute for verification in the Bulgarian Commercial Register / NRA.

## Company details currently present in the website source

- Legal name (Bulgarian): **„Флориал“ ООД**
- English name used by the website: **Florial Ltd**
- UIC / ЕИК: **206978288**
- VAT number / ДДС: **BG206978288**
- Representative / МОЛ stated in the website privacy policy: **Десислав Бараков (Desislav Barakov)**
- Customer-facing address stated in the privacy policy: **Градински център „Флориал“, ул. „Хан Крум“, 8230 Несебър, България (до магазин Janet)**
- Contact email confirmed by the owner on 2026-11-19: **omaraandrey@gmail.com**
- Telephone numbers: **+359 876 777 902** and **+359 88 583 4860** (same number as the previously formatted `+359 885 834 860`).
- Website: https://florial-bg.com
- Operating market and invoice currency: Bulgaria / EUR.

## Source and confidence

The company name, UIC, VAT number, representative, address, email and telephone numbers are present in the BG/RU/EN content of `src/pages/PrivacyPolicyPage.tsx` on GitHub `main`.

The address is the customer-facing garden-centre/contact address. Do not label it as the registered seat or management address unless separately verified.

The Technical Passport records that the privacy-policy page and its legal details were awaiting legal review. The UIC/VAT/representative details therefore remain **not independently verified against the Bulgarian Commercial Register / NRA**. Before using this profile as the basis for statutory tax invoices or other legally binding accounting documents, the owner/accountant must confirm the exact registered company name, VAT status, representative and registered address.

## Bank transfer details

- IBAN supplied and confirmed by the owner for use on Florial proformas on 2026-11-19: **BG88STSA93000029605234**.
- Bank name, account holder as registered by the bank, BIC / SWIFT, bank address and payment reference were not supplied; do not invent them.
- Do not copy bank details from the separate DROP project.

## Use in Manager order documents

The Manager action **„Изпрати проформа + изтегли PDF“** generates one PDF, emails it to the customer and active Owner, and returns the same PDF for immediate download. The separate **„Изтегли сметката“** action only downloads the generated PDF to the employee's device and sends no email. The PDF includes the confirmed IBAN and includes delivery/payment method only when those values are present in the order.

The generated document is a **proforma / order confirmation**, not a tax invoice. Do not rename it to a tax invoice or imply it is a fiscal document. The supplied IBAN is displayed as provided. No unprovided BIC/SWIFT, bank name or payment reference is invented.

## Source file

- `src/pages/PrivacyPolicyPage.tsx` — company and contact details in the privacy-policy content.
- `functions/api/_lib/order-documents.ts` — shared PDF generator used by the Manager order-document endpoint.
