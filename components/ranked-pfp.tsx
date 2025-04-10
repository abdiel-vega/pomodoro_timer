'use client';

import { useState } from 'react';
import ProfileImage from '@/components/profile-image';
import { Crown } from 'lucide-react';

interface RankedProfileImageProps {
  src: string | null;
  alt: string;
  size?: number;
  rank?: number;           // Global rank (1, 2, 3) if any
  isFriendTop?: boolean;   // If user is #1 among friends
  totalCrowns?: number;    // Total number of crowns
}

export default function RankedProfileImage({ 
  src, 
  alt, 
  size = 40,
  rank,
  isFriendTop,
  totalCrowns = 0
}: RankedProfileImageProps) {
  // Calculate actual crown count - add up explicit crowns if not provided
  const crownCount = totalCrowns || 
    ((rank === 1 ? 1 : 0) + (rank === 2 ? 1 : 0) + (rank === 3 ? 1 : 0) + (isFriendTop ? 1 : 0));
  
  // Only show crown if user has at least one
  const showCrown = rank === 1 || rank === 2 || rank === 3 || isFriendTop;
  
  if (!showCrown) {
    return <ProfileImage src={src} alt={alt} size={size} />;
  }

  // Determine crown color based on rank
  let crownColor = "text-yellow-500"; // Default gold for #1
  if (rank === 2) crownColor = "text-gray-300"; // Silver
  if (rank === 3) crownColor = "text-amber-600"; // Bronze
  
  // For friend rank, use a different style if that's the only crown
  if (isFriendTop && !rank) crownColor = "text-blue-500";

  // Calculate size - make crown proportional to profile image
  const crownSize = Math.max(14, size * 0.4);
  
  return (
    <div className="relative">
      <ProfileImage src={src} alt={alt} size={size} />
      
      {/* Crown with shadow border */}
      <div className="absolute -top-1 -right-1">
        <div className="rounded-full shadow-md p-0.5">
          <Crown className={`${crownColor}`} size={crownSize} />
          
          {/* Display count if user has multiple crowns */}
          {crownCount > 1 && (
            <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[9px] font-bold text-background dark:text-foreground">
              {crownCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}