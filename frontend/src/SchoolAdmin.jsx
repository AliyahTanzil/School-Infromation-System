import { useEffect, useState } from 'react';
import { Building2, LoaderCircle, Plus, Save } from 'lucide-react';

const emptyForm = { name: '', slug: '', email: '' };

function slugFromName(name) {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

async function schoolRequest(path = '', options = {}) {
  const response = await fetch(`/api/schools${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(payload.error?.message || payload.message || 'Unable to manage schools');
  return payload.data;
}

export default function SchoolAdmin() {
  const [schools, setSchools] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  async function loadSchools() {
    setLoading(true);
    setError('');
    try {
      const result = await schoolRequest();
      setSchools(result.items ?? []);
    } catch (reason) {
      setError(reason.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSchools();
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => {
      if (name !== 'name') return { ...current, [name]: value };
      const slug = slugFromName(value);
      return { ...current, name: value, slug, email: slug ? `${slug}@gmail.com` : '' };
    });
  }

  function selectSchool(school) {
    setSelectedId(school.id);
    setForm({ name: school.name ?? '', slug: school.slug ?? '', email: school.email ?? '' });
    setNotice('');
    setError('');
  }

  function startNewSchool() {
    setSelectedId('');
    setForm(emptyForm);
    setNotice('');
    setError('');
  }

  async function saveSchool(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.slug.trim())
      return setError('School name and slug are required.');
    setSaving(true);
    setError('');
    setNotice('');
    const body = {
      name: form.name.trim(),
      slug: form.slug.trim().toLowerCase(),
      ...(form.email.trim() ? { email: form.email.trim() } : {}),
    };
    try {
      const editing = Boolean(selectedId);
      const school = await schoolRequest(editing ? `/${selectedId}` : '', {
        method: editing ? 'PUT' : 'POST',
        body: JSON.stringify(body),
      });
      setSelectedId(school.id);
      setForm({ name: school.name ?? '', slug: school.slug ?? '', email: school.email ?? '' });
      setNotice(editing ? 'School updated successfully.' : 'School created successfully.');
      await loadSchools();
    } catch (reason) {
      setError(reason.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-slate-100 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-300">
              SAIS / School management
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Manage schools</h1>
            <p className="mt-2 text-sm text-slate-400">
              Create a school or update an existing school profile.
            </p>
          </div>
          <button type="button" onClick={startNewSchool} className="primary-button">
            <Plus size={17} /> Create school
          </button>
        </header>

        {notice && (
          <p
            role="status"
            className="mt-5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100"
          >
            {notice}
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100"
          >
            {error}
          </p>
        )}

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold">Schools</h2>
            <p className="mt-1 text-sm text-slate-400">
              {schools.length} school{schools.length === 1 ? '' : 's'} configured
            </p>
            {loading ? (
              <p className="mt-6 flex items-center gap-2 text-sm text-slate-400">
                <LoaderCircle className="animate-spin" size={16} /> Loading schools...
              </p>
            ) : schools.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-slate-700 p-6 text-center">
                <Building2 className="mx-auto text-slate-500" size={28} />
                <p className="mt-3 font-medium">No schools yet</p>
                <p className="mt-1 text-sm text-slate-400">
                  Use the form to create your first school.
                </p>
              </div>
            ) : (
              <ul className="mt-5 space-y-2">
                {schools.map((school) => (
                  <li key={school.id}>
                    <button
                      type="button"
                      onClick={() => selectSchool(school)}
                      className={`w-full rounded-xl border px-4 py-3 text-left transition ${selectedId === school.id ? 'border-indigo-400 bg-indigo-400/10' : 'border-slate-800 bg-slate-950 hover:border-slate-600'}`}
                    >
                      <span className="block font-medium">{school.name}</span>
                      <span className="mt-1 block text-xs text-slate-500">{school.slug}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form
            onSubmit={saveSchool}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
          >
            <h2 className="text-lg font-semibold">
              {selectedId ? 'Edit school' : 'Create school'}
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm text-slate-400">
                School name
                <input
                  required
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white"
                  placeholder="Example Academy"
                />
              </label>
              <label className="text-sm text-slate-400">
                Slug
                <input
                  required
                  name="slug"
                  pattern="[a-z0-9-]+"
                  value={form.slug}
                  onChange={updateField}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white"
                  placeholder="example-academy"
                />
              </label>
              <div className="sm:col-span-2">
                <label htmlFor="school-contact-email" className="text-sm text-slate-400">
                  Contact email
                </label>
                <input
                  id="school-contact-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={updateField}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white"
                  placeholder="admin@school.edu"
                />
                <span className="mt-2 block text-xs leading-5 text-slate-500">
                  The suggested Gmail address is not guaranteed to be available. Confirm or create
                  the address with Google before saving.
                </span>
              </div>
            </div>
            <a
              href="https://accounts.google.com/signup"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex text-sm font-semibold text-indigo-300 underline decoration-indigo-400/50 underline-offset-4 hover:text-indigo-200"
            >
              Open Google account creation
            </a>
            <button
              type="submit"
              disabled={saving}
              className="primary-button mt-6 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <LoaderCircle className="animate-spin" size={17} /> : <Save size={17} />}
              {saving ? 'Saving...' : selectedId ? 'Save changes' : 'Create school'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
