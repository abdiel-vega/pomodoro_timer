'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

// Define proper type
interface UserSearchResult {
  id: string;
  username: string;
}

export function useFriendRequests() {
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  // Clean up function for component unmount
  useEffect(() => {
    return () => {
      setIsSearching(false);
      setIsSubmitting(false);
    };
  }, []);

  const searchUser = async (
    username: string
  ): Promise<UserSearchResult | null> => {
    setIsSearching(true);

    try {
      // Verify auth first
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication required');

      console.log('Searching for username:', username.trim());

      // Search with exact match first, then try partial match if needed
      const { data: userData } = await supabase
        .from('users')
        .select('id, username')
        .ilike('username', username.trim())
        .neq('id', user.id) // Exclude current user
        .maybeSingle();

      if (!userData) {
        // Try a more flexible search
        const { data: flexibleMatch } = await supabase
          .from('users')
          .select('id, username')
          .ilike('username', `%${username.trim()}%`)
          .neq('id', user.id)
          .maybeSingle();

        return flexibleMatch;
      }

      return userData;
    } catch (error) {
      console.error('Search error:', error);
      return null;
    } finally {
      setIsSearching(false);
    }
  };

  const sendFriendRequest = async (recipientId: string): Promise<boolean> => {
    setIsSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication required');

      // Check if already friends or request exists
      const { data: existing } = await supabase
        .from('user_friends')
        .select('id')
        .eq('user_id', user.id)
        .eq('friend_id', recipientId)
        .maybeSingle();

      if (existing) {
        toast.error('Already in your friends list');
        return false;
      }

      // Check existing requests
      const { data: existingRequest } = await supabase
        .from('friend_requests')
        .select('id')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .or(`sender_id.eq.${recipientId},recipient_id.eq.${recipientId}`)
        .eq('status', 'pending')
        .maybeSingle();

      if (existingRequest) {
        toast.error('A friend request already exists between you two');
        return false;
      }

      // Send request
      const { error } = await supabase.from('friend_requests').insert([
        {
          sender_id: user.id,
          recipient_id: recipientId,
          status: 'pending',
        },
      ]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Request error:', error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSearching,
    isSubmitting,
    searchUser,
    sendFriendRequest,
  };
}
