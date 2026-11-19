import pathlib
import sqlite3

ROOT = pathlib.Path(__file__).resolve().parents[1]
schema = sqlite3.connect(":memory:")
schema.executescript("""
CREATE TABLE catalog_staff_profiles (
  user_id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL
);
CREATE TABLE schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);
""")
migration = (ROOT / "docs/migrations/0015_manager_password_reset_tokens.sql").read_text()
schema.executescript(migration)
columns = {row[1] for row in schema.execute("PRAGMA table_info(manager_password_reset_tokens)")}
assert {"token_hash", "user_id", "created_by", "created_at", "expires_at", "used_at"} <= columns
indexes = {row[1] for row in schema.execute("PRAGMA index_list(manager_password_reset_tokens)")}
assert "idx_manager_password_reset_user_created" in indexes
assert "idx_manager_password_reset_expiry" in indexes
assert schema.execute("SELECT version FROM schema_migrations").fetchone()[0] == "0015_manager_password_reset_tokens"
print("Manager password reset migration: OK")
