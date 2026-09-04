import { lazy, Suspense, useState } from 'react';
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';

/* eslint-disable react/prop-types */

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  LayoutDashboard,
  Users,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { getApiErrorMessage } from './api/errorMessage.js';
import toast, { Toaster } from 'react-hot-toast';

/* =========================================================
 * LAZY LOADED APPLICATION MODULES
 * ======================================================= */

const SchoolAdmin = lazy(() => import('./SchoolAdmin.jsx'));
const StudentDashboard = lazy(() => import('./StudentDashboard.jsx'));
const StudentHomeDashboard = lazy(() => import('./StudentHomeDashboard.jsx'));
const ParentPortal = lazy(() => import('./ParentPortal.jsx'));
const ParentClassroomWorkspace = lazy(() => import('./ParentClassroomWorkspace.jsx'));
const LandingPage = lazy(() => import('./LandingPage.jsx'));
const TeacherDashboard = lazy(() => import('./TeacherDashboard.jsx'));
const SubjectManagement = lazy(() => import('./SubjectManagement.jsx'));
const ClassDashboard = lazy(() => import('./ClassDashboard.jsx'));
const FinanceDashboard = lazy(() => import('./FinanceDashboard.jsx'));
const AcademicCalendarDashboard = lazy(() => import('./AcademicCalendarDashboard.jsx'));
const AttendanceDashboard = lazy(() => import('./AttendanceDashboard.jsx'));
const ExaminationsDashboard = lazy(() => import('./ExaminationsDashboard.jsx'));
const ResultsDashboard = lazy(() => import('./ResultsDashboard.jsx'));
const AcademicPolicyDashboard = lazy(() => import('./AcademicPolicyDashboard.jsx'));
const UserManagement = lazy(() => import('./UserManagement.jsx'));
const TimetableDashboard = lazy(() => import('./TimetableDashboard.jsx'));
const AdminDemoEntry = lazy(() => import('./AdminDemoEntry.jsx'));
const RoadmapInspectionHub = lazy(() => import('./RoadmapInspectionHub.jsx'));
const AdminWorkspace = lazy(() => import('./AdminWorkspace.jsx'));
const ClassroomDashboard = lazy(() => import('./ClassroomDashboard.jsx'));
const LiveLearningWorkspace = lazy(() => import('./LiveLearningWorkspace.jsx'));
const StudentSubmissionCenter = lazy(() => import('./StudentSubmissionCenter.jsx'));
const AssessmentEngine = lazy(() => import('./AssessmentEngine.jsx'));
const QuizSystem = lazy(() => import('./QuizSystem.jsx'));
const Gradebook = lazy(() => import('./Gradebook.jsx'));
const FeedbackWorkspace = lazy(() => import('./FeedbackWorkspace.jsx'));
const CalendarWorkspace = lazy(() => import('./CalendarWorkspace.jsx'));
const NotificationCenter = lazy(() => import('./NotificationCenter.jsx'));
const PaymentGatewayDashboard = lazy(() => import('./PaymentGatewayDashboard.jsx'));
const CommunicationDashboard = lazy(() => import('./CommunicationDashboard.jsx'));
const HRDashboard = lazy(() => import('./HRDashboard.jsx'));
const LibraryDashboard = lazy(() => import('./LibraryDashboard.jsx'));
const AssetInventoryDashboard = lazy(() => import('./AssetInventoryDashboard.jsx'));
const TransportDashboard = lazy(() => import('./TransportDashboard.jsx'));
const BoardingDashboard = lazy(() => import('./BoardingDashboard.jsx'));
const SecurityDashboard = lazy(() => import('./SecurityDashboard.jsx'));
const AnalyticsDashboard = lazy(() => import('./AnalyticsDashboard.jsx'));
const LearningAnalyticsWorkspace = lazy(() => import('./LearningAnalyticsWorkspace.jsx'));
const AIIntelligenceDashboard = lazy(() => import('./AIIntelligenceDashboard.jsx'));
const SmartIdentityDashboard = lazy(() => import('./SmartIdentityDashboard.jsx'));
const IoTDashboard = lazy(() => import('./IoTDashboard.jsx'));
const BillingDashboard = lazy(() => import('./BillingDashboard.jsx'));
const SecurityAdminDashboard = lazy(() => import('./SecurityAdminDashboard.jsx'));
const AIAcademicDashboard = lazy(() => import('./AIAcademicDashboard.jsx'));
const AILearningWorkspace = lazy(() => import('./AILearningWorkspace.jsx'));
const AcademicIntegrityWorkspace = lazy(() => import('./AcademicIntegrityWorkspace.jsx'));
const AIReportsDashboard = lazy(() => import('./AIReportsDashboard.jsx'));
const AIChatDashboard = lazy(() => import('./AIChatDashboard.jsx'));
const IntegrationsDashboard = lazy(() => import('./IntegrationsDashboard.jsx'));
const BiometricManagementDashboard = lazy(() => import('./BiometricManagementDashboard.jsx'));

