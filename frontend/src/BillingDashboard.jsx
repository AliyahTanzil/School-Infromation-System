import { useEffect, useState } from 'react';
import api from './api/auth.js';

const money = (minor = 0, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(minor / 100);

export default function BillingDashboard() {
  const [overview, setOverview] = useState(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/billing/overview');
      setOverview(data.data);
    } catch (err) {
      setError(err.response?.data?.error?.message ?? 'Billing data could not be loaded.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const lifecycle = async (action, planKey) => {
    setBusy(true);
    setNotice('');
    setError('');
    try {
      await api.post('/billing/lifecycle', { action, planKey });
      setNotice('Billing change accepted and recorded.');
      await load();
    } catch (err) {
      setError(err.response?.data?.error?.message ?? 'Billing change could not be completed.');
    } finally {
      setBusy(false);
    }
  };

  if (error && !overview)
    return (
      <main className="billing-page">
        <div className="billing-notice">{error}</div>
      </main>
    );
  if (!overview)
    return (
      <main className="billing-page">
        <p>Loading billing workspace…</p>
      </main>
    );

  return (
    <main className="billing-page">
      <header className="billing-hero">
        <div>
          <p className="eyebrow">MODULE 44 / FINANCIAL OPERATIONS</p>
          <h1>Subscription & billing</h1>
          <p className="lede">Manage your school plan, entitlements, usage, and payment history.</p>
        </div>
        <div className="billing-status">
          <span className="status-dot" /> {overview.subscription?.status ?? 'NOT CONFIGURED'}
          <small>
            {overview.subscription?.currentPeriodEnd
              ? `Renews ${new Date(overview.subscription.currentPeriodEnd).toLocaleDateString()}`
              : 'No renewal scheduled'}
          </small>
        </div>
      </header>
      {notice && (
        <div className="billing-notice" role="status">
          {notice}
        </div>
      )}
      {error && (
        <div className="billing-notice" role="alert">
          {error}
        </div>
      )}
      <section className="billing-grid">
        <article className="billing-card plan-card">
          <p className="card-label">CURRENT PLAN</p>
          <h2>{overview.plan?.name ?? 'No plan'}</h2>
          <strong>
            {money(overview.plan?.amountMinor, overview.plan?.currency)}
            <small> / {overview.plan?.interval ?? 'month'}</small>
          </strong>
          <p>
            {overview.tenantId
              ? 'Your current tenant subscription and renewal controls.'
              : 'Select a tenant workspace to manage subscription and payment settings.'}
          </p>
          <div className="button-row">
            <button disabled={busy || !overview.tenantId} onClick={() => lifecycle('cancel')}>
              Cancel at period end
            </button>
            <button
              className="ghost"
              disabled={busy || !overview.tenantId}
              onClick={() => lifecycle('resume')}
            >
              Resume
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
                    width: `${Math.min(100, (item.quantity / Math.max(1, item.includedQuantity)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </article>
      </section>
      <section className="billing-lower">
        <article className="billing-card">
          <div className="section-heading">
            <div>
              <p className="card-label">INVOICES</p>
              <h2>Recent invoices</h2>
            </div>
          </div>
          {overview.invoices.map((invoice) => (
            <div className="invoice-row" key={invoice.number}>
              <div>
                <b>{invoice.number}</b>
                <small>{new Date(invoice.issuedAt).toLocaleDateString()}</small>
              </div>
              <span className="paid">{invoice.status}</span>
              <strong>{money(invoice.totalMinor, invoice.currency)}</strong>
            </div>
          ))}
        </article>
        <article className="billing-card">
          <p className="card-label">AVAILABLE PLANS</p>
          <h2>Choose your operating layer</h2>
          {overview.plans.map((plan) => (
            <div
              className={`plan-option ${plan.name === overview.plan?.name ? 'selected' : ''}`}
              key={plan.key}
            >
              <div>
                <b>{plan.name}</b>
                <small>{plan.description}</small>
              </div>
              <strong>
                {money(plan.amountMinor, plan.currency)}
                <small>/mo</small>
              </strong>
              {plan.name !== overview.plan?.name && (
                <button
                  className="ghost"
                  disabled={busy}
                  onClick={() =>
                    lifecycle(
                      plan.amountMinor > (overview.plan?.amountMinor ?? 0)
                        ? 'upgrade'
                        : 'downgrade',
                      plan.key
                    )
                  }
                >
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
