import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const sampleInvoices = [
  {
    number: 'INV-2026-0042',
    student: 'Amara Mensah',
    due: 'Aug 15, 2026',
    total: 1250,
    balance: 250,
    status: 'PARTIALLY_PAID',
  },
  {
    number: 'INV-2026-0041',
    student: 'Kwame Boateng',
    due: 'Aug 12, 2026',
    total: 980,
    balance: 0,
    status: 'PAID',
  },
  {
    number: 'INV-2026-0040',
    student: 'Nia Owusu',
    due: 'Aug 10, 2026',
    total: 1120,
    balance: 1120,
    status: 'ISSUED',
  },
];

export default function FinanceDashboard() {
  const [query, setQuery] = useState('');
  const invoices = useMemo(
    () =>
      sampleInvoices.filter((item) =>
        `${item.number} ${item.student}`.toLowerCase().includes(query.toLowerCase())
      ),
    [query]
  );
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300">
              Finance control center
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">School finances, clearly.</h1>
          </div>
          <Link
            to="/"
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300"
          >
            Back to home
          </Link>
        </header>
        <section className="grid gap-4 md:grid-cols-4">
          {[
            ['Collected this term', '$84,240'],
            ['Outstanding', '$18,630'],
            ['Invoices issued', '248'],
            ['Collection rate', '81.9%'],
          ].map(([label, value]) => (
            <article key={label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">{label}</p>
              <p className="mt-3 text-2xl font-semibold">{value}</p>
            </article>
          ))}
        </section>
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Recent invoices</h2>
              <p className="mt-1 text-sm text-slate-400">
                Monitor balances and payment status across the school.
              </p>
            </div>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search invoices"
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm outline-none focus:border-indigo-400"
            />
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="pb-3">Invoice</th>
                  <th className="pb-3">Student</th>
                  <th className="pb-3">Due</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3">Balance</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.number} className="border-t border-slate-800">
                    <td className="py-4 font-medium">{invoice.number}</td>
                    <td className="py-4 text-slate-300">{invoice.student}</td>
                    <td className="py-4 text-slate-400">{invoice.due}</td>
                    <td className="py-4">${invoice.total.toLocaleString()}</td>
                    <td className="py-4">${invoice.balance.toLocaleString()}</td>
                    <td className="py-4">
                      <span className="rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-semibold text-indigo-200">
                        {invoice.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
