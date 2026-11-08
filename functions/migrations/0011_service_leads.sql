-- Add a separate, auditable service-lead workflow. Existing orders and plant submissions remain untouched.
CREATE TABLE IF NOT EXISTS service_leads (
  id TEXT PRIMARY KEY,
  lead_number TEXT NOT NULL UNIQUE,
  idempotency_key TEXT NOT NULL UNIQUE,
  service_document_id TEXT NOT NULL,
  service_slug TEXT NOT NULL,
  service_name TEXT NOT NULL,
  locale TEXT NOT NULL CHECK (locale IN ('bg','ru','en')),
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  location TEXT NOT NULL,
  address TEXT,
  comment TEXT,
  fields_json TEXT NOT NULL DEFAULT '{}',
  consent_given INTEGER NOT NULL CHECK (consent_given = 1),
  consent_text TEXT NOT NULL,
  privacy_policy_url TEXT NOT NULL,
  consent_version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','processing','contacted','proposal_preparing','proposal_sent','waiting_customer','approved','completed','rejected','closed')),
  owner_notification_status TEXT NOT NULL DEFAULT 'pending' CHECK (owner_notification_status IN ('pending','sent','failed','not_configured')),
  owner_notification_sent_at TEXT,
  owner_notification_error TEXT,
  customer_confirmation_status TEXT NOT NULL DEFAULT 'not_requested' CHECK (customer_confirmation_status IN ('not_requested','pending','sent','failed')),
  customer_confirmation_sent_at TEXT,
  customer_confirmation_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  retention_until TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_service_leads_created_at ON service_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_leads_status_created ON service_leads(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_leads_service_slug ON service_leads(service_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_leads_retention ON service_leads(retention_until);

CREATE TABLE IF NOT EXISTS service_lead_events (
  id TEXT PRIMARY KEY,
  service_lead_id TEXT NOT NULL,
  actor_id TEXT,
  actor_name TEXT,
  actor_role TEXT NOT NULL DEFAULT 'system',
  event_type TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  note TEXT,
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_service_lead_events_lead_created
  ON service_lead_events(service_lead_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_service_lead_events_created
  ON service_lead_events(created_at DESC);

INSERT INTO schema_migrations(version, applied_at)
VALUES('0011_service_leads', datetime('now'));

-- Keep the event trail append-only. Lead PII can be anonymized independently after the retention period.
CREATE TRIGGER IF NOT EXISTS trg_service_lead_events_no_update
BEFORE UPDATE ON service_lead_events
BEGIN
  SELECT RAISE(ABORT, 'Service lead events are immutable');
END;

CREATE TRIGGER IF NOT EXISTS trg_service_lead_events_no_delete
BEFORE DELETE ON service_lead_events
BEGIN
  SELECT RAISE(ABORT, 'Service lead events are immutable');
END;
