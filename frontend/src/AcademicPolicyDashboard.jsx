import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const headers = (schoolId) => ({
  Authorization: `Bearer ${sessionStorage.getItem('accessToken') ?? ''}`,
  'content-type': 'application/json',
  'x-school-id': schoolId,
});
const initialForm = {
  name: 'Standard grading policy',
  code: 'STANDARD',
  passMark: 50,
  effectiveFrom: new Date().toISOString().slice(0, 10),
  bands: [
    { label: 'F', minMark: 0, maxMark: 49.99, point: 0, remark: 'Below standard' },
    { label: 'P', minMark: 50, maxMark: 69.99, point: 2, remark: 'Pass' },
    { label: 'A', minMark: 70, maxMark: 100, point: 4, remark: 'Excellent' },
  ],
  weights: [
    { name: 'Coursework', code: 'CW', weight: 40 },
    { name: 'Final examination', code: 'EXAM', weight: 60 },
  ],
};

export default function AcademicPolicyDashboard() {
  const [schoolId, setSchoolId] = useState(() => sessionStorage.getItem('schoolId') ?? '');
  const [policies, setPolicies] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const load = useCallback(async () => {
    if (!schoolId) return;
    const response = await fetch('/api/academic-policies', { headers: headers(schoolId) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.error?.message ?? 'Unable to load policies');
    setPolicies(payload.data ?? []);
    sessionStorage.setItem('schoolId', schoolId);
  }, [schoolId]);
  useEffect(() => {
    load().catch((error) => setMessage(error.message));
  }, [load]);
  const updateBand = (index, field, value) =>
    setForm({
      ...form,
      bands: form.bands.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    });
  const updateWeight = (index, field, value) =>
    setForm({
      ...form,
      weights: form.weights.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    });

  const create = async (event) => {
    event.preventDefault();
    setMessage('');
    const response = await fetch('/api/academic-policies', {
      method: 'POST',
      headers: headers(schoolId),
      body: JSON.stringify(form),
    });
    const payload = await response.json();
    if (!response.ok) return setMessage(payload?.error?.message ?? 'Unable to create policy');
    setMessage('Draft grading policy created. Review it before activation.');
    await load();
  };
  const activate = async (id) => {
    const response = await fetch(`/api/academic-policies/${id}/status`, {
      method: 'PATCH',
      headers: headers(schoolId),
      body: JSON.stringify({ status: 'ACTIVE', reason: 'Approved by school administration' }),
    });
    const payload = await response.json();
    if (!response.ok) return setMessage(payload?.error?.message ?? 'Unable to activate policy');
    setMessage('Policy activated.');
    await load();
  };

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <span className="eyebrow">Academic governance</span>
          <h1>Grading policies</h1>
          <p>Control pass marks, grade bands, assessment weighting, and effective dates.</p>
        </div>
        <Link className="primary-button" to="/admin">
          Back to administration
        </Link>
      </section>
      <section className="panel">
        <label>
          School ID
          <input
            value={schoolId}
            onChange={(event) => setSchoolId(event.target.value)}
            placeholder="School UUID"
          />
        </label>
        {message && <p role="status">{message}</p>}
      </section>
      <section className="panel">
        <h2>Create policy draft</h2>
        <form onSubmit={create} className="space-y-3">
          <input
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            aria-label="Policy name"
          />
          <input
            required
            value={form.code}
            onChange={(event) => setForm({ ...form, code: event.target.value })}
            aria-label="Policy code"
          />
          <label>
            Pass mark
            <input
              type="number"
              min="0"
              max="100"
              value={form.passMark}
              onChange={(event) => setForm({ ...form, passMark: Number(event.target.value) })}
            />
          </label>
          <label>
            Effective from
            <input
              type="date"
              value={form.effectiveFrom}
              onChange={(event) => setForm({ ...form, effectiveFrom: event.target.value })}
            />
          </label>
          <label>
            Effective to (optional)
            <input
              type="date"
              value={form.effectiveTo ?? ''}
              onChange={(event) =>
                setForm({ ...form, effectiveTo: event.target.value || undefined })
              }
            />
          </label>
          <h3>Grade bands</h3>
          {form.bands.map((band, index) => (
            <div className="grid gap-2 md:grid-cols-4" key={`${band.label}-${index}`}>
              <input
                aria-label={`Band ${index + 1} label`}
                value={band.label}
                onChange={(event) => updateBand(index, 'label', event.target.value)}
              />
              <input
                aria-label={`Band ${index + 1} minimum`}
                type="number"
                step="0.01"
                value={band.minMark}
                onChange={(event) => updateBand(index, 'minMark', Number(event.target.value))}
              />
              <input
                aria-label={`Band ${index + 1} maximum`}
                type="number"
                step="0.01"
                value={band.maxMark}
                onChange={(event) => updateBand(index, 'maxMark', Number(event.target.value))}
              />
              <input
                aria-label={`Band ${index + 1} points`}
                type="number"
                step="0.01"
                value={band.point}
                onChange={(event) => updateBand(index, 'point', Number(event.target.value))}
              />
            </div>
          ))}
          <h3>Assessment weights</h3>
          {form.weights.map((weight, index) => (
            <div className="grid gap-2 md:grid-cols-3" key={`${weight.code}-${index}`}>
              <input
                aria-label={`Weight ${index + 1} name`}
                value={weight.name}
                onChange={(event) => updateWeight(index, 'name', event.target.value)}
              />
              <input
                aria-label={`Weight ${index + 1} code`}
                value={weight.code}
                onChange={(event) => updateWeight(index, 'code', event.target.value)}
              />
              <input
                aria-label={`Weight ${index + 1} percentage`}
                type="number"
                step="0.01"
                value={weight.weight}
                onChange={(event) => updateWeight(index, 'weight', Number(event.target.value))}
              />
            </div>
          ))}
          <p>
            Grade bands must cover 0–100 without gaps; assessment weights must total 100% before
            activation.
          </p>
          <button className="primary-button" disabled={!schoolId}>
            Create draft
          </button>
        </form>
      </section>
      <section className="panel">
        <h2>Policy register</h2>
        {policies.length === 0 && <p>No grading policies found.</p>}
        {policies.map((policy) => (
          <article className="student-row" key={policy.id}>
            <span>
              <strong>{policy.name}</strong>
              <small>
                {policy.code} · pass mark {policy.passMark}% · effective{' '}
                {String(policy.effectiveFrom).slice(0, 10)}
              </small>
              <small>
                {policy.bands.length} bands ·{' '}
                {policy.weights.map((item) => `${item.name} ${item.weight}%`).join(', ')}
              </small>
            </span>
            <span>
              <span className="status-pill">{policy.status}</span>
              {policy.status === 'DRAFT' && (
                <button className="primary-button" onClick={() => activate(policy.id)}>
                  Activate
                </button>
              )}
            </span>
          </article>
        ))}
      </section>
    </main>
  );
}
