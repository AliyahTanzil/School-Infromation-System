import { useMemo, useState } from 'react';

const sections = ['Overview', 'Branches', 'Departments', 'Grade levels', 'Administrators'];
const seed = [{ name: 'Main Campus', code: 'MAIN', status: 'Active' }];

export default function SchoolAdmin() {
  const [active, setActive] = useState('Overview');
  const [schools, setSchools] = useState(seed);
  const [name, setName] = useState('Main Campus');
  const [slug, setSlug] = useState('main-campus');
  const [email, setEmail] = useState('admin@school.edu');
  const [notice, setNotice] = useState('');
  const [items, setItems] = useState({
    Branches: [],
    Departments: [],
    'Grade levels': [],
    Administrators: [],
  });
  const [newItem, setNewItem] = useState('');
  const stats = useMemo(
    () => [
      { label: 'Branches', value: items.Branches.length || '1' },
      { label: 'Departments', value: items.Departments.length || '8' },
      { label: 'Grade levels', value: items['Grade levels'].length || '12' },
      { label: 'Administrators', value: items.Administrators.length || '3' },
    ],
    [items]
  );

  function saveChanges(event) {
    event.preventDefault();
    if (!name.trim() || !slug.trim() || !email.trim())
      return setNotice('School name, slug, and contact email are required.');
    setSchools((current) =>
      current.map((school, index) =>
        index === 0
          ? {
              ...school,
              name: name.trim(),
              code: slug
                .trim()
                .toUpperCase()
                .replace(/[^A-Z0-9-]/g, '-'),
            }
          : school
      )
    );
    setNotice('School profile saved successfully.');
  }

  function addSchool(event) {
    event.preventDefault();
    if (!name.trim()) return setNotice('Enter a school name first.');
    const code = `SCH-${schools.length + 1}`;
    setSchools((current) => [...current, { name: name.trim(), code, status: 'Draft' }]);
    setNotice(`${name.trim()} was added as a draft school.`);
    setName('');
  }

  function addItem(event) {
    event.preventDefault();
    if (!newItem.trim())
      return setNotice(`Enter a ${active.toLowerCase().replace(/s$/, '')} name first.`);
    setItems((current) => ({ ...current, [active]: [...current[active], newItem.trim()] }));
    setNotice(`${newItem.trim()} was added to ${active}.`);
    setNewItem('');
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-slate-100 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-300">
              SAIS / School setup
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Your school workspace</h1>
            <p className="mt-2 text-sm text-slate-400">
              Configure the structure your staff and students will use.
            </p>
          </div>
          <button
            onClick={saveChanges}
            className="rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-400"
          >
            Save changes
          </button>
        </header>
        {notice && (
          <div
            role="status"
            className="mt-5 rounded-xl border border-indigo-400/30 bg-indigo-400/10 px-4 py-3 text-sm text-indigo-100"
          >
            {notice}
          </div>
        )}
        <div className="mt-8 flex gap-2 overflow-x-auto border-b border-slate-800">
          {sections.map((item) => (
            <button
              key={item}
              onClick={() => {
                setActive(item);
                setNotice('');
              }}
              className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm ${active === item ? 'border-indigo-400 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
              {item}
            </button>
          ))}
        </div>
        {active === 'Overview' ? (
          <>
            <section className="grid gap-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
                >
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="mt-3 text-3xl font-semibold">{stat.value}</p>
                </div>
              ))}
            </section>
            <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <form
                onSubmit={saveChanges}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
              >
                <h2 className="text-lg font-semibold">School profile</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm text-slate-400">
                    School name
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white"
                    />
                  </label>
                  <label className="text-sm text-slate-400">
                    Slug
                    <input
                      value={slug}
                      onChange={(event) => setSlug(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white"
                    />
                  </label>
                  <label className="text-sm text-slate-400 sm:col-span-2">
                    Contact email
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white"
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  className="mt-5 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-950"
                >
                  Save profile
                </button>
              </form>
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <h2 className="text-lg font-semibold">Add school</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Create a school workspace for this tenant.
                </p>
                <form onSubmit={addSchool} className="mt-5 flex gap-2">
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="School name"
                    className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-950"
                  >
                    Add
                  </button>
                </form>
                <ul className="mt-5 flex flex-col gap-2">
                  {schools.map((school) => (
                    <li
                      key={school.code}
                      className="flex items-center justify-between rounded-xl bg-slate-950 px-3 py-3 text-sm"
                    >
                      <span>
                        {school.name}
                        <span className="ml-2 text-xs text-slate-500">{school.code}</span>
                      </span>
                      <span className="text-xs text-emerald-300">{school.status}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </>
        ) : (
          <section className="py-8">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
              <h2 className="text-xl font-semibold">{active}</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                Manage {active.toLowerCase()} for your school. Changes are permission-aware and
                protected by the school-management API.
              </p>
              <form onSubmit={addItem} className="mt-6 flex max-w-xl gap-2">
                <input
                  value={newItem}
                  onChange={(event) => setNewItem(event.target.value)}
                  placeholder={`Add ${active.toLowerCase().replace(/s$/, '')}`}
                  className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold"
                >
                  Add {active.slice(0, -1)}
                </button>
              </form>
              {items[active].length > 0 && (
                <ul className="mt-6 flex flex-col gap-2">
                  {items[active].map((item) => (
                    <li key={item} className="rounded-xl bg-slate-950 px-4 py-3 text-sm">
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
