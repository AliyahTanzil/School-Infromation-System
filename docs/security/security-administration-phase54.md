# SEC-001 Phase 54: attendance owner authorization

Attendance routes use the shared school-administrator-or-teacher guard after authentication and school-context resolution. Authenticated platform owners can access attendance without duplicate role assignments or a teacher identity.

The controller carries persisted platform ownership through options, lists, creation, detail, status changes and bulk marking. Each service path preserves this identity when checking class access, including the detail read returned after bulk marking. Teacher access still depends on the union of scoped class membership and active teaching assignments.

Authenticated context takes precedence over body and query fields, and route session IDs take precedence over body IDs. Session creation explicitly maps supported fields, so caller-supplied creator/status fields and authorization metadata cannot enter the persistence payload. Existing strict mutation schemas remain in place.

Owner access retains tenant/school-scoped class and session lookups, enrollment roster initialization, session transition and marking restrictions, and authenticated mutation audits.

Twelve new behavioral regressions cover route ordering and role boundaries, all six controller-to-service paths, forged ownership and actor fields, restricted teacher lists/options, denied unassigned teachers, permitted assigned teachers, locked sessions and missing scoped records.

SEC-001 remains IN_PROGRESS for other mixed-role route/service owner consistency, live database verification and remaining compliance audits.

Verification: 20 focused attendance tests pass. Full backend suite: 548 passed, zero failures and one intentional live-database skip. Backend TypeScript compilation, runtime copying, compiled health/protected-route smoke checks, targeted lint, formatting and diff checks pass using the existing generated Prisma client. Standard npm build was not rerun; the Prisma Windows engine DLL replacement error recorded in Phase 52 remains unverified.
