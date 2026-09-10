# SEC-001 Phase 58: assignment owner access

Assignment mutation routes now accept authenticated platform owners through the administrator-or-teacher guard. List, creation and lifecycle controllers pass authenticated roles and platform ownership separately from request input. Scoped classwork management and draft visibility recognize owners without a classroom membership or duplicate administrator role.

Learners retain published/closed and availability-time restrictions, including explicit draft filters. Non-owner teachers still require classroom ownership or active teacher membership to manage work. Active classroom scope, subject scope, date validation and forward lifecycle transitions remain in effect. Existing search visibility behavior is unchanged.

Six behavioral regressions cover route identities, scoped owner reads/writes, forged claims, learner visibility, teacher membership and invalid scope/date/lifecycle cases. Tests use isolated fixtures and do not publish live assignments or send notifications.

Verification: all 19 focused assignment, visibility and classroom-calendar tests pass, including six new behavioral regressions. TypeScript compilation, runtime copying, compiled health/protected-route smoke checks, targeted lint, formatting and diff checks pass. Full backend suite and Prisma regeneration were not rerun; the latest full run in Phase 55 had 555 passed and one intentional database skip. The prior Windows DLL regeneration issue remains unverified.

SEC-001 remains IN_PROGRESS for remaining LMS authorization, live verification and compliance work.
