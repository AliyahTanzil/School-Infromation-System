# Library administration API

Routes are mounted under `/api/libraries` and `/api/v1/libraries`. Authentication, resolved single-school context and the existing platform/school administrator role boundary apply. Services reject missing tenant or school ownership before database access.

## Return a loan

`POST /:libraryId/loans/:loanId/return` requires UUID path identifiers and returns `{ "data": <returned loan> }` on success.

The transaction reads the active loan under tenant, school and library scope, then conditionally changes only that BORROWED loan to RETURNED. Only after claiming the loan does it release the matching BORROWED copy under the same ownership and library scope. Both writes commit together. The response contains the persisted return timestamp.

- No scoped active loan: HTTP 404.
- Loan changed after the initial read: HTTP 409; reload before retrying.
- Copy is unavailable or outside the active library: HTTP 409; the loan transition rolls back.
- Persistence or commit failure: no successful response or partial committed return.

A stale duplicate return cannot release the copy after another request has returned the original loan and borrowed the copy again: the original loan no longer satisfies the conditional BORROWED predicate. This behavior has regression coverage using persistence doubles; live PostgreSQL race verification remains outstanding.

## Remaining audit scope

Borrower identity semantics and eligibility, transactional library/book reference validation on creation, nested read ownership, creation field overrides, strict query validation and circulation audit records remain under SEC-001 review. This checkpoint does not mark the full library authorization audit complete.
