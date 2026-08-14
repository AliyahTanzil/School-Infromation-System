/* eslint-disable react/prop-types */
import { useCallback, useEffect, useState } from 'react';
import { Check, Mail, RefreshCw, ShieldCheck, X } from 'lucide-react';
import * as authApi from './api/auth.js';

export default function OwnerActivationPanel() {
  const [requests, setRequests] = useState([]);
  const [outbox, setOutbox] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pending, emails] = await Promise.all([
        authApi.listActivationRequests(),
        authApi.listDevelopmentOutbox(),
      ]);
      setRequests(pending);
      setOutbox(emails);
    } catch (error) {
      setMessage(error.response?.data?.error?.message || 'Only the application owner can view this panel.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function decide(id, decision) {
    await authApi.decideActivationRequest(id, decision);
    setMessage(`Request ${decision === 'approve' ? 'approved' : 'rejected'}.`);
    await load();
  }

  return (
    <section className="space-y-6 rounded-3xl border border-slate-700 bg-slate-950/80 p-6 text-slate-100 shadow-2xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Application owner only</p>
          <h1 className="mt-2 text-2xl font-bold">Tenant activation center</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Tenant users can create login details, but they cannot access SAIS until you approve them here. Activation links are captured in the development outbox for inspection.</p>
        </div>
        <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm hover:border-cyan-400"><RefreshCw size={16} /> Refresh</button>
      </div>
      {message && <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">{message}</p>}
      {loading ? <p className="text-sm text-slate-400">Loading activation queue...</p> : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><p className="text-xs uppercase text-slate-500">Pending requests</p><p className="mt-2 text-3xl font-bold">{requests.length}</p></div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><p className="text-xs uppercase text-slate-500">Development emails</p><p className="mt-2 text-3xl font-bold">{outbox.length}</p></div>
            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4"><ShieldCheck className="text-cyan-300" size={20} /><p className="mt-2 text-sm text-cyan-100">Access stays blocked until approval.</p></div>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="min-w-full text-left text-sm"><thead className="bg-slate-900 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Requested</th><th className="px-4 py-3 text-right">Decision</th></tr></thead><tbody className="divide-y divide-slate-800">{requests.map((request) => <tr key={request.id}><td className="px-4 py-3">{request.firstName || ''} {request.lastName || ''}</td><td className="px-4 py-3 text-slate-300">{request.email}</td><td className="px-4 py-3 text-slate-400">{new Date(request.createdAt).toLocaleString()}</td><td className="px-4 py-3"><div className="flex justify-end gap-2"><button type="button" onClick={() => decide(request.id, 'reject')} className="rounded-lg border border-rose-500/40 p-2 text-rose-300 hover:bg-rose-500/10" aria-label={`Reject ${request.email}`}><X size={16} /></button><button type="button" onClick={() => decide(request.id, 'approve')} className="rounded-lg bg-emerald-500/20 p-2 text-emerald-300 hover:bg-emerald-500/30" aria-label={`Approve ${request.email}`}><Check size={16} /></button></div></td></tr>)}{requests.length === 0 && <tr><td colSpan="4" className="px-4 py-8 text-center text-slate-500">No pending tenant activations.</td></tr>}</tbody></table>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><div className="mb-3 flex items-center gap-2"><Mail size={16} className="text-cyan-300" /><h2 className="font-semibold">Development email outbox</h2></div><div className="space-y-2 text-sm">{outbox.slice(0, 5).map((email) => <div key={email.id} className="flex flex-wrap justify-between gap-2 rounded-xl bg-slate-950 p-3"><span>{email.toEmail}</span><span className="text-slate-400">{email.template}</span></div>)}</div></div>
        </>
      )}
    </section>
  );
}
