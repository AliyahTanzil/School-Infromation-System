---
noteId: '7f307760ae7711f18df517a1f5a83d14'
tags: []
---

# Route Authorization Matrix

Verification that every mounted API router and frontend route enforces authentication and an
authorization (role/permission/context) guard. Produced for Roadmap Phase 1: "Verify role and
permission checks for every mounted API and frontend route."

Method: enumerate the routers mounted by the active composition root
(`backend/src/foundation/app.ts`) and read each router's guard middleware
(`router.use(...)` and per-route guards). A regression test,
`backend/tests/unit/routeAuthorizationCoverage.test.js`, now fails if any mounted router loses
its authentication guard.

## Frontend

All non-public routes in `frontend/src/App.jsx` are wrapped in the `Protected` guard
(`frontend/src/App.jsx:912`), which:

- renders a loading state while the session is resolving;
- redirects unauthenticated users to `/login` (`<Navigate to="/login" replace />`);
- redirects authenticated users who lack an allowed account type/role/platform role to their
  own landing route.

Public routes are limited to the landing page, the `/login`, `/register`, `/owner|manager|tenant|staff`
auth screens, `/forgot-password`, and the resettable `/platform-admin` and `/tenant-admin` redirects.

## Backend — routers mounted by the active app

| Mount                            | Router                       | Guards                                                              |
| -------------------------------- | ---------------------------- | ------------------------------------------------------------------- |
| `/api/health`                    | `healthRoutes`               | public (process/database probes)                                    |
| `/api` docs                      | `documentationRoutes`        | public (OpenAPI UI) — see findings                                  |
| `/api/billing`                   | `featureUnavailableRoutes`   | public 501 stub                                                     |
| `/api/auth`                      | `authRoutes`                 | `authenticate` on protected routes; login/refresh public            |
| `/api/activation-requests`       | `activationRoutes`           | `authenticate` + `requireApplicationOwner`                          |
| `/api/users`                     | `userRoutes`                 | `authenticate` + `singleSchoolContext`                              |
| `/api/school`                    | `singleSchoolRoutes`         | `authenticate` + `singleSchoolContext`                              |
| `/api/schools`                   | `schoolRoutes`               | `authenticate` (+ school-admin guard)                               |
| `/api/students`                  | `studentDomainRoutes`        | `authenticate` + `singleSchoolContext` + per-route perms            |
| `/api/parents`                   | `parentRoutes`               | `authenticate` + `singleSchoolContext` + `requireParentContext`     |
| `/api/teachers`                  | `teacherRoutes`              | `authenticate` + `teacherContext`                                   |
| `/api/subjects`                  | `subjectRoutes`              | `authenticate` + `teacherContext` + `subjectAdmin`                  |
| `/api/classes`                   | `classRoutes`                | `authenticate` + `teacherContext` + `classAdmin`                    |
| `/api/attendance`                | `attendanceRoutes`           | `authenticate` + `teacherContext` + `authorizeSchoolAdminOrTeacher` |
| `/api/academic-policies`         | `academicPolicyRoutes`       | `authenticate` + `teacherContext` + `authorizeSchoolAdmin`          |
| `/api/academic-periods`          | `academicPeriodRoutes`       | `authenticate` + `singleSchoolContext` + `academicPeriodAdmin`      |
| `/api/examinations`              | `examinationRoutes`          | `authenticate` + `teacherContext`                                   |
| `/api/results`                   | `resultRoutes`               | `authenticate` + `teacherContext`                                   |
| `/api/timetables`                | `timetableRoutes`            | `authenticate` + `teacherContext` + `authorizeSchoolAdmin`          |
| `/api/lms/calendar`              | `classroomCalendarRoutes`    | `authenticate` + `teacherContext`                                   |
| `/api/finance`                   | `financeRoutes`              | `authenticate` + `teacherContext` + `authorizeSchoolAdmin`          |
| `/api/payment/*`                 | `paymentGatewayRoutes`       | `authenticate` + `teacherContext` + `authorizeSchoolAdmin`          |
| `/api/communication`             | `communicationRoutes`        | `authenticate` + `teacherContext`                                   |
| `/api/hr`                        | `hrRoutes`                   | `authenticate` + `teacherContext` + `hrAdmin`                       |
| `/api/libraries`                 | `libraryRoutes`              | `authenticate` + `teacherContext` + `libraryAdmin`                  |
| `/api/assets-inventory`          | `assetInventoryRoutes`       | `authenticate` + `teacherContext` + `authorizeSchoolAdmin`          |
| `/api/transport`                 | `transportRoutes`            | `authenticate` + `teacherContext` + `authorizeSchoolAdmin`          |
| `/api/boarding`                  | `boardingRoutes`             | `authenticate` + `teacherContext` + `authorizeSchoolAdmin`          |
| `/api/lms/classrooms`            | `digitalClassroomRoutes`     | `authenticate` + `teacherContext`                                   |
| `/api/lms/classroom-stream`      | `classroomStreamRoutes`      | `authenticate` + `teacherContext`                                   |
| `/api/lms/assignments`           | `assignmentRoutes`           | `authenticate` + `teacherContext`                                   |
| `/api/lms/materials`             | `materialRoutes`             | `authenticate` + `teacherContext`                                   |
| `/api/lms/submissions`           | `submissionRoutes`           | `authenticate` + `teacherContext` + `authorizeSubmissionUser`       |
| `/api/lms/quizzes`               | `quizRoutes`                 | `authenticate` + `teacherContext` + `authorizeQuizUser`             |
| `/api/lms/live-sessions`         | `classroomLiveSessionRoutes` | `authenticate` + `teacherContext`                                   |
| `/api/lms/gradebook`             | `gradebookRoutes`            | `authenticate` + `teacherContext` + `authorizeGradebookUser`        |
| `/api/analytics`                 | `analyticsRoutes`            | `authenticate` + `singleSchoolContext` + per-route guards           |
| `/api/search`, `/api/lms/search` | `searchRoutes`               | `authenticate` + `singleSchoolContext`                              |
| `/api/import`                    | `importRoutes`               | `authenticate` + `singleSchoolContext` + `authorizeSchoolAdmin`     |

Every mounted domain router enforces `authenticate`; authorization then comes from a school
context, a role/context guard, or per-route `requirePermission` codes drawn from the canonical
catalog (`backend/src/shared/authorization/permissionCodes.js`).

## Findings

- **Orphaned, unguarded route modules.** The following route modules are not imported by the
  active app and contain no `authenticate` guard: `aiAcademicRoutes.js`, `aiChatRoutes.js`,
  `aiIntelligenceRoutes.js`, `aiReportRoutes.js`, `financeCoreRoutes.js`, `iotRoutes.js`,
  `securityAdminRoutes.js`, `smartIdentityRoutes.js`, `tenantAdminRoutes.js`, and
  `studentRoutes.js`. They are not reachable today, but each is a latent hole if wired in.
  They should be deleted or guarded before use.
- **Legacy aggregator.** `backend/src/presentation/http/routes/index.js` is not imported by the
  runtime (the active app mounts routers directly); several older tests still read it. This is
  the dual-composition-root issue tracked in `docs/database/prisma-route-reconciliation.md`.
- **Public OpenAPI UI.** `documentationRoutes` is mounted at `/api` and `/api/v1` without
  authentication, exposing the API contract publicly. Confirm this is intended, or gate it.

## Follow-up (out of scope here)

Per-endpoint fine-grained permission coverage (which specific `requirePermission` code each
route requires) remains under SEC-001.
