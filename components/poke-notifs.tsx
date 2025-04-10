'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';

// Place this component in your layout or main app shell
// so it can listen for pokes globally
export default function PokeNotification() {
  const supabase = createClient();
  const subscriptionRef = useRef<any>(null);
  
  // Set up subscription on component mount
  useEffect(() => {
    setupPokeSubscription();
    
    return () => {
      // Clean up subscription on unmount
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, []);
  
  // Handle poking back
  const handlePokeBack = async (fromUser: { id: string, username: string }) => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        toast.error("You must be signed in to poke back");
        return;
      }
      
      // Check poke limits
      const storedCount = localStorage.getItem('pokeCount') || '0';
      const storedTime = localStorage.getItem('pokeLastTime') || Date.now().toString();
      const count = parseInt(storedCount);
      const lastPokeTime = parseInt(storedTime);
      
      // Check if 5 minutes have passed since the first poke
      const now = Date.now();
      const timeElapsed = now - lastPokeTime;
      
      if (count >= 5 && timeElapsed < 5 * 60 * 1000) {
        const timeRemaining = Math.ceil((5 * 60 * 1000 - timeElapsed) / 1000 / 60);
        toast.error(`You've reached your poke limit. Try again in ${timeRemaining} minutes.`);
        return;
      }
      
      // If 5 minutes have passed, reset the counter
      if (timeElapsed >= 5 * 60 * 1000) {
        localStorage.setItem('pokeCount', '1');
        localStorage.setItem('pokeLastTime', now.toString());
      } else {
        // Increment poke count
        const newCount = count + 1;
        localStorage.setItem('pokeCount', newCount.toString());
        
        // Set last poke time if not already set
        if (!localStorage.getItem('pokeLastTime')) {
          localStorage.setItem('pokeLastTime', now.toString());
        }
      }
      
      // Store the poke in the database
      const { error } = await supabase.from('pokes').insert({
        from_user_id: currentUser.id,
        to_user_id: fromUser.id,
        created_at: new Date().toISOString()
      });
      
      if (error) throw error;
      
      toast.success(`You poked ${fromUser.username} back!`);
      
    } catch (error) {
      console.error('Failed to poke back:', error);
      toast.error('Failed to poke back');
    }
  };
  
  // Set up real-time subscription
  const setupPokeSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // User is not authenticated, don't set up subscription
        return;
      }
      
      // Subscribe to the pokes table
      const channel = supabase
        .channel('pokes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'pokes',
            filter: `to_user_id=eq.${user.id}`
          },
          async (payload) => {
            // When a new poke is received
            const { from_user_id } = payload.new as { from_user_id: string };
            
            // Get sender's username
            const { data: userData, error } = await supabase
              .from('users')
              .select('username')
              .eq('id', from_user_id)
              .single();
              
            if (error) {
              console.error('Error fetching poker username:', error);
              return;
            }
              
            if (userData) {
              // Create a toast with a "Poke Back" button
              toast.info(`${userData.username} poked you!`, {
                duration: 5000,
                action: {
                  label: "Poke Back",
                  onClick: async () => {
                    await handlePokeBack({
                      id: from_user_id,
                      username: userData.username
                    });
                  }
                }
              });
            }
          }
        )
        .subscribe();
        
      // Store subscription reference for cleanup
      subscriptionRef.current = channel;
    } catch (error) {
      console.error('Error setting up poke subscription:', error);
    }
  };
  
  // This component doesn't render anything visible
  return null;
}