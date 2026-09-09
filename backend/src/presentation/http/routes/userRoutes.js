import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import requirePermission from '../../../middleware/auth/permissionMiddleware.js';
import validate from '../../../middleware/validation/validate.js';
import controller from '../controllers/userController.js';
import {
  listUsersSchema,
  createUserSchema,
  updateUserSchema,
  statusSchema,
  profileSchema,
  pushTokenSchema,
  reasonSchema,
  getUserSchema,
  userIdSchema,
} from '../../../application/validators/userValidators.js';
import profileImageUpload from '../../../middleware/uploads/profileImageUpload.js';
import singleSchoolContext from '../../../middleware/auth/singleSchoolContext.js';

const router = Router();
router.use(authenticate, singleSchoolContext);
router.get('/', requirePermission('users.read'), validate(listUsersSchema), controller.list);
router.post('/', requirePermission('users.create'), validate(createUserSchema), controller.create);
router.post('/me/push-token', validate(pushTokenSchema), controller.registerPushToken);
router.get('/:id', requirePermission('users.read'), validate(getUserSchema), controller.get);
router.put(
  '/:id',
  requirePermission('users.update'),
  validate(updateUserSchema),
  controller.update
);
router.patch(
  '/:id/status',
  requirePermission('users.update'),
  validate(statusSchema),
  controller.status
);
router.delete('/:id', requirePermission('users.delete'), validate(reasonSchema), controller.remove);
router.post(
  '/:id/restore',
  requirePermission('users.restore'),
  validate(userIdSchema),
  controller.restore
);
router.get(
  '/:id/profile',
  requirePermission('users.read'),
  validate(userIdSchema),
  controller.profile
);
router.put(
  '/:id/profile',
  requirePermission('users.update'),
  validate(profileSchema),
  controller.updateProfile
);
router.post(
  '/:id/profile-image',
  requirePermission('users.update'),
  validate(userIdSchema),
  profileImageUpload,
  controller.uploadImage
);
router.delete(
  '/:id/profile-image',
  requirePermission('users.update'),
  validate(userIdSchema),
  controller.deleteImage
);
export default router;
