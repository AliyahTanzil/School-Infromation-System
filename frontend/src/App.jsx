import { useState } from 'react';
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
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import toast, { Toaster } from 'react-hot-toast';
import SchoolAdmin from './SchoolAdmin.jsx';
import StudentDashboard from './StudentDashboard.jsx';
import StudentHomeDashboard from './StudentHomeDashboard.jsx';
import ParentPortal from './ParentPortal.jsx';
import ParentClassroomWorkspace from './ParentClassroomWorkspace.jsx';
import LandingPage from './LandingPage.jsx';
import TeacherDashboard from './TeacherDashboard.jsx';
import ClassDashboard from './ClassDashboard.jsx';
import FinanceDashboard from './FinanceDashboard.jsx';
import AcademicCalendarDashboard from './AcademicCalendarDashboard.jsx';
import AttendanceDashboard from './AttendanceDashboard.jsx';
import ExaminationsDashboard from './ExaminationsDashboard.jsx';
import ResultsDashboard from './ResultsDashboard.jsx';
import UserManagement from './UserManagement.jsx';
import TimetableDashboard from './TimetableDashboard.jsx';
import AdminDemoEntry from './AdminDemoEntry.jsx';
import RoadmapInspectionHub from './RoadmapInspectionHub.jsx';
import OwnerActivationPanel from './OwnerActivationPanel.jsx';
import AdminWorkspace from './AdminWorkspace.jsx';
import ClassroomDashboard from './ClassroomDashboard.jsx';
import LiveLearningWorkspace from './LiveLearningWorkspace.jsx';
import StudentSubmissionCenter from './StudentSubmissionCenter.jsx';
import AssessmentEngine from './AssessmentEngine.jsx';
import QuizSystem from './QuizSystem.jsx';
import Gradebook from './Gradebook.jsx';
import FeedbackWorkspace from './FeedbackWorkspace.jsx';
import CalendarWorkspace from './CalendarWorkspace.jsx';
import NotificationCenter from './NotificationCenter.jsx';
import PaymentGatewayDashboard from './PaymentGatewayDashboard.jsx';
import CommunicationDashboard from './CommunicationDashboard.jsx';
import HRDashboard from './HRDashboard.jsx';
import LibraryDashboard from './LibraryDashboard.jsx';
import AssetInventoryDashboard from './AssetInventoryDashboard.jsx';
import TransportDashboard from './TransportDashboard.jsx';
import BoardingDashboard from './BoardingDashboard.jsx';
import SecurityDashboard from './SecurityDashboard.jsx';
import AnalyticsDashboard from './AnalyticsDashboard.jsx';
import LearningAnalyticsWorkspace from './LearningAnalyticsWorkspace.jsx';
import AIIntelligenceDashboard from './AIIntelligenceDashboard.jsx';
import SmartIdentityDashboard from './SmartIdentityDashboard.jsx';
import IoTDashboard from './IoTDashboard.jsx';
import TenantAdminDashboard from './TenantAdminDashboard.jsx';
import BillingDashboard from './BillingDashboard.jsx';
import PlatformAdminDashboard from './PlatformAdminDashboard.jsx';
import SecurityAdminDashboard from './SecurityAdminDashboard.jsx';
import AIAcademicDashboard from './AIAcademicDashboard.jsx';
import AILearningWorkspace from './AILearningWorkspace.jsx';
import AcademicIntegrityWorkspace from './AcademicIntegrityWorkspace.jsx';
import AIReportsDashboard from './AIReportsDashboard.jsx';
import AIChatDashboard from './AIChatDashboard.jsx';
import IntegrationsDashboard from './IntegrationsDashboard.jsx';
import BiometricManagementDashboard from './BiometricManagementDashboard.jsx';

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
  const location = useLocation();
  const rolePath = location.pathname;
  const isManager = rolePath.startsWith('/manager') || rolePath.startsWith('/owner');
  const isStaff = rolePath.startsWith('/staff');
  const roleConfig = rolePath.startsWith('/owner')
    ? {
        title: 'Application owner sign in',
        subtitle: 'Manage the SAIS platform, tenants, security, and system operations.',
        registerPath: '/owner/register',
        alternatePath: '/tenant/login',
        alternateLabel: 'Tenant sign in',
      }
    : isStaff
      ? {
          title: 'Staff sign in',
          subtitle:
            'Access your role-based teaching, administration, student, parent, or support workspace.',
          registerPath: '/staff/login',
          alternatePath: '/tenant/login',
          alternateLabel: 'Tenant sign in',
        }
      : {
          title: 'Tenant administrator sign in',
          subtitle: 'Sign in to access your school administration workspace.',
          registerPath: '/tenant/register',
          alternatePath: '/owner/login',
          alternateLabel: 'Application owner sign in',
        };
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await login(form);
      toast.success('Welcome back');
      const roles = result.user?.roles ?? [];
      const destination = isManager
        ? '/platform-admin'
        : roles.some((role) => ['PLATFORM_ADMIN', 'SCHOOL_ADMIN', 'ADMIN'].includes(role))
          ? '/school-admin'
          : roles.includes('TEACHER')
            ? '/teachers'
            : roles.includes('PARENT')
              ? '/parent-portal'
              : roles.includes('STUDENT')
                ? '/students'
                : '/school-setup';
      nav(destination, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error?.message ?? 'Unable to sign in');
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
        <Link
          to={isManager ? '/manager/register' : '/register'}
          className="font-semibold text-indigo-600"
        >
          Create an account
        </Link>
      </p>
      <p className="mt-3 text-center text-xs text-slate-400">
        <Link to={roleConfig.alternatePath} className="font-semibold text-indigo-600">
          {roleConfig.alternateLabel}
        </Link>
        {isStaff && <span className="ml-2 text-slate-400">Use your assigned staff role</span>}
      </p>
    </AuthShell>
  );
}
function Register() {
  const { register } = useAuth();
  const location = useLocation();
  const isManager =
    location.pathname.startsWith('/manager') || location.pathname.startsWith('/owner');
  const nav = useNavigate();
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
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const handleBadge = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) {
      toast.error('Choose an image badge smaller than 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => update('badgeUrl', reader.result);
    reader.readAsDataURL(file);
  };
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await register({ ...form, accountType: isManager ? 'APPLICATION_MANAGER' : 'TENANT_ADMIN' });
      toast.success('Account created');
      nav(location.pathname.startsWith('/owner') ? '/owner/login' : '/tenant/login', {
        replace: true,
      });
    } catch (err) {
      const status = err.response?.status;
      const serverMessage = err.response?.data?.error?.message;
      const message = !err.response
        ? 'The registration service is unavailable. Please restart the backend or redeploy the API, then try again.'
        : status === 404
          ? 'Registration API route was not found. Check the deployed API function and try again.'
          : serverMessage || 'Unable to create account';
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthShell
      title={isManager ? 'Create an Application Manager account' : 'Create your tenant account'}
      subtitle={
        isManager
          ? 'This account is for SAIS platform operations and application oversight.'
          : 'Set up your school identity to begin managing your tenant securely.'
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {!isManager && (
          <>
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
              <p className="text-sm font-semibold text-indigo-950">Set up your school identity</p>
              <p className="mt-1 text-xs leading-5 text-indigo-800">
                Add the details families will see across your school portal.
              </p>
            </div>
            <Field
              label="School name"
              value={form.schoolName}
              onChange={(e) => update('schoolName', e.target.value)}
              placeholder="Horizon Academy"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Motto"
                value={form.schoolMotto}
                onChange={(e) => update('schoolMotto', e.target.value)}
                placeholder="Learn. Lead. Serve."
              />
              <Field
                label="City"
                value={form.schoolCity}
                onChange={(e) => update('schoolCity', e.target.value)}
                placeholder="Freetown"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Country"
                value={form.schoolCountry}
                onChange={(e) => update('schoolCountry', e.target.value)}
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
                <span className="mt-1 block text-xs text-slate-500">
                  PNG, JPG or WEBP up to 2MB
                </span>
              </label>
            </div>
            <div className="grid gap-3 rounded-2xl border border-slate-200 p-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Primary color
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => update('primaryColor', e.target.value)}
                  className="mt-2 h-10 w-full cursor-pointer rounded-lg border border-slate-200 bg-white"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Secondary color
                <input
                  type="color"
                  value={form.secondaryColor}
                  onChange={(e) => update('secondaryColor', e.target.value)}
                  className="mt-2 h-10 w-full cursor-pointer rounded-lg border border-slate-200 bg-white"
                />
              </label>
            </div>
            {(form.badgeUrl || form.schoolName || form.schoolMotto) && (
              <div
                className="flex items-center gap-3 rounded-2xl p-4 text-white"
                style={{ backgroundColor: form.primaryColor }}
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
          </>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="First name"
            value={form.firstName}
            onChange={(e) => update('firstName', e.target.value)}
            placeholder="Amina"
          />
          <Field
            label="Last name"
            value={form.lastName}
            onChange={(e) => update('lastName', e.target.value)}
            placeholder="Yusuf"
          />
        </div>
        <Field
          label={isManager ? 'Designation' : 'Role or designation'}
          value={form.designation}
          onChange={(e) => update('designation', e.target.value)}
          placeholder={isManager ? 'Application owner' : 'School administrator'}
        />
        <Field
          label="Work email"
          type="email"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          placeholder="you@school.edu"
        />
        <Field
          label="Password"
          type="password"
          value={form.password}
          onChange={(e) => update('password', e.target.value)}
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
          <Route path="/admin-demo" element={<AdminDemoEntry />} />
          <Route
            path="/inspection"
            element={
              <Protected>
                <RoadmapInspectionHub />
              </Protected>
            }
          />
          <Route
            path="/library"
            element={
              <Protected>
                <LibraryDashboard />
              </Protected>
            }
          />
          <Route
            path="/assets-inventory"
            element={
              <Protected>
                <AssetInventoryDashboard />
              </Protected>
            }
          />
          <Route
            path="/transport"
            element={
              <Protected>
                <TransportDashboard />
              </Protected>
            }
          />
          <Route
            path="/boarding"
            element={
              <Protected>
                <BoardingDashboard />
              </Protected>
            }
          />
          <Route
            path="/security"
            element={
              <Protected>
                <SecurityDashboard />
              </Protected>
            }
          />
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
          <Route
            path="/ai-intelligence"
            element={
              <Protected>
                <AIIntelligenceDashboard />
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
            path="/iot"
            element={
              <Protected>
                <IoTDashboard />
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
            path="/billing"
            element={
              <Protected>
                <BillingDashboard />
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
            path="/owner/activations"
            element={
              <Protected>
                <OwnerActivationPanel />
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
          <Route
            path="/communication"
            element={
              <Protected>
                <CommunicationDashboard />
              </Protected>
            }
          />
          <Route
            path="/hr"
            element={
              <Protected>
                <HRDashboard />
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
          <Route
            path="/my-work"
            element={
              <Protected>
                <StudentSubmissionCenter />
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
          <Route
            path="/notifications"
            element={
              <Protected>
                <NotificationCenter />
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

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/owner/login" element={<Login />} />
          <Route path="/owner/register" element={<Register />} />
          <Route path="/tenant/login" element={<Login />} />
          <Route path="/tenant/register" element={<Register />} />
          <Route path="/staff/login" element={<Login />} />
          <Route path="/manager/login" element={<Login />} />
          <Route path="/manager/register" element={<Register />} />
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
            path="/student-dashboard"
            element={
              <Protected>
                <StudentHomeDashboard />
              </Protected>
            }
          />
          <Route
            path="/users"
            element={
              <Protected>
                <UserManagement />
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
            path="/examinations"
            element={
              <Protected>
                <ExaminationsDashboard />
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
            path="/academic-calendar"
            element={
              <Protected>
                <AcademicCalendarDashboard />
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
            path="/parent-classroom"
            element={
              <Protected>
                <ParentClassroomWorkspace />
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
          <Route
            path="/biometrics"
            element={
              <Protected>
                <BiometricManagementDashboard />
              </Protected>
            }
          />
          <Route
            path="/integrations"
            element={
              <Protected>
                <IntegrationsDashboard />
              </Protected>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
