# Security administration — Phase 22

Date: 2026-09-08. Task: SEC-001 (in progress).

## Authorization audit wave 5

Parent routes previously resolved only the user's tenant even though the server had a configured single-school boundary. Portal relationships loaded a student's legacy tenant-level enrollment, and a parent could submit a link request for any student identifier in the tenant. The shared request validator also expected `{ body, params, query }` schemas, while the parent profile and link schemas were defined as bare bodies, making legitimate mutations fail validation.

Parent routes now run authentication, single-school resolution and parent-context authorization in order. A parent assigned to another school is rejected; legacy parents without a school assignment remain compatible but all visible student relationships are constrained by an active class enrollment in the configured school.

Portal reads now select the school-scoped `ClassEnrollment` record. New link requests require the target student to have an active enrollment in the configured school and continue to create a `PENDING` relationship, so self-service requests do not grant access. Profile, link and unlink requests now use correctly shaped strict schemas, including UUID validation for unlinking.

## Verification

Eight focused parent and authorization tests, the backend production build, targeted lint and diff validation pass. The complete backend suite passes with 378 tests and one intentional live-database skip.

No parent relationships, student records, database data or sessions were changed. SEC-001 remains in progress for the remaining mounted-route and compliance audit.
