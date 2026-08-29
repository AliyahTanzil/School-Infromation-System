import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import authorize from '../../../middleware/auth/authorize.js';
import teacherContext from '../../../middleware/auth/teacherContext.js';
import validate from '../../../middleware/validation/validate.js';
import * as c from '../controllers/boardingController.js';
import {
  dormitorySchema,
  roomSchema,
  applicationSchema,
  decisionSchema,
  allocationSchema,
  allocationParamsSchema,
} from '../../../application/validators/boardingValidators.js';
const router = Router();
router.use(authenticate, teacherContext, authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN'));
router.get('/overview', c.overview);
router.get('/dormitories', c.dormitories);
router.post('/dormitories', validate(dormitorySchema), c.createDormitory);
router.post('/dormitories/:dormitoryId/rooms', validate(roomSchema), c.addRoom);
router.get('/applications', c.applications);
router.post('/applications', validate(applicationSchema), c.createApplication);
router.patch('/applications/:id', validate(decisionSchema), c.decide);
router.get('/allocations', c.allocations);
router.post('/allocations', validate(allocationSchema), c.allocate);
router.post('/allocations/:id/checkout', validate(allocationParamsSchema), c.checkout);
export default router;
