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

These changes do not add employee profile provisioning, payroll deductions, payroll audit records, or live concurrency verification. Department/position and employee reference checks share transactions; they do not introduce row locks or guarantee concurrent reference changes cannot occur under the default database isolation level.
