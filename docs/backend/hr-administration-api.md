# HR administration API

The same HR routes are mounted under `/api/hr` and `/api/v1/hr`. Authentication, the configured single-school context, and the existing school/platform administrator authorization middleware are required. Tenant and school ownership come from that context; clients must not submit ownership fields.

| Method | Path                         | Request                                                                                            |
| ------ | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| GET    | `/dashboard`                 | No body; scoped employee, leave, payroll, department and position summary                          |
| GET    | `/employees`                 | Optional `status`: APPLICANT, ACTIVE, ON_LEAVE or INACTIVE; at most 100 records                    |
| POST   | `/employees`                 | `employeeNumber`, `firstName`, `lastName`; optional nullable `email`, `departmentId`, `positionId` |
| GET    | `/leave-requests`            | No body; at most 100 scoped requests, newest first                                                 |
| POST   | `/leave-requests`            | `employeeId`, `leaveType`, `startsAt`, `endsAt`; optional `reason`                                 |
| PATCH  | `/leave-requests/:id`        | `status`: APPROVED or REJECTED                                                                     |
| POST   | `/payroll-runs`              | `periodStart`, `periodEnd`                                                                         |
| POST   | `/payroll-runs/:id/finalize` | UUID route identifier; no body required                                                            |

Responses wrap records in `{ "data": ... }`; creation returns HTTP 201. Employee query fields, mutation payloads and declared identifier parameters reject unknown fields. Identifier values must be UUIDs. End dates cannot precede start dates. Email values are trimmed, validated and bounded to 320 characters.

Employee creation verifies any department and position are active and belong to the authenticated school in the same transaction as the employee insert. New employees start as APPLICANT. Leave creation verifies the employee belongs to the authenticated school inside its creation transaction; new requests start as PENDING. Foreign references do not create records. Leave decisions use the authenticated approver and only update pending requests.

Payroll creation derives eligible employees and salaries within the authenticated scope, calculates the total on the server, and starts the run as DRAFT. Finalization only updates a scoped DRAFT run. Service operations reject missing tenant or school context before database access. Invalid input returns 400, missing ownership/approver context returns 403, missing employees or already-decided leave requests return 404, and unsuccessful payroll finalization returns 409.

Payroll creation requires every eligible employee to have a position returned by the school-scoped position lookup. Missing positions are not treated as zero salary. An explicitly configured zero salary is accepted. Each salary must be a numeric whole number of minor units from 0 through 2,147,483,647, and the combined run total must fit the same range. Invalid salaries, missing position references and aggregate overflow return HTTP 400 before any payroll run or item insert. Validated item amounts are reused for both item persistence and the run total.

Finalization requires the authenticated actor and runs at serializable isolation. It validates persisted gross, deduction and net amounts as nonnegative signed 32-bit integers, requires gross minus deductions to equal net, rejects duplicate employees and non-pending items, checks employee school ownership, and reconciles the run total against summed net amounts. Invalid drafts return HTTP 400 without finalizing. Empty zero-total drafts and explicit zero-pay items remain supported. Salary changes after draft creation do not rewrite the stored payroll snapshot.

The conditional DRAFT transition and an UPDATE audit record commit together. Audit metadata includes school, previous/new status, total and item count; the actor comes from authentication. An audit failure rolls back the transition. A concurrent transaction conflict returns HTTP 409 and asks the caller to reload before retrying.

These changes do not add employee profile provisioning, deduction editing, payroll creation audit records, or live concurrency verification. Department/position and employee creation reference checks share transactions at the default database isolation level. Finalization has separate serializable transaction coverage using persistence doubles; live race verification remains outstanding.
