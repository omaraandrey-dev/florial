-- One-time, short-lived password reset links initiated by an Owner.
CREATE TABLE manager_password_reset_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES catalog_staff_profiles(user_id) ON DELETE CASCADE,
  created_by TEXT NOT NULL REFERENCES catalog_staff_profiles(user_id),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT
);
CREATE INDEX idx_manager_password_reset_user_created
  ON manager_password_reset_tokens(user_id, created_at DESC);
CREATE INDEX idx_manager_password_reset_expiry
  ON manager_password_reset_tokens(expires_at);
INSERT INTO schema_migrations(version, applied_at)
VALUES('0015_manager_password_reset_tokens', datetime('now'));
