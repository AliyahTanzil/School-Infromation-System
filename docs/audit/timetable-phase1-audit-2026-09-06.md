---
noteId: 'b5e6b0e0a9b711f1a4417fd76860e8a5'
tags: []
---

# Timetable Phase 1 Audit and Phase 2 Record

Date: 2026-09-06

## Phase 1 audit

SAIS already contained a partial timetable vertical slice: `Timetable`, `TimetableSlot`, `ScheduleEntry`, `SchedulingConflict`, `TimetableVersion`, `TimetableAudit`, `ScheduleSubstitution`, an engine, service, routes, an admin dashboard, and calendar integration.

Existing reusable domain models include `Teacher`, `TeacherAvailability`, `Subject`, `Class`, `ClassTeacher`, `ClassSubject`, `AcademicYear`, `AcademicTerm`, and `ClassEnrollment`. The existing timetable slice was not replaced.

At the start of this work, the following areas were incomplete:

- timetable settings and automatic slot generation
- teaching assignments and workload limits
- subject period requirements
- complete availability enforcement
- explicit timetable rooms/laboratories/resources
- global schedule generation
- teacher-derived timetable reads
- student/classroom authorization views
- controlled manual editing and notifications
- complete conflict, generator, authorization, and stress-test coverage

## Phase 2 implementation

The domain model was reconciled using an additive migration:

- Added `TimetableSettings` for working days, operating hours, lesson duration, breaks, lunch, workload limits, double periods, and Saturday configuration.
- Added `TimetableRoom` for classrooms, laboratories, capacity, and shared resource metadata.
- Added `TeacherTeachingAssignment` for tenant/school/teacher/subject/class/year/term assignments and weekly workload.
- Added `SubjectPeriodRequirement` for weekly frequency, min/max limits, preferred daily periods, double periods, laboratory requirements, and stream restrictions.
- Expanded `TeacherAvailability` with availability kind, recurring flag, and priority.
- Added normalized optional subject, room, teaching-assignment, and academic-year references to existing timetable records while retaining legacy text fields.
- Added Prisma relations for timetable records and referenced domain entities.
- Added partial uniqueness constraints preventing non-null class or teacher double-booking in the same timetable slot.
- Added non-destructive migration: `backend/prisma/migrations/20260906100000_timetable_domain_reconciliation/migration.sql`.
- Added contract coverage in `backend/tests/unit/timetableContract.test.js`.

## Phase 2 verification

- Prisma schema validation: passed.
- Timetable contract tests: 4 passed, 0 failed.
- Migration safety: no `DROP TABLE`, `TRUNCATE`, or `DELETE FROM` statements.

## Track record

### Completed or present

- Core timetable persistence and workflow
- Basic conflict detection
- Version and audit persistence
- Admin timetable page
- Calendar integration
- Phase 2 timetable domain reconciliation and migration

### Partial or unfinished

- Settings API and validation
- Settings-driven slot generation
- Teaching-assignment CRUD and workload reporting
- Subject requirement CRUD and validation
- Full availability enforcement in the engine
- Deterministic global timetable generator
- Teacher-derived timetable endpoint and UI
- Classroom/student filtered timetable views
- Conflict-safe manual editor
- Timetable notifications
- Full final audit and generation stress tests

The full timetable feature is not marked complete. The next implementation boundary is Phase 3: persisted timetable settings validation followed by settings-driven school time-slot generation.

## Phase 3 implementation checkpoint

Phase 3 settings and slot generation were implemented on 2026-09-06:

- Added settings validation in `backend/src/domain/timetableEngine.js`.
- Added deterministic lesson, break, and lunch slot generation from school settings.
- Added settings read, upsert, and generated-slot service operations.
- Added authenticated administrator endpoints under the existing timetable routes:
  - `GET /api/timetables/settings`
  - `PUT /api/timetables/settings`
  - `GET /api/timetables/generated-slots`
  - versioned equivalents under `/api/v1/timetables`.
- Added validation schemas and focused settings tests.

Phase 3 verification:

- Focused timetable tests: 7 passed, 0 failed.
- Prisma schema validation: passed.
- Backend TypeScript build: passed.
- Prisma client generation: blocked by Windows `EPERM` while renaming the Prisma query-engine DLL; this is an active-file/process lock, not a schema validation error.

Phase 4 remains: persist generated slots into timetable instances and expose the current school slot structure to the timetable editor.

## Phase 4 implementation checkpoint

Phase 4 was completed on 2026-09-06:

- Added draft/review-only persisted slot generation with `POST /api/timetables/:id/generate-slots` and its `/api/v1` equivalent.
- The service uses the saved school settings, replaces only slots on timetables without existing entries, and records a `SLOTS_GENERATED` audit event.
- Added a `Generate slots` action to `frontend/src/TimetableDashboard.jsx`.
- Existing preview endpoint remains available at `GET /api/timetables/generated-slots`.

Phase 4 verification:

- Timetable focused tests: 7 passed.
- Backend build: passed.
- Frontend tests: 10 passed across 6 files.
- Frontend build: passed.
- Static error check: no errors in touched timetable files.

