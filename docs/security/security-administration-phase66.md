# SEC-001 Phase 66: global search owner access and school scope

Global search recognizes persisted platform ownership without duplicate administrator roles. Controllers pass authenticated roles and platform ownership separately from search input. Owners receive administrator classroom and assignment visibility within the resolved school. This applies to `/api/search`, `/api/v1/search`, `/api/lms/search` and `/api/v1/lms/search`.

The service now requires tenant, school and actor identity before any query, including empty searches. Every category query explicitly includes tenant and school ownership; classroom-derived categories also retain accessible classroom identifiers. Ordinary users still require classroom ownership or active membership. Assignment management follows classroom ownership or active teacher membership, and learner searches retain published/closed status and availability restrictions. Materials remain active, and announcements/posts remain published.

Six new behavioral regressions cover authentication/context ordering, owner visibility, explicit category scope, forged owner claims, existing administrator access, missing context and empty/inaccessible classroom results. Existing assignment fixtures continue to verify draft, future and cross-school exclusions. All 13 focused tests pass, along with TypeScript compilation, runtime copying, compiled health/protected-route smoke checks, targeted lint, formatting and diff checks.

SEC-001 remains IN_PROGRESS for remaining authorization acceptance review, live verification and compliance work. The full backend suite and Prisma regeneration were not rerun; Phase 65 passed 619 tests with one intentional database skip. The previously documented Windows DLL regeneration issue remains unverified.
