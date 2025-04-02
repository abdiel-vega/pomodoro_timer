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
  size = 96 
}: ProfileImageProps) {
  const [hasError, setHasError] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  // Reset states and process URL when source changes
  useEffect(() => {
    setHasError(false);
    
    if (!src) {
      setImgSrc(null);
      return;
    }
    
    // Clean up URL if needed
    let cleanSrc = src;
    // Add timestamp to bust cache if needed
    if (cleanSrc.includes('supabase.co')) {
      cleanSrc = `${cleanSrc}?t=${Date.now()}`;
    }
    
    setImgSrc(cleanSrc);
  }, [src]);

  // Fallback for empty src or errors
  if (!imgSrc || hasError) {
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
      className="relative rounded-full overflow-hidden bg-muted"
      style={{ width: size, height: size }}
    >
      <img
        src={imgSrc}
        alt={alt}
        className="w-full h-full object-cover"
        onError={() => {
          console.error('Failed to load image:', imgSrc);
          setHasError(true);
        }}
      />
    </div>
  );
}