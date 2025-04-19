/*

- Hook that handles data loading and refreshes when tab becomes visible

*/
// hooks/useVisibilityAwareLoading.ts
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface LoadingOptions {
  refreshOnVisibility?: boolean;
  refreshInterval?: number;
  loadingTimeout?: number; // Time in ms before forcing loading to complete
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
  const {
    refreshOnVisibility = false,
    refreshInterval = 0,
    loadingTimeout = 5000, // Default 5 second safety timeout
  } = options;

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const isMountedRef = useRef(true);
  const activeRequestRef = useRef<number>(0);
  const lastRefreshTime = useRef<number>(Date.now());
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadData = useCallback(async () => {
    if (!isMountedRef.current) return;

    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    // Only set loading true if we don't already have data
    if (!data) {
      setIsLoading(true);
    }

    const requestId = Date.now();
    activeRequestRef.current = requestId;

    // Safety timeout to prevent infinite loading
    loadingTimeoutRef.current = setTimeout(() => {
      if (
        isMountedRef.current &&
        activeRequestRef.current === requestId &&
        isLoading
      ) {
        console.warn('Loading timeout reached. Forcing completion.');
        setIsLoading(false);

        // If we don't have data yet, set a default empty value
        if (!data) {
          setData(null);
        }
      }
    }, loadingTimeout);

    try {
      console.log(`[${requestId}] Starting data fetch`);
      const result = await Promise.race([
        loadDataFn(),
        // Add a Promise timeout as additional safety
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Fetch timeout')),
            loadingTimeout * 1.2
          )
        ),
      ]);

      console.log(`[${requestId}] Data fetch completed`, result);
      lastRefreshTime.current = Date.now();

      if (isMountedRef.current && activeRequestRef.current === requestId) {
        setData(result);
        setError(null);
        setIsLoading(false);
      }
    } catch (err) {
      console.error(`[${requestId}] Error fetching data:`, err);

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
  }, [loadDataFn, data, isLoading, loadingTimeout]);

  // Initial data loading effect
  useEffect(() => {
    loadData();

    return () => {
      isMountedRef.current = false;
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [loadData]);

  // Tab visibility effect
  useEffect(() => {
    if (!refreshOnVisibility && !refreshInterval) return;

    let visibilityDebounceTimer: NodeJS.Timeout | null = null;
    let periodicRefreshTimer: NodeJS.Timeout | null = null;

    const handleVisibilityChange = () => {
      if (!refreshOnVisibility) return;

      if (document.visibilityState === 'visible') {
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

    // Periodic refresh setup
    if (refreshInterval > 0) {
      periodicRefreshTimer = setInterval(() => {
        if (document.visibilityState === 'visible' && isMountedRef.current) {
          loadData();
        }
      }, refreshInterval);
    }

    // Visibility listener setup
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
