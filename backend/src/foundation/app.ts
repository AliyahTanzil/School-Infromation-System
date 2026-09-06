import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { config } from './config.js';
import { errorHandler, notFound, requestId, requestLogger } from './middleware.js';
import { healthRouter } from './health.js';
// @ts-expect-error Legacy JavaScript router is mounted during the TypeScript migration.
import authRouter from '../presentation/http/routes/authRoutes.js';
// @ts-expect-error Legacy JavaScript router remains the source of truth during migration.
import userRouter from '../presentation/http/routes/userRoutes.js';
// @ts-expect-error Legacy JavaScript router remains the source of truth during migration.
import schoolRouter from '../presentation/http/routes/schoolRoutes.js';
// @ts-expect-error Legacy JavaScript router remains the source of truth during migration.
import studentRouter from '../presentation/http/routes/studentDomainRoutes.js';
// @ts-expect-error Legacy JavaScript router remains the source of truth during migration.
import parentRouter from '../presentation/http/routes/parentRoutes.js';
// @ts-expect-error Legacy JavaScript router remains the source of truth during migration.
import teacherRouter from '../presentation/http/routes/teacherRoutes.js';
// @ts-expect-error Legacy JavaScript router remains the source of truth during migration.
import subjectRouter from '../presentation/http/routes/subjectRoutes.js';
// @ts-expect-error Legacy JavaScript router remains the source of truth during migration.
import classRouter from '../presentation/http/routes/classRoutes.js';
// @ts-expect-error Legacy JavaScript router remains the source of truth during migration.
import attendanceRouter from '../presentation/http/routes/attendanceRoutes.js';
// @ts-expect-error Legacy JavaScript router remains the source of truth during migration.
import academicPolicyRouter from '../presentation/http/routes/academicPolicyRoutes.js';
// @ts-expect-error Legacy JavaScript router remains the source of truth during migration.
import examinationRouter from '../presentation/http/routes/examinationRoutes.js';
// @ts-expect-error Legacy JavaScript router remains the source of truth during migration.
import resultRouter from '../presentation/http/routes/resultRoutes.js';
// @ts-expect-error Legacy JavaScript router remains the source of truth during migration.
import timetableRouter from '../presentation/http/routes/timetableRoutes.js';
// @ts-expect-error Legacy JavaScript router remains the source of truth during migration.
import financeRouter from '../presentation/http/routes/financeRoutes.js';
// @ts-expect-error Legacy JavaScript router remains the source of truth during migration.
import paymentGatewayRouter from '../presentation/http/routes/paymentGatewayRoutes.js';
// @ts-expect-error Legacy JavaScript router remains the source of truth during migration.
import communicationRouter from '../presentation/http/routes/communicationRoutes.js';
// @ts-expect-error Legacy JavaScript router remains the source of truth during migration.
import hrRouter from '../presentation/http/routes/hrRoutes.js';
// @ts-expect-error Legacy JavaScript router remains the source of truth during migration.
import libraryRouter from '../presentation/http/routes/libraryRoutes.js';
// @ts-expect-error Legacy JavaScript router remains the source of truth during migration.
import assetInventoryRouter from '../presentation/http/routes/assetInventoryRoutes.js';
// @ts-expect-error Legacy JavaScript router remains the source of truth during migration.
import transportRouter from '../presentation/http/routes/transportRoutes.js';
// @ts-expect-error Legacy JavaScript router remains the source of truth during migration.
import boardingRouter from '../presentation/http/routes/boardingRoutes.js';
// @ts-expect-error Legacy JavaScript router remains the source of truth during migration.
import digitalClassroomRouter from '../presentation/http/routes/digitalClassroomRoutes.js';
// @ts-expect-error Legacy JavaScript router remains the source of truth during migration.
import classroomStreamRouter from '../presentation/http/routes/classroomStreamRoutes.js';
// @ts-expect-error Legacy JavaScript router remains the source of truth during migration.
import assignmentRouter from '../presentation/http/routes/assignmentRoutes.js';
// @ts-expect-error Legacy JavaScript router remains the source of truth during migration.
import classroomCalendarRouter from '../presentation/http/routes/classroomCalendarRoutes.js';
// @ts-expect-error Legacy JavaScript router remains the source of truth during migration.
import classroomLiveSessionRouter from '../presentation/http/routes/classroomLiveSessionRoutes.js';
// @ts-expect-error Legacy JavaScript router remains the source of truth during migration.
import materialRouter from '../presentation/http/routes/materialRoutes.js';
// @ts-expect-error Legacy JavaScript router remains the source of truth during migration.
import submissionRouter from '../presentation/http/routes/submissionRoutes.js';
// @ts-expect-error Legacy JavaScript router remains the source of truth during migration.
import quizRouter from '../presentation/http/routes/quizRoutes.js';
// @ts-expect-error Legacy JavaScript router remains the source of truth during migration.
import gradebookRouter from '../presentation/http/routes/gradebookRoutes.js';
// @ts-expect-error Legacy JavaScript router remains the source of truth during migration.
import billingRouter from '../presentation/http/routes/billingRoutes.js';
// @ts-expect-error Legacy JavaScript router remains the source of truth during migration.
import analyticsRouter from '../presentation/http/routes/analyticsRoutes.js';
// @ts-expect-error Legacy JavaScript router remains the source of truth during migration.
import searchRouter from '../presentation/http/routes/searchRoutes.js';
// @ts-expect-error Single-school route is implemented in the active JavaScript module layer.
import singleSchoolRouter from '../presentation/http/routes/singleSchoolRoutes.js';

