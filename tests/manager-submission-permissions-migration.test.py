import pathlib
import sqlite3

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
db.executescript((ROOT / "docs/migrations/0016_remove_legacy_submission_permissions.sql").read_text())
permissions = {
 "canCreatePlant": True, "canEditPlantCard": False, "canAddPlantVariant": False,
 "canEditPlantPrice": False, "canEditPlantStock": False, "canManageStaff": False,
 "canDelegatePermissions": False, "canViewAnalytics": False, "canViewOrders": False,
 "canEditOrders": False, "canDeleteTestOrders": False, "canManageCategorySeo": False,
 "canViewServiceLeads": False, "canManageServiceLeads": False
}
import json
db.execute("INSERT INTO catalog_staff_profiles(user_id,permissions) VALUES(?,?)", ("seller", json.dumps(permissions)))
assert db.execute("SELECT COUNT(*) FROM catalog_staff_profiles").fetchone()[0] == 1
db.execute("UPDATE catalog_staff_profiles SET permissions=? WHERE user_id='seller'", (json.dumps(permissions),))
legacy = dict(permissions, canReviewPlantSubmissions=True, canApprovePlantSubmission=True, canPublishPlant=True)
db.execute("UPDATE catalog_staff_profiles SET permissions=? WHERE user_id='seller'", (json.dumps(legacy),))
assert db.execute("SELECT version FROM schema_migrations").fetchone()[0] == "0016_remove_legacy_submission_permissions"
try:
    invalid = dict(permissions); invalid.pop("canManageStaff")
    db.execute("UPDATE catalog_staff_profiles SET permissions=? WHERE user_id='seller'", (json.dumps(invalid),))
    raise AssertionError("missing active permission should be rejected")
except sqlite3.IntegrityError:
    pass
print("Legacy submission permission trigger migration: OK")
