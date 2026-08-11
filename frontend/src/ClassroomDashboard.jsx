import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Plus,
  Presentation,
  RotateCcw,
  Users,
  X,
} from 'lucide-react';
import './classroom.css';

const initialClassrooms = [
  {
    name: 'Grade 8 · Mathematics',
    code: 'MTH-8A',
    students: 32,
    next: 'Algebraic expressions',
    progress: 72,
    tone: 'violet',
  },
  {
    name: 'Grade 9 · Integrated Science',
    code: 'SCI-9B',
    students: 28,
    next: 'Cell structure lab',
    progress: 48,
    tone: 'cyan',
  },
  {
    name: 'Grade 7 · Mathematics',
    code: 'MTH-7C',
    students: 30,
    next: 'Fractions checkpoint',
    progress: 86,
    tone: 'amber',
  },
];
const upcoming = [
  {
    title: 'Algebraic expressions',
    className: 'Grade 8 · Mathematics',
    due: 'Today, 3:30 PM',
    type: 'Assignment',
    icon: FileText,
  },
  {
    title: 'Cell structure lab',
    className: 'Grade 9 · Integrated Science',
    due: 'Tomorrow, 9:00 AM',
    type: 'Lesson',
    icon: BookOpen,
  },
  {
    title: 'Fractions checkpoint',
    className: 'Grade 7 · Mathematics',
    due: 'Fri, 11:30 AM',
    type: 'Quiz',
    icon: ClipboardCheck,
  },
];
const tabs = ['Stream', 'Classwork', 'People', 'Grades', 'Analytics'];
const initialTopics = ['Algebraic expressions', 'Practice & review', 'Resources'];
const initialClasswork = [
  { id: 1, title: 'Algebraic expressions', type: 'Assignment', topic: 'Algebraic expressions', due: 'Today, 3:30 PM', points: 20, status: 'Published', icon: FileText },
  { id: 2, title: 'Expression vocabulary', type: 'Material', topic: 'Algebraic expressions', due: 'No due date', points: null, status: 'Published', icon: Presentation },
  { id: 3, title: 'Fractions checkpoint', type: 'Quiz', topic: 'Practice & review', due: 'Fri, 11:30 AM', points: 15, status: 'Scheduled', icon: HelpCircle },
  { id: 4, title: 'Unit 1 reference sheet', type: 'Material', topic: 'Resources', due: 'No due date', points: null, status: 'Draft', icon: FileText },
];
const classworkTypes = [
  { label: 'Assignment', icon: FileText, description: 'Collect work from learners.' },
  { label: 'Quiz', icon: HelpCircle, description: 'Check understanding with questions.' },
  { label: 'Material', icon: Presentation, description: 'Share a lesson or resource.' },
];

