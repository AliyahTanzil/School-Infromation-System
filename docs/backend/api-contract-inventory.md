# API Contract Inventory

Generated from implemented Express route declarations. The mounted prefix is `/api/v1` unless a legacy compatibility route is explicitly documented.

## academicPeriodRoutes

- `GET` '/', validate(academicPeriodQuerySchema), controller.list);
- `POST` '/', validate(academicPeriodCreateSchema), controller.create);
- `PATCH` '/:id/status', validate(academicPeriodStatusSchema), controller.changeStatus);

## academicPolicyRoutes

- `GET` '/', validate(academicPolicyQuerySchema), controller.list);
- `POST` '/', validate(academicPolicyCreateSchema), controller.create);
- `GET` '/:id', controller.get);
- `PATCH` '/:id/status', validate(academicPolicyStatusSchema), controller.changeStatus);

## accountRoutes

- `GET` '/me', controller.me);
- `PATCH` '/me', controller.updateProfile);
- `GET` '/users', controller.listUsers);
- `PATCH` '/users/:id', controller.updateUser);
- `POST` '/users/:id/status', controller.changeStatus);
- `POST` '/users/:id/roles', controller.assignRole);
- `DELETE` '/users/:id/roles', controller.revokeRole);

## activationRoutes

- `GET` '/', controller.listPending);
- `GET` '/outbox', controller.outbox);
- `POST` '/:id/decision', controller.decide);

## aiAcademicRoutes

- `GET` '/overview', overview);
- `POST` '/ask', ask);
- `GET` '/usage', usage);

## aiChatRoutes

- `GET` '/', overview);
- `POST` '/messages', message);
- `POST` '/feedback', feedback);

## aiIntelligenceRoutes

- `GET` '/overview', overview);
- `POST` '/ask', ask);

## aiReportRoutes

- `GET` '/overview', overview);
- `POST` '/generate', generate);
- `POST` '/validate', validate);
- `POST` '/:reportId/approve', approve);
- `POST` '/:reportId/exports', exportReport);

## analyticsRoutes

- `GET` '/overview', overview);
- `GET` '/kpis', kpis);
- `GET` '/kpis/:metricKey', kpi);
- `POST` '/exports', exportReport);

## assetInventoryRoutes

- `GET` '/overview', overview);
- `GET` '/assets', assets);
- `GET` '/inventory', inventory);

## attendanceRoutes

- `GET` '/', validate(attendanceQuerySchema), controller.list);
- `POST` '/', validate(attendanceSessionCreateSchema), controller.create);
- `GET` '/:id', controller.get);
- `PATCH` '/:id/status', validate(attendanceSessionStatusSchema), controller.changeStatus);
- `POST` '/:id/records/bulk', validate(attendanceBulkSchema), controller.markBulk);

## authRoutes

- `POST` '/register', registerLimiter, validate(registerSchema), authController.register);
- `POST` '/login', loginLimiter, validate(loginSchema), authController.login);
- `POST` '/refresh', refreshLimiter, validate(refreshSchema), authController.refresh);
- `POST` '/logout', authenticate, authController.logout);
- `POST` '/logout-all', authenticate, authController.logoutAll);
- `GET` '/me', authenticate, authController.me);
- `GET` '/sessions', authenticate, authController.listSessions);
- `DELETE` '/sessions/:id', authenticate, authController.revokeSession);

## billingRoutes

- `GET` '/overview', getOverview);
- `POST` '/lifecycle', lifecycle);
- `POST` '/webhooks/:provider', webhook);

## biometricRoutes

- `GET` '/devices', controller.list);
- `POST` '/devices', controller.register);
- `POST` '/devices/:deviceId/health', controller.health);
- `POST` '/verifications', controller.verify);

## boardingRoutes

- `GET` '/overview', overview);
- `GET` '/dormitories', dormitories);

## classRoutes

- `GET` '/', validate(classQuerySchema), controller.list);
- `POST` '/', validate(classCreateSchema), controller.create);
- `PATCH` '/:id/status', validate(classStatusSchema), controller.changeStatus);
- `POST` '/:id/enrollments', validate(enrollmentSchema), controller.enroll);

## communicationRoutes

