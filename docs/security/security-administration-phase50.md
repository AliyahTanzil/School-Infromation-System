# SEC-001 Phase 50: library borrower eligibility

Borrowing now verifies the referenced User inside its circulation transaction before claiming a copy. The borrower must belong to the authenticated tenant, be ACTIVE and not be soft-deleted. Only the resolved user ID is persisted, including audit metadata. Missing IDs cannot broaden a query, and inaccessible borrowers receive the same not-found response. Historical returns remain supported after borrower deactivation.

Nine new regressions cover successful ordering and identity, missing/foreign/deleted/inactive/wrong users, absent IDs and lookup failures. Existing audit rollback, copy conflicts and return tests remain in effect. See the [API contract](../backend/library-administration-api.md#borrower-identity-and-eligibility).

SEC-001 remains IN_PROGRESS. Live borrower-status races, circulation concurrency, administrator access consistency across remaining modules and other compliance work remain outstanding.

Verification: Focused library suite: 33 passed. Full backend: 512 passed, one intentional database skip. Backend TypeScript compilation/runtime copy, targeted lint, formatting and diff checks pass.
