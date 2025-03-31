/*

typescript types

*/

export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  settings: UserSettings;
}

export interface UserSettings {
  workDuration: number; // in minutes
  shortBreakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  notifications: boolean;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  estimated_pomodoros: number;
  completed_pomodoros: number;
  is_completed: boolean;
  is_important: boolean; // New field replacing the tags system
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface Session {
  id: string;
  user_id: string;
  task_id: string | null;
  type: 'work' | 'short_break' | 'long_break';
  duration: number; // in seconds
  started_at: string;
  ended_at: string | null;
  is_completed: boolean;
}

export interface User {
  id: string;
  email: string;
  username: string | null;
  profile_picture: string | null;
  created_at: string;
  updated_at: string;
  settings: UserSettings;
  is_premium: boolean;
}

// Database response types
export type TasksResponse = Task[];
export type SessionsResponse = Session[];
