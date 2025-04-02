'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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
  
  // Reset error state when src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  // Render fallback for empty src or errors
  if (!src || hasError) {
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
      <Image
        src={src}
        alt={alt}
        fill
        sizes={`${size}px`}
        className="object-cover"
        onError={() => setHasError(true)}
        priority={size > 64} // Prioritize larger images
      />
    </div>
  );
}