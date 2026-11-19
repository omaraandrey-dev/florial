# Florial — company identity and invoicing profile

Status: working company profile compiled from the current Florial repository on 2026-11-19. It is an operational reference, not a legal opinion or a substitute for verification in the Bulgarian Commercial Register / NRA.

## Company details currently present in the website source

- Legal name (Bulgarian): **„Флориал“ ООД**
- English name used by the website: **Florial Ltd**
- UIC / ЕИК: **206978288**
- VAT number / ДДС: **BG206978288**
- Representative / МОЛ stated in the website privacy policy: **Десислав Бараков (Desislav Barakov)**
- Customer-facing address stated in the privacy policy: **Градински център „Флориал“, ул. „Хан Крум“, 8230 Несебър, България (до магазин Janet)**
- Contact email stated in the privacy policy: **omaraandrey@gmail.com**
- Telephone numbers stated in the privacy policy: **+359 876 777 902** and **+359 885 834 860**
- Website: https://florial-bg.com
- Operating market and invoice currency: Bulgaria / EUR.

## Source and confidence

The company name, UIC, VAT number, representative, address, email and telephone numbers are present in the BG/RU/EN content of `src/pages/PrivacyPolicyPage.tsx` on GitHub `main`.

The address is the customer-facing garden-centre/contact address. Do not label it as the registered seat or management address unless separately verified.

The Technical Passport records that the privacy-policy page and its legal details were awaiting legal review. The UIC/VAT/representative details therefore remain **not independently verified against the Bulgarian Commercial Register / NRA**. Before using this profile as the basis for statutory tax invoices or other legally binding accounting documents, the owner/accountant must confirm the exact registered company name, VAT status, representative and registered address.

## Bank transfer details

**NOT PROVIDED / NOT VERIFIED.** The following must not be invented or copied from the separate DROP project:

- Bank name
- Account holder as registered by the bank
- IBAN
- BIC / SWIFT
- Bank address
- Payment reference / основание за плащане

Until these are supplied and confirmed, the Florial proforma PDF must not display bank-transfer coordinates or imply that a bank account is configured.

## Use in Manager order documents

The Manager action **„Изпрати проформа + свали PDF“** generates one PDF, emails it to the customer and active Owner, and returns the same PDF for immediate download. The PDF may display the company identity/contact fields above as currently documented.

The generated document is a **proforma / order confirmation**, not a tax invoice. Do not rename it to a tax invoice or imply it is a fiscal document. Bank details and payment instructions must remain absent until verified.

## Source file

- `src/pages/PrivacyPolicyPage.tsx` — company and contact details in the privacy-policy content.
- `functions/api/_lib/order-documents.ts` — shared PDF generator used by the Manager order-document endpoint.
