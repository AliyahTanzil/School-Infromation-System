# School management API

The school-management page uses authenticated `GET /api/schools`, `POST /api/schools`, and `PUT /api/schools/:id`.

- List returns `{ success: true, data: { items, total, page, pageSize } }`, with optional search, page and pageSize parameters.
- Create accepts name, slug and optional email, phone and website. Update accepts partial fields.
- The API maps slug to the current School.code column and returns slug as a compatibility alias. School has no normalizedName, deletedAt, profile, setting or configuration fields; these must not appear in its Prisma queries.
- School creation reuses the authenticated tenant or resolves the configured umbrella tenant for an application owner. No nested school profile/configuration records are required.
- Tenant scope comes from the authenticated user. An unscoped platform owner can manage schools; other unscoped users are rejected. Query/header tenant overrides are ignored.

2026-09-06 verification: seven focused backend tests passed, including validation against Prisma model metadata and tenant-override rejection. A read-only call of the corrected list service against the configured database succeeded and returned one school. No live creation/update was performed.

## One main school and branches (2026-09-07)

Main-school creation refuses a second School, even under another tenant, using a serializable transaction. SINGLE_SCHOOL_ID designates the main school when legacy records exist. Client school-selection headers cannot switch to another school.

- GET /api/schools/:id/branches lists Campus records (schools.read permission).
- POST /api/schools/:id/branches creates a campus with name and optional code; omitted codes are generated (schools.manage_branches permission).
- PATCH /api/schools/:id/branches/:branchId renames a campus without changing its UUID or code (schools.manage_branches permission).

Existing extra School rows are preserved. This does not migrate student data or add branch-level enrollment workflows.
