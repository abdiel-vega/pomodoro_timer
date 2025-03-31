'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Camera, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { toast } from 'sonner';

interface ProfilePictureUploadProps {
  userId: string;
  currentPicture: string | null;
  onUpdate: (url: string) => void;
}

export default function ProfilePictureUpload({ 
  userId, 
  currentPicture, 
  onUpdate 
}: ProfilePictureUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Delete old profile picture if it exists
      if (currentPicture) {
        const oldFilePath = currentPicture.split('/').pop();
        if (oldFilePath) {
          await supabase.storage
            .from('profile_pictures')
            .remove([`${userId}/${oldFilePath}`]);
        }
      }
      
      // Upload file to Supabase Storage
      const filePath = `${userId}/${Math.random().toString(36).substring(2)}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile_pictures')
        .upload(filePath, file);
        
      if (uploadError) {
        throw uploadError;
      }
      
      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('profile_pictures')
        .getPublicUrl(filePath);
        
      // Update the user record with the new profile picture URL
      const { error: updateError } = await supabase
        .from('users')
        .update({
          profile_picture: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
        
      if (updateError) {
        throw updateError;
      }
      
      // Call the callback
      onUpdate(publicUrl);
      toast.success('Profile picture updated');
    } catch (err: any) {
      console.error('Error uploading profile picture:', err);
      toast.error('Failed to upload profile picture');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div 
        className="relative w-24 h-24 rounded-full overflow-hidden bg-muted cursor-pointer"
        onClick={handleProfilePictureClick}
      >
        {currentPicture ? (
          <Image 
            src={currentPicture} 
            alt="Profile" 
            fill 
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <UserCircle className="w-16 h-16 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-black flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <Camera className="w-6 h-6 text-white" />
        </div>
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
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
  );
}