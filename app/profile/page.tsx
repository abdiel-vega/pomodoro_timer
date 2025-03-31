// app/profile/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormMessage } from '@/components/form-message';
import { Camera, Check, UserCircle } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import ProfileImage from '@/components/profile-image';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authUser) {
          router.push('/sign-in');
          return;
        }
        
        // Fetch the user profile from the users table
        const { data: userData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();
          
        if (profileError) {
          console.error('Error fetching profile:', profileError);
          setError('Failed to load profile');
          setIsLoading(false);
          return;
        }
        
        setUser(userData);
        setUsername(userData.username || '');
        setProfilePicture(userData.profile_picture);
        setIsLoading(false);
      } catch (err) {
        console.error('Error in profile page:', err);
        setError('An unexpected error occurred');
        setIsLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [router, supabase]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (!username.trim() || username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    
    try {
      setIsUpdating(true);
      
      // Only check for duplicate username if it has changed
      if (username !== user.username) {
        // Check if username is already taken
        const { data: existingUser } = await supabase
          .from('users')
          .select('username')
          .eq('username', username)
          .neq('id', user.id) // Exclude the current user
          .single();
          
        if (existingUser) {
          setError('Username already taken');
          setIsUpdating(false);
          return;
        }
      }
      
      // Update user profile
      const { error: updateError } = await supabase
        .from('users')
        .update({
          username,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
        
      if (updateError) {
        throw updateError;
      }
      
      // Update the local state
      setUser({ ...user, username });
      setMessage('Profile updated successfully');
      toast.success('Profile updated');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
      toast.error('Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }
    
    try {
      setIsUploading(true);
      setError('');
      
      // IMPORTANT: This path structure is required for RLS
      // The first folder MUST match the user's ID exactly
      const filePath = `${user.id}/${Math.random().toString(36).substring(2)}.${file.name.split('.').pop()}`;
      
      console.log('Uploading to path:', filePath);
      
      // Get user session to verify upload permissions
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Authentication required to upload files');
      }
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw uploadError;
      }
      
      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);
        
      // Update the user record with the new profile picture URL
      const { error: updateError } = await supabase
        .from('users')
        .update({
          profile_picture: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
        
      if (updateError) {
        console.error('Error updating user record:', updateError);
        throw updateError;
      }
      
      // Update local state
      setProfilePicture(publicUrl);
      setUser({ ...user, profile_picture: publicUrl });
      toast.success('Profile picture updated');
    } catch (err: any) {
      // Improved error logging
      console.error('Profile picture upload failed:', err);
      
      // Check for specific known issues
      if (err.message?.includes('row-level security')) {
        setError('Permission denied: Check storage bucket policies');
      } else if (err.message?.includes('auth')) {
        setError('Authentication required, please re-login');
      } else {
        setError(err.message || 'Failed to upload profile picture');
      }
      
      toast.error('Failed to upload profile picture');
    } finally {
      setIsUploading(false);
    }
  };  

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Profile</CardTitle>
          <CardDescription>
            Manage your profile information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && ( 
            <div className="mb-4">
                <FormMessage message={{ error }} />
            </div>
          )}
          {message && ( 
            <div className="mb-4">
                <FormMessage message={{ success: message }} />
            </div>
          )}
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center mb-6">
            <div className="flex flex-col items-center gap-2">
              <div 
                className="relative cursor-pointer"
                onClick={handleProfilePictureClick}
              >
                <ProfileImage
                  src={profilePicture} 
                  alt={user?.username || 'Profile'} 
                  size={96}
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-full">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleProfilePictureClick}
                disabled={isUploading}
              >
                Change picture
              </Button>
            </div>
            
            <div className="flex-1 w-full">
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium mb-1">
                    Username
                  </label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your username"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <Input
                    id="email"
                    value={user.email}
                    disabled
                    className="bg-muted/50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                </div>
                
                <Button 
                  type="submit" 
                  className="mt-2" 
                  disabled={isUpdating || username === user.username}
                >
                  {isUpdating ? 'Updating...' : 'Update Profile'}
                </Button>
              </form>
            </div>
          </div>
          
          <div className="bg-muted rounded-md p-4 text-sm">
            <h3 className="font-medium mb-2">Account Information</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-muted-foreground">Member since</p>
                <p>{new Date(user.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Subscription</p>
                <p>{user.is_premium ? 'Premium' : 'Free'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}