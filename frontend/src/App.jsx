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

import { ArrowRight, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import { AuthProvider, useAuth } from './context/AuthContext.jsx';

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
const ClassDashboard = lazy(() => import('./ClassDashboard.jsx'));
const FinanceDashboard = lazy(() => import('./FinanceDashboard.jsx'));
const AcademicCalendarDashboard = lazy(() => import('./AcademicCalendarDashboard.jsx'));
const AttendanceDashboard = lazy(() => import('./AttendanceDashboard.jsx'));
const ExaminationsDashboard = lazy(() => import('./ExaminationsDashboard.jsx'));
const ResultsDashboard = lazy(() => import('./ResultsDashboard.jsx'));
const UserManagement = lazy(() => import('./UserManagement.jsx'));
const TimetableDashboard = lazy(() => import('./TimetableDashboard.jsx'));
const AdminDemoEntry = lazy(() => import('./AdminDemoEntry.jsx'));
const RoadmapInspectionHub = lazy(() => import('./RoadmapInspectionHub.jsx'));
const OwnerActivationPanel = lazy(() => import('./OwnerActivationPanel.jsx'));
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
const TenantAdminDashboard = lazy(() => import('./TenantAdminDashboard.jsx'));
const BillingDashboard = lazy(() => import('./BillingDashboard.jsx'));
const PlatformAdminDashboard = lazy(() => import('./PlatformAdminDashboard.jsx'));
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
            onClick={() => setVisible((current) => !current)}
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

/* =========================================================
 * AUTH SHELL
 * ======================================================= */

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
    return '/platform-admin';
  }

  /*
   * Tenant Administrator
   */
  if (
    user.accountType === 'TENANT_ADMIN' ||
    roles.some((role) => ['SCHOOL_ADMIN', 'ADMIN'].includes(role))
  ) {
    return '/tenant-admin';
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
  const { login, logout } = useAuth();

  const location = useLocation();
  const nav = useNavigate();

  const rolePath = location.pathname;

  const isManager = rolePath.startsWith('/manager') || rolePath.startsWith('/owner');

  const isStaff = rolePath.startsWith('/staff');

  const roleConfig = isManager
    ? {
        title: 'Application owner sign in',
        subtitle: 'Manage the SAIS platform, tenants, security, and system operations.',
        alternatePath: '/tenant/login',
        alternateLabel: 'Tenant sign in',
      }
    : isStaff
      ? {
          title: 'Staff sign in',
          subtitle:
            'Access your assigned teaching, administration, student-support, or operational workspace.',
          alternatePath: '/tenant/login',
          alternateLabel: 'Tenant sign in',
        }
      : {
          title: 'Tenant administrator sign in',
          subtitle: 'Sign in to access your school administration workspace.',
          alternatePath: '/owner/login',
          alternateLabel: 'Application owner sign in',
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

      /*
       * Owner portal must only admit the actual platform owner.
       */
      if (
        isManager &&
        !(user?.accountType === 'APPLICATION_MANAGER' && user?.platformRole === 'OWNER')
      ) {
        await logout();

        toast.error('This account does not have Application Owner access.');

        return;
      }

      /*
       * If the Owner accidentally signs in through another login page,
       * still send them to the correct platform workspace.
       */
      if (
        !isManager &&
        user?.accountType === 'APPLICATION_MANAGER' &&
        user?.platformRole === 'OWNER'
      ) {
        toast.success('Welcome back');

        nav('/platform-admin', {
          replace: true,
        });

        return;
      }

      const destination = getDestinationForUser(user);

      toast.success('Welcome back');

      nav(destination, {
        replace: true,
      });
    } catch (error) {
      toast.error(error.response?.data?.error?.message ?? 'Unable to sign in');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title={roleConfig.title} subtitle={roleConfig.subtitle}>
      <form onSubmit={submit} className="space-y-5">
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
          <Link
            to="/forgot-password"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? 'Signing in…' : 'Sign in'}

          {!busy && <ArrowRight size={17} />}
        </button>
      </form>

      {!isManager && !isStaff && (
        <p className="mt-7 text-center text-sm text-slate-500">
          New school on SAIS?{' '}
          <Link to="/tenant/register" className="font-semibold text-indigo-600">
            Create a tenant account
          </Link>
        </p>
      )}

      {isManager && (
        <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
          <p className="text-sm font-medium text-slate-700">
            Application Owner registration is closed.
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            The SAIS Application Owner account is provisioned securely during platform
            initialization.
          </p>
        </div>
      )}

      {isStaff && (
        <p className="mt-7 text-center text-xs text-slate-500">
          Staff accounts are created and assigned by an authorized administrator.
        </p>
      )}

      <p className="mt-3 text-center text-xs text-slate-400">
        <Link to={roleConfig.alternatePath} className="font-semibold text-indigo-600">
          {roleConfig.alternateLabel}
        </Link>

        {isStaff && <span className="ml-2 text-slate-400">Use your assigned staff account</span>}
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

function Register() {
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
            type="button"
            onClick={handleLogout}
            className="text-sm font-semibold text-slate-500 hover:text-slate-900"
          >
            Sign out
          </button>
        </header>

        <div className="mt-16 rounded-3xl bg-indigo-600 p-8 text-white">
          <p className="text-sm text-indigo-200">Good to see you</p>

          <h1 className="mt-2 text-3xl font-bold">{displayName}</h1>

          <p className="mt-3 max-w-lg text-indigo-100">
            Your identity is verified. Your authorized SAIS modules are available through your
            assigned workspace.
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
 * AUTHENTICATED ROUTE GUARD
 * ======================================================= */

function Protected({ children }) {
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

  return children;
}

/* =========================================================
 * APPLICATION ROUTER
 * ======================================================= */

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />

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

            <Route path="/register" element={<Register />} />

            <Route path="/owner/login" element={<Login />} />

            <Route path="/owner/register" element={<Navigate to="/owner/login" replace />} />

            <Route path="/manager/login" element={<Login />} />

            <Route path="/manager/register" element={<Navigate to="/owner/login" replace />} />

            <Route path="/tenant/login" element={<Login />} />

            <Route path="/tenant/register" element={<Register />} />

            <Route path="/staff/login" element={<Login />} />

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

            <Route
              path="/platform-admin"
              element={
                <Protected>
                  <PlatformAdminDashboard />
                </Protected>
              }
            />

            <Route
              path="/tenant-admin"
              element={
                <Protected>
                  <TenantAdminDashboard />
                </Protected>
              }
            />

            <Route
              path="/owner/activations"
              element={
                <Protected>
                  <OwnerActivationPanel />
                </Protected>
              }
            />

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
