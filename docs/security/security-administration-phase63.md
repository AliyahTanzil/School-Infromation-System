# SEC-001 Phase 63: classroom calendar owner access

Classroom calendar reads recognize authenticated platform owners without duplicate administrator roles or classroom membership. The controller passes persisted roles and platform ownership separately from query input. Both `/api/lms/calendar` and `/api/v1/lms/calendar` retain authentication, school-context resolution and query validation.

The service still requires an active classroom in the authenticated tenant and school. Ordinary users, including teachers and students, need classroom ownership or active membership. Request-supplied owner claims cannot grant access. Assignment events remain limited to published/closed assignments in the selected classroom and date range; lesson queries retain tenant, school and linked-class scope and use a published timetable.

Six behavioral regressions cover middleware ordering, owner access, missing classroom rejection, forged claims, existing administrator/member access and classrooms without a linked class. All nine focused calendar tests pass. TypeScript compilation, runtime copying, compiled health/protected-route smoke checks, targeted lint, formatting and diff checks pass.

SEC-001 remains IN_PROGRESS for remaining authorization, live verification and compliance work. The full backend suite was not rerun; Phase 62 passed 599 tests with one intentional database skip. Prisma regeneration was not rerun, and the previously documented Windows DLL issue remains unverified.
