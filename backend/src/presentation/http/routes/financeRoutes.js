import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import authorize from '../../../middleware/auth/authorize.js';
import validate from '../../../middleware/validation/validate.js';
import controller from '../controllers/financeController.js';
import {
  createInvoiceSchema,
  invoiceQuerySchema,
  paymentSchema,
} from '../../../application/validators/financeValidators.js';

const router = Router();
const admin = authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN');
router.use(authenticate, admin);
router.get('/invoices', validate(invoiceQuerySchema), controller.list);
router.post('/invoices', validate(createInvoiceSchema), controller.create);
router.post('/payments', validate(paymentSchema), controller.pay);
export default router;
