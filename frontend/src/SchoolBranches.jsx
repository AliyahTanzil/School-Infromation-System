/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import api from './api/auth.js';
import { getApiErrorMessage } from './api/errorMessage.js';

export default function SchoolBranches({ schoolId }) {
  const [branches, setBranches] = useState([]);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let active = true;
    setLoaded(false);
    api
      .get(`/schools/${schoolId}/branches`)
      .then(({ data }) => {
        if (active) {
          setBranches(data.data);
          setLoaded(true);
        }
      })
      .catch((reason) => {
        if (active) setError(getApiErrorMessage(reason));
      });
    return () => {
      active = false;
    };
  }, [schoolId]);
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data } = editing
        ? await api.patch(`/schools/${schoolId}/branches/${editing}`, { name })
        : await api.post(`/schools/${schoolId}/branches`, { name });
      setBranches((items) =>
        editing
          ? items.map((item) => (item.id === editing ? data.data : item))
          : [...items, data.data]
      );
      setName('');
      setEditing(null);
    } catch (reason) {
      setError(getApiErrorMessage(reason));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="mt-8 rounded-2xl border border-slate-700 bg-slate-900 p-6">
      <h2 className="text-xl font-semibold">School branches</h2>
      <p className="mt-2 text-slate-400">
        Add campuses or branches under the main school. Each branch receives its own automatic
        reference code.
      </p>
      {error && <p role="alert">{error}</p>}
      {!loaded && !error && <p>Loading branches�</p>}
      {loaded && !branches.length && <p className="my-4">No branches yet.</p>}
      <ul className="my-4 space-y-3">
        {branches.map((branch) => (
          <li key={branch.id} className="flex items-center justify-between gap-3">
            <span>
              {branch.name} <small className="text-slate-400">{branch.code}</small>
            </span>
            <button
              type="button"
              onClick={() => {
                setEditing(branch.id);
                setName(branch.name);
              }}
              className="secondary-button"
            >
              Edit {branch.name}
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={save} className="flex flex-wrap items-end gap-3">
        <label>
          Branch name
          <input
            className="form-input"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={160}
          />
        </label>
        <button className="primary-button" disabled={busy || !loaded}>
          {busy ? 'Saving�' : editing ? 'Save branch' : 'Add branch'}
        </button>
        {editing && (
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setName('');
            }}
            className="secondary-button"
          >
            Cancel
          </button>
        )}
      </form>
    </section>
  );
}
