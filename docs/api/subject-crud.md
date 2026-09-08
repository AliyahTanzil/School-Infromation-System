---
noteId: '5f285130aae011f1a69467d0979b3e2e'
tags: []
---

# Subject CRUD contract

POST /api/subjects creates a subject with validated school-owned class assignments. GET /api/subjects lists nondeleted subjects and their class links; GET /api/subjects/:id reads a scoped record.

PATCH /api/subjects/:id accepts name, code, description and optional classAssignments. Omitted assignments remain unchanged; supplied assignments must be nonempty and school-owned. Class links and subject fields update in one transaction.

DELETE /api/subjects/:id sets deletedAt and ARCHIVED status and returns 204. This is soft deletion: normal reads hide the record while historical relationships remain intact. Existing authentication, school context and administrator role restrictions apply. These routes also use the existing versioned mount.

The Subjects screen provides edit, cancel and confirmed-delete controls with error reporting. No schema migration is required. Verification uses isolated service and UI tests, not a live database deployment.

This is the first implementation slice of the application-wide CRUD request. Remaining modules are tracked in ../audit/crud-coverage-2026-09-07.md.
