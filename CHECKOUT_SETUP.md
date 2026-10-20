# Checkout deployment setup

The checkout API is implemented as a Cloudflare Pages Function at `functions/api/orders.ts` and is available at `POST /api/orders`.

## Required Cloudflare Pages variables

In **Cloudflare Dashboard → Workers & Pages → Florial project → Settings → Variables and Secrets**, add these for the production environment (and preview environment if you want to test preview deployments):

- `SUPABASE_URL` — Supabase project URL, for example `https://YOUR_PROJECT_REF.supabase.co`.
- `SUPABASE_SERVICE_ROLE_KEY` — the Supabase **service_role** secret. Store it as a secret; never add it to a `VITE_...` variable or frontend code.

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
- Inserts the order into `public.orders` using the existing `subtotal` column and the server-side Supabase secret.
- Returns an order number only after Supabase confirms the insert. The cart is cleared only after that response.

## Before launch

- Test a successful order and verify the record in Supabase.
- Test a changed product price, inactive/missing product, invalid quantity, and missing server variables.
- Configure transactional email with a verified sender domain and test both seller and customer delivery.
- Verify the generated Bulgarian proforma PDF, including Cyrillic text, on the deployed environment before using it with customers. Bank details are not included until confirmed.
- Econt city/office lookup and shipping-price integration are not part of this first endpoint yet.
