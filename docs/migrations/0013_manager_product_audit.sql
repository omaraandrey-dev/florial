-- Florial D1 migration 0013: append-only audit for direct plant catalogue edits.
-- Apply only after code review and explicit production migration approval.
CREATE TABLE IF NOT EXISTS manager_product_audit (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('started', 'result')),
  actor_id TEXT NOT NULL REFERENCES catalog_staff_profiles(user_id),
  actor_role TEXT NOT NULL CHECK (actor_role IN ('seller', 'manager', 'owner')),
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'deactivate', 'reactivate')),
  changed_fields TEXT NOT NULL DEFAULT '[]',
  before_data TEXT,
  after_data TEXT,
  result TEXT NOT NULL CHECK (result IN ('started', 'success', 'failed')),
  error_code TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (idempotency_key, phase)
);

CREATE INDEX IF NOT EXISTS idx_manager_product_audit_product_created
  ON manager_product_audit(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_manager_product_audit_actor_created
  ON manager_product_audit(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_manager_product_audit_created
  ON manager_product_audit(created_at DESC);

CREATE TRIGGER IF NOT EXISTS manager_product_audit_no_update
BEFORE UPDATE ON manager_product_audit
BEGIN
  SELECT RAISE(ABORT, 'manager_product_audit is append-only');
END;

CREATE TRIGGER IF NOT EXISTS manager_product_audit_no_delete
BEFORE DELETE ON manager_product_audit
BEGIN
  SELECT RAISE(ABORT, 'manager_product_audit is append-only');
END;

INSERT OR IGNORE INTO schema_migrations (version, applied_at)
VALUES ('0013_manager_product_audit', CURRENT_TIMESTAMP);
