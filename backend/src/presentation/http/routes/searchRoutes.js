import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import singleSchoolContext from '../../../middleware/auth/singleSchoolContext.js';
import { search } from '../controllers/searchController.js';
import validate from '../../../middleware/validation/validate.js';
import { searchQuerySchema } from '../../../application/validators/searchValidators.js';

const router = Router();

router.use(authenticate);
router.use(singleSchoolContext);

router.get('/', validate(searchQuerySchema), search);

export default router;
