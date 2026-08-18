Mobile5 implementation notes

Attendance uses the backend statuses PRESENT, ABSENT, LATE, EXCUSED, and HALF_DAY (the validator accepts HALF_DAY even though the Prisma enum requires confirmation). Sessions are created and updated through /api/v1/attendance; bulk marking uses /api/v1/attendance/:id/records/bulk and remains permission/tenant-scoped by the backend.

The mobile queue marks operations PENDING_SYNC, SYNCING, SYNCED, or FAILED. This step does not claim server persistence for offline saves. A durable encrypted queue, connectivity listener, retry backoff, conflict/version API, student attendance history endpoints, and reporting/export endpoints remain backend/API requirements and are intentionally not invented here.

Timetable management currently exposes admin-only CRUD endpoints at /api/v1/timetables. Mobile renders published schedule contracts only; teacher/student schedule read APIs are not confirmed.
