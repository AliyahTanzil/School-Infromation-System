import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Archive,
  ClipboardCheck,
  Clock3,
  Eye,
  FileText,
  Folder,
  History,
  Link2,
  Search,
  Share2,
  Upload,
  HelpCircle,
  LayoutDashboard,
  Plus,
  Presentation,
  RotateCcw,
  Send,
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
const tabs = ['Stream', 'Classwork', 'Materials', 'People', 'Grades', 'Analytics'];
const initialMaterials = [
  {
    id: 1,
    name: 'Unit 1 reference sheet',
    kind: 'PDF',
    folder: 'Algebraic expressions',
    size: '2.4 MB',
    updated: 'Today, 9:12 AM',
    shared: true,
    archived: false,
    version: 3,
  },
  {
    id: 2,
    name: 'Linear equations lesson',
    kind: 'Presentation',
    folder: 'Algebraic expressions',
    size: '8 slides',
    updated: 'Yesterday',
    shared: true,
    archived: false,
    version: 2,
  },
  {
    id: 3,
    name: 'Practice problems',
    kind: 'Document',
    folder: 'Practice & review',
    size: '640 KB',
    updated: 'Mon, 3:44 PM',
    shared: false,
    archived: false,
    version: 1,
  },
  {
    id: 4,
    name: 'Old diagnostic answers',
    kind: 'PDF',
    folder: 'Archive',
    size: '1.1 MB',
    updated: 'Aug 08',
    shared: false,
    archived: true,
    version: 1,
  },
];
const initialTopics = ['Algebraic expressions', 'Practice & review', 'Resources'];
const initialClasswork = [
  {
    id: 1,
    title: 'Algebraic expressions',
    type: 'Assignment',
    topic: 'Algebraic expressions',
    due: 'Today, 3:30 PM',
    points: 20,
    status: 'Published',
    icon: FileText,
  },
  {
    id: 2,
    title: 'Expression vocabulary',
    type: 'Material',
    topic: 'Algebraic expressions',
    due: 'No due date',
    points: null,
    status: 'Published',
    icon: Presentation,
  },
  {
    id: 3,
    title: 'Fractions checkpoint',
    type: 'Quiz',
    topic: 'Practice & review',
    due: 'Fri, 11:30 AM',
    points: 15,
    status: 'Scheduled',
    icon: HelpCircle,
  },
  {
    id: 4,
    title: 'Unit 1 reference sheet',
    type: 'Material',
    topic: 'Resources',
    due: 'No due date',
    points: null,
    status: 'Draft',
    icon: FileText,
  },
];
const initialSubmissions = [
  {
    id: 1,
    student: 'Maya Johnson',
    initials: 'MJ',
    status: 'Submitted',
    submittedAt: 'Today, 2:48 PM',
    content: 'I simplified the expression to 4x + 7 and checked it with substitution.',
    grade: null,
    feedback: '',
  },
  {
    id: 2,
    student: 'Daniel Mensah',
    initials: 'DM',
    status: 'Needs revision',
    submittedAt: 'Yesterday, 4:12 PM',
    content: 'My first step is complete, but I need to review combining like terms.',
    grade: null,
    feedback: 'Show the combining-like-terms step before simplifying.',
  },
  {
    id: 3,
    student: 'Ava Williams',
    initials: 'AW',
    status: 'Returned',
    submittedAt: 'Mon, 9:20 AM',
    content: 'The final answer is 12 when x = 2.',
    grade: 18,
    feedback: 'Clear reasoning and a well-labeled check.',
  },
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
  const [classworkForm, setClassworkForm] = useState({
    title: '',
    type: 'Assignment',
    topic: initialTopics[0],
    due: '',
    points: '20',
  });
  const [topicName, setTopicName] = useState('');
  const [classworkError, setClassworkError] = useState('');
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [studentSubmission, setStudentSubmission] = useState({ content: '', link: '' });
  const [studentSaveState, setStudentSaveState] = useState('Not started');
  const [teacherFeedback, setTeacherFeedback] = useState('');
  const [teacherGrade, setTeacherGrade] = useState('');
  const [materials, setMaterials] = useState(initialMaterials);
  const [materialQuery, setMaterialQuery] = useState('');
  const [materialFolder, setMaterialFolder] = useState('All materials');
  const [materialDialog, setMaterialDialog] = useState(null);
  const [materialForm, setMaterialForm] = useState({
    name: '',
    kind: 'Document',
    folder: 'Algebraic expressions',
  });
  const visibleClassrooms = useMemo(
    () =>
      activeFilter === 'All classrooms'
        ? classrooms
        : classrooms.filter((item) => item.name.includes(activeFilter)),
    [activeFilter, classrooms]
  );
  const selected = activeClassroom || visibleClassrooms[0];

  const filteredClasswork = classwork.filter(
    (item) => classworkFilter === 'All' || item.topic === classworkFilter
  );

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
    if (!classworkForm.title.trim())
      return setClassworkError('Add a title before saving this classwork.');
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

  function saveStudentDraft(event) {
    event.preventDefault();
    setStudentSaveState('Draft saved just now');
  }

  function submitStudentWork(event) {
    event.preventDefault();
    if (!studentSubmission.content.trim())
      return setStudentSaveState('Add a response before submitting.');
    setSubmissions((items) => [
      {
        id: Date.now(),
        student: 'You',
        initials: 'SA',
        status: 'Submitted',
        submittedAt: 'Just now',
        content: studentSubmission.content.trim(),
        grade: null,
        feedback: '',
      },
      ...items,
    ]);
    setStudentSaveState('Submitted for review');
  }

  function openSubmission(submission) {
    setSelectedSubmission(submission);
    setTeacherGrade(submission.grade ?? '');
    setTeacherFeedback(submission.feedback || '');
  }

  const materialFolders = [
    'All materials',
    'Algebraic expressions',
    'Practice & review',
    'Archive',
  ];
  const visibleMaterials = materials.filter((item) => {
    const matchesQuery = item.name.toLowerCase().includes(materialQuery.toLowerCase());
    const matchesFolder = materialFolder === 'All materials' || item.folder === materialFolder;
    return matchesQuery && matchesFolder;
  });

  function createMaterial(event) {
    event.preventDefault();
    if (!materialForm.name.trim()) return;
    setMaterials((items) => [
      {
        id: Date.now(),
        name: materialForm.name.trim(),
        kind: materialForm.kind,
        folder: materialForm.folder,
        size: 'Local draft',
        updated: 'Just now',
        shared: false,
        archived: false,
        version: 1,
      },
      ...items,
    ]);
    setMaterialForm({ name: '', kind: 'Document', folder: 'Algebraic expressions' });
    setMaterialDialog(null);
  }

  function toggleMaterialArchive(id) {
    setMaterials((items) =>
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              archived: !item.archived,
              folder: item.archived ? 'Algebraic expressions' : 'Archive',
            }
          : item
      )
    );
  }

  function returnSubmission(status) {
    if (!selectedSubmission) return;
    setSubmissions((items) =>
      items.map((item) =>
        item.id === selectedSubmission.id
          ? {
              ...item,
              status,
              grade: teacherGrade ? Number(teacherGrade) : item.grade,
              feedback: teacherFeedback,
            }
          : item
      )
    );
    setSelectedSubmission(null);
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
          {activeTab === 'Materials' ? (
            <div className="materials-workspace">
              <div className="materials-toolbar">
                <div>
                  <p className="eyebrow">Materials repository</p>
                  <h3>One home for every lesson asset.</h3>
                  <p className="detail-copy">
                    Store, organize, and reference resources across your classrooms.
                  </p>
                </div>
                <div className="materials-actions">
                  <button className="secondary-action" onClick={() => setMaterialDialog('link')}>
                    <Link2 /> Add link
                  </button>
                  <button className="primary-action" onClick={() => setMaterialDialog('upload')}>
                    <Upload /> Upload material
                  </button>
                </div>
              </div>
              <div className="materials-search-row">
                <label className="materials-search">
                  <Search />
                  <input
                    aria-label="Search materials"
                    value={materialQuery}
                    onChange={(event) => setMaterialQuery(event.target.value)}
                    placeholder="Search materials..."
                  />
                </label>
                <div className="folder-pills">
                  {materialFolders.map((folder) => (
                    <button
                      key={folder}
                      className={materialFolder === folder ? 'filter-chip active' : 'filter-chip'}
                      onClick={() => setMaterialFolder(folder)}
                    >
                      {folder}
                    </button>
                  ))}
                </div>
              </div>
              <div className="materials-breadcrumb">
                <Folder /> Workspace / Digital Classroom / <strong>{materialFolder}</strong>
              </div>
              <div className="materials-list">
                {visibleMaterials.map((item) => (
                  <article className="material-row" key={item.id}>
                    <span className={`material-kind ${item.kind.toLowerCase()}`}>
                      {item.kind === 'PDF' ? 'PDF' : item.kind === 'Presentation' ? 'P' : 'D'}
                    </span>
                    <div className="material-main">
                      <div>
                        <h4>{item.name}</h4>
                        <span>
                          {item.kind} · {item.size} · v{item.version}
                        </span>
                      </div>
                      <small>{item.updated}</small>
                    </div>
                    <span className={item.shared ? 'shared-label' : 'private-label'}>
                      {item.shared ? 'Shared' : 'Private'}
                    </span>
                    <div className="material-row-actions">
                      <button
                        aria-label={`Preview ${item.name}`}
                        onClick={() => setMaterialDialog({ type: 'preview', item })}
                      >
                        <Eye />
                      </button>
                      <button
                        aria-label={`Share ${item.name}`}
                        onClick={() => setMaterialDialog({ type: 'share', item })}
                      >
                        <Share2 />
                      </button>
                      <button
                        aria-label={`${item.archived ? 'Restore' : 'Archive'} ${item.name}`}
                        onClick={() => toggleMaterialArchive(item.id)}
                      >
                        <Archive />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              <div className="materials-footer">
                <span>{visibleMaterials.length} materials shown</span>
                <span>
                  <History /> Version history is available from preview.
                </span>
              </div>
            </div>
          ) : activeTab === 'Classwork' ? (
            <div className="classwork-workspace">
              <div className="classwork-toolbar">
                <div className="assignment-mode-switch">
                  <button
                    className={activeTab === 'Classwork' ? 'filter-chip active' : 'filter-chip'}
                    onClick={() => setActiveTab('Classwork')}
                  >
                    Teacher view
                  </button>
                  <button className="filter-chip" onClick={() => setActiveTab('Classwork')}>
                    Student preview
                  </button>
                </div>
                <div>
                  <p className="eyebrow">Content library</p>
                  <h3>Everything learners need, in order.</h3>
                </div>
                <button className="primary-action" onClick={() => setIsClassworkOpen(true)}>
                  <Plus data-icon="inline-start" /> Create classwork
                </button>
              </div>
              <div className="classwork-filters">
                {['All', ...topics].map((filter) => (
                  <button
                    key={filter}
                    className={classworkFilter === filter ? 'filter-chip active' : 'filter-chip'}
                    onClick={() => setClassworkFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <div className="classwork-list">
                {topics
                  .filter((topic) => classworkFilter === 'All' || topic === classworkFilter)
                  .map((topic) => (
                    <section className="topic-section" key={topic}>
                      <div className="topic-heading">
                        <h4>{topic}</h4>
                        <span>
                          {filteredClasswork.filter((item) => item.topic === topic).length} items
                        </span>
                      </div>
                      {filteredClasswork
                        .filter((item) => item.topic === topic)
                        .map(({ id, title, type, due, points, status, icon: Icon }) => (
                          <article className="classwork-item" key={id}>
                            <span className="classwork-icon">
                              <Icon />
                            </span>
                            <div className="classwork-item-main">
                              <div className="classwork-title-row">
                                <div>
                                  <span className="item-type">{type}</span>
                                  <h4>{title}</h4>
                                </div>
                                <span className={`status-badge ${status.toLowerCase()}`}>
                                  {status}
                                </span>
                              </div>
                              <p>
                                {due}
                                {points ? ` · ${points} points` : ''}
                              </p>
                            </div>
                            <button
                              className="text-action"
                              onClick={() =>
                                updateClassworkStatus(
                                  id,
                                  status === 'Archived' ? 'Draft' : 'Archived'
                                )
                              }
                            >
                              {status === 'Archived' ? <RotateCcw /> : 'Archive'}
                            </button>
                          </article>
                        ))}
                    </section>
                  ))}
              </div>
              <section className="submission-panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Assignment lifecycle</p>
                    <h3>Algebraic expressions</h3>
                  </div>
                  <span className="status-badge published">Published</span>
                </div>
                <div className="submission-summary">
                  <span>
                    <strong>{submissions.length}</strong> submissions
                  </span>
                  <span>
                    <strong>
                      {submissions.filter((item) => item.status === 'Submitted').length}
                    </strong>{' '}
                    awaiting review
                  </span>
                  <span>
                    <strong>20</strong> points
                  </span>
                </div>
                <div className="submission-list">
                  {submissions.map((submission) => (
                    <button
                      className="submission-row"
                      key={submission.id}
                      onClick={() => openSubmission(submission)}
                    >
                      <span className="student-avatar">{submission.initials}</span>
                      <span className="submission-person">
                        <strong>{submission.student}</strong>
                        <small>{submission.submittedAt}</small>
                      </span>
                      <span
                        className={`status-badge ${submission.status === 'Needs revision' ? 'draft' : submission.status === 'Returned' ? 'published' : 'scheduled'}`}
                      >
                        {submission.status}
                      </span>
                      <ArrowRight />
                    </button>
                  ))}
                </div>
              </section>
              <section className="student-submit-card">
                <div>
                  <p className="eyebrow">Student preview</p>
                  <h3>Submit your response</h3>
                  <p>Save a draft, then submit it when you are ready for teacher review.</p>
                </div>
                <form onSubmit={submitStudentWork} className="student-submit-form">
                  <textarea
                    aria-label="Student response"
                    value={studentSubmission.content}
                    onChange={(event) =>
                      setStudentSubmission({ ...studentSubmission, content: event.target.value })
                    }
                    placeholder="Write your response here..."
                  />
                  <div className="student-submit-actions">
                    <span>{studentSaveState}</span>
                    <button className="secondary-action" type="button" onClick={saveStudentDraft}>
                      Save draft
                    </button>
                    <button className="primary-action" type="submit">
                      <Send /> Submit work
                    </button>
                  </div>
                </form>
              </section>
              <form className="topic-create" onSubmit={createTopic}>
                <input
                  aria-label="New topic name"
                  value={topicName}
                  onChange={(event) => setTopicName(event.target.value)}
                  placeholder="Add a topic"
                />
                <button className="secondary-action" type="submit">
                  <Plus /> Topic
                </button>
              </form>
            </div>
          ) : (
            <div className="detail-body">
              <div>
                <p className="eyebrow">{activeTab}</p>
                <h3>
                  {activeTab === 'Stream'
                    ? 'Keep your classroom moving.'
                    : `${activeTab} is ready for your classroom.`}
                </h3>
                <p className="detail-copy">
                  {activeTab === 'Stream'
                    ? 'Share an update, surface important work, and keep learners aligned from one calm command center.'
                    : 'This workspace will connect to the classroom records and workflows in the next implementation slice.'}
                </p>
                <button className="primary-action">
                  <Plus /> {activeTab === 'Classwork' ? 'Create classwork' : 'Post an update'}
                </button>
              </div>
              <div className="detail-placeholder">
                <LayoutDashboard />
                <strong>{selected.progress}% course progress</strong>
                <span>{selected.next}</span>
              </div>
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
      {materialDialog && materialDialog.type === 'preview' && (
        <div className="modal-backdrop" role="presentation">
          <section className="create-modal material-preview" role="dialog" aria-modal="true">
            <button
              className="modal-close"
              aria-label="Close material preview"
              onClick={() => setMaterialDialog(null)}
            >
              <X />
            </button>
            <p className="eyebrow">Material preview</p>
            <h2>{materialDialog.item.name}</h2>
            <p className="modal-copy">
              {materialDialog.item.kind} · Version {materialDialog.item.version} · Updated{' '}
              {materialDialog.item.updated}
            </p>
            <div className="preview-canvas">
              <FileText />
              <strong>Preview ready</strong>
              <span>Reference this material from Classwork or share it with your classroom.</span>
            </div>
            <div className="review-actions">
              <button
                className="secondary-action"
                onClick={() => setMaterialDialog({ type: 'share', item: materialDialog.item })}
              >
                <Share2 /> Share
              </button>
              <button className="primary-action" onClick={() => setMaterialDialog(null)}>
                Use in classwork <ArrowRight />
              </button>
            </div>
          </section>
        </div>
      )}
      {materialDialog && (materialDialog.type === 'upload' || materialDialog === 'link') && (
        <div className="modal-backdrop" role="presentation">
          <section className="create-modal" role="dialog" aria-modal="true">
            <button
              className="modal-close"
              aria-label="Close material dialog"
              onClick={() => setMaterialDialog(null)}
            >
              <X />
            </button>
            <p className="eyebrow">
              {materialDialog === 'link' ? 'Add a link' : 'Upload material'}
            </p>
            <h2>Add to your repository.</h2>
            <p className="modal-copy">
              Create a local material record now; storage and sharing policies can be connected
              later.
            </p>
            <form className="create-form" onSubmit={createMaterial}>
              <label>
                Name
                <input
                  autoFocus
                  value={materialForm.name}
                  onChange={(event) =>
                    setMaterialForm({ ...materialForm, name: event.target.value })
                  }
                  placeholder="e.g. Week 4 study guide"
                />
              </label>
              <div className="form-row">
                <label>
                  Type
                  <select
                    value={materialForm.kind}
                    onChange={(event) =>
                      setMaterialForm({ ...materialForm, kind: event.target.value })
                    }
                  >
                    <option>Document</option>
                    <option>PDF</option>
                    <option>Presentation</option>
                    <option>Link</option>
                  </select>
                </label>
                <label>
                  Folder
                  <select
                    value={materialForm.folder}
                    onChange={(event) =>
                      setMaterialForm({ ...materialForm, folder: event.target.value })
                    }
                  >
                    {materialFolders.slice(1, 3).map((folder) => (
                      <option key={folder}>{folder}</option>
                    ))}
                  </select>
                </label>
              </div>
              <button className="primary-action" type="submit">
                Save material <ArrowRight />
              </button>
            </form>
          </section>
        </div>
      )}
      {materialDialog && materialDialog.type === 'share' && (
        <div className="modal-backdrop" role="presentation">
          <section className="create-modal" role="dialog" aria-modal="true">
            <button
              className="modal-close"
              aria-label="Close share dialog"
              onClick={() => setMaterialDialog(null)}
            >
              <X />
            </button>
            <p className="eyebrow">Sharing & permissions</p>
            <h2>Share {materialDialog.item.name}</h2>
            <p className="modal-copy">Choose who can use this material in their classroom.</p>
            <div className="share-options">
              <button className="type-option active">
                <Users />
                <strong>Classroom members</strong>
                <span>Can view and reference this material.</span>
              </button>
              <button className="type-option">
                <Eye />
                <strong>Teachers only</strong>
                <span>Keep editing access limited to staff.</span>
              </button>
            </div>
            <button className="primary-action" onClick={() => setMaterialDialog(null)}>
              Save permissions <CheckCircle2 />
            </button>
          </section>
        </div>
      )}
      {selectedSubmission && (
        <div className="modal-backdrop" role="presentation">
          <section
            className="create-modal review-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-title"
          >
            <button
              className="modal-close"
              aria-label="Close submission review"
              onClick={() => setSelectedSubmission(null)}
            >
              <X />
            </button>
            <p className="eyebrow">Teacher review</p>
            <h2 id="review-title">{selectedSubmission.student}&apos;s submission</h2>
            <p className="modal-copy">{selectedSubmission.submittedAt} · Algebraic expressions</p>
            <div className="student-response">
              <span>Response</span>
              <p>{selectedSubmission.content}</p>
            </div>
            <div className="form-row">
              <label>
                Grade
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={teacherGrade}
                  onChange={(event) => setTeacherGrade(event.target.value)}
                  placeholder="/ 20"
                />
              </label>
              <label>
                Status
                <select
                  value={selectedSubmission.status}
                  onChange={(event) =>
                    setSubmissions((items) =>
                      items.map((item) =>
                        item.id === selectedSubmission.id
                          ? { ...item, status: event.target.value }
                          : item
                      )
                    )
                  }
                >
                  <option>Submitted</option>
                  <option>Needs revision</option>
                  <option>Returned</option>
                </select>
              </label>
            </div>
            <label>
              Feedback
              <textarea
                value={teacherFeedback}
                onChange={(event) => setTeacherFeedback(event.target.value)}
                placeholder="Add a helpful note for the learner..."
              />
            </label>
            <div className="review-actions">
              <button
                className="secondary-action"
                onClick={() => returnSubmission('Needs revision')}
              >
                Return for revision
              </button>
              <button className="primary-action" onClick={() => returnSubmission('Returned')}>
                Return graded work <CheckCircle2 />
              </button>
            </div>
          </section>
        </div>
      )}
      {isClassworkOpen && (
        <div className="modal-backdrop" role="presentation">
          <section
            className="create-modal classwork-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-classwork-title"
          >
            <button
              className="modal-close"
              aria-label="Close create classwork dialog"
              onClick={() => setIsClassworkOpen(false)}
            >
              <X />
            </button>
            <p className="eyebrow">New classwork</p>
            <h2 id="create-classwork-title">Create something for learners.</h2>
            <p className="modal-copy">
              Start with the essentials. You can add instructions and attachments in the next step.
            </p>
            <form onSubmit={createClasswork} className="create-form">
              <label>
                Title
                <input
                  autoFocus
                  value={classworkForm.title}
                  onChange={(event) =>
                    setClassworkForm({ ...classworkForm, title: event.target.value })
                  }
                  placeholder="e.g. Linear equations practice"
                />
              </label>
              <div className="type-picker">
                {classworkTypes.map(({ label, icon: Icon, description }) => (
                  <button
                    type="button"
                    key={label}
                    className={classworkForm.type === label ? 'type-option active' : 'type-option'}
                    onClick={() => setClassworkForm({ ...classworkForm, type: label })}
                  >
                    <Icon />
                    <strong>{label}</strong>
                    <span>{description}</span>
                  </button>
                ))}
              </div>
              <div className="form-row">
                <label>
                  Topic
                  <select
                    value={classworkForm.topic}
                    onChange={(event) =>
                      setClassworkForm({ ...classworkForm, topic: event.target.value })
                    }
                  >
                    {topics.map((topic) => (
                      <option key={topic}>{topic}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Due date
                  <input
                    type="text"
                    value={classworkForm.due}
                    onChange={(event) =>
                      setClassworkForm({ ...classworkForm, due: event.target.value })
                    }
                    placeholder="Fri, 3:30 PM"
                  />
                </label>
              </div>
              {classworkForm.type !== 'Material' && (
                <label>
                  Points
                  <input
                    type="number"
                    min="0"
                    value={classworkForm.points}
                    onChange={(event) =>
                      setClassworkForm({ ...classworkForm, points: event.target.value })
                    }
                  />
                </label>
              )}
              {classworkError && (
                <p className="form-error" role="alert">
                  {classworkError}
                </p>
              )}
              <button className="primary-action" type="submit">
                Save as draft <ArrowRight />
              </button>
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
