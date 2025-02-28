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
  
  // Modify the Task interface in your types/database.ts
export interface Task {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    estimated_pomodoros: number;
    completed_pomodoros: number;
    is_completed: boolean;
    created_at: string;
    updated_at: string;
    completed_at: string | null;
    // Either make it a union type or a separate property
    tags?: Tag[] | string[]; // This indicates it can be either format
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
  
  export interface Tag {
    id: string;
    user_id: string;
    name: string;
    color: string;
  }
  
  export interface TaskTag {
    task_id: string;
    tag_id: string;
  }
  
  // Database response types
  export type TasksResponse = Task[];
  export type SessionsResponse = Session[];
  export type TagsResponse = Tag[];