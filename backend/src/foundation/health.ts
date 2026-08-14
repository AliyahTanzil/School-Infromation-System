import { Router } from 'express';
import { config } from './config.js';

export const healthRouter = Router();

healthRouter.get('/health', (_request, response) => {
  response.json({ success: true, data: { status: 'ok', service: 'sais-backend', environment: config.env, timestamp: new Date().toISOString() } });
});

healthRouter.get('/health/live', (_request, response) => response.json({ success: true, data: { status: 'live' } }));
