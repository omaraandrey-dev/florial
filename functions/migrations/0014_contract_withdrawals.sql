-- Contract withdrawal intake; additive only. Existing orders and order events remain untouched.
CREATE TABLE contract_withdrawals (
  id TEXT PRIMARY KEY,
  order_id TEXT,
  contract_reference TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  locale TEXT NOT NULL CHECK(locale IN ('bg','ru','en')),
  declaration_text TEXT NOT NULL,
  customer_comment TEXT,
  status TEXT NOT NULL DEFAULT 'received'
    CHECK(status IN ('received','review_required','awaiting_return','refund_in_progress','completed')),
  confirmation_status TEXT NOT NULL DEFAULT 'pending'
    CHECK(confirmation_status IN ('pending','sent','failed','not_configured')),
  confirmation_sent_at TEXT,
  confirmation_error TEXT,
  review_note TEXT,
  submitted_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE
);

CREATE INDEX idx_contract_withdrawals_status_submitted
  ON contract_withdrawals(status, submitted_at DESC);
CREATE INDEX idx_contract_withdrawals_reference
  ON contract_withdrawals(contract_reference);
CREATE INDEX idx_contract_withdrawals_email_submitted
  ON contract_withdrawals(customer_email, submitted_at DESC);

CREATE TABLE contract_withdrawal_events (
  id TEXT PRIMARY KEY,
  withdrawal_id TEXT NOT NULL REFERENCES contract_withdrawals(id),
  actor_id TEXT,
  actor_name TEXT,
  actor_role TEXT NOT NULL,
  event_type TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  note TEXT,
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE INDEX idx_contract_withdrawal_events_record_created
  ON contract_withdrawal_events(withdrawal_id, created_at DESC);

CREATE TRIGGER trg_contract_withdrawal_events_metadata_insert
BEFORE INSERT ON contract_withdrawal_events
WHEN json_valid(NEW.metadata)=0 OR json_type(NEW.metadata)<>'object'
BEGIN
  SELECT RAISE(ABORT, 'Withdrawal event metadata must be a JSON object');
END;

CREATE TRIGGER trg_contract_withdrawal_events_no_update
BEFORE UPDATE ON contract_withdrawal_events
BEGIN
  SELECT RAISE(ABORT, 'Contract withdrawal events are immutable');
END;

CREATE TRIGGER trg_contract_withdrawal_events_no_delete
BEFORE DELETE ON contract_withdrawal_events
BEGIN
  SELECT RAISE(ABORT, 'Contract withdrawal events are immutable');
END;

CREATE TRIGGER trg_contract_withdrawals_declaration_immutable
BEFORE UPDATE OF order_id, contract_reference, customer_name, customer_email, locale,
  declaration_text, customer_comment, submitted_at, idempotency_key
ON contract_withdrawals
BEGIN
  SELECT RAISE(ABORT, 'Contract withdrawal declaration is immutable');
END;

CREATE TRIGGER trg_contract_withdrawals_no_delete
BEFORE DELETE ON contract_withdrawals
BEGIN
  SELECT RAISE(ABORT, 'Contract withdrawal records cannot be deleted');
END;

INSERT INTO schema_migrations(version, applied_at)
VALUES('0014_contract_withdrawals', datetime('now'));
