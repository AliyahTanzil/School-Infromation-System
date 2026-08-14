import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Boxes,
  ClipboardList,
  Hammer,
  PackageCheck,
  Search,
  Warehouse,
  Wrench,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const assets = [
  ['LT-00045', 'Dell Latitude 5440', 'Computers', 'Assigned', 'Science Department'],
  ['VH-00008', 'Toyota Hiace', 'Vehicles', 'Active', 'Transport yard'],
  ['LAB-00112', 'Digital microscope', 'Laboratory', 'Maintenance', 'Biology lab'],
  ['FN-00321', 'Staff conference table', 'Furniture', 'Active', 'Admin block'],
];
const inventory = [
  ['INV-0001', 'A4 Paper', 'Stationery', '1,240 reams', 'Healthy'],
  ['INV-0014', 'Latex gloves', 'Laboratory supplies', '84 boxes', 'Reorder'],
  ['INV-0032', 'Floor cleaner', 'Cleaning materials', '36 bottles', 'Healthy'],
  ['INV-0041', 'School uniform fabric', 'Uniforms', '12 rolls', 'Reorder'],
];

export default function AssetInventoryDashboard() {
  const [query, setQuery] = useState('');
  const filteredAssets = useMemo(
    () => assets.filter((row) => row.join(' ').toLowerCase().includes(query.toLowerCase())),
    [query]
  );
  const filteredInventory = useMemo(
    () => inventory.filter((row) => row.join(' ').toLowerCase().includes(query.toLowerCase())),
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
                Module 22
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">Assets & inventory</h1>
              <p className="mt-2 text-sm text-slate-400">
                Serialized school property and stock-controlled goods in separate lifecycles.
              </p>
            </div>
          </div>
          <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-xs font-semibold text-amber-200">
            Demo data · Safe to explore
          </span>
        </header>
        <section
          className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          aria-label="Assets and inventory overview"
        >
          {[
            ['2,418', 'Tracked assets', Boxes],
            ['14', 'Open maintenance jobs', Wrench],
            ['386', 'Inventory items', PackageCheck],
            ['6', 'Low-stock alerts', ClipboardList],
          ].map(([value, label, Icon]) => (
            <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-semibold">{value}</span>
                <Icon className="text-indigo-300" size={20} />
              </div>
              <p className="mt-2 text-sm text-slate-400">{label}</p>
            </div>
          ))}
        </section>
        <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2 text-xs text-slate-400">
            <span className="rounded-full bg-indigo-300/10 px-3 py-1 text-indigo-200">
              Asset lifecycle
            </span>
            <span className="rounded-full bg-emerald-300/10 px-3 py-1 text-emerald-200">
              Inventory lifecycle
            </span>
            <span className="rounded-full bg-slate-800 px-3 py-1">Audit ready</span>
          </div>
          <label className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-400">
            <Search size={16} />
            <span className="sr-only">Search assets and inventory</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search assets, SKUs, locations"
              className="w-full bg-transparent text-slate-100 outline-none placeholder:text-slate-600 md:w-64"
            />
          </label>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Serialized assets</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Every item has identity, location, assignment, and audit history.
                </p>
              </div>
              <Boxes className="text-indigo-300" size={22} />
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3 py-3">Tag</th>
                    <th className="px-3 py-3">Asset</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map(([tag, name, category, status, location]) => (
                    <tr key={tag} className="border-b border-slate-800/70">
                      <td className="px-3 py-4 font-mono text-xs text-indigo-300">{tag}</td>
                      <td className="px-3 py-4">
                        <p className="font-medium text-slate-200">{name}</p>
                        <p className="text-xs text-slate-500">{category}</p>
                      </td>
                      <td className="px-3 py-4 text-slate-300">{status}</td>
                      <td className="px-3 py-4 text-slate-400">{location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Inventory stock</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Receipts, issues, transfers, adjustments, and reorder signals.
                </p>
              </div>
              <Warehouse className="text-emerald-300" size={22} />
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3 py-3">SKU</th>
                    <th className="px-3 py-3">Item</th>
                    <th className="px-3 py-3">Balance</th>
                    <th className="px-3 py-3">Alert</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map(([sku, name, category, balance, alert]) => (
                    <tr key={sku} className="border-b border-slate-800/70">
                      <td className="px-3 py-4 font-mono text-xs text-emerald-300">{sku}</td>
                      <td className="px-3 py-4">
                        <p className="font-medium text-slate-200">{name}</p>
                        <p className="text-xs text-slate-500">{category}</p>
                      </td>
                      <td className="px-3 py-4 text-slate-300">{balance}</td>
                      <td
                        className={`px-3 py-4 ${alert === 'Reorder' ? 'text-amber-200' : 'text-emerald-300'}`}
                      >
                        {alert}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <Hammer className="text-amber-300" size={20} />
            <h2 className="mt-4 font-semibold">Lifecycle controls</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Assignments, transfers, maintenance, depreciation, disposal, and audit trails preserve
              asset history.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <Warehouse className="text-emerald-300" size={20} />
            <h2 className="mt-4 font-semibold">Stock operations</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Warehouses, suppliers, purchasing, receiving, batches, issues, returns, and
              adjustments remain stock-aware.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <ClipboardList className="text-indigo-300" size={20} />
            <h2 className="mt-4 font-semibold">Control boundary</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Serialized assets never share the ordinary inventory quantity model. Every query is
              school-scoped.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
