import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import authorizeSchoolAdmin from '../../../middleware/auth/authorizeSchoolAdmin.js';
import teacherContext from '../../../middleware/auth/teacherContext.js';
import validate from '../../../middleware/validation/validate.js';
import * as c from '../controllers/assetInventoryController.js';
import {
  querySchema,
  assetSchema,
  assetStatusSchema,
  itemSchema,
  movementSchema,
} from '../../../application/validators/assetInventoryValidators.js';
const router = Router();
router.use(authenticate, teacherContext, authorizeSchoolAdmin);
router.get('/overview', c.overview);
router.get('/assets', validate(querySchema), c.assets);
router.post('/assets', validate(assetSchema), c.createAsset);
router.patch('/assets/:id/status', validate(assetStatusSchema), c.updateAsset);
router.get('/inventory', validate(querySchema), c.inventory);
router.post('/inventory', validate(itemSchema), c.createItem);
router.post('/inventory/:id/movements', validate(movementSchema), c.moveStock);
export default router;
