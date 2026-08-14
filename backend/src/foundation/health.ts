import { Router } from 'express';
import { config } from './config.js';
import { prisma } from './prisma.js';

export const healthRouter = Router();

healthRouter.get('/health', (_request, response) => {
  response.json({
    success: true,
    data: {
      status: 'ok',
      service: 'sais-backend',
      environment: config.env,
      timestamp: new Date().toISOString(),
    },
  });
});

healthRouter.get('/health/live', (_request, response) =>
  response.json({ success: true, data: { status: 'live' } })
);
healthRouter.get('/health/ready', (_request, response) =>
  response.json({ success: true, data: { status: 'ready' } })
);

healthRouter.get('/health/database', async (_request, response) => {
  if (!config.databaseUrl) {
    response.status(503).json({
      success: false,
      data: { status: 'unavailable', reason: 'DATABASE_URL is not configured' },
    });
    return;
  }
  try {
    await prisma.$queryRaw`SELECT 1`;
    response.json({ success: true, data: { status: 'connected', database: 'postgresql' } });
  } catch {
    response
      .status(503)
      .json({ success: false, data: { status: 'unavailable', database: 'postgresql' } });
  }
});

healthRouter.get('/health/full', async (_request, response) => {
  let database = 'unavailable';
  if (config.databaseUrl) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      database = 'connected';
    } catch {
      database = 'unavailable';
    }
  }
  const status = database === 'connected' ? 'ok' : 'degraded';
  response.status(status === 'ok' ? 200 : 503).json({
    success: status === 'ok',
    data: { status, backend: 'ok', database, environment: config.env },
  });
});
