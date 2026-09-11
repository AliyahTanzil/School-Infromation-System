# SEC-001 Phase 59: material owner access and upload authorization

Material routes and services recognize authenticated platform owners without duplicate administrator roles or classroom membership. Controllers pass authenticated roles/platform ownership separately from request input for listing, uploading, downloading and archival. Existing classroom ownership/teacher membership requirements remain for ordinary users.

Upload permission is checked before private blob storage and checked again before material persistence. The upload handler accepts an injected storage function for isolated tests; production uses the existing private blob client. This prevents unauthorized initial requests from writing blobs before classroom authorization. Concurrent permission changes and storage cleanup after later persistence failures remain outside this checkpoint.

Tenant/school scope, active material filters, non-archived classrooms and learner read-only access remain enforced. Seven behavioral regressions cover route order and roles, upload authorization/storage/persistence order, forged claims, teacher uploads, owner reads/archival, learner restrictions and unavailable classrooms. No live blobs are uploaded during tests.

Verification: all 12 focused material tests pass, including seven new behavioral regressions. TypeScript compilation, runtime copying, compiled health/protected-route smoke checks, targeted lint, formatting and diff checks pass. Full backend suite and Prisma regeneration were not rerun; the latest full run in Phase 55 had 555 passed and one intentional database skip. The prior Windows DLL regeneration issue remains unverified.

SEC-001 remains IN_PROGRESS for remaining LMS authorization, live verification and compliance work.
