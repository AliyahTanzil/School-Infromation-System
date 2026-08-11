import { Router } from 'express';
import controller from '../controllers/parentController.js';
import authenticate from '../../../middleware/auth/authenticate.js';
import requireParentContext from '../../../middleware/auth/parentContext.js';
import validate from '../../../middleware/validation/validate.js';
import { linkSchema, profileSchema } from '../../../application/validators/parentValidators.js';

const router = Router();
router.use(authenticate);
router.use(requireParentContext);
router.get('/me', controller.portal);
router.patch('/me/profile', validate(profileSchema), controller.updateProfile);
router.post('/me/students', validate(linkSchema), controller.link);
router.delete('/me/students/:studentId', controller.unlink);
export default router;
