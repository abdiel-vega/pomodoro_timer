'use client';

import ProfileImage from '@/components/profile-image';
import { Crown } from 'lucide-react';

interface RankedProfileImageProps {
  src: string | null;
  alt: string;
  size?: number;
  rank?: number;  // Only for ranks 1-3
}

export default function RankedProfileImage({ 
  src, 
  alt, 
  size = 40,
  rank,
}: RankedProfileImageProps) {
  // Only show crown for top 3 ranks
  const showCrown = rank === 1 || rank === 2 || rank === 3;
  
  if (!showCrown) {
    return <ProfileImage src={src} alt={alt} size={size} />;
  }

  // Determine crown color based on rank
  let crownColor: string;
  let crownFill: string;
  
  if (rank === 1) {
    crownColor = "#FFF2C0"; // Gold
    crownFill = "#FFD30F";
  } else if (rank === 2) {
    crownColor = "#EEEEEE"; // Silver
    crownFill = "#CBCBCB";
  } else if (rank === 3) {
    crownColor = "#FFB06B"; // Bronze
    crownFill = "#FF9436";
  } else {
    crownColor = "#FFF2C0"; // Default gold (shouldn't reach here)
    crownFill = "#FFD30F";
  }

  // Calculate size - make crown proportional to profile image
  const crownSize = Math.max(16, size * 0.6);
  
  return (
    <div className="relative">
      <ProfileImage src={src} alt={alt} size={size} />
      
      {/* Crown with direct border styling */}
      <div className="absolute -top-1 -right-0.25 z-10">
        {/* First crown - larger stroke for border effect */}
        <div className="absolute left-0 top-0">
          <Crown 
            size={crownSize} 
            strokeWidth={4}
            stroke={crownColor}
            className="drop-shadow-md"
          />
        </div>
        
        {/* Second crown - actual colored crown on top */}
        <div className="absolute left-0 top-0">
          <Crown 
            size={crownSize} 
            stroke={crownFill}
            strokeWidth={1.5}
            fill={crownFill}
            className="drop-shadow-sm"
          />
        </div>
      </div>
    </div>
  );
}