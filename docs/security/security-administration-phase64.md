# SEC-001 Phase 64: classroom stream owner access

Authenticated platform owners can read classroom streams, create announcements and posts, and comment without duplicate administrator roles or classroom membership. Controllers pass persisted roles and platform ownership separately from request input on both `/api/lms/classroom-stream` and `/api/v1/lms/classroom-stream`.

Active classroom lookup retains tenant and school scope. Ordinary users require active membership or classroom ownership; announcements additionally require teacher membership unless the actor is a classroom owner or administrator. Student members retain post/comment access. Stream reads and comment targets remain restricted to published records. Owner privileges cannot bypass a missing scoped classroom or post.

Announcement and post creation now select supported content fields explicitly. Caller data cannot replace tenant, school, classroom or author identity, and post status remains controlled by the persistence default. Announcement drafts retain a null publication timestamp. Strict HTTP payload validation remains in place.

Seven behavioral regressions cover middleware ordering, all four owner paths, forged ownership fields, draft timestamps, inaccessible resources, member restrictions and existing administrator/teacher access. All 12 focused stream tests pass. TypeScript compilation, runtime copying, compiled health/protected-route smoke checks, targeted lint, formatting and diff checks pass.

SEC-001 remains IN_PROGRESS. Next authorization review targets are gradebook and global search, followed by remaining live verification and compliance acceptance work. The full backend suite and Prisma regeneration were not rerun; Phase 62 passed 599 tests with one intentional database skip, and the previously documented Windows DLL issue remains unverified.
