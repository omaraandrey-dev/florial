-- Store Web Push endpoints per authenticated active Manager staff account.
-- This migration is additive; it does not alter staff profiles, orders, leads or existing sessions.
CREATE TABLE manager_push_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES catalog_staff_profiles(user_id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);

CREATE INDEX idx_manager_push_subscriptions_user
  ON manager_push_subscriptions(user_id, updated_at DESC);

CREATE INDEX idx_manager_push_subscriptions_last_seen
  ON manager_push_subscriptions(last_seen_at);

INSERT INTO schema_migrations(version, applied_at)
VALUES('0017_manager_push_subscriptions', datetime('now'));
