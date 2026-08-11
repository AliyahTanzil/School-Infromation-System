import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  LayoutDashboard,
  Plus,
  Users,
} from 'lucide-react';
import './classroom.css';

const classrooms = [
  { name: 'Grade 8 · Mathematics', code: 'MTH-8A', students: 32, next: 'Algebraic expressions', progress: 72, tone: 'violet' },
  { name: 'Grade 9 · Integrated Science', code: 'SCI-9B', students: 28, next: 'Cell structure lab', progress: 48, tone: 'cyan' },
  { name: 'Grade 7 · Mathematics', code: 'MTH-7C', students: 30, next: 'Fractions checkpoint', progress: 86, tone: 'amber' },
];

const upcoming = [
  { title: 'Algebraic expressions', className: 'Grade 8 · Mathematics', due: 'Today, 3:30 PM', type: 'Assignment', icon: FileText },
  { title: 'Cell structure lab', className: 'Grade 9 · Integrated Science', due: 'Tomorrow, 9:00 AM', type: 'Lesson', icon: BookOpen },
  { title: 'Fractions checkpoint', className: 'Grade 7 · Mathematics', due: 'Fri, 11:30 AM', type: 'Quiz', icon: ClipboardCheck },
];

function ClassroomDashboard() {
  const [activeFilter, setActiveFilter] = useState('All classrooms');
  const visibleClassrooms = useMemo(
    () => activeFilter === 'All classrooms' ? classrooms : classrooms.filter((classroom) => classroom.name.includes(activeFilter)),
    [activeFilter],
  );

  return (
    <main className="classroom-shell">
      <header className="classroom-topbar">
        <div className="classroom-breadcrumb"><Link to="/admin">Workspace</Link><span>/</span><strong>Digital Classroom</strong></div>
        <div className="classroom-top-actions"><span className="live-dot" /> <span>All systems operational</span><button className="classroom-avatar" aria-label="Open profile">SA</button></div>
      </header>

      <section className="classroom-hero">
        <div>
          <p className="eyebrow">Digital Classroom</p>
          <h1>Make every lesson count.</h1>
          <p className="hero-copy">Your teaching day, organized around the moments that matter: preparation, participation, and progress.</p>
        </div>
        <button className="primary-action"><Plus data-icon="inline-start" /> Create classroom</button>
      </section>

      <section className="classroom-stat-grid" aria-label="Classroom overview">
        <article className="classroom-stat"><span className="stat-icon violet"><Users /></span><div><strong>90</strong><span>Active learners</span></div><small>+8% this term</small></article>
        <article className="classroom-stat"><span className="stat-icon cyan"><BookOpen /></span><div><strong>14</strong><span>Lessons this week</span></div><small>3 need review</small></article>
        <article className="classroom-stat"><span className="stat-icon amber"><CheckCircle2 /></span><div><strong>76%</strong><span>Avg. completion</span></div><small>+12% vs. last week</small></article>
        <article className="classroom-stat"><span className="stat-icon rose"><Clock3 /></span><div><strong>2</strong><span>Items needing attention</span></div><small>Due today</small></article>
      </section>

      <div className="classroom-content-grid">
        <section className="classroom-panel classrooms-panel">
          <div className="panel-heading"><div><p className="eyebrow">Your teaching spaces</p><h2>Classrooms</h2></div><button className="text-action">View all <ArrowRight /></button></div>
          <div className="filter-row">{['All classrooms', 'Mathematics', 'Science'].map((filter) => <button key={filter} className={activeFilter === filter ? 'filter-chip active' : 'filter-chip'} onClick={() => setActiveFilter(filter)}>{filter}</button>)}</div>
          <div className="classroom-list">{visibleClassrooms.map((classroom) => <article className="classroom-card" key={classroom.code}><div className={`classroom-card-mark ${classroom.tone}`}><LayoutDashboard /></div><div className="classroom-card-main"><div className="card-title-row"><div><h3>{classroom.name}</h3><span>{classroom.code} · {classroom.students} students</span></div><button className="more-button" aria-label={`Open ${classroom.name}`}>···</button></div><div className="next-lesson"><span>Next up</span><strong>{classroom.next}</strong></div><div className="progress-line"><span style={{ width: `${classroom.progress}%` }} /></div><div className="progress-meta"><span>{classroom.progress}% course progress</span><Link to="/classroom">Open classroom <ArrowRight /></Link></div></div></article>)}</div>
        </section>

        <aside className="classroom-panel upcoming-panel"><div className="panel-heading"><div><p className="eyebrow">Stay ahead</p><h2>Upcoming work</h2></div><CalendarDays /></div><div className="upcoming-list">{upcoming.map(({ title, className, due, type, icon: Icon }) => <article className="upcoming-item" key={title}><span className="upcoming-icon"><Icon /></span><div><span className="item-type">{type}</span><h3>{title}</h3><p>{className}</p><small><Clock3 /> {due}</small></div></article>)}</div><button className="secondary-action">Open lesson planner <ArrowRight data-icon="inline-end" /></button></aside>
      </div>
    </main>
  );
}

export default ClassroomDashboard;
