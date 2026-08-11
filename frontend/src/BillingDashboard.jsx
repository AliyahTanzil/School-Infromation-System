import { useState } from 'react';

const money = (minor, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(minor / 100);

const overview = {
  plan: { name: 'Growth', amountMinor: 24900, currency: 'USD', interval: 'month' },
  subscription: { status: 'ACTIVE', currentPeriodEnd: '2026-09-01', cancelAtPeriodEnd: false },
  usage: [
    { metricKey: 'Active students', quantity: 842, includedQuantity: 1200 },
    { metricKey: 'Storage', quantity: 48, includedQuantity: 100 },
    { metricKey: 'Monthly messages', quantity: 18420, includedQuantity: 25000 },
  ],
  invoices: [
    { number: 'INV-2026-08', status: 'PAID', totalMinor: 24900, issuedAt: 'Aug 01, 2026' },
    { number: 'INV-2026-07', status: 'PAID', totalMinor: 24900, issuedAt: 'Jul 01, 2026' },
  ],
  plans: [
    {
      key: 'starter',
      name: 'Starter',
      amountMinor: 9900,
      description: 'Core administration for growing schools.',
    },
    {
      key: 'growth',
      name: 'Growth',
      amountMinor: 24900,
      description: 'Automation, analytics, and family engagement.',
    },
    {
      key: 'scale',
      name: 'Scale',
      amountMinor: 59900,
      description: 'Multi-school operations with advanced controls.',
    },
  ],
};

export default function BillingDashboard() {
  const [notice, setNotice] = useState('');
  const queue = (action) => setNotice(`${action} queued for review in Demo mode.`);
  return (
    <main className="billing-page">
      <header className="billing-hero">
        <div>
          <p className="eyebrow">MODULE 32 / FINANCIAL OPERATIONS</p>
          <h1>Subscription & billing</h1>
          <p className="lede">Keep every school plan, entitlement, and payment decision visible.</p>
        </div>
        <div className="billing-status">
          <span className="status-dot" /> {overview.subscription.status}
          <small>Renews {overview.subscription.currentPeriodEnd}</small>
        </div>
      </header>
      {notice && (
        <div className="billing-notice" role="status">
          {notice}
        </div>
      )}
      <section className="billing-grid">
        <article className="billing-card plan-card">
          <p className="card-label">CURRENT PLAN</p>
          <h2>{overview.plan.name}</h2>
          <strong>
            {money(overview.plan.amountMinor)}
            <small> / {overview.plan.interval}</small>
          </strong>
          <p>Includes all core administration, analytics, and family engagement controls.</p>
          <div className="button-row">
            <button onClick={() => queue('Upgrade')}>Change plan</button>
            <button className="ghost" onClick={() => queue('Cancellation')}>
              Manage
            </button>
          </div>
        </article>
        <article className="billing-card">
          <p className="card-label">USAGE GUARDRAILS</p>
          {overview.usage.map((item) => (
            <div className="usage-row" key={item.metricKey}>
              <div>
                <span>{item.metricKey}</span>
                <b>
                  {item.quantity.toLocaleString()} / {item.includedQuantity.toLocaleString()}
                </b>
              </div>
              <div className="usage-track">
                <i
                  style={{
                    width: `${Math.min(100, (item.quantity / item.includedQuantity) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </article>
        <article className="billing-card">
          <p className="card-label">PAYMENT METHOD</p>
          <h3>Visa •••• 4242</h3>
          <p>Primary payment method · verified Aug 01, 2026</p>
          <button onClick={() => queue('Payment method update')}>Update payment method</button>
        </article>
      </section>
      <section className="billing-lower">
        <article className="billing-card">
          <div className="section-heading">
            <div>
              <p className="card-label">INVOICES</p>
              <h2>Recent invoices</h2>
            </div>
            <button className="ghost" onClick={() => queue('Export')}>
              Export
            </button>
          </div>
          {overview.invoices.map((invoice) => (
            <div className="invoice-row" key={invoice.number}>
              <div>
                <b>{invoice.number}</b>
                <small>{invoice.issuedAt}</small>
              </div>
              <span className="paid">{invoice.status}</span>
              <strong>{money(invoice.totalMinor)}</strong>
            </div>
          ))}
        </article>
        <article className="billing-card">
          <p className="card-label">AVAILABLE PLANS</p>
          <h2>Choose the right operating layer</h2>
          {overview.plans.map((plan) => (
            <div
              className={`plan-option ${plan.key === 'growth' ? 'selected' : ''}`}
              key={plan.key}
            >
              <div>
                <b>{plan.name}</b>
                <small>{plan.description}</small>
              </div>
              <strong>
                {money(plan.amountMinor)}
                <small>/mo</small>
              </strong>
              {plan.key !== 'growth' && (
                <button className="ghost" onClick={() => queue(`${plan.name} plan`)}>
                  Select
                </button>
              )}
            </div>
          ))}
        </article>
      </section>
    </main>
  );
}
