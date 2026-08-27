import financeService from '../../../application/services/financeService.js';

export default {
  status: async (req, res) =>
    res.json({
      data: await financeService.getPayment(req.params.paymentId, req.schoolContext),
    }),
  list: async (req, res) =>
    res.json({
      data: await financeService.listInvoices(req.schoolContext, req.validatedQuery ?? req.query),
    }),
  create: async (req, res) =>
    res.status(201).json({ data: await financeService.createInvoice(req.schoolContext, req.body) }),
  pay: async (req, res) =>
    res.status(201).json({ data: await financeService.recordPayment(req.schoolContext, req.body) }),
};
