import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import authorize from '../../../middleware/auth/authorize.js';
import singleSchoolContext from '../../../middleware/auth/singleSchoolContext.js';
import {
  exportReport,
  kpi,
  kpis,
  learningAnalytics,
  overview,
} from '../controllers/analyticsController.js';

const router = Router();

router.use(authenticate);
router.use(singleSchoolContext);

router.get('/overview', overview);
router.get('/kpis', kpis);
router.get('/kpis/:metricKey', kpi);
router.get('/learning', learningAnalytics);
router.post('/exports', authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN'), exportReport);

export default router;
