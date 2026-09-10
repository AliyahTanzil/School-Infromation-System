# SEC-001 Phase 55: analytics and communication owner access

Analytics exports and communication notification listing, creation and delivery-health reporting now use the shared school administrator guard. Authenticated platform owners no longer require duplicate administrator role assignments for these operations. Existing platform and school administrator roles remain accepted.

Authentication and school-context resolution precede every endpoint. Ordinary teachers, students and parents cannot use administrator endpoints, and request body, query and school-context owner claims cannot grant administrator access. Personal inbox, unread-count, mark-read and preference routes retain their existing authenticated user access and scoped service behavior.

Seven new behavioral regressions cover router ordering, all four administrator endpoints, accepted and rejected identities, forged claims and personal-route guard placement. Existing analytics and communication tests cover scope enforcement and notification recipient ownership. Verification uses isolated fixtures and does not send live notifications.

SEC-001 remains IN_PROGRESS for remaining mixed-role route/service owner consistency, live verification and compliance work.

Verification: 24 focused tests pass. Full backend suite: 555 passed, zero failures and one intentional live-database skip. TypeScript compilation, runtime copying, compiled health/protected-route smoke checks, targeted lint, formatting and diff checks pass using the existing generated Prisma client. Standard npm build was not rerun; the Prisma Windows engine DLL replacement issue recorded in Phase 52 remains unverified.
