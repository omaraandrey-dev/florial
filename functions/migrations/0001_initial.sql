PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS catalog_staff_profiles (
  user_id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_iterations INTEGER NOT NULL DEFAULT 310000,
  role TEXT NOT NULL CHECK (role IN ('seller','manager','owner')),
  display_name TEXT NOT NULL DEFAULT '',
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  permissions TEXT NOT NULL DEFAULT '{"canCreatePlant":true,"canAddPlantVariant":false,"canEditPlantPrice":false}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS manager_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES catalog_staff_profiles(user_id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_manager_sessions_user ON manager_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_manager_sessions_expiry ON manager_sessions(expires_at);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  city TEXT,
  address TEXT,
  delivery_method TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'pay_in_store',
  comment TEXT,
  items TEXT NOT NULL DEFAULT '[]',
  subtotal REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'new',
  delivery_fee REAL,
  total REAL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

CREATE TABLE IF NOT EXISTS site_events (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view','call_bg','call_en_ru','chat_click')),
  lang TEXT NOT NULL CHECK (lang IN ('bg','ru','en')),
  page_path TEXT NOT NULL CHECK (length(page_path) <= 200)
);
CREATE INDEX IF NOT EXISTS idx_site_events_created_at ON site_events(created_at);
CREATE INDEX IF NOT EXISTS idx_site_events_type_created ON site_events(event_type,created_at);

CREATE TABLE IF NOT EXISTS catalog_submissions (
  id TEXT PRIMARY KEY,
  catalog TEXT NOT NULL DEFAULT 'plants' CHECK (catalog IN ('plants','production')),
  operation TEXT NOT NULL DEFAULT 'create' CHECK (operation IN ('create','update')),
  target_document_id TEXT,
  target_revision TEXT,
  title TEXT NOT NULL DEFAULT '',
  sku TEXT,
  payload TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','in_review','changes_requested','approved','publishing','published','publish_failed','rejected')),
  created_by TEXT NOT NULL REFERENCES catalog_staff_profiles(user_id),
  reviewed_by TEXT REFERENCES catalog_staff_profiles(user_id),
  review_note TEXT,
  submitted_at TEXT,
  reviewed_at TEXT,
  published_at TEXT,
  publish_error TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  notification_sent_at TEXT,
  notification_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_catalog_submissions_created_by ON catalog_submissions(created_by);
CREATE INDEX IF NOT EXISTS idx_catalog_submissions_status_updated ON catalog_submissions(status,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_catalog_submissions_catalog ON catalog_submissions(catalog);

CREATE TABLE IF NOT EXISTS catalog_submission_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id TEXT NOT NULL REFERENCES catalog_submissions(id) ON DELETE CASCADE,
  actor_id TEXT REFERENCES catalog_staff_profiles(user_id),
  event_type TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  note TEXT,
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_catalog_submission_events_submission ON catalog_submission_events(submission_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_catalog_submission_events_created ON catalog_submission_events(created_at);

CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);
