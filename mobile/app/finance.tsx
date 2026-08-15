import { useMemo } from 'react'
import { Screen } from '../components/ui/Screen'
import { FinanceDashboard } from '../components/finance/FinanceDashboard'
import type { FinanceSummary, Invoice } from '../services/finance/contracts'

const summary: FinanceSummary = { outstanding: 1250, paidThisPeriod: 4600, overdue: 250, currency: 'USD' }
const invoices: Invoice[] = [{ id: 'demo-1', invoiceNumber: 'INV-2026-001', tenantId: 'current', description: 'Term tuition', amount: 1250, currency: 'USD', dueDate: '2026-09-01', status: 'ISSUED' }]

export default function FinanceRoute() {
  const data = useMemo(() => ({ summary, invoices }), [])
  return <Screen title="Finance"><FinanceDashboard summary={data.summary} invoices={data.invoices} /></Screen>
}
