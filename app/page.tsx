/*

home page

*/
'use client';

import { usePomodoroTimer } from '@/contexts/pomodoro_context';
import Timer from '@/components/pomodoro/timer';
import EnhancedTimer from '@/components/pomodoro/enhanced-timer';
import TaskList from '@/components/tasks/tasklist';
import HomePremiumControls from '@/components/premium/home-premium-controls';

export default function Home() {
  const { isPremium } = usePomodoroTimer();
  
  return (
    <div className="flex flex-col gap-8">
      <section className="mx-auto w-full max-w-md">
        <HomePremiumControls />
        {isPremium ? <EnhancedTimer /> : <Timer />}
      </section>
      
      <section className="mx-auto w-full max-w-3xl">
        <TaskList />
      </section>
    </div>
  );
}