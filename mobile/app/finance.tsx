import { useEffect, useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import { Screen } from '../components/ui/Screen'
import { FinanceDashboard } from '../components/finance/FinanceDashboard'
import type { FinanceSummary, Invoice } from '../services/finance/contracts'
import { createVerifiedPayment, fetchFinanceSummary, fetchInvoices } from '../services/finance/service'

export default function FinanceRoute() {
  const [data, setData] = useState<{ summary: FinanceSummary; invoices: Invoice[] } | null>(null)
  const [message, setMessage] = useState('')
  useEffect(() => { Promise.all([fetchFinanceSummary(), fetchInvoices()]).then(([summary, invoices]) => setData({ summary, invoices })).catch((cause) => setMessage(cause instanceof Error ? cause.message : 'Unable to load finance data.')) }, [])
  if (message) return <Screen title="Finance"><Text>{message}</Text></Screen>
  if (!data) return <Screen title="Finance"><View><ActivityIndicator /><Text>Loading finance data…</Text></View></Screen>
  return <Screen title="Finance"><FinanceDashboard summary={data.summary} invoices={data.invoices} onPay={async (invoice) => { try { await createVerifiedPayment({ invoiceId: invoice.id, amount: invoice.amount, idempotencyKey: `mobile-${invoice.id}-${Date.now()}` }); setMessage(`Payment submitted for ${invoice.invoiceNumber}.`) } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Payment could not be submitted.') } }} />{message ? <Text accessible accessibilityLiveRegion="polite">{message}</Text> : null}</Screen>
}
