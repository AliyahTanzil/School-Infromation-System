---
noteId: 'efb2eff0a1b511f1ab4dd581c2b3a5d4'
tags: []
---

# Prisma and Mounted Route Reconciliation

Date: 2026-08-26  
Task: DB-001

## Decision

`backend/prisma/schema.prisma` is the authoritative persistence contract. A route is operational only when all Prisma delegates reachable from that mounted route exist in the generated client. Source files for future modules may remain in the repository, but they must not be mounted as operational APIs until their schema task is complete.

## Supported mounted domains

| Domain                   | Prisma delegates                                                                                                                                               | Decision                                                  |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Authentication/session   | `user`, `userSession`, `refreshToken`, `passwordResetToken`, `emailVerificationToken`, `loginAttempt`, `auditLogin`, `trustedDevice`                           | Operational                                               |
| RBAC                     | `role`, `permission`, `userRole`, `rolePermission`                                                                                                             | Operational                                               |
| Users/accounts           | `user`, `userProfile`, `userPreference`, `userAudit`, `userDevice`                                                                                             | Operational                                               |
| Tenants/schools          | `tenant`, `tenantSetting`, `school`, `campus`                                                                                                                  | Operational                                               |
| Students/guardians       | `student`, `guardian`, `studentGuardian`, `enrollment`                                                                                                         | Operational student contract                              |
| Parent portal            | `parent`, `parentProfile`, `parentStudentRelationship`, `parentAccessLog`                                                                                      | Operational after PARENT-001                              |
| Teachers                 | `teacher`, `teacherProfile`, `teacherEmployment`, `teacherQualification`, `teacherCertification`, `teacherDepartment`, `teacherAvailability`, `teacherHistory` | Operational after TEACHER-001                             |
| Subjects                 | `subject`                                                                                                                                                      | Operational after SUB-001                                 |
| Classes and enrollment   | `gradeLevel`, `classroom`, `class`, `classEnrollment`, `classTeacher`, `classSubject`, `classHistory`                                                          | Operational after CLS-001                                 |
| Attendance               | `attendanceSession`, `attendanceRecord`, `attendanceAudit`                                                                                                     | Operational after ATT-001                                 |
| Academic periods         | `academicYear`, `academicTerm`                                                                                                                                 | Operational                                               |
| Academic grading policy  | `gradeScheme`, `gradeBand`, `assessmentWeight`, `gradeSchemeHistory`                                                                                           | Operational after POL-001                                 |
| Notifications foundation | `notification`                                                                                                                                                 | Model exists; advanced delivery contract deferred         |
| Audit/platform actions   | `auditLog`                                                                                                                                                     | Operational; platform actions now use this existing model |
| Health/database          | `$queryRaw`, `$disconnect`                                                                                                                                     | Operational                                               |

## Missing delegate inventory

The following delegates are referenced by deferred service source files but are absent from the active schema. Their public route families return `501 FEATURE_NOT_IMPLEMENTED` until the named queue task implements the persistence contract.

| Queue task        | Missing Prisma delegates                                                                                                                                                                            |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| EXM-001 / RES-001 | `examination`, `examinationMark`, `result`                                                                                                                                                          |
| TTB-001           | `academicPeriod`, `timetable`, `scheduleEntry`, `schedulingConflict`, `timetableAudit`, `scheduleSubstitution`                                                                                      |
| FIN-001 / PAY-001 | `invoice`, `payment`, `financialTransaction`, `paymentIntent`, `paymentAttempt`, `gatewayWebhookEvent`                                                                                              |
| COM-001           | `notificationRecipient`, `notificationPreference`, `notificationDelivery`                                                                                                                           |
| HR-001            | `employee`, `leaveRequest`, `payrollRun`, `hRDepartment`                                                                                                                                            |
| LIB-001           | `library`, `book`, `bookCopy`, `libraryMember`, `borrowTransaction`, `fine`, `reservation`                                                                                                          |
| AST-001           | `asset`, `assetMaintenance`, `inventoryItem`, `warehouse`, `purchaseOrder`                                                                                                                          |
| TRN-001           | `vehicle`, `transportDriver`, `transportRoute`, `transportTrip`, `vehicleInspection`                                                                                                                |
| BRD-001           | `dormitory`, `dormitoryRoom`, `dormitoryBed`, `boardingAllocation`, `boardingApplication`                                                                                                           |
| SEC-001           | `securityEvent`, `securityAlert`, `loginSession`, `backupJob`, `securityLoginAttempt`, `securityAuditLog`                                                                                           |
| ANA-001           | `analyticsMetric`, `kPIDefinition`                                                                                                                                                                  |
| BIO-001           | `biometricDevice`, `biometricAuditEvent`, `biometricVerificationEvent`, `smartIdentity`, `smartIdentityVerification`, `smartIdentityDevice`, `smartIdentityOfflineEvent`, `smartIdentityIdentifier` |
| IOT-001           | `iOTDevice`, `iOTGateway`, `iOTAlert`, `iOTCommand`                                                                                                                                                 |
| INT-001           | `integrationConnection`                                                                                                                                                                             |
| SaaS-001          | `billingSubscription`, `billingUsage`, `billingInvoice`, `billingPlan`, `billingAuditEvent`, `billingWebhookEvent`                                                                                  |

## Explicitly deferred API families

These route families now return HTTP `501` with code `FEATURE_NOT_IMPLEMENTED` and the responsible task ID:

- `/examinations`, `/results`, `/timetables`
- `/finance`, `/payment-gateway`, `/payment/monime/webhook`
- `/communication`, `/hr`, `/libraries`, `/assets-inventory`, `/transport`, `/boarding`
- `/security`, `/security-admin`, `/analytics`
- `/ai-intelligence`, `/ai-academic`, `/ai-reports`, `/ai-chat`
- `/smart-identity`, `/biometrics`, `/iot`, `/integrations`, `/billing`

This is intentionally safer than returning demo data or raising a runtime `TypeError` from an undefined Prisma delegate.

## Runtime note

The local TypeScript entry point mounts a smaller route subset through `backend/src/foundation/app.ts`. Vercel imports `backend/src/app.js`, which mounts the legacy route index. Reconciliation therefore evaluates the larger Vercel route surface; a later architecture task should converge both entry points onto one application factory.

## Re-enabling a deferred route

A future agent may replace a `featureUnavailableRoutes(...)` mount only after its queue task provides:

1. schema models and a non-destructive migration;
2. generated Prisma Client support;
3. validated, tenant-scoped services and authorization;
4. API contract documentation;
5. passing unit/integration tests.
