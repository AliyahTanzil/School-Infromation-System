import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from './api/auth.js';

export default function PaymentGatewayDashboard() {
  const [schoolId, setSchoolId] = useState(() => sessionStorage.getItem('schoolId') ?? '');
  const [intents, setIntents] = useState([]);
  const [health, setHealth] = useState(null);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ invoiceId: '', amount: '', channel: 'MOBILE_MONEY' });
  const headers = useCallback(() => ({ 'x-school-id': schoolId }), [schoolId]);
  const load = useCallback(async () => {
    if (!schoolId) return;
    try {
      const [intentResponse, healthResponse] = await Promise.all([
        api.get('/payment-gateway/intents', { headers: headers() }),
        api.get('/payment-gateway/health', { headers: headers() }),
      ]);
      setIntents(intentResponse.data.data ?? []);
      setHealth(healthResponse.data.data ?? null);
    } catch (error) {
      setMessage(error.response?.data?.error?.message || 'Unable to load Monime payments.');
    }
  }, [headers, schoolId]);
  useEffect(() => {
    load();
  }, [load]);
  const pay = async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      const idempotencyKey = crypto.randomUUID();
      const created = await api.post(
        '/payment-gateway/intents',
        {
          invoiceId: form.invoiceId,
          amountMinor: Math.round(Number(form.amount) * 100),
          currency: 'SLE',
          channel: form.channel,
          idempotencyKey,
          description: 'SAIS school invoice',
        },
        { headers: headers() }
      );
      const initialized = await api.post(
        `/payment-gateway/intents/${created.data.data.id}/initialize`,
        {},
        { headers: headers() }
      );
      const checkoutUrl = initialized.data.data.checkoutUrl;
      if (!checkoutUrl) throw new Error('Monime did not return a checkout URL');
      window.location.assign(checkoutUrl);
    } catch (error) {
      setMessage(
        error.response?.data?.error?.message || error.message || 'Unable to start payment.'
      );
    }
  };
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-slate-100 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300">
              Module 18
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Monime payments</h1>
            <p className="mt-2 text-slate-400">
              Secure hosted checkout for Sierra Leone mobile money and supported bank cards.
            </p>
          </div>
          <Link to="/admin" className="rounded-xl border border-slate-700 px-4 py-2 text-sm">
            Back to administration
          </Link>
        </header>
        {message && (
          <p role="status" className="mt-5 rounded-xl border border-amber-700 bg-amber-950 p-3">
            {message}
          </p>
        )}
        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-semibold">Start invoice payment</h2>
          <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={pay}>
            <input
              required
              className="rounded-xl bg-slate-800 p-3"
              placeholder="School UUID"
              value={schoolId}
              onChange={(event) => {
                setSchoolId(event.target.value);
                sessionStorage.setItem('schoolId', event.target.value);
              }}
            />
            <input
              required
              className="rounded-xl bg-slate-800 p-3"
              placeholder="Invoice UUID"
              value={form.invoiceId}
              onChange={(event) => setForm({ ...form, invoiceId: event.target.value })}
            />
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              className="rounded-xl bg-slate-800 p-3"
              placeholder="Amount in SLE"
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: event.target.value })}
            />
            <select
              className="rounded-xl bg-slate-800 p-3"
              value={form.channel}
              onChange={(event) => setForm({ ...form, channel: event.target.value })}
            >
              <option value="MOBILE_MONEY">
                Mobile money (Orange, Africell; Qcell when Monime enables it)
              </option>
              <option value="CARD">Bank card (Visa/Mastercard/ATM card when supported)</option>
            </select>
            <button
              className="rounded-xl bg-indigo-600 px-4 py-3 font-semibold"
              disabled={!schoolId}
            >
              Continue to Monime
            </button>
          </form>
        </section>
        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-slate-400">Provider</p>
            <strong className="mt-2 block text-xl">Monime Space</strong>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-slate-400">Health</p>
            <strong className="mt-2 block text-xl">
              {health?.healthy ? 'Configured' : 'Unavailable'}
            </strong>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-slate-400">Payment intents</p>
            <strong className="mt-2 block text-xl">{intents.length}</strong>
          </article>
        </section>
        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-semibold">Recent intents</h2>
          {intents.map((intent) => (
            <div
              key={intent.id}
              className="mt-3 flex justify-between border-b border-slate-800 py-3"
            >
              <span>{intent.internalReference}</span>
              <span>{intent.channel}</span>
              <span>{intent.status}</span>
            </div>
          ))}
          {!intents.length && <p className="mt-4 text-slate-400">No payments started yet.</p>}
        </section>
      </div>
    </main>
  );
}
