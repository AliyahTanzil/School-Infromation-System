import { useState } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
/* eslint-disable react/prop-types */
import { ArrowRight, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import toast, { Toaster } from 'react-hot-toast';
import SchoolAdmin from './SchoolAdmin.jsx';
import StudentDashboard from './StudentDashboard.jsx';
import ParentPortal from './ParentPortal.jsx';
import LandingPage from './LandingPage.jsx';
import TeacherDashboard from './TeacherDashboard.jsx';
import ClassDashboard from './ClassDashboard.jsx';
import FinanceDashboard from './FinanceDashboard.jsx';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100';
function Field({ label, type = 'text', value, onChange, placeholder, required = true }) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="relative">
        <input
          required={required}
          type={isPassword && visible ? 'text' : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={inputClass}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className="absolute right-3 top-3 text-slate-400"
            aria-label="Toggle password visibility"
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </label>
  );
}
function AuthShell({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-md">
        <Link to="/" className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white">
            S
          </div>
          <span className="font-semibold tracking-tight">
            SAIS <span className="font-normal text-slate-400">/ identity</span>
          </span>
        </Link>
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/50 sm:p-9">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(form);
      toast.success('Welcome back');
      nav('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error?.message ?? 'Unable to sign in');
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to access your school administration workspace."
    >
      <form onSubmit={submit} className="space-y-5">
        <Field
          label="Email address"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="you@school.edu"
        />
        <Field
          label="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Enter your password"
        />
        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Forgot password?
          </Link>
        </div>
        <button
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {busy ? 'Signing in…' : 'Sign in'} <ArrowRight size={17} />
        </button>
      </form>
      <p className="mt-7 text-center text-sm text-slate-500">
        New to SAIS?{' '}
        <Link to="/register" className="font-semibold text-indigo-600">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await register(form);
      toast.success('Account created');
      nav('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error?.message ?? 'Unable to create account');
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthShell
      title="Create your account"
      subtitle="Set up your identity to begin managing your school securely."
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="First name"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            placeholder="Amina"
          />
          <Field
            label="Last name"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            placeholder="Yusuf"
          />
        </div>
        <Field
          label="Work email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="you@school.edu"
        />
        <Field
          label="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="8+ characters, mixed case and symbols"
        />
        <button
          disabled={busy}
          className="mt-2 w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="mt-7 text-center text-sm text-slate-500">
        Already registered?{' '}
        <Link to="/login" className="font-semibold text-indigo-600">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
function Forgot() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    await forgotPassword(email);
    setSent(true);
  };
  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we’ll send instructions if an account exists."
    >
      {sent ? (
        <div className="space-y-4 text-center">
          <CheckCircle2 className="mx-auto text-emerald-500" size={42} />
          <p className="text-sm leading-6 text-slate-500">
            Check your inbox for a secure password reset link.
          </p>
          <Link to="/login" className="inline-block font-semibold text-indigo-600">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <Field
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@school.edu"
          />
          <button className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700">
            Send reset link
          </button>
        </form>
      )}
    </AuthShell>
  );
}
function Dashboard() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white">
              S
            </div>
            <span className="font-semibold">SAIS workspace</span>
          </div>
          <button
            onClick={logout}
            className="text-sm font-semibold text-slate-500 hover:text-slate-900"
          >
            Sign out
          </button>
        </header>
        <div className="mt-16 rounded-3xl bg-indigo-600 p-8 text-white">
          <p className="text-sm text-indigo-200">Good to see you</p>
          <h1 className="mt-2 text-3xl font-bold">
            {user?.firstName ?? user?.email ?? 'Administrator'}
          </h1>
          <p className="mt-3 max-w-lg text-indigo-100">
            Your identity is verified. The administration modules will appear here as SAIS grows.
          </p>
        </div>
      </div>
    </div>
  );
}
function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Loading workspace…
      </div>
    );
  return user ? children : <Navigate to="/login" replace />;
}
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<Forgot />} />
          <Route
            path="/dashboard"
            element={
              <Protected>
                <Dashboard />
              </Protected>
            }
          />
          <Route
            path="/students"
            element={
              <Protected>
                <StudentDashboard />
              </Protected>
            }
          />
          <Route
            path="/finance"
            element={
              <Protected>
                <FinanceDashboard />
              </Protected>
            }
          />
          <Route
            path="/classes"
            element={
              <Protected>
                <ClassDashboard />
              </Protected>
            }
          />
          <Route
            path="/teachers"
            element={
              <Protected>
                <TeacherDashboard />
              </Protected>
            }
          />
          <Route
            path="/parent-portal"
            element={
              <Protected>
                <ParentPortal />
              </Protected>
            }
          />
          <Route
            path="/school-setup"
            element={
              <Protected>
                <SchoolAdmin />
              </Protected>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
