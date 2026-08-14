import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import { assets, inventory, overview } from '../controllers/assetInventoryController.js';

const router = Router();
router.use(authenticate);
router.get('/overview', overview);
router.get('/assets', assets);
router.get('/inventory', inventory);
export default router;
