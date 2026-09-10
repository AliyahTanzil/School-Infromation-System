import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import authorizeSchoolAdminOrTeacher from '../../../middleware/auth/authorizeSchoolAdminOrTeacher.js';
import teacherContext from '../../../middleware/auth/teacherContext.js';
import validate from '../../../middleware/validation/validate.js';
import * as controller from '../controllers/digitalClassroomController.js';
import {
  classroomCreateSchema,
  classroomParamsSchema,
  memberSchema,
  memberParamsSchema,
} from '../../../application/validators/digitalClassroomValidators.js';

const router = Router();
router.use(authenticate, teacherContext);
router.get('/', controller.list);
router.post('/', authorizeSchoolAdminOrTeacher, validate(classroomCreateSchema), controller.create);
router.get('/:classroomId', validate(classroomParamsSchema), controller.details);
router.post(
  '/:classroomId/members',
  authorizeSchoolAdminOrTeacher,
  validate(memberSchema),
  controller.addMember
);
router.delete(
  '/:classroomId/members/:userId',
  authorizeSchoolAdminOrTeacher,
  validate(memberParamsSchema),
  controller.removeMember
);
router.patch(
  '/:classroomId/archive',
  authorizeSchoolAdminOrTeacher,
  validate(classroomParamsSchema),
  controller.archive
);
export default router;
