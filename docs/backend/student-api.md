# Student Management API

All endpoints are tenant-scoped and require a valid access token plus the corresponding student permission. The server derives the tenant from the authenticated context; clients cannot submit a tenant identifier to widen access.

## Endpoints

- `GET /api/students?search=&page=1&pageSize=25` — paginated student list.
- `GET /api/students/:id` — student detail with guardians and enrollments.
- `POST /api/students` — create a student. Required fields: `admissionNumber`, `firstName`, and `lastName`.
- `PATCH /api/students/:id` — update the student profile.
- `POST /api/students/:id/guardians` — create or link a guardian using `guardianId` or guardian identity fields plus `relationship`.

Responses use the shared `{ success, data, error, requestId }` envelope. Not-found responses do not reveal records from another tenant.
