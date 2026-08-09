import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import authorize from '../../../middleware/auth/authorize.js';
import validate from '../../../middleware/validation/validate.js';
import * as service from '../../../application/services/timetableService.js';
import {
  createTimetableSchema,
  entrySchema,
  statusSchema,
  substitutionSchema,
} from '../../../application/validators/timetableValidators.js';

const router = Router();
router.use(authenticate, authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN'));
const scope = (req) => ({
  tenantId: req.user.tenantId || req.user.scopeKey?.split(':')[0],
  schoolId: req.user.schoolId || req.user.scopeKey?.split(':')[1],
});
router.get('/', async (req, res) => res.json({ data: await service.listTimetables(scope(req)) }));
router.post('/', validate(createTimetableSchema), async (req, res) =>
  res.status(201).json({
    data: await service.createTimetable({ ...scope(req), actorId: req.user.id, ...req.body }),
  })
);
router.post('/:id/entries', validate(entrySchema), async (req, res) =>
  res.status(201).json({
    data: await service.addEntry({
      ...scope(req),
      timetableId: req.params.id,
      actorId: req.user.id,
      data: req.body,
    }),
  })
);
router.patch('/:id/status', validate(statusSchema), async (req, res) =>
  res.json({
    data: await service.changeStatus({
      ...scope(req),
      timetableId: req.params.id,
      actorId: req.user.id,
      status: req.body.status,
    }),
  })
);
router.post('/:id/substitutions', validate(substitutionSchema), async (req, res) =>
  res.status(201).json({
    data: await service.createSubstitution({
      ...scope(req),
      timetableId: req.params.id,
      createdBy: req.user.id,
      ...req.body,
    }),
  })
);
export default router;
