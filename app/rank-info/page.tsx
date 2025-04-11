// app/rank-info/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { calculateUserRank, RANKS, calculateProgressToNextRank, formatTime, RankInfo } from '@/utils/rank';
import Image from 'next/image';
import { Clock, CheckSquare } from 'lucide-react';

export default function RankInfoPage() {
  const [userFocusTime, setUserFocusTime] = useState(0);
  const [userTasks, setUserTasks] = useState(0);
  const [userRank, setUserRank] = useState<RankInfo>(RANKS.bronze);
  const [isLoading, setIsLoading] = useState(true);
  const [progressData, setProgressData] = useState({
    focusTimePercent: 0,
    tasksPercent: 0,
    nextRank: null as RankInfo | null
  });
  
  const supabase = createClient();
  
  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data: userData, error } = await supabase
          .from('users')
          .select('total_focus_time, completed_tasks_count')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        
        // Set user stats
        const focusTime = userData.total_focus_time || 0;
        const tasks = userData.completed_tasks_count || 0;
        setUserFocusTime(focusTime);
        setUserTasks(tasks);
        
        // Calculate rank
        const rank = calculateUserRank(focusTime, tasks);
        setUserRank(rank);
        
        // Calculate progress to next rank
        const progress = calculateProgressToNextRank(focusTime, tasks, rank);
        setProgressData(progress);
      } catch (error) {
        console.error('Error loading user rank data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserData();
  }, [supabase]);
  
  return (
    <div className="container mx-auto max-w-3xl py-8">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Rank System</h1>
      
      <div className="grid gap-6 mb-8">
        {/* Current Rank Card */}
        <Card>
          <CardHeader>
            <CardTitle>Your Current Rank</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-6">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-secondary-foreground"></div>
              </div>
            ) : (
              <div className="flex flex-col items-center md:flex-row md:items-start gap-6">
                <div className="flex flex-col items-center">
                  <Image 
                    src={userRank.imagePath}
                    alt={userRank.name}
                    width={90}
                    height={90}
                    className="mb-2"
                  />
                  <span className="text-xl font-bold" style={{ color: userRank.color }}>
                    {userRank.name}
                  </span>
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted p-3 rounded-md">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">Focus Time</span>
                      </div>
                      <span className="text-xl font-bold">{formatTime(userFocusTime)}</span>
                    </div>
                    
                    <div className="bg-muted p-3 rounded-md">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckSquare className="h-4 w-4" />
                        <span className="text-sm">Completed Tasks</span>
                      </div>
                      <span className="text-xl font-bold">{userTasks}</span>
                    </div>
                  </div>
                  
                  {progressData.nextRank && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium">
                        Progress to {progressData.nextRank.name} Rank
                      </h3>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" /> Focus Time
                          </span>
                          <span>
                            {formatTime(userFocusTime)} / {formatTime(progressData.nextRank.focusTimeRequired)}
                          </span>
                        </div>
                        <Progress value={progressData.focusTimePercent} />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center">
                            <CheckSquare className="h-3 w-3 mr-1" /> Tasks
                          </span>
                          <span>
                            {userTasks} / {progressData.nextRank.tasksRequired}
                          </span>
                        </div>
                        <Progress value={progressData.tasksPercent} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Rank Tiers Card */}
        <Card>
          <CardHeader>
            <CardTitle>Rank Tiers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.values(RANKS).map((rank) => (
                <div key={rank.tier} className="flex items-start gap-4 py-3 border-b border-muted-foreground last:border-0">
                  <Image 
                    src={rank.imagePath}
                    alt={rank.name}
                    width={60}
                    height={60}
                  />
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-bold" style={{ color: rank.color }}>
                      {rank.name}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      <div className="flex items-center text-sm">
                        <Clock className="h-4 w-4 mr-2 text-accent-foreground" />
                        <span className="text-muted-foreground mr-1">Focus Time:</span>
                        <span className="font-medium">{formatTime(rank.focusTimeRequired)}</span>
                      </div>
                      
                      <div className="flex items-center text-sm">
                        <CheckSquare className="h-4 w-4 mr-2 text-accent-foreground" />
                        <span className="text-muted-foreground mr-1">Tasks:</span>
                        <span className="font-medium">{rank.tasksRequired}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-muted p-4 rounded-md mt-6">
              <h3 className="font-medium mb-2">How Ranks Work</h3>
              <p className="text-sm text-muted-foreground">
                Ranks are determined by either your total focus time or completed tasks - whichever gives you the higher rank. 
                Continue to focus and complete tasks to rise through the ranks!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}