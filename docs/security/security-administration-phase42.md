# SEC-001 Phase 42: HR administration boundaries

Date: 2026-09-09

## Changes

- Employee queries and identifier objects reject unknown fields; employee emails are trimmed and bounded.
- Controllers preserve authenticated school ownership over query/body fields and take leave approver identity exclusively from the authenticated user.
- All HR service entry points reject incomplete tenant/school ownership before querying persistence.
- Employee and leave reference checks share their creation transactions. Referenced departments/positions must be active and scoped; employees must belong to the scoped school.
- Employee, leave and payroll inserts retain server-controlled ownership and initial statuses. Payroll totals remain calculated by the server.
- Leave decisions reject absent approver identity and unsupported decisions before persistence.

The existing HTTP payload schemas already rejected ownership fields on creation. Service-level assignment ordering adds defense in depth for internal callers; it does not imply those payloads were accepted by the validated HTTP routes.

## Verification

- Focused HR contract and administration suite: 12 passed, covering request validation, missing scope, reference ownership, transaction boundaries, controller identity and payroll defaults.
- Full backend suite: 459 passed, one intentional live-database skip, zero failures.
- Backend production build, targeted ESLint, formatting and diff checks: passed.

## Remaining work

SEC-001 remains in progress. No schema migration or live HR/payroll data changes were made. Tests use isolated persistence doubles. Live database concurrency checks, payroll monetary limits and remaining module/compliance audits are separate outstanding work.

See [HR API contract](../backend/hr-administration-api.md).
