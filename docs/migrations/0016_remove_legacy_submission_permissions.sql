-- Retire the old plant-submission review/approval/publication permission keys.
-- Direct catalog permissions remain unchanged.
DROP TRIGGER IF EXISTS trg_staff_permissions_insert;
DROP TRIGGER IF EXISTS trg_staff_permissions_update;

UPDATE catalog_staff_profiles
SET permissions=json_remove(permissions,'$.canReviewPlantSubmissions','$.canApprovePlantSubmission','$.canPublishPlant')
WHERE json_valid(permissions)=1 AND json_type(permissions)='object';

CREATE TRIGGER trg_staff_permissions_insert
BEFORE INSERT ON catalog_staff_profiles
WHEN json_valid(NEW.permissions)=0 OR json_type(NEW.permissions)<>'object'
 OR COALESCE(json_type(NEW.permissions,'$.canCreatePlant'),'') NOT IN('true','false')
 OR COALESCE(json_type(NEW.permissions,'$.canEditPlantCard'),'') NOT IN('true','false')
 OR COALESCE(json_type(NEW.permissions,'$.canAddPlantVariant'),'') NOT IN('true','false')
 OR COALESCE(json_type(NEW.permissions,'$.canEditPlantPrice'),'') NOT IN('true','false')
 OR COALESCE(json_type(NEW.permissions,'$.canEditPlantStock'),'') NOT IN('true','false')
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
VALUES('0016_remove_legacy_submission_permissions', datetime('now'));
