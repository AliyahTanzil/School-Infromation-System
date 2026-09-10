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

Borrower identity semantics and eligibility, nested read ownership and circulation audit records remain under SEC-001 review. This checkpoint does not mark the full library authorization audit complete.

## Creation and borrowing reference checks

Library creation copies only `name` and starts the library active. Book creation copies only `title`, `author`, `isbn` and `category`, verifies an active library owned by the authenticated tenant/school inside its insert transaction, and starts the book ACTIVE. Copy creation copies only `barcode`, verifies that active library plus the active book under the same tenant/school/library inside its insert transaction, and starts the copy AVAILABLE.

Borrowing verifies an active scoped library in the transaction. Its conditional copy claim requires an AVAILABLE copy whose book is ACTIVE and belongs to the same tenant, school and library. The new loan copies only `copyId`, `borrowerId` and `dueAt` and starts BORROWED. Missing/inactive library or book references return 404; an unavailable or ineligible borrowing copy returns 409. Failed loan creation rolls back the copy claim. This does not yet validate borrower eligibility.

Caller-provided ownership, identifiers, status and lifecycle timestamps cannot override these server-controlled creation fields. All declared path parameter objects reject unknown fields; book search accepts only optional `q` (trimmed, at most 100 characters). Existing strict mutation bodies remain in effect.

Reference checks and inserts use the existing default transaction isolation. They do not lock libraries/books against concurrent administrative changes. Regression tests use persistence doubles; live race verification remains outstanding.