Remaining timetable work begins with Phase 5: teacher teaching-assignment CRUD and workload reporting.

## Phase 5 implementation checkpoint

Phase 5 was completed on 2026-09-06:

- Added tenant/school-scoped teaching-assignment CRUD under the timetable API:
  - `GET /api/timetables/teaching-assignments`
  - `POST /api/timetables/teaching-assignments`
  - `PATCH /api/timetables/teaching-assignments/:id`
  - `DELETE /api/timetables/teaching-assignments/:id`
  - `GET /api/timetables/teachers/:teacherId/workload`
  - versioned equivalents under `/api/v1/timetables`.
- Every write validates that the teacher, subject, and class belong to the active school and that the term belongs to the selected academic year.
- Composite uniqueness prevents duplicate teacher+subject+class+year+term assignments.
- Workload endpoint aggregates total periods per week and groups assignments by subject and class.
- Fixed a controller syntax slip and contract-test regexes during verification.

Phase 5 verification:

- Focused timetable tests: 7 passed, 0 failed.
- Backend build: passed.

Remaining timetable work begins with Phase 6: subject period requirements CRUD and capacity validation.

## Phase 6 implementation checkpoint

Phase 6 was implemented on 2026-09-06:

- Added administrator-only `GET/POST /api/timetables/subject-period-requirements` and `PATCH/DELETE /api/timetables/subject-period-requirements/:id`, with the same routes under `/api/v1/timetables`.
- List filters support subject, class, academic year and term. PATCH accepts partial updates without resetting omitted fields.
- Writes validate school ownership of subjects/classes and tenant ownership of academic years, plus term/year membership. Existing composite uniqueness prevents duplicate requirements.
- Requested weekly periods must fall within minimum/maximum bounds. Combined requirements for each class/year/term must fit the lesson slots generated from school settings. Updates exclude the previous record from the total.
- Double-period requirements need double periods enabled and adjacent teaching slots. Preferred daily periods, laboratory needs and stream restrictions are saved for later scheduling; capacity validation does not establish full scheduling feasibility.
- Settings changes also validate existing requirements. Serializable transactions protect capacity checks against concurrent requirement/settings writes.
- Corrected settings lookup to use Prisma's compound unique key. Slot generation now skips incomplete lessons, respects the daily period limit and preserves breaks that start between lesson boundaries.
- No additional schema migration is required beyond the existing Phase 2 migration. No database migration was applied during this checkpoint.

Verification: 14 focused timetable tests and backend build passed. Full backend suite: 230 passed, 1 skipped, 0 failed. Service tests use an isolated database double; live database transaction behavior was not exercised.

## Phase 7 implementation checkpoint

Phase 7 recurring teacher availability was implemented on 2026-09-06:

- Added administrator-only `GET/POST /api/timetables/teachers/:teacherId/availability` and `PATCH/DELETE /api/timetables/teachers/:teacherId/availability/:id`, also available under `/api/v1/timetables`.
- Teacher ownership is checked against the active tenant/school; rule IDs are scoped to the selected teacher. PATCH merges omitted fields, then validates the complete rule.
- Weekdays use 1 (Monday) through 7 (Sunday); times use local school `HH:MM`. Rules support `AVAILABLE`, `UNAVAILABLE`, and `PREFERRED`, with priority from 0 to 100.
- With no AVAILABLE rules, a teacher is available unless blocked. Once AVAILABLE windows exist, their union forms the teacher's allowed weekly hours; unlisted days are unavailable. Touching available windows may jointly cover a lesson. Any overlapping UNAVAILABLE rule takes precedence. PREFERRED rules only return a soft preference score for later generation.
- New rules must be recurring. One-off dates cannot be represented by the current model; legacy non-recurring rows are ignored by weekly evaluation.
- Manual lesson insertion validates teacher scope and availability for the complete duration, including adjacent periods. Multi-period lessons cannot cross breaks or day boundaries. Availability conflicts are represented as hard conflicts in the engine.
- Publishing and locking recheck current teacher availability. Availability mutations reject changes that invalidate lessons in non-archived timetables, including deletion of an available window when other weekly windows remain.
- Availability mutation, entry creation/conflict persistence, and status changes run in serializable transactions so related reads and writes are atomic.
- No schema changes or database migrations were applied. Date-specific substitutions, availability UI, and applying preference scores during automatic generation remain later work.

Verification: 22 focused timetable tests passed; full backend suite: 238 passed, 1 skipped, 0 failed. Backend build, targeted ESLint and diff whitespace checks passed. Service tests use database doubles; live database concurrency was not exercised.

Next implementation boundary: Phase 8 room/resource management, followed by deterministic global timetable generation.

## Phase 8 implementation checkpoint

