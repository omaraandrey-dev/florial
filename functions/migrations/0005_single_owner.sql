CREATE UNIQUE INDEX IF NOT EXISTS idx_catalog_staff_single_owner
ON catalog_staff_profiles(role)
WHERE role='owner';
