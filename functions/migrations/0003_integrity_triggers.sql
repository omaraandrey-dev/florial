CREATE TRIGGER IF NOT EXISTS trg_staff_permissions_insert
BEFORE INSERT ON catalog_staff_profiles
WHEN json_valid(NEW.permissions)=0
  OR json_type(NEW.permissions)<>'object'
  OR COALESCE(json_type(NEW.permissions,'$.canCreatePlant'),'') NOT IN ('true','false')
  OR COALESCE(json_type(NEW.permissions,'$.canAddPlantVariant'),'') NOT IN ('true','false')
  OR COALESCE(json_type(NEW.permissions,'$.canEditPlantPrice'),'') NOT IN ('true','false')
BEGIN
  SELECT RAISE(ABORT,'Invalid staff permissions JSON shape');
END;

CREATE TRIGGER IF NOT EXISTS trg_staff_permissions_update
BEFORE UPDATE OF permissions ON catalog_staff_profiles
WHEN json_valid(NEW.permissions)=0
  OR json_type(NEW.permissions)<>'object'
  OR COALESCE(json_type(NEW.permissions,'$.canCreatePlant'),'') NOT IN ('true','false')
  OR COALESCE(json_type(NEW.permissions,'$.canAddPlantVariant'),'') NOT IN ('true','false')
  OR COALESCE(json_type(NEW.permissions,'$.canEditPlantPrice'),'') NOT IN ('true','false')
BEGIN
  SELECT RAISE(ABORT,'Invalid staff permissions JSON shape');
END;

CREATE TRIGGER IF NOT EXISTS trg_submission_payload_insert
BEFORE INSERT ON catalog_submissions
WHEN json_valid(NEW.payload)=0 OR json_type(NEW.payload)<>'object'
BEGIN
  SELECT RAISE(ABORT,'Submission payload must be a JSON object');
END;

CREATE TRIGGER IF NOT EXISTS trg_submission_payload_update
BEFORE UPDATE OF payload ON catalog_submissions
WHEN json_valid(NEW.payload)=0 OR json_type(NEW.payload)<>'object'
BEGIN
  SELECT RAISE(ABORT,'Submission payload must be a JSON object');
END;

CREATE TRIGGER IF NOT EXISTS trg_submission_target_insert
BEFORE INSERT ON catalog_submissions
WHEN NOT ((NEW.operation='create' AND NEW.target_document_id IS NULL) OR (NEW.operation='update' AND NEW.target_document_id IS NOT NULL))
BEGIN
  SELECT RAISE(ABORT,'Invalid submission operation target');
END;

CREATE TRIGGER IF NOT EXISTS trg_submission_target_update
BEFORE UPDATE OF operation,target_document_id ON catalog_submissions
WHEN NOT ((NEW.operation='create' AND NEW.target_document_id IS NULL) OR (NEW.operation='update' AND NEW.target_document_id IS NOT NULL))
BEGIN
  SELECT RAISE(ABORT,'Invalid submission operation target');
END;

CREATE TRIGGER IF NOT EXISTS trg_order_items_insert
BEFORE INSERT ON orders
WHEN json_valid(NEW.items)=0 OR json_type(NEW.items)<>'array'
BEGIN
  SELECT RAISE(ABORT,'Order items must be a JSON array');
END;

CREATE TRIGGER IF NOT EXISTS trg_order_items_update
BEFORE UPDATE OF items ON orders
WHEN json_valid(NEW.items)=0 OR json_type(NEW.items)<>'array'
BEGIN
  SELECT RAISE(ABORT,'Order items must be a JSON array');
END;

CREATE TRIGGER IF NOT EXISTS trg_event_metadata_insert
BEFORE INSERT ON catalog_submission_events
WHEN json_valid(NEW.metadata)=0 OR json_type(NEW.metadata)<>'object'
BEGIN
  SELECT RAISE(ABORT,'Event metadata must be a JSON object');
END;

CREATE TRIGGER IF NOT EXISTS trg_event_metadata_update
BEFORE UPDATE OF metadata ON catalog_submission_events
WHEN json_valid(NEW.metadata)=0 OR json_type(NEW.metadata)<>'object'
BEGIN
  SELECT RAISE(ABORT,'Event metadata must be a JSON object');
END;
