import { useContext, createContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types/user';
import { signIn as authSignIn, signOut as authSignOut, getCurrentUser } from '@/lib/auth';
import { useVisibilityAwareLoading } from '@/hooks/useVisibilityAwareLoading';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isPremium: boolean;
  isInitialized: boolean;
  signIn: (credentials: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Create the context with a meaningful default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isPremium: false,
  isInitialized: false,
  signIn: async () => { throw new Error('AuthContext not initialized') },
  signOut: async () => { throw new Error('AuthContext not initialized') },
  refreshUser: async () => { throw new Error('AuthContext not initialized') },
});

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Define the user fetch function
  const fetchUser = async () => {
    try {
      // Apply timeout to prevent hanging
      const timeout = new Promise<User | null>((_, reject) => 
        setTimeout(() => reject(new Error("User fetch timeout")), 3000)
      );
      
      // Get user with timeout
      return await Promise.race([getCurrentUser(), timeout]);
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  };
  
  // Use visibility-aware loading hook
  const {
    isLoading,
    data: user,
    refresh: refreshUser
  } = useVisibilityAwareLoading(fetchUser, {
    refreshOnVisibility: true,
    loadingTimeout: 3500
  });
  
  // Set premium status
  const isPremium = !!user?.is_premium;
  
  // Mark as initialized once initial loading is complete
  useEffect(() => {
    if (!isLoading) {
      setIsInitialized(true);
    }
  }, [isLoading]);
  
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
      await refreshUser();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };
  
  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        isPremium, 
        isInitialized,
        signIn, 
        signOut, 
        refreshUser
      }}
    >
      { children }
    </AuthContext.Provider>
  );
}

// Custom hook to use the context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

export default AuthProvider;