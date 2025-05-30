'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
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
import { useVisibilityAwareLoading } from '@/hooks/useVisibilityAwareLoading';

interface FriendRequest {
  id: string;
  sender_id: string;
  recipient_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  sender_username?: string;
  sender_profile_picture?: string | null;
  recipient_username?: string;
  recipient_profile_picture?: string | null;
}

export default function FriendRequests() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('received');
  
  // Fetch friend requests
  const fetchRequests = useCallback(async () => {
    const supabase = getSupabaseClient();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { received: [], sent: [] };
      
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
      
      return {
        received: formattedReceivedRequests,
        sent: formattedSentRequests,
      };
    } catch (err) {
      console.error('Error loading friend requests:', err);
      return { received: [], sent: [] };
    }
  }, []);

  const { 
    isLoading, 
    data: requests, 
    refresh: loadRequests 
  } = useVisibilityAwareLoading(fetchRequests, {
    refreshOnVisibility: true,
    loadingTimeout: 3000
  });

  // Load requests when popover opens
  useEffect(() => {
    if (isOpen) {
      loadRequests();
    }
  }, [isOpen, loadRequests]);

  const receivedRequests: FriendRequest[] = requests?.received || [];
  const sentRequests = requests?.sent || [];
  
  const handleAccept = async (requestId: string) => {
    const supabase = getSupabaseClient();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Start a transaction - get the request details first
      const { data: requestData, error: requestError } = await supabase
        .from('friend_requests')
        .select('sender_id, recipient_id')
        .eq('id', requestId)
        .single();
      
      if (requestError) throw requestError;
      
      // Update the request status
      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);
      
      if (updateError) throw updateError;
      
      // Add friend relationship
      const { error: friendError } = await supabase
        .from('user_friends')
        .insert([
          { user_id: user.id, friend_id: requestData.sender_id },
          { user_id: requestData.sender_id, friend_id: user.id }
        ]);
      
      if (friendError) {
        console.error('Failed to create friendship:', friendError.message);
        throw friendError;
      }
      
      // Update UI by removing the accepted request
      toast.success('Friend request accepted');
      loadRequests();
    } catch (err: any) {
      console.error('Error accepting friend request:', err);
      toast.error('Failed to accept request');
    }
  };
  
  const handleReject = async (requestId: string) => {
    const supabase = getSupabaseClient();
    
    try {
      // Update the request status to 'rejected'
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);
      
      if (error) throw error;
      
      // Update UI
      toast.success('Friend request rejected');
      loadRequests();
    } catch (err) {
      console.error('Error rejecting friend request:', err);
      toast.error('Failed to reject request');
    }
  };
  
  const handleCancel = async (requestId: string) => {
    const supabase = getSupabaseClient();
    
    try {
      // Delete the request (simpler than updating status)
      const { error } = await supabase
        .from('friend_requests')
        .delete()
        .eq('id', requestId);
      
      if (error) throw error;
      
      // Update UI
      toast.success('Friend request cancelled');
      loadRequests();
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
              variant="default"
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
                <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-accent-foreground">
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
                <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-secondary-foreground"></div>
              </div>
            ) : receivedRequests.length > 0 ? (
              <div className="space-y-2 py-2">
                {receivedRequests.map((request: FriendRequest) => (
                  <div key={request.id} className="flex items-center justify-between p-2 bg-card rounded-md">
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
                <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-secondary-foreground"></div>
              </div>
            ) : sentRequests.length > 0 ? (
              <div className="space-y-2 py-2">
                {sentRequests.map((request: FriendRequest) => (
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