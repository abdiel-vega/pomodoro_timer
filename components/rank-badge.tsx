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
  
  // Create a lighter version of the rank color for the shadow
  const shadowColor = lightenColor(rank.color, 30);
  
  const badge = (
    <div 
      className="relative inline-flex items-center justify-center"
      style={{ 
        minWidth: dimensions.width,
        minHeight: dimensions.height,
        filter: `drop-shadow(0 0 4px ${shadowColor})`,
      }}
    >
      <Image 
        src={rank.imagePath}
        alt={rank.name}
        width={dimensions.width}
        height={dimensions.height}
        className="object-contain"
        priority={size === 'lg'}
        sizes={`(max-width: 768px) ${dimensions.width}px, ${dimensions.width}px`}
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
          <p>
            <span 
              className="font-bold" 
            >
              {rank.name}
            </span> Rank
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Helper function to lighten a hex color
function lightenColor(hex: string, percent: number): string {
  // Remove the # if present
  hex = hex.replace('#', '');
  
  // Parse the hex string
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Lighten each component
  const lightenValue = (value: number): number => {
    return Math.min(255, Math.floor(value + (255 - value) * (percent / 100)));
  };
  
  const rNew = lightenValue(r).toString(16).padStart(2, '0');
  const gNew = lightenValue(g).toString(16).padStart(2, '0');
  const bNew = lightenValue(b).toString(16).padStart(2, '0');
  
  return `#${rNew}${gNew}${bNew}`;
}