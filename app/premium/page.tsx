'use client';

import { useEffect } from 'react';
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
  
  useEffect(() => {
    // Refresh premium status when the component mounts
    refreshUserSettings();
  }, [refreshUserSettings]);

  return (
    <div className="container mx-auto max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Premium Features</h1>
        <Button variant="outline" size="sm" asChild>
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
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Enhanced Productivity Tools</h2>
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
            
            <div className="bg-slate-50 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-2">Customer Reviews</h2>
              <div className="space-y-4">
                <div className="border-b pb-3">
                  <div className="flex items-center gap-1 text-yellow-500 mb-1">
                    ★★★★★
                    <span className="text-gray-700 text-sm ml-1">Sarah T.</span>
                  </div>
                  <p className="text-sm">
                    "The premium features transformed how I study. The ambient sounds help me get in the zone instantly!"
                  </p>
                </div>
                <div className="border-b pb-3">
                  <div className="flex items-center gap-1 text-yellow-500 mb-1">
                    ★★★★★
                    <span className="text-gray-700 text-sm ml-1">Mark J.</span>
                  </div>
                  <p className="text-sm">
                    "Deep focus mode and the productivity analytics have helped me identify when I work best. Worth every penny."
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-yellow-500 mb-1">
                    ★★★★★
                    <span className="text-gray-700 text-sm ml-1">Aisha K.</span>
                  </div>
                  <p className="text-sm">
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
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-4">
            <div className="bg-green-100 p-2 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-lg">Premium Features Activated</h2>
              <p className="text-sm">Manage your premium settings and view productivity analytics</p>
            </div>
          </div>
          
          <Tabs defaultValue="settings">
            <TabsList className="w-full border-b pb-0">
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="settings" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SoundControls />
                <DeepFocusMode />
              </div>
            </TabsContent>
            
            <TabsContent value="analytics" className="mt-6">
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