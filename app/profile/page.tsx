'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useVisibilityAwareLoading } from '@/hooks/useVisibilityAwareLoading';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider'; 
import { FormMessage } from '@/components/form-message';
import { Camera, Check, Clock, CheckSquare, Trophy, X, Move, ZoomIn, ZoomOut, Flame, Award } from 'lucide-react';
import { toast } from 'sonner';
import ProfileImage from '@/components/profile-image';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { dispatchProfileUpdate } from '@/utils/events';
import { calculateUserRank, formatTime, calculateProgressToNextRank, RANKS } from '@/utils/rank';
import RankBadge from '@/components/rank-badge';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { getUserProfile, updateUserProfile } from '@/lib/api';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [croppedImageFile, setCroppedImageFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Rank state
  const [userRank, setUserRank] = useState(RANKS.bronze);
  const [rankProgress, setRankProgress] = useState({
    focusTimePercent: 0,
    tasksPercent: 0,
    nextRank: null as typeof RANKS.bronze | null
  });
  
  // Image cropping states
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const router = useRouter();
  const supabase = getSupabaseClient();

  const fetchUserProfile = useCallback(async () => {
    console.log('Fetching user profile');
    try {
      // Use the API function instead of direct Supabase calls
      const profileData = await getUserProfile();
      return profileData;
    } catch (error) {
      // Proper error handling with safe fallback
      console.error('Profile fetch error:', error);
      
      // If this is an auth error, let the router push happen
      if (error instanceof Error && error.message === 'Authentication required') {
        router.push('/sign-in');
        throw error;
      }
      
      // For other errors, return minimal data to avoid loading state
      return {
        id: 'temp',
        email: '',
        username: 'Error loading profile',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_focus_time: 0,
        completed_tasks_count: 0
      };
    }
  }, [router]);  
  
  // Use the hook
  const { 
    isLoading, 
    data: userData, 
    error: profileError,
    refresh: refreshProfile
  } = useVisibilityAwareLoading(fetchUserProfile, {
    refreshOnVisibility: false,
    loadingTimeout: 4000
  });
  
  // Set derived state based on the loaded user data
  useEffect(() => {
    if (userData) {
      setUser(userData);
      setUsername(userData.username || '');
      setProfilePicture('profile_picture' in userData ? userData.profile_picture : null);
      
      // Calculate user rank based on focus time and tasks
      const focusTime = 'total_focus_time' in userData ? userData.total_focus_time : 0;
      const completedTasks = 'completed_tasks_count' in userData ? userData.completed_tasks_count : 0;
      const calculatedRank = calculateUserRank(focusTime, completedTasks);
      setUserRank(calculatedRank);
      
      // Calculate progress to next rank
      const progress = calculateProgressToNextRank(focusTime, completedTasks, calculatedRank);
      setRankProgress(progress);
    }
  }, [userData]);

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
      if (username !== user?.username) {
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
      
      // Upload profile picture if there's a cropped image
      let profilePictureUrl = profilePicture;
      
      if (croppedImageFile) {
        const folderPath = `${user.id}`;
        const fileName = `${folderPath}/${Date.now()}-profile.jpg`;
        
        // Upload the cropped file
        const { error: uploadError } = await supabase.storage
          .from('profile-pictures')
          .upload(fileName, croppedImageFile, {
            cacheControl: '3600',
            upsert: true
          });
          
        if (uploadError) throw uploadError;
        
        // Get the public URL
        const { data: urlData } = supabase.storage
          .from('profile-pictures')
          .getPublicUrl(fileName);
          
        profilePictureUrl = urlData.publicUrl;
      }
      
      // Use API function to update profile
      await updateUserProfile({
        username,
        profile_picture: profilePictureUrl
      });
      
      // After successful update:
      const updatedProfile = { 
        ...user, 
        username, 
        profile_picture: profilePictureUrl 
      };
      
      // Update the local state
      setUser(updatedProfile);
      setProfilePicture(profilePictureUrl);
      setCroppedImageFile(null);
      
      // Dispatch profile update event
      dispatchProfileUpdate({
        id: user.id,
        username,
        profile_picture: profilePictureUrl
      });
      
      toast.success('Profile updated successfully');
      refreshProfile();

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

  // Image cropping related functions
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('File size must be less than 5MB');
      return;
    }
    
    // Set selected file and show crop dialog
    setSelectedFile(file);
    
    // Create object URL for preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    
    // Reset position and scale
    setPosition({ x: 0, y: 0 });
    setScale(1);
    
    // Show the crop dialog
    setShowCropDialog(true);
  };

  // Mouse event handlers for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageRef.current) return;
    
    setIsDragging(true);
    setStartPos({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !imageRef.current) return;
    
    const newX = e.clientX - startPos.x;
    const newY = e.clientY - startPos.y;
    
    // Apply constraints directly in the move handler
    const constrainedPosition = constrainPosition(newX, newY, scale);
    setPosition(constrainedPosition);
  };

  // Calculate minimum zoom
  const calculateMinZoom = (img: HTMLImageElement, container: HTMLDivElement): number => {
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    
    // Calculate the minimum scale needed to cover the container
    const scaleX = containerWidth / img.naturalWidth;
    const scaleY = containerHeight / img.naturalHeight;
    
    // Return the larger of the two scales to ensure complete coverage
    return Math.max(scaleX, scaleY);
  };
  
  // Zoom handler
  const handleZoomChange = (values: number[]) => {
    if (!imageRef.current || !containerRef.current) return;
    
    const container = containerRef.current;
    const img = imageRef.current;
    
    // Get current and new scale values
    const oldScale = scale;
    const newScale = values[0];
    
    // Calculate container center point
    const containerCenterX = container.offsetWidth / 2;
    const containerCenterY = container.offsetHeight / 2;
    
    // Calculate the point on the image that's currently at the center of the container
    const imgPointX = (containerCenterX - position.x) / oldScale;
    const imgPointY = (containerCenterY - position.y) / oldScale;
    
    // Calculate new position to keep that same image point at the center
    const newX = containerCenterX - imgPointX * newScale;
    const newY = containerCenterY - imgPointY * newScale;
    
    // Set new scale
    setScale(newScale);
    
    // Apply new position with constraints
    setPosition(constrainPosition(newX, newY, newScale));
  };
  
  // Constraint function
  const constrainPosition = (x: number, y: number, currentScale: number) => {
    if (!imageRef.current || !containerRef.current) return { x, y };
    
    const container = containerRef.current;
    const img = imageRef.current;
    
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    const scaledWidth = img.naturalWidth * currentScale;
    const scaledHeight = img.naturalHeight * currentScale;
    
    // Calculate bounds to ensure image covers container completely
    const minX = containerWidth - scaledWidth;
    const minY = containerHeight - scaledHeight;
    
    // Constrain X position
    let constrainedX = x;
    if (scaledWidth <= containerWidth) {
      // Center horizontally if image is narrower
      constrainedX = (containerWidth - scaledWidth) / 2;
    } else {
      // Otherwise constrain within bounds
      constrainedX = Math.min(0, Math.max(minX, x));
    }
    
    // Constrain Y position
    let constrainedY = y;
    if (scaledHeight <= containerHeight) {
      // Center vertically if image is shorter
      constrainedY = (containerHeight - scaledHeight) / 2;
    } else {
      // Otherwise constrain within bounds
      constrainedY = Math.min(0, Math.max(minY, y));
    }
    
    return { x: constrainedX, y: constrainedY };
  };
  
  // Crop image function
  const cropImage = (): Promise<File> => {
    return new Promise((resolve, reject) => {
      if (!imageRef.current || !containerRef.current) {
        reject(new Error('Image reference not available'));
        return;
      }
      
      try {
        // Create a canvas for cropping with exact dimensions
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        
        // Get exact container dimensions
        const container = containerRef.current;
        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;
        
        // Set canvas dimensions to match container exactly
        canvas.width = containerWidth;
        canvas.height = containerHeight;
        
        // Create circular clipping path with exact center and radius
        ctx.beginPath();
        ctx.arc(
          containerWidth / 2, 
          containerHeight / 2, 
          Math.min(containerWidth, containerHeight) / 2, 
          0, 
          Math.PI * 2
        );
        ctx.closePath();
        ctx.clip();
        
        // Get the image reference
        const img = imageRef.current;
        
        // Draw the image with the EXACT same transformation as in the UI
        ctx.drawImage(
          img,
          position.x,
          position.y,
          img.naturalWidth * scale,
          img.naturalHeight * scale
        );
        
        // Convert to blob with high quality
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create image blob'));
            return;
          }
          
          // Create file from blob
          const file = new File([blob], 'profile-picture.jpg', { 
            type: 'image/jpeg' 
          });
          
          resolve(file);
        }, 'image/jpeg', 0.95);
      } catch (error) {
        console.error('Error in cropImage:', error);
        reject(error);
      }
    });
  };
  
  const handleCropConfirm = async () => {
    if (!selectedFile) return;
    
    try {
      // Crop the image
      const croppedFile = await cropImage();
      
      // Store the cropped file but don't upload yet
      setCroppedImageFile(croppedFile);
      
      // Create a temporary preview URL
      const tempPreviewUrl = URL.createObjectURL(croppedFile);
      setProfilePicture(tempPreviewUrl);
      
      // Close the dialog
      setShowCropDialog(false);
      
      toast.success('Image cropped. Click "Update Profile" to save changes.');
    } catch (err: any) {
      console.error('Error cropping image:', err);
      setError(err.message || 'Failed to crop image');
    } finally {
      // Clean up original preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setSelectedFile(null);
    }
  };

  const handleCropCancel = () => {
    // Close the dialog
    setShowCropDialog(false);
    
    // Clean up the selected file state
    setSelectedFile(null);
    
    // Clean up the object URL to prevent memory leaks
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    
    // Reset position and scale to default values
    setPosition({ x: 0, y: 0 });
    setScale(1);
    
    // Clear any temporary cropped image data
    setCroppedImageFile(null);
  };

  // Determine if we have changes to enable the update button
  const hasChanges = username !== user?.username || croppedImageFile !== null;

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
                    value={user?.email || ''}
                    disabled
                    className="bg-muted/50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                </div>
                
                <Button 
                  type="submit" 
                  className="mt-2 border border-foreground bg-background text-foreground hover:bg-muted hover:text-accent-foreground hover:border-accent-foreground" 
                  disabled={isUpdating || !hasChanges}
                >
                  {isUpdating ? 'Updating...' : 'Update Profile'}
                </Button>
              </form>
            </div>
          </div>
          
          {/* Rank information */}
          <div className="bg-muted rounded-lg p-4 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <RankBadge rank={userRank} size="lg" showTooltip={false} />
              <div>
              <h3 
                className="font-medium text-lg" 
                style={{ 
                  color: userRank.color,
                }}
              >
                {userRank.name} Rank
              </h3>
                <Link 
                  href="/rank-info" 
                  className="text-sm text-secondary-foreground hover:underline inline-flex items-center"
                >
                  <Trophy className="h-3 w-3 mr-1" />
                  View all ranks
                </Link>
              </div>
            </div>
            
            {rankProgress.nextRank && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center text-accent-foreground">
                  <Award className="h-4 w-4 mr-1" />
                  Progress to {rankProgress.nextRank.name} Rank
                </h4>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground flex items-center">
                      <Clock className="h-3 w-3 mr-1" /> 
                      Focus Time
                    </span>
                    <span className="font-medium">
                      {formatTime(user?.total_focus_time || 0)} / {formatTime(rankProgress.nextRank.focusTimeRequired)}
                    </span>
                  </div>
                  <Progress value={rankProgress.focusTimePercent} />
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground flex items-center">
                      <CheckSquare className="h-3 w-3 mr-1" />
                      Tasks Completed
                    </span>
                    <span className="font-medium">
                      {user?.completed_tasks_count || 0} / {rankProgress.nextRank.tasksRequired}
                    </span>
                  </div>
                  <Progress value={rankProgress.tasksPercent} />
                </div>
              </div>
            )}
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
                <span className="text-xl font-bold">{formatTime(user?.total_focus_time || 0)}</span>
              </div>
              
              <div className="bg-background p-3 rounded-md shadow-sm flex flex-col items-center">
                <CheckSquare className="h-5 w-5 mb-2 text-accent-foreground" />
                <span className="text-xs text-foreground">Tasks Completed</span>
                <span className="text-xl font-bold">{user?.completed_tasks_count || 0}</span>
              </div>
              
              <div className="bg-background p-3 rounded-md shadow-sm flex flex-col items-center">
                <Flame className="h-5 w-5 mb-2 text-accent-foreground" />
                <span className="text-xs text-foreground">Current Streak</span>
                <span className="text-xl font-bold">{user?.streak_days || 0} days</span>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-muted rounded-md p-4 text-sm mt-6">
            <h3 className="font-medium mb-2">Account Information</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-muted-foreground">Member since</p>
                <p>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Subscription</p>
                <p>{user?.is_premium ? 'Premium' : 'Free'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Image Crop Dialog */}
      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="sm:max-w-md text-foreground">
          <DialogTitle>Adjust Profile Picture</DialogTitle>
          <DialogDescription className='text-foreground'>
            Position and zoom your image to fit the circle
          </DialogDescription>
          
          <div className="my-4 flex flex-col items-center">
            {/* Image container with crop circle */}
            <div 
              ref={containerRef}
              className="relative w-64 h-64 overflow-hidden rounded-full bg-muted"
              style={{
                cursor: isDragging ? 'grabbing' : 'grab'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
            >
              {previewUrl && (
                <img
                  ref={imageRef}
                  src={previewUrl}
                  alt="Preview"
                  className="absolute"
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    transformOrigin: '0 0',
                    maxWidth: 'none',
                    userSelect: 'none'
                  }}
                  draggable={false}
                  onLoad={() => {
                    // Proper image initialization after load
                    if (imageRef.current && containerRef.current) {
                      const container = containerRef.current;
                      const img = imageRef.current;
                      
                      // Calculate minimum scale needed to cover the container
                      const minScale = calculateMinZoom(img, container);
                      
                      // Set initial scale to minimum required (or slightly larger for buffer)
                      const initialScale = minScale * 1.01;
                      setScale(initialScale);
                      
                      // Calculate position to center the image
                      const scaledWidth = img.naturalWidth * initialScale;
                      const scaledHeight = img.naturalHeight * initialScale;
                      const centerX = (container.offsetWidth - scaledWidth) / 2;
                      const centerY = (container.offsetHeight - scaledHeight) / 2;
                      
                      // Update position
                      setPosition({ x: centerX, y: centerY });
                    }
                  }}
                />
              )}
            </div>
            {/* Zoom slider with dynamic min/max values */}
            <div className="mt-6 w-full max-w-xs flex items-center gap-4">
              <ZoomOut className="text-accent-foreground" size={20} />
              <Slider
                value={[scale]}
                min={imageRef.current && containerRef.current ? 
                  calculateMinZoom(imageRef.current, containerRef.current) : 1}
                max={5}
                step={0.05}
                onValueChange={handleZoomChange}
                className="flex-1"
              />
              <ZoomIn className="text-accent-foreground" size={20} />
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
              variant="outline" 
              onClick={handleCropConfirm}
              disabled={isUploading}
            >
              <Check className="mr-2 h-4 w-4" />
              Apply Crop
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}