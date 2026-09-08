---
noteId: '65be8650aadf11f1a69467d0979b3e2e'
tags: []
---

# CRUD implementation audit

Requested scope: every user-created record must have a persisted create, read, update and deletion/lifecycle workflow. This inventory lists HTTP verbs found in route files; it does not certify entity-level coverage, active mounts, UI integration or database correctness. Delete may require archive, cancellation or reversal for linked historical records.

| Route file                    | GET | POST | PATCH/PUT | DELETE |
| ----------------------------- | --: | ---: | --------: | -----: |
| academicPeriodRoutes.js       |   1 |    2 |         1 |      0 |
| academicPolicyRoutes.js       |   2 |    1 |         1 |      0 |
| accountRoutes.js              |   2 |    2 |         2 |      1 |
| activationRoutes.js           |   2 |    1 |         0 |      0 |
| aiAcademicRoutes.js           |   2 |    1 |         0 |      0 |
| aiChatRoutes.js               |   1 |    2 |         0 |      0 |
| aiIntelligenceRoutes.js       |   1 |    1 |         0 |      0 |
| aiReportRoutes.js             |   1 |    4 |         0 |      0 |
| analyticsRoutes.js            |   4 |    1 |         0 |      0 |
| assetInventoryRoutes.js       |   3 |    3 |         1 |      0 |
| assignmentRoutes.js           |   1 |    1 |         1 |      0 |
| attendanceRoutes.js           |   2 |    2 |         1 |      0 |
| authRoutes.js                 |   2 |   10 |         0 |      1 |
| billingRoutes.js              |   1 |    2 |         0 |      0 |
| biometricRoutes.js            |   1 |    3 |         0 |      0 |
| boardingRoutes.js             |   4 |    5 |         1 |      0 |
| classroomCalendarRoutes.js    |   1 |    0 |         0 |      0 |
| classroomLiveSessionRoutes.js |   3 |    1 |         1 |      0 |
| classroomStreamRoutes.js      |   1 |    3 |         0 |      0 |
| classRoutes.js                |   3 |    3 |         1 |      0 |
| communicationRoutes.js        |   5 |    2 |         1 |      0 |
| digitalClassroomRoutes.js     |   2 |    2 |         1 |      1 |
| documentationRoutes.js        |   1 |    0 |         0 |      0 |
| examinationRoutes.js          |   2 |    3 |         2 |      0 |
| featureUnavailableRoutes.js   |   0 |    0 |         0 |      0 |
| financeCoreRoutes.js          |   2 |    1 |         0 |      0 |
| financeRoutes.js              |   4 |    2 |         0 |      0 |
| gradebookRoutes.js            |   2 |    3 |         3 |      0 |
| healthRoutes.js               |   5 |    0 |         0 |      0 |
| hrRoutes.js                   |   3 |    4 |         1 |      0 |
| integrationRoutes.js          |   1 |    2 |         0 |      0 |
| iotRoutes.js                  |   1 |    1 |         0 |      0 |
| libraryRoutes.js              |   3 |    5 |         0 |      0 |
| materialRoutes.js             |   2 |    1 |         1 |      0 |
| parentRoutes.js               |   1 |    1 |         1 |      1 |
| paymentGatewayRoutes.js       |   2 |    3 |         0 |      0 |
| platformAdminRoutes.js        |   1 |    1 |         0 |      0 |
| quizRoutes.js                 |   2 |    4 |         2 |      0 |
| rbacRoutes.js                 |   4 |    2 |         1 |      1 |
| resultRoutes.js               |   2 |    1 |         1 |      0 |
| schoolRoutes.js               |   5 |    4 |         2 |      2 |
| searchRoutes.js               |   1 |    0 |         0 |      0 |
| securityAdminRoutes.js        |   1 |    2 |         0 |      0 |
| securityRoutes.js             |   3 |    0 |         0 |      0 |
| singleSchoolRoutes.js         |   1 |    0 |         1 |      0 |
| smartIdentityRoutes.js        |   2 |    1 |         0 |      0 |
| studentDomainRoutes.js        |   2 |    2 |         1 |      0 |
| studentRoutes.js              |   2 |    3 |         2 |      0 |
| subjectRoutes.js              |   2 |    1 |         2 |      0 |
| submissionRoutes.js           |   1 |    1 |         1 |      0 |
| teacherRoutes.js              |   3 |    1 |         1 |      0 |
| tenantAdminRoutes.js          |   1 |    0 |         0 |      0 |
| tenantLifecycleRoutes.js      |   2 |    3 |         2 |      0 |
| timetableRoutes.js            |  10 |    9 |         7 |      4 |
| transportRoutes.js            |   5 |    5 |         1 |      0 |
| userRoutes.js                 |   3 |    4 |         3 |      2 |

Confirmed gaps: Subjects UI has no edit/delete; classAssignments accepted only on create. Teachers route has status changes but no profile PATCH. Remaining modules require entity-by-entity service, UI and persistence verification. Overall application CRUD completion is not certified.

## Implemented checkpoint: Subjects

Added UI edit and confirmed-delete controls, transactional class reassignment and soft-delete API. Confirmed catalog/read queries exclude deleted subjects and mutation scope includes authenticated tenant and school. Two frontend tests and 11 focused backend tests pass; both builds and focused lint pass. See docs/api/subject-crud.md. Other modules are not yet certified as complete CRUD.
