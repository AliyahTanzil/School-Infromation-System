import { Router } from 'express';
import { overview, command } from '../controllers/iotController.js';

const router = Router();
router.get('/overview', overview);
router.post('/commands', command);
export default router;