- Added scoped administrator room/resource CRUD at `GET/POST /api/timetables/rooms` and `PATCH/DELETE /api/timetables/rooms/:id`, with versioned equivalents. Rooms store capacity, active state, type and resource labels. Duplicate room codes are rejected by existing school-scoped uniqueness.
- Normalized room assignment validates school ownership, capacity, laboratory type for practical lessons, active state and overlapping lesson spans within a timetable. Publication and locking recheck rooms. Changes that invalidate non-archived lessons are blocked; referenced rooms cannot be deleted. Writes use serializable transactions.
- Added school-scoped timetable options. The dashboard uses school names and a term selector instead of UUID input fields, and empty drafts use the full set of slots generated from saved settings. Reads hydrate subject/class/room/slot labels and refresh selected timetable state after changes.
- Added an editable SSS Science 3A planning preview: Monday-Friday, eight 40-minute periods daily, 08:00-14:00, nine subjects. Mathematics, English, Physics, Chemistry and Biology receive six periods each, including one double period. Geography (3), Agricultural Science (3), ICT (2) and Civic Education (2) are provisional additional subjects pending user confirmation. Break and lunch are included.
- A read-only query of the configured database returned no schools, classes or academic years. The preview is explicitly unsaved and is also delivered in `docs/drafts/sss-science-3a-timetable.md`. No school records, teacher names, assignments or room bookings were fabricated or persisted. Real-data scheduling awaits the school/term and remaining subject details.
- Verification: 25 focused timetable tests passed; full backend suite 241 passed, 1 skipped; frontend suite 12 passed; backend/frontend builds and targeted lint passed. Vite required execution outside the Windows sandbox after an access-denied configuration-loader failure. No migration applied.

Remaining work: real-data draft persistence once school records are available, room management UI, global timetable generation across classes/teachers/rooms, and full scheduling feasibility checks.

## School draft persistence checkpoint

User confirmed Aunty Isha Internation School, First Term, and authorized the remaining setup. Migration 20260906100000_timetable_domain_reconciliation applied successfully. Saved the 2026/27 First Term SSS Science 3A draft with nine subjects, nine requirements, 40 lessons and 50 total slots. Database read-back verified all subject totals and school configuration. No teacher/room identities were fabricated; assignments remain pending. Dates and capacity are marked as planning assumptions in School.settings and the version snapshot. The local timetable document now reflects the saved draft.

## Phase 9 room-management UI checkpoint

- Added school-scoped room/resource listing and creation to the timetable dashboard.
- Administrators can configure classrooms, laboratories, shared resources, capacity and resource labels, then activate or deactivate unused rooms.
- The UI uses the existing validated room endpoints and surfaces backend errors instead of simulating persistence.
- Empty-school requests are guarded until a school context exists. The previously saved timetable data was removed when all tenants were explicitly deleted; no replacement school, teacher or room data was fabricated.
- Verification: 10 focused timetable contracts passed, 13 frontend tests passed, and backend/frontend production builds passed.

Next implementation boundary: teaching-assignment and recurring availability management UI, followed by deterministic global timetable generation.

## Phase 10 staffing UI checkpoint

- Added real teaching-assignment management to the timetable page for teacher, subject, class, academic term, and weekly-period allocation.
- Added recurring weekly teacher availability management for available, unavailable, and preferred windows.
- Extended timetable options with school-scoped teacher identities and profiles; no placeholder staff are created.
- Assignment and availability removal use the existing protected APIs and all errors are surfaced in the timetable status area.
- Verification: 15 focused timetable/availability/room tests, 13 frontend tests, frontend build, and targeted lint pass.

Next implementation boundary: deterministic global generation with feasibility reporting across requirements, assignments, availability, classes, and rooms.

## Phase 11 deterministic generation checkpoint

- Added `POST /api/timetables/:id/generate-schedule` and the versioned equivalent through the existing timetable mount.
- Generation is deterministic and uses saved subject requirements, active teaching assignments, recurring teacher availability, class capacities, active rooms/laboratories, and persisted timetable slots.
- Class, teacher, and room occupancy are enforced across every consumed slot. Double periods require adjacent slots; laboratory requirements select laboratory rooms.
- Generation is atomic and restricted to empty draft timetables. Any missing assignment, room, availability, or placement capacity returns a detailed feasibility error and persists nothing.
- Successful generation writes normalized schedule entries and a `SCHEDULE_GENERATED` audit record. The timetable UI exposes the action only for empty drafts.
- Verification: backend/frontend builds, targeted lint, frontend suite, and focused timetable contracts pass.

Next implementation boundary: generator quality improvements (preference scoring and balanced distribution), direct manual entry editing, and end-to-end live-data generation after a new tenant is configured.

## Phase 12 generation-quality checkpoint

- Replaced first-free-slot selection with deterministic candidate scoring.
- Subject lessons are spread across weekdays before repeating beyond each requirement's preferred daily count.
- Class and teacher daily loads are balanced when choosing among otherwise feasible slots.
- Recurring `PREFERRED` teacher windows lower a candidate's score and are selected when hard constraints and load are equal.
- Double periods remain intact and deterministic weekday/time ordering resolves equal scores.
- Verification: 17 focused timetable tests passed, including new distribution and preference tests; targeted lint and backend build verification passed.

Next implementation boundary: controlled manual entry creation/editing and stronger hard workload constraints in generation.