- `GET` '/notifications', async (req, res, next) => {
- `GET` '/notifications/unread-count', async (req, res, next) => {
- `POST` '/notifications', async (req, res, next) => {
- `POST` '/notifications/:notificationId/read', async (req, res, next) => {
- `GET` '/notification-preferences', async (req, res, next) => {
- `PUT` '/notification-preferences', async (req, res, next) => {
- `GET` '/notification-delivery-health', async (req, res, next) => {

## documentationRoutes

- `GET` '/openapi.json', (_req, res) => res.json(openApiDocument));

## examinationRoutes

- `GET` '/', validate(examinationQuerySchema), controller.list);
- `POST` '/', validate(examinationCreateSchema), controller.create);
- `GET` '/:id', controller.get);
- `POST` '/:id/candidates', validate(examinationCandidateSchema), controller.addCandidate);
- `POST` '/:id/schedules', validate(examinationScheduleSchema), controller.addSchedule);
- `PATCH` '/:id/status', validate(examinationStatusSchema), controller.changeStatus);
- `PUT` '/:id/marks', validate(examinationMarkSchema), controller.upsertMark);

## financeCoreRoutes

- `GET` '/summary', async (req, res, next) => {
- `GET` '/transactions', async (req, res, next) => {
- `POST` '/payments/events', async (req, res, next) => {

## financeRoutes

- `GET` '/invoices', validate(invoiceQuerySchema), controller.list);
- `POST` '/invoices', validate(createInvoiceSchema), controller.create);
- `POST` '/payments', validate(paymentSchema), controller.pay);

## healthRoutes

- `GET` '/health', getHealth);
- `GET` '/health/deep', getDeepHealth);
- `GET` '/ready', getReady);
- `GET` '/live', getLive);
- `GET` '/health/database', getDatabaseHealth);

## hrRoutes

- `GET` '/dashboard', controller.dashboard);
- `GET` '/employees', controller.employees);
- `POST` '/employees', controller.createEmployee);
- `POST` '/leave-requests', controller.requestLeave);
- `PATCH` '/leave-requests/:id', controller.approveLeave);

## integrationRoutes

- `GET` '/', controller.list);
- `POST` '/:providerKey/configure', controller.configure);
- `POST` '/:providerKey/health', controller.health);

## iotRoutes

- `GET` '/overview', overview);
- `POST` '/commands', command);

## libraryRoutes

- `GET` '/:libraryId/overview', overview);
- `GET` '/:libraryId/books', books);
- `GET` '/:libraryId/loans', loans);

## parentRoutes

- `GET` '/me', controller.portal);
- `PATCH` '/me/profile', validate(profileSchema), controller.updateProfile);
- `POST` '/me/students', validate(linkSchema), controller.link);
- `DELETE` '/me/students/:studentId', controller.unlink);

## paymentGatewayRoutes

- `GET` '/health', async (_req, res, next) => {
- `GET` '/intents', async (req, res, next) => {
- `POST` '/intents', async (req, res, next) => {
- `POST` '/intents/:id/initialize', async (req, res, next) => {
- `POST` '/webhooks/:provider', async (req, res, next) => {

## platformAdminRoutes

- `GET` '/overview', overview);
- `POST` '/actions', action);

## rbacRoutes

- `GET` '/roles', requirePermission('roles.read'), controller.listRoles);
- `GET` '/roles/:id', requirePermission('roles.read'), controller.getRole);
- `DELETE` '/roles/:id', requirePermission('roles.delete'), controller.deleteRole);
- `GET` '/permissions', requirePermission('permissions.read'), controller.listPermissions);
- `GET` '/me/permissions', controller.myPermissions);

## resultRoutes

- `GET` '/', validate(resultQuerySchema), controller.list);
- `GET` '/statistics', validate(resultQuerySchema), controller.statistics);
- `POST` '/process', validate(resultProcessSchema), controller.process);
- `PATCH` '/:id/status', validate(resultStatusSchema), controller.changeStatus);

## schoolRoutes

- `GET` '/', requirePermission('schools.read'), controller.list);
- `POST` '/', requirePermission('schools.create'), validate(schoolSchema), controller.create);
- `GET` '/:id', requireSchoolContext, requirePermission('schools.read'), controller.get);
- `DELETE` '/:id', requirePermission('schools.delete'), controller.remove);
- `GET` '/:id/admins', requirePermission('schools.assign_admins'), controller.admins);

