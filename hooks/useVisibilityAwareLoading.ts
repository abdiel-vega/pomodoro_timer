/*

- Hook that handles data loading and refreshes when tab becomes visible

*/
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

// Define proper type for options with defaults
interface LoadingOptions {
  refreshOnVisibility?: boolean;
  refreshInterval?: number;
}

export function useVisibilityAwareLoading<T>(
  loadDataFn: () => Promise<T>,
  options: LoadingOptions = {}
): {
  isLoading: boolean;
  data: T | null;
  error: Error | null;
  refresh: () => Promise<void>;
} {
  // Destructure with defaults
  const { refreshOnVisibility = false, refreshInterval = 0 } = options;

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const isMountedRef = useRef(true);
  const activeRequestRef = useRef<number>(0);
  const lastRefreshTime = useRef<number>(Date.now());
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadData = useCallback(async () => {
    if (!isMountedRef.current) return;

    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    // Only set loading true if we don't already have data
    if (!data) {
      setIsLoading(true);
    }

    const requestId = Date.now();
    activeRequestRef.current = requestId;

    // Set a max timeout
    loadingTimeoutRef.current = setTimeout(() => {
      if (isLoading && isMountedRef.current) {
        setIsLoading(false);
        console.warn(
          'Loading timeout reached. Check your data fetching logic.'
        );
      }
    }, 10000);

    try {
      const result = await loadDataFn();
      lastRefreshTime.current = Date.now();

      if (isMountedRef.current && activeRequestRef.current === requestId) {
        setData(result);
        setError(null);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Failed to load data:', err);

      if (isMountedRef.current && activeRequestRef.current === requestId) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      }
    } finally {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    }
  }, [loadDataFn, data, isLoading]);

  // Initial data loading
  useEffect(() => {
    loadData();

    return () => {
      isMountedRef.current = false;
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [loadData]);

  // Visibility change handler
  useEffect(() => {
    // Early return if the feature is disabled
    if (!refreshOnVisibility && !refreshInterval) return;

    let visibilityDebounceTimer: NodeJS.Timeout | null = null;
    let periodicRefreshTimer: NodeJS.Timeout | null = null;

    const handleVisibilityChange = () => {
      if (!refreshOnVisibility) return;

      if (document.visibilityState === 'visible') {
        // Avoid frequent refreshes
        const timeSinceLastRefresh = Date.now() - lastRefreshTime.current;
        if (timeSinceLastRefresh < 60000) return;

        if (visibilityDebounceTimer) clearTimeout(visibilityDebounceTimer);

        visibilityDebounceTimer = setTimeout(() => {
          if (isMountedRef.current) {
            loadData();
          }
        }, 500);
      }
    };

    // Only set up periodic refresh if interval is specified and > 0
    if (refreshInterval > 0) {
      periodicRefreshTimer = setInterval(() => {
        if (document.visibilityState === 'visible' && isMountedRef.current) {
          loadData();
        }
      }, refreshInterval);
    }

    // Only add visibility listener if feature is enabled
    if (refreshOnVisibility) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      if (refreshOnVisibility) {
        document.removeEventListener(
          'visibilitychange',
          handleVisibilityChange
        );
      }
      if (visibilityDebounceTimer) clearTimeout(visibilityDebounceTimer);
      if (periodicRefreshTimer) clearInterval(periodicRefreshTimer);
    };
  }, [loadData, refreshOnVisibility, refreshInterval]);

  return {
    isLoading,
    data,
    error,
    refresh: loadData,
  };
}
