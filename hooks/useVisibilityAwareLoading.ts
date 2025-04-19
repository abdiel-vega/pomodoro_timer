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
    loadingTimeout = 5000,
  } = options;

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  // Add this to force re-renders when needed
  const [updateKey, setUpdateKey] = useState(0);

  // Force an update function
  const forceUpdate = useCallback(() => {
    setUpdateKey((prev) => prev + 1);
  }, []);

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

    // Ensure Supabase client is ready
    try {
      const requestId = Date.now();
      activeRequestRef.current = requestId;

      // Safety timeout to prevent infinite loading
      loadingTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current && activeRequestRef.current === requestId) {
          console.warn('Loading timeout reached. Forcing completion.');
          setIsLoading(false);
          forceUpdate(); // Force a re-render
        }
      }, loadingTimeout);

      const result = await loadDataFn();
      lastRefreshTime.current = Date.now();

      if (isMountedRef.current && activeRequestRef.current === requestId) {
        // Staged updates to ensure proper rendering
        setData(result);
        setError(null);
        setIsLoading(false);

        // Force an update after a short delay to ensure rendering
        setTimeout(() => {
          if (isMountedRef.current) {
            forceUpdate();
          }
        }, 50);
      }
    } catch (err) {
      console.error('Data fetch error:', err);

      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
        forceUpdate(); // Force a re-render
      }
    } finally {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    }
  }, [loadDataFn, data, isLoading, loadingTimeout, forceUpdate]);

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

  useEffect(() => {
    // This is just to ensure the component re-renders when updateKey changes
    // No actual logic needed here
  }, [updateKey]);

  return {
    isLoading,
    data,
    error,
    refresh: loadData,
  };
}