export function isCorsOriginAllowed(origin?: string): boolean {
  if (!origin) return true;
  const normalizedOrigin = String(origin).replace(/\/$/, '');
  if ((config.corsOrigins as string[]).includes(normalizedOrigin)) return true;

  try {
    const url = new URL(normalizedOrigin);
    const hostname = url.hostname.toLowerCase();
    const projects = new Set([
      'school-administration-information-system-frontend',
      ...String(process.env.VERCEL_PREVIEW_PROJECT ?? '').split(','),
    ]);
    const belongsToFrontendProject = [...projects]
      .map((project) => project.trim().toLowerCase())
      .filter(Boolean)
      .some(
        (project) =>
          hostname === `${project}.vercel.app` ||
          (hostname.startsWith(`${project}-`) && hostname.endsWith('.vercel.app')) ||
          (hostname.startsWith(`${project}--`) && hostname.endsWith('.vercel.app'))
      );

    return url.protocol === 'https:' && !url.port && belongsToFrontendProject;
  } catch {
    return false;
  }
}

export const createApp = () => {
  const app = express();
  app.disable('x-powered-by');
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          objectSrc: ["'none'"],
          imgSrc: ["'self'", 'data:'],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          connectSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'same-origin' },
    })
  );
  app.use(cors({ origin: config.corsOrigins, credentials: true }));
  app.use(
    express.json({
      limit: config.jsonBodyLimit,
      verify: (req, _res, buffer) => {
        (req as express.Request & { rawBody?: string }).rawBody = buffer.toString('utf8');
      },
    })
  );
  app.use(express.urlencoded({ extended: false, limit: config.urlencodedBodyLimit }));
  app.use(cookieParser());
  app.use(requestId);
  app.use(requestLogger);
  app.use('/api/v1', healthRouter);
  // Keep the legacy auth implementation on the active TypeScript server until
  // the remaining domain routes are migrated to the foundation app.
  app.use('/api/auth', authRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/school', singleSchoolRouter);
  app.use('/api/v1/school', singleSchoolRouter);
  app.use('/api/users', userRouter);
  app.use('/api/v1/users', userRouter);
  app.use('/api/schools', schoolRouter);
  app.use('/api/v1/schools', schoolRouter);
  app.use('/api/students', studentRouter);
  app.use('/api/v1/students', studentRouter);
  app.use('/api/parents', parentRouter);
  app.use('/api/v1/parents', parentRouter);
  app.use('/api/teachers', teacherRouter);
  app.use('/api/v1/teachers', teacherRouter);
  app.use('/api/subjects', subjectRouter);
  app.use('/api/v1/subjects', subjectRouter);
  app.use('/api/classes', classRouter);
  app.use('/api/v1/classes', classRouter);
  app.use('/api/attendance', attendanceRouter);
  app.use('/api/v1/attendance', attendanceRouter);
  app.use('/api/academic-policies', academicPolicyRouter);
  app.use('/api/v1/academic-policies', academicPolicyRouter);
  app.use('/api/examinations', examinationRouter);
  app.use('/api/v1/examinations', examinationRouter);
  app.use('/api/results', resultRouter);
  app.use('/api/v1/results', resultRouter);
  app.use('/api/timetables', timetableRouter);
  app.use('/api/v1/timetables', timetableRouter);
  app.use('/api/lms/calendar', classroomCalendarRouter);
  app.use('/api/v1/lms/calendar', classroomCalendarRouter);
  app.use('/api/finance', financeRouter);
  app.use('/api/v1/finance', financeRouter);
  app.use('/api/billing', billingRouter);
  app.use('/api/v1/billing', billingRouter);
  app.use('/api/payment/monime', paymentGatewayRouter);
  app.use('/api/v1/payment/monime', paymentGatewayRouter);
  app.use('/api/payment-gateway', paymentGatewayRouter);
  app.use('/api/v1/payment-gateway', paymentGatewayRouter);
  app.use('/api/communication', communicationRouter);
  app.use('/api/v1/communication', communicationRouter);
  app.use('/api/hr', hrRouter);
  app.use('/api/v1/hr', hrRouter);
  app.use('/api/libraries', libraryRouter);
  app.use('/api/v1/libraries', libraryRouter);
  app.use('/api/assets-inventory', assetInventoryRouter);
  app.use('/api/v1/assets-inventory', assetInventoryRouter);
  app.use('/api/transport', transportRouter);
  app.use('/api/v1/transport', transportRouter);
  app.use('/api/boarding', boardingRouter);
  app.use('/api/v1/boarding', boardingRouter);
  app.use('/api/lms/classrooms', digitalClassroomRouter);
  app.use('/api/v1/lms/classrooms', digitalClassroomRouter);
  app.use('/api/lms/classroom-stream', classroomStreamRouter);
  app.use('/api/v1/lms/classroom-stream', classroomStreamRouter);
  app.use('/api/lms/assignments', assignmentRouter);
  app.use('/api/v1/lms/assignments', assignmentRouter);
  app.use('/api/lms/materials', materialRouter);
  app.use('/api/v1/lms/materials', materialRouter);
  app.use('/api/lms/submissions', submissionRouter);
  app.use('/api/v1/lms/submissions', submissionRouter);
  app.use('/api/lms/quizzes', quizRouter);
  app.use('/api/v1/lms/quizzes', quizRouter);
  app.use('/api/lms/live-sessions', classroomLiveSessionRouter);
  app.use('/api/v1/lms/live-sessions', classroomLiveSessionRouter);
  app.use('/api/lms/gradebook', gradebookRouter);
  app.use('/api/v1/lms/gradebook', gradebookRouter);
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/v1/analytics', analyticsRouter);
  app.use('/api/lms/search', searchRouter);
  app.use('/api/v1/lms/search', searchRouter);
  app.use('/api/search', searchRouter);
  app.use('/api/v1/search', searchRouter);
  app.get('/', (_request, response) => {
    response.status(200).json({
      success: true,
      service: 'sais-backend',
      message: 'SAIS API is running',
      health: '/api/v1/health',
    });
  });
  app.use(notFound);
  app.use(errorHandler);
  return app;
};
