export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED'

export type Invoice = {
  id: string
  invoiceNumber: string
  schoolId: string
  studentName?: string
  description: string
  amount: number
  currency: string
  dueDate?: string
  status: InvoiceStatus
}

export type Payment = {
  id: string
  invoiceId: string
  amount: number
  currency: string
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED'
  idempotencyKey: string
  createdAt: string
}

export type FinanceSummary = {
  outstanding: number
  paidThisPeriod: number
  overdue: number
  currency: string
}