## securityAdminRoutes

- `GET` '/overview', overview);
- `POST` '/risk/evaluate', risk);
- `POST` '/sessions/:sessionId/revoke', revoke);

## securityRoutes

- `GET` '/overview', controller.overview);
- `GET` '/events', controller.events);
- `GET` '/audit', controller.audit);

## smartIdentityRoutes

- `GET` '/overview', overview);
- `GET` '/verifications', verifications);
- `POST` '/verify', verify);

## studentDomainRoutes

- `GET` '/', requirePermission('student.read'), controller.list);
- `GET` '/:id', requirePermission('student.read'), controller.get);
- `POST` '/', requirePermission('student.create'), controller.create);
- `PATCH` '/:id', requirePermission('student.update'), controller.update);
- `POST` '/:id/guardians', requirePermission('student.update'), controller.addGuardian);

## studentRoutes

- `GET` '/:id', requirePermission('students.read'), controller.get);

## subjectRoutes

- `GET` '/', validate(subjectQuerySchema), controller.list);
- `POST` '/', validate(subjectCreateSchema), controller.create);
- `GET` '/:id', controller.get);
- `PATCH` '/:id', validate(subjectUpdateSchema), controller.update);
- `PATCH` '/:id/status', validate(subjectStatusSchema), controller.changeStatus);

## teacherRoutes

- `GET` '/me', authorize('TEACHER'), controller.me);
- `GET` '/', authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN'), controller.list);
- `GET` '/:id', authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN'), controller.get);
- `POST` '/', authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN'), validate(teacherCreateSchema), controller.create);
- `PATCH` '/:id/status', authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN'), validate(teacherStatusSchema), controller.changeStatus);

## tenantAdminRoutes

- `GET` '/overview', getOverview);

## tenantLifecycleRoutes

- `GET` '/', controller.list);
- `POST` '/', controller.create);
- `PATCH` '/:id', controller.update);
- `POST` '/:id/status', controller.changeStatus);

## timetableRoutes

- Active mounts: `/api/timetables` and `/api/v1/timetables`.
- All operations require authentication, `PLATFORM_ADMIN` or `SCHOOL_ADMIN`, and a validated `x-school-id` context.
- `GET /` lists hydrated timetables, slots, entries, conflicts, and substitutions.
- `POST /` creates a draft with validated time slots and an initial immutable version.
- `POST /:id/entries` adds an entry and recalculates scheduling conflicts.
- `PATCH /:id/status` advances the lifecycle; unresolved hard conflicts block publication.
- `POST /:id/substitutions` records a bounded teacher substitution for a timetable entry.

## transportRoutes

- `GET` '/overview', controller.overview);
- `GET` '/vehicles', controller.vehicles);
- `GET` '/routes', controller.routes);

## userRoutes

- `POST` '/', requirePermission('users.create'), validate(createUserSchema), controller.create);
- `GET` '/:id', requirePermission('users.read'), controller.get);
- `DELETE` '/:id', requirePermission('users.delete'), validate(reasonSchema), controller.remove);
- `POST` '/:id/restore', requirePermission('users.restore'), controller.restore);
- `GET` '/:id/profile', requirePermission('users.read'), controller.profile);
- `DELETE` '/:id/profile-image', requirePermission('users.update'), controller.deleteImage);

### HR (`/api/hr`, `/api/v1/hr`)

Authenticated platform and school administrators must provide `x-school-id`. The API exposes the
HR dashboard, employee list/create, leave list/create/decision, and payroll run create/finalize
workflows. Tenant and school ownership are derived from the authenticated context and cannot be
supplied in request bodies. Payroll amounts are stored in minor currency units.

### Library (`/api/libraries`, `/api/v1/libraries`)

Authenticated platform and school administrators provide `x-school-id`. The API creates a school
library, manages catalog titles and physical copies, lists circulation records, and performs atomic
borrow/return operations. Tenant and school ownership are always derived from authentication.

### Assets and inventory (`/api/assets-inventory`, `/api/v1/assets-inventory`)

