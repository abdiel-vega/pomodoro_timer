// hooks/useAuth.ts
import { useContext, createContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types/user';
import { getSupabaseClient } from '@/lib/supabase';
import { signIn as authSignIn, signOut as authSignOut } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isPremium: boolean;
  signIn: (credentials: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Create the context with a meaningful default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isPremium: false,
  signIn: async () => { throw new Error('AuthContext not initialized') },
  signOut: async () => { throw new Error('AuthContext not initialized') },
  refreshUser: async () => { throw new Error('AuthContext not initialized') },
});

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const supabase = getSupabaseClient();
  
  const refreshUser = async () => {
    setIsLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        setUser(null);
        setIsPremium(false);
        return;
      }
      
      // Get full user profile
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
        
      if (error) {
        console.error('Error fetching user profile:', error);
        setUser(null);
        setIsPremium(false);
      } else {
        setUser(data);
        setIsPremium(data?.is_premium || false);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
      setIsPremium(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    refreshUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED') => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await refreshUser();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsPremium(false);
        }
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);
  
  const signIn = async (credentials: { email: string; password: string }) => {
    try {
      await authSignIn(credentials);
      await refreshUser();
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };
  
  const signOut = async () => {
    try {
      await authSignOut();
      setUser(null);
      setIsPremium(false);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };
  
  return (
    <AuthContext.Provider value={{ user, isLoading, isPremium, signIn, signOut, refreshUser}}>
      { children }
    </AuthContext.Provider>
  );
}

export default AuthProvider;

// Custom hook to use the context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}