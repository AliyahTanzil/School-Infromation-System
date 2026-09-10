/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from './api/auth.js';
import { getApiErrorMessage } from './api/errorMessage.js';

export default function ExaminationCandidates({ schoolId, examination, onSaved, onBusy }) {
  const [classes, setClasses] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [classId, setClassId] = useState('');
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [rosterError, setRosterError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [rosterRefresh, setRosterRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const config = { headers: { 'x-school-id': schoolId }, signal: controller.signal };
    setLoading(true);
    setError('');
    async function load() {
      try {
        const records = [];
        let page = 1;
        let total;
        do {
          const { data } = await api.get('/classes', {
            ...config,
            params: { page, pageSize: 100, status: 'ACTIVE' },
          });
          if (controller.signal.aborted) return;
          if (!Array.isArray(data.data?.items)) throw new Error('Unable to read classes');
          records.push(...data.data.items);
          total = data.data.total ?? records.length;
          if (!data.data.items.length) break;
          page += 1;
        } while (records.length < total);
        const { data } = await api.get(`/examinations/${examination.id}`, config);
        if (controller.signal.aborted) return;
        if (!Array.isArray(data.data?.candidates))
          throw new Error('Unable to read candidate register');
        if (data.data.status !== 'DRAFT')
          throw new Error(
            'This examination is no longer a draft. Reload examinations before continuing.'
          );
        setClasses(records);
        setCandidates(data.data.candidates);
      } catch (reason) {
        if (!controller.signal.aborted)
          setError(getApiErrorMessage(reason, 'Unable to load candidate setup'));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [schoolId, examination.id, refresh]);

  useEffect(() => {
    const controller = new AbortController();
    setStudents([]);
    setStudentId('');
    setRosterError('');
    setRosterLoading(!!classId);
    if (classId) {
      api
        .get(`/classes/${classId}`, {
          headers: { 'x-school-id': schoolId },
          signal: controller.signal,
        })
        .then(({ data }) => {
          if (controller.signal.aborted) return;
          if (!Array.isArray(data.data?.enrollments))
            throw new Error('Unable to read class enrollments');
          setStudents(
            data.data.enrollments
              .filter((entry) => entry.status === 'ACTIVE' && entry.student?.status === 'ACTIVE')
              .map((entry) => entry.student)
          );
        })
        .catch((reason) => {
          if (!controller.signal.aborted)
            setRosterError(getApiErrorMessage(reason, 'Unable to load enrolled students'));
        })
        .finally(() => {
          if (!controller.signal.aborted) setRosterLoading(false);
        });
    }
    return () => controller.abort();
  }, [classId, schoolId, rosterRefresh]);

  const registered = new Set(candidates.map((candidate) => candidate.studentId));
  const available = students.filter((student) => !registered.has(student.id));
  const register = async (event) => {
    event.preventDefault();
    if (
      saving ||
      loading ||
      rosterLoading ||
      error ||
      rosterError ||
      !available.some((student) => student.id === studentId)
    )
      return;
    setSaving(true);
    onBusy(true);
    try {
      await api.post(
        `/examinations/${examination.id}/candidates`,
        { classId, studentId },
        { headers: { 'x-school-id': schoolId } }
      );
      setCandidates((current) => [...current, { classId, studentId }]);
      setStudentId('');
      await onSaved();
    } catch (reason) {
      setError(getApiErrorMessage(reason, 'Unable to register candidate'));
    } finally {
      setSaving(false);
      onBusy(false);
    }
  };

  return (
    <section className="data-panel mb-6" aria-labelledby="candidate-title">
      <h2 id="candidate-title">Register candidates: {examination.name}</h2>
      <p className="my-2">
        Select a class, then choose an active enrolled student. Students already registered in this
        examination are excluded.
      </p>
      {loading ? (
        <p role="status">Loading candidate setup…</p>
      ) : error ? (
        <p role="alert">
          {error}{' '}
          <button className="secondary-button" onClick={() => setRefresh((value) => value + 1)}>
            Retry candidate setup
          </button>
        </p>
      ) : (
        <>
          <p className="my-2">
            {candidates.length} candidate(s) registered. Review every class before preparing subject
            schedules.
          </p>
          {!classes.length ? (
            <p>
              <Link className="underline" to="/classes">
                Create or activate classes
              </Link>{' '}
              before registering candidates.
            </p>
          ) : (
            <form className="form-grid" onSubmit={register}>
              <label className="form-field">
                Candidate class
                <select
                  required
                  value={classId}
                  disabled={saving}
                  onChange={(event) => setClassId(event.target.value)}
                >
                  <option value="">Select a class</option>
                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                      {item.section ? ` · ${item.section}` : ''}
                      {item.academicYear?.name ? ` (${item.academicYear.name})` : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                Enrolled student
                <select
                  required
                  value={studentId}
                  disabled={!classId || rosterLoading || saving || !!rosterError}
                  onChange={(event) => setStudentId(event.target.value)}
                >
                  <option value="">
                    {rosterLoading ? 'Loading students…' : 'Select a student'}
                  </option>
                  {available.map((student) => (
                    <option key={student.id} value={student.id}>
                      {[student.profile?.firstName, student.profile?.lastName]
                        .filter(Boolean)
                        .join(' ')}{' '}
                      · {student.admissionNumber}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="primary-button"
                disabled={!studentId || saving || rosterLoading || !!rosterError}
              >
                Register candidate
              </button>
            </form>
          )}
          {rosterError && (
            <p role="alert">
              {rosterError}{' '}
              <button
                className="secondary-button"
                onClick={() => setRosterRefresh((value) => value + 1)}
              >
                Retry students
              </button>
            </p>
          )}
          {classId && !rosterLoading && !rosterError && !available.length && (
            <p className="mt-3">
              No unregistered active students are available in this class.{' '}
              <Link className="underline" to={`/classes/${classId}`}>
                Review class enrollments
              </Link>{' '}
              or select another class.
            </p>
          )}
        </>
      )}
    </section>
  );
}
