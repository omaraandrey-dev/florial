-- Security hardening for the public Supabase Data API.
-- Applied to the production project on 2026-10-22 and verified with privilege checks.
-- Safe to re-run: policy removal and grants are idempotent.
--
-- Orders must be created only by the Cloudflare Pages Function using the
-- server-side SUPABASE_SERVICE_ROLE_KEY. The browser must never write orders
-- directly to Supabase.
drop policy if exists "public can create orders" on public.orders;

revoke all privileges on table public.orders from anon, authenticated, public;
revoke all privileges on table public.products from anon, authenticated, public;
revoke all privileges on table public.product_categories from anon, authenticated, public;

-- The public catalog can read active records only; RLS policies enforce active = true.
grant select on table public.products to anon, authenticated;
grant select on table public.product_categories to anon, authenticated;