function ClassroomDashboard() {
  const [classrooms, setClassrooms] = useState(initialClassrooms);
  const [activeFilter, setActiveFilter] = useState('All classrooms');
  const [activeClassroom, setActiveClassroom] = useState(null);
  const [activeTab, setActiveTab] = useState('Stream');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: '', subject: '', grade: '', code: '' });
  const [error, setError] = useState('');
  const [topics, setTopics] = useState(initialTopics);
  const [classwork, setClasswork] = useState(initialClasswork);
  const [classworkFilter, setClassworkFilter] = useState('All');
  const [isClassworkOpen, setIsClassworkOpen] = useState(false);
  const [classworkForm, setClassworkForm] = useState({ title: '', type: 'Assignment', topic: initialTopics[0], due: '', points: '20' });
  const [topicName, setTopicName] = useState('');
  const [classworkError, setClassworkError] = useState('');
  const visibleClassrooms = useMemo(
    () =>
      activeFilter === 'All classrooms'
        ? classrooms
        : classrooms.filter((item) => item.name.includes(activeFilter)),
    [activeFilter, classrooms]
  );
  const selected = activeClassroom || visibleClassrooms[0];

  const filteredClasswork = classwork.filter((item) => classworkFilter === 'All' || item.topic === classworkFilter);

  function createClassroom(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.subject.trim() || !form.grade.trim() || !form.code.trim())
      return setError('Complete all fields before creating the classroom.');
    const next = {
      name: `${form.grade} · ${form.subject}`,
      code: form.code.toUpperCase(),
      students: 0,
      next: 'Add your first lesson',
      progress: 0,
      tone: 'violet',
    };
    setClassrooms((items) => [next, ...items]);
    setActiveClassroom(next);
    setActiveTab('Stream');
    setIsCreateOpen(false);
    setForm({ name: '', subject: '', grade: '', code: '' });
    setError('');
  }

  function createTopic(event) {
    event.preventDefault();
    const nextTopic = topicName.trim();
    if (!nextTopic || topics.includes(nextTopic)) return;
    setTopics((items) => [...items, nextTopic]);
    setClassworkFilter(nextTopic);
    setTopicName('');
  }

  function createClasswork(event) {
    event.preventDefault();
    if (!classworkForm.title.trim()) return setClassworkError('Add a title before saving this classwork.');
    const nextItem = {
      id: Date.now(),
      title: classworkForm.title.trim(),
      type: classworkForm.type,
      topic: classworkForm.topic,
      due: classworkForm.due || 'No due date',
      points: classworkForm.type === 'Material' ? null : Number(classworkForm.points) || 0,
      status: 'Draft',
      icon: classworkTypes.find((item) => item.label === classworkForm.type)?.icon || FileText,
    };
    setClasswork((items) => [nextItem, ...items]);
    setClassworkForm({ title: '', type: 'Assignment', topic: topics[0], due: '', points: '20' });
    setClassworkError('');
    setIsClassworkOpen(false);
    setActiveTab('Classwork');
  }

  function updateClassworkStatus(id, status) {
    setClasswork((items) => items.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  return (
    <main className="classroom-shell">
      <header className="classroom-topbar">
        <div className="classroom-breadcrumb">
          <Link to="/admin">Workspace</Link>
          <span>/</span>
          <strong>Digital Classroom</strong>
        </div>
        <div className="classroom-top-actions">
          <span className="live-dot" />
          <span>All systems operational</span>
          <button className="classroom-avatar" aria-label="Open profile">
            SA
          </button>
        </div>
      </header>
      <section className="classroom-hero">
        <div>
          <p className="eyebrow">Digital Classroom</p>
          <h1>Make every lesson count.</h1>
          <p className="hero-copy">
            Your teaching day, organized around preparation, participation, and progress.
          </p>
        </div>
        <button className="primary-action" onClick={() => setIsCreateOpen(true)}>
          <Plus data-icon="inline-start" /> Create classroom
        </button>
      </section>
      <section className="classroom-stat-grid" aria-label="Classroom overview">
        <article className="classroom-stat">
          <span className="stat-icon violet">
            <Users />
          </span>
          <div>
            <strong>{classrooms.reduce((sum, item) => sum + item.students, 0)}</strong>
            <span>Active learners</span>
          </div>
          <small>+8% this term</small>
        </article>
        <article className="classroom-stat">
          <span className="stat-icon cyan">
            <BookOpen />
          </span>
          <div>
            <strong>14</strong>
            <span>Lessons this week</span>
          </div>
          <small>3 need review</small>
        </article>
        <article className="classroom-stat">
          <span className="stat-icon amber">
            <CheckCircle2 />
          </span>
          <div>
            <strong>76%</strong>
            <span>Avg. completion</span>
          </div>
          <small>+12% vs. last week</small>
        </article>
        <article className="classroom-stat">
          <span className="stat-icon rose">
            <Clock3 />
          </span>
          <div>
            <strong>2</strong>
            <span>Items needing attention</span>
          </div>
          <small>Due today</small>
        </article>
      </section>
      {selected && (
        <section className="classroom-detail">
          <div className="detail-header">
            <button className="back-action" onClick={() => setActiveClassroom(null)}>
              <ArrowLeft /> All classrooms
            </button>
            <div>
              <p className="eyebrow">
                {selected.code} · {selected.students} students
              </p>
              <h2>{selected.name}</h2>
            </div>
            <button className="secondary-action detail-action">
              Manage classroom <ArrowRight />
            </button>
          </div>
          <nav className="detail-tabs" aria-label="Classroom sections">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={activeTab === tab ? 'detail-tab active' : 'detail-tab'}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </nav>
          {activeTab === 'Classwork' ? (
            <div className="classwork-workspace">
              <div className="classwork-toolbar">
                <div>
                  <p className="eyebrow">Content library</p>
                  <h3>Everything learners need, in order.</h3>
                </div>
                <button className="primary-action" onClick={() => setIsClassworkOpen(true)}><Plus data-icon="inline-start" /> Create classwork</button>
              </div>
              <div className="classwork-filters">
                {['All', ...topics].map((filter) => <button key={filter} className={classworkFilter === filter ? 'filter-chip active' : 'filter-chip'} onClick={() => setClassworkFilter(filter)}>{filter}</button>)}
              </div>
              <div className="classwork-list">
                {topics.filter((topic) => classworkFilter === 'All' || topic === classworkFilter).map((topic) => (
                  <section className="topic-section" key={topic}>
                    <div className="topic-heading"><h4>{topic}</h4><span>{filteredClasswork.filter((item) => item.topic === topic).length} items</span></div>
                    {filteredClasswork.filter((item) => item.topic === topic).map(({ id, title, type, due, points, status, icon: Icon }) => (
                      <article className="classwork-item" key={id}>
                        <span className="classwork-icon"><Icon /></span>
                        <div className="classwork-item-main"><div className="classwork-title-row"><div><span className="item-type">{type}</span><h4>{title}</h4></div><span className={`status-badge ${status.toLowerCase()}`}>{status}</span></div><p>{due}{points ? ` · ${points} points` : ''}</p></div>
                        <button className="text-action" onClick={() => updateClassworkStatus(id, status === 'Archived' ? 'Draft' : 'Archived')}>{status === 'Archived' ? <RotateCcw /> : 'Archive'}</button>
                      </article>
                    ))}
                  </section>
                ))}
              </div>
              <form className="topic-create" onSubmit={createTopic}><input aria-label="New topic name" value={topicName} onChange={(event) => setTopicName(event.target.value)} placeholder="Add a topic" /><button className="secondary-action" type="submit"><Plus /> Topic</button></form>
            </div>
          ) : (
            <div className="detail-body">
              <div><p className="eyebrow">{activeTab}</p><h3>{activeTab === 'Stream' ? 'Keep your classroom moving.' : `${activeTab} is ready for your classroom.`}</h3><p className="detail-copy">{activeTab === 'Stream' ? 'Share an update, surface important work, and keep learners aligned from one calm command center.' : 'This workspace will connect to the classroom records and workflows in the next implementation slice.'}</p><button className="primary-action"><Plus /> {activeTab === 'Classwork' ? 'Create classwork' : 'Post an update'}</button></div><div className="detail-placeholder"><LayoutDashboard /><strong>{selected.progress}% course progress</strong><span>{selected.next}</span></div>
            </div>
          )}
        </section>
      )}
      <div className="classroom-content-grid">
        <section className="classroom-panel classrooms-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Your teaching spaces</p>
              <h2>Classrooms</h2>
            </div>
            <button className="text-action" onClick={() => setActiveFilter('All classrooms')}>
              View all <ArrowRight />
            </button>
          </div>
          <div className="filter-row">
            {['All classrooms', 'Mathematics', 'Science'].map((filter) => (
              <button
                key={filter}
                className={activeFilter === filter ? 'filter-chip active' : 'filter-chip'}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="classroom-list">
            {visibleClassrooms.map((item) => (
              <article
                className="classroom-card"
                key={item.code}
                onClick={() => setActiveClassroom(item)}
              >
                <div className={`classroom-card-mark ${item.tone}`}>
                  <LayoutDashboard />
                </div>
                <div className="classroom-card-main">
                  <div className="card-title-row">
                    <div>
                      <h3>{item.name}</h3>
                      <span>
                        {item.code} · {item.students} students
                      </span>
                    </div>
                    <button
                      className="more-button"
                      aria-label={`Open ${item.name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setActiveClassroom(item);
                      }}
                    >
                      ···
                    </button>
                  </div>
                  <div className="next-lesson">
                    <span>Next up</span>
                    <strong>{item.next}</strong>
                  </div>
                  <div className="progress-line">
                    <span style={{ width: `${item.progress}%` }} />
                  </div>
                  <div className="progress-meta">
                    <span>{item.progress}% course progress</span>
                    <span>
                      Open classroom <ArrowRight />
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
        <aside className="classroom-panel upcoming-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Stay ahead</p>
              <h2>Upcoming work</h2>
            </div>
            <CalendarDays />
          </div>
          <div className="upcoming-list">
            {upcoming.map(({ title, className, due, type, icon: Icon }) => (
              <article className="upcoming-item" key={title}>
                <span className="upcoming-icon">
                  <Icon />
                </span>
                <div>
                  <span className="item-type">{type}</span>
                  <h3>{title}</h3>
                  <p>{className}</p>
                  <small>
                    <Clock3 /> {due}
                  </small>
                </div>
              </article>
            ))}
          </div>
          <button className="secondary-action">
            Open lesson planner <ArrowRight data-icon="inline-end" />
          </button>
        </aside>
      </div>
      {isClassworkOpen && (
        <div className="modal-backdrop" role="presentation">
          <section className="create-modal classwork-modal" role="dialog" aria-modal="true" aria-labelledby="create-classwork-title">
            <button className="modal-close" aria-label="Close create classwork dialog" onClick={() => setIsClassworkOpen(false)}><X /></button>
            <p className="eyebrow">New classwork</p><h2 id="create-classwork-title">Create something for learners.</h2><p className="modal-copy">Start with the essentials. You can add instructions and attachments in the next step.</p>
            <form onSubmit={createClasswork} className="create-form">
              <label>Title<input autoFocus value={classworkForm.title} onChange={(event) => setClassworkForm({ ...classworkForm, title: event.target.value })} placeholder="e.g. Linear equations practice" /></label>
              <div className="type-picker">{classworkTypes.map(({ label, icon: Icon, description }) => <button type="button" key={label} className={classworkForm.type === label ? 'type-option active' : 'type-option'} onClick={() => setClassworkForm({ ...classworkForm, type: label })}><Icon /><strong>{label}</strong><span>{description}</span></button>)}</div>
              <div className="form-row"><label>Topic<select value={classworkForm.topic} onChange={(event) => setClassworkForm({ ...classworkForm, topic: event.target.value })}>{topics.map((topic) => <option key={topic}>{topic}</option>)}</select></label><label>Due date<input type="text" value={classworkForm.due} onChange={(event) => setClassworkForm({ ...classworkForm, due: event.target.value })} placeholder="Fri, 3:30 PM" /></label></div>
              {classworkForm.type !== 'Material' && <label>Points<input type="number" min="0" value={classworkForm.points} onChange={(event) => setClassworkForm({ ...classworkForm, points: event.target.value })} /></label>}
              {classworkError && <p className="form-error" role="alert">{classworkError}</p>}
              <button className="primary-action" type="submit">Save as draft <ArrowRight /></button>
            </form>
          </section>
        </div>
      )}
      {isCreateOpen && (
        <div className="modal-backdrop" role="presentation">
          <section
            className="create-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-classroom-title"
          >
            <button
              className="modal-close"
              aria-label="Close create classroom dialog"
              onClick={() => setIsCreateOpen(false)}
            >
              <X />
            </button>
            <p className="eyebrow">New teaching space</p>
            <h2 id="create-classroom-title">Create a classroom</h2>
            <p className="modal-copy">
              Set up the academic structure now. You can invite learners and add content next.
            </p>
            <form onSubmit={createClassroom} className="create-form">
              <label>
                Classroom name
                <input
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="e.g. A section"
                />
              </label>
              <div className="form-row">
                <label>
                  Grade
                  <input
                    value={form.grade}
                    onChange={(event) => setForm({ ...form, grade: event.target.value })}
                    placeholder="Grade 8"
                  />
                </label>
                <label>
                  Subject
                  <input
                    value={form.subject}
                    onChange={(event) => setForm({ ...form, subject: event.target.value })}
                    placeholder="Mathematics"
                  />
                </label>
              </div>
              <label>
                Class code
                <input
                  value={form.code}
                  onChange={(event) => setForm({ ...form, code: event.target.value })}
                  placeholder="MTH-8A"
                />
              </label>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <button className="primary-action" type="submit">
                Create classroom <ArrowRight />
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
export default ClassroomDashboard;
