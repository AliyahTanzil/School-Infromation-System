# Timetable live readiness audit

Date: 2026-09-07. All database operations were read-only.

## Existing configuration

No SINGLE_SCHOOL_ID is configured. Existing school records are Aunty Isha Internation School and Medishatu International School. The main-school choice is pending; neither record was selected, changed, deleted or converted.

Aunty Isha contains one class, nine subjects, nine subject-period requirements and one draft timetable, SSS Science 3A - First Term 2026/27. It has zero teachers, timetable rooms and teaching assignments. Medishatu has none of these timetable setup records.

## Saved draft checks

The draft has 40 lessons, 40 teaching slots and five break/lunch slots. All lessons passed getEntryTeachingSlots validation. The existing conflict detector returned no conflicts. This does not establish staffing feasibility: all 40 entries lack both teachers and rooms.

| Subject              | Required weekly periods | Saved periods |
| -------------------- | ----------------------: | ------------: |
| Mathematics          |                       6 |             6 |
| English              |                       6 |             6 |
| Physics              |                       6 |             6 |
| Chemistry            |                       6 |             6 |
| Biology              |                       6 |             6 |
| Geography            |                       3 |             3 |
| Agricultural Science |                       3 |             3 |
| ICT                  |                       2 |             2 |
| Civic Education      |                       2 |             2 |

## Remaining live verification prerequisites

1. Designate the main school explicitly.
2. Configure real teachers and subject/class teaching assignments, including availability.
3. Configure real timetable rooms and any laboratories needed, including capacity.
4. Use a separate empty draft to test automatic generation; the existing draft is populated and the generator correctly refuses to overwrite it.
5. Exercise manual edits and publication checks with the real assignments, without releasing an incomplete timetable.

No generation, editing, publication or locking was performed in the live database. No teachers, rooms or assignments were invented. Full end-to-end verification remains blocked by the missing main-school decision and staffing/room setup.

## Phase 16 readiness reporting

The authenticated school-scoped `GET /api/timetables/:id/readiness` endpoint (also mounted at `/api/v1`) now provides a non-mutating report before live generation, editing or publication. It detects missing teaching slots, requirements, rooms, assignments and entry ownership; saved or recalculated hard conflicts; requirement-period mismatches; invalid lesson spans; and current teacher workload-limit breaches. The timetable dashboard shows the returned blockers.

The report was verified with focused backend tests and production builds, but it was not used to generate, edit, publish or lock a live timetable. Its result remains expected to be not ready until real teachers, assignments, availability and rooms are configured.
