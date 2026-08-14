import { Router } from 'express';
import {
  approve,
  exportReport,
  generate,
  overview,
  validate,
} from '../controllers/aiReportController.js';

const router = Router();
router.get('/overview', overview);
router.post('/generate', generate);
router.post('/validate', validate);
router.post('/:reportId/approve', approve);
router.post('/:reportId/exports', exportReport);
export default router;
