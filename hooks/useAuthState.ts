'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useVisibilityAwareLoading } from './useVisibilityAwareLoading';

// User type for better type safety
export interface AuthUser {
  id: string;
  email: string;
  username?: string | null;
  profile_picture?: string | null;
  is_premium?: boolean;
  total_focus_time?: number;
  completed_tasks_count?: number;
  [key: string]: any;
}

export function useAuthState() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const supabase = createClient();

  // Function to check auth status using the visibility hook
  const checkAuthStatus = useCallback(async () => {
    console.log('Checking auth status');
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Session error:', error);
        return { authenticated: false, user: null, premium: false };
      }

      if (data?.session) {
        console.log('Auth check: User is signed in', data.session.user.email);

        // Fetch full user profile from the users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.session.user.id)
          .single();

        if (!userError && userData) {
          return {
            authenticated: true,
            user: userData,
            premium: userData.is_premium || false,
          };
        } else {
          // Fallback to just auth user data
          const { data: premiumData } = await supabase
            .from('users')
            .select('is_premium')
            .eq('id', data.session.user.id)
            .single();

          return {
            authenticated: true,
            user: data.session.user,
            premium: premiumData?.is_premium || false,
          };
        }
      } else {
        console.log('Auth check: No active session');
        return { authenticated: false, user: null, premium: false };
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      return { authenticated: false, user: null, premium: false };
    }
  }, [supabase]);

  // Use the visibility-aware loading hook
  const {
    isLoading,
    data: authData,
    refresh: refreshAuth,
  } = useVisibilityAwareLoading(checkAuthStatus);

  // Update state when auth data changes
  useEffect(() => {
    if (authData) {
      setIsAuthenticated(authData.authenticated);
      setIsPremium(authData.premium);
    }
  }, [authData]);

  // Set up auth state change listener
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        refreshAuth();
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setIsPremium(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, refreshAuth]);

  return {
    isAuthenticated,
    user: authData?.user as AuthUser | null,
    isPremium,
    isLoading,
    refreshAuth,
  };
}
