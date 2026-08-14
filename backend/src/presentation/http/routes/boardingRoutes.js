import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import { overview, dormitories } from '../controllers/boardingController.js';

const router = Router();
router.use(authenticate);
router.get('/overview', overview);
router.get('/dormitories', dormitories);
export default router;
