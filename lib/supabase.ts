/*

supabase database interactions

- utility functions to interact with the supabase db

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

// User related functions
export async function getUserSettings() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const { data, error } = await supabase
    .from('users')
    .select('settings')
    .eq('id', user.id)
    .single();
    
  if (error) {
    throw error;
  }
  
  return data?.settings as UserSettings;
}

export async function updateUserSettings(settings: Partial<UserSettings>) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  // First get current settings
  const { data: currentData } = await supabase
    .from('users')
    .select('settings')
    .eq('id', user.id)
    .single();
    
  // Merge current settings with new settings
  const updatedSettings = {
    ...(currentData?.settings || {}),
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
  
  return data;
}

// Task related functions
export async function getTasks(): Promise<TasksResponse> {
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
    let tags: Tag[] = [];
    if (task.tags && Array.isArray(task.tags)) {
      tags = task.tags.map((tt: any) => tt.tags).filter(Boolean);
    }
    
    return {
      ...task,
      tags
    };
  });
  
  return formattedTasks;
}

export async function getTaskById(taskId: string): Promise<Task> {
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
  let tags: Tag[] = [];
  if (data.tags && Array.isArray(data.tags)) {
    tags = data.tags.map((tt: any) => tt.tags).filter(Boolean);
  }
  
  return {
    ...data,
    tags
  };
}

export async function createTask(task: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'completed_at'> & { tags?: string[] }): Promise<Task> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  // First create the task
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

export async function updateTask(taskId: string, updates: Partial<Task> & { tags?: string[] }): Promise<Task> {
  // Extract tags from updates object
  const { tags, ...taskUpdates } = updates;
  
  // Update the task
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

export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);
    
  if (error) {
    throw error;
  }
}

export async function completeTask(taskId: string): Promise<Task> {
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

// Tag related functions
export async function getTags(): Promise<TagsResponse> {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name');
    
  if (error) {
    throw error;
  }
  
  return data;
}

export async function createTag(tag: Omit<Tag, 'id' | 'user_id'>): Promise<Tag> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
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

export async function updateTag(tagId: string, updates: Partial<Omit<Tag, 'id' | 'user_id'>>): Promise<Tag> {
  const { data, error } = await supabase
    .from('tags')
    .update(updates)
    .eq('id', tagId)
    .select()
    .single();
    
  if (error) {
    throw error;
  }
  
  return data;
}

export async function deleteTag(tagId: string): Promise<void> {
  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', tagId);
    
  if (error) {
    throw error;
  }
}

// Session related functions
export async function getSessions(): Promise<SessionsResponse> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('started_at', { ascending: false });
    
  if (error) {
    throw error;
  }
  
  return data;
}

export async function createSession(session: Omit<Session, 'id' | 'user_id' | 'started_at' | 'ended_at'>): Promise<Session> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
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

export async function completeSession(sessionId: string): Promise<Session> {
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