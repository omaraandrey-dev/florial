ALTER TABLE orders ADD COLUMN subtotal_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN delivery_fee_cents INTEGER;
ALTER TABLE orders ADD COLUMN total_cents INTEGER;

CREATE TRIGGER IF NOT EXISTS trg_order_money_insert
BEFORE INSERT ON orders
WHEN NEW.subtotal_cents < 0
  OR (NEW.delivery_fee_cents IS NOT NULL AND NEW.delivery_fee_cents < 0)
  OR (NEW.total_cents IS NOT NULL AND NEW.total_cents < 0)
BEGIN
  SELECT RAISE(ABORT,'Order monetary amounts must be non-negative cents');
END;

CREATE TRIGGER IF NOT EXISTS trg_order_money_update
BEFORE UPDATE OF subtotal_cents,delivery_fee_cents,total_cents ON orders
WHEN NEW.subtotal_cents < 0
  OR (NEW.delivery_fee_cents IS NOT NULL AND NEW.delivery_fee_cents < 0)
  OR (NEW.total_cents IS NOT NULL AND NEW.total_cents < 0)
BEGIN
  SELECT RAISE(ABORT,'Order monetary amounts must be non-negative cents');
END;
