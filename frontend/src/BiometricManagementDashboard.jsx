import { useState } from 'react';
import { Activity, Fingerprint, Plus, ShieldCheck, WifiOff } from 'lucide-react';

const initialDevices = [
  {
    id: 'reader-gate-a',
    displayName: 'Main Gate Reader',
    location: 'North entrance',
    status: 'ACTIVE',
    capabilities: ['fingerprint', 'face'],
    lastSeenAt: new Date().toISOString(),
  },
  {
    id: 'reader-lab-b',
    displayName: 'Science Lab Reader',
    location: 'Science block',
    status: 'OFFLINE',
    capabilities: ['fingerprint'],
    lastSeenAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export default function BiometricManagementDashboard() {
  const [devices, setDevices] = useState(initialDevices);
  const [notice, setNotice] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ displayName: '', location: '' });
  const [health, setHealth] = useState({});

  function registerDevice(event) {
    event.preventDefault();
    if (!form.displayName.trim()) return setNotice('Enter a device name first.');
    const device = {
      id: `reader-${Date.now()}`,
      displayName: form.displayName.trim(),
      location: form.location.trim() || 'Unassigned location',
      status: 'PENDING',
      capabilities: ['fingerprint'],
      lastSeenAt: null,
    };
    setDevices((current) => [...current, device]);
    setForm({ displayName: '', location: '' });
    setShowForm(false);
    setNotice('Device registered in pending state. Connect its secure adapter to activate it.');
  }

  function checkHealth(device) {
    setHealth((current) => ({
      ...current,
      [device.id]: device.status === 'ACTIVE' ? 'HEALTHY' : 'OFFLINE',
    }));
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-cyan-300">Module 41 · Privacy-first identity</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">Biometric management</h1>
            <p className="mt-3 max-w-2xl text-slate-400">
              Connect approved attendance readers without storing raw fingerprints or face images.
              Every verification is tenant-scoped, idempotent, and auditable.
            </p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950"
            onClick={() => setShowForm((current) => !current)}
          >
            <Plus size={18} /> Register device
          </button>
        </header>
        {notice && (
          <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
            {notice}
          </div>
        )}
        {showForm && (
          <form
            onSubmit={registerDevice}
            className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 md:grid-cols-[1fr_1fr_auto] md:items-end"
          >
            <label className="flex flex-col gap-2 text-sm text-slate-300">
              Device name
              <input
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                value={form.displayName}
                onChange={(event) => setForm({ ...form, displayName: event.target.value })}
                placeholder="North entrance reader"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-300">
              Location
              <input
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                value={form.location}
                onChange={(event) => setForm({ ...form, location: event.target.value })}
                placeholder="Main gate"
              />
            </label>
            <button
              className="rounded-lg bg-slate-100 px-4 py-2 font-semibold text-slate-950"
              type="submit"
            >
              Save device
            </button>
          </form>
        )}
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <Fingerprint className="text-cyan-300" />
            <p className="mt-5 text-3xl font-semibold">
              {devices.filter((device) => device.status === 'ACTIVE').length}
            </p>
            <p className="text-sm text-slate-400">Active readers</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <ShieldCheck className="text-emerald-300" />
            <p className="mt-5 text-3xl font-semibold">0</p>
            <p className="text-sm text-slate-400">Raw biometric records stored</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <Activity className="text-amber-300" />
            <p className="mt-5 text-3xl font-semibold">
              {devices.filter((device) => device.status === 'OFFLINE').length}
            </p>
            <p className="text-sm text-slate-400">Readers needing attention</p>
          </div>
        </section>
        <section className="grid gap-4">
          {devices.map((device) => (
            <article
              key={device.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-slate-800 p-3">
                  {device.status === 'OFFLINE' ? (
                    <WifiOff className="text-amber-300" />
                  ) : (
                    <Fingerprint className="text-cyan-300" />
                  )}
                </div>
                <div>
                  <h2 className="font-semibold">{device.displayName}</h2>
                  <p className="text-sm text-slate-400">
                    {device.location} · {device.capabilities.join(' · ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold">
                  {health[device.id] || device.status}
                </span>
                <button
                  className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
                  onClick={() => checkHealth(device)}
                >
                  Check health
                </button>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
