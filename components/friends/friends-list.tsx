'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from '@/components/ui/dialog';
import { UserPlus, RefreshCcw, Clock, CheckSquare, Flame } from 'lucide-react';
import ProfileImage from '@/components/profile-image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

// Define the type for a Friend
interface Friend {
  id: string;
  username: string;
  profile_picture: string | null;
  total_focus_time: number;
  completed_tasks_count: number;
  streak_days: number;
  is_premium: boolean;
}

// Define the exact shape of the Supabase response
interface SupabaseFriendResponse {
  friend_id: string;
  users: {
    id: string;
    username: string | null;
    profile_picture: string | null;
    total_focus_time: number | null;
    completed_tasks_count: number | null;
    streak_days: number | null;
    is_premium: boolean | null;
  } | null;
}

export default function FriendsList() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [friendUsername, setFriendUsername] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  const supabase = createClient();
  
  useEffect(() => {
    loadFriends();
  }, []);
  
  const loadFriends = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      // Get friends list from the user_friends table
      const { data, error } = await supabase
        .from('user_friends')
        .select(`
          friend_id,
          users:friend_id(
            id, 
            username, 
            profile_picture, 
            total_focus_time, 
            completed_tasks_count, 
            streak_days,
            is_premium
          )
        `)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Safely transform the data with proper typing
      const friendsList: Friend[] = [];
      
      if (data) {
        // Type assertion with any to bypass TypeScript's strict checking
        // Then map over the data to create properly typed objects
        (data as any[]).forEach(item => {
          if (item.users) {
            friendsList.push({
              id: item.users.id,
              username: item.users.username || 'Anonymous',
              profile_picture: item.users.profile_picture,
              total_focus_time: item.users.total_focus_time || 0,
              completed_tasks_count: item.users.completed_tasks_count || 0,
              streak_days: item.users.streak_days || 0,
              is_premium: item.users.is_premium || false
            });
          }
        });
      }
      
      setFriends(friendsList);
    } catch (err) {
      console.error('Error loading friends:', err);
      toast.error('Failed to load friends');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddFriend = async () => {
    if (!friendUsername.trim()) {
      toast.error('Please enter a username');
      return;
    }
    
    setIsAdding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You need to be signed in');
        return;
      }
      
      // First, find the user by username
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, username')
        .eq('username', friendUsername.trim())
        .single();
      
      if (userError || !userData) {
        toast.error('User not found');
        return;
      }
      
      // Don't allow adding yourself
      if (userData.id === user.id) {
        toast.error('You cannot add yourself as a friend');
        return;
      }
      
      // Check if already friends
      const { data: existing, error: checkError } = await supabase
        .from('user_friends')
        .select('id')
        .match({ user_id: user.id, friend_id: userData.id })
        .single();
      
      if (existing) {
        toast.error('Already in your friends list');
        return;
      }
      
      // Add friend
      const { error: addError } = await supabase
        .from('user_friends')
        .insert([
          { user_id: user.id, friend_id: userData.id }
        ]);
      
      if (addError) throw addError;
      
      toast.success(`Added ${userData.username} to friends`);
      setFriendUsername('');
      loadFriends();
    } catch (err) {
      console.error('Error adding friend:', err);
      toast.error('Failed to add friend');
    } finally {
      setIsAdding(false);
    }
  };
  
  const handleFriendClick = (friend: Friend) => {
    setSelectedFriend(friend);
    setIsDialogOpen(true);
  };
  
  const formatTime = (seconds: number = 0): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return hours > 0 
      ? `${hours}h ${minutes}m` 
      : `${minutes}m`;
  };

  return (
    <div className="container mx-auto max-w-3xl py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Friends</CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadFriends}
              disabled={isLoading}
            >
              <RefreshCcw className="h-4 w-4 mr-1" />
              Refresh
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
              Add
            </Button>
          </div>
          
          {/* Friends List */}
          {isLoading ? (
            <div className="flex justify-center py-6">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-secondary-foreground"></div>
            </div>
          ) : friends.length > 0 ? (
            <div className="space-y-3">
              {friends.map(friend => (
                <div
                  key={friend.id} 
                  className="flex items-center p-3 border border-muted rounded-md hover:bg-muted cursor-pointer transition-colors"
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
                      {friend.is_premium && (
                        <span className="ml-1 text-yellow-500" title="Premium User">
                          ✦
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {friend.completed_tasks_count || 0} tasks • {formatTime(friend.total_focus_time)} focus time
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p>No friends added yet.</p>
              <p className="text-sm mt-1">Search by username to add friends.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Friend Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedFriend?.username}</DialogTitle>
          </DialogHeader>
          
          {selectedFriend && (
            <div className="py-4">
              <div className="flex items-center gap-4 mb-6">
                <ProfileImage 
                  src={selectedFriend.profile_picture} 
                  alt={selectedFriend.username} 
                  size={64} 
                />
                <div>
                  <h3 className="font-medium text-lg flex items-center">
                    {selectedFriend.username}
                    {selectedFriend.is_premium && (
                      <span className="ml-1 text-yellow-500" title="Premium User">
                        ✦
                      </span>
                    )}
                  </h3>
                </div>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted p-3 rounded-md flex flex-col items-center">
                  <Clock className="h-5 w-5 mb-1" />
                  <span className="text-xs">Focus Time</span>
                  <span className="font-bold">{formatTime(selectedFriend.total_focus_time)}</span>
                </div>
                
                <div className="bg-muted p-3 rounded-md flex flex-col items-center">
                  <CheckSquare className="h-5 w-5 mb-1" />
                  <span className="text-xs">Tasks</span>
                  <span className="font-bold">{selectedFriend.completed_tasks_count || 0}</span>
                </div>
                
                <div className="bg-muted p-3 rounded-md flex flex-col items-center">
                  <Flame className="h-5 w-5 mb-1" />
                  <span className="text-xs">Streak</span>
                  <span className="font-bold">{selectedFriend.streak_days || 0} days</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}