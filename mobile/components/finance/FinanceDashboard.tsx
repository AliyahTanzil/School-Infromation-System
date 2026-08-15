import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, spacing } from '../../constants/theme'
import type { FinanceSummary, Invoice } from '../../services/finance/contracts'

export function FinanceDashboard({ summary, invoices, onPay }: { summary: FinanceSummary; invoices: Invoice[]; onPay?: (invoice: Invoice) => void }) {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>Finance</Text>
      <View style={styles.summary}>
        <Metric label="Outstanding" value={`${summary.currency} ${summary.outstanding.toFixed(2)}`} />
        <Metric label="Paid this period" value={`${summary.currency} ${summary.paidThisPeriod.toFixed(2)}`} />
        <Metric label="Overdue" value={`${summary.currency} ${summary.overdue.toFixed(2)}`} />
      </View>
      <Text style={styles.section}>Invoices</Text>
      {invoices.length === 0 ? <Text style={styles.muted}>No invoices are available for this tenant.</Text> : invoices.map((invoice) => (
        <View key={invoice.id} style={styles.invoice}>
          <View style={styles.invoiceCopy}>
            <Text style={styles.invoiceTitle}>{invoice.invoiceNumber}</Text>
            <Text style={styles.muted}>{invoice.description} · {invoice.status}</Text>
            <Text style={styles.amount}>{invoice.currency} {invoice.amount.toFixed(2)}</Text>
          </View>
          {onPay && invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' ? <Pressable accessibilityRole="button" onPress={() => onPay(invoice)} style={styles.button}><Text style={styles.buttonText}>Pay</Text></Pressable> : null}
        </View>
      ))}
    </View>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.muted}>{label}</Text></View>
}

const styles = StyleSheet.create({ container: { gap: spacing.md }, title: { color: colors.ink, fontSize: 28, fontWeight: '700' }, summary: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, metric: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 12, borderWidth: 1, flexGrow: 1, gap: 4, minWidth: 130, padding: spacing.md }, metricValue: { color: colors.ink, fontSize: 17, fontWeight: '700' }, section: { color: colors.ink, fontSize: 18, fontWeight: '700' }, muted: { color: colors.muted, fontSize: 14, lineHeight: 20 }, invoice: { alignItems: 'center', borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between', paddingVertical: spacing.md }, invoiceCopy: { flex: 1, gap: 4 }, invoiceTitle: { color: colors.ink, fontSize: 16, fontWeight: '700' }, amount: { color: colors.ink, fontWeight: '600' }, button: { backgroundColor: colors.blue, borderRadius: 8, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }, buttonText: { color: colors.paper, fontWeight: '700' } })
