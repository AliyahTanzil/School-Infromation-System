import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import controller from '../controllers/activationController.js';

const router = Router();
router.use(authenticate);
router.get('/', controller.listPending);
router.get('/outbox', controller.outbox);
router.post('/:id/decision', controller.decide);

export default router;
