import { useMemo, useState } from 'react';
import api from './api/auth.js';
import {
  Activity,
  AlertTriangle,
  Bolt,
  Cloud,
  Cpu,
  Gauge,
  Lightbulb,
  Radio,
  RefreshCw,
  Send,
  Thermometer,
  Waves,
} from 'lucide-react';

const gateways = [
  ['North campus gateway', 'ONLINE', '18 devices', '12 sec ago'],
  ['Science block gateway', 'ONLINE', '12 devices', '21 sec ago'],
  ['Boarding gateway', 'DEGRADED', '8 devices', '4 min ago'],
];
const telemetry = [
  ['Average classroom temperature', '22.4°C', '+0.6°', Thermometer],
  ['Air quality index', '31 AQI', '-8%', Waves],
  ['Lighting occupancy', '74%', '+12%', Lightbulb],
  ['Water consumption', '18.2 m³', '-4%', Gauge],
];
const alerts = [
  ['Boarding gateway heartbeat delayed', 'WARNING', 'Last signal received 4 minutes ago'],
  ['Science Lab 2 air quality threshold', 'INFO', 'Ventilation rule activated'],
  ['Gym lighting schedule drift', 'CRITICAL', 'Manual review required before command'],
];

export default function IoTDashboard() {
  const [tab, setTab] = useState('overview');
  const [commandSent, setCommandSent] = useState(false);
  const [commandBusy, setCommandBusy] = useState(false);
  const [commandError, setCommandError] = useState('');
  const kpis = useMemo(
    () => [
      ['48', 'Registered devices', Cpu],
      ['42', 'Online now', Activity],
      ['6', 'Gateways', Radio],
      ['1,284 kWh', 'Energy today', Bolt],
    ],
    []
  );
  const sendCommand = async (command) => {
    setCommandBusy(true);
    setCommandError('');
    try {
      await api.post('/iot/commands', {
        commandKey: command,
        idempotencyKey: crypto.randomUUID(),
      });
      setCommandSent(true);
    } catch (error) {
      setCommandError(error.response?.data?.error?.message ?? 'Command could not be queued');
    } finally {
      setCommandBusy(false);
    }
  };

  return (
    <main className="module-page iot-page">
      <header className="module-hero">
        <div>
          <p className="eyebrow">
            <Cloud size={14} /> Smart school operations
          </p>
          <h1>IoT that keeps the campus in rhythm.</h1>
          <p>
            Monitor connected spaces, energy, classroom environments, and device trust from one
            operational surface.
          </p>
        </div>
        <button className="quiet-button" onClick={() => setCommandSent(false)}>
          <RefreshCw size={16} /> Refresh telemetry
        </button>
      </header>
      <nav className="module-tabs" aria-label="IoT sections">
        {[
          'overview',
          'devices',
          'energy & environment',
          'smart classroom',
          'commands',
          'rules & alerts',
        ].map((item) => (
          <button className={tab === item ? 'active' : ''} onClick={() => setTab(item)} key={item}>
            {item}
          </button>
        ))}
      </nav>
      <section className="iot-kpis">
        {kpis.map(([value, label, Icon]) => (
          <article className="iot-kpi" key={label}>
            <Icon size={18} />
            <strong>{value}</strong>
            <span>{label}</span>
          </article>
        ))}
      </section>
      <section className="iot-grid">
        <article className="iot-panel wide">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Live fleet</p>
              <h2>Gateway health</h2>
            </div>
            <span className="live-pill">
              <span /> Live
            </span>
          </div>
          {gateways.map(([name, status, count, seen]) => (
            <div className="gateway-row" key={name}>
              <span className={`status-dot ${status.toLowerCase()}`} />
              <div>
                <strong>{name}</strong>
                <small>{count}</small>
              </div>
              <span className="gateway-status">{status}</span>
              <small>{seen}</small>
            </div>
          ))}
        </article>
        <article className="iot-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Signals</p>
              <h2>Campus telemetry</h2>
            </div>
          </div>
          {telemetry.map(([label, value, trend, Icon]) => (
            <div className="telemetry-row" key={label}>
              <Icon size={18} />
              <div>
                <small>{label}</small>
                <strong>{value}</strong>
              </div>
              <span>{trend}</span>
            </div>
          ))}
        </article>
      </section>
      <section className="iot-grid">
        <article className="iot-panel wide">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Control plane</p>
              <h2>Safe command center</h2>
            </div>
            <span className="permission-note">Allowlisted commands only</span>
          </div>
          <p className="panel-copy">
            Send a reviewed scene or environmental command to a trusted device. Every command is
            idempotent and audited.
          </p>
          <div className="command-actions">
            {['LIGHTS_ON', 'LIGHTS_OFF', 'VENTILATION_ON', 'SCENE_APPLY'].map((command) => (
              <button key={command} disabled={commandBusy} onClick={() => sendCommand(command)}>
                <Send size={15} /> {command.replaceAll('_', ' ')}
              </button>
            ))}
          </div>
          {commandError && <p className="command-error">{commandError}</p>}
          {commandSent && (
            <p className="command-confirm">
              <span /> Command queued for review and audit.
            </p>
          )}
        </article>
        <article className="iot-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Attention</p>
              <h2>Active alerts</h2>
            </div>
            <AlertTriangle size={18} />
          </div>
          {alerts.map(([title, severity, detail]) => (
            <div className="alert-row" key={title}>
              <span className={`severity ${severity.toLowerCase()}`}>{severity}</span>
              <strong>{title}</strong>
              <small>{detail}</small>
            </div>
          ))}
        </article>
      </section>
      <footer className="module-footnote">
        <span>Showing {tab} view</span>
        <span>Last sync 12 seconds ago</span>
      </footer>
    </main>
  );
}
