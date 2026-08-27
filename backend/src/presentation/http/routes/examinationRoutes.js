import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import * as service from '../../../application/services/examinationService.js';

const router = Router();
router.use(authenticate);
const scope = (req) => ({
  tenantId: req.user.tenantId,
  schoolId: req.user.schoolId,
});
const actor = (req) => req.user.id;

router.get('/', async (req, res) =>
  res.json({ data: await service.listExaminations({ ...scope(req), status: req.query.status }) })
);
router.post('/', async (req, res) =>
  res
    .status(201)
    .json({
      data: await service.createExamination({
        ...scope(req),
        ...req.body,
        createdById: actor(req),
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
      actorId: actor(req),
    }),
  })
);
router.put('/:id/marks', async (req, res) =>
  res.json({
    data: await service.upsertMark({
      ...scope(req),
      id: req.params.id,
      actorId: actor(req),
      ...req.body,
    }),
  })
);

export default router;
