from pathlib import Path
import sqlite3

ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / "docs" / "migrations" / "0014_contract_withdrawals.sql"

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys = ON")
db.execute("CREATE TABLE schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL)")
db.executescript(MIGRATION.read_text(encoding="utf-8"))

tables = {
    row[0] for row in db.execute(
        "SELECT name FROM sqlite_master WHERE type='table'"
    )
}
assert {"contract_withdrawals", "contract_withdrawal_events", "schema_migrations"} <= tables

withdrawal_columns = {
    row[1] for row in db.execute("PRAGMA table_info(contract_withdrawals)")
}
required_withdrawal_columns = {
    "id", "order_id", "contract_reference", "customer_name", "customer_email",
    "locale", "declaration_text", "customer_comment", "status",
    "confirmation_status", "confirmation_sent_at", "confirmation_error",
    "review_note", "submitted_at", "created_at", "updated_at", "idempotency_key",
}
assert required_withdrawal_columns <= withdrawal_columns

event_columns = {
    row[1] for row in db.execute("PRAGMA table_info(contract_withdrawal_events)")
}
required_event_columns = {
    "id", "withdrawal_id", "actor_id", "actor_name", "actor_role",
    "event_type", "from_status", "to_status", "note", "metadata", "created_at",
}
assert required_event_columns <= event_columns

db.execute(
    """INSERT INTO contract_withdrawals
    (id, order_id, contract_reference, customer_name, customer_email, locale,
     declaration_text, customer_comment, status, confirmation_status,
     submitted_at, created_at, updated_at, idempotency_key)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
    ("w1", None, "FL-2026-001", "Test Customer", "test@example.com", "bg",
     "Withdrawal declaration", None, "received", "pending",
     "2026-11-11T10:00:00Z", "2026-11-11T10:00:00Z",
     "2026-11-11T10:00:00Z", "withdrawal-test-key"),
)
db.execute(
    """INSERT INTO contract_withdrawal_events
    (id, withdrawal_id, actor_name, actor_role, event_type, to_status, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
    ("e1", "w1", "Customer", "customer", "declaration_received", "received",
     '{"locale":"bg"}', "2026-11-11T10:00:00Z"),
)

# Operational status and confirmation fields remain mutable.
db.execute(
    "UPDATE contract_withdrawals SET status='review_required', confirmation_status='sent' WHERE id='w1'"
)
row = db.execute(
    "SELECT status, confirmation_status FROM contract_withdrawals WHERE id='w1'"
).fetchone()
assert row == ("review_required", "sent")

# The declaration itself must be immutable after submission.
for statement in (
    "UPDATE contract_withdrawals SET declaration_text='changed' WHERE id='w1'",
    "UPDATE contract_withdrawals SET customer_email='other@example.com' WHERE id='w1'",
    "UPDATE contract_withdrawals SET submitted_at='2026-11-12T00:00:00Z' WHERE id='w1'",
):
    try:
        db.execute(statement)
        raise AssertionError(f"Declaration immutability trigger did not block: {statement}")
    except sqlite3.IntegrityError:
        pass

# Event metadata must be a JSON object, and events are append-only.
try:
    db.execute(
        """INSERT INTO contract_withdrawal_events
        (id, withdrawal_id, actor_role, event_type, metadata, created_at)
        VALUES ('e-invalid', 'w1', 'system', 'invalid', 'not-json', '2026-11-11T10:01:00Z')"""
    )
    raise AssertionError("Invalid event metadata was accepted")
except sqlite3.IntegrityError:
    pass

for statement in (
    "UPDATE contract_withdrawal_events SET note='changed' WHERE id='e1'",
    "DELETE FROM contract_withdrawal_events WHERE id='e1'",
):
    try:
        db.execute(statement)
        raise AssertionError(f"Append-only event trigger did not block: {statement}")
    except sqlite3.IntegrityError:
        pass

# Idempotency keys must be unique.
try:
    db.execute(
        """INSERT INTO contract_withdrawals
        (id, contract_reference, customer_name, customer_email, locale, declaration_text,
         submitted_at, created_at, updated_at, idempotency_key)
        VALUES ('w2', 'FL-2026-002', 'Another Customer', 'other@example.com', 'bg',
                'Another declaration', '2026-11-11T11:00:00Z', '2026-11-11T11:00:00Z',
                '2026-11-11T11:00:00Z', 'withdrawal-test-key')"""
    )
    raise AssertionError("Duplicate idempotency key was accepted")
except sqlite3.IntegrityError:
    pass

# Retention may delete the personal declaration row while preserving the minimal audit event.
db.execute("DELETE FROM contract_withdrawals WHERE id='w1'")
assert db.execute("SELECT COUNT(*) FROM contract_withdrawals").fetchone()[0] == 0
assert db.execute("SELECT COUNT(*) FROM contract_withdrawal_events WHERE withdrawal_id='w1'").fetchone()[0] == 1

version = db.execute(
    "SELECT version FROM schema_migrations WHERE version='0014_contract_withdrawals'"
).fetchone()
assert version == ("0014_contract_withdrawals",)
print("contract_withdrawals migration: OK")
