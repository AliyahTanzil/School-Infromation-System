# SEC-001 Phase 62: submission owner review access

Submission routes recognize authenticated platform owners without requiring duplicate administrator roles. Controllers pass persisted roles and platform ownership separately from request input into list, version-save and retraction services. This applies to both `/api/lms/submissions` and `/api/v1/lms/submissions`.

Owners and administrators must provide an assignment identifier to review submissions, and the assignment must belong to the authenticated tenant and school. Teachers still require classroom ownership or active teacher membership. Student lists remain restricted to the authenticated student's submissions, including when no assignment filter is supplied.

Review privileges do not bypass active student classroom membership for version writes or retractions. Version creation binds student identity to the authenticated account, and retractions first resolve that student's scoped submission. Published-assignment and submission lifecycle restrictions remain enforced.

Six behavioral regression tests cover middleware ordering, owner review, forged request claims, teacher membership, learner write ownership and lifecycle restrictions. Together with the existing submission contracts, all 12 focused tests pass. TypeScript compilation, runtime copying, compiled health/protected-route smoke checks, targeted lint and formatting checks pass.

The full backend suite passes with 599 tests passed and one intentional live-database skip. Diff checks also pass. SEC-001 remains IN_PROGRESS for remaining authorization, live verification and compliance work. Prisma regeneration was not rerun; the previously documented Windows DLL issue remains unverified.
