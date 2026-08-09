import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import * as service from '../../../application/services/resultService.js';

const router = Router();
router.use(authenticate);
const scope = (req) => ({
  tenantId: req.user.tenantId || req.user.scopeKey?.split(':')[0],
  schoolId: req.user.schoolId || req.user.scopeKey?.split(':')[1],
});
router.get('/', async (req, res) =>
  res.json({
    data: await service.listResults({ ...scope(req), examinationId: req.query.examinationId }),
  })
);
router.get('/statistics', async (req, res) =>
  res.json({
    data: await service.getStatistics({ ...scope(req), examinationId: req.query.examinationId }),
  })
);
router.post('/process', async (req, res) =>
  res.status(201).json({
    data: await service.processResults({ ...scope(req), ...req.body, actorId: req.user.id }),
  })
);
router.patch('/:id/status', async (req, res) =>
  res.json({
    data: await service.changeStatus({
      ...scope(req),
      id: req.params.id,
      status: req.body.status,
      actorId: req.user.id,
    }),
  })
);
export default router;
