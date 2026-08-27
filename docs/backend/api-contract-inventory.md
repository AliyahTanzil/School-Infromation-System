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

- `GET` '/', async (req, res) =>
- `POST` '/', async (req, res) =>
- `GET` '/:id', async (req, res) =>
- `PATCH` '/:id/status', async (req, res) =>
- `PUT` '/:id/marks', async (req, res) =>

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

- `GET` '/', async (req, res) =>
- `GET` '/statistics', async (req, res) =>
- `POST` '/process', async (req, res) =>
- `PATCH` '/:id/status', async (req, res) =>

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

- `GET` '/', async (req, res) => res.json({ data: await service.listTimetables(scope(req)) }));
- `POST` '/', validate(createTimetableSchema), async (req, res) =>
- `POST` '/:id/entries', validate(entrySchema), async (req, res) =>
- `PATCH` '/:id/status', validate(statusSchema), async (req, res) =>
- `POST` '/:id/substitutions', validate(substitutionSchema), async (req, res) =>

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
