/*

root layout

- this layout will display across the whole application

*/
'use client';

import { useEffect, useState } from 'react';
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
import { createClient } from '@/utils/supabase/client';
import './globals.css';
import VignetteEffect from '@/components/premium/vignette-effect';
import UserProfile from '@/components/user-profile';
import { useVisibilityAwareLoading } from '@/hooks/useVisibilityAwareLoading';

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

const queryClient = new QueryClient();

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
  const supabase = createClient();

  // Define the auth check function for the visibility-aware hook
  const checkAuthStatus = async (): Promise<AuthState> => {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Session error:", error);
        return { isAuthenticated: false, user: null, isPremium: false };
      }
      
      if (data && data.session) {
        // Fetch full user profile from the users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.session.user.id)
          .single();
          
        if (!userError && userData) {
          return { 
            isAuthenticated: true, 
            user: userData, 
            isPremium: userData.is_premium || false 
          };
        } else {
          // Fallback to just auth user data if we can't get the profile
          const { data: premiumData } = await supabase
            .from('users')
            .select('is_premium')
            .eq('id', data.session.user.id)
            .single();
              
          return { 
            isAuthenticated: true, 
            user: data.session.user, 
            isPremium: premiumData?.is_premium || false 
          };
        }
      } else {
        return { isAuthenticated: false, user: null, isPremium: false };
      }
    } catch (err) {
      console.error("Auth check failed:", err);
      return { isAuthenticated: false, user: null, isPremium: false };
    }
  };

  // Use the visibility-aware loading hook
  const { 
    isLoading, 
    data: authState,
    refresh: refreshAuth 
  } = useVisibilityAwareLoading<AuthState>(checkAuthStatus, { 
    refreshOnVisibility: false // Disable refresh on tab visibility change
  });
  

  // Set up auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
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