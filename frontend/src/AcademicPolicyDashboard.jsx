import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from './api/auth.js';
import { getApiErrorMessage } from './api/errorMessage.js';

const headers = (schoolId) => ({
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
  const [schoolId, setSchoolId] = useState('');
  const [schools, setSchools] = useState([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [schoolsError, setSchoolsError] = useState('');
  const [schoolRefresh, setSchoolRefresh] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [policies, setPolicies] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  useEffect(() => {
    let active = true;
    setSchoolsLoading(true);
    setSchoolsError('');
    async function loadSchools() {
      try {
        const items = [];
        let page = 1;
        let total;
        do {
          const { data } = await api.get('/schools', { params: { page, pageSize: 100 } });
          items.push(...data.data.items);
          total = data.data.total ?? items.length;
          if (!data.data.items.length) break;
          page += 1;
        } while (items.length < total);
        if (!active) return;
        setSchools(items);
        const saved = sessionStorage.getItem('schoolId');
        setSchoolId(
          items.some((school) => school.id === saved)
            ? saved
            : items.length === 1
              ? items[0].id
              : ''
        );
      } catch (reason) {
        if (active) setSchoolsError(getApiErrorMessage(reason, 'Unable to load schools'));
      } finally {
        if (active) setSchoolsLoading(false);
      }
    }
    loadSchools();
    return () => {
      active = false;
    };
  }, [schoolRefresh]);
  const load = useCallback(
    async (signal) => {
      if (!schoolId) return;
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/academic-policies', {
          headers: headers(schoolId),
          signal,
        });
        if (signal?.aborted) return;
        setPolicies(data.data ?? []);
        sessionStorage.setItem('schoolId', schoolId);
      } catch (reason) {
        if (!signal?.aborted) setError(getApiErrorMessage(reason, 'Unable to load policies'));
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [schoolId]
  );
  useEffect(() => {
    const controller = new AbortController();
    setPolicies([]);
    setMessage('');
    setError('');
    setLoading(false);
    load(controller.signal);
    return () => controller.abort();
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
    if (!schoolId || saving) return;
    setMessage('');
    setError('');
    setSaving(true);
    try {
      await api.post('/academic-policies', form, { headers: headers(schoolId) });
      setMessage('Draft grading policy created. Review it before activation.');
      await load();
    } catch (reason) {
      setError(getApiErrorMessage(reason, 'Unable to create policy'));
    } finally {
      setSaving(false);
    }
  };
  const activate = async (id) => {
    if (!schoolId || saving) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await api.patch(
        `/academic-policies/${id}/status`,
        { status: 'ACTIVE', reason: 'Approved by school administration' },
        { headers: headers(schoolId) }
      );
      setMessage('Policy activated.');
      await load();
    } catch (reason) {
      setError(getApiErrorMessage(reason, 'Unable to activate policy'));
    } finally {
      setSaving(false);
    }
  };
  const activePolicy = policies.some((policy) => policy.status === 'ACTIVE');
  const draftPolicy = policies.some((policy) => policy.status === 'DRAFT');

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
          School
          <select
            value={schoolId}
            onChange={(event) => setSchoolId(event.target.value)}
            disabled={schoolsLoading || saving}
          >
            <option value="">{schoolsLoading ? 'Loading schools…' : 'Select your school'}</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
        </label>
        {schoolsError && (
          <p role="alert">
            {schoolsError}{' '}
            <button
              className="secondary-button"
              onClick={() => setSchoolRefresh((value) => value + 1)}
            >
              Retry schools
            </button>
          </p>
        )}
        {!schoolsLoading && !schoolsError && !schools.length && (
          <p>
            Create your school before configuring grading.{' '}
            <Link className="underline" to="/school-setup">
              Create your school
            </Link>
          </p>
        )}
        {message && <p role="status">{message}</p>}
        {error && (
          <p role="alert">
            {error}{' '}
            <button
              className="secondary-button"
              disabled={loading || saving}
              onClick={() => load()}
            >
              Reload policies
            </button>
          </p>
        )}
      </section>
      {schoolId && !error && !loading && (
        <section className="panel" aria-label="Grading setup guidance">
          <h2>Set up grading, step by step</h2>
          <ol className="my-3 list-decimal pl-5">
            <li>Create a draft with pass marks, grade bands, and assessment weights.</li>
            <li>Review the saved policy and its effective dates, then activate it.</li>
            <li>Continue to examinations and prepare assessment records.</li>
          </ol>
          {activePolicy ? (
            <p>
              An active policy is saved. Check that its effective dates cover the examination
              period.{' '}
              <Link className="underline font-semibold" to="/examinations">
                Continue to examinations
              </Link>
            </p>
          ) : draftPolicy ? (
            <p>
              <a className="underline font-semibold" href="#policy-register">
                Next: Review and activate a draft
              </a>
              . Check that grade bands cover 0–100 and assessment weights total 100%.
            </p>
          ) : (
            <p>
              <a className="underline font-semibold" href="#policy-draft">
                Next: Create your grading policy
              </a>
            </p>
          )}
        </section>
      )}
      <section id="policy-draft" className="panel">
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
          <button className="primary-button" disabled={!schoolId || loading || saving || !!error}>
            Create draft
          </button>
        </form>
      </section>
      <section id="policy-register" className="panel">
        <h2>Policy register</h2>
        {loading && <p role="status">Loading grading policies…</p>}
        {!loading && !error && schoolId && policies.length === 0 && (
          <p>No grading policies found.</p>
        )}
        {!loading &&
          !error &&
          policies.map((policy) => (
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
                  <button
                    className="primary-button"
                    disabled={saving}
                    onClick={() => activate(policy.id)}
                  >
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
