'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { 
  User as UserIcon,
  Settings as SettingsIcon,
  LogOut,
  Sparkles
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { signOutAction } from '@/app/actions';
import { Button } from '@/components/ui/button';

interface UserProfileProps {
  user: {
    id: string;
    username?: string | null;
    email: string;
    profile_picture?: string | null;
    is_premium?: boolean;
  };
}

export default function UserProfile({ user }: UserProfileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();
  
  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      
      // Sign out directly from the client-side
      await supabase.auth.signOut();
      
      // Force a router refresh to update the UI state
      router.refresh();
      
      // Navigate to sign-in page
      router.push('/sign-in');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsSigningOut(false);
    }
  };
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="px-2 h-10"
        >
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full overflow-hidden bg-muted flex items-center justify-center">
              {user?.profile_picture ? (
                <img 
                  src={user.profile_picture} 
                  alt={user?.username || 'User'} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs font-medium">
                  {user?.username ? user.username.substring(0, 2).toUpperCase() : 'U'}
                </span>
              )}
            </div>
            <span className="text-sm text-foreground hover:text-accent-foreground hidden md:inline">
              {user?.username || 'User'}
            </span>
            {user?.is_premium && (
              <span title="Premium User">
                <Sparkles size={14} className="text-yellow-500" />
              </span>
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="end">
        <div className="p-1 flex flex-col space-y-1">
          <div className="text-md font-medium text-foreground hover:text-accent-foreground transition-colors">
            {user?.username || 'User'}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {user?.email}
          </div>

          <div className="border-t border-accent-foreground my-1" />
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="justify-start hover:bg-background"
            asChild
          >
            <Link href="/profile">
              <UserIcon className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="justify-start hover:bg-background"
            asChild
          >
            <Link href="/settings">
              <SettingsIcon className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="justify-start hover:bg-background"
            asChild
          >
            <Link href="/premium">
              <Sparkles className="mr-2 h-4 w-4" />
              Premium
            </Link>
          </Button>
          
          <div className="border-b border-accent-foreground my-1" />
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="justify-start text-foreground hover:text-destructive-foreground hover:bg-destructive"
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