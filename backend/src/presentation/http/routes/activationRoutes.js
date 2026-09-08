import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import requireApplicationOwner from '../../../middleware/auth/requireApplicationOwner.js';
import validate from '../../../middleware/validation/validate.js';
import { activationDecisionSchema } from '../../../application/validators/activationValidators.js';
import controller from '../controllers/activationController.js';

const router = Router();
router.use(authenticate, requireApplicationOwner);
router.get('/', controller.listPending);
router.get('/outbox', controller.outbox);
router.post('/:id/decision', validate(activationDecisionSchema), controller.decide);

export default router;