/* =========================================================
 * SHARED FORM COMPONENTS
 * ======================================================= */

const inputClass = 'form-input';

function Field({ label, type = 'text', value, onChange, placeholder, required = true }) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';

  return (
    <label className="form-field">
      <span className="form-field__label">{label}</span>

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
            onClick={() => setVisible((current) => !current)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            aria-label="Toggle password visibility"
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </label>
  );
}

/* =========================================================
 * AUTH SHELL
 * ======================================================= */

function AuthShell({ children, title, subtitle }) {
  return (
    <div className="auth-shell">
      <div className="auth-shell__panel">
        <Link to="/" className="auth-shell__brand" aria-label="Return to home">
          <div className="auth-shell__mark">S</div>
          <span>
            SAIS <span style={{ color: '#728196' }}> / identity</span>
          </span>
        </Link>

        <div>
          <p className="auth-shell__eyebrow">Secure access</p>
          <h1 className="auth-shell__title">{title}</h1>
          <p className="auth-shell__subtitle">{subtitle}</p>
        </div>

        <div className="form-stack" style={{ marginTop: '1.75rem' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
 * USER DESTINATION RESOLUTION
 * Backend identity is the source of truth.
 * ======================================================= */

function getDestinationForUser(user) {
  if (!user) {
    return '/login';
  }

  const roles = user.roles ?? [];

  /*
   * Platform Application Owner
   */
  if (user.platformRole === 'OWNER' || user.accountType === 'APPLICATION_MANAGER') {
    return '/admin';
  }

  /*
   * Tenant Administrator
   */
  if (
    user.accountType === 'TENANT_ADMIN' ||
    roles.some((role) => ['SCHOOL_ADMIN', 'ADMIN'].includes(role))
  ) {
    return '/admin';
  }

  /*
   * Teacher
   */
  if (user.accountType === 'TEACHER' || roles.includes('TEACHER')) {
    return '/teachers';
  }

  /*
   * Parent / Guardian
   */
  if (user.accountType === 'PARENT' || roles.includes('PARENT')) {
    return '/parent-portal';
  }

  /*
   * Student
   */
  if (user.accountType === 'STUDENT' || roles.includes('STUDENT')) {
    return '/students';
  }

  /*
   * Generic staff
   */
  if (
    user.accountType === 'STAFF' ||
    roles.some((role) =>
      ['ACCOUNTANT', 'LIBRARIAN', 'TRANSPORT_MANAGER', 'HR_MANAGER'].includes(role)
    )
  ) {
    return '/dashboard';
  }

  /*
   * Safe fallback for authenticated accounts
   */
  return '/school-setup';
}

/* =========================================================
 * LOGIN
 * ======================================================= */

function Login() {
  const { login } = useAuth();
  const nav = useNavigate();

  const roleConfig = {
    title: 'School Information System sign in',
    subtitle: 'Sign in with the account issued by your school administrator.',
  };

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);

    try {
      const result = await login(form);
      const user = result.user;

      const destination = getDestinationForUser(user);

      toast.success('Welcome back');
      nav(destination, {
        replace: true,
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to sign in'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title={roleConfig.title} subtitle={roleConfig.subtitle}>
      <form onSubmit={submit} className="form-stack">
        <Field
          label="Email address"
          type="email"
          value={form.email}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              email: event.target.value,
            }))
          }
          placeholder="you@school.edu"
        />

        <Field
          label="Password"
          type="password"
          value={form.password}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              password: event.target.value,
            }))
          }
          placeholder="Enter your password"
        />

        <div className="flex justify-end">
          <Link to="/forgot-password" className="action-link">
            Forgot password?
          </Link>
        </div>

        <button type="submit" disabled={busy} className="primary-button">
          {busy ? 'Signing in…' : 'Sign in'}

          {!busy && <ArrowRight size={17} />}
        </button>
      </form>

      <p className="mt-7 text-center text-xs text-slate-500">
        Accounts are created and assigned by an authorized school administrator.
      </p>
    </AuthShell>
  );
}

