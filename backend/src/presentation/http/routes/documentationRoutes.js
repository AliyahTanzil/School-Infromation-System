import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';

const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'SAIS API',
    version: '1.0.0',
    description: 'School Administration Information System API documentation.',
  },
  servers: [{ url: '/api', description: 'Current server' }],
  paths: {
    '/health': {
      get: {
        summary: 'Get full system health',
        responses: {
          200: { description: 'Healthy' },
          503: { description: 'A dependency is unavailable' },
        },
      },
    },
    '/ready': {
      get: {
        summary: 'Check whether the service is ready for traffic',
        responses: { 200: { description: 'Ready' }, 503: { description: 'Not ready' } },
      },
    },
    '/live': {
      get: {
        summary: 'Check whether the process is alive',
        responses: { 200: { description: 'Alive' } },
      },
    },
  },
};

const router = Router();

router.get('/openapi.json', (_req, res) => res.json(openApiDocument));
router.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

export default router;
