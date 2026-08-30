import { apiRequest } from '../api/client'
import { secureAuthStorage } from '../auth/secureStorage'
import type { FinanceSummary, Invoice, Payment } from './contracts'

const endpoint = '/api/v1/finance'

async function authOptions() {
  return { accessToken: (await secureAuthStorage.getAccessToken()) ?? undefined }
}

export async function fetchFinanceSummary() {
  return apiRequest<FinanceSummary>('/api/v1/finance/core/summary', await authOptions())
}

export async function fetchInvoices(status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : ''
  return apiRequest<Invoice[]>(`${endpoint}/invoices${query}`, await authOptions())
}

export async function createVerifiedPayment(input: { invoiceId: string; amount: number; idempotencyKey: string }) {
  if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error('Payment amount must be positive')
  if (!input.invoiceId.trim()) throw new Error('Payment context is incomplete')
  return apiRequest<Payment>(`${endpoint}/payments`, { ...await authOptions(), method: 'POST', headers: { 'Idempotency-Key': input.idempotencyKey }, body: JSON.stringify(input) })
}

export async function getPaymentStatus(paymentId: string) {
  if (!paymentId.trim()) throw new Error('Payment id is required')
  return apiRequest<Payment>(`${endpoint}/payments/${encodeURIComponent(paymentId)}`, await authOptions())
}

export type FinanceApi = {
  listInvoices?: (params: { status?: string; page?: number }) => Promise<Invoice[]>
  getSummary?: () => Promise<FinanceSummary>
  createPayment?: (input: { invoiceId: string; amount: number; idempotencyKey: string }) => Promise<Payment>
}

export function createFinanceService(api: FinanceApi) {
  return {
    async listInvoices(status?: string) {
      return api.listInvoices ? api.listInvoices({ status, page: 1 }) : []
    },
    async getSummary() {
      return api.getSummary ? api.getSummary() : { outstanding: 0, paidThisPeriod: 0, overdue: 0, currency: 'USD' }
    },
    async payInvoice(input: { invoiceId: string; amount: number; idempotencyKey: string }) {
      if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error('Payment amount must be positive')
      if (!input.idempotencyKey.trim()) throw new Error('Payment idempotency key is required')
      if (!input.invoiceId.trim()) throw new Error('Invoice id is required')
      if (!api.createPayment) throw new Error('Payment API is not available')
      return api.createPayment(input)
    },
  }
}
