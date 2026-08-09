import axios from 'axios';
import { useEffect, useState } from 'react';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

export default function ResultsDashboard() {
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const load = async () => {
    try {
      const [list, summary] = await Promise.all([
        api.get('/results'),
        api.get('/results/statistics'),
      ]);
      setResults(list.data.data || []);
      setStats(summary.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load results');
    }
  };
  useEffect(() => {
    load();
  }, []);
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Module 14</p>
          <h1 className="text-3xl font-semibold">Result Management System</h1>
          <p className="mt-2 text-slate-400">
            Process approved examination marks into official academic results.
          </p>
        </header>
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-400/40 bg-red-950/30 p-4 text-red-200"
          >
            {error}
          </div>
        )}
        <section className="grid gap-4 sm:grid-cols-3">
          {[
            ['Results', stats?.count ?? '—'],
            ['Pass count', stats?.passCount ?? '—'],
            ['Average', stats ? Number(stats.average).toFixed(2) : '—'],
          ].map(([label, value]) => (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5" key={label}>
              <p className="text-sm text-slate-400">{label}</p>
              <p className="mt-2 text-2xl font-semibold">{value}</p>
            </div>
          ))}
        </section>
        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 p-5">
            <h2 className="font-medium">Official results</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/60 text-slate-400">
                <tr>
                  <th className="p-4">Student</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Average</th>
                  <th className="p-4">Grade</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map((item) => (
                  <tr className="border-t border-slate-800" key={item.id}>
                    <td className="p-4">
                      {item.student?.profile
                        ? `${item.student.profile.firstName} ${item.student.profile.lastName}`
                        : item.studentId}
                    </td>
                    <td className="p-4">{item.total}</td>
                    <td className="p-4">{item.average}</td>
                    <td className="p-4">{item.grade || '—'}</td>
                    <td className="p-4">{item.status}</td>
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
