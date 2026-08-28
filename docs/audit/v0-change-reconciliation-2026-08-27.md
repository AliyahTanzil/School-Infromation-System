# V0 change reconciliation — 2026-08-27

Baseline: Codex completion commit `73590ad`. Imported V0 range: `788f092..f33b9d5`.

## Retained changes

The V0 commits are preserved. They add substantial schema and service scaffolding for examinations, results, timetables, finance, payments, communications, HR, library, assets, transport, boarding, and Digital Classroom LMS-001 through LMS-005. `PROJECT_PROGRESS.md` is retained as the secondary progress tracker.

## Verification evidence

- Working tree was clean before reconciliation.
- `prisma validate` passes.
- Backend TypeScript build passes.
- After installing the committed `@vercel/blob` dependency, the deterministic backend suite passes: 99 passed, 1 intentional live-database skip.
- The first test run correctly failed because the committed dependency had not been installed locally.

## Differences from the Codex completion contract

The imported tasks remain in `REVIEW`, not `DONE`, until these gaps are closed:

1. The active Prisma schema gained hundreds of lines, but no migrations were checked in for the V0 task range.
2. The local VS Code entry point (`backend/src/foundation/app.ts`) does not mount the imported route families, so they return 404 locally even when the legacy/Vercel router exposes them.
3. Examination routes read `req.user.schoolId`, which authentication does not provide; they need validated school-context middleware.
4. Material routes currently have no authentication, authorization, tenant context, or request validation.
5. Several imported routes accept unvalidated request bodies and identifiers.
6. The claimed vertical slices lack task-specific integration tests, API documentation, and complete frontend integration required by `ROADMAP_TODO.md`.
7. Results and finance remain explicitly unavailable in the legacy route index despite being marked complete in the imported progress claims.

## Reconciliation decision

- Original Codex-complete tasks DB-001 through POL-001 remain `DONE` (8/48).
- EXM-001, RES-001, TTB-001, FIN-001, PAY-001, COM-001, HR-001, LIB-001, and AST-001 passed reconciliation and are `DONE`; the other 7 imported V0 tasks remain in `REVIEW`.
- LMS-006 is `BLOCKED` until its reviewed prerequisites are promoted to `DONE`.
- Review work proceeds in dependency order; TRN-001 is next. Each slice must receive migrations, active-server mounts, validated tenant/school authorization, frontend integration, documentation, focused tests, and full verification before promotion.
