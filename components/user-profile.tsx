'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { User } from '@/types/user';
import { Button } from '@/components/ui/button';
import ProfileImage from './profile-image';
import { 
  UserIcon, SettingsIcon, LogOut, Sparkles, Clock, CheckSquare 
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { EVENTS, ProfileUpdatePayload } from '@/utils/events';

interface UserProfileProps {
  user: {
    id: string;
    email: string;
    username?: string | null;
    profile_picture?: string | null;
    is_premium?: boolean;
    total_focus_time?: number;
    completed_tasks_count?: number;
  } | null;
}

export default function UserProfile({ user }: UserProfileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  // Initialize with safe defaults when user might be null
  const [profileData, setProfileData] = useState<User>({
    id: user?.id || '',
    email: user?.email || '',
    username: user?.username || null,
    profile_picture: user?.profile_picture || null,
    is_premium: user?.is_premium || false,
    total_focus_time: user?.total_focus_time || 0,
    completed_tasks_count: user?.completed_tasks_count || 0,
    created_at: '',
    updated_at: ''
  });
  
  const router = useRouter();
  const supabase = createClient();
  
  // Load profile data on component mount AND when popup opens
  useEffect(() => {
    if (user?.id) {
      refreshUserProfile();
    }
  }, [user?.id]);
  
  // Listen for profile update events
  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent<ProfileUpdatePayload>) => {
      const updatedProfile = event.detail;
      
      // Only update if it's for the current user
      if (updatedProfile.id === profileData.id) {
        setProfileData(prev => ({
          ...prev,
          username: updatedProfile.username ?? prev.username,
          profile_picture: updatedProfile.profile_picture ?? prev.profile_picture
        }));
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
  }, [profileData.id]);
  
  const refreshUserProfile = async () => {
    if (!user?.id) return;
    
    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (data) {
        setProfileData(data as User);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };
  
  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await supabase.auth.signOut();
      router.refresh();
      router.push('/sign-in');
    } catch (error) {
      console.error('Error signing out:', error);
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
              src={profileData.profile_picture} 
              alt={profileData.username || 'User'} 
              size={32} 
            />
            <span className="text-sm hidden md:inline">
              {profileData.username || 'User'}
            </span>
            {profileData.is_premium && (
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
              src={profileData.profile_picture} 
              alt={profileData.username || 'User'} 
              size={40} 
            />
            <div>
              <div className="font-medium">{profileData.username || 'User'}</div>
              <div className="text-xs text-muted-foreground truncate">{profileData.email}</div>
            </div>
          </div>
          
          {/* Stats section */}
          <div className="bg-muted rounded-md p-2 text-xs">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Focus Time</span>
              </div>
              <span className="font-medium">{formatTime(profileData.total_focus_time || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <CheckSquare className="h-3 w-3" />
                <span>Tasks Completed</span>
              </div>
              <span className="font-medium">{profileData.completed_tasks_count || 0}</span>
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
              <Link href="/settings">
                <SettingsIcon className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </Button>
            
            <Button variant="ghost" size="sm" className="w-full my-1 justify-start bg-background hover:bg-muted" asChild>
              <Link href="/leaderboard">
                <Sparkles className="mr-2 h-4 w-4" />
                Leaderboard
              </Link>
            </Button>
          </div>
          
          <Button 
            variant="destructive" 
            size="sm" 
            className="w-full justify-start"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isSigningOut ? 'Signing out...' : 'Sign out'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}