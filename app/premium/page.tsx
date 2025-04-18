'use client';

import { useCallback } from 'react';
import { useVisibilityAwareLoading } from '@/hooks/useVisibilityAwareLoading';
import { createClient } from '@/utils/supabase/client';
import { usePomodoroTimer } from '@/contexts/pomodoro_context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PremiumPurchase from '@/components/premium/premium-purchase';
import SoundControls from '@/components/premium/sound-controls';
import DeepFocusMode from '@/components/premium/deep-focus-mode';
import ProductivityHeatmap from '@/components/premium/productivity-heatmap';
import FocusAnalytics from '@/components/premium/focus-analytics';
import TaskInsights from '@/components/premium/task-insights';
import { Button } from '@/components/ui/button';
import { HomeIcon } from 'lucide-react';
import Link from 'next/link';

export default function PremiumPage() {
  const { isPremium, refreshUserSettings } = usePomodoroTimer();

  const supabase = createClient();
  
  const fetchPremiumStatus = useCallback(async () => {
    console.log('Fetching premium status');
    try {
      // Apply timeout to prevent hanging
      const timeout = new Promise<any>((_, reject) => 
        setTimeout(() => reject(new Error("Premium status timeout")), 3500)
      );
      
      // Refresh user settings first with timeout
      const refreshPromise = refreshUserSettings();
      await Promise.race([refreshPromise, timeout])
        .catch(() => console.warn('Settings refresh timed out'));
      
      // Get auth status with timeout
      const authPromise = supabase.auth.getUser();
      const authResult = await Promise.race([authPromise, timeout])
        .catch(() => ({ data: { user: null } }));
      
      if (!authResult.data.user) {
        return false; // Not premium if not authenticated
      }
      
      // Get premium status with timeout
      const statusPromise = supabase
        .from('users')
        .select('is_premium')
        .eq('id', authResult.data.user.id)
        .single();
        
      const statusResult = await Promise.race([statusPromise, timeout])
        .catch(() => ({ data: null }));
      
      // Return premium status or false if fetch failed
      return !!statusResult?.data?.is_premium;
    } catch (error) {
      console.error('Failed to check premium status:', error);
      // Return current state from context as fallback
      return isPremium;
    }
  }, [refreshUserSettings, supabase, isPremium]);
  
  
  // Use the hook
  const { 
    isLoading, 
    data: premiumStatus,
    refresh: refreshPremium
  } = useVisibilityAwareLoading(fetchPremiumStatus, {
    refreshOnVisibility: false,
    loadingTimeout: 3500
  });
  

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl text-foreground font-bold">Premium Features</h1>
          <Button className='text-foreground border-foreground' variant="outline" size="sm" asChild>
            <Link href="/">
              <HomeIcon className="mr-2 h-4 w-4" /> Return to Timer
            </Link>
          </Button>
        </div>
        <div className="flex justify-center items-center py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-b-4 border-secondary-foreground"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl text-foreground font-bold">Premium Features</h1>
        <Button className='text-foreground border-foreground hover:border-muted-foreground' variant="outline" size="sm" asChild>
          <Link href="/">
            <HomeIcon className="mr-2 h-4 w-4" /> Return to Timer
          </Link>
        </Button>
      </div>

      {!isPremium ? (
        // For non-premium users, just show the purchase component
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <PremiumPurchase />
          <div className="space-y-6">
            <div className="bg-card text-card-foreground rounded-lg p-6">
              <h2 className="text-xl text-card-foreground font-bold mb-2">Enhanced Productivity Tools</h2>
              <p className="mb-4">
                Unlock premium features to transform your productivity experience with a single purchase. No subscriptions, yours forever.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-green-100 p-1 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm">Beautiful animated timers with multiple themes</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-green-100 p-1 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm">Ambient sounds and focus music integration</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-green-100 p-1 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm">Deep focus mode to eliminate distractions</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-green-100 p-1 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm">Comprehensive productivity analytics</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-card text-card-foreground rounded-lg p-6">
              <h2 className="text-xl font-bold mb-2 text-foreground">Customer Reviews</h2>
              <div className="space-y-4">
                <div className="border-b border-muted-foreground pb-3">
                  <div className="flex items-center gap-1 text-yellow-500 mb-1">
                    ★★★★★
                    <span className="text-card-foreground dark:text-gray-300 text-sm ml-1">Sarah T.</span>
                  </div>
                  <p className="text-sm text-card-foreground">
                    "The premium features transformed how I study. The ambient sounds help me get in the zone instantly!"
                  </p>
                </div>
                <div className="border-b border-muted-foreground pb-3">
                  <div className="flex items-center gap-1 text-yellow-500 mb-1">
                    ★★★★★
                    <span className="text-card-foreground text-sm ml-1">Mark J.</span>
                  </div>
                  <p className="text-sm text-card-foreground">
                    "Deep focus mode and the productivity analytics have helped me identify when I work best. Worth every penny."
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-yellow-500 mb-1">
                    ★★★★★
                    <span className="text-card-foreground text-sm ml-1">Aisha K.</span>
                  </div>
                  <p className="text-sm text-card-foreground">
                    "I love seeing my productivity trends in the heatmap. It's so satisfying watching those green squares fill up!"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // For premium users, focus on settings and analytics
        <div className="space-y-6">
          <div className="bg-green-100 dark:bg-green-950/50 border border-green-300 dark:border-green-800 rounded-lg p-4 flex items-center gap-4">
            <div className="bg-green-200 dark:bg-green-800/50 p-2 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-lg text-green-800 dark:text-green-200">Premium Features Activated</h2>
              <p className="text-sm text-green-700/80 dark:text-green-300/80">Manage your premium settings and view productivity analytics</p>
            </div>
          </div>
          
          <Tabs defaultValue="settings">
          <TabsList className="grid w-full grid-cols-2 h-14 font-extrabold">
            <TabsTrigger value="settings" className="h-12 text-lg">Settings</TabsTrigger>
            <TabsTrigger value="analytics" className="h-12 text-lg">Analytics</TabsTrigger>
          </TabsList>
            
            <TabsContent value="settings" className="m-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SoundControls />
                <DeepFocusMode />
              </div>
            </TabsContent>
            
            <TabsContent value="analytics" className="m-3">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <ProductivityHeatmap />
                  <TaskInsights />
                </div>
                <div>
                  <FocusAnalytics />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}