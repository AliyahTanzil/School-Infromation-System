import { useEffect, useState } from 'react';
import api from '../api/auth.js';
import { getApiErrorMessage } from '../api/errorMessage.js';

export default function useSchoolSelection() {
  const [schools, setSchools] = useState([]);
  const [schoolId, setSchoolId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    async function load() {
      try {
        const items = [];
        let page = 1;
        let total;
        do {
          const { data } = await api.get('/schools', {
            params: { page, pageSize: 100 },
            signal: controller.signal,
          });
          if (controller.signal.aborted) return;
          if (!Array.isArray(data.data?.items)) throw new Error('Unexpected school response');
          items.push(...data.data.items);
          total = data.data.total ?? items.length;
          if (!data.data.items.length) break;
          page += 1;
        } while (items.length < total);
        setSchools(items);
        const saved = sessionStorage.getItem('schoolId');
        setSchoolId(
          items.some((school) => school.id === saved)
            ? saved
            : items.length === 1
              ? items[0].id
              : ''
        );
      } catch (reason) {
        if (!controller.signal.aborted)
          setError(getApiErrorMessage(reason, 'Unable to load schools'));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [refresh]);
  return {
    schools,
    schoolId,
    setSchoolId,
    loading,
    error,
    retry: () => setRefresh((value) => value + 1),
  };
}
