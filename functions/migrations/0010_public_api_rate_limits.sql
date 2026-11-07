-- Add bounded, privacy-preserving rate-limit buckets for public write endpoints.
-- The table contains only daily-rotating IP digests, never raw IP addresses or request payloads.
CREATE TABLE IF NOT EXISTS api_rate_limits (
  bucket_key TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  request_count INTEGER NOT NULL CHECK (request_count > 0),
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_expires ON api_rate_limits(expires_at);
INSERT INTO schema_migrations(version, applied_at)
VALUES('0010_public_api_rate_limits', datetime('now'));
