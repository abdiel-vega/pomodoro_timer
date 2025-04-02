'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormMessage } from '@/components/form-message';
import { Camera, Check, Clock, CheckSquare, Trophy, X, Move, Flame } from 'lucide-react';
import { toast } from 'sonner';
import ProfileImage from '@/components/profile-image';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

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
  
  // Image cropping states
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  
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
    
    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      setError('File size must be less than 2MB');
      return;
    }
    
    // Set selected file and show crop dialog
    setSelectedFile(file);
    
    // Create object URL for preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    
    // Reset position
    setPosition({ x: 0, y: 0 });
    
    // Show the crop dialog
    setShowCropDialog(true);
    
    // Clean up function for the object URL
    return () => URL.revokeObjectURL(objectUrl);
  };
  
  const handleCropCancel = () => {
    setShowCropDialog(false);
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartPos({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && imageRef.current) {
      const newX = e.clientX - startPos.x;
      const newY = e.clientY - startPos.y;
      
      // Optional: Add constraints to keep the image within the crop area
      setPosition({ x: newX, y: newY });
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const handleCropConfirm = async () => {
    if (!selectedFile) return;
    
    try {
      setIsUploading(true);
      setShowCropDialog(false);
      
      // In a real implementation, you would use the position data to crop the image
      // For now, we'll just upload the original file as-is
      
      const folderPath = `${user.id}`;
      const fileName = `${folderPath}/${Date.now()}-${selectedFile.name.replace(/\s+/g, '_')}`;
      
      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);
      
      // Update the user record with the new URL
      const { error: updateError } = await supabase
        .from('users')
        .update({
          profile_picture: urlData.publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      // Update local state
      setProfilePicture(urlData.publicUrl);
      toast.success('Profile picture updated');
      
      // Force refresh to avoid stale data
      router.refresh();
      
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload profile picture');
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }
  };
  
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return hours > 0 
      ? `${hours}h ${minutes}m` 
      : `${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-secondary-foreground"></div>
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
                <div className="absolute inset-0 bg-accent-foreground flex items-center justify-center opacity-0 hover:opacity-60 transition-opacity rounded-full">
                  <Camera className="w-6 h-6 text-background" />
                </div>
                {isUploading && (
                  <div className="absolute inset-0 bg-accent-foreground opacity-60 flex items-center justify-center rounded-full">
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
          
          {/* Competitive Stats */}
          <div className="bg-muted rounded-md p-4">
            <h3 className="font-medium mb-4 flex items-center gap-2 text-accent-foreground">
              <Trophy className="h-4 w-4 text-accent-foreground" />
              Your Progress Stats
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-background p-3 rounded-md shadow-sm flex flex-col items-center">
                <Clock className="h-5 w-5 mb-2 text-accent-foreground" />
                <span className="text-xs text-foreground">Total Focus Time</span>
                <span className="text-xl font-bold">{formatTime(user.total_focus_time || 0)}</span>
              </div>
              
              <div className="bg-background p-3 rounded-md shadow-sm flex flex-col items-center">
                <CheckSquare className="h-5 w-5 mb-2 text-accent-foreground" />
                <span className="text-xs text-foreground">Tasks Completed</span>
                <span className="text-xl font-bold">{user.completed_tasks_count || 0}</span>
              </div>
              
              <div className="bg-background p-3 rounded-md shadow-sm flex flex-col items-center">
                <Flame className="h-5 w-5 mb-2 text-accent-foreground" />
                <span className="text-xs text-muted-foreground">Current Streak</span>
                <span className="text-xl font-bold">{user.streak_days || 0} days</span>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-muted rounded-md p-4 text-sm mt-6">
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
      
      {/* Image Crop Dialog */}
      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Adjust Profile Picture</DialogTitle>
          <DialogDescription>
            Position your image by dragging it within the circle
          </DialogDescription>
          
          <div className="my-4 flex items-center justify-center">
            <div 
              className="relative w-64 h-64 overflow-hidden"
              style={{
                borderRadius: '50%',
                cursor: isDragging ? 'grabbing' : 'grab'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {previewUrl && (
                <>
                  <div className="absolute inset-0 bg-black opacity-50 z-10 pointer-events-none"></div>
                  <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                    <div className="w-56 h-56 rounded-full border-2 border-white"></div>
                    <Move className="absolute text-white opacity-70" />
                  </div>
                  <img
                    ref={imageRef}
                    src={previewUrl}
                    alt="Preview"
                    className="absolute"
                    style={{
                      transform: `translate(${position.x}px, ${position.y}px)`,
                      maxWidth: 'none',
                      userSelect: 'none'
                    }}
                    draggable={false}
                  />
                </>
              )}
            </div>
          </div>
          
          <div className="flex justify-between mt-4">
            <Button 
              variant="outline" 
              onClick={handleCropCancel}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button 
              onClick={handleCropConfirm}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-b-2 border-background"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Apply
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}