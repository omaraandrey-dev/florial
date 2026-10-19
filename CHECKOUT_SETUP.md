# Checkout deployment setup

The checkout API is implemented as a Cloudflare Pages Function at `functions/api/orders.ts` and is available at `POST /api/orders`.

## Required Cloudflare Pages variables

In **Cloudflare Dashboard → Workers & Pages → Florial project → Settings → Variables and Secrets**, add these for the production environment (and preview environment if you want to test preview deployments):

- `SUPABASE_URL` — Supabase project URL, for example `https://YOUR_PROJECT_REF.supabase.co`.
- `SUPABASE_SERVICE_ROLE_KEY` — the Supabase **service_role** secret. Store it as a secret; never add it to a `VITE_...` variable or frontend code.

Optional variables (the current public catalog defaults are already configured in the function):

- `SANITY_PROJECT_ID` — defaults to `kjkc2aazayha1zdg3opyp8uc`.
- `SANITY_DATASET` — defaults to `production`.

Redeploy after adding or changing variables.

## What the endpoint does

- Validates customer contact fields and cart quantities.
- Re-reads active product IDs and current prices from Sanity; client-supplied prices are only compared to detect stale carts, never used to calculate the saved subtotal.
- Inserts the order into `public.orders` using the existing `subtotal` column and the server-side Supabase secret.
- Returns an order number only after Supabase confirms the insert. The cart is cleared only after that response.

## Before launch

- Test a successful order and verify the record in Supabase.
- Test a changed product price, inactive/missing product, invalid quantity, and missing server variables.
- Configure transactional email and customer/seller documents in a separate step.
- Econt city/office lookup and shipping-price integration are not part of this first endpoint yet.
