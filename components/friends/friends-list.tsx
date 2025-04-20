'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useVisibilityAwareLoading } from '@/hooks/useVisibilityAwareLoading';
import { useAuth } from '@/components/auth-provider';
import { getSupabaseClient } from '@/utils/supabase/supabase-wrapper';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from '@/components/ui/dialog';
import { UserPlus, RefreshCcw, Clock, CheckSquare, Flame, Users, UserMinus } from 'lucide-react';
import ProfileImage from '@/components/profile-image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import FriendRequests from './friend-requests';
import { useFriendRequests } from '@/hooks/useFriendRequests';
import { calculateUserRank, RankInfo, formatTime } from '@/utils/rank';
import RankBadge from '@/components/rank-badge';

// Enhanced Friend interface with rank
interface Friend {
  id: string;
  username: string;
  profile_picture: string | null;
  total_focus_time: number;
  completed_tasks_count: number;
  streak_days: number;
  is_premium: boolean;
  rank: RankInfo; // Added rank property
}

export default function FriendsList() {
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [friendUsername, setFriendUsername] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const { isInitialized, isAuthenticated } = useAuth();
  const { searchUser, sendFriendRequest } = useFriendRequests();

  const router = useRouter();

  // Cancel any hanging requests when component unmounts
  useEffect(() => {
    return () => {
      setIsAdding(false);
    };
  }, []);
  
  const fetchFriends = useCallback(async () => {
    console.log('Fetching friends list');
    try {
      // Safety timeout
      const timeout = new Promise<any>((_, reject) => 
        setTimeout(() => reject(new Error("Fetch timeout")), 3500)
      );
      
      // Get initialized client
      const supabase = await getSupabaseClient();
      
      // Get user with timeout
      const authPromise = supabase.auth.getUser();
      const authResult = await Promise.race([authPromise, timeout]);
      const user = authResult.data.user;
      
      if (!user) {
        return []; // Return empty array for unauthenticated users
      }
      
      // Safe fetch with timeout helper
      const safeFetch = async (query: any) => {
        try {
          const result = await Promise.race([query, timeout]);
          return result.data || [];
        } catch (e) {
          console.warn('Query timeout:', e);
          return [];
        }
      };
      
      // Fetch friend IDs with timeout protection
      const friendIdsData = await safeFetch(
        supabase.from('user_friends')
          .select('friend_id')
          .eq('user_id', user.id)
      );
      
      if (!friendIdsData || friendIdsData.length === 0) {
        return [];
      }
      
      const friendIds = friendIdsData.map((row: any) => row.friend_id);
      
      // Fetch friend details with timeout protection
      const usersData = await safeFetch(
        supabase.from('users')
          .select('id, username, profile_picture, total_focus_time, completed_tasks_count, streak_days, is_premium')
          .in('id', friendIds)
      );
      
      return (usersData || []).map((userData: any) => {
        // Calculate rank for each friend
        const rank = calculateUserRank(
          userData.total_focus_time || 0,
          userData.completed_tasks_count || 0
        );
        
        return {
          id: userData.id,
          username: userData.username || 'Anonymous',
          profile_picture: userData.profile_picture,
          total_focus_time: userData.total_focus_time || 0,
          completed_tasks_count: userData.completed_tasks_count || 0,
          streak_days: userData.streak_days || 0,
          is_premium: !!userData.is_premium,
          rank
        };
      });
    } catch (err) {
      console.error('Friend loading error:', err);
      return []; // Return empty array on error
    }
  }, []);  
  
  const { 
    isLoading, 
    data: friends, 
    refresh: loadFriends 
  } = useVisibilityAwareLoading<Friend[]>(fetchFriends, {
    refreshOnVisibility: false,
    loadingTimeout: 4000
  });

  const handleAddFriend = async () => {
    if (!friendUsername.trim()) {
      toast.error('Please enter a username');
      return;
    }
    
    setIsAdding(true);
    
    try {
      const foundUser = await searchUser(friendUsername);
      
      if (!foundUser) {
        toast.error('User not found');
        return;
      }
  
      const success = await sendFriendRequest(foundUser.id);
      
      if (success) {
        toast.success(`Friend request sent to ${foundUser.username}`);
        setFriendUsername('');
      }
    } finally {
      setIsAdding(false);
    }
  };
  
  const handleFriendClick = (friend: Friend) => {
    setSelectedFriend(friend);
    setIsDialogOpen(true);
  };
  
  // Function to remove a friend
  const handleRemoveFriend = async (friend: Friend) => {
    try {
      // Get initialized client
      const supabase = await getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
  
      if (!user) {
        toast.error('You must be signed in to remove friends');
        return;
      }
      
      // Delete both friendship entries
      const promises = [
        // Delete current user -> friend relationship
        supabase
          .from('user_friends')
          .delete()
          .eq('user_id', user.id)
          .eq('friend_id', friend.id),
          
        // Delete friend -> current user relationship
        supabase
          .from('user_friends')
          .delete()
          .eq('user_id', friend.id)
          .eq('friend_id', user.id)
      ];
      
      const [result1, result2] = await Promise.all(promises);
      
      if (result1.error) throw result1.error;
      if (result2.error) throw result2.error;
      
      // Close dialog and refresh friends list
      setIsDialogOpen(false);
      toast.success(`Removed ${friend.username} from your friends`);
      
      // Refresh friends list
      loadFriends();
      
    } catch (error) {
      console.error('Failed to remove friend:', error);
      toast.error('Failed to remove friend');
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-secondary-foreground"></div>
      </div>
    );
  }
  
  // If not authenticated after initialization, redirect
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/sign-in');
    }
  }, [isInitialized, isAuthenticated, router]);


  return (
    <div className="container mx-auto max-w-3xl py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Friends
          </CardTitle>
          <div className="flex gap-2">
            <FriendRequests />
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadFriends}
              disabled={isLoading}
            >
              <RefreshCcw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Add Friend Form */}
          <div className="mb-6 flex gap-2">
            <Input
              placeholder="Enter username to add friend"
              value={friendUsername}
              onChange={e => setFriendUsername(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleAddFriend} 
              disabled={isAdding || !friendUsername.trim()}
            >
              <UserPlus className="h-4 w-4 mr-1" />
              {isAdding ? 'Sending...' : 'Send Request'}
            </Button>
          </div>
          
          {/* Friends List */}
          {isLoading ? (
            <div className="flex justify-center py-6">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-secondary-foreground"></div>
            </div>
          ) : friends?.length ? (
            <div className="space-y-3">
              {friends.map(friend => (          
                <div
                  key={friend.id} 
                  className="flex items-center p-3 bg-background rounded-md hover:bg-muted cursor-pointer transition-colors"
                  onClick={() => handleFriendClick(friend)}
                >
                  <ProfileImage 
                    src={friend.profile_picture} 
                    alt={friend.username} 
                    size={40} 
                  />
                  <div className="ml-3 flex-1">
                    <div className="font-medium flex items-center">
                      {friend.username}
                      {/* Add rank badge next to name */}
                      <RankBadge rank={friend.rank} size="sm" />
                      {friend.is_premium && (
                        <span className="ml-1 text-yellow-500" title="Premium User">
                          ✦
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {friend.completed_tasks_count} tasks • {formatTime(friend.total_focus_time)} focus time
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-foreground">
              <p>No friends added yet.</p>
              <p className="text-sm mt-1 text-muted-foreground">Search by username to add friends.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Friend Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className='text-foreground'>Friend Profile</DialogTitle>
          </DialogHeader>
          
          {selectedFriend && (
            <div className="py-4">
              <div className="flex items-center gap-4 mb-6 p-2 rounded-md bg-background hover:bg-muted transition-colors">
                <ProfileImage 
                  src={selectedFriend.profile_picture} 
                  alt={selectedFriend.username} 
                  size={64} 
                />
                <div>
                  <h3 className="font-medium text-lg flex items-center text-accent-foreground">
                    {selectedFriend.username}
                    {/* Add rank badge to friend dialog */}
                    <RankBadge rank={selectedFriend.rank} size="md" />
                    {selectedFriend.is_premium && (
                      <span className="ml-1 text-yellow-500" title="Premium User">
                        ✦
                      </span>
                    )}
                  </h3>
                </div>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 rounded-md bg-muted p-2">
                <div className="bg-background p-3 rounded-md flex flex-col items-center">
                  <Clock className="h-5 w-5 mb-1 text-accent-foreground" />
                  <span className="text-xs text-muted-foreground">Focus Time</span>
                  <span className="font-bold text-foreground">{formatTime(selectedFriend.total_focus_time)}</span>
                </div>
                
                <div className="bg-background p-3 rounded-md flex flex-col items-center">
                  <CheckSquare className="h-5 w-5 mb-1 text-accent-foreground" />
                  <span className="text-xs text-muted-foreground">Tasks</span>
                  <span className="font-bold text-foreground">{selectedFriend.completed_tasks_count}</span>
                </div>
                
                <div className="bg-background p-3 rounded-md flex flex-col items-center">
                  <Flame className="h-5 w-5 mb-1 text-accent-foreground" />
                  <span className="text-xs text-muted-foreground">Streak</span>
                  <span className="font-bold text-foreground">{selectedFriend.streak_days} days</span>
                </div>
              </div>
              
              {/* Action buttons for removing friends */}
              <div className="flex justify-between mt-6">
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveFriend(selectedFriend)}
                  className="bg-background border border-foreground"
                >
                  <UserMinus className="h-4 w-4 mr-2" />
                  Remove Friend
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}