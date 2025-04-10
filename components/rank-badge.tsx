'use client';

import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RankInfo } from '@/utils/rank';

interface RankBadgeProps {
  rank: RankInfo;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export default function RankBadge({ 
  rank, 
  size = 'md',
  showTooltip = true 
}: RankBadgeProps) {
  // Determine badge size
  const dimensions = {
    sm: { width: 24, height: 24 },
    md: { width: 32, height: 32 },
    lg: { width: 48, height: 48 }
  }[size];
  
  const badge = (
    <div 
      className="relative inline-flex items-center justify-center"
      style={{ 
        minWidth: dimensions.width,
        minHeight: dimensions.height
      }}
    >
      <Image
        src={rank.imagePath}
        alt={rank.name}
        width={dimensions.width}
        height={dimensions.height}
        className="object-contain"
      />
    </div>
  );
  
  if (!showTooltip) {
    return badge;
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p><span className="font-bold">{rank.name}</span> Rank</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}