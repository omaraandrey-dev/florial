# Checkout deployment setup

The checkout API is implemented as a Cloudflare Pages Function at `functions/api/orders.ts` and is available at `POST /api/orders`. Order persistence uses Cloudflare D1; Sanity remains the authoritative source for current product prices and availability.

## Required Cloudflare Pages binding

In **Cloudflare Dashboard → Workers & Pages → Florial project → Settings → Functions → D1 database bindings**, bind the production D1 database `florial-db` using the binding name `DB`. This is a D1 binding, not a text variable or secret. Preview should use a separate test database before any preview checkout testing.

Optional variables (the current public catalog defaults are already configured in the function):

- `SANITY_PROJECT_ID` — defaults to `bxvcy0qs`.
- `SANITY_DATASET` — defaults to `production`.

Optional email notifications via Resend:

- `RESEND_API_KEY` — Resend API key, stored as a secret.
- `EMAIL_FROM` — sender address on a domain verified with Resend.
- `ORDER_NOTIFICATION_EMAIL` — seller inbox that receives new-order notifications.
- `PROFORMA_FONT_URL` — optional URL for a Unicode TTF font used in the Bulgarian PDF; defaults to Noto Sans.

When configured, the function sends an order email to the seller and a confirmation to the customer if they entered an email address. The Bulgarian proforma PDF is attached when PDF generation succeeds. PDF/email failures are logged but do not turn a successfully saved order into a checkout error.

Redeploy after adding or changing variables.

## What the endpoint does

- Validates customer contact fields and cart quantities.
- Re-reads active product IDs and current prices from Sanity; client-supplied prices are only compared to detect stale carts, never used to calculate the saved subtotal.
- Inserts the order into таблицу `orders` using a prepared statement against the server-side D1 binding.
- Returns an order number only after D1 confirms the insert. The cart is cleared only after that response.

## Before launch

- Test a successful order and verify the record in Cloudflare D1.
- Test a changed product price, inactive/missing product, invalid quantity, and missing server variables.
- Configure transactional email with a verified sender domain and test both seller and customer delivery.
- Verify the generated Bulgarian proforma PDF, including Cyrillic text, on the deployed environment before using it with customers. Bank details are not included until confirmed.
- Econt city/office lookup and shipping-price integration are not part of this first endpoint yet.


## Primary website domain

The selected primary public website URL is `https://florial-bg.com`.

- `index.html` declares this as the homepage canonical URL and Open Graph URL.
- The React app updates the canonical and Open Graph URL to use this primary hostname and the current SPA path.
- Cloudflare Pages custom-domain attachment, DNS records, HTTPS status, and redirects from any secondary domain must be verified in the Cloudflare dashboard before considering the domain setup complete.
- Do not configure a redirect from a secondary domain until its exact registered spelling and ownership are confirmed.
- The order endpoint uses a relative same-origin path (`/api/orders` from the site), so it does not require a separate domain change. D1 is accessed through the server-side binding and does not require a public database URL.
- Transactional email currently uses Resend in `functions/api/orders.ts`; the sender is controlled by `EMAIL_FROM`. Verify the sending domain in Resend and add the provider's exact DNS records in Cloudflare before switching the sender address.


## Database security

- The browser must submit orders only to `POST /api/orders`; it has no direct D1 access.
- The Cloudflare Pages Function validates product IDs, prices, stock, quantities and delivery details, then writes through the server-side D1 binding.
- D1 binding name is `DB`; never expose a D1 binding or server-side API token in browser code.
- Sanity remains the authoritative source for catalog products, plants, current prices and images.
- Resend and Sanity tokens remain server-side secrets. Never prefix server-side secrets with `VITE_` or commit them to Git.
- Historical Supabase migrations are retained only as an archive of the previous backend and are not used by the D1 runtime.


## Checkout delivery options (2026-10-27)

The checkout UI and `POST /api/orders` branch changes add two active delivery methods:

- `pickup`: free store pickup with a free engineer consultation notice.
- `courier`: requires one of the 30 published settlements and a street address. The server calculates the fee from its own allowlist; it does not trust a fee supplied by the browser.
- Econt is displayed as disabled until the delivery arrangement is confirmed.

The current settlement/rate allowlist matches `src/pages/IrrigationSupportPage.tsx`: Sunny Beach €0; 12 settlements at €10; 7 settlements at €15; Dubnik €17; 5 settlements at €20; 4 settlements at €25. The exact names and prices are enforced in both `src/pages/CartPage.tsx` and `functions/api/orders.ts`.

Customer email is required in the UI and API so the order confirmation can be sent. Order email and PDF show the selected delivery method and delivery fee. The D1 `orders` table stores the human-readable delivery method, delivery fee, product subtotal and final total in separate fields.
