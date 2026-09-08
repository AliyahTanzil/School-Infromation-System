# Security administration — Phase 19

Date: 2026-09-08. Task: SEC-001 (in progress).

## Authorization audit wave 2

The active analytics router already resolved the configured single-school context, but its controller discarded that result and reconstructed scope from user claims. The current user schema does not carry a school ID, so analytics queries could fall back to tenant-only filtering and combine records belonging to legacy or stray schools under the same tenant.

Analytics overview, KPI, learning-analytics and export operations now receive the server-resolved `req.schoolContext`. Service entry points fail closed unless both tenant and school identifiers exist, and subject/class learning queries include both identifiers. Client headers and request bodies cannot select the analytics school.

Analytics export requests now require a platform or school administrator at the route boundary and identify their scope as the selected school. Read endpoints remain available to authenticated school users, subject to the resolved single-school context.

## Contract correction

The previously failing class lifecycle contract expected a tenant-only student lookup. It now requires the implementation's stronger tenant, school and soft-delete filter. No class service behavior changed.

## Verification

Eighteen focused analytics, authorization, classroom and class-scope tests pass. The backend production build, targeted lint and diff validation pass. The complete backend suite now passes with 374 tests and one intentional live-database skip.

No database records, exports or sessions were created. SEC-001 remains in progress while the remaining mounted domain routers and compliance controls are audited.
