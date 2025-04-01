'use client';

import { useState, useEffect } from 'react';
import { UserCircle } from 'lucide-react';

interface ProfileImageProps {
  src: string | null;
  alt: string;
  size?: number;
}

export default function ProfileImage({ 
  src, 
  alt, 
  size = 96, 
}: ProfileImageProps) {
  const [imgError, setImgError] = useState(false);
  
  // If src doesn't exist or there's been an error loading it, show the placeholder
  if (!src || imgError) {
    return (
      <div 
        className="relative rounded-full overflow-hidden bg-muted flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <UserCircle className="w-3/5 h-3/5 text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div 
      className="relative rounded-full overflow-hidden bg-muted flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Use regular img tag instead of Next.js Image for Supabase URLs */}
      <img
        src={src}
        alt={alt}
        className="object-cover w-full h-full"
        onError={() => setImgError(true)}
      />
    </div>
  );
}