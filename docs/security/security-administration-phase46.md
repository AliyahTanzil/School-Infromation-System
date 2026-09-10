# SEC-001 Phase 46: library loan return integrity

Date: 2026-09-10

The previous return path read an active loan, then updated its copy and loan by identifier alone. A delayed duplicate return could release the copy after another request had returned and re-borrowed it. It also lacked ownership predicates on the two writes.

Returns now claim the original scoped BORROWED loan with a conditional update before releasing its scoped BORROWED copy. A lost claim stops before copy access, and an unavailable or foreign copy rolls back the claim. Both transitions retain tenant, school and library ownership. Shared library service ownership validation now fails closed before database access, including before opening borrowing/return transactions.

Six new behavioral tests cover all eight service ownership guards, successful returns, missing loans, stale duplicate returns, unavailable/foreign copies and persistence/commit failures. The focused library suite passes 10 tests. Tests use persistence doubles and do not establish live concurrency behavior. No schema or live data changes were made.

SEC-001 remains IN_PROGRESS. See the [library API contract](../backend/library-administration-api.md) for remaining audit scope; live database race verification is also outstanding.

Verification: full backend suite 482 passed, one intentional live-database skip; backend production build, targeted lint, formatting and diff checks passed.