/* =========================================================
 * TENANT REGISTRATION
 *
 * Application Owner registration is NOT handled here.
 * The first Owner is provisioned securely by backend bootstrap.
 * ======================================================= */

// Retained temporarily for migration reference; no public route renders it.
export function Register() {
  const { register } = useAuth();

  const location = useLocation();
  const nav = useNavigate();

  const isManager =
    location.pathname.startsWith('/manager') || location.pathname.startsWith('/owner');

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    designation: '',
    email: '',
    password: '',
    schoolName: '',
    schoolMotto: '',
    schoolCity: '',
    schoolCountry: '',
    primaryColor: '#4f46e5',
    secondaryColor: '#f59e0b',
    badgeUrl: '',
  });

  const [busy, setBusy] = useState(false);

  const update = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleBadge = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) {
      toast.error('Choose an image badge smaller than 2MB');

      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      update('badgeUrl', reader.result);
    };

    reader.readAsDataURL(file);
  };

  /*
   * Owner public registration is permanently unavailable.
   */
  if (isManager) {
    return (
      <AuthShell
        title="Application Owner registration unavailable"
        subtitle="The SAIS Application Owner account is securely provisioned during platform initialization."
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
            <p className="font-semibold text-indigo-950">
              An Application Owner account already exists.
            </p>

            <p className="mt-2 text-sm leading-6 text-indigo-800">
              Additional Application Owner accounts cannot be created from the public registration
              interface.
            </p>
          </div>

          <Link
            to="/owner/login"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Application Owner sign in
            <ArrowRight size={17} />
          </Link>

          <Link
            to="/tenant/register"
            className="block text-center text-sm font-semibold text-indigo-600"
          >
            Register a school tenant instead
          </Link>
        </div>
      </AuthShell>
    );
  }

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);

    try {
      await register({
        ...form,
        accountType: 'TENANT_ADMIN',
      });

      toast.success('Account submitted. Complete the activation process to continue.');

      nav('/tenant/login', {
        replace: true,
      });
    } catch (error) {
      const status = error.response?.status;

      const serverMessage = error.response?.data?.error?.message;

      const message = !error.response
        ? 'The registration service is unavailable. Please restart the backend or redeploy the API, then try again.'
        : status === 404
          ? 'Registration API route was not found. Check the deployed API function and try again.'
          : status === 409
            ? serverMessage || 'An account with these details already exists.'
            : status === 422 || status === 400
              ? serverMessage || 'Please review the information you entered.'
              : serverMessage || 'Unable to create account';

      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Create your tenant account"
      subtitle="Set up your school identity to begin the controlled tenant activation process."
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
          <p className="text-sm font-semibold text-indigo-950">Set up your school identity</p>

          <p className="mt-1 text-xs leading-5 text-indigo-800">
            Add the details families will see across your school portal.
          </p>
        </div>

        <Field
          label="School name"
          value={form.schoolName}
          onChange={(event) => update('schoolName', event.target.value)}
          placeholder="Horizon Academy"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Motto"
            value={form.schoolMotto}
            onChange={(event) => update('schoolMotto', event.target.value)}
            placeholder="Learn. Lead. Serve."
          />

          <Field
            label="City"
            value={form.schoolCity}
            onChange={(event) => update('schoolCity', event.target.value)}
            placeholder="Freetown"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Country"
            value={form.schoolCountry}
            onChange={(event) => update('schoolCountry', event.target.value)}
            placeholder="Sierra Leone"
          />

          <label className="block text-sm font-medium text-slate-700">
            School badge
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleBadge}
              className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
            />
            <span className="mt-1 block text-xs text-slate-500">PNG, JPG or WEBP up to 2MB</span>
          </label>
        </div>

        <div className="grid gap-3 rounded-2xl border border-slate-200 p-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Primary color
            <input
              type="color"
              value={form.primaryColor}
              onChange={(event) => update('primaryColor', event.target.value)}
              className="mt-2 h-10 w-full cursor-pointer rounded-lg border border-slate-200 bg-white"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Secondary color
            <input
              type="color"
              value={form.secondaryColor}
              onChange={(event) => update('secondaryColor', event.target.value)}
              className="mt-2 h-10 w-full cursor-pointer rounded-lg border border-slate-200 bg-white"
            />
          </label>
        </div>

        {(form.badgeUrl || form.schoolName || form.schoolMotto) && (
          <div
            className="flex items-center gap-3 rounded-2xl p-4 text-white"
            style={{
              backgroundColor: form.primaryColor,
            }}
          >
            <div className="flex size-12 items-center justify-center overflow-hidden rounded-xl bg-white/20">
              {form.badgeUrl ? (
                <img
                  src={form.badgeUrl}
                  alt="School badge preview"
                  className="size-full object-cover"
                />
              ) : (
                <span className="text-lg font-bold">{form.schoolName?.[0] || 'S'}</span>
              )}
            </div>

            <div>
              <p className="font-semibold">{form.schoolName || 'Your school name'}</p>

              <p className="text-sm text-white/80">{form.schoolMotto || 'Your school motto'}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="First name"
            value={form.firstName}
            onChange={(event) => update('firstName', event.target.value)}
            placeholder="Amina"
          />

          <Field
            label="Last name"
            value={form.lastName}
            onChange={(event) => update('lastName', event.target.value)}
            placeholder="Yusuf"
          />
        </div>

        <Field
          label="Role or designation"
          value={form.designation}
          onChange={(event) => update('designation', event.target.value)}
          placeholder="School administrator"
        />

        <Field
          label="Work email"
          type="email"
          value={form.email}
          onChange={(event) => update('email', event.target.value)}
          placeholder="you@school.edu"
        />

        <Field
          label="Password"
          type="password"
          value={form.password}
          onChange={(event) => update('password', event.target.value)}
          placeholder="8+ characters, mixed case and symbols"
        />

        <button
          type="submit"
          disabled={busy}
          className="mt-2 w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? 'Creating account…' : 'Create tenant account'}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-slate-500">
        Already registered?{' '}
        <Link to="/tenant/login" className="font-semibold text-indigo-600">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}

/* =========================================================
 * FORGOT PASSWORD
 * ======================================================= */

function Forgot() {
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);

    try {
      await forgotPassword(email);
      setSent(true);
    } catch (error) {
      toast.error(
        error.response?.data?.error?.message ?? 'Unable to process password reset request'
      );
    } finally {
      setBusy(false);
    }
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
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@school.edu"
          />

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}

