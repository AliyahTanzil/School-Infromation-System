import { Router } from 'express';
import { overview, verifications, verify } from '../controllers/smartIdentityController.js';

const router = Router();
router.get('/overview', overview);
router.get('/verifications', verifications);
router.post('/verify', verify);
export default router;
