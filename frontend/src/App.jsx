import { lazy, Suspense, useEffect, useState } from 'react';
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useSearchParams,
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
  ShieldCheck,
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

function AuthShell({ children, title, subtitle, wide = false }) {
  return (
    <div className="auth-shell">
      <div className="auth-shell__panel" style={{ width: wide ? 'min(100%, 32rem)' : undefined }}>
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

        <div className="form-stack" style={{ marginTop: '1.5rem' }}>
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
  if (
    user.platformRole === 'OWNER' ||
    user.accountType === 'APPLICATION_MANAGER' ||
    roles.includes('PLATFORM_ADMIN')
  ) {
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
 * LOGIN & SIGN UP
 * Integrated Sign In & Sign Up with Owner vs Staff accounts
 * ======================================================= */

function Login({ defaultMode = 'login', defaultType = 'owner' }) {
  const { login, register } = useAuth();
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlMode = searchParams.get('mode');
  const urlType = searchParams.get('type');

  const [mode, setMode] = useState(
    urlMode === 'signup' || defaultMode === 'signup' ? 'signup' : 'login'
  );
  const [accountType, setAccountType] = useState(
    urlType === 'staff' || defaultType === 'staff' ? 'staff' : 'owner'
  );

  useEffect(() => {
    if (urlMode) setMode(urlMode === 'signup' ? 'signup' : 'login');
    if (urlType) setAccountType(urlType === 'staff' ? 'staff' : 'owner');
  }, [urlMode, urlType]);

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });

  const [ownerForm, setOwnerForm] = useState({
    schoolName: '',
    schoolMotto: '',
    schoolCity: '',
    schoolCountry: '',
    primaryColor: '#4f46e5',
    secondaryColor: '#f59e0b',
    badgeUrl: '',
    firstName: '',
    lastName: '',
    designation: 'School Owner',
    email: '',
    password: '',
  });

  const [staffForm, setStaffForm] = useState({
    firstName: '',
    lastName: '',
    designation: 'Teacher',
    schoolName: '',
    email: '',
    password: '',
  });

  const [busy, setBusy] = useState(false);
  const [pendingActivation, setPendingActivation] = useState(false);

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setPendingActivation(false);
    setSearchParams(newMode === 'signup' ? { mode: 'signup', type: accountType } : {});
  };

  const handleTypeSwitch = (newType) => {
    setAccountType(newType);
    setSearchParams({ mode: 'signup', type: newType });
  };

  const updateOwner = (key, value) => {
    setOwnerForm((current) => ({ ...current, [key]: value }));
  };

  const updateStaff = (key, value) => {
    setStaffForm((current) => ({ ...current, [key]: value }));
  };

  const handleBadge = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) {
      toast.error('Choose an image badge smaller than 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => updateOwner('badgeUrl', reader.result);
    reader.readAsDataURL(file);
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);

    try {
      const result = await login(loginForm);
      const user = result.user;
      const destination = getDestinationForUser(user);
      toast.success('Welcome back');
      nav(destination, { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to sign in'));
    } finally {
      setBusy(false);
    }
  };

  const handleOwnerSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);

    try {
      const result = await register({
        ...ownerForm,
        accountType: 'TENANT_ADMIN',
      });

      if (result?.activationPending) {
        setPendingActivation(true);
        toast.success('Owner account submitted for activation.');
      } else {
        const user = result?.user;
        const destination = getDestinationForUser(user);
        toast.success('Owner account created successfully');
        nav(destination, { replace: true });
      }
    } catch (error) {
      const status = error.response?.status;
      const serverMessage = error.response?.data?.error?.message;
      const message = !error.response
        ? 'The registration service is unavailable. Please try again.'
        : status === 409
          ? serverMessage || 'An account with these details already exists.'
          : serverMessage || 'Unable to create owner account';
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const handleStaffSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);

    try {
      const result = await register({
        ...staffForm,
        accountType: 'STAFF',
      });

      const user = result?.user;
      const destination = getDestinationForUser(user);
      toast.success('Staff account created successfully');
      nav(destination, { replace: true });
    } catch (error) {
      const status = error.response?.status;
      const serverMessage = error.response?.data?.error?.message;
      const message = !error.response
        ? 'The registration service is unavailable. Please try again.'
        : status === 409
          ? serverMessage || 'An account with this email already exists.'
          : serverMessage || 'Unable to create staff account';
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const roleConfig = {
    title:
      mode === 'login'
        ? 'School Information System sign in'
        : accountType === 'owner'
          ? 'Create Owner Account'
          : 'Create Staff Account',
    subtitle:
      mode === 'login'
        ? 'Sign in with the account issued by your school administrator or school owner.'
        : accountType === 'owner'
          ? 'Register a new school tenant & administrator account.'
          : 'Register a teacher or staff account to access your school workspace.',
  };

  return (
    <AuthShell title={roleConfig.title} subtitle={roleConfig.subtitle} wide={mode === 'signup'}>
      {/* Mode Switcher: Sign In vs Sign Up */}
      <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
        <button
          type="button"
          onClick={() => handleModeSwitch('login')}
          className={`flex-1 rounded-lg py-2.5 transition ${
            mode === 'login' ? 'bg-white text-indigo-950 shadow-sm' : 'hover:text-slate-900'
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => handleModeSwitch('signup')}
          className={`flex-1 rounded-lg py-2.5 transition ${
            mode === 'signup' ? 'bg-white text-indigo-950 shadow-sm' : 'hover:text-slate-900'
          }`}
        >
          Sign up / Create account
        </button>
      </div>

      {mode === 'login' ? (
        /* ================= SIGN IN FORM ================= */
        <form onSubmit={handleLoginSubmit} className="form-stack mt-4">
          <Field
            label="Email address"
            type="email"
            value={loginForm.email}
            onChange={(event) =>
              setLoginForm((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
            placeholder="you@school.edu"
          />

          <Field
            label="Password"
            type="password"
            value={loginForm.password}
            onChange={(event) =>
              setLoginForm((current) => ({
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

          <p className="mt-5 text-center text-xs text-slate-500">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={() => handleModeSwitch('signup')}
              className="font-semibold text-indigo-600 hover:underline"
            >
              Sign up here
            </button>
          </p>
        </form>
      ) : pendingActivation ? (
        /* ================= OWNER ACTIVATION PENDING ================= */
        <div className="mt-4 space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 text-center">
          <CheckCircle2 className="mx-auto text-emerald-600" size={44} />
          <div>
            <h3 className="text-base font-bold text-emerald-950">Owner Account Submitted</h3>
            <p className="mt-1.5 text-xs text-emerald-800 leading-relaxed">
              Your school owner account request has been registered and is pending approval by the
              application owner.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleModeSwitch('login')}
            className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-semibold text-white transition hover:bg-emerald-700"
          >
            Return to Sign In
          </button>
        </div>
      ) : (
        /* ================= SIGN UP FLOW ================= */
        <div className="mt-4 space-y-4">
          {/* Account Type Toggle: Owner vs Staff */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Account Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTypeSwitch('owner')}
                className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition ${
                  accountType === 'owner'
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <ShieldCheck className="mb-1 size-5 text-indigo-600" />
                <span className="text-xs font-bold">School Owner</span>
                <span className="mt-0.5 text-[10px] text-slate-500">Tenant Administrator</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeSwitch('staff')}
                className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition ${
                  accountType === 'staff'
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <Users className="mb-1 size-5 text-indigo-600" />
                <span className="text-xs font-bold">Staff Member</span>
                <span className="mt-0.5 text-[10px] text-slate-500">Teacher & Staff</span>
              </button>
            </div>
          </div>

          {accountType === 'owner' ? (
            /* ================= OWNER SIGNUP FORM ================= */
            <form onSubmit={handleOwnerSubmit} className="space-y-3.5">
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 text-xs text-indigo-900">
                <p className="font-semibold">Set up your school tenant identity</p>
                <p className="mt-0.5 text-indigo-700 text-[11px]">
                  This registers your school environment and primary administrator account.
                </p>
              </div>

              <Field
                label="School name"
                value={ownerForm.schoolName}
                onChange={(event) => updateOwner('schoolName', event.target.value)}
                placeholder="Horizon Academy"
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Motto"
                  value={ownerForm.schoolMotto}
                  onChange={(event) => updateOwner('schoolMotto', event.target.value)}
                  placeholder="Learn. Lead. Serve."
                />
                <Field
                  label="City"
                  value={ownerForm.schoolCity}
                  onChange={(event) => updateOwner('schoolCity', event.target.value)}
                  placeholder="Freetown"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Country"
                  value={ownerForm.schoolCountry}
                  onChange={(event) => updateOwner('schoolCountry', event.target.value)}
                  placeholder="Sierra Leone"
                />

                <label className="block text-sm font-medium text-slate-700">
                  School badge
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleBadge}
                    className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs"
                  />
                </label>
              </div>

              <div className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-2">
                <label className="text-xs font-medium text-slate-700">
                  Primary color
                  <input
                    type="color"
                    value={ownerForm.primaryColor}
                    onChange={(event) => updateOwner('primaryColor', event.target.value)}
                    className="mt-1 h-9 w-full cursor-pointer rounded-lg border border-slate-200 bg-white"
                  />
                </label>
                <label className="text-xs font-medium text-slate-700">
                  Secondary color
                  <input
                    type="color"
                    value={ownerForm.secondaryColor}
                    onChange={(event) => updateOwner('secondaryColor', event.target.value)}
                    className="mt-1 h-9 w-full cursor-pointer rounded-lg border border-slate-200 bg-white"
                  />
                </label>
              </div>

              {(ownerForm.badgeUrl || ownerForm.schoolName || ownerForm.schoolMotto) && (
                <div
                  className="flex items-center gap-3 rounded-xl p-3 text-white"
                  style={{ backgroundColor: ownerForm.primaryColor }}
                >
                  <div className="flex size-10 items-center justify-center overflow-hidden rounded-lg bg-white/20">
                    {ownerForm.badgeUrl ? (
                      <img
                        src={ownerForm.badgeUrl}
                        alt="Badge"
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="text-base font-bold">
                        {ownerForm.schoolName?.[0] || 'S'}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold">{ownerForm.schoolName || 'School Name'}</p>
                    <p className="text-[11px] text-white/80">{ownerForm.schoolMotto || 'Motto'}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-1">
                <Field
                  label="Owner First name"
                  value={ownerForm.firstName}
                  onChange={(event) => updateOwner('firstName', event.target.value)}
                  placeholder="Amina"
                />
                <Field
                  label="Owner Last name"
                  value={ownerForm.lastName}
                  onChange={(event) => updateOwner('lastName', event.target.value)}
                  placeholder="Yusuf"
                />
              </div>

              <Field
                label="Role or designation"
                value={ownerForm.designation}
                onChange={(event) => updateOwner('designation', event.target.value)}
                placeholder="School Owner / Director"
              />

              <Field
                label="Work email"
                type="email"
                value={ownerForm.email}
                onChange={(event) => updateOwner('email', event.target.value)}
                placeholder="owner@school.edu"
              />

              <Field
                label="Password"
                type="password"
                value={ownerForm.password}
                onChange={(event) => updateOwner('password', event.target.value)}
                placeholder="8+ characters"
              />

              <button
                type="submit"
                disabled={busy}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {busy ? 'Creating owner account…' : 'Create Owner Account'}
                {!busy && <ArrowRight size={17} />}
              </button>
            </form>
          ) : (
            /* ================= STAFF SIGNUP FORM ================= */
            <form onSubmit={handleStaffSubmit} className="space-y-3.5">
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 text-xs text-indigo-900">
                <p className="font-semibold">Register as a Staff Member</p>
                <p className="mt-0.5 text-indigo-700 text-[11px]">
                  Create your teacher, administrative, or departmental staff account.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="First name"
                  value={staffForm.firstName}
                  onChange={(event) => updateStaff('firstName', event.target.value)}
                  placeholder="Kofi"
                />
                <Field
                  label="Last name"
                  value={staffForm.lastName}
                  onChange={(event) => updateStaff('lastName', event.target.value)}
                  placeholder="Mensah"
                />
              </div>

              <Field
                label="Role / Designation"
                value={staffForm.designation}
                onChange={(event) => updateStaff('designation', event.target.value)}
                placeholder="e.g. Teacher, HR Manager, Accountant, Librarian"
              />

              <Field
                label="School Name"
                value={staffForm.schoolName}
                onChange={(event) => updateStaff('schoolName', event.target.value)}
                placeholder="e.g. Horizon Academy"
              />

              <Field
                label="Work email"
                type="email"
                value={staffForm.email}
                onChange={(event) => updateStaff('email', event.target.value)}
                placeholder="staff@school.edu"
              />

              <Field
                label="Password"
                type="password"
                value={staffForm.password}
                onChange={(event) => updateStaff('password', event.target.value)}
                placeholder="8+ characters"
              />

              <button
                type="submit"
                disabled={busy}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {busy ? 'Creating staff account…' : 'Create Staff Account'}
                {!busy && <ArrowRight size={17} />}
              </button>
            </form>
          )}

          <p className="mt-5 text-center text-xs text-slate-500">
            Already registered?{' '}
            <button
              type="button"
              onClick={() => handleModeSwitch('login')}
              className="font-semibold text-indigo-600 hover:underline"
            >
              Sign in here
            </button>
          </p>
        </div>
      )}
    </AuthShell>
  );
}

// Retained export compatibility for Register
export function Register() {
  return <Login defaultMode="signup" defaultType="owner" />;
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
            ['/school-setup', 'School management', 'Create and manage schools', LayoutDashboard],
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

            {/* ===============================
                AUTHENTICATION
            =============================== */}

            <Route path="/login" element={<Login defaultMode="login" />} />

            <Route path="/register" element={<Login defaultMode="signup" defaultType="owner" />} />

            <Route path="/owner/login" element={<Login defaultMode="login" />} />

            <Route
              path="/owner/register"
              element={<Login defaultMode="signup" defaultType="owner" />}
            />

            <Route path="/manager/login" element={<Login defaultMode="login" />} />

            <Route
              path="/manager/register"
              element={<Login defaultMode="signup" defaultType="owner" />}
            />

            <Route path="/tenant/login" element={<Login defaultMode="login" />} />

            <Route
              path="/tenant/register"
              element={<Login defaultMode="signup" defaultType="owner" />}
            />

            <Route path="/staff/login" element={<Login defaultMode="login" />} />

            <Route
              path="/staff/register"
              element={<Login defaultMode="signup" defaultType="staff" />}
            />

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
                    'PLATFORM_ADMIN',
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
