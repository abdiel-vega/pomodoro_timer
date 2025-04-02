// types/user.ts
export interface User {
    id: string;
    email: string;
    username: string | null;
    profile_picture: string | null;
    created_at: string;
    updated_at: string;
    is_premium: boolean;
    total_focus_time: number;
    completed_tasks_count: number;
    streak_days?: number;
    last_active_at?: string;
  }
  
  // Add this interface for leaderboard entries
  export interface LeaderboardUser {
    id: string;
    username: string | null;
    profile_picture: string | null;
    total_focus_time?: number;
    completed_tasks_count?: number;
    streak_days?: number;
  }
  
  // For partial updates
  export type UserUpdate = Partial<Omit<User, 'id' | 'created_at'>>;