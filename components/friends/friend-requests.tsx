'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import ProfileImage from '@/components/profile-image';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Bell, Check, X, Clock, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FriendRequest {
  id: string;
  sender_id: string;
  recipient_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  // Joined data
  sender_username?: string;
  sender_profile_picture?: string | null;
  recipient_username?: string;
  recipient_profile_picture?: string | null;
}

// Proper interface for the joined data structure
interface RequestWithSender extends FriendRequest {
  sender: {
    username: string | null;
    profile_picture: string | null;
  } | null; // Note: it's an object, not an array
  
  recipient: {
    username: string | null;
    profile_picture: string | null;
  } | null;
}

export default function FriendRequests() {
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('received');
  
  const supabase = createClient();
  
  // Load requests when popover opens
  useEffect(() => {
    if (isOpen) {
      loadRequests();
    }
  }, [isOpen]);
  
  const loadRequests = async () => {
    if (isLoading) return;
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Load received requests (with sender info)
      const { data: receivedData, error: receivedError } = await supabase
        .from('friend_requests')
        .select(`
          id, sender_id, recipient_id, status, created_at,
          sender:sender_id(username, profile_picture)
        `)
        .eq('recipient_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (receivedError) throw receivedError;
      
      // Load sent requests (with recipient info)
      const { data: sentData, error: sentError } = await supabase
        .from('friend_requests')
        .select(`
          id, sender_id, recipient_id, status, created_at,
          recipient:recipient_id(username, profile_picture)
        `)
        .eq('sender_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (sentError) throw sentError;
      
      const formattedReceivedRequests = receivedData.map((request: any) => ({
        id: request.id,
        sender_id: request.sender_id,
        recipient_id: request.recipient_id,
        status: request.status,
        created_at: request.created_at,
        sender_username: request.sender?.username || null,
        sender_profile_picture: request.sender?.profile_picture || null,
      }));
      
      const formattedSentRequests = sentData.map((request: any) => ({
        id: request.id,
        sender_id: request.sender_id,
        recipient_id: request.recipient_id,
        status: request.status,
        created_at: request.created_at,
        recipient_username: request.recipient?.username || null,
        recipient_profile_picture: request.recipient?.profile_picture || null,
      }));      
      
      setReceivedRequests(formattedReceivedRequests);
      setSentRequests(formattedSentRequests);
    } catch (err) {
      console.error('Error loading friend requests:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAccept = async (requestId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Start a transaction
      // 1. Update the request status to 'accepted'
      const { data: requestData, error: requestError } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId)
        .select('sender_id')
        .single();
      
      if (requestError) throw requestError;
      
      // 2. Add friend relationship
      const { error: friendError } = await supabase
        .from('user_friends')
        .insert([
          { user_id: user.id, friend_id: requestData.sender_id },
          { user_id: requestData.sender_id, friend_id: user.id } // Add bidirectional relationship
        ]);
      
      if (friendError) throw friendError;
      
      // Update UI
      setReceivedRequests(prev => prev.filter(req => req.id !== requestId));
      toast.success('Friend request accepted');
    } catch (err) {
      console.error('Error accepting friend request:', err);
      toast.error('Failed to accept request');
    }
  };
  
  const handleReject = async (requestId: string) => {
    try {
      // Update the request status to 'rejected'
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);
      
      if (error) throw error;
      
      // Update UI
      setReceivedRequests(prev => prev.filter(req => req.id !== requestId));
      toast.success('Friend request rejected');
    } catch (err) {
      console.error('Error rejecting friend request:', err);
      toast.error('Failed to reject request');
    }
  };
  
  const handleCancel = async (requestId: string) => {
    try {
      // Delete the request (simpler than updating status)
      const { error } = await supabase
        .from('friend_requests')
        .delete()
        .eq('id', requestId);
      
      if (error) throw error;
      
      // Update UI
      setSentRequests(prev => prev.filter(req => req.id !== requestId));
      toast.success('Friend request cancelled');
    } catch (err) {
      console.error('Error cancelling friend request:', err);
      toast.error('Failed to cancel request');
    }
  };
  
  const totalRequests = receivedRequests.length;
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="relative"
        >
          <Bell className="h-4 w-4 mr-1" />
          Requests
          {totalRequests > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 p-0"
            >
              {totalRequests}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <Tabs defaultValue="received" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="received" className="relative">
              Received
              {receivedRequests.length > 0 && (
                <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                  {receivedRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent">
              Sent
              {sentRequests.length > 0 && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({sentRequests.length})
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="received" className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-4">
                <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary"></div>
              </div>
            ) : receivedRequests.length > 0 ? (
              <div className="space-y-2 py-2">
                {receivedRequests.map(request => (
                  <div key={request.id} className="flex items-center justify-between p-2 bg-muted/40 rounded-md">
                    <div className="flex items-center gap-2">
                      <ProfileImage
                        src={request.sender_profile_picture || null}
                        alt={request.sender_username || 'User'}
                        size={32}
                      />
                      <span className="font-medium truncate max-w-[100px]">
                        {request.sender_username || 'User'}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 text-green-500"
                        onClick={() => handleAccept(request.id)}
                        title="Accept"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 text-red-500"
                        onClick={() => handleReject(request.id)}
                        title="Reject"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-muted-foreground">
                <p>No pending friend requests</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="sent" className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-4">
                <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary"></div>
              </div>
            ) : sentRequests.length > 0 ? (
              <div className="space-y-2 py-2">
                {sentRequests.map(request => (
                  <div key={request.id} className="flex items-center justify-between p-2 bg-muted/40 rounded-md">
                    <div className="flex items-center gap-2">
                      <ProfileImage
                        src={request.recipient_profile_picture || null}
                        alt={request.recipient_username || 'User'}
                        size={32}
                      />
                      <div>
                        <div className="font-medium truncate max-w-[100px]">
                          {request.recipient_username || 'User'}
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          Awaiting approval
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => handleCancel(request.id)}
                    >
                      Cancel
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-muted-foreground">
                <p>No pending sent requests</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}