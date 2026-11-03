-- Add direct plant stock editing audit trail and the explicit staff permission.
-- Additive only: existing staff and catalogue documents are preserved.
UPDATE catalog_staff_profiles
SET permissions = json_patch(permissions, '{"canEditPlantStock":false}')
WHERE json_valid(permissions)=1;

CREATE TABLE IF NOT EXISTS catalog_stock_events (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL REFERENCES catalog_staff_profiles(user_id),
  plant_document_id TEXT NOT NULL,
  plant_name TEXT NOT NULL,
  sku TEXT,
  variant_key TEXT,
  variant_label TEXT NOT NULL,
  previous_quantity INTEGER,
  new_quantity INTEGER NOT NULL CHECK (new_quantity >= 0),
  result TEXT NOT NULL CHECK (result IN ('pending','success','failed')),
  error_message TEXT,
  created_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_catalog_stock_events_plant
ON catalog_stock_events(plant_document_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_catalog_stock_events_actor
ON catalog_stock_events(actor_id, created_at DESC);

INSERT INTO schema_migrations (version, applied_at)
VALUES ('0007_plant_stock_events', datetime('now'));
