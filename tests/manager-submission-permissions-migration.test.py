import pathlib
import sqlite3
import json

ROOT = pathlib.Path(__file__).resolve().parents[1]
db = sqlite3.connect(":memory:")
db.executescript("""
CREATE TABLE catalog_staff_profiles (
 user_id TEXT PRIMARY KEY,
 permissions TEXT NOT NULL
);
CREATE TABLE schema_migrations (
 version TEXT PRIMARY KEY,
 applied_at TEXT NOT NULL
);
""")
legacy_existing = {
 "canCreatePlant": True, "canEditPlantCard": False, "canAddPlantVariant": False,
 "canEditPlantPrice": False, "canEditPlantStock": False,
 "canReviewPlantSubmissions": True, "canApprovePlantSubmission": True, "canPublishPlant": True,
 "canManageStaff": False, "canDelegatePermissions": False, "canViewAnalytics": False,
 "canViewOrders": False, "canEditOrders": False, "canDeleteTestOrders": False,
 "canManageCategorySeo": False, "canViewServiceLeads": False, "canManageServiceLeads": False
}
db.execute("INSERT INTO catalog_staff_profiles(user_id,permissions) VALUES(?,?)", ("existing", json.dumps(legacy_existing)))
db.executescript((ROOT / "docs/migrations/0016_remove_legacy_submission_permissions.sql").read_text())
remaining = db.execute("SELECT json_type(permissions, '$.canReviewPlantSubmissions'), json_type(permissions, '$.canApprovePlantSubmission'), json_type(permissions, '$.canPublishPlant') FROM catalog_staff_profiles WHERE user_id='existing'").fetchone()
assert remaining == (None, None, None)
permissions = {
 "canCreatePlant": True, "canEditPlantCard": False, "canAddPlantVariant": False,
 "canEditPlantPrice": False, "canEditPlantStock": False, "canManageStaff": False,
 "canDelegatePermissions": False, "canViewAnalytics": False, "canViewOrders": False,
 "canEditOrders": False, "canDeleteTestOrders": False, "canManageCategorySeo": False,
 "canViewServiceLeads": False, "canManageServiceLeads": False
}
db.execute("INSERT INTO catalog_staff_profiles(user_id,permissions) VALUES(?,?)", ("seller", json.dumps(permissions)))
assert db.execute("SELECT COUNT(*) FROM catalog_staff_profiles").fetchone()[0] == 2
db.execute("UPDATE catalog_staff_profiles SET permissions=? WHERE user_id='seller'", (json.dumps(permissions),))
assert db.execute("SELECT version FROM schema_migrations").fetchone()[0] == "0016_remove_legacy_submission_permissions"
try:
    invalid = dict(permissions); invalid.pop("canManageStaff")
    db.execute("UPDATE catalog_staff_profiles SET permissions=? WHERE user_id='seller'", (json.dumps(invalid),))
    raise AssertionError("missing active permission should be rejected")
except sqlite3.IntegrityError:
    pass
print("Legacy submission permission trigger migration: OK")
