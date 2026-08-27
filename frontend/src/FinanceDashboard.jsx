import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from './api/auth.js';
import { formatLe } from './utils/currency.js';

const formatMoney = (minor = 0) => formatLe(minor);

const statusClass = {
  PAID: 'status-positive',
  PARTIALLY_PAID: 'status-warning',
  ISSUED: 'status-neutral',
  OVERDUE: 'status-danger',
};

export default function FinanceDashboard() {
  const [schoolId, setSchoolId] = useState(() => sessionStorage.getItem('schoolId') ?? '');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');
  const [summary, setSummary] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [state, setState] = useState('loading');

  useEffect(() => {
    let active = true;
    if (!schoolId) {
      setState('ready');
      return undefined;
    }
    const config = { headers: { 'x-school-id': schoolId } };
    Promise.all([api.get('/finance/summary', config), api.get('/finance/invoices', config)])
      .then(([summaryResponse, invoicesResponse]) => {
        if (!active) return;
        setSummary(summaryResponse.data?.data ?? null);
        setInvoices(invoicesResponse.data?.data ?? []);
        setState('ready');
      })
      .catch(() => active && setState('error'));
    return () => {
      active = false;
    };
  }, [schoolId]);

  const filteredInvoices = useMemo(
    () =>
      invoices.filter((invoice) => {
        const haystack =
          `${invoice.invoiceNumber} ${invoice.student?.profile?.firstName ?? ''} ${invoice.student?.profile?.lastName ?? ''}`.toLowerCase();
        return (
          haystack.includes(query.toLowerCase()) && (status === 'ALL' || invoice.status === status)
        );
      }),
    [invoices, query, status]
  );

  if (state === 'loading')
    return (
      <main className="finance-page">
        <div className="finance-loading">
          <span className="finance-spinner" />
          Loading financial workspace
        </div>
      </main>
    );
  if (state === 'error')
    return (
      <main className="finance-page">
        <div className="finance-error">
          <strong>Finance data is unavailable.</strong>
          <span>Check your connection or permissions and try again.</span>
        </div>
      </main>
    );

  const metrics = [
    ['Collected this term', summary?.collectedMinor ?? 0, 'Positive cash received'],
    ['Outstanding balance', summary?.outstandingMinor ?? 0, 'Requires follow-up'],
    ['Invoices issued', invoices.length, 'Across active learners'],
    [
      'Collection rate',
      summary?.collectionRate ? `${summary.collectionRate}%` : '—',
      'Term performance',
    ],
  ];

  return (
    <main className="finance-page">
      <div className="finance-container">
        <header className="finance-header">
          <div>
            <p className="finance-kicker">Financial operations</p>
            <h1>Finance control center</h1>
            <p>One reliable view of receivables, collections, and invoice health.</p>
          </div>
          <Link to="/billing" className="finance-secondary-action">
            Manage billing plan <span>→</span>
          </Link>
          <Link to="/admin" className="finance-secondary-action">
            Back to administration
          </Link>
        </header>
        <section className="finance-panel">
          <label>
            School ID
            <input
              value={schoolId}
              onChange={(event) => {
                setSchoolId(event.target.value);
                sessionStorage.setItem('schoolId', event.target.value);
              }}
              placeholder="School UUID"
            />
          </label>
        </section>
        <section className="finance-metrics" aria-label="Finance summary">
          {metrics.map(([label, value, note]) => (
            <article className="finance-metric" key={label}>
              <span>{label}</span>
              <strong>
                {typeof value === 'number' && label !== 'Invoices issued'
                  ? formatMoney(value)
                  : value}
              </strong>
              <small>{note}</small>
            </article>
          ))}
        </section>
        <section className="finance-panel">
          <div className="finance-panel-heading">
            <div>
              <p className="finance-kicker">Receivables ledger</p>
              <h2>Invoices</h2>
            </div>
            <button className="finance-primary-action" type="button">
              Create invoice <span>＋</span>
            </button>
          </div>
          <div className="finance-toolbar">
            <label className="finance-search">
              <span className="sr-only">Search invoices</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by invoice or learner"
              />
            </label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-label="Filter invoices by status"
            >
              <option value="ALL">All statuses</option>
              <option value="ISSUED">Issued</option>
              <option value="PARTIALLY_PAID">Partially paid</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>
          <div className="finance-table-wrap">
            <table className="finance-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Learner</th>
                  <th>Due date</th>
                  <th>Total</th>
                  <th>Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <strong>{invoice.invoiceNumber}</strong>
                      <small>
                        {invoice.issuedAt ? new Date(invoice.issuedAt).toLocaleDateString() : '—'}
                      </small>
                    </td>
                    <td>
                      {invoice.student?.profile
                        ? `${invoice.student.profile.firstName} ${invoice.student.profile.lastName}`
                        : 'Unassigned'}
                    </td>
                    <td>{invoice.dueAt ? new Date(invoice.dueAt).toLocaleDateString() : '—'}</td>
                    <td>{formatMoney(invoice.total, invoice.currency)}</td>
                    <td>{formatMoney(invoice.balance, invoice.currency)}</td>
                    <td>
                      <span
                        className={`finance-status ${statusClass[invoice.status] ?? 'status-neutral'}`}
                      >
                        {invoice.status.replaceAll('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredInvoices.length === 0 && (
              <div className="finance-empty">
                <strong>No invoices match this view.</strong>
                <span>Adjust your search or status filter.</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
