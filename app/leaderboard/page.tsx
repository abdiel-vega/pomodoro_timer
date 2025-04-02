'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LeaderboardUser } from '@/types/user';
import ProfileImage from '@/components/profile-image';
import { Clock, CheckSquare, Trophy } from 'lucide-react';

export default function LeaderboardPage() {
  const [focusLeaders, setFocusLeaders] = useState<LeaderboardUser[]>([]);
  const [taskLeaders, setTaskLeaders] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  
  useEffect(() => {
    const loadLeaderboards = async () => {
      setIsLoading(true);
      
      try {
        // Fetch focus time leaders
        const { data: focusData } = await supabase
          .from('users')
          .select('id, username, profile_picture, total_focus_time, streak_days')
          .order('total_focus_time', { ascending: false })
          .limit(10);
          
        // Fetch task completion leaders
        const { data: taskData } = await supabase
          .from('users')
          .select('id, username, profile_picture, completed_tasks_count, streak_days')
          .order('completed_tasks_count', { ascending: false })
          .limit(10);
          
        // Type assertion to ensure type safety
        setFocusLeaders(focusData as LeaderboardUser[] || []);
        setTaskLeaders(taskData as LeaderboardUser[] || []);
      } catch (error) {
        console.error('Error loading leaderboards:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadLeaderboards();
  }, []);
  
  const formatTime = (seconds: number = 0): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return hours > 0 
      ? `${hours}h ${minutes}m` 
      : `${minutes}m`;
  };
  
  return (
    <div className="container mx-auto max-w-3xl py-8">
      <h1 className="text-3xl font-bold mb-6">Leaderboard</h1>
      
      <Tabs defaultValue="focus">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="focus" className="flex-1">
            <Clock className="mr-2 h-4 w-4" />
            Focus Time Leaders
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex-1">
            <CheckSquare className="mr-2 h-4 w-4" />
            Task Completion Leaders
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="focus">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
                Top Focused Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="divide-y">
                  {focusLeaders.map((user, index) => (
                    <div key={user.id} className="py-3 flex items-center">
                      <div className="w-8 text-center font-bold text-lg">
                        {index + 1}
                      </div>
                      <ProfileImage 
                        src={user.profile_picture} 
                        alt={user.username || 'User'} 
                        size={40} 
                      />
                      <div className="ml-3 flex-1">
                        <div className="font-medium">{user.username || 'Anonymous'}</div>
                        <div className="text-xs text-muted-foreground">
                          {user.streak_days ? `${user.streak_days} day streak` : 'Just getting started'}
                        </div>
                      </div>
                      <div className="font-semibold">
                        {formatTime(user.total_focus_time)}
                      </div>
                    </div>
                  ))}
                  
                  {focusLeaders.length === 0 && (
                    <div className="py-8 text-center text-muted-foreground">
                      No data available yet
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
                Top Task Completers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="divide-y">
                  {taskLeaders.map((user, index) => (
                    <div key={user.id} className="py-3 flex items-center">
                      <div className="w-8 text-center font-bold text-lg">
                        {index + 1}
                      </div>
                      <ProfileImage 
                        src={user.profile_picture} 
                        alt={user.username || 'User'} 
                        size={40} 
                      />
                      <div className="ml-3 flex-1">
                        <div className="font-medium">{user.username || 'Anonymous'}</div>
                        <div className="text-xs text-muted-foreground">
                          {user.streak_days ? `${user.streak_days} day streak` : 'Just getting started'}
                        </div>
                      </div>
                      <div className="font-semibold">
                        {user.completed_tasks_count || 0} tasks
                      </div>
                    </div>
                  ))}
                  
                  {taskLeaders.length === 0 && (
                    <div className="py-8 text-center text-muted-foreground">
                      No data available yet
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}