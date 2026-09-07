import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  Network,
  Settings2,
  ShieldCheck,
  Users,
  WalletCards,
  LibraryBig,
  Boxes,
  BusFront,
  BedDouble,
  ShieldAlert,
  ChartNoAxesCombined,
  Sparkles,
  Fingerprint,
  CircuitBoard,
  Building2,
  ServerCog,
  LockKeyhole,
  BrainCircuit,
  FileText,
  MessagesSquare,
  PlugZap,
} from 'lucide-react';
import { useAuth } from './context/AuthContext.jsx';
import { ActivationNotice } from './ActivationWorkspace.jsx';

const moduleGroups = [
  {
    label: 'Core operations',
    description: 'Daily school administration and academic workflows.',
    modules: [
      ['/dashboard', 'Overview', 'Live school snapshot, tasks, and key activity.', LayoutDashboard],
      [
        '/students',
        'Students',
        'Admissions, profiles, guardians, and student records.',
        GraduationCap,
      ],
      ['/teachers', 'Teachers', 'Teaching staff profiles, assignments, and workload.', Users],
      [
        '/subjects',
        'Subjects',
        'School subject codes, names, and lifecycle controls.',
        BookOpenCheck,
      ],
      ['/classes', 'Classes', 'Class groups, sections, and academic organization.', BookOpenCheck],
      [
        '/classroom',
        'Digital classroom',
        'Lessons, assignments, quizzes, and learner progress.',
        BrainCircuit,
      ],
      ['/users', 'User management', 'Roles, permissions, and platform accounts.', ShieldCheck],
    ],
  },
  {
    label: 'Academic planning',
    description: 'Plan the school year and monitor learning outcomes.',
    modules: [
      ['/timetables', 'Timetables', 'Build and review class schedules.', CalendarDays],
      [
        '/academic-calendar',
        'Academic calendar',
        'Events, terms, holidays, and important dates.',
        CalendarDays,
      ],
      ['/attendance', 'Attendance', 'Track daily attendance and patterns.', ClipboardCheck],
      [
        '/academic-policies',
        'Grading policies',
        'Pass marks, grade bands, weighting, and policy lifecycle.',
        BookOpenCheck,
      ],
      [
        '/examinations',
        'Examinations',
        'Manage exam sessions and assessment activity.',
        BookOpenCheck,
      ],
      ['/results', 'Results', 'Review academic results and performance.', Network],
    ],
  },
  {
    label: 'Finance and communication',
    description: 'Explore the administrative workflows that connect families and staff.',
    modules: [
      ['/finance', 'Finance', 'Fees, transactions, and financial reporting.', Landmark],
      [
        '/payment-gateway',
        'Payment gateway',
        'Test payment configuration and collection flows.',
        CreditCard,
      ],
      [
        '/communication',
        'Communication',
        'Notifications, announcements, and messaging.',
        MessageSquareText,
      ],
      ['/hr', 'HR and payroll', 'Staff records, leave, attendance, and payroll.', WalletCards],
      [
        '/library',
        'Library management',
        'Catalog, copies, circulation, fines, and digital resources.',
        LibraryBig,
      ],
      [
        '/assets-inventory',
        'Assets & inventory',
        'Serialized property, stock, warehouses, purchasing, and audits.',
        Boxes,
      ],
      [
        '/transport',
        'Transport operations',
        'Vehicles, drivers, routes, trips, safety, fuel, and GPS-ready tracking.',
        BusFront,
      ],
      [
        '/boarding',
        'Boarding & hostel',
        'Dormitories, bed allocations, attendance, meals, inspections, and welfare.',
        BedDouble,
      ],
      [
        '/security',
        'Security & data protection',
        'Audit trails, access monitoring, alerts, backups, retention, and privacy controls.',
        ShieldAlert,
      ],
      [
        '/analytics',
        'Analytics & BI',
        'Executive KPIs, trends, comparisons, reports, exports, and decision signals.',
        ChartNoAxesCombined,
      ],
      [
        '/ai-intelligence',
        'AI intelligence',
        'Advisory insights, recommendations, risk signals, and evidence-backed assistance.',
        Sparkles,
      ],
      [
        '/smart-identity',
        'Smart identity',
        'QR, RFID, device verification, consent, policy, and offline identity controls.',
        Fingerprint,
      ],
      [
        '/iot',
        'IoT Smart School',
        'Connected devices, gateways, telemetry, energy, classroom automation, and alerts.',
        CircuitBoard,
      ],
      [
        '/tenant-admin',
        'Multi-Tenant SaaS',
        'Tenant health, schools, usage, quotas, feature flags, lifecycle, and audit controls.',
        Building2,
      ],
      [
        '/billing',
        'Subscription & billing',
        'Plans, entitlements, invoices, payments, usage, and lifecycle controls.',
        CreditCard,
      ],
      [
        '/platform-admin',
        'Platform administration',
        'Tenants, services, security, incidents, backups, integrations, and audit controls.',
        ServerCog,
      ],
      [
        '/security-admin',
        'Advanced security & compliance',
        'MFA, sessions, risk signals, privacy requests, retention, and evidence controls.',
        LockKeyhole,
      ],
      [
        '/ai-academic',
        'AI Academic Assistant',
        'Role-aware academic guidance with verified evidence and safe refusal states.',
        BrainCircuit,
      ],
      [
        '/ai-reports',
        'AI Report Generation',
        'Evidence-backed narratives, validation, review, approvals, and exports.',
        FileText,
      ],
      [
        '/ai-chat',
        'AI Chat Assistant',
        'Conversational school operations with citations, evidence, and safe boundaries.',
        MessagesSquare,
      ],
      [
        '/integrations',
        'External Integrations',
        'Secure provider connections, health checks, and sync safeguards.',
        PlugZap,
      ],
      [
        '/biometrics',
        'Biometric Management',
        'Privacy-first readers, device health, and auditable verification events.',
        Fingerprint,
      ],
      ['/parent-portal', 'Parent portal', 'Preview the family-facing school experience.', Users],
      [
        '/school-setup',
        'School setup',
        'School identity, settings, and administration.',
        Settings2,
      ],
    ],
  },
];

export default function AdminWorkspace() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const signOut = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <main className="admin-shell">
      <div className="admin-shell__container">
        <header className="admin-shell__header">
          <div>
            <p className="eyebrow" style={{ margin: 0 }}>
              SAIS administration
            </p>
            <h1 className="admin-shell__title">Manage your school administration platform.</h1>
            <p className="admin-shell__subtitle">
              Open a module to manage your school operations, academics, staff, and services.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/school-setup" className="primary-button">
              <Building2 size={16} /> School and branches
            </Link>
            <button type="button" onClick={signOut} className="secondary-button">
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </header>

        {user?.accountType === 'APPLICATION_MANAGER' && <ActivationNotice />}
        <section className="admin-shell__metric-grid" aria-label="Administration workspace details">
          {[
            ['35', 'Modules available'],
            ['Administrator', 'Active role'],
            ['Tenant scoped', 'Data boundary'],
          ].map(([value, label]) => (
            <div key={label} className="admin-shell__metric">
              <p className="admin-shell__metric-value">{value}</p>
              <p className="admin-shell__metric-label">{label}</p>
            </div>
          ))}
        </section>

        <div style={{ marginTop: '2.5rem' }}>
          {moduleGroups.map((group) => (
            <section
              key={group.label}
              className="admin-shell__section"
              aria-labelledby={group.label.replaceAll(' ', '-')}
            >
              <div className="admin-shell__section-header">
                <h2 id={group.label.replaceAll(' ', '-')} className="admin-shell__section-title">
                  {group.label}
                </h2>
                <p className="admin-shell__section-subtitle">{group.description}</p>
              </div>

              <div className="admin-shell__module-grid">
                {group.modules.map(([href, label, description, Icon]) => (
                  <Link key={href} to={href} className="admin-shell__module-card">
                    <div className="admin-shell__module-card-header">
                      <span className="admin-shell__module-icon">
                        <Icon size={19} />
                      </span>
                      <ArrowRight size={18} style={{ color: '#728196' }} />
                    </div>

                    <h3 className="admin-shell__module-title">{label}</h3>
                    <p className="admin-shell__module-description">{description}</p>
                    <span className="admin-shell__module-link">Open module</span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
