import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import * as controller from '../controllers/transportController.js';

const router = Router();
router.use(authenticate);
router.get('/overview', controller.overview);
router.get('/vehicles', controller.vehicles);
router.get('/routes', controller.routes);
export default router;
