'use client';

import { useState, useCallback } from 'react';
import { useVisibilityAwareLoading } from '@/hooks/useVisibilityAwareLoading';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from '@supabase/supabase-js';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LeaderboardUser } from '@/types/user';
import ProfileImage from '@/components/profile-image';
import RankBadge from '@/components/rank-badge';
import { calculateUserRank, RANKS, formatTime } from '@/utils/rank';
import { Button } from '@/components/ui/button';
import { Clock, CheckSquare, Trophy, Users, Globe, Info } from 'lucide-react';
import Link from 'next/link';


export default function LeaderboardPage() {
  const [activeLeaderboard, setActiveLeaderboard] = useState('global');
  const supabase = createClient();
  
  const fetchLeaderboardData = useCallback(async () => {
    console.log('Fetching leaderboard data');
    try {
      // Add timeout protection
      const timeout = new Promise<any>((_, reject) => 
        setTimeout(() => reject(new Error("Fetch timeout")), 4000)
      );
      
      // Get auth user with timeout
      const authPromise = supabase.auth.getUser().then(res => res.data.user);
      const user = await Promise.race<User | null>([authPromise, timeout])
        .catch(() => null);
      
      // Safe fetch with timeout pattern
      const safeFetch = async (query: any) => {
        try {
          const result = await Promise.race([query, timeout]);
          return result.data || [];
        } catch (e) {
          console.warn('Query timeout:', e);
          return [];
        }
      };
  
      // Parallel data fetching with timeout protection
      const [focusData, taskData] = await Promise.all([
        safeFetch(
          supabase.from('users')
            .select('id, username, profile_picture, total_focus_time, completed_tasks_count, streak_days, is_premium')
            .order('total_focus_time', { ascending: false })
            .limit(10)
        ),
        safeFetch(
          supabase.from('users')
            .select('id, username, profile_picture, total_focus_time, completed_tasks_count, streak_days, is_premium')
            .order('completed_tasks_count', { ascending: false })
            .limit(10)
        )
      ]);
  
      // Initialize with safe default structure even when empty
      const result = {
        focusLeaders: focusData || [],
        taskLeaders: taskData || [],
        friendFocusLeaders: [],
        friendTaskLeaders: [],
        currentUserId: user?.id || null
      };
      
      // Only fetch friends data if user is authenticated
      if (user) {
        // Get list of friends with timeout protection
        const friendsData = await safeFetch(
          supabase.from('user_friends')
            .select('friend_id')
            .eq('user_id', user.id)
        );
        
        if (friendsData && friendsData.length > 0) {
          const friendIds = friendsData.map((f: any) => f.friend_id);
          
          // Include current user
          friendIds.push(user.id);
          
          // Fetch friend leaderboards with timeout protection
          const [friendFocusData, friendTaskData] = await Promise.all([
            safeFetch(
              supabase.from('users')
                .select('id, username, profile_picture, total_focus_time, completed_tasks_count, streak_days, is_premium')
                .in('id', friendIds)
                .order('total_focus_time', { ascending: false })
            ),
            safeFetch(
              supabase.from('users')
                .select('id, username, profile_picture, total_focus_time, completed_tasks_count, streak_days, is_premium')
                .in('id', friendIds)
                .order('completed_tasks_count', { ascending: false })
            )
          ]);
          
          result.friendFocusLeaders = friendFocusData || [];
          result.friendTaskLeaders = friendTaskData || [];
        }
      }
      
      console.log('Leaderboard data fetched successfully');
      return result;
    } catch (error) {
      console.error('Error loading leaderboards:', error);
      // Return safe default data to prevent loading failures
      return {
        focusLeaders: [],
        taskLeaders: [],
        friendFocusLeaders: [],
        friendTaskLeaders: [],
        currentUserId: null
      };
    }
  }, [supabase]);

  // Use the hook to manage loading state and data refresh
  const { 
    isLoading, 
    data, 
    refresh: loadLeaderboards 
  } = useVisibilityAwareLoading(fetchLeaderboardData, { 
    refreshOnVisibility: false,
    loadingTimeout: 4000 // 4 second max loading time
  });

  // Extract state from the data
  const focusLeaders = data?.focusLeaders || [];
  const taskLeaders = data?.taskLeaders || [];
  const friendFocusLeaders = data?.friendFocusLeaders || [];
  const friendTaskLeaders = data?.friendTaskLeaders || [];
  const currentUserId = data?.currentUserId || null;

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
          
          {/* Leaderboard number positioned in center of crown */}
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

  // Render a user row with their stats and rank
  const renderUserRow = (user: LeaderboardUser, index: number, showFocusTime: boolean = true) => {
    // Calculate user rank based on their stats
    const userRank = calculateUserRank(
      user.total_focus_time || 0,
      user.completed_tasks_count || 0
    );
    
    // Check if this is the current user
    const isCurrentUser = user.id === currentUserId;
    
    return (
      <div 
        key={user.id} 
        className={`py-3 flex items-center ${isCurrentUser ? 'bg-muted/50 rounded-md' : ''}`}
      >
        {/* Leaderboard position (1st, 2nd, etc.) */}
        <div className="flex items-center">
          {renderRankIndicator(index + 1)}
          <ProfileImage 
            src={user.profile_picture} 
            alt={user.username || 'User'} 
            size={40}
          />
        </div>
        
        <div className="ml-3 flex-1 flex items-center">
          <div className="flex-1">
            <div className="font-medium flex items-center">
              {user.username || 'Anonymous'}
              {user.is_premium && (
                <span className="ml-1 text-yellow-500" title="Premium User">
                  ✦
                </span>
              )}
              {isCurrentUser && (
                <span className="ml-1 text-xs text-muted-foreground">(You)</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {user.streak_days ? `${user.streak_days} day streak` : 'Just getting started'}
            </div>
          </div>
          
          {/* Rank badge */}
          <div className="flex items-center mr-2">
            <RankBadge rank={userRank} size="sm" />
          </div>
          
          {/* Focus time or task count */}
          <div className="font-semibold text-right">
            {showFocusTime 
              ? formatTime(user.total_focus_time || 0)
              : `${user.completed_tasks_count || 0} tasks`
            }
          </div>
        </div>
      </div>
    );
  };

  const renderFocusLeaderRow = (user: LeaderboardUser, index: number) => {
    return renderUserRow(user, index, true);
  };
  
  const renderTaskLeaderRow = (user: LeaderboardUser, index: number) => {
    return renderUserRow(user, index, false);
  };
  
  return (
    <div className="container mx-auto max-w-3xl py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-foreground">Leaderboard</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/rank-info">
            <Info className="h-4 w-4 mr-2" />
            Rank Info
          </Link>
        </Button>
      </div>
      
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
                      {focusLeaders.map(renderFocusLeaderRow)}
                      
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
                      {taskLeaders.map(renderTaskLeaderRow)}
                      
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
                        renderUserRow(user, index, true)
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
                        renderUserRow(user, index, false)
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