import { useCallback, useEffect, useState } from 'react';
import api from '../api/auth.js';
import { getApiErrorMessage } from '../api/errorMessage.js';

// Resolve context on mount so a previous session cannot supply a cached school.
export function useSchoolContext() {
  const [schoolId, setSchoolId] = useState(null);
  const [schoolName, setSchoolName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const retry = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setSchoolId(null);
    setSchoolName('');
    api
      .get('/school', { signal: controller.signal })
      .then(({ data }) => {
        if (controller.signal.aborted) return;
        const school = data.data?.school ?? data.data;
        setSchoolId(school?.id ?? null);
        setSchoolName(school?.name ?? '');
      })
      .catch((reason) => {
        if (!controller.signal.aborted) {
          setError(getApiErrorMessage(reason, 'Unable to load school details'));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [revision]);

  return { schoolId, schoolName, loading, error, retry };
}
