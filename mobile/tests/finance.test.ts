import { createFinanceService } from '../services/finance/service'

async function run() {
  const service = createFinanceService({ createPayment: async (input) => ({ id: 'p1', invoiceId: input.invoiceId, amount: input.amount, currency: 'USD', status: 'PENDING', idempotencyKey: input.idempotencyKey, createdAt: new Date().toISOString() }) })
  await assertRejects(service.payInvoice({ invoiceId: 'i1', amount: 0, idempotencyKey: 'k1' }))
  await assertRejects(service.payInvoice({ invoiceId: 'i1', amount: 10, idempotencyKey: '' }))
  await assertRejects(service.payInvoice({ invoiceId: ' ', amount: 10, idempotencyKey: 'k2' }))
  const payment = await service.payInvoice({ invoiceId: 'i1', amount: 10, idempotencyKey: 'k1' })
  if (payment.idempotencyKey !== 'k1') throw new Error('idempotency key was not preserved')
}

async function assertRejects(promise: Promise<unknown>) {
  try { await promise } catch { return }
  throw new Error('expected promise to reject')
}

void run()
