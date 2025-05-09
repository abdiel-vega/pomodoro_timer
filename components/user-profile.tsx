'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import ProfileImage from './profile-image';
import { 
  UserIcon, SettingsIcon, LogOut, Sparkles, Clock, CheckSquare, Users 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { EVENTS, ProfileUpdatePayload } from '@/utils/events';
import { calculateUserRank } from '@/utils/rank';
import RankBadge from './rank-badge';
import { getSupabaseClient } from '@/lib/supabase';
import { signOut } from '@/lib/auth';
import { useVisibilityAwareLoading } from '@/hooks/useVisibilityAwareLoading';

interface UserProfileProps {
  user: {
    id: string;
    email?: string; // Make email optional to match AuthState
    username?: string | null;
    profile_picture?: string | null;
    is_premium?: boolean;
    [key: string]: any;
  } | null;
}

export default function UserProfile({ user }: UserProfileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showSignOutConfirmation, setShowSignOutConfirmation] = useState(false);

  const router = useRouter();
  
  // Define profile fetch function using api.ts
  const fetchProfileData = useCallback(async () => {
    // Get Supabase client
    const supabase = getSupabaseClient();
    
    try {
      // Log the input user data for debugging
      console.log('User profile fetch starting with user data:', {
        id: user?.id || 'none',
        username: user?.username || 'none',
        hasProfilePicture: !!user?.profile_picture,
        isPremium: !!user?.is_premium
      });
      
      // If no user ID, return default values but don't attempt to fetch
      if (!user?.id) {
        console.warn('No user ID available for profile fetch');
        return {
          id: '',
          email: user?.email || '',
          username: 'User',
          profile_picture: null,
          is_premium: false,
          total_focus_time: 0,
          completed_tasks_count: 0,
          created_at: '',
          updated_at: ''
        };
      }
      
      // Always make direct DB query instead of using API for better reliability
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) {
        console.error('DB query error in fetchProfileData:', error);
        // Fall back to passed-in user data with defaults
        return {
          id: user.id,
          email: user.email || '',
          username: user.username || 'User',
          profile_picture: user.profile_picture || null,
          is_premium: !!user.is_premium,
          total_focus_time: 0,
          completed_tasks_count: 0,
          created_at: '',
          updated_at: ''
        };
      }
      
      // Log the retrieved data
      console.log('Profile data retrieved successfully:', {
        username: data.username || 'none',
        hasProfilePicture: !!data.profile_picture,
        isPremium: !!data.is_premium
      });
      
      return data;
    } catch (error) {
      console.error('Error in fetchProfileData:', error);
      // Safe fallback
      return {
        id: user?.id || '',
        email: user?.email || '',
        username: user?.username || 'User',
        profile_picture: user?.profile_picture || null,
        is_premium: !!user?.is_premium,
        total_focus_time: 0,
        completed_tasks_count: 0,
        created_at: '',
        updated_at: ''
      };
    }
  }, [user]);

  // Use visibility-aware loading
  const { 
    data: profileData,
    refresh: refreshProfile 
  } = useVisibilityAwareLoading(fetchProfileData, {
    refreshOnVisibility: isOpen, // Only refresh when popup is open
    loadingTimeout: 3000
  });
  
  // Calculate user rank
  const userRank = calculateUserRank(
    profileData?.total_focus_time || 0, 
    profileData?.completed_tasks_count || 0
  );
  
  // Listen for profile update events
  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent<ProfileUpdatePayload>) => {
      const updatedProfile = event.detail;
      
      // Only update if it's for the current user
      if (updatedProfile.id === profileData?.id) {
        refreshProfile();
      }
    };
    
    // Add event listener with proper type casting
    window.addEventListener(
      EVENTS.PROFILE_UPDATED, 
      handleProfileUpdate as EventListener
    );
    
    // Clean up
    return () => {
      window.removeEventListener(
        EVENTS.PROFILE_UPDATED, 
        handleProfileUpdate as EventListener
      );
    };
  }, [profileData?.id, refreshProfile]);

  const requestSignOut = () => {
    setShowSignOutConfirmation(true);
  };
  
  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      
      // Add timeout for sign out
      const signOutPromise = signOut();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => {
          console.warn('Sign out timeout - forcing page refresh');
          // Force a page refresh even if the sign out times out
          window.location.href = '/sign-in';
        }, 3000)
      );
      
      // Race the sign out with timeout
      await Promise.race([signOutPromise, timeoutPromise]);
      
      router.refresh();
      router.push('/sign-in');
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if there's an error, redirect to sign-in
      router.push('/sign-in');
    } finally {
      setIsSigningOut(false);
    }
  };  
  
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return hours > 0 
      ? `${hours}h ${minutes}m` 
      : `${minutes}m`;
  };
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="px-2 h-10">
          <div className="flex items-center gap-2">
            <ProfileImage 
              src={profileData?.profile_picture} 
              alt={profileData?.username || 'User'} 
              size={32} 
            />
            <span className="text-sm hidden md:inline">
              {profileData?.username || 'User'}
            </span>
            {profileData?.is_premium && (
              <span title="Premium User">
                <Sparkles size={14} className="text-yellow-500" />
              </span>
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center gap-3">
            <ProfileImage 
              src={profileData?.profile_picture} 
              alt={profileData?.username || 'User'} 
              size={40} 
            />
            <div>
              <div className="font-medium flex items-center">
                {profileData?.username || 'User'}
                {/* Add rank badge in dropdown */}
                <RankBadge rank={userRank} size="sm" />
              </div>
              <div className="text-xs text-muted-foreground truncate">{profileData?.email}</div>
            </div>
          </div>
          
          {/* Stats section */}
          <div className="bg-muted rounded-md p-2 text-xs">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Focus Time</span>
              </div>
              <span className="font-medium">{formatTime(profileData?.total_focus_time || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <CheckSquare className="h-3 w-3" />
                <span>Tasks Completed</span>
              </div>
              <span className="font-medium">{profileData?.completed_tasks_count || 0}</span>
            </div>
          </div>
          
          <div className="border-t border-accent-foreground pt-2">
            <Button variant="ghost" size="sm" className="w-full my-1 justify-start bg-background hover:bg-muted" asChild>
              <Link href="/profile">
                <UserIcon className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </Button>

            <Button variant="ghost" size="sm" className="w-full my-1 justify-start bg-background hover:bg-muted" asChild>
              <Link href="/friends">
                <Users className="mr-2 h-4 w-4" />
                Friends
              </Link>
            </Button>
            
            {/* Add Rank Info link here */}
            <Button variant="ghost" size="sm" className="w-full my-1 justify-start bg-background hover:bg-muted" asChild>
              <Link href="/rank-info">
                <Users className="mr-2 h-4 w-4" />
                Rank Info
              </Link>
            </Button>
            
            {profileData?.is_premium ? (
              <Button variant="ghost" size="sm" className="w-full my-1 justify-start bg-background hover:bg-muted" asChild>
                <Link href="/premium">
                  <Sparkles className="mr-2 h-4 w-4 text-foreground" />
                  Premium Settings
                </Link>
              </Button>
            ) : (
              <Button variant="ghost" size="sm" className="w-full my-1 justify-start bg-background hover:bg-muted" asChild>
                <Link href="/premium">
                  <Sparkles className="mr-2 h-4 w-4 text-yellow-500" />
                  Purchase Premium
                </Link>
              </Button>
            )}
          </div>
          
          <Button 
            variant="destructive" 
            size="sm" 
            className="w-full justify-start"
            onClick={requestSignOut}
            disabled={isSigningOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isSigningOut ? 'Signing out...' : 'Sign out'}
          </Button>
        </div>
        <Dialog open={showSignOutConfirmation} onOpenChange={setShowSignOutConfirmation}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Sign Out Confirmation</DialogTitle>
              <DialogDescription>
                Do you wish to continue signing out?
              </DialogDescription>
            </DialogHeader>
            
            <DialogFooter className="flex flex-row justify-end gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSignOutConfirmation(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                className='border border-destructive-foreground bg-background'
                onClick={handleSignOut}
                disabled={isSigningOut}
              >
                {isSigningOut ? "Signing out..." : "Sign out"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PopoverContent>
    </Popover>    
  );
}