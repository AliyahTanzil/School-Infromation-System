import financeService from '../../../application/services/financeService.js';

export default {
  list: async (req, res) => res.json({ data: await financeService.listInvoices(req.query) }),
  create: async (req, res) =>
    res.status(201).json({ data: await financeService.createInvoice(req.body) }),
  pay: async (req, res) =>
    res.status(201).json({ data: await financeService.recordPayment(req.body) }),
};
