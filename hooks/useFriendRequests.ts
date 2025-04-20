'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/utils/supabase/supabase_wrapper';
import { toast } from 'sonner';

// Define proper type
interface UserSearchResult {
  id: string;
  username: string;
}

export function useFriendRequests() {
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      // Get initialized client
      const supabase = await getSupabaseClient();
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
      // Get initialized client
      const supabase = await getSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication required');

      // Check for ANY existing request between these users (in either direction)
      const { data: existingRequest } = await supabase
        .from('friend_requests')
        .select('id, status')
        .or(
          `and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`
        )
        .maybeSingle();

      // Handle existing requests with clear messaging
      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          toast.error('A friend request already exists between you two');
        } else if (existingRequest.status === 'accepted') {
          toast.error('You are already friends with this user');
        } else {
          toast.error('Cannot send request at this time');
        }
        return false;
      }

      // Send the friend request with try/catch for constraint errors
      try {
        const { error } = await supabase.from('friend_requests').insert([
          {
            sender_id: user.id,
            recipient_id: recipientId,
            status: 'pending',
          },
        ]);

        if (error) throw error;
        return true;
      } catch (insertError: any) {
        // Handle the unique constraint violation specifically
        if (insertError.code === '23505') {
          toast.error('A friend request already exists');
        } else {
          throw insertError; // Re-throw other errors
        }
        return false;
      }
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
