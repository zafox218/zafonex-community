import { useEffect, useState, useCallback } from 'react';
import { get } from '@/lib/api';

/// Tiny data hook — enough for a scaffold, swap for TanStack Query when the
/// number of cached endpoints starts to hurt.
export function useFetch(path, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const run = useCallback(async () => {
    setLoading(true);
    try {
      setData(await get(path));
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { run(); }, [run]);

  return { data, error, loading, reload: run };
}
