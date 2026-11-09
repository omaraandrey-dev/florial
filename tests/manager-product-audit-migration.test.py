from pathlib import Path
import sqlite3

ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / "docs" / "migrations" / "0013_manager_product_audit.sql"

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys = ON")
db.execute("CREATE TABLE schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL)")
db.execute("CREATE TABLE catalog_staff_profiles (user_id TEXT PRIMARY KEY)")
db.execute("INSERT INTO catalog_staff_profiles(user_id) VALUES ('owner-test')")
db.executescript(MIGRATION.read_text(encoding="utf-8"))

columns = {row[1] for row in db.execute("PRAGMA table_info(manager_product_audit)")}
required = {
    "id", "request_id", "idempotency_key", "phase", "actor_id", "actor_role",
    "product_id", "product_name", "action", "changed_fields", "before_data",
    "after_data", "result", "error_code", "created_at",
}
assert required <= columns, f"Missing audit columns: {required - columns}"

base = (
    "id,request_id,idempotency_key,phase,actor_id,actor_role,product_id,product_name,"
    "action,changed_fields,result,created_at"
)
db.execute(
    f"INSERT INTO manager_product_audit ({base}) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
    ("a1", "r1", "key1", "started", "owner-test", "owner", "plant-1", "Test plant", "create", "[]", "started", "2026-11-09T00:00:00Z"),
)
db.execute(
    f"INSERT INTO manager_product_audit ({base}) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
    ("a2", "r1", "key1", "result", "owner-test", "owner", "plant-1", "Test plant", "create", "[]", "success", "2026-11-09T00:00:01Z"),
)

for statement in (
    "UPDATE manager_product_audit SET result='failed' WHERE id='a1'",
    "DELETE FROM manager_product_audit WHERE id='a1'",
):
    try:
        db.execute(statement)
        raise AssertionError(f"Append-only trigger did not block: {statement}")
    except sqlite3.IntegrityError:
        pass

try:
    db.execute(
        f"INSERT INTO manager_product_audit ({base}) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
        ("a3", "r2", "key1", "started", "owner-test", "owner", "plant-2", "Another plant", "create", "[]", "started", "2026-11-09T00:00:02Z"),
    )
    raise AssertionError("Duplicate idempotency phase was accepted")
except sqlite3.IntegrityError:
    pass

version = db.execute("SELECT version FROM schema_migrations WHERE version='0013_manager_product_audit'").fetchone()
assert version == ("0013_manager_product_audit",)
assert db.execute("SELECT COUNT(*) FROM manager_product_audit").fetchone()[0] == 2
print("manager_product_audit migration: OK")
