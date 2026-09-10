# SEC-001 Phase 56: teacher administration owner access

Teacher listing, detail, creation and lifecycle administration now accept authenticated `platformRole: OWNER` without duplicate role assignments. The existing `PLATFORM_ADMIN`, `SCHOOL_ADMIN`, `APPLICATION_MANAGER` and `OWNER` role codes remain supported, consistent with class and subject administration. An application-manager account type alone does not grant access.

Authentication and school-context resolution run before all routes. Body, query and school-context claims cannot grant ownership. The `/me` route remains teacher-only, including for platform owners, and precedes the parameterized detail route. Existing validation and scoped persistence remain in effect.

Four behavioral regressions cover accepted identities, denied ordinary accounts and forged claims, all four administration endpoints, middleware ordering and the teacher self-profile boundary. SEC-001 remains IN_PROGRESS for remaining authorization, live verification and compliance work.

Verification: all nine focused teacher tests pass, including four new behavioral regressions. TypeScript compilation, runtime copying, compiled health/protected-route smoke checks, targeted lint, formatting and diff checks pass. The full suite was not rerun for this route-only change; the latest full run in Phase 55 had 555 passed and one intentional live-database skip. Compilation used the existing Prisma client; the prior Windows DLL regeneration issue remains unverified.
