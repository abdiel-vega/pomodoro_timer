'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { calculateUserRank, RANKS, calculateProgressToNextRank, formatTime, RankInfo } from '@/utils/rank';
import Image from 'next/image';
import { Clock, CheckSquare, Trophy, Info, Award, Star, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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

  const lightenColor = (hex: string, percent: number): string => {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    const lightenValue = (value: number): number => {
      return Math.min(255, Math.floor(value + (255 - value) * (percent / 100)));
    };
    
    const rNew = lightenValue(r).toString(16).padStart(2, '0');
    const gNew = lightenValue(g).toString(16).padStart(2, '0');
    const bNew = lightenValue(b).toString(16).padStart(2, '0');
    
    return `#${rNew}${gNew}${bNew}`;
  };
  
  const darkenColor = (hex: string, percent: number): string => {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    const darkenValue = (value: number): number => {
      return Math.max(0, Math.floor(value * (100 - percent) / 100));
    };
    
    const rNew = darkenValue(r).toString(16).padStart(2, '0');
    const gNew = darkenValue(g).toString(16).padStart(2, '0');
    const bNew = darkenValue(b).toString(16).padStart(2, '0');
    
    return `#${rNew}${gNew}${bNew}`;
  };
  
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
        {/* Current Rank Card - Enhanced with hover effects */}
        <Card className="group overflow-hidden transition-all duration-300 border border-foreground">
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2 text-accent-foreground">
              <Trophy className="h-5 w-5" />
              Your Current Rank
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-6">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-secondary-foreground"></div>
              </div>
            ) : (
              <div className="flex flex-col items-center md:flex-row md:items-start gap-6">
                <div className="relative transition-all duration-300 group-hover:scale-105">
                  <div style={{ filter: `drop-shadow(0 0 8px ${lightenColor(userRank.color, 30)})` }}>
                    <Image 
                      src={userRank.imagePath}
                      alt={userRank.name}
                      width={90}
                      height={90}
                      className="mb-2 transition-transform duration-300"
                    />
                    <span 
                      className="block text-center text-xl font-bold transition-all duration-300" 
                      style={{ color: userRank.color }}
                    >
                      {userRank.name}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted p-3 rounded-md overflow-hidden relative group/stat transition-all duration-300 hover:bg-background">
                      <div 
                        className="absolute inset-y-0 left-0 w-1 transition-all duration-300"
                        style={{ backgroundColor: userRank.color }}
                      />
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 transition-transform duration-300 group-hover/stat:scale-110" />
                        <span className="text-sm">Focus Time</span>
                      </div>
                      <span className="text-xl font-bold transition-all duration-300">{formatTime(userFocusTime)}</span>
                    </div>
                    
                    <div className="bg-muted p-3 rounded-md overflow-hidden relative group/stat transition-all duration-300 hover:bg-background">
                      <div 
                        className="absolute inset-y-0 left-0 w-1 transition-all duration-300"
                        style={{ backgroundColor: userRank.color }}
                      />
                      <div className="flex items-center gap-2 mb-1">
                        <CheckSquare className="h-4 w-4 transition-transform duration-300 group-hover/stat:scale-110" />
                        <span className="text-sm">Completed Tasks</span>
                      </div>
                      <span className="text-xl font-bold transition-all duration-300">{userTasks}</span>
                    </div>
                  </div>
                  
                  {progressData.nextRank && (
                    <div className="space-y-3 p-3 bg-background rounded-md transition-all duration-300 border border-muted hover:border-accent-foreground">
                      <h3 className="text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Award 
                            className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" 
                            style={{ color: progressData.nextRank.color }}
                          />
                          <span>Progress to {progressData.nextRank.name} Rank</span>
                        </div>
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
                        <Progress 
                          value={progressData.focusTimePercent} 
                          className="h-2 transition-all duration-300"
                        >
                          <div 
                            className="h-full transition-all duration-300"
                            style={{ 
                              width: `${progressData.focusTimePercent}%`,
                              background: progressData.nextRank.color
                            }} 
                          />
                        </Progress>
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
                        <Progress 
                          value={progressData.tasksPercent} 
                          className="h-2 transition-all duration-300"
                        >
                          <div 
                            className="h-full transition-all duration-300"
                            style={{ 
                              width: `${progressData.tasksPercent}%`,
                              background: progressData.nextRank.color
                            }} 
                          />
                        </Progress>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Rank Tiers Card - Enhanced with interactive elements */}
        <Card className="border border-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-accent-foreground">
              <Trophy className="h-5 w-5" />
              Rank Tiers & Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.values(RANKS).map((rank, index) => (
                <div 
                  key={rank.tier} 
                  className="group relative overflow-hidden rounded-lg transition-all duration-300 hover:shadow-md border border-muted hover:border-accent-foreground"
                  style={{ 
                    borderLeftWidth: '4px',
                    borderLeftColor: rank.color,
                  }}
                >
                  <div className="flex p-4 items-center gap-4">
                    {/* Rank Medal with hover effects */}
                    <div 
                      className="rounded-full p-2 flex-shrink-0 transition-all duration-300 group-hover:scale-105 bg-muted" 
                    >
                      <div className="transition-all duration-300">
                        <Image 
                          src={rank.imagePath}
                          alt={rank.name}
                          width={60}
                          height={60}
                          className="transition-transform duration-300"
                        />
                      </div>
                    </div>
                    
                    {/* Rank Info with interactive elements */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center flex-wrap gap-2">
                        {/* Enhanced rank name with background for better visibility */}
                        <h3 className="py-1 px-3 rounded-md text-md font-bold transition-all duration-300 inline-flex items-center"
                          style={{ 
                            backgroundColor: lightenColor(rank.color, 90),
                            color: darkenColor(rank.color, 20),
                            boxShadow: `0 0 0 1px ${rank.color}` 
                          }}>
                          {rank.name}
                        </h3>
                        {userRank.tier === rank.tier && (
                          <div 
                            className="text-xs font-medium rounded-full px-2 py-1 text-background bg-secondary-foreground flex items-center gap-1 transition-all duration-300"
                          >
                            <Star size={12} className="fill-background" />
                            <span>Current Rank</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Requirements with hover effects */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                        <div 
                          className="group/req flex items-center bg-muted p-2 rounded-md overflow-hidden relative transition-all duration-300 hover:bg-background"
                        >
                          <div 
                            className="absolute inset-y-0 left-0 w-1 transition-all duration-300 group-hover/req:w-1.5"
                            style={{ backgroundColor: rank.color }}
                          />
                          <Clock className="h-5 w-5 ml-2 mr-3 text-accent-foreground transition-transform duration-300 group-hover/req:scale-110" />
                          <div className="space-y-0.5">
                            <div className="text-xs text-muted-foreground">Focus Time Required</div>
                            <div className="font-semibold transition-all duration-300">{formatTime(rank.focusTimeRequired)}</div>
                          </div>
                        </div>
                        
                        <div 
                          className="group/req flex items-center bg-muted p-2 rounded-md overflow-hidden relative transition-all duration-300 hover:bg-background"
                        >
                          <div 
                            className="absolute inset-y-0 left-0 w-1 transition-all duration-300 group-hover/req:w-1.5"
                            style={{ backgroundColor: rank.color }}
                          />
                          <CheckSquare className="h-5 w-5 ml-2 mr-3 text-accent-foreground transition-transform duration-300 group-hover/req:scale-110" />
                          <div className="space-y-0.5">
                            <div className="text-xs text-muted-foreground">Tasks Required</div>
                            <div className="font-semibold transition-all duration-300">{rank.tasksRequired}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Improved progression indicator */}
                  {index < Object.values(RANKS).length - 1 && (
                    <div className="flex justify-center py-3">
                      <div className="flex flex-col items-center">
                        <ArrowDown className="text-accent-foreground w-5 h-5 animate-bounce opacity-70" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* How Ranks Work card - Keeping as is from previous design */}
            <div 
              className="mt-8 bg-muted p-4 rounded-lg border border-accent-foreground hover:shadow-md transition-all duration-300 group"
            >
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Info className="h-4 w-4 text-accent-foreground transition-transform duration-300 group-hover:scale-110" />
                How Ranks Work
              </h3>
              <p className="text-sm text-muted-foreground transition-all duration-300 group-hover:text-foreground">
                Your rank is determined by your <strong>highest achievement</strong> in either focus time or completed tasks. 
                Continue to focus and complete tasks to rise through the ranks!
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4 transition-all duration-300 opacity-0 group-hover:opacity-100"
                asChild
              >
                <Link href="/leaderboard">
                  <Trophy className="h-4 w-4 mr-2" />
                  View Leaderboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}