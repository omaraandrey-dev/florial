-- Granular Manager permissions and safe staff delegation.
-- Additive migration: existing staff, sessions, submissions and catalog documents are preserved.

ALTER TABLE catalog_staff_profiles
ADD COLUMN created_by TEXT REFERENCES catalog_staff_profiles(user_id);

UPDATE catalog_staff_profiles
SET permissions = json_patch(
  '{"canCreatePlant":true,"canEditPlantCard":false,"canAddPlantVariant":false,"canEditPlantPrice":false,"canReviewPlantSubmissions":false,"canApprovePlantSubmission":false,"canPublishPlant":false,"canManageStaff":false,"canDelegatePermissions":false,"canViewAnalytics":false}',
  permissions
);

DROP TRIGGER IF EXISTS trg_staff_permissions_insert;
DROP TRIGGER IF EXISTS trg_staff_permissions_update;

CREATE TRIGGER trg_staff_permissions_insert
BEFORE INSERT ON catalog_staff_profiles
WHEN json_valid(NEW.permissions)=0
  OR json_type(NEW.permissions)<>'object'
  OR COALESCE(json_type(NEW.permissions,'$.canCreatePlant'),'') NOT IN ('true','false')
  OR COALESCE(json_type(NEW.permissions,'$.canEditPlantCard'),'') NOT IN ('true','false')
  OR COALESCE(json_type(NEW.permissions,'$.canAddPlantVariant'),'') NOT IN ('true','false')
  OR COALESCE(json_type(NEW.permissions,'$.canEditPlantPrice'),'') NOT IN ('true','false')
  OR COALESCE(json_type(NEW.permissions,'$.canReviewPlantSubmissions'),'') NOT IN ('true','false')
  OR COALESCE(json_type(NEW.permissions,'$.canApprovePlantSubmission'),'') NOT IN ('true','false')
  OR COALESCE(json_type(NEW.permissions,'$.canPublishPlant'),'') NOT IN ('true','false')
  OR COALESCE(json_type(NEW.permissions,'$.canManageStaff'),'') NOT IN ('true','false')
  OR COALESCE(json_type(NEW.permissions,'$.canDelegatePermissions'),'') NOT IN ('true','false')
  OR COALESCE(json_type(NEW.permissions,'$.canViewAnalytics'),'') NOT IN ('true','false')
BEGIN
  SELECT RAISE(ABORT,'Invalid staff permissions JSON shape');
END;

CREATE TRIGGER trg_staff_permissions_update
BEFORE UPDATE OF permissions ON catalog_staff_profiles
WHEN json_valid(NEW.permissions)=0
  OR json_type(NEW.permissions)<>'object'
  OR COALESCE(json_type(NEW.permissions,'$.canCreatePlant'),'') NOT IN ('true','false')
  OR COALESCE(json_type(NEW.permissions,'$.canEditPlantCard'),'') NOT IN ('true','false')
  OR COALESCE(json_type(NEW.permissions,'$.canAddPlantVariant'),'') NOT IN ('true','false')
  OR COALESCE(json_type(NEW.permissions,'$.canEditPlantPrice'),'') NOT IN ('true','false')
  OR COALESCE(json_type(NEW.permissions,'$.canReviewPlantSubmissions'),'') NOT IN ('true','false')
  OR COALESCE(json_type(NEW.permissions,'$.canApprovePlantSubmission'),'') NOT IN ('true','false')
  OR COALESCE(json_type(NEW.permissions,'$.canPublishPlant'),'') NOT IN ('true','false')
  OR COALESCE(json_type(NEW.permissions,'$.canManageStaff'),'') NOT IN ('true','false')
  OR COALESCE(json_type(NEW.permissions,'$.canDelegatePermissions'),'') NOT IN ('true','false')
  OR COALESCE(json_type(NEW.permissions,'$.canViewAnalytics'),'') NOT IN ('true','false')
BEGIN
  SELECT RAISE(ABORT,'Invalid staff permissions JSON shape');
END;

CREATE INDEX IF NOT EXISTS idx_catalog_staff_created_by
ON catalog_staff_profiles(created_by);

CREATE TABLE IF NOT EXISTS catalog_staff_permission_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id TEXT NOT NULL REFERENCES catalog_staff_profiles(user_id),
  target_user_id TEXT NOT NULL REFERENCES catalog_staff_profiles(user_id),
  action TEXT NOT NULL CHECK (action IN ('created','updated')),
  previous_permissions TEXT,
  new_permissions TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_staff_permission_events_target
ON catalog_staff_permission_events(target_user_id,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_staff_permission_events_actor
ON catalog_staff_permission_events(actor_id,created_at DESC);

INSERT INTO schema_migrations (version,applied_at)
VALUES ('0006_manager_permissions',datetime('now'));
