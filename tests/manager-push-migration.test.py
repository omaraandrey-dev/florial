import sqlite3
from pathlib import Path

root = Path(__file__).resolve().parents[1]
migration = root / "docs/migrations/0017_manager_push_subscriptions.sql"
sql = migration.read_text(encoding="utf-8")

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.execute("CREATE TABLE schema_migrations(version TEXT PRIMARY KEY, applied_at TEXT NOT NULL)")
db.execute("CREATE TABLE catalog_staff_profiles(user_id TEXT PRIMARY KEY)")
db.executescript(sql)

columns = {row[1] for row in db.execute("PRAGMA table_info(manager_push_subscriptions)")}
expected = {"id", "user_id", "endpoint", "p256dh", "auth", "user_agent", "created_at", "updated_at", "last_seen_at"}
assert expected <= columns, f"Missing columns: {expected - columns}"

indexes = {row[1] for row in db.execute("PRAGMA index_list(manager_push_subscriptions)")}
assert "idx_manager_push_subscriptions_user" in indexes
assert "idx_manager_push_subscriptions_last_seen" in indexes

db.execute("INSERT INTO catalog_staff_profiles(user_id) VALUES('owner-1')")
db.execute("""INSERT INTO manager_push_subscriptions
  (id,user_id,endpoint,p256dh,auth,created_at,updated_at,last_seen_at)
  VALUES('sub-1','owner-1','https://push.example/1','public-key','auth-key','now','now','now')""")

try:
    db.execute("""INSERT INTO manager_push_subscriptions
      (id,user_id,endpoint,p256dh,auth,created_at,updated_at,last_seen_at)
      VALUES('sub-2','owner-1','https://push.example/1','public-key','auth-key','now','now','now')""")
    raise AssertionError("Duplicate endpoint was accepted")
except sqlite3.IntegrityError:
    pass

db.execute("DELETE FROM catalog_staff_profiles WHERE user_id='owner-1'")
assert db.execute("SELECT COUNT(*) FROM manager_push_subscriptions").fetchone()[0] == 0
assert db.execute("SELECT version FROM schema_migrations").fetchone()[0] == "0017_manager_push_subscriptions"
print("Manager Push migration 0017 validation passed.")
