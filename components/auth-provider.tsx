// components/auth-provider.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getSupabaseClient } from '@/utils/supabase/supabase-wrapper';

interface AuthContextType {
  isInitialized: boolean;
  isAuthenticated: boolean;
  userId: string | null;
}

const AuthContext = createContext<AuthContextType>({
  isInitialized: false,
  isAuthenticated: false,
  userId: null
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthContextType>({
    isInitialized: false,
    isAuthenticated: false,
    userId: null
  });

  useEffect(() => {
    // Flag to prevent state updates after unmount
    let isMounted = true;
    
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth state...');
        const supabase = await getSupabaseClient();
        
        // Get initial session
        const { data } = await supabase.auth.getSession();
        
        if (isMounted) {
          setState({
            isInitialized: true,
            isAuthenticated: !!data.session,
            userId: data.session?.user?.id || null
          });
          console.log('Auth initialized:', !!data.session);
        }
        
        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          console.log('Auth state changed:', event);
          if (isMounted) {
            setState({
              isInitialized: true,
              isAuthenticated: !!session,
              userId: session?.user?.id || null
            });
          }
        });
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (isMounted) {
          setState({
            isInitialized: true,
            isAuthenticated: false,
            userId: null
          });
        }
      }
    };
    
    initializeAuth();
    
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AuthContext.Provider value={state}>
      {!state.isInitialized ? (
        <div className="fixed inset-0 flex items-center justify-center bg-background">
          <div className="h-16 w-16 animate-spin rounded-full border-b-4 border-primary"></div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}