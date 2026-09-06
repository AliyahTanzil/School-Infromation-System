import { useEffect, useState } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import api from './api/auth.js';
import { getApiErrorMessage } from './api/errorMessage.js';

export default function SchoolSelector() {
  const { user } = useAuth();
  const allowed = user?.accountType === 'APPLICATION_MANAGER' || user?.platformRole === 'OWNER';
  const [schools, setSchools] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!allowed) return;
    let active = true;
    async function load() {
      try {
        const items = [];
        let page = 1;
        let total;
        do {
          const { data } = await api.get('/schools', { params: { page, pageSize: 100 } });
          items.push(...data.data.items);
          total = data.data.total;
          if (!data.data.items.length) break;
          page += 1;
        } while (items.length < total);
        if (active) setSchools(items);
      } catch (reason) {
        if (active) setError(getApiErrorMessage(reason));
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [allowed]);
  if (!allowed) return null;
  return (
    <section className="flex flex-wrap items-center gap-3 border-b border-slate-700 bg-slate-950 px-6 py-3 text-white">
      <label htmlFor="active-school">Selected school</label>
      <select
        id="active-school"
        className="form-input"
        style={{ maxWidth: '28rem' }}
        value={sessionStorage.getItem('sais.selectedSchoolId') || ''}
        onChange={(event) => {
          if (event.target.value)
            sessionStorage.setItem('sais.selectedSchoolId', event.target.value);
          else sessionStorage.removeItem('sais.selectedSchoolId');
          window.location.reload();
        }}
      >
        <option value="">Select a school</option>
        {schools.map((school) => (
          <option key={school.id} value={school.id}>
            {school.name} ({school.code || school.slug})
          </option>
        ))}
      </select>
      {error && <span role="alert">{error}</span>}
    </section>
  );
}
