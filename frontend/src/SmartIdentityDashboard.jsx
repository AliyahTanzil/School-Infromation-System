import { useMemo, useState } from 'react';
import {
  BadgeCheck,
  Fingerprint,
  KeyRound,
  Laptop,
  QrCode,
  RefreshCw,
  ShieldCheck,
  WifiOff,
} from 'lucide-react';

const metrics = [
  ['2,846', 'Active identities', 'Across students, staff, and visitors', BadgeCheck],
  ['98.7%', 'Trust rate', 'Successful checks this term', ShieldCheck],
  ['14', 'Devices enrolled', 'Trusted verification devices', Laptop],
  ['3', 'Offline events', 'Queued for secure sync', WifiOff],
];

const checks = [
  ['Mariam Kamara', 'QR code', 'Verified', '2 min ago', 'success'],
  ['Lab device 04', 'RFID', 'Verified', '18 min ago', 'success'],
  ['Unknown credential', 'Barcode', 'Blocked', '41 min ago', 'blocked'],
  ['Samuel Conteh', 'Device', 'Verified', '1 hr ago', 'success'],
];

export default function SmartIdentityDashboard() {
  const [mode, setMode] = useState('overview');
  const [scanValue, setScanValue] = useState('');
  const [message, setMessage] = useState('');
  const visibleChecks = useMemo(
    () => checks.filter((item) => mode === 'overview' || item[1].toLowerCase() === mode),
    [mode]
  );

  function simulateVerification(event) {
    event.preventDefault();
    setMessage(
      scanValue.trim()
        ? 'Verification request queued for policy evaluation.'
        : 'Enter a credential value to simulate a check.'
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 border-b border-slate-800 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">
              Module 29 · Smart identity
            </p>
            <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-pretty sm:text-5xl">
              Trust every check, without exposing sensitive identity data.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
              Manage QR, barcode, RFID, device, and future biometric providers through one
              policy-controlled identity layer.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
            <Fingerprint size={16} /> Provider adapters online
          </div>
        </header>

        <section
          className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          aria-label="Identity metrics"
        >
          {metrics.map(([value, label, detail, Icon]) => (
            <article
              key={label}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-3xl font-semibold text-white">{value}</p>
                <Icon className="text-cyan-300" size={20} />
              </div>
              <p className="mt-3 font-semibold text-slate-200">{label}</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">{detail}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Verification activity
                </p>
                <h2 className="mt-2 text-2xl font-semibold">Recent checks</h2>
              </div>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Filter checks">
                {['overview', 'qr code', 'rfid', 'barcode'].map((filter) => (
                  <button
                    type="button"
                    key={filter}
                    onClick={() => setMode(filter)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${mode === filter ? 'border-cyan-300/50 bg-cyan-300/10 text-cyan-200' : 'border-slate-700 text-slate-400'}`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-6 divide-y divide-slate-800">
              {visibleChecks.map(([name, provider, status, time, tone]) => (
                <div
                  key={`${name}-${time}`}
                  className="flex items-center justify-between gap-4 py-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`grid size-9 shrink-0 place-items-center rounded-xl ${tone === 'blocked' ? 'bg-rose-400/10 text-rose-300' : 'bg-emerald-400/10 text-emerald-300'}`}
                    >
                      {provider === 'QR code' ? (
                        <QrCode size={17} />
                      ) : provider === 'Device' ? (
                        <Laptop size={17} />
                      ) : (
                        <KeyRound size={17} />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-200">{name}</p>
                      <p className="text-sm text-slate-500">
                        {provider} · {time}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${tone === 'blocked' ? 'bg-rose-400/10 text-rose-300' : 'bg-emerald-400/10 text-emerald-300'}`}
                  >
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Test a provider
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Verify a credential</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Values are evaluated server-side and stored as hashes only.
            </p>
            <form className="mt-6 space-y-4" onSubmit={simulateVerification}>
              <label className="block text-sm font-medium text-slate-300" htmlFor="provider">
                Provider
                <select
                  id="provider"
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-200"
                >
                  <option>QR code</option>
                  <option>RFID</option>
                  <option>Barcode</option>
                  <option>Device</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-300" htmlFor="credential">
                Credential value
                <input
                  id="credential"
                  value={scanValue}
                  onChange={(event) => setScanValue(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-200 outline-none focus:border-cyan-300"
                  placeholder="Scan or enter value"
                />
              </label>
              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-200"
                type="submit"
              >
                <RefreshCw size={16} /> Run policy check
              </button>
              {message && (
                <p className="text-sm text-cyan-200" role="status">
                  {message}
                </p>
              )}
            </form>
          </article>
        </section>
      </div>
    </main>
  );
}
