/*

root layout

- this layout will display across the whole application

*/
import { PomodoroProvider } from '@/contexts/pomodoro_context';
import { Toaster } from '@/components/ui/sonner';
import { Inter as FontSans } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ClockIcon, SettingsIcon, LogOutIcon } from 'lucide-react';
import './globals.css';

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Pomodoro Timer',
  description: 'A Next.js application for managing tasks with the Pomodoro technique',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        'min-h-screen bg-background font-sans antialiased',
        fontSans.variable
      )}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PomodoroProvider>
            <div className="flex min-h-screen flex-col">
              <header className="sticky top-0 z-10 w-full border-b bg-background">
                <div className="container flex h-16 items-center justify-between py-4">
                  <div className="flex items-center gap-2">
                    <Link href="/" className="font-bold text-xl flex items-center">
                      <ClockIcon className="mr-2 h-6 w-6" />
                      <span>Pomodoro</span>
                    </Link>
                  </div>
                  <nav className="flex items-center gap-4">
                    <Button variant="ghost" asChild>
                      <Link href="/" className="flex items-center">
                        <ClockIcon className="mr-2 h-4 w-4" /> Timer
                      </Link>
                    </Button>
                    <Button variant="ghost" asChild>
                      <Link href="/settings" className="flex items-center">
                        <SettingsIcon className="mr-2 h-4 w-4" /> Settings
                      </Link>
                    </Button>
                    <form action="/auth/signout" method="post">
                      <Button type="submit" variant="outline" size="sm" className="ml-2">
                        <LogOutIcon className="mr-2 h-4 w-4" /> Sign Out
                      </Button>
                    </form>
                  </nav>
                </div>
              </header>
              <main className="flex-1 container py-8">
                {children}
              </main>
              <footer className="border-t py-6">
                <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
                  <p className="text-sm text-muted-foreground text-center md:text-left">
                    &copy; {new Date().getFullYear()} Pomodoro Timer. All rights reserved.
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