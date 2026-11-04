-- Repair the order-created audit trigger without changing existing orders or events.
DROP TRIGGER IF EXISTS trg_orders_order_created;

CREATE TRIGGER trg_orders_order_created
AFTER INSERT ON orders
BEGIN
  INSERT INTO order_events (
    id,
    order_id,
    order_number,
    actor_id,
    actor_name,
    actor_role,
    event_type,
    from_status,
    to_status,
    note,
    metadata,
    created_at
  ) VALUES (
    lower(hex(randomblob(16))),
    NEW.id,
    NEW.order_number,
    NULL,
    'Система',
    'system',
    'order_created',
    NULL,
    NEW.status,
    NULL,
    '{}',
    NEW.created_at
  );
END;

INSERT INTO schema_migrations(version, applied_at)
VALUES('0009_fix_order_created_trigger', datetime('now'));
