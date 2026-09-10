# SEC-001 Phase 47: library creation ownership

Date: 2026-09-10

Library, book, copy and loan creation now copy only supported fields. Authenticated ownership, route references and initial lifecycle states cannot be overwritten by the payload. Book/copy creation and borrowing verify an active library under tenant/school scope inside their persistence transactions. Copies require an active scoped book; borrowing's conditional copy claim requires an active book in that same scope and library.

Unknown path-parameter and book-search query fields are rejected. Seven new regressions cover allowed persistence fields, server-controlled defaults, inaccessible/inactive references, scoped borrowing predicates, failed loan rollback and strict requests. All 17 focused library tests pass.

No schema or live data changes were made. These tests use persistence doubles. Creation transactions remain at default isolation and do not lock reference records against concurrent lifecycle changes. Borrower eligibility, nested read ownership, circulation audit records and live concurrency verification remain outstanding. SEC-001 remains IN_PROGRESS.

See the [library API contract](../backend/library-administration-api.md).

Verification: full backend suite 489 passed, one intentional live-database skip; backend production build, targeted lint, formatting and diff checks passed.
