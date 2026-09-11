# SEC-001 Phase 61: quiz owner access

Quiz routes recognize authenticated platform owners without requiring duplicate administrator roles. Controllers pass persisted roles and platform ownership separately from request input into list, detail, creation, question, status and attempt-start services. This applies to both `/api/lms/quizzes` and `/api/v1/lms/quizzes`.

School scope and active classroom checks remain enforced. Teachers still require classroom ownership or active teacher membership to manage quizzes. Students see only published quizzes, cannot read answer keys, and can see only their own attempts. Owner access does not bypass student membership for starting attempts or student identity for saving/submitting them. Quiz lifecycle rules remain enforced.

Six behavioral regression tests cover route guards and context ordering, owner controller paths, student visibility, teacher membership, lifecycle restrictions and attempt ownership. Tests use isolated persistence fixtures without live quiz writes.

SEC-001 remains IN_PROGRESS for remaining authorization, live verification and compliance work.

Verification: all 11 focused quiz tests pass. TypeScript compilation, runtime copying, compiled health/protected-route smoke checks and targeted lint pass. Full backend suite and Prisma regeneration were not rerun; the prior Windows DLL regeneration issue remains unverified.
