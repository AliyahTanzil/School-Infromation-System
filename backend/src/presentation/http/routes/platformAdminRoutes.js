import { Router } from 'express';
import { overview, action } from '../controllers/platformAdminController.js';

const router = Router();
router.get('/overview', overview);
router.post('/actions', action);
export default router;
