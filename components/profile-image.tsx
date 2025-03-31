// components/ui/profile-image.tsx
'use client';

import { useState } from 'react';
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
  size = 96, 
}: ProfileImageProps) {
  const [imgError, setImgError] = useState(false);
  
  const isValidImageUrl = src && !imgError;
  
  return (
    <div 
      className={`relative rounded-full overflow-hidden bg-muted flex items-center justify-center`}
      style={{ width: size, height: size }}
    >
      {isValidImageUrl ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={`${size}px`}
          className="object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <UserCircle className="w-3/5 h-3/5 text-muted-foreground" />
      )}
    </div>
  );
}