/*

supabase database interactions with local storage fallback

- utility functions to interact with the supabase db
- falls back to localStorage when user is not authenticated

*/
import { createClient } from '@/utils/supabase/client';
import { 
  Task, 
  Session, 
  UserSettings,
  TasksResponse, 
  SessionsResponse, 
} from '@/types/database';

// Initialize the Supabase client
const supabase = createClient();

// Default settings
const DEFAULT_SETTINGS: UserSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  notifications: true
};

// Helper function to check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Local storage keys
const STORAGE_KEYS = {
  SETTINGS: 'pomodoro_settings',
  TASKS: 'pomodoro_tasks',
  SESSIONS: 'pomodoro_sessions'
};

// Helper to generate UUID for local items
const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// User related functions
export async function getUserSettings(): Promise<UserSettings> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // User is authenticated, try to get settings from Supabase
      const { data, error } = await supabase
        .from('users')
        .select('settings')
        .eq('id', user.id)
        .single();
        
      if (error) {
        throw error;
      }
      
      return data?.settings as UserSettings || DEFAULT_SETTINGS;
    } 
  } catch (error) {
    console.warn('Failed to get user settings from Supabase:', error);
  }
  
  // Fallback to local storage if not authenticated or error occurs
  if (isBrowser) {
    const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (storedSettings) {
      try {
        return JSON.parse(storedSettings) as UserSettings;
      } catch (e) {
        console.error('Error parsing stored settings:', e);
      }
    }
  }
  
  // Return default settings if nothing else works
  return DEFAULT_SETTINGS;
}

export async function updateUserSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Get current settings from Supabase
      const { data: currentData } = await supabase
        .from('users')
        .select('settings')
        .eq('id', user.id)
        .single();
        
      // Merge current settings with new settings
      const updatedSettings = {
        ...(currentData?.settings || DEFAULT_SETTINGS),
        ...settings
      };
      
      const { data, error } = await supabase
        .from('users')
        .update({ settings: updatedSettings })
        .eq('id', user.id)
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      return updatedSettings;
    }
  } catch (error) {
    console.warn('Failed to update user settings in Supabase:', error);
  }
  
  // Fallback to local storage
  if (isBrowser) {
    try {
      const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      const currentSettings = storedSettings ? JSON.parse(storedSettings) : DEFAULT_SETTINGS;
      const updatedSettings = { ...currentSettings, ...settings };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));
      return updatedSettings;
    } catch (e) {
      console.error('Error updating settings in localStorage:', e);
    }
  }
  
  return { ...DEFAULT_SETTINGS, ...settings };
}

// Task related functions
export async function getTasks(): Promise<TasksResponse> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // User is authenticated, get tasks from Supabase
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      return data;
    }
  } catch (error) {
    console.error('Failed to get tasks from Supabase:', error);
  }
  
  // Fallback to local storage
  if (typeof window !== 'undefined') {
    try {
      const storedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
      return storedTasks ? JSON.parse(storedTasks) : [];
    } catch (e) {
      console.error('Error getting tasks from localStorage:', e);
    }
  }
  
  return [];
}

export async function getTaskById(taskId: string): Promise<Task> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // User is authenticated, get task from Supabase
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();
        
      if (error) {
        throw error;
      }
      
      return data;
    }
  } catch (error) {
    console.error('Failed to get task by ID from Supabase:', error);
  }
  
  // Fallback to local storage
  if (typeof window !== 'undefined') {
    try {
      const storedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
      const tasks: Task[] = storedTasks ? JSON.parse(storedTasks) : [];
      const task = tasks.find(t => t.id === taskId);
      
      if (task) {
        return task;
      }
    } catch (e) {
      console.error('Error getting task from localStorage:', e);
    }
  }
  
  throw new Error('Task not found');
}

export async function createTask(task: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'completed_at'>): Promise<Task> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Create the task in Supabase
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .insert([
          {
            ...task,
            user_id: user.id
          }
        ])
        .select()
        .single();
        
      if (taskError) {
        throw taskError;
      }
      
      return taskData;
    }
  } catch (error) {
    console.warn('Failed to create task in Supabase:', error);
  }
  
  // Fallback to local storage
  if (isBrowser) {
    try {
      const storedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
      const tasks: Task[] = storedTasks ? JSON.parse(storedTasks) : [];
      
      const newTask: Task = {
        id: generateId(),
        user_id: 'local-user',
        title: task.title,
        description: task.description || null,
        estimated_pomodoros: task.estimated_pomodoros,
        completed_pomodoros: 0,
        is_completed: false,
        is_important: task.is_important || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: null
      };
      
      tasks.unshift(newTask); // Add to beginning of array
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
      
      return newTask;
    } catch (e) {
      console.error('Error creating task in localStorage:', e);
    }
  }
  
  throw new Error('Failed to create task');
}

export async function updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Update the task in Supabase
      const { error: taskError } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId);
        
      if (taskError) {
        throw taskError;
      }
      
      // Get the updated task
      return getTaskById(taskId);
    }
  } catch (error) {
    console.warn('Failed to update task in Supabase:', error);
  }
  
  // Fallback to local storage
  if (isBrowser) {
    try {
      const storedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
      
      if (storedTasks) {
        let tasks: Task[] = JSON.parse(storedTasks);
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex !== -1) {
          tasks[taskIndex] = {
            ...tasks[taskIndex],
            ...updates,
            updated_at: new Date().toISOString()
          };
          
          localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
          return tasks[taskIndex];
        }
      }
    } catch (e) {
      console.error('Error updating task in localStorage:', e);
    }
  }
  
  throw new Error('Task not found or could not be updated');
}

export async function deleteTask(taskId: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Delete from Supabase
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
        
      if (error) {
        throw error;
      }
      
      return;
    }
  } catch (error) {
    console.warn('Failed to delete task from Supabase:', error);
  }
  
  // Fallback to local storage
  if (isBrowser) {
    try {
      const storedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
      
      if (storedTasks) {
        let tasks: Task[] = JSON.parse(storedTasks);
        tasks = tasks.filter(task => task.id !== taskId);
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
      }
    } catch (e) {
      console.error('Error deleting task from localStorage:', e);
    }
  }
}

export async function toggleTaskCompletion(taskId: string): Promise<Task> {
  try {
    // First get the task to determine its current completion state
    const task = await getTaskById(taskId);
    
    // Set the opposite completion state
    const updates = {
      is_completed: !task.is_completed,
      completed_at: task.is_completed ? null : new Date().toISOString()
    };
    
    // Update the task
    return await updateTask(taskId, updates);
  } catch (error) {
    console.error('Failed to toggle task completion:', error);
    throw error;
  }
}

// Session related functions
export async function getSessions(): Promise<SessionsResponse> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Get sessions from Supabase
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('started_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      return data;
    }
  } catch (error) {
    console.warn('Failed to get sessions from Supabase:', error);
  }
  
  // Fallback to local storage
  if (isBrowser) {
    try {
      const storedSessions = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      return storedSessions ? JSON.parse(storedSessions) : [];
    } catch (e) {
      console.error('Error getting sessions from localStorage:', e);
    }
  }
  
  return [];
}

export async function createSession(session: Omit<Session, 'id' | 'user_id' | 'started_at' | 'ended_at'>): Promise<Session> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Create session in Supabase
      const { data, error } = await supabase
        .from('sessions')
        .insert([
          {
            ...session,
            user_id: user.id,
            started_at: new Date().toISOString()
          }
        ])
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      return data;
    }
  } catch (error) {
    console.warn('Failed to create session in Supabase:', error);
  }
  
  // Fallback to local storage
  if (isBrowser) {
    try {
      const storedSessions = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      const sessions: Session[] = storedSessions ? JSON.parse(storedSessions) : [];
      
      const newSession: Session = {
        id: generateId(),
        user_id: 'local-user',
        task_id: session.task_id,
        type: session.type,
        duration: session.duration,
        started_at: new Date().toISOString(),
        ended_at: null,
        is_completed: false
      };
      
      sessions.unshift(newSession);
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
      
      return newSession;
    } catch (e) {
      console.error('Error creating session in localStorage:', e);
    }
  }
  
  throw new Error('Failed to create session');
}

export async function completeSession(sessionId: string): Promise<Session> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Complete session in Supabase
      const { data, error } = await supabase
        .from('sessions')
        .update({
          is_completed: true,
          ended_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      // If the session was for a task, increment the completed_pomodoros count
      if (data.task_id && data.type === 'work') {
        const { data: taskData } = await supabase
          .from('tasks')
          .select('completed_pomodoros')
          .eq('id', data.task_id)
          .single();
          
        if (taskData) {
          await supabase
            .from('tasks')
            .update({
              completed_pomodoros: taskData.completed_pomodoros + 1
            })
            .eq('id', data.task_id);
        }
      }
      
      return data;
    }
  } catch (error) {
    console.warn('Failed to complete session in Supabase:', error);
  }
  
  // Fallback to local storage
  if (isBrowser) {
    try {
      const storedSessions = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      let sessions: Session[] = [];
      let session: Session | undefined;
      
      if (storedSessions) {
        sessions = JSON.parse(storedSessions);
        const sessionIndex = sessions.findIndex(s => s.id === sessionId);
        
        if (sessionIndex !== -1) {
          sessions[sessionIndex] = {
            ...sessions[sessionIndex],
            is_completed: true,
            ended_at: new Date().toISOString()
          };
          
          session = sessions[sessionIndex];
          
          // If the session was for a task, increment the completed_pomodoros count
          if (session.task_id && session.type === 'work') {
            const storedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
            
            if (storedTasks) {
              const tasks: Task[] = JSON.parse(storedTasks);
              const taskIndex = tasks.findIndex(t => t.id === session!.task_id);
              
              if (taskIndex !== -1) {
                tasks[taskIndex] = {
                  ...tasks[taskIndex],
                  completed_pomodoros: (tasks[taskIndex].completed_pomodoros || 0) + 1,
                  updated_at: new Date().toISOString()
                };
                
                localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
              }
            }
          }
          
          localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
          return session;
        }
      }
    } catch (e) {
      console.error('Error completing session in localStorage:', e);
    }
  }
  
  throw new Error('Session not found or could not be completed');
}