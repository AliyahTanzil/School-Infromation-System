# SEC-001 Phase 68: bounded search input

All four global-search mounts (`/api/search`, `/api/v1/search`, `/api/lms/search` and `/api/v1/lms/search`) now validate query input after authentication and school-context resolution. Supported aliases are `q`, `query` and `search`, in that order of precedence after trimming. Missing or blank terms retain structured empty results.

Each supplied alias must be a string of at most 200 characters before trimming. Arrays, objects, null values and unknown query fields are rejected through the existing 400 validation response. The service also checks type and length before database access. The controller consumes validated queries, including Express getter-only query objects, without coercing malformed values into strings. Existing owner, membership, school-scope and learner assignment-visibility boundaries remain enforced.

Four new regressions cover valid aliases and the exact limit, malformed/oversized input, route validation ordering, rejection before persistence, and validated query handling. All 17 focused search/assignment-visibility tests pass. TypeScript compilation, runtime copying, compiled health/protected-route smoke checks, targeted lint, formatting and diff checks pass.

SEC-001 remains IN_PROGRESS for remaining authorization acceptance review, live verification and compliance work. The full backend suite and Prisma regeneration were not rerun; Phase 65 passed 619 tests with one intentional database skip. The previously documented Windows DLL regeneration issue remains unverified.
