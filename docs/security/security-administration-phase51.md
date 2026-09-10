# SEC-001 Phase 51: library and HR owner access

Library and HR APIs accept authenticated `platformRole: OWNER` in addition to their existing `PLATFORM_ADMIN` and `SCHOOL_ADMIN` roles. Owners no longer need a duplicate role assignment. Account type alone, role code OWNER alone, and body/query/school-context owner claims do not grant access.

Every route still authenticates and resolves school scope before applying the module guard. Existing validation, scoped persistence and transactional audits remain in place. Behavioral tests exercise both guards and verify middleware ordering.

SEC-001 Phase 51 checkpoint (2026-09-10): library and HR administration now recognize authenticated platform owners without duplicate role assignments. Existing PLATFORM_ADMIN and SCHOOL_ADMIN access is preserved; authentication and school context precede both guards. Six behavioral regressions cover accepted identities, rejected ordinary/forged claims and middleware ordering. Full backend run: 516 passed, two stale source-contract failures and one intentional database skip; both contracts were updated and the affected 15-test suite passed. Backend TypeScript compilation/runtime copy and targeted lint pass. Standard build remains blocked by an EPERM replacing the Prisma Windows engine DLL. SEC-001 remains IN_PROGRESS for live verification and remaining module/compliance audits.
