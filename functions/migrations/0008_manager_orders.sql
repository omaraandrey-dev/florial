-- Manager order workflow; additive and data-preserving.
ALTER TABLE orders ADD COLUMN is_test INTEGER NOT NULL DEFAULT 0 CHECK(is_test IN(0,1));
ALTER TABLE orders ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK(payment_status IN('unpaid','pending','paid','partially_refunded','refunded'));
ALTER TABLE orders ADD COLUMN manager_note TEXT;
ALTER TABLE orders ADD COLUMN updated_at TEXT;
ALTER TABLE orders ADD COLUMN cancelled_reason TEXT;
ALTER TABLE orders ADD COLUMN archived_at TEXT;
ALTER TABLE orders ADD COLUMN paid_at TEXT;
UPDATE orders SET updated_at=created_at WHERE updated_at IS NULL;
CREATE TRIGGER trg_orders_updated_at_insert AFTER INSERT ON orders WHEN NEW.updated_at IS NULL
BEGIN UPDATE orders SET updated_at=NEW.created_at WHERE id=NEW.id; END;
UPDATE orders SET is_test=1 WHERE order_number IN('FL-TEST-20261103-01','FL-TEST-20261103-02','FL-TEST-20261103-03','FL-TEST-20261103-04');
INSERT INTO catalog_staff_permission_events(actor_id,target_user_id,action,previous_permissions,new_permissions,created_at)
SELECT o.user_id,m.user_id,'updated',m.permissions,json_patch(m.permissions,'{"canViewOrders":true,"canEditOrders":true,"canDeleteTestOrders":true}'),datetime('now')
FROM catalog_staff_profiles o JOIN catalog_staff_profiles m ON m.role='manager' AND m.is_active=1 WHERE o.role='owner';
UPDATE catalog_staff_profiles SET permissions=json_patch(permissions,'{"canViewOrders":true,"canEditOrders":true,"canDeleteTestOrders":true}')
WHERE role='manager' AND is_active=1 AND EXISTS(SELECT 1 FROM catalog_staff_profiles WHERE role='owner');
DROP TRIGGER IF EXISTS trg_staff_permissions_insert;
DROP TRIGGER IF EXISTS trg_staff_permissions_update;
CREATE TRIGGER trg_staff_permissions_insert BEFORE INSERT ON catalog_staff_profiles
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
BEGIN SELECT RAISE(ABORT,'Invalid staff permissions JSON shape'); END;
CREATE TRIGGER trg_staff_permissions_update BEFORE UPDATE OF permissions ON catalog_staff_profiles
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
BEGIN SELECT RAISE(ABORT,'Invalid staff permissions JSON shape'); END;
CREATE TABLE order_events(id TEXT PRIMARY KEY,order_id TEXT NOT NULL,order_number TEXT NOT NULL,actor_id TEXT,actor_role TEXT NOT NULL,event_type TEXT NOT NULL,from_status TEXT,to_status TEXT,note TEXT,metadata TEXT NOT NULL DEFAULT '{}',created_at TEXT NOT NULL);
INSERT INTO order_events(id,order_id,order_number,actor_id,actor_role,event_type,from_status,to_status,note,metadata,created_at)
SELECT lower(hex(randomblob(16))),id,order_number,NULL,'system','order_created',NULL,status,NULL,'{"source":"preexisting_order"}',created_at FROM orders;
CREATE TRIGGER trg_orders_order_created AFTER INSERT ON orders
BEGIN INSERT INTO order_events(id,order_id,order_number,actor_id,actor_role,event_type,from_status,to_status,note,metadata,created_at)
VALUES(lower(hex(randomblob(16))),NEW.id,NEW.order_number,NULL,'system','order_created',NULL,NEW.status,NULL,'{}',NEW.created_at); END;
CREATE INDEX idx_order_events_order_created ON order_events(order_id,created_at DESC);
CREATE INDEX idx_order_events_number ON order_events(order_number);
CREATE INDEX idx_orders_status_created ON orders(status,created_at DESC);
CREATE INDEX idx_orders_payment_created ON orders(payment_status,created_at DESC);
CREATE INDEX idx_orders_is_test ON orders(is_test);
INSERT INTO schema_migrations(version,applied_at) VALUES('0008_manager_orders',datetime('now'));
