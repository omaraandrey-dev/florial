-- Add service-lead Manager permissions and assignment without rewriting existing leads or event history.
-- Existing permission values are preserved; new rights default to false for every current staff profile.

ALTER TABLE service_leads
ADD COLUMN assigned_to TEXT REFERENCES catalog_staff_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_service_leads_assigned_status_created
ON service_leads(assigned_to, status, created_at DESC);

UPDATE catalog_staff_profiles
SET permissions = json_set(
  CASE WHEN json_valid(permissions) THEN permissions ELSE '{}' END,
  '$.canManageCategorySeo', json(CASE WHEN COALESCE(json_extract(permissions, '$.canManageCategorySeo'), 0)=1 THEN 'true' ELSE 'false' END),
  '$.canViewServiceLeads', json(CASE WHEN COALESCE(json_extract(permissions, '$.canViewServiceLeads'), 0)=1 THEN 'true' ELSE 'false' END),
  '$.canManageServiceLeads', json(CASE WHEN COALESCE(json_extract(permissions, '$.canManageServiceLeads'), 0)=1 THEN 'true' ELSE 'false' END)
);

DROP TRIGGER IF EXISTS trg_staff_permissions_insert;
DROP TRIGGER IF EXISTS trg_staff_permissions_update;

CREATE TRIGGER trg_staff_permissions_insert
BEFORE INSERT ON catalog_staff_profiles
WHEN json_valid(NEW.permissions)=0 OR json_type(NEW.permissions)<>'object'
 OR COALESCE(json_type(NEW.permissions,'$.canCreatePlant'),'') NOT IN('true','false')
 OR COALESCE(json_type(NEW.permissions,'$.canEditPlantCard'),'') NOT IN('true','false')
 OR COALESCE(json_type(NEW.permissions,'$.canAddPlantVariant'),'') NOT IN('true','false')
 OR COALESCE(json_type(NEW.permissions,'$.canEditPlantPrice'),'') NOT IN('true','false')
 OR COALESCE(json_type(NEW.permissions,'$.canEditPlantStock'),'') NOT IN('true','false')
 OR COALESCE(json_type(NEW.permissions,'$.canReviewPlantSubmissions'),'') NOT IN('true','false')
 OR COALESCE(json_type(NEW.permissions,'$.canApprovePlantSubmission'),'') NOT IN('true','false')
 OR COALESCE(json_type(NEW.permissions,'$.canPublishPlant'),'') NOT IN('true','false')
 OR COALESCE(json_type(NEW.permissions,'$.canManageStaff'),'') NOT IN('true','false')
 OR COALESCE(json_type(NEW.permissions,'$.canDelegatePermissions'),'') NOT IN('true','false')
 OR COALESCE(json_type(NEW.permissions,'$.canViewAnalytics'),'') NOT IN('true','false')
 OR COALESCE(json_type(NEW.permissions,'$.canViewOrders'),'') NOT IN('true','false')
 OR COALESCE(json_type(NEW.permissions,'$.canEditOrders'),'') NOT IN('true','false')
 OR COALESCE(json_type(NEW.permissions,'$.canDeleteTestOrders'),'') NOT IN('true','false')
 OR COALESCE(json_type(NEW.permissions,'$.canManageCategorySeo'),'') NOT IN('true','false')
 OR COALESCE(json_type(NEW.permissions,'$.canViewServiceLeads'),'') NOT IN('true','false')
 OR COALESCE(json_type(NEW.permissions,'$.canManageServiceLeads'),'') NOT IN('true','false')
 OR (json_extract(NEW.permissions,'$.canManageServiceLeads')=1 AND json_extract(NEW.permissions,'$.canViewServiceLeads')<>1)
BEGIN SELECT RAISE(ABORT,'Invalid staff permissions JSON shape'); END;

CREATE TRIGGER trg_staff_permissions_update
BEFORE UPDATE OF permissions ON catalog_staff_profiles
WHEN json_valid(NEW.permissions)=0 OR json_type(NEW.permissions)<>'object'
 OR COALESCE(json_type(NEW.permissions,'$.canCreatePlant'),'') NOT IN('true','false')
 OR COALESCE(json_type(NEW.permissions,'$.canEditPlantCard'),'') NOT IN('true','false')
 OR COALESCE(json_type(NEW.permissions,'$.canAddPlantVariant'),'') NOT IN('true','false')
 OR COALESCE(json_type(NEW.permissions,'$.canEditPlantPrice'),'') NOT IN('true','false')
 OR COALESCE(json_type(NEW.permissions,'$.canEditPlantStock'),'') NOT IN('true','false')
 OR COALESCE(json_type(NEW.permissions,'$.canReviewPlantSubmissions'),'') NOT IN('true','false')
 OR COALESCE(json_type(NEW.permissions,'$.canApprovePlantSubmission'),'') NOT IN('true','false')
 OR COALESCE(json_type(NEW.permissions,'$.canPublishPlant'),'') NOT IN('true','false')
 OR COALESCE(json_type(NEW.permissions,'$.canManageStaff'),'') NOT IN('true','false')
 OR COALESCE(json_type(NEW.permissions,'$.canDelegatePermissions'),'') NOT IN('true','false')
 OR COALESCE(json_type(NEW.permissions,'$.canViewAnalytics'),'') NOT IN('true','false')
 OR COALESCE(json_type(NEW.permissions,'$.canViewOrders'),'') NOT IN('true','false')
 OR COALESCE(json_type(NEW.permissions,'$.canEditOrders'),'') NOT IN('true','false')
 OR COALESCE(json_type(NEW.permissions,'$.canDeleteTestOrders'),'') NOT IN('true','false')
 OR COALESCE(json_type(NEW.permissions,'$.canManageCategorySeo'),'') NOT IN('true','false')
 OR COALESCE(json_type(NEW.permissions,'$.canViewServiceLeads'),'') NOT IN('true','false')
 OR COALESCE(json_type(NEW.permissions,'$.canManageServiceLeads'),'') NOT IN('true','false')
 OR (json_extract(NEW.permissions,'$.canManageServiceLeads')=1 AND json_extract(NEW.permissions,'$.canViewServiceLeads')<>1)
BEGIN SELECT RAISE(ABORT,'Invalid staff permissions JSON shape'); END;

INSERT INTO schema_migrations(version, applied_at)
VALUES('0012_service_leads_manager', datetime('now'));
