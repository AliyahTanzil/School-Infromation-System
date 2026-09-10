# SEC-001 Phase 53: examination and result owner access

Examination and result routes now accept authenticated platform owners for administration as well as reading and mark entry. Administrator-only operations use the shared school administrator guard; teacher-readable and mark-entry operations use a separate administrator-or-teacher guard. Every route retains authentication and school-context resolution before authorization.

Mark entry passes an explicit access object containing authenticated roles and platform role from the controller to the service. Platform owners can record marks without a duplicate administrator role or teacher assignment. Caller input cannot supply this access object. The service still requires ordinary teachers to have an active, scoped identity and an active assignment matching the candidate class and subject.

Owner access does not bypass examination locks, marking workflow state, score bounds, candidate membership, scheduled subject checks or tenant/school-scoped reads and writes. Teachers remain unable to create examinations, manage candidates or schedules, change examination lifecycle state, process results or publish results.

Eight new behavioral tests exercise every examination/result route guard, accepted and denied identities, teacher lifecycle restrictions, controller-to-persistence owner propagation, forged owner input, assigned-teacher mark entry and owner rejection for locked exams, missing candidates and unscheduled subjects.

SEC-001 remains IN_PROGRESS. Attendance and remaining mixed-role route/service owner consistency, live database verification and remaining compliance audits are outstanding.

Verification: 26 focused tests pass. Full backend suite: 536 passed, zero failures and one intentional live-database skip. Backend TypeScript compilation, runtime copying, compiled health/protected-route smoke checks, targeted lint, formatting and diff checks pass using the existing generated Prisma client. Standard npm build was not rerun; the Prisma Windows engine DLL replacement error recorded in Phase 52 remains unverified.
