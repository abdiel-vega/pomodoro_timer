/*

supabase database interactions with local storage fallback

- utility functions to interact with the supabase db
- falls back to localStorage when user is not authenticated

*/
import { createClient } from '@/utils/supabase/client';
import { 
  Task, 
  Session, 
  Tag, 
  UserSettings,
  TasksResponse, 
  SessionsResponse, 
  TagsResponse 
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
  SESSIONS: 'pomodoro_sessions',
  TAGS: 'pomodoro_tags'
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
        .select(`
          *,
          tags:task_tags(
            tags(*)
          )
        `)
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      // Process the response to transform nested structure to Task[]
      const formattedTasks = data.map((task: any) => {
        // Extract the tag objects from the nested structure
        let extractedTags = [];
        
        if (task.tags && Array.isArray(task.tags)) {
          extractedTags = task.tags.map((tt: any) => {
            // Handle the nested structure where tags is a property
            if (tt && tt.tags && typeof tt.tags === 'object') {
              return tt.tags;
            }
            return null;
          }).filter(Boolean); // Remove null values
        }
        
        return {
          ...task,
          tags: extractedTags
        };
      });
      
      console.log("Formatted tasks with extracted tags:", formattedTasks);
      return formattedTasks;
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
        .select(`
          *,
          tags:task_tags(
            tags(*)
          )
        `)
        .eq('id', taskId)
        .single();
        
      if (error) {
        throw error;
      }
      
      // Process tags
      let extractedTags = [];
      if (data.tags && Array.isArray(data.tags)) {
        extractedTags = data.tags.map((tt: any) => {
          // Handle the nested structure where tags is a property
          if (tt && tt.tags && typeof tt.tags === 'object') {
            return tt.tags;
          }
          return null;
        }).filter(Boolean); // Remove null values
      }
      
      return {
        ...data,
        tags: extractedTags
      };
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

export async function createTask(task: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'completed_at'> & { tags?: string[] }): Promise<Task> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // First create the task in Supabase
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .insert([
          {
            ...task,
            user_id: user.id,
            tags: undefined // Remove tags property as it's not in the tasks table
          }
        ])
        .select()
        .single();
        
      if (taskError) {
        throw taskError;
      }
      
      // If task has tags, create the relationships
      if (task.tags && task.tags.length > 0) {
        const taskTags = task.tags.map(tagId => ({
          task_id: taskData.id,
          tag_id: tagId
        }));
        
        const { error: tagError } = await supabase
          .from('task_tags')
          .insert(taskTags);
          
        if (tagError) {
          throw tagError;
        }
      }
      
      // Get the complete task with tags
      return getTaskById(taskData.id);
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: null,
        tags: task.tags || []
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

export async function updateTask(taskId: string, updates: Partial<Task> & { tags?: string[] }): Promise<Task> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Extract tags from updates object
      const { tags, ...taskUpdates } = updates;
      
      // Update the task in Supabase
      const { error: taskError } = await supabase
        .from('tasks')
        .update(taskUpdates)
        .eq('id', taskId);
        
      if (taskError) {
        throw taskError;
      }
      
      // If tags are provided, update them
      if (tags !== undefined) {
        // First remove all existing task_tags
        const { error: deleteError } = await supabase
          .from('task_tags')
          .delete()
          .eq('task_id', taskId);
          
        if (deleteError) {
          throw deleteError;
        }
        
        // Then add the new tags
        if (tags.length > 0) {
          const taskTags = tags.map(tagId => ({
            task_id: taskId,
            tag_id: tagId
          }));
          
          const { error: insertError } = await supabase
            .from('task_tags')
            .insert(taskTags);
            
          if (insertError) {
            throw insertError;
          }
        }
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
          // Extract tags if present
          const { tags, ...otherUpdates } = updates;
          
          // Update the task
          tasks[taskIndex] = {
            ...tasks[taskIndex],
            ...otherUpdates,
            updated_at: new Date().toISOString()
          };
          
          // Update tags if provided
          if (tags !== undefined) {
            tasks[taskIndex].tags = tags;
          }
          
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

export async function completeTask(taskId: string): Promise<Task> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Complete task in Supabase
      const { error } = await supabase
        .from('tasks')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId);
        
      if (error) {
        throw error;
      }
      
      return getTaskById(taskId);
    }
  } catch (error) {
    console.warn('Failed to complete task in Supabase:', error);
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
            is_completed: true,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
          return tasks[taskIndex];
        }
      }
    } catch (e) {
      console.error('Error completing task in localStorage:', e);
    }
  }
  
  throw new Error('Task not found or could not be completed');
}

export async function markTaskIncomplete(taskId: string): Promise<Task> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Update task in Supabase
      const { data, error } = await supabase
        .from('tasks')
        .update({
          is_completed: false,
          completed_at: null
        })
        .eq('id', taskId)
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      return data;
    }
  } catch (error) {
    console.warn('Failed to mark task as incomplete in Supabase:', error);
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
            is_completed: false,
            completed_at: null,
            updated_at: new Date().toISOString()
          };
          
          localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
          return tasks[taskIndex];
        }
      }
    } catch (e) {
      console.error('Error marking task incomplete in localStorage:', e);
    }
  }
  
  throw new Error('Task not found or could not be updated');
}

// Tag related functions
export async function getTags(): Promise<TagsResponse> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Get tags from Supabase
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');
        
      if (error) {
        throw error;
      }
      
      return data;
    }
  } catch (error) {
    console.warn('Failed to get tags from Supabase:', error);
  }
  
  // Fallback to local storage
  if (isBrowser) {
    try {
      const storedTags = localStorage.getItem(STORAGE_KEYS.TAGS);
      return storedTags ? JSON.parse(storedTags) : [];
    } catch (e) {
      console.error('Error getting tags from localStorage:', e);
    }
  }
  
  return [];
}

export async function createTag(tag: Omit<Tag, 'id' | 'user_id'>): Promise<Tag> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Create tag in Supabase
      const { data, error } = await supabase
        .from('tags')
        .insert([
          {
            ...tag,
            user_id: user.id
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
    console.warn('Failed to create tag in Supabase:', error);
  }
  
  // Fallback to local storage
  if (isBrowser) {
    try {
      const storedTags = localStorage.getItem(STORAGE_KEYS.TAGS);
      const tags: Tag[] = storedTags ? JSON.parse(storedTags) : [];
      
      const newTag: Tag = {
        id: generateId(),
        user_id: 'local-user',
        name: tag.name,
        color: tag.color
      };
      
      tags.push(newTag);
      localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(tags));
      
      return newTag;
    } catch (e) {
      console.error('Error creating tag in localStorage:', e);
    }
  }
  
  throw new Error('Failed to create tag');
}

// Default tags to provide if no tags exist
export const DEFAULT_TAGS: Omit<Tag, 'id' | 'user_id'>[] = [
  { name: 'Work', color: '#ff5555' },
  { name: 'Study', color: '#55ff55' },
  { name: 'Personal', color: '#5555ff' },
  { name: 'Urgent', color: '#ff5555' },
  { name: 'Important', color: '#ffaa55' }
];

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