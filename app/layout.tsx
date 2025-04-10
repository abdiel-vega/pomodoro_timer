/*

root layout

- this layout will display across the whole application

*/
'use client';

import { useEffect, useState } from 'react';
import { PomodoroProvider } from '@/contexts/pomodoro_context';
import { Toaster } from '@/components/ui/sonner';
import { Inter as FontSans } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ClockIcon, SettingsIcon, LogOutIcon, LogInIcon, Sparkles, Users, Trophy } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import './globals.css';
import PokeNotification from '@/components/poke-notifs';
import VignetteEffect from '@/components/premium/vignette-effect';
import UserProfile from '@/components/user-profile';

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    // Define function to check auth status
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session error:", error);
          setIsAuthenticated(false);
          setUser(null);
          setIsPremium(false);
          return;
        }
        
        if (data && data.session) {
          console.log("Initial auth check: User is signed in", data.session.user.email);
          setIsAuthenticated(true);
          
          // Fetch full user profile from the users table
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.session.user.id)
            .single();
            
          if (!userError && userData) {
            setUser(userData);
            setIsPremium(userData.is_premium || false);
          } else {
            // Fallback to just auth user data if we can't get the profile
            setUser(data.session.user);
            
            // Fetch premium status from database
            const { data: premiumData, error: premiumError } = await supabase
              .from('users')
              .select('is_premium')
              .eq('id', data.session.user.id)
              .single();
              
            if (!premiumError && premiumData) {
              setIsPremium(premiumData.is_premium || false);
            }
          }
        } else {
          console.log("Initial auth check: No active session");
          setIsAuthenticated(false);
          setUser(null);
          setIsPremium(false);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setIsAuthenticated(false);
        setUser(null);
        setIsPremium(false);
      }
    };  
    
    // Check auth status immediately
    checkAuth();
    
    // Set up auth state listener with improved handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        
        // Handle specific auth events
        if (event === 'SIGNED_IN') {
          console.log("Sign-in detected, updating UI");
          setIsAuthenticated(true);
          
          // Fetch full user profile
          if (session?.user) {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();
              
            if (!userError && userData) {
              setUser(userData);
              setIsPremium(userData.is_premium || false);
            } else {
              // Fallback to just auth user data
              setUser(session.user);
              
              // Check premium status on sign in
              const { data: premiumData } = await supabase
                .from('users')
                .select('is_premium')
                .eq('id', session.user.id)
                .single();
                
              setIsPremium(premiumData?.is_premium || false);
            }
          }
        }      
        else if (event === 'SIGNED_OUT') {
          console.log("Sign-out detected, updating UI");
          setIsAuthenticated(false);
          setUser(null);
          setIsPremium(false);
        }
        else if (event === 'USER_UPDATED') {
          // User data was updated, refresh our state
          if (session) {
            setIsAuthenticated(true);
            
            // Fetch updated user profile
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();
              
            if (!userError && userData) {
              setUser(userData);
              setIsPremium(userData.is_premium || false);
            } else {
              setUser(session.user);
            }
          }
        }
      }
    );
    
    // Clean up listener
    return () => subscription.unsubscribe();
  }, []);  

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background font-sans antialiased', fontSans.variable)}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <PomodoroProvider>
            <PokeNotification />
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
                      
                      {isAuthenticated === null ? (
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
          </ThemeProvider>
        </body>
      </html>
    );
  }