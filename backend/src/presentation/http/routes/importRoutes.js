import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import singleSchoolContext from '../../../middleware/auth/singleSchoolContext.js';
import authorizeSchoolAdmin from '../../../middleware/auth/authorizeSchoolAdmin.js';
import validate from '../../../middleware/validation/validate.js';
import dataImportUpload from '../../../middleware/uploads/dataImportUpload.js';
import * as controller from '../controllers/importController.js';
import { importRequestSchema } from '../../../application/validators/importValidators.js';

const router = Router();

// Import performs bulk writes, so it is restricted to the application owner, platform
// administrators, and school administrators, always within the authenticated school.
router.use(authenticate, singleSchoolContext, authorizeSchoolAdmin);

router.get('/entities', controller.listEntities);
router.post('/', dataImportUpload, validate(importRequestSchema), controller.run);

export default router;
