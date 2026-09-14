import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ShieldCheck } from 'lucide-react';
import api from './api/auth.js';
import { getApiErrorMessage } from './api/errorMessage.js';

const defaults = {
  host: '',
  port: 587,
  secure: false,
  user: '',
  password: '',
  from: '',
  frontendUrl: window.location.origin,
};

export default function EmailSetup() {
  const [form, setForm] = useState(defaults);
  const [saved, setSaved] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api
      .get('/settings/email')
      .then(({ data }) => {
        if (!active) return;
        const settings = data.data;
        setSaved(settings);
        setForm({
          host: settings.host || '',
          port: settings.port || 587,
          secure: Boolean(settings.secure),
          user: settings.user || '',
          password: '',
          from: settings.from?.includes('@sais.local') ? '' : settings.from || '',
          frontendUrl: settings.frontendUrl || window.location.origin,
        });
      })
      .catch((reason) => {
        if (active) setError(getApiErrorMessage(reason, 'Unable to load email settings.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setMessage('');
  };
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const { data } = await api.put('/settings/email', form);
      setSaved(data.data);
      setForm((current) => ({ ...current, password: '' }));
      setMessage(
        'Connection verified and settings saved. New recovery and verification emails now use this server.'
      );
    } catch (reason) {
      setError(
        getApiErrorMessage(
          reason,
          'Unable to verify and save email settings. Previous settings remain active.'
        )
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link to="/admin" className="text-sm font-semibold text-blue-700">
          Back to administration
        </Link>
        <header className="flex items-start gap-4">
          <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
            <Mail size={26} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Email setup</h1>
            <p className="mt-2 text-slate-600">
              Connect your school email provider for password recovery and account verification.
            </p>
          </div>
        </header>
        {loading ? (
          <p role="status">Loading email settings…</p>
        ) : (
          <>
            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"
              >
                {error}
              </p>
            )}
            {!saved ? (
              <button className="primary-button" onClick={() => setAttempt((value) => value + 1)}>
                Retry loading settings
              </button>
            ) : (
              <>
                <section className="rounded-2xl border border-slate-200 bg-white p-5">
                  <strong>
                    {saved.source === 'database'
                      ? 'Saved email server'
                      : saved.configured
                        ? 'Using server environment settings'
                        : 'Email delivery is not configured'}
                  </strong>
                  <p className="mt-1 text-sm text-slate-600">
                    {saved.configured
                      ? `${saved.host} · Port ${saved.port}`
                      : 'Enter the SMTP details supplied by your email provider below.'}
                  </p>
                </section>
                <form
                  onSubmit={submit}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <fieldset disabled={busy} className="space-y-5">
                    <legend className="mb-5 text-lg font-semibold">Mail server connection</legend>
                    <label className="form-field">
                      <span className="form-field__label">SMTP server</span>
                      <input
                        className="form-input"
                        required
                        maxLength={253}
                        placeholder="smtp.your-provider.com"
                        value={form.host}
                        onChange={(e) => update('host', e.target.value)}
                        autoComplete="off"
                      />
                    </label>
                    <label className="form-field">
                      <span id="smtp-security-label" className="form-field__label">
                        Connection security and port
                      </span>
                      <select
                        aria-labelledby="smtp-security-label"
                        className="form-input"
                        value={form.secure ? '465' : '587'}
                        onChange={(e) => {
                          const port = Number(e.target.value);
                          setForm((current) => ({ ...current, port, secure: port === 465 }));
                          setMessage('');
                        }}
                      >
                        <option value="587">STARTTLS · Port 587</option>
                        <option value="465">TLS · Port 465</option>
                      </select>
                      <span className="text-sm text-slate-500">
                        Both options encrypt your connection. Use the option specified by your
                        provider.
                      </span>
                    </label>
                    <label className="form-field">
                      <span className="form-field__label">SMTP username</span>
                      <input
                        className="form-input"
                        required
                        maxLength={320}
                        value={form.user}
                        onChange={(e) => update('user', e.target.value)}
                        autoComplete="off"
                      />
                    </label>
                    <label className="form-field">
                      <span id="smtp-password-label" className="form-field__label">
                        SMTP password
                      </span>
                      <input
                        className="form-input"
                        type="password"
                        maxLength={4096}
                        required={
                          !saved.passwordConfigured ||
                          form.host !== saved.host ||
                          form.user !== saved.user
                        }
                        value={form.password}
                        onChange={(e) => update('password', e.target.value)}
                        autoComplete="new-password"
                        aria-describedby="smtp-password-help"
                        aria-labelledby="smtp-password-label"
                      />
                      <span id="smtp-password-help" className="text-sm text-slate-500">
                        {saved.passwordConfigured
                          ? 'A password is stored. Leave blank to keep it for the same server and username.'
                          : 'Use the SMTP password or app password issued by your email provider.'}
                      </span>
                    </label>
                    <label className="form-field">
                      <span id="smtp-from-label" className="form-field__label">
                        Sender email address
                      </span>
                      <input
                        className="form-input"
                        type="email"
                        aria-labelledby="smtp-from-label"
                        required
                        maxLength={320}
                        placeholder="notifications@yourschool.com"
                        value={form.from}
                        onChange={(e) => update('from', e.target.value)}
                      />
                      <span className="text-sm text-slate-500">
                        Use an address your provider has approved for sending.
                      </span>
                    </label>
                    <label className="form-field">
                      <span id="smtp-url-label" className="form-field__label">
                        School app URL
                      </span>
                      <input
                        className="form-input"
                        type="url"
                        aria-labelledby="smtp-url-label"
                        required
                        maxLength={500}
                        placeholder="https://school.example.com"
                        value={form.frontendUrl}
                        onChange={(e) => update('frontendUrl', e.target.value)}
                      />
                      <span className="text-sm text-slate-500">
                        Recovery links will open this address. It must be reachable by your users.
                      </span>
                    </label>
                    <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                      <ShieldCheck className="shrink-0" size={18} />
                      Your settings are encrypted before storage. The password is never returned to
                      this page.
                    </div>
                    <button className="primary-button" type="submit">
                      {busy ? 'Verifying connection…' : 'Verify connection and save'}
                    </button>
                    <p className="text-sm text-slate-500">
                      Saving checks the connection and sign-in without sending an email. Confirm
                      receipt through password recovery after saving.
                    </p>
                  </fieldset>
                </form>
              </>
            )}
            {message && (
              <p
                role="status"
                className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800"
              >
                {message}
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
