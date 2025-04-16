export type RankTier =
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'focus-master'
  | 'productivity-legend';

export interface RankInfo {
  tier: RankTier;
  name: string;
  color: string;
  focusTimeRequired: number; // in seconds
  tasksRequired: number;
  imagePath: string;
}

// Rank definitions with requirements
export const RANKS: Record<RankTier, RankInfo> = {
  bronze: {
    tier: 'bronze',
    name: 'Bronze',
    color: '#EE8D2C',
    focusTimeRequired: 0, // Starting rank
    tasksRequired: 0,
    imagePath: '/ranks/bronze.png',
  },
  silver: {
    tier: 'silver',
    name: 'Silver',
    color: '#D7D7D7',
    focusTimeRequired: 10 * 60 * 60, // 10 hours in seconds
    tasksRequired: 25,
    imagePath: '/ranks/silver.png',
  },
  gold: {
    tier: 'gold',
    name: 'Gold',
    color: '#FFDD1E',
    focusTimeRequired: 30 * 60 * 60, // 30 hours
    tasksRequired: 75,
    imagePath: '/ranks/gold.png',
  },
  'focus-master': {
    tier: 'focus-master',
    name: 'Focus Master',
    color: '#69DCFF',
    focusTimeRequired: 60 * 60 * 60, // 60 hours
    tasksRequired: 150,
    imagePath: '/ranks/focus_master.png',
  },
  'productivity-legend': {
    tier: 'productivity-legend',
    name: 'Productivity Legend',
    color: '#CF56FF',
    focusTimeRequired: 100 * 60 * 60, // 100 hours
    tasksRequired: 300,
    imagePath: '/ranks/productivity_legend.png',
  },
};

/**
 * Calculate a user's rank based on their focus time and completed tasks
 * Uses the higher of the two metrics to determine rank
 */
export function calculateUserRank(
  focusTimeSeconds: number,
  completedTasks: number
): RankInfo {
  // Default to bronze
  let currentRank = RANKS['bronze'];

  // Check focus time against each rank threshold
  if (focusTimeSeconds >= RANKS['productivity-legend'].focusTimeRequired) {
    currentRank = RANKS['productivity-legend'];
  } else if (focusTimeSeconds >= RANKS['focus-master'].focusTimeRequired) {
    currentRank = RANKS['focus-master'];
  } else if (focusTimeSeconds >= RANKS['gold'].focusTimeRequired) {
    currentRank = RANKS['gold'];
  } else if (focusTimeSeconds >= RANKS['silver'].focusTimeRequired) {
    currentRank = RANKS['silver'];
  }

  // Check task count against each rank threshold and update if higher
  let taskRank = RANKS['bronze'];
  if (completedTasks >= RANKS['productivity-legend'].tasksRequired) {
    taskRank = RANKS['productivity-legend'];
  } else if (completedTasks >= RANKS['focus-master'].tasksRequired) {
    taskRank = RANKS['focus-master'];
  } else if (completedTasks >= RANKS['gold'].tasksRequired) {
    taskRank = RANKS['gold'];
  } else if (completedTasks >= RANKS['silver'].tasksRequired) {
    taskRank = RANKS['silver'];
  }

  // Return the higher of the two ranks
  if (
    Object.values(RANKS).indexOf(taskRank) >
    Object.values(RANKS).indexOf(currentRank)
  ) {
    return taskRank;
  }

  return currentRank;
}

/**
 * Format seconds into a readable time string (e.g., "15h 30m")
 */
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

/**
 * Calculate progress to next rank
 */
export function calculateProgressToNextRank(
  focusTimeSeconds: number,
  completedTasks: number,
  currentRank: RankInfo
): {
  focusTimePercent: number;
  tasksPercent: number;
  nextRank: RankInfo | null;
} {
  const rankKeys = Object.keys(RANKS) as RankTier[];
  const currentIndex = rankKeys.indexOf(currentRank.tier);

  // If user is already at highest rank
  if (currentIndex === rankKeys.length - 1) {
    return {
      focusTimePercent: 100,
      tasksPercent: 100,
      nextRank: null,
    };
  }

  // Get next rank
  const nextRank = RANKS[rankKeys[currentIndex + 1]];

  // Calculate progress percentages
  const focusTimePercent = Math.min(
    100,
    (focusTimeSeconds / nextRank.focusTimeRequired) * 100
  );
  const tasksPercent = Math.min(
    100,
    (completedTasks / nextRank.tasksRequired) * 100
  );

  return {
    focusTimePercent,
    tasksPercent,
    nextRank,
  };
}
