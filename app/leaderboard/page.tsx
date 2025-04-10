'use client';

import { useState, useCallback } from 'react';
import { useVisibilityAwareLoading } from '@/hooks/useVisibilityAwareLoading';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LeaderboardUser } from '@/types/user';
import ProfileImage from '@/components/profile-image';
import { Clock, CheckSquare, Trophy, Users, Globe } from 'lucide-react';

export default function LeaderboardPage() {
  const [activeLeaderboard, setActiveLeaderboard] = useState('global');

  const supabase = createClient();
  
  const fetchLeaderboardData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Fetch global leaderboards
      const [focusData, taskData] = await Promise.all([
        supabase.from('users')
          .select('id, username, profile_picture, total_focus_time, streak_days, is_premium')
          .order('total_focus_time', { ascending: false })
          .limit(10),
        supabase.from('users')
          .select('id, username, profile_picture, completed_tasks_count, streak_days, is_premium')
          .order('completed_tasks_count', { ascending: false })
          .limit(10)
      ]);

      const result: {
        focusLeaders: LeaderboardUser[];
        taskLeaders: LeaderboardUser[];
        friendFocusLeaders: LeaderboardUser[];
        friendTaskLeaders: LeaderboardUser[];
      } = {
        focusLeaders: (focusData.data || []) as LeaderboardUser[],
        taskLeaders: (taskData.data || []) as LeaderboardUser[],
        friendFocusLeaders: [],
        friendTaskLeaders: []
      };
      
      // If user is authenticated, fetch friends leaderboards
      if (user) {
        // Get list of friends
        const { data: friendsData } = await supabase
          .from('user_friends')
          .select('friend_id')
          .eq('user_id', user.id);
        
        if (friendsData && friendsData.length > 0) {
          const friendIds = friendsData.map(f => f.friend_id);
          
          // Include current user
          friendIds.push(user.id);
          
          // Fetch friend leaderboards
          const [friendFocusData, friendTaskData] = await Promise.all([
            supabase.from('users')
              .select('id, username, profile_picture, total_focus_time, streak_days, is_premium')
              .in('id', friendIds)
              .order('total_focus_time', { ascending: false }),
            supabase.from('users')
              .select('id, username, profile_picture, completed_tasks_count, streak_days, is_premium')
              .in('id', friendIds)
              .order('completed_tasks_count', { ascending: false })
          ]);
          
          result.friendFocusLeaders = friendFocusData.data as LeaderboardUser[] || [];
          result.friendTaskLeaders = friendTaskData.data as LeaderboardUser[] || [];
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error loading leaderboards:', error);
      return {
        focusLeaders: [],
        taskLeaders: [],
        friendFocusLeaders: [],
        friendTaskLeaders: []
      };
    }
  }, [supabase]);

  // Use the hook
  const { isLoading, data, refresh: loadLeaderboards } = useVisibilityAwareLoading(fetchLeaderboardData);

  // Extract state from the data
  const focusLeaders = data?.focusLeaders || [];
  const taskLeaders = data?.taskLeaders || [];
  const friendFocusLeaders = data?.friendFocusLeaders || [];
  const friendTaskLeaders = data?.friendTaskLeaders || []; 

  
  const formatTime = (seconds: number = 0): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return hours > 0 
      ? `${hours}h ${minutes}m` 
      : `${minutes}m`;
  };

  // Function to render rank indicator (crown for top 3)
  const renderRankIndicator = (rank: number) => {
    if (rank <= 3) {
      // Crown for top 3 with rank number inside
      let crownColor: string;
      let crownFill: string;
      
      if (rank === 1) {
        crownColor = "#FFF2C0"; // Gold
        crownFill = "#FFD30F";
      } else if (rank === 2) {
        crownColor = "#EEEEEE"; // Silver
        crownFill = "#CBCBCB";
      } else {
        crownColor = "#FFB06B"; // Bronze
        crownFill = "#FF9436";
      }
      
      return (
        <div className="relative h-10 w-10 flex items-center justify-center mr-0.5">
          {/* Crown with border effect */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke={crownColor}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute inset-0 m-auto drop-shadow-md"
          >
            <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill={crownFill}
            stroke={crownFill}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute inset-0 m-auto drop-shadow-sm"
          >
            <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
          </svg>
          
          {/* Rank number positioned in center of crown */}
          <span 
            className="absolute inset-0 flex items-center justify-center text-xs font-bold"
            style={{ marginBottom:'2px', color: rank === 1 ? '#8B6914' : rank === 2 ? '#6F6F6F' : '#8B4513' }}
          >
            {rank}
          </span>
        </div>
      );
    } else {
      // Regular number for rank 4+
      return (
        <div className="h-10 w-10 flex items-center justify-center mr-0.5">
          <span className="text-sm font-semibold">
            {rank}
          </span>
        </div>
      );
    }
  };  
  
  return (
    <div className="container mx-auto max-w-3xl py-8">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Leaderboard</h1>
      
      <Tabs defaultValue="global" value={activeLeaderboard} onValueChange={setActiveLeaderboard}>
        <TabsList className="w-full mb-6">
          <TabsTrigger value="global" className="flex-1">
            <Globe className="mr-2 h-4 w-4" />
            Global Rankings
          </TabsTrigger>
          <TabsTrigger value="friends" className="flex-1">
            <Users className="mr-2 h-4 w-4" />
            Friends Rankings
          </TabsTrigger>
        </TabsList>
        
        {/* Global Leaderboard */}
        <TabsContent value="global">
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
                    <Trophy className="mr-2 mt-1 h-6 w-6 text-accent-foreground" />
                    Top Focused Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-secondary-foreground"></div>
                    </div>
                  ) : (
                    <div className="divide-y divide-muted">
                      {focusLeaders.map((user, index) => (
                        <div key={user.id} className="py-3 flex items-center">
                          {/* Rank indicator (crown for top 3) */}
                          <div className="flex items-center">
                            {renderRankIndicator(index + 1)}
                            <ProfileImage 
                              src={user.profile_picture} 
                              alt={user.username || 'User'} 
                              size={40}
                            />
                          </div>
                          <div className="ml-3 flex-1">
                            <div className="font-medium flex items-center">
                              {user.username || 'Anonymous'}
                              {user.is_premium && (
                                <span className="ml-1 text-yellow-500" title="Premium User">
                                  ✦
                                </span>
                              )}
                            </div>
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
                    <Trophy className="mr-2 mt-1 h-6 w-6 text-accent-foreground" />
                    Top Task Completers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-secondary-foreground"></div>
                    </div>
                  ) : (
                    <div className="divide-y divide-muted">
                      {taskLeaders.map((user, index) => (
                        <div key={user.id} className="py-3 flex items-center">
                          {/* Rank indicator (crown for top 3) */}
                          <div className="flex items-center">
                            {renderRankIndicator(index + 1)}
                            <ProfileImage 
                              src={user.profile_picture} 
                              alt={user.username || 'User'} 
                              size={40}
                            />
                          </div>
                          <div className="ml-3 flex-1">
                            <div className="font-medium flex items-center">
                              {user.username || 'Anonymous'}
                              {user.is_premium && (
                                <span className="ml-1 text-yellow-500" title="Premium User">
                                  ✦
                                </span>
                              )}
                            </div>
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
        </TabsContent>
        
        {/* Friends Leaderboard */}
        <TabsContent value="friends">
          <Tabs defaultValue="focus">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="focus" className="flex-1">
                <Clock className="mr-2 h-4 w-4" />
                Focus Time
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex-1">
                <CheckSquare className="mr-2 h-4 w-4" />
                Task Completion
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="focus">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Trophy className="mr-2 mt-1 h-6 w-6 text-accent-foreground" />
                    Friends Focus Leaderboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-secondary-foreground"></div>
                    </div>
                  ) : friendFocusLeaders.length > 0 ? (
                    <div className="divide-y divide-muted">
                      {friendFocusLeaders.map((user, index) => (
                        <div key={user.id} className="py-3 flex items-center">
                          {/* Rank indicator (crown for top 3) */}
                          <div className="flex items-center">
                            {renderRankIndicator(index + 1)}
                            <ProfileImage 
                              src={user.profile_picture} 
                              alt={user.username || 'User'} 
                              size={40}
                            />
                          </div>
                          <div className="ml-3 flex-1">
                            <div className="font-medium flex items-center">
                              {user.username || 'Anonymous'}
                              {user.is_premium && (
                                <span className="ml-1 text-yellow-500" title="Premium User">
                                  ✦
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {user.streak_days ? `${user.streak_days} day streak` : 'Just getting started'}
                            </div>
                          </div>
                          <div className="font-semibold">
                            {formatTime(user.total_focus_time)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      <p>No friends data available.</p>
                      <p className="text-sm mt-2">Add friends to see how you compare!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="tasks">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Trophy className="mr-2 mt-1 h-6 w-6 text-accent-foreground" />
                    Friends Task Leaderboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-secondary-foreground"></div>
                    </div>
                  ) : friendTaskLeaders.length > 0 ? (
                    <div className="divide-y divide-muted">
                      {friendTaskLeaders.map((user, index) => (
                        <div key={user.id} className="py-3 flex items-center">
                          {/* Rank indicator (crown for top 3) */}
                          <div className="flex items-center">
                            {renderRankIndicator(index + 1)}
                            <ProfileImage 
                              src={user.profile_picture} 
                              alt={user.username || 'User'} 
                              size={40}
                            />
                          </div>
                          <div className="ml-3 flex-1">
                            <div className="font-medium flex items-center">
                              {user.username || 'Anonymous'}
                              {user.is_premium && (
                                <span className="ml-1 text-yellow-500" title="Premium User">
                                  ✦
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {user.streak_days ? `${user.streak_days} day streak` : 'Just getting started'}
                            </div>
                          </div>
                          <div className="font-semibold">
                            {user.completed_tasks_count || 0} tasks
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      <p>No friends data available.</p>
                      <p className="text-sm mt-2">Add friends to see how you compare!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}