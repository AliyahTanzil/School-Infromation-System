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
  reasonSchema,
} from '../../../application/validators/userValidators.js';
import profileImageUpload from '../../../middleware/uploads/profileImageUpload.js';

const router = Router();
router.use(authenticate);
router.get(
  '/',
  requirePermission('users.read'),
  validate(listUsersSchema, 'query'),
  controller.list
);
router.post('/', requirePermission('users.create'), validate(createUserSchema), controller.create);
router.get('/:id', requirePermission('users.read'), controller.get);
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
router.post('/:id/restore', requirePermission('users.restore'), controller.restore);
router.post('/me/push-token', controller.registerPushToken);
router.get('/:id/profile', requirePermission('users.read'), controller.profile);
router.put(
  '/:id/profile',
  requirePermission('users.update'),
  validate(profileSchema),
  controller.updateProfile
);
router.post(
  '/:id/profile-image',
  requirePermission('users.update'),
  profileImageUpload,
  controller.uploadImage
);
router.delete('/:id/profile-image', requirePermission('users.update'), controller.deleteImage);
export default router;
