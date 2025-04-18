/*

- Hook that handles data loading and refreshes when tab becomes visible

*/
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { acquireLoadingLock, releaseLoadingLock } from '@/lib/loading-state';

export function useVisibilityAwareLoading<T>(loadDataFn: () => Promise<T>): {
  isLoading: boolean;
  data: T | null;
  error: Error | null;
  refresh: () => Promise<void>;
} {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Add request tracking
  const isMountedRef = useRef(true);
  const activeRequestRef = useRef<number>(0);

  // Function to load data with request ID tracking
  const loadData = useCallback(async () => {
    if (!isMountedRef.current) return;

    // Generate unique request ID for this call
    const requestId = Date.now();
    activeRequestRef.current = requestId;

    setIsLoading(true);
    try {
      const result = await loadDataFn();

      // Only update state if this is still the latest request
      if (isMountedRef.current && activeRequestRef.current === requestId) {
        setData(result);
        setError(null);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Failed to load data:', err);

      // Only update error state if this is still the latest request
      if (isMountedRef.current && activeRequestRef.current === requestId) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      }
    }
  }, [loadDataFn]);

  // Initial data loading
  useEffect(() => {
    loadData();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadData]);

  // Set up visibility change handler with debounce
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout | null = null;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (debounceTimer) clearTimeout(debounceTimer);

        debounceTimer = setTimeout(() => {
          if (isMountedRef.current && acquireLoadingLock()) {
            loadData().finally(() => releaseLoadingLock());
          }
        }, 500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [loadData]);

  return {
    isLoading,
    data,
    error,
    refresh: loadData,
  };
}
