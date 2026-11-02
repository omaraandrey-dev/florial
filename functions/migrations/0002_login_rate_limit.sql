CREATE TABLE IF NOT EXISTS manager_login_attempts (
  attempt_key TEXT PRIMARY KEY,
  failed_count INTEGER NOT NULL DEFAULT 0,
  window_started_at TEXT NOT NULL,
  locked_until TEXT
);
CREATE INDEX IF NOT EXISTS idx_manager_login_attempts_locked_until ON manager_login_attempts(locked_until);
