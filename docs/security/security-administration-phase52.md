# SEC-001 Phase 52: shared school administrator authorization

Academic policies, asset inventory, boarding, finance, payment administration, timetables and transport now recognize authenticated `platformRole: OWNER` through a shared `authorizeSchoolAdmin` middleware. This resolves the same missing-role-assignment rejection previously corrected for academic periods, classes, subjects, library and HR.

The guard accepts persisted platform ownership or an existing `PLATFORM_ADMIN` or `SCHOOL_ADMIN` role. Authentication resolves platform ownership from the account access context. An application-manager account type, an `OWNER` role code alone, and ownership claims supplied through the body, query or school context do not grant access.

All seven routers authenticate and resolve school context before this guard, and all administration endpoints follow it. The payment webhook retains its separate entry point and existing signature verification. Global role authorization and mixed teacher/student route policies are unchanged.

Ten new behavioral regressions cover accepted identities, rejected identities and forged claims, middleware identity/order across seven routers, administration endpoint placement, and the separate payment webhook handler. The timetable source contract now references the shared guard.

SEC-001 remains IN_PROGRESS. Mixed-role route/service owner consistency, live database verification and remaining compliance audits are outstanding.

Verification: 29 focused tests pass. Full backend suite: 528 passed, zero failures and one intentional live-database skip. Backend TypeScript compilation, runtime copying, compiled health/protected-route smoke checks, targeted lint, formatting and diff checks pass. Standard npm build remains blocked during Prisma generation by an EPERM replacing query_engine-windows.dll.node; compilation used the existing generated client.
