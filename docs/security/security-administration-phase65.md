# SEC-001 Phase 65: gradebook owner access

Gradebook routes recognize authenticated platform owners without duplicate administrator roles. Controllers pass persisted roles and platform ownership separately from request input to all eight operations: rubric listing, creation, status changes and assignment; grade listing, saving and release; and feedback. Both `/api/lms/gradebook` and `/api/v1/lms/gradebook` retain authentication and school-context resolution. Five management endpoints use the shared owner-aware administrator/teacher guard.

Owner access retains scoped classroom lookup and existing rubric and score validation. Teacher grading, release and feedback require classroom management access. Student lists show only published rubrics and the authenticated student's released grades; student feedback requires a released grade belonging to that student. Request owner claims cannot elevate access, and persisted rubric authors, graders and feedback authors come from authentication.

Seven behavioral regressions exercise route guards, all eight owner controller paths, scoped classroom rejection, student visibility and feedback, teacher membership and lifecycle/score validation. All 11 focused gradebook tests pass. The full backend suite passes with 619 tests passed and one intentional database skip. TypeScript compilation, runtime copying, compiled health/protected-route smoke checks, targeted lint, formatting and diff checks pass.

SEC-001 remains IN_PROGRESS. Global search authorization, remaining live verification and compliance acceptance work are outstanding. Prisma regeneration was not rerun; the previously documented Windows DLL issue remains unverified.
