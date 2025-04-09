/*

- Hook that handles data loading and refreshes when tab becomes visible

*/
'use client';

import { useEffect, useState, useCallback } from 'react';

export function useVisibilityAwareLoading<T>(loadDataFn: () => Promise<T>): {
  isLoading: boolean;
  data: T | null;
  error: Error | null;
  refresh: () => Promise<void>;
} {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Function to load data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await loadDataFn();
      setData(result);
      setError(null);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [loadDataFn]);

  // Initial data loading
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Set up visibility change handler
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Reload data when tab becomes visible again
        loadData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadData]);

  return { isLoading, data, error, refresh: loadData };
}
