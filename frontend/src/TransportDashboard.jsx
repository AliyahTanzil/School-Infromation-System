import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from './api/auth.js';

const emptyVehicle = { vehicleNumber: '', registrationNumber: '', type: '', capacity: 1 };
const emptyDriver = { name: '', phone: '', licenseNumber: '' };
const emptyRoute = { code: '', name: '', stops: '' };

export default function TransportDashboard() {
  const [schoolId, setSchoolId] = useState(() => sessionStorage.getItem('schoolId') ?? '');
  const [overview, setOverview] = useState({
    vehicles: 0,
    drivers: 0,
    routes: 0,
    upcomingTrips: 0,
    failedInspections: 0,
  });
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [trips, setTrips] = useState([]);
  const [vehicle, setVehicle] = useState(emptyVehicle);
  const [driver, setDriver] = useState(emptyDriver);
  const [route, setRoute] = useState(emptyRoute);
  const [trip, setTrip] = useState({ routeId: '', vehicleId: '', driverId: '', scheduledAt: '' });
  const [message, setMessage] = useState('');
  const headers = { 'x-school-id': schoolId };
  const load = useCallback(async () => {
    if (!schoolId) return;
    try {
      const [o, v, d, r, t] = await Promise.all([
        api.get('/transport/overview', { headers: { 'x-school-id': schoolId } }),
        api.get('/transport/vehicles', { headers: { 'x-school-id': schoolId } }),
        api.get('/transport/drivers', { headers: { 'x-school-id': schoolId } }),
        api.get('/transport/routes', { headers: { 'x-school-id': schoolId } }),
        api.get('/transport/trips', { headers: { 'x-school-id': schoolId } }),
      ]);
      setOverview(o.data.data);
      setVehicles(v.data.data ?? []);
      setDrivers(d.data.data ?? []);
      setRoutes(r.data.data ?? []);
      setTrips(t.data.data ?? []);
      setMessage('');
    } catch (error) {
      setMessage(error.response?.data?.error?.message || 'Unable to load transport data.');
    }
  }, [schoolId]);
  useEffect(() => void load(), [load]);
  const create = async (event, path, body, reset) => {
    event.preventDefault();
    try {
      await api.post(path, body, { headers });
      reset();
      setMessage('Transport record saved.');
      await load();
    } catch (error) {
      setMessage(error.response?.data?.error?.message || 'Unable to save transport record.');
    }
  };
  const status = async (id, value) => {
    try {
      await api.patch(`/transport/vehicles/${id}/status`, { status: value }, { headers });
      await load();
    } catch (error) {
      setMessage(error.response?.data?.error?.message || 'Unable to update vehicle.');
    }
  };
  const inspect = async (id) => {
    try {
      await api.post(
        `/transport/vehicles/${id}/inspections`,
        { passed: true, notes: 'Routine inspection completed' },
        { headers }
      );
      setMessage('Inspection recorded.');
      await load();
    } catch (error) {
      setMessage(error.response?.data?.error?.message || 'Unable to record inspection.');
    }
  };
  const routePayload = {
    code: route.code,
    name: route.name,
    stops: route.stops
      .split(',')
      .map((name, index) => ({ name: name.trim(), sequence: index + 1 }))
      .filter((row) => row.name),
  };
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-widest text-cyan-300">Module 23</p>
            <h1 className="text-4xl font-bold">Transport operations</h1>
            <p className="text-slate-400">Fleet, drivers, routes, trips, and safety checks.</p>
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
          <p role="status" className="mt-5 rounded-xl border border-cyan-700 p-3">
            {message}
          </p>
        )}
        <section className="mt-6 grid gap-4 sm:grid-cols-5">
          {Object.entries(overview).map(([key, value]) => (
            <article key={key} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-slate-400">{key}</p>
              <strong className="text-2xl">{value}</strong>
            </article>
          ))}
        </section>
        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <form
            className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-5"
            onSubmit={(event) =>
              create(event, '/transport/vehicles', vehicle, () => setVehicle(emptyVehicle))
            }
          >
            <h2 className="text-xl">Register vehicle</h2>
            {Object.keys(vehicle).map((key) => (
              <input
                key={key}
                required
                type={key === 'capacity' ? 'number' : 'text'}
                className="rounded bg-slate-800 p-3"
                placeholder={key}
                value={vehicle[key]}
                onChange={(event) => setVehicle({ ...vehicle, [key]: event.target.value })}
              />
            ))}
            <button disabled={!schoolId} className="rounded bg-cyan-700 p-3">
              Save vehicle
            </button>
          </form>
          <form
            className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-5"
            onSubmit={(event) =>
              create(event, '/transport/drivers', driver, () => setDriver(emptyDriver))
            }
          >
            <h2 className="text-xl">Register driver</h2>
            {Object.keys(driver).map((key) => (
              <input
                key={key}
                required={key !== 'phone'}
                className="rounded bg-slate-800 p-3"
                placeholder={key}
                value={driver[key]}
                onChange={(event) => setDriver({ ...driver, [key]: event.target.value })}
              />
            ))}
            <button disabled={!schoolId} className="rounded bg-cyan-700 p-3">
              Save driver
            </button>
          </form>
          <form
            className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-5"
            onSubmit={(event) =>
              create(event, '/transport/routes', routePayload, () => setRoute(emptyRoute))
            }
          >
            <h2 className="text-xl">Create route</h2>
            <input
              required
              className="rounded bg-slate-800 p-3"
              placeholder="Route code"
              value={route.code}
              onChange={(event) => setRoute({ ...route, code: event.target.value })}
            />
            <input
              required
              className="rounded bg-slate-800 p-3"
              placeholder="Route name"
              value={route.name}
              onChange={(event) => setRoute({ ...route, name: event.target.value })}
            />
            <input
              className="rounded bg-slate-800 p-3"
              placeholder="Stops, comma separated"
              value={route.stops}
              onChange={(event) => setRoute({ ...route, stops: event.target.value })}
            />
            <button disabled={!schoolId} className="rounded bg-cyan-700 p-3">
              Save route
            </button>
          </form>
        </section>
        <form
          className="mt-6 grid gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-5 md:grid-cols-5"
          onSubmit={(event) =>
            create(
              event,
              '/transport/trips',
              {
                ...trip,
                vehicleId: trip.vehicleId || undefined,
                driverId: trip.driverId || undefined,
              },
              () => setTrip({ routeId: '', vehicleId: '', driverId: '', scheduledAt: '' })
            )
          }
        >
          <h2 className="text-xl md:col-span-5">Schedule trip</h2>
          <select
            required
            className="rounded bg-slate-800 p-3"
            value={trip.routeId}
            onChange={(event) => setTrip({ ...trip, routeId: event.target.value })}
          >
            <option value="">Route</option>
            {routes.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
          </select>
          <select
            className="rounded bg-slate-800 p-3"
            value={trip.vehicleId}
            onChange={(event) => setTrip({ ...trip, vehicleId: event.target.value })}
          >
            <option value="">Vehicle</option>
            {vehicles
              .filter((row) => row.status === 'ACTIVE')
              .map((row) => (
                <option key={row.id} value={row.id}>
                  {row.vehicleNumber}
                </option>
              ))}
          </select>
          <select
            className="rounded bg-slate-800 p-3"
            value={trip.driverId}
            onChange={(event) => setTrip({ ...trip, driverId: event.target.value })}
          >
            <option value="">Driver</option>
            {drivers.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
          </select>
          <input
            required
            type="datetime-local"
            className="rounded bg-slate-800 p-3"
            value={trip.scheduledAt}
            onChange={(event) => setTrip({ ...trip, scheduledAt: event.target.value })}
          />
          <button className="rounded bg-cyan-700 p-3">Schedule</button>
        </form>
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-xl">Fleet</h2>
            {vehicles.map((row) => (
              <div
                key={row.id}
                className="mt-3 flex flex-wrap justify-between gap-2 border-t border-slate-800 pt-3"
              >
                <span>
                  <strong>
                    {row.vehicleNumber} · {row.registrationNumber}
                  </strong>
                  <small className="block text-slate-400">
                    {row.type} · capacity {row.capacity}
                  </small>
                </span>
                <div className="flex gap-2">
                  <select
                    className="rounded bg-slate-800 p-2"
                    value={row.status}
                    onChange={(event) => status(row.id, event.target.value)}
                  >
                    <option>ACTIVE</option>
                    <option>MAINTENANCE</option>
                    <option>INACTIVE</option>
                    <option>RETIRED</option>
                  </select>
                  <button onClick={() => inspect(row.id)} className="rounded bg-emerald-700 px-3">
                    Pass inspection
                  </button>
                </div>
              </div>
            ))}
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-xl">Trips</h2>
            {trips.map((row) => (
              <div key={row.id} className="mt-3 border-t border-slate-800 pt-3">
                <strong>{row.route.name}</strong>
                <p className="text-slate-400">
                  {new Date(row.scheduledAt).toLocaleString()} · {row.status}
                </p>
              </div>
            ))}
          </article>
        </section>
      </div>
    </main>
  );
}