Authenticated platform and school administrators provide `x-school-id`. Serialized assets have an
independent lifecycle, while inventory quantities change only through atomic receipt and issue
movements. Issues that would produce negative stock are rejected. Ownership is server-derived.

### Transport (`/api/transport`, `/api/v1/transport`)

Authenticated platform and school administrators provide `x-school-id`. The API manages vehicles,
drivers, routes and ordered stops, trips, vehicle lifecycle status, and safety inspections. All
ownership is derived from the authenticated school context.

### Boarding (`/api/boarding`, `/api/v1/boarding`)

Authenticated platform and school administrators provide `x-school-id`. The API provisions
dormitories, rooms and beds; manages applications and decisions; and performs atomic bed allocation
and checkout. Occupancy and ownership are enforced server-side.

### Digital classrooms (`/api/lms/classrooms`, `/api/v1/lms/classrooms`)

Authenticated users provide `x-school-id`. Administrators can see the school's active learning
spaces; teachers and other users see only classrooms they own or actively belong to. Administrators
and teachers can create a digital classroom, optionally linked to an academic `Class`. Classroom
owners and administrators manage tenant-owned user memberships and archive learning spaces.

- `GET /` — list accessible digital classrooms with active membership counts.
- `POST /` — create a classroom and its owner membership.
- `GET /:classroomId` — inspect an accessible classroom and its memberships.
- `POST /:classroomId/members` — add or reactivate a tenant user membership.
- `DELETE /:classroomId/members/:userId` — remove an active membership.
- `PATCH /:classroomId/archive` — archive a classroom without deleting history.

### Classroom stream (`/api/lms/classroom-stream`, `/api/v1/lms/classroom-stream`)

All operations require authentication, an active school context, and access to the referenced
digital classroom. Administrators and classroom owners bypass membership lookup. Active teacher
members may publish announcements; all active members may read the stream, create posts, and add
comments. Inputs are bounded and validated before persistence.

- `GET /:classroomId` — list published announcements and posts with bounded comments.
- `POST /:classroomId/announcements` — publish or save a teacher announcement.
- `POST /:classroomId/posts` — add a classroom-member stream post.
- `POST /posts/:postId/comments` — comment after resolving and authorizing the post's classroom.

### Classwork and assignments (`/api/lms/assignments`, `/api/v1/lms/assignments`)

Active classroom members may list classwork. Classroom owners, administrators, and active teacher
members may create and manage it. Optional subjects are validated against the authenticated school.
The server enforces `DRAFT → PUBLISHED → CLOSED → ARCHIVED` transitions, while allowing a draft or
published assignment to be archived. Due dates must follow availability dates.

- `GET /?classroomId=<uuid>&status=<status>` — list bounded, accessible classroom assignments.
- `POST /` — create a validated assignment draft.
- `PATCH /:id/status` — publish, close, or archive according to the lifecycle.

### Digital materials (`/api/lms/materials`, `/api/v1/lms/materials`)

All operations require authentication, a validated `x-school-id`, and active access to the selected
digital classroom. Classroom owners, administrators, and active teacher members may upload or
archive materials. Other active members may list and download them. Files are limited to 25 MB,
stored as private Vercel blobs, and delivered only after a fresh authorization check.

- `GET /?classroomId=<uuid>` — list active materials in an accessible classroom.
- `POST /` — upload a multipart `file` with `classroomId`, optional `title`, and `description`.
- `GET /:id/download` — stream an authorized private material.
- `PATCH /:id/archive` — hide a material without deleting its audit history or blob reference.

### Student submissions (`/api/lms/submissions`, `/api/v1/lms/submissions`)

Submission identity is always the authenticated user and requires an active `STUDENT` membership in
the assignment's classroom. Only published assignments accept work. Every draft save and submission
creates an immutable version in a serializable transaction; submitted work must be explicitly
retracted before another version can be created. Attachments may reference only active digital
materials from the same classroom. Classroom teachers and administrators may list an assignment's
submissions, while students can read only their own work.

- `GET /?assignmentId=<uuid>` — list authorized submissions with bounded version history.
- `POST /` — create a new draft or submitted version for the authenticated student.
- `PATCH /:id/status` — retract the student's own submitted work back to draft while open.
