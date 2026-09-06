import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Archive, CalendarDays, Plus, RefreshCw, UserPlus, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from './api/auth.js';
import './digital-classroom.css';

const emptyClassroom = { name: '', code: '', description: '', classId: '' };
const emptyMember = { userId: '', role: 'STUDENT' };
const errorMessage = (error) =>
  error.response?.data?.error?.message || error.message || 'Request failed';

export default function ClassroomDashboard() {
  const [academicClasses, setAcademicClasses] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyClassroom);
  const [member, setMember] = useState(emptyMember);
  const [stream, setStream] = useState({ announcements: [], posts: [] });
  const [announcement, setAnnouncement] = useState({ title: '', body: '', status: 'PUBLISHED' });
  const [postBody, setPostBody] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [material, setMaterial] = useState({ title: '', description: '', file: null });
  const [assignment, setAssignment] = useState({
    title: '',
    description: '',
    topic: '',
    type: 'ASSIGNMENT',
    dueAt: '',
    points: '0',
  });
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const headers = {};
  const load = useCallback(async () => {
    setBusy(true);
    try {
      const response = await api.get('/lms/classrooms');
      setClassrooms(response.data.data);
      setNotice('');
    } catch (error) {
      setNotice(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    load();
    api
      .get('/classes')
      .then(({ data }) => setAcademicClasses(data.data?.items ?? []))
      .catch(() => {});
  }, [load]);

  async function createClassroom(event) {
    event.preventDefault();
    try {
      await api.post(
        '/lms/classrooms',
        { ...form, code: form.code || undefined, classId: form.classId || undefined },
        { headers }
      );
      setForm(emptyClassroom);
      setNotice('Digital classroom created.');
      await load();
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }

  async function openClassroom(id) {
    try {
      const calendarStart = new Date();
      const calendarEnd = new Date(calendarStart);
      calendarEnd.setDate(calendarEnd.getDate() + 90);
      const [
        classroomResponse,
        streamResponse,
        assignmentResponse,
        materialResponse,
        calendarResponse,
      ] = await Promise.all([
        api.get(`/lms/classrooms/${id}`, { headers }),
        api.get(`/lms/classroom-stream/${id}`, { headers }),
        api.get('/lms/assignments', { headers, params: { classroomId: id } }),
        api.get('/lms/materials', { headers, params: { classroomId: id } }),
        api.get('/lms/calendar', {
          headers,
          params: {
            classroomId: id,
            start: calendarStart.toISOString(),
            end: calendarEnd.toISOString(),
          },
        }),
      ]);
      setSelected(classroomResponse.data.data);
      setStream(streamResponse.data.data);
      setAssignments(assignmentResponse.data.data);
      setMaterials(materialResponse.data.data);
      setCalendarEvents(calendarResponse.data.data);
      setNotice('');
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }

  async function publishAnnouncement(event) {
    event.preventDefault();
    try {
      await api.post(`/lms/classroom-stream/${selected.id}/announcements`, announcement, {
        headers,
      });
      setAnnouncement({ title: '', body: '', status: 'PUBLISHED' });
      await openClassroom(selected.id);
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }

  async function publishPost(event) {
    event.preventDefault();
    try {
      await api.post(
        `/lms/classroom-stream/${selected.id}/posts`,
        { body: postBody, attachments: [] },
        { headers }
      );
      setPostBody('');
      await openClassroom(selected.id);
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }

  async function createAssignment(event) {
    event.preventDefault();
    try {
      await api.post(
        '/lms/assignments',
        {
          ...assignment,
          classroomId: selected.id,
          dueAt: assignment.dueAt || undefined,
          points: Number(assignment.points),
        },
        { headers }
      );
      setAssignment({
        title: '',
        description: '',
        topic: '',
        type: 'ASSIGNMENT',
        dueAt: '',
        points: '0',
      });
      await openClassroom(selected.id);
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }

  async function changeAssignmentStatus(id, status) {
    try {
      await api.patch(`/lms/assignments/${id}/status`, { status }, { headers });
      await openClassroom(selected.id);
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }

  async function uploadMaterial(event) {
    event.preventDefault();
    if (!material.file) return setNotice('Choose a file to upload.');
    const data = new FormData();
    data.append('classroomId', selected.id);
    data.append('title', material.title || material.file.name);
    if (material.description) data.append('description', material.description);
    data.append('file', material.file);
    try {
      await api.post('/lms/materials', data, {
        headers: { ...headers, 'Content-Type': undefined },
      });
      setMaterial({ title: '', description: '', file: null });
      event.currentTarget.reset();
      setNotice('Material uploaded securely.');
      await openClassroom(selected.id);
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }

  async function downloadMaterial(item) {
    try {
      const response = await api.get(`/lms/materials/${item.id}/download`, {
        headers,
        responseType: 'blob',
      });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = item.title;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }

  async function archiveMaterial(id) {
    try {
      await api.patch(`/lms/materials/${id}/archive`, {}, { headers });
      setNotice('Material archived.');
      await openClassroom(selected.id);
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }

  async function addMember(event) {
    event.preventDefault();
    try {
      await api.post(`/lms/classrooms/${selected.id}/members`, member, { headers });
      setMember(emptyMember);
      setNotice('Member added.');
      await openClassroom(selected.id);
      await load();
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }

  async function archiveClassroom() {
    try {
      await api.patch(`/lms/classrooms/${selected.id}/archive`, {}, { headers });
      setSelected(null);
      setNotice('Classroom archived.');
      await load();
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }

  return (
    <main className="dc-shell">
      <header className="dc-header">
        <div>
          <Link className="dc-back" to="/admin">
            <ArrowLeft size={15} /> Back to main page
          </Link>
          <p className="dc-kicker">Digital classroom / foundation</p>
          <h1>Classrooms and memberships</h1>
          <p>Create secure learning spaces and control who can enter each classroom.</p>
        </div>
        <button className="dc-secondary" disabled={busy} onClick={load} type="button">
          <RefreshCw size={15} /> Refresh
        </button>
      </header>

      <section className="dc-context">
        <span>
          {classrooms.length} accessible classroom{classrooms.length === 1 ? '' : 's'}
        </span>
      </section>
      {notice && <div className="dc-notice">{notice}</div>}

      <div className="dc-grid">
        <section className="dc-panel">
          <h2>
            <Plus size={18} /> Create classroom
          </h2>
          <form className="dc-form" onSubmit={createClassroom}>
            <input
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Classroom name"
            />
            <input
              value={form.code}
              onChange={(event) => setForm({ ...form, code: event.target.value })}
              placeholder="Auto-generated if left blank"
            />
            <select
              aria-label="Academic class"
              value={form.classId}
              onChange={(event) => setForm({ ...form, classId: event.target.value })}
            >
              <option value="">No linked academic class</option>
              {academicClasses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Description"
            />
            <button className="dc-primary" disabled={busy} type="submit">
              Create classroom
            </button>
          </form>
        </section>

        <section className="dc-panel dc-directory">
          <h2>
            <Users size={18} /> Classroom directory
          </h2>
          {!notice && !busy && !classrooms.length && (
            <p>No classroom has been created for this school.</p>
          )}
          {classrooms.map((classroom) => (
            <button
              className="dc-row"
              key={classroom.id}
              onClick={() => openClassroom(classroom.id)}
              type="button"
            >
              <span>
                <strong>{classroom.name}</strong>
                <small>{classroom.code}</small>
              </span>
              <b>{classroom._count.memberships} members</b>
            </button>
          ))}
        </section>
      </div>

      {selected && (
        <section className="dc-panel dc-detail">
          <div>
            <div>
              <p className="dc-kicker">Selected classroom</p>
              <h2>
                {selected.name} <small>{selected.code}</small>
              </h2>
              <p>{selected.description || 'No description supplied.'}</p>
            </div>
          </div>
          <form className="dc-member-form" onSubmit={addMember}>
            <UserPlus size={17} />
            <input
              required
              value={member.userId}
              onChange={(event) => setMember({ ...member, userId: event.target.value })}
              placeholder="User UUID"
            />
            <select
              value={member.role}
              onChange={(event) => setMember({ ...member, role: event.target.value })}
            >
              <option>STUDENT</option>
              <option>TEACHER</option>
              <option>GUARDIAN</option>
            </select>
            <button className="dc-primary" type="submit">
              Add member
            </button>
          </form>
          <div className="dc-members">
            {selected.memberships.map((item) => (
              <span key={item.userId}>
                <code>{item.userId}</code>
                <b>{item.role}</b>
                <em>{item.status}</em>
              </span>
            ))}
          </div>
          <div className="dc-stream-grid">
            <section>
              <h3>Announcements</h3>
              <form className="dc-form" onSubmit={publishAnnouncement}>
                <input
                  required
                  value={announcement.title}
                  onChange={(event) =>
                    setAnnouncement({ ...announcement, title: event.target.value })
                  }
                  placeholder="Announcement title"
                />
                <textarea
                  required
                  value={announcement.body}
                  onChange={(event) =>
                    setAnnouncement({ ...announcement, body: event.target.value })
                  }
                  placeholder="Message for the classroom"
                />
                <button className="dc-primary" type="submit">
                  Publish announcement
                </button>
              </form>
              <div className="dc-feed">
                {stream.announcements.map((item) => (
                  <article key={item.id}>
                    <strong>{item.title}</strong>
                    <p>{item.body}</p>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>Classroom stream</h3>
              <form className="dc-form" onSubmit={publishPost}>
                <textarea
                  required
                  value={postBody}
                  onChange={(event) => setPostBody(event.target.value)}
                  placeholder="Share an update with classroom members"
                />
                <button className="dc-primary" type="submit">
                  Post update
                </button>
              </form>
              <div className="dc-feed">
                {stream.posts.map((item) => (
                  <article key={item.id}>
                    <p>{item.body}</p>
                    <small>{item.comments.length} comments</small>
                  </article>
                ))}
              </div>
            </section>
          </div>
          <section className="dc-classwork">
            <h3>
              <CalendarDays size={18} /> Upcoming calendar
            </h3>
            <div className="dc-calendar">
              {calendarEvents.map((item) => (
                <article key={item.id}>
                  <time dateTime={item.startsAt}>
                    {new Date(item.startsAt).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </time>
                  <strong>{item.title}</strong>
                  <small>
                    {item.type === 'ASSIGNMENT_DUE'
                      ? 'Due'
                      : item.type === 'LESSON'
                        ? 'Lesson'
                        : 'Available'}
                  </small>
                </article>
              ))}
              {!calendarEvents.length && <p>No upcoming assignments are scheduled.</p>}
            </div>
          </section>
          <section className="dc-classwork">
            <h3>Classwork and assignments</h3>
            <form className="dc-assignment-form" onSubmit={createAssignment}>
              <input
                required
                value={assignment.title}
                onChange={(event) => setAssignment({ ...assignment, title: event.target.value })}
                placeholder="Assignment title"
              />
              <input
                value={assignment.topic}
                onChange={(event) => setAssignment({ ...assignment, topic: event.target.value })}
                placeholder="Topic"
              />
              <select
                value={assignment.type}
                onChange={(event) => setAssignment({ ...assignment, type: event.target.value })}
              >
                <option>ASSIGNMENT</option>
                <option>LESSON</option>
                <option>PROJECT</option>
              </select>
              <input
                type="datetime-local"
                value={assignment.dueAt}
                onChange={(event) => setAssignment({ ...assignment, dueAt: event.target.value })}
              />
              <input
                min="0"
                type="number"
                value={assignment.points}
                onChange={(event) => setAssignment({ ...assignment, points: event.target.value })}
                placeholder="Points"
              />
              <textarea
                value={assignment.description}
                onChange={(event) =>
                  setAssignment({ ...assignment, description: event.target.value })
                }
                placeholder="Description"
              />
              <button className="dc-primary" type="submit">
                Save draft
              </button>
            </form>
            <div className="dc-feed">
              {assignments.map((item) => (
                <article key={item.id}>
                  <strong>{item.title}</strong>
                  <p>{item.description || item.type}</p>
                  <small>
                    {item.status} · {item.points} points
                  </small>
                  <div className="dc-lifecycle">
                    {item.status === 'DRAFT' && (
                      <button
                        onClick={() => changeAssignmentStatus(item.id, 'PUBLISHED')}
                        type="button"
                      >
                        Publish
                      </button>
                    )}
                    {item.status === 'PUBLISHED' && (
                      <button
                        onClick={() => changeAssignmentStatus(item.id, 'CLOSED')}
                        type="button"
                      >
                        Close
                      </button>
                    )}
                    {item.status !== 'ARCHIVED' && (
                      <button
                        onClick={() => changeAssignmentStatus(item.id, 'ARCHIVED')}
                        type="button"
                      >
                        Archive
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
          <section className="dc-classwork">
            <h3>Digital materials</h3>
            <form className="dc-material-form" onSubmit={uploadMaterial}>
              <input
                value={material.title}
                onChange={(event) => setMaterial({ ...material, title: event.target.value })}
                placeholder="Material title (optional)"
              />
              <input
                required
                type="file"
                onChange={(event) =>
                  setMaterial({ ...material, file: event.target.files?.[0] || null })
                }
              />
              <textarea
                value={material.description}
                onChange={(event) => setMaterial({ ...material, description: event.target.value })}
                placeholder="Description"
              />
              <button className="dc-primary" type="submit">
                Upload material
              </button>
            </form>
            <div className="dc-feed">
              {materials.map((item) => (
                <article key={item.id}>
                  <strong>{item.title}</strong>
                  <p>{item.description || item.contentType}</p>
                  <small>{Math.ceil(item.size / 1024)} KB</small>
                  <div className="dc-lifecycle">
                    <button onClick={() => downloadMaterial(item)} type="button">
                      Download
                    </button>
                    <button onClick={() => archiveMaterial(item.id)} type="button">
                      Archive
                    </button>
                  </div>
                </article>
              ))}
              {!materials.length && <p>No materials have been uploaded.</p>}
            </div>
          </section>
          <button className="dc-danger" onClick={archiveClassroom} type="button">
            <Archive size={15} /> Archive classroom
          </button>
        </section>
      )}
    </main>
  );
}
