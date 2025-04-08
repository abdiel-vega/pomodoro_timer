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

      console.log('Current user:', user.id);
      console.log('Searching for username:', username.trim());

      // Get your own username first
      const { data: currentUser } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .single();

      console.log('Your username:', currentUser?.username);

      if (currentUser?.username === username.trim()) {
        console.log('Cannot add yourself as friend');
        return null;
      }

      // Search with exact match using proper filter syntax
      const { data: exactMatch, error } = await supabase
        .from('users')
        .select('id, username')
        .eq('username', username.trim()) // Use exact match with eq()
        .maybeSingle();

      if (error) {
        console.error('Search error:', error);
      }

      if (exactMatch) {
        console.log('Found exact match:', exactMatch);
        return exactMatch;
      }

      // Try partial match as fallback
      const { data: partialMatch, error: partialError } = await supabase
        .from('users')
        .select('id, username')
        .like('username', `%${username.trim()}%`) // Use LIKE with % wildcards
        .not('id', 'eq', user.id) // Exclude yourself
        .maybeSingle();

      if (partialError) {
        console.error('Partial search error:', partialError);
      }

      console.log('Search result:', partialMatch);
      return partialMatch;
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
