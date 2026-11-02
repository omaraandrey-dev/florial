-- Add explicit order delivery and total amounts without rewriting existing orders.
-- NULL means the carrier price has not yet been confirmed.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_fee numeric(12, 2),
  ADD COLUMN IF NOT EXISTS total numeric(12, 2);

-- New orders default to in-store payment; the API explicitly sets a pending
-- agreement for delivery orders. Existing order rows are not modified.
ALTER TABLE public.orders
  ALTER COLUMN payment_method SET DEFAULT 'pay_in_store';

COMMENT ON COLUMN public.orders.delivery_fee IS
  'Confirmed delivery charge in EUR; NULL while the carrier quote is pending.';

COMMENT ON COLUMN public.orders.total IS
  'Confirmed order total in EUR including delivery; NULL while delivery charge is pending.';