/* =========================================================
 * BASIC AUTHENTICATED DASHBOARD
 * ======================================================= */

function Dashboard() {
  const { user, logout } = useAuth();

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Administrator';

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      window.location.href = '/login';
    }
  };

  return (
    <div className="app-shell">
      <div className="page-shell" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <header className="page-header" style={{ marginBottom: '1.5rem' }}>
          <div className="flex items-center gap-3">
            <div className="auth-shell__mark" style={{ width: '2.5rem', height: '2.5rem' }}>
              S
            </div>

            <span className="font-semibold" style={{ fontSize: '1.05rem' }}>
              SAIS workspace
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="secondary-button"
            style={{ minWidth: '7rem' }}
          >
            Sign out
          </button>
        </header>

        <div
          className="data-panel"
          style={{
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, #2f6bff, #1f5ae9)',
          }}
        >
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.82)' }}>Good to see you</p>

          <h1 style={{ margin: '0.5rem 0 0', color: '#fff', fontSize: 'clamp(2rem, 3vw, 3rem)' }}>
            {displayName}
          </h1>

          <p style={{ margin: '0.75rem 0 0', maxWidth: '42rem', color: 'rgba(255,255,255,0.82)' }}>
            Your identity is verified. Your authorized SAIS modules are available through your
            assigned workspace.
          </p>
        </div>
        <section
          className="stat-grid"
          aria-label="Workspace shortcuts"
          style={{ marginBottom: '1.5rem' }}
        >
          {[
            ['/admin', 'Administration', 'Manage school operations', LayoutDashboard],
            ['/students', 'Students', 'Admissions and records', GraduationCap],
            ['/teachers', 'Teachers', 'Staff and teaching profiles', Users],
            ['/academic-calendar', 'Calendar', 'Terms and school events', CalendarDays],
          ].map(([href, label, description, Icon]) => (
            <Link
              key={href}
              to={href}
              className="stat-card"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '2.2rem',
                    height: '2.2rem',
                    borderRadius: '0.7rem',
                    background: '#eef3ff',
                    color: '#2f6bff',
                  }}
                >
                  <Icon size={18} />
                </span>
                <ArrowRight size={16} style={{ color: '#2f6bff' }} />
              </div>
              <strong style={{ display: 'block', marginTop: '0.9rem', fontSize: '1.05rem' }}>
                {label}
              </strong>
              <span
                style={{
                  display: 'block',
                  marginTop: '0.35rem',
                  color: '#4f5e75',
                  fontSize: '0.85rem',
                }}
              >
                {description}
              </span>
            </Link>
          ))}
        </section>
        <section
          className="data-panel"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '2.5rem',
                height: '2.5rem',
                display: 'grid',
                placeItems: 'center',
                borderRadius: '0.8rem',
                background: '#edf5ff',
              }}
            >
              <BookOpen size={18} style={{ color: '#2f6bff' }} />
            </div>
            <span>
              <strong style={{ display: 'block' }}>Development environment ready</strong>
              <small style={{ color: '#4f5e75' }}>
                Database migrations and authenticated role accounts are available.
              </small>
            </span>
          </div>
          <Link to="/admin" className="primary-button">
            Open full administration <ArrowRight size={16} />
          </Link>
        </section>
      </div>
    </div>
  );
}

