# SEC-001 Phase 48: nested library read ownership

Date: 2026-09-10

Library search previously scoped books but included copies without independent ownership filters. Loan listing scoped loans but included related copies/books solely by their foreign-key links. Overview counts likewise did not validate those relationships.

Shared read predicates now require tenant, school and requested library ownership throughout book/library and loan/copy/book/library relationships. Search filters included copies. Loan listing excludes rows with inconsistent nested ownership before including related details. Overview counts use the same predicates. Owned historical circulation remains visible for inactive libraries and archived books; active-book search and existing pagination/order rules remain unchanged.

Five regression tests evaluate query predicates against deliberately inconsistent fixtures, checking ownership at each relationship, overview totals, historical visibility, search behavior and foreign library requests. All 22 focused library tests pass. These are query-contract tests using persistence doubles, not live PostgreSQL verification. No migration or live data changes were made.

SEC-001 remains IN_PROGRESS for borrower eligibility, circulation audit records, live verification and remaining module/compliance audits. See the [library API contract](../backend/library-administration-api.md).

Verification: full backend suite 494 passed, one intentional live-database skip; backend production build, targeted lint, formatting and diff checks passed.
