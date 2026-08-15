import type { FinanceSummary, Invoice, Payment } from './contracts'

export type FinanceApi = {
  listInvoices?: (params: { tenantId: string; status?: string; page?: number }) => Promise<Invoice[]>
  getSummary?: (tenantId: string) => Promise<FinanceSummary>
  createPayment?: (input: { invoiceId: string; amount: number; idempotencyKey: string }) => Promise<Payment>
}

export function createFinanceService(api: FinanceApi) {
  return {
    async listInvoices(tenantId: string, status?: string) {
      return api.listInvoices ? api.listInvoices({ tenantId, status, page: 1 }) : []
    },
    async getSummary(tenantId: string) {
      return api.getSummary ? api.getSummary(tenantId) : { outstanding: 0, paidThisPeriod: 0, overdue: 0, currency: 'USD' }
    },
    async payInvoice(input: { invoiceId: string; amount: number; idempotencyKey: string }) {
      if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error('Payment amount must be positive')
      if (!input.idempotencyKey.trim()) throw new Error('Payment idempotency key is required')
      if (!api.createPayment) throw new Error('Payment API is not available')
      return api.createPayment(input)
    },
  }
}
