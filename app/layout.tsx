/*

root layout

- this layout will display across the whole application

*/
'use client';

import { useEffect, useState, useCallback } from 'react';
import { AuthProvider } from '@/hooks/useAuth';
import { PomodoroProvider } from '@/contexts/pomodoro_context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { Inter as FontSans } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ClockIcon, SettingsIcon, LogInIcon, Trophy } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';
import './globals.css';
import VignetteEffect from '@/components/premium/vignette-effect';
import UserProfile from '@/components/user-profile';
import { useVisibilityAwareLoading } from '@/hooks/useVisibilityAwareLoading';
import { getUserWithAuthState } from '@/lib/api';

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000, // 30 seconds
    },
  },
});

type AuthState = {
  isAuthenticated: boolean;
  user: {
    id: string;
    email?: string;
    username?: string | null;
    profile_picture?: string | null;
    is_premium?: boolean;
    total_focus_time?: number;
    completed_tasks_count?: number;
    [key: string]: any;
  } | null;
  isPremium: boolean;
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = getSupabaseClient();

  // Define the auth check function for the visibility-aware hook
  const checkAuthStatus = useCallback(async (): Promise<AuthState> => {
    try {
      // Apply timeout to prevent hanging but with a longer timeout
      const timeout = new Promise<AuthState>((_, reject) => 
        setTimeout(() => reject(new Error("Auth check timeout")), 5000)
      );
      
      // First try to get basic auth state directly from Supabase
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn('Session error:', error);
          return { isAuthenticated: false, user: null, isPremium: false };
        }
        
        const isAuthenticated = !!data?.session;
        console.log('Auth check: User authenticated =', isAuthenticated);
        
        if (!isAuthenticated) {
          return { isAuthenticated: false, user: null, isPremium: false };
        }
        
        // If we have basic auth, now get full user info
        try {
          // Use API function to get user with auth state
          const authCheckPromise = getUserWithAuthState();
          const fullAuthState = await Promise.race([authCheckPromise, timeout]);
          
          console.log('Auth check complete:', {
            isAuthenticated: fullAuthState.isAuthenticated,
            username: fullAuthState.user?.username || 'No username',
            isPremium: fullAuthState.isPremium
          });
          
          return fullAuthState;
        } catch (apiError) {
          console.error("Full auth check failed:", apiError);
          
          // Fallback to basic auth info with no premium
          return { 
            isAuthenticated: true, 
            user: data.session.user,
            isPremium: false
          };
        }
      } catch (authError) {
        console.error("Direct auth check failed:", authError);
        return { isAuthenticated: false, user: null, isPremium: false };
      }
    } catch (err) {
      console.error("Auth check failed:", err);
      return { isAuthenticated: false, user: null, isPremium: false };
    }
  }, []);

  // Use the visibility-aware loading hook with safety timeout
  const { 
    isLoading, 
    data: authState,
    refresh: refreshAuth 
  } = useVisibilityAwareLoading<AuthState>(checkAuthStatus, { 
    refreshOnVisibility: true, // Enable refresh on tab visibility change
    loadingTimeout: 3500 // 3.5 second max loading time
  });
  
  // Set up auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'SIGNED_OUT') {
          console.log("Auth state changed:", event);
          refreshAuth();
        }
      }
    );
    
    return () => subscription.unsubscribe();
  }, [refreshAuth, supabase.auth]);

  const isAuthenticated = authState?.isAuthenticated ?? false;
  const user = authState?.user ?? null;
  const isPremium = authState?.isPremium ?? false;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background font-sans antialiased', fontSans.variable)}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <PomodoroProvider>
                <VignetteEffect />
                <div className="flex min-h-screen flex-col">
                  <header className="sticky top-0 z-10 w-full border-b border-accent bg-background non-essential">
                    <div className="container flex h-16 items-center justify-between py-4">
                      <div className="flex items-center gap-2">
                        <Link href="/" className="font-bold text-xl text-foreground flex items-center">
                          <ClockIcon className="mr-2 h-6 w-6" />
                          <span>Pomodoro</span>
                        </Link>
                      </div>
                      <nav className="flex items-center gap-4">
                        <Button variant="ghost" asChild>
                          <Link href="/" className="flex items-center text-foreground hover:text-accent-foreground">
                            <ClockIcon className="mr-2 h-4 w-4" /> Timer
                          </Link>
                        </Button>
                        <Button variant="ghost" asChild>
                          <Link href="/leaderboard" className="flex items-center text-foreground hover:text-accent-foreground">
                            <Trophy className="mr-2 h-4 w-4" /> Leaderboard
                          </Link>
                        </Button>
                        <Button variant="ghost" asChild>
                          <Link href="/settings" className="flex items-center text-foreground hover:text-accent-foreground">
                            <SettingsIcon className="mr-2 h-4 w-4" /> Settings
                          </Link>
                        </Button>
                        
                        {isLoading ? (
                          // Loading state
                          <div className="h-8 w-8 animate-pulse rounded-full bg-muted"></div>
                        ) : isAuthenticated ? (
                          // User is authenticated
                          <UserProfile user={user} />
                        ) : (
                          // User is not authenticated
                          <Button variant="outline" className='border-foreground' size="sm" asChild>
                            <Link href="/sign-in" className="flex items-center text-foreground hover:text-accent-foreground">
                              <LogInIcon className="mr-2 h-4 w-4 text-foreground hover:text-accent-foreground" /> Sign In
                            </Link>
                          </Button>
                        )}
                      </nav>
                    </div>
                  </header>
                  <main className="flex-1 container py-8">
                    {children}
                  </main>
                  <footer className="border-t border-accent py-6 non-essential">
                    <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
                      <p className="text-sm text-muted-foreground text-center md:text-left">
                        &copy; {new Date().getFullYear()} pomodoro. all rights reserved.
                      </p>
                    </div>
                  </footer>
                </div>
                <Toaster />
              </PomodoroProvider>
            </AuthProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}