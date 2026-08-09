import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import * as service from '../../../application/services/examinationService.js';

const router = Router();
router.use(authenticate);
const scope = (req) => ({
  tenantId: req.user.tenantId || req.user.scopeKey?.split(':')[0],
  schoolId: req.user.schoolId || req.user.scopeKey?.split(':')[1],
});
router.get('/', async (req, res) =>
  res.json({ data: await service.listExaminations({ ...scope(req), status: req.query.status }) })
);
router.post('/', async (req, res) =>
  res.status(201).json({
    data: await service.createExamination({
      ...scope(req),
      ...req.body,
      createdById: req.user.id,
    }),
  })
);
router.get('/:id', async (req, res) =>
  res.json({ data: await service.getExamination({ ...scope(req), id: req.params.id }) })
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
router.put('/:id/marks', async (req, res) =>
  res.json({
    data: await service.upsertMark({
      ...scope(req),
      id: req.params.id,
      actorId: req.user.id,
      ...req.body,
    }),
  })
);
export default router;
