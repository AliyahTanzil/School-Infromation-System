import { Router } from 'express';
import financeCoreService from '../../../application/services/financeCoreService.js';

const router = Router();

router.get('/summary', async (req, res, next) => {
  try {
    res.json({ data: await financeCoreService.financialSummary(req.query) });
  } catch (error) {
    next(error);
  }
});

router.get('/transactions', async (req, res, next) => {
  try {
    res.json({ data: await financeCoreService.listFinancialTransactions(req.query) });
  } catch (error) {
    next(error);
  }
});

router.post('/payments/events', async (req, res, next) => {
  try {
    res.status(201).json({ data: await financeCoreService.recordPaymentEvent(req.body) });
  } catch (error) {
    next(error);
  }
});

export default router;
