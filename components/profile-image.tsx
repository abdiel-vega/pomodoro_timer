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
  const [imgSrc, setImgSrc] = useState<string | null>(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // Reset state when src changes
  useEffect(() => {
    setImgSrc(src);
    setIsLoading(true);
    setHasError(false);
  }, [src]);

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
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="w-5 h-5 border-2 border-t-transparent border-primary rounded-full animate-spin"></div>
        </div>
      )}
      <img
        src={imgSrc}
        alt={alt}
        className="w-full h-full object-cover"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          console.error(`Failed to load image: ${imgSrc}`);
          setHasError(true);
          setIsLoading(false);
        }}
      />
    </div>
  );
}