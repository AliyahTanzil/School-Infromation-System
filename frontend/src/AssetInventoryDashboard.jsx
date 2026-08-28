import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from './api/auth.js';

const emptyAsset = { assetNumber: '', name: '', serialNumber: '', category: '', location: '' };
const emptyItem = { sku: '', name: '', category: '', quantity: 0, reorderLevel: 0 };

export default function AssetInventoryDashboard() {
  const [schoolId, setSchoolId] = useState(() => sessionStorage.getItem('schoolId') ?? '');
  const [overview, setOverview] = useState({ assets: 0, inventory: 0, lowStock: 0 });
  const [assets, setAssets] = useState([]);
  const [items, setItems] = useState([]);
  const [asset, setAsset] = useState(emptyAsset);
  const [item, setItem] = useState(emptyItem);
  const [movement, setMovement] = useState({
    itemId: '',
    type: 'RECEIPT',
    quantity: 1,
    reference: '',
  });
  const [message, setMessage] = useState('');
  const headers = { 'x-school-id': schoolId };

  const load = useCallback(async () => {
    if (!schoolId) return;
    try {
      const [summary, assetRows, inventoryRows] = await Promise.all([
        api.get('/assets-inventory/overview', { headers: { 'x-school-id': schoolId } }),
        api.get('/assets-inventory/assets', { headers: { 'x-school-id': schoolId } }),
        api.get('/assets-inventory/inventory', { headers: { 'x-school-id': schoolId } }),
      ]);
      setOverview(summary.data.data);
      setAssets(assetRows.data.data ?? []);
      setItems(inventoryRows.data.data ?? []);
      setMessage('');
    } catch (error) {
      setMessage(error.response?.data?.error?.message || 'Unable to load assets and inventory.');
    }
  }, [schoolId]);
  useEffect(() => void load(), [load]);

  const create = async (event, path, body, reset) => {
    event.preventDefault();
    try {
      await api.post(path, body, { headers });
      reset();
      setMessage('Record saved.');
      await load();
    } catch (error) {
      setMessage(error.response?.data?.error?.message || 'Unable to save record.');
    }
  };
  const changeStatus = async (id, status) => {
    try {
      await api.patch(`/assets-inventory/assets/${id}/status`, { status }, { headers });
      await load();
    } catch (error) {
      setMessage(error.response?.data?.error?.message || 'Unable to change asset status.');
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-widest text-indigo-300">Module 22</p>
            <h1 className="text-4xl font-bold">Assets & inventory</h1>
            <p className="text-slate-400">Serialized property and quantity-controlled stock.</p>
          </div>
          <Link to="/admin" className="rounded-xl border border-slate-700 px-4 py-2">
            ← Back to administration
          </Link>
        </header>
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <label>
            School context{' '}
            <input
              className="ml-3 rounded bg-slate-800 p-2"
              placeholder="School UUID"
              value={schoolId}
              onChange={(event) => {
                const value = event.target.value.trim();
                setSchoolId(value);
                sessionStorage.setItem('schoolId', value);
              }}
            />
          </label>
        </section>
        {message && (
          <p role="status" className="mt-5 rounded-xl border border-indigo-700 p-3">
            {message}
          </p>
        )}
        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          {Object.entries(overview).map(([key, value]) => (
            <article key={key} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-slate-400">{key}</p>
              <strong className="text-3xl">{value}</strong>
            </article>
          ))}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <form
            className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-5"
            onSubmit={(event) =>
              create(event, '/assets-inventory/assets', asset, () => setAsset(emptyAsset))
            }
          >
            <h2 className="text-xl">Register asset</h2>
            {Object.keys(asset).map((key) => (
              <input
                key={key}
                required={key === 'assetNumber' || key === 'name'}
                className="rounded bg-slate-800 p-3"
                placeholder={key}
                value={asset[key]}
                onChange={(event) => setAsset({ ...asset, [key]: event.target.value })}
              />
            ))}
            <button disabled={!schoolId} className="rounded bg-indigo-600 p-3">
              Save asset
            </button>
          </form>
          <form
            className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-5"
            onSubmit={(event) =>
              create(event, '/assets-inventory/inventory', item, () => setItem(emptyItem))
            }
          >
            <h2 className="text-xl">Create inventory item</h2>
            {Object.keys(item).map((key) => (
              <input
                key={key}
                required={key === 'sku' || key === 'name'}
                type={key === 'quantity' || key === 'reorderLevel' ? 'number' : 'text'}
                className="rounded bg-slate-800 p-3"
                placeholder={key}
                value={item[key]}
                onChange={(event) => setItem({ ...item, [key]: event.target.value })}
              />
            ))}
            <button disabled={!schoolId} className="rounded bg-indigo-600 p-3">
              Save item
            </button>
          </form>
          <form
            className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-5"
            onSubmit={(event) =>
              create(
                event,
                `/assets-inventory/inventory/${movement.itemId}/movements`,
                { type: movement.type, quantity: movement.quantity, reference: movement.reference },
                () => setMovement({ itemId: '', type: 'RECEIPT', quantity: 1, reference: '' })
              )
            }
          >
            <h2 className="text-xl">Stock movement</h2>
            <select
              required
              className="rounded bg-slate-800 p-3"
              value={movement.itemId}
              onChange={(event) => setMovement({ ...movement, itemId: event.target.value })}
            >
              <option value="">Select item</option>
              {items.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name} ({row.quantity})
                </option>
              ))}
            </select>
            <select
              className="rounded bg-slate-800 p-3"
              value={movement.type}
              onChange={(event) => setMovement({ ...movement, type: event.target.value })}
            >
              <option>RECEIPT</option>
              <option>ISSUE</option>
            </select>
            <input
              required
              min="1"
              type="number"
              className="rounded bg-slate-800 p-3"
              value={movement.quantity}
              onChange={(event) => setMovement({ ...movement, quantity: event.target.value })}
            />
            <input
              className="rounded bg-slate-800 p-3"
              placeholder="Reference"
              value={movement.reference}
              onChange={(event) => setMovement({ ...movement, reference: event.target.value })}
            />
            <button disabled={!movement.itemId} className="rounded bg-indigo-600 p-3">
              Post movement
            </button>
          </form>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-xl">Serialized assets</h2>
            {assets.map((row) => (
              <div
                key={row.id}
                className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3"
              >
                <span>
                  <strong>
                    {row.assetNumber} · {row.name}
                  </strong>
                  <small className="block text-slate-400">
                    {row.location || 'No location'} · {row.status}
                  </small>
                </span>
                <select
                  value={row.status}
                  onChange={(event) => changeStatus(row.id, event.target.value)}
                  className="rounded bg-slate-800 p-2"
                >
                  <option>ACTIVE</option>
                  <option>ASSIGNED</option>
                  <option>MAINTENANCE</option>
                  <option>DISPOSED</option>
                </select>
              </div>
            ))}
            {!assets.length && <p className="mt-3 text-slate-500">No assets registered.</p>}
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-xl">Inventory balances</h2>
            {items.map((row) => (
              <div key={row.id} className="mt-3 border-t border-slate-800 pt-3">
                <strong>
                  {row.sku} · {row.name}
                </strong>
                <p
                  className={row.quantity <= row.reorderLevel ? 'text-amber-300' : 'text-slate-400'}
                >
                  {row.quantity} available · reorder at {row.reorderLevel}
                </p>
              </div>
            ))}
            {!items.length && <p className="mt-3 text-slate-500">No inventory items.</p>}
          </article>
        </section>
      </div>
    </main>
  );
}
