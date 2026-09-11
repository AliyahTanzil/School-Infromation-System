# SEC-001 Phase 67: bounded classroom calendar ranges

The classroom calendar at `/api/lms/calendar` and `/api/v1/lms/calendar` now requires valid, ordered dates no more than 366 days apart. Unknown query fields are rejected. The shared range rule runs at HTTP validation and at service entry, so invalid or excessive windows cannot reach persistence or lesson expansion. Invalid HTTP requests use the existing 400 validation response.

Weekly lesson expansion visits UTC calendar days and includes only lesson start timestamps within the inclusive requested interval. This excludes lessons earlier than a partial-day start or later than a partial-day end, while retaining valid lessons on the final day even when its time precedes the starting day's time. Existing classroom ownership and membership checks remain enforced. Dashboard requests remain within the supported range; no frontend change or database migration is required.

Five behavioral tests cover the maximum range and one-millisecond overflow, reversed/invalid dates, rejection before database reads, timestamp boundaries, final-day inclusion, bounded annual expansion and Express getter-only query coercion. All 14 focused calendar tests pass. TypeScript compilation, runtime copying, compiled health/protected-route smoke checks, targeted lint, formatting and diff checks pass.

SEC-001 remains IN_PROGRESS for remaining authorization acceptance review, live verification and compliance work. The full backend suite and Prisma regeneration were not rerun; Phase 65 passed 619 tests with one intentional database skip. The previously documented Windows DLL regeneration issue remains unverified.
