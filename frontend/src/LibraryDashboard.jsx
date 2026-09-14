import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from './api/auth.js';
import { getApiErrorMessage } from './api/errorMessage.js';
import { useSchoolContext } from './hooks/useSchoolContext.js';
import { WorkspaceLoading, WorkspaceEmpty, WorkspaceError } from './components/WorkspaceStates.jsx';
export default function LibraryDashboard() {
  const {
    schoolId,
    loading: schoolLoading,
    error: schoolError,
    retry: retrySchool,
  } = useSchoolContext();
  const [libraryId, setLibraryId] = useState('');
  const [overview, setOverview] = useState(null);
  const [books, setBooks] = useState([]);
  const [loans, setLoans] = useState([]);
  const [message, setMessage] = useState('');
  const [book, setBook] = useState({ title: '', author: '', isbn: '', category: '' });
  const [loan, setLoan] = useState({ copyId: '', borrowerId: '', dueAt: '' });
  const load = useCallback(async () => {
    if (!schoolId || !libraryId) return;
    try {
      const [o, b, l] = await Promise.all([
        api.get(`/libraries/${libraryId}/overview`),
        api.get(`/libraries/${libraryId}/books`),
        api.get(`/libraries/${libraryId}/loans`),
      ]);
      setOverview(o.data.data);
      setBooks(b.data.data ?? []);
      setLoans(l.data.data ?? []);
    } catch (error) {
      setMessage(getApiErrorMessage(error, 'Unable to load library.'));
    }
  }, [schoolId, libraryId]);
  useEffect(() => void load(), [load]);
  const createLibrary = async () => {
    try {
      const { data } = await api.post('/libraries', { name: 'School Library' });
      setLibraryId(data.data.id);
      setMessage('Library created.');
    } catch (error) {
      setMessage(getApiErrorMessage(error, 'Unable to create library.'));
    }
  };
  const submit = async (event, path, body, reset) => {
    event.preventDefault();
    try {
      await api.post(path, body);
      reset();
      await load();
    } catch (error) {
      setMessage(getApiErrorMessage(error, 'Unable to save record.'));
    }
  };
  const addCopy = async (bookId) => {
    const barcode = window.prompt('Enter the physical copy barcode');
    if (!barcode) return;
    try {
      await api.post(`/libraries/${libraryId}/books/${bookId}/copies`, { barcode });
      await load();
    } catch (error) {
      setMessage(getApiErrorMessage(error, 'Unable to add copy.'));
    }
  };
  if (schoolLoading) return <WorkspaceLoading message="Loading school details" />;
  if (schoolError) return <WorkspaceError message={schoolError} onRetry={retrySchool} />;
  if (!schoolId)
    return (
      <WorkspaceEmpty
        title="School setup required"
        message="Complete school setup before using this workspace."
      />
    );

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <header className="flex justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-widest text-indigo-300">Module 21</p>
            <h1 className="text-4xl font-bold">Library management</h1>
            <p className="text-slate-400">Catalog and copy-level circulation.</p>
          </div>
          <Link to="/admin" className="rounded-xl border border-slate-700 px-4 py-2">
            ← Back to administration
          </Link>
        </header>
        {message && (
          <p role="status" className="mt-5 rounded-xl border border-indigo-700 p-3">
            {message}
          </p>
        )}
        <section className="mt-6 flex flex-wrap gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <input
            className="rounded bg-slate-800 p-2"
            placeholder="Library UUID"
            value={libraryId}
            onChange={(e) => setLibraryId(e.target.value.trim())}
          />
          <button
            disabled={!schoolId}
            onClick={createLibrary}
            className="rounded bg-indigo-600 px-4"
          >
            Create school library
          </button>
        </section>
        <section className="mt-6 grid gap-4 sm:grid-cols-5">
          {Object.entries(overview?.stats ?? {}).map(([key, value]) => (
            <article key={key} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-slate-400">{key}</p>
              <strong className="text-2xl">{value}</strong>
            </article>
          ))}
        </section>
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <form
            className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-5"
            onSubmit={(e) =>
              submit(e, `/libraries/${libraryId}/books`, book, () =>
                setBook({ title: '', author: '', isbn: '', category: '' })
              )
            }
          >
            <h2 className="text-xl">Add catalog title</h2>
            {Object.keys(book).map((key) => (
              <input
                key={key}
                required={key === 'title' || key === 'author'}
                className="rounded bg-slate-800 p-3"
                placeholder={key}
                value={book[key]}
                onChange={(e) => setBook({ ...book, [key]: e.target.value })}
              />
            ))}
            <button disabled={!libraryId} className="rounded bg-indigo-600 p-3">
              Add book
            </button>
          </form>
          <form
            className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-5"
            onSubmit={(e) =>
              submit(e, `/libraries/${libraryId}/loans`, loan, () =>
                setLoan({ copyId: '', borrowerId: '', dueAt: '' })
              )
            }
          >
            <h2 className="text-xl">Borrow a copy</h2>
            <select
              required
              className="rounded bg-slate-800 p-3"
              value={loan.copyId}
              onChange={(e) => setLoan({ ...loan, copyId: e.target.value })}
            >
              <option value="">Available copy</option>
              {books.flatMap((item) =>
                item.copies
                  .filter((copy) => copy.status === 'AVAILABLE')
                  .map((copy) => (
                    <option key={copy.id} value={copy.id}>
                      {item.title} · {copy.barcode}
                    </option>
                  ))
              )}
            </select>
            <input
              required
              className="rounded bg-slate-800 p-3"
              placeholder="Borrower user UUID"
              value={loan.borrowerId}
              onChange={(e) => setLoan({ ...loan, borrowerId: e.target.value })}
            />
            <input
              required
              type="date"
              className="rounded bg-slate-800 p-3"
              value={loan.dueAt}
              onChange={(e) => setLoan({ ...loan, dueAt: e.target.value })}
            />
            <button disabled={!libraryId} className="rounded bg-indigo-600 p-3">
              Borrow
            </button>
          </form>
        </section>
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-xl">Catalog</h2>
            <div className="data-record-grid">
              {books.map((item) => (
                <div key={item.id} className="mt-3 border-t border-slate-800 pt-3">
                  <strong>{item.title}</strong>
                  <p className="text-slate-400">
                    {item.author} · {item.copies.length} copies
                  </p>
                  <button
                    onClick={() => addCopy(item.id)}
                    className="mt-2 rounded bg-slate-700 px-3 py-1"
                  >
                    Add copy
                  </button>
                </div>
              ))}
            </div>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-xl">Loans</h2>
            <div className="data-record-grid">
              {loans.map((item) => (
                <div
                  key={item.id}
                  className="mt-3 flex justify-between border-t border-slate-800 pt-3"
                >
                  <span>
                    {item.copy.book.title} · {item.status}
                  </span>
                  {item.status === 'BORROWED' && (
                    <button
                      onClick={() =>
                        submit(
                          { preventDefault() {} },
                          `/libraries/${libraryId}/loans/${item.id}/return`,
                          {},
                          () => {}
                        )
                      }
                      className="rounded bg-emerald-700 px-3"
                    >
                      Return
                    </button>
                  )}
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