/* =========================================================
 * AUTHENTICATED ROUTE GUARD
 * ======================================================= */

function Protected({ children, allowed }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Loading workspace…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (
    allowed?.length &&
    !allowed.some(
      (value) =>
        user.accountType === value ||
        user.platformRole === value ||
        (user.roles ?? []).includes(value)
    )
  ) {
    return <Navigate to={getDestinationForUser(user)} replace />;
  }

  return children;
}

function AppBackNavigation() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();

  if (loading || pathname === '/') return null;

  const homePath = user ? getDestinationForUser(user) : '/';
  const routeParents = {
    '/owner/activations': '/admin',
    '/parent-classroom': '/parent-portal',
    '/student-dashboard': '/students',
    '/my-work': '/students',
    '/tenant-admin': '/admin',
  };
  const destination = routeParents[pathname] ?? homePath;

  if (pathname === destination) return null;

  const destinationLabels = {
    '/': 'Home',
    '/dashboard': 'Dashboard',
    '/parent-portal': 'Parent portal',
    '/platform-admin': 'Administration',
    '/students': 'Student workspace',
    '/teachers': 'Teacher workspace',
    '/tenant-admin': 'Administration',
  };

  return (
    <nav
      className="relative z-30 flex min-h-14 w-full items-center border-b border-slate-700 bg-slate-950 px-4 py-3 sm:px-6"
      aria-label="Page navigation"
    >
      <Link
        to={destination}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:border-cyan-400 hover:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
        aria-label={`Back to ${destinationLabels[destination] ?? 'main page'}`}
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Back to {destinationLabels[destination] ?? 'main page'}
      </Link>
    </nav>
  );
}

