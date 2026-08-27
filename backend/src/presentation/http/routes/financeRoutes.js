import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import authorize from '../../../middleware/auth/authorize.js';
import teacherContext from '../../../middleware/auth/teacherContext.js';
import validate from '../../../middleware/validation/validate.js';
import controller from '../controllers/financeController.js';
import financeService from '../../../application/services/financeService.js';
import {
  createInvoiceSchema,
  invoiceQuerySchema,
  paymentParamsSchema,
  paymentSchema,
} from '../../../application/validators/financeValidators.js';
const router = Router();
router.use(authenticate, teacherContext, authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN'));
router.get('/summary', async (req, res) =>
  res.json({ data: await financeService.summary(req.schoolContext) })
);
router.get('/transactions', async (req, res) =>
  res.json({ data: await financeService.listTransactions(req.schoolContext, req.query.limit) })
);
router.get('/invoices', validate(invoiceQuerySchema), controller.list);
router.get('/payments/:paymentId', validate(paymentParamsSchema), controller.status);
router.post('/invoices', validate(createInvoiceSchema), controller.create);
router.post('/payments', validate(paymentSchema), controller.pay);
export default router;
