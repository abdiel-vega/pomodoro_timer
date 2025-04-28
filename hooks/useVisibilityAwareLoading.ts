/*

- Hook that handles data loading and refreshes when tab becomes visible

*/
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';

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
  const [updateKey, setUpdateKey] = useState(0);
  const { isInitialized } = useAuth();

  useEffect(() => {
    if (!isInitialized) {
      // Don't load data until auth is initialized
      return;
    }
  }, [isInitialized]);

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

    // Try to get data from localStorage first as a quick fallback
    let cachedData = null;
    try {
      // Create a cache key based on the function name or a provided key
      const cacheKey = `cache_${loadDataFn.name || 'data'}_${Date.now() % 86400000}`;
      const cachedItem = localStorage.getItem(cacheKey);
      if (cachedItem) {
        cachedData = JSON.parse(cachedItem);
        // If we're already loading and have cached data, use it immediately
        if (isLoading && cachedData) {
          setData(cachedData);
        }
      }
    } catch (cacheErr) {
      console.warn('Error accessing cache:', cacheErr);
    }

    // Ensure Supabase client is ready
    try {
      const requestId = Date.now();
      activeRequestRef.current = requestId;

      // Safety timeout to prevent infinite loading
      loadingTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current && activeRequestRef.current === requestId) {
          console.warn(
            'Loading timeout reached. Using cached data if available.'
          );
          setIsLoading(false);

          // If we have cached data and the request timed out, use the cached data
          if (cachedData && !data) {
            setData(cachedData);
            setError(new Error('Loading timeout - using cached data'));
          }

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

        // Cache successful result for future fallbacks
        try {
          const cacheKey = `cache_${loadDataFn.name || 'data'}_${Date.now() % 86400000}`;
          localStorage.setItem(cacheKey, JSON.stringify(result));
        } catch (cacheErr) {
          console.warn('Error caching data:', cacheErr);
        }

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

        // If we have cached data and the request failed, use it as fallback
        if (cachedData && !data) {
          setData(cachedData);
          console.log('Using cached data as fallback after fetch error');
        }

        forceUpdate(); // Force a re-render
      }
    } finally {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    }
  }, [loadDataFn, data, isLoading, loadingTimeout, forceUpdate]);

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