/* =========================================================
 * APPLICATION ROUTER
 * ======================================================= */

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Toaster position="top-right" />
        <AppBackNavigation />

        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
              Loading workspace...
            </div>
          }
        >
          <Routes>
            {/* ===============================
                PUBLIC
            =============================== */}

            <Route path="/" element={<LandingPage />} />

            <Route path="/admin-demo" element={<AdminDemoEntry />} />

            {/* ===============================
                AUTHENTICATION
            =============================== */}

            <Route path="/login" element={<Login />} />

            <Route path="/register" element={<Navigate to="/login" replace />} />

            <Route path="/owner/login" element={<Navigate to="/login" replace />} />

            <Route path="/owner/register" element={<Navigate to="/owner/login" replace />} />

            <Route path="/manager/login" element={<Navigate to="/login" replace />} />

            <Route path="/manager/register" element={<Navigate to="/owner/login" replace />} />

            <Route path="/tenant/login" element={<Navigate to="/login" replace />} />

            <Route path="/tenant/register" element={<Navigate to="/login" replace />} />

            <Route path="/staff/login" element={<Navigate to="/login" replace />} />

            <Route path="/forgot-password" element={<Forgot />} />

            {/* ===============================
                CORE WORKSPACES
            =============================== */}

            <Route
              path="/dashboard"
              element={
                <Protected>
                  <Dashboard />
                </Protected>
              }
            />

            <Route path="/platform-admin" element={<Navigate to="/admin" replace />} />

            <Route path="/tenant-admin" element={<Navigate to="/admin" replace />} />

            <Route path="/owner/activations" element={<Navigate to="/admin" replace />} />

            <Route
              path="/admin"
              element={
                <Protected>
                  <AdminWorkspace />
                </Protected>
              }
            />

            <Route
              path="/security-admin"
              element={
                <Protected>
                  <SecurityAdminDashboard />
                </Protected>
              }
            />

            {/* ===============================
                INSPECTION
            =============================== */}

            <Route
              path="/inspection"
              element={
                <Protected>
                  <RoadmapInspectionHub />
                </Protected>
              }
            />

            {/* ===============================
                STUDENTS
            =============================== */}

            <Route
              path="/students"
              element={
                <Protected>
                  <StudentDashboard />
                </Protected>
              }
            />

            <Route
              path="/student-dashboard"
              element={
                <Protected>
                  <StudentHomeDashboard />
                </Protected>
              }
            />

            <Route
              path="/my-work"
              element={
                <Protected>
                  <StudentSubmissionCenter />
                </Protected>
              }
            />

            {/* ===============================
                PARENTS
            =============================== */}

            <Route
              path="/parent-portal"
              element={
                <Protected>
                  <ParentPortal />
                </Protected>
              }
            />

            <Route
              path="/parent-classroom"
              element={
                <Protected>
                  <ParentClassroomWorkspace />
                </Protected>
              }
            />

            {/* ===============================
                TEACHERS
            =============================== */}

            <Route
              path="/teachers"
              element={
                <Protected>
                  <TeacherDashboard />
                </Protected>
              }
            />
            <Route
              path="/subjects"
              element={
                <Protected
                  allowed={[
                    'APPLICATION_MANAGER',
                    'OWNER',
                    'TENANT_ADMIN',
                    'SCHOOL_ADMIN',
                    'ADMIN',
                  ]}
                >
                  <SubjectManagement />
                </Protected>
              }
            />

            {/* ===============================
                USERS
            =============================== */}

            <Route
              path="/users"
              element={
                <Protected>
                  <UserManagement />
                </Protected>
              }
            />

            {/* ===============================
                SCHOOL
            =============================== */}

            <Route
              path="/school-setup"
              element={
                <Protected>
                  <SchoolAdmin />
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

            {/* ===============================
                ACADEMICS
            =============================== */}

            <Route
              path="/academic-calendar"
              element={
                <Protected>
                  <AcademicCalendarDashboard />
                </Protected>
              }
            />

            <Route
              path="/attendance"
              element={
                <Protected>
                  <AttendanceDashboard />
                </Protected>
              }
            />

            <Route
              path="/examinations"
              element={
                <Protected>
                  <ExaminationsDashboard />
                </Protected>
              }
            />

            <Route
              path="/academic-policies"
              element={
                <Protected>
                  <AcademicPolicyDashboard />
                </Protected>
              }
            />

            <Route
              path="/results"
              element={
                <Protected>
                  <ResultsDashboard />
                </Protected>
              }
            />

            <Route
              path="/timetables"
              element={
                <Protected>
                  <TimetableDashboard />
                </Protected>
              }
            />

            <Route
              path="/assessments"
              element={
                <Protected>
                  <AssessmentEngine />
                </Protected>
              }
            />

            <Route
              path="/quizzes"
              element={
                <Protected>
                  <QuizSystem />
                </Protected>
              }
            />

            <Route
              path="/gradebook"
              element={
                <Protected>
                  <Gradebook />
                </Protected>
              }
            />

            <Route
              path="/feedback"
              element={
                <Protected>
                  <FeedbackWorkspace />
                </Protected>
              }
            />

            <Route
              path="/calendar"
              element={
                <Protected>
                  <CalendarWorkspace />
                </Protected>
              }
            />

            {/* ===============================
                DIGITAL CLASSROOM
            =============================== */}

            <Route
              path="/classroom"
              element={
                <Protected>
                  <ClassroomDashboard />
                </Protected>
              }
            />

            <Route
              path="/live-learning"
              element={
                <Protected>
                  <LiveLearningWorkspace />
                </Protected>
              }
            />

            {/* ===============================
                FINANCE
            =============================== */}

            <Route
              path="/finance"
              element={
                <Protected>
                  <FinanceDashboard />
                </Protected>
              }
            />

            <Route
              path="/billing"
              element={
                <Protected>
                  <BillingDashboard />
                </Protected>
              }
            />

            <Route
              path="/payment-gateway"
              element={
                <Protected>
                  <PaymentGatewayDashboard />
                </Protected>
              }
            />

            {/* ===============================
                COMMUNICATION
            =============================== */}

            <Route
              path="/communication"
              element={
                <Protected>
                  <CommunicationDashboard />
                </Protected>
              }
            />

            <Route
              path="/notifications"
              element={
                <Protected>
                  <NotificationCenter />
                </Protected>
              }
            />

            {/* ===============================
                HUMAN RESOURCES
            =============================== */}

            <Route
              path="/hr"
              element={
                <Protected>
                  <HRDashboard />
                </Protected>
              }
            />

            {/* ===============================
                LIBRARY
            =============================== */}

            <Route
              path="/library"
              element={
                <Protected>
                  <LibraryDashboard />
                </Protected>
              }
            />

            {/* ===============================
                ASSETS
            =============================== */}

            <Route
              path="/assets-inventory"
              element={
                <Protected>
                  <AssetInventoryDashboard />
                </Protected>
              }
            />

            {/* ===============================
                TRANSPORT
            =============================== */}

            <Route
              path="/transport"
              element={
                <Protected>
                  <TransportDashboard />
                </Protected>
              }
            />

            {/* ===============================
                BOARDING
            =============================== */}

            <Route
              path="/boarding"
              element={
                <Protected>
                  <BoardingDashboard />
                </Protected>
              }
            />

            {/* ===============================
                SECURITY
            =============================== */}

            <Route
              path="/security"
              element={
                <Protected>
                  <SecurityDashboard />
                </Protected>
              }
            />

            <Route
              path="/smart-identity"
              element={
                <Protected>
                  <SmartIdentityDashboard />
                </Protected>
              }
            />

            <Route
              path="/biometrics"
              element={
                <Protected>
                  <BiometricManagementDashboard />
                </Protected>
              }
            />

            {/* ===============================
                ANALYTICS
            =============================== */}

            <Route
              path="/analytics"
              element={
                <Protected>
                  <AnalyticsDashboard />
                </Protected>
              }
            />

            <Route
              path="/learning-analytics"
              element={
                <Protected>
                  <LearningAnalyticsWorkspace />
                </Protected>
              }
            />

            {/* ===============================
                ARTIFICIAL INTELLIGENCE
            =============================== */}

            <Route
              path="/ai-intelligence"
              element={
                <Protected>
                  <AIIntelligenceDashboard />
                </Protected>
              }
            />

            <Route
              path="/ai-academic"
              element={
                <Protected>
                  <AIAcademicDashboard />
                </Protected>
              }
            />

            <Route
              path="/ai-learning"
              element={
                <Protected>
                  <AILearningWorkspace />
                </Protected>
              }
            />

            <Route
              path="/academic-integrity"
              element={
                <Protected>
                  <AcademicIntegrityWorkspace />
                </Protected>
              }
            />

            <Route
              path="/ai-reports"
              element={
                <Protected>
                  <AIReportsDashboard />
                </Protected>
              }
            />

            <Route
              path="/ai-chat"
              element={
                <Protected>
                  <AIChatDashboard />
                </Protected>
              }
            />

            {/* ===============================
                IOT
            =============================== */}

            <Route
              path="/iot"
              element={
                <Protected>
                  <IoTDashboard />
                </Protected>
              }
            />

            {/* ===============================
                INTEGRATIONS
            =============================== */}

            <Route
              path="/integrations"
              element={
                <Protected>
                  <IntegrationsDashboard />
                </Protected>
              }
            />

            {/* ===============================
                FALLBACK
            =============================== */}

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
