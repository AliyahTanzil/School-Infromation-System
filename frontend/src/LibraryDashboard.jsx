import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookCopy,
  BookOpen,
  CalendarClock,
  CircleDollarSign,
  LibraryBig,
  Search,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const books = [
  {
    title: 'Introduction to Physics',
    author: 'A. Mensah',
    code: 'PHY-0001',
    status: 'Available',
    category: 'Science',
  },
  {
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    code: 'LIT-0012',
    status: 'Borrowed',
    category: 'Literature',
  },
  {
    title: 'Modern African History',
    author: 'K. Owusu',
    code: 'HIS-0048',
    status: 'Reserved',
    category: 'History',
  },
  {
    title: 'Discrete Mathematics',
    author: 'R. Graham',
    code: 'MAT-0021',
    status: 'Available',
    category: 'Mathematics',
  },
];

const modules = [
  'Catalog',
  'Physical inventory',
  'Members',
  'Circulation',
  'Reservations',
  'Fines & penalties',
  'Digital library',
  'Inventory audits',
  'Reports',
];

export default function LibraryDashboard() {
  const [query, setQuery] = useState('');
  const filtered = useMemo(
    () =>
      books.filter((book) =>
        `${book.title} ${book.author} ${book.code}`.toLowerCase().includes(query.toLowerCase())
      ),
    [query]
  );
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 border-b border-slate-800 pb-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/admin-demo"
              className="rounded-lg border border-slate-700 p-2 text-slate-400 hover:text-white"
              aria-label="Back to Demo"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
                Module 21
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">Library management</h1>
              <p className="mt-2 text-sm text-slate-400">
                Catalog, physical copies, circulation, digital resources, and reports.
              </p>
            </div>
          </div>
          <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-xs font-semibold text-amber-200">
            Demo data · Safe to explore
          </span>
        </header>
        <section
          className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          aria-label="Library overview"
        >
          {[
            ['1,284', 'Catalog titles', BookOpen],
            ['2,906', 'Physical copies', BookCopy],
            ['438', 'Active members', Users],
            ['27', 'Overdue loans', CalendarClock],
          ].map(([value, label, Icon]) => (
            <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-semibold text-white">{value}</span>
                <Icon className="text-indigo-300" size={20} />
              </div>
              <p className="mt-2 text-sm text-slate-400">{label}</p>
            </div>
          ))}
        </section>
        <section className="mt-8 grid gap-4 md:grid-cols-3" aria-label="Library areas">
          {modules.map((module, index) => (
            <div
              key={module}
              className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3"
            >
              <p className="text-sm font-medium text-slate-200">{module}</p>
              <p className="mt-1 text-xs text-slate-500">
                {index < 4 ? 'Available in Demo' : 'Configured workspace'}
              </p>
            </div>
          ))}
        </section>
        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Book catalog</h2>
              <p className="mt-1 text-sm text-slate-400">
                Search intellectual works separately from the physical copies that circulate.
              </p>
            </div>
            <label className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-400">
              <Search size={16} />
              <span className="sr-only">Search catalog</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search titles, authors, barcodes"
                className="w-full bg-transparent text-slate-100 outline-none placeholder:text-slate-600 md:w-64"
              />
            </label>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-3">Title</th>
                  <th className="px-3 py-3">Author</th>
                  <th className="px-3 py-3">Copy barcode</th>
                  <th className="px-3 py-3">Category</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((book) => (
                  <tr key={book.code} className="border-b border-slate-800/70">
                    <td className="px-3 py-4 font-medium text-slate-200">{book.title}</td>
                    <td className="px-3 py-4 text-slate-400">{book.author}</td>
                    <td className="px-3 py-4 font-mono text-xs text-indigo-300">{book.code}</td>
                    <td className="px-3 py-4 text-slate-400">{book.category}</td>
                    <td className="px-3 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${book.status === 'Available' ? 'bg-emerald-300/10 text-emerald-300' : book.status === 'Borrowed' ? 'bg-amber-300/10 text-amber-200' : 'bg-indigo-300/10 text-indigo-200'}`}
                      >
                        {book.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <LibraryBig className="text-indigo-300" size={20} />
            <h2 className="mt-4 font-semibold">Circulation desk</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Borrow, return, renew, and reserve copy-level inventory with due-date controls.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <CircleDollarSign className="text-indigo-300" size={20} />
            <h2 className="mt-4 font-semibold">Penalties</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Track overdue fines, payments, lost items, damage reports, and waivers.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <BookOpen className="text-indigo-300" size={20} />
            <h2 className="mt-4 font-semibold">Digital library</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Manage e-books and resource access rules without mixing them with physical stock.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
