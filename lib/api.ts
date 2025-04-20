// lib/api.ts
import { getSupabaseClient } from './supabase';
import { Task, UserSettings, Session } from '@/types/database';

// Default settings for new users
const DEFAULT_SETTINGS: UserSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  notifications: true,
};

// User Settings API
export async function getUserSettings(): Promise<UserSettings> {
  const supabase = getSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return DEFAULT_SETTINGS;
  }

  const { data, error } = await supabase
    .from('users')
    .select('settings')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Failed to get user settings:', error);
    return DEFAULT_SETTINGS;
  }

  return (data?.settings as UserSettings) || DEFAULT_SETTINGS;
}

export async function updateUserSettings(
  settings: Partial<UserSettings>
): Promise<UserSettings> {
  const supabase = getSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get current settings
  const { data: currentData } = await supabase
    .from('users')
    .select('settings')
    .eq('id', user.id)
    .single();

  // Merge current settings with new settings
  const updatedSettings = {
    ...(currentData?.settings || DEFAULT_SETTINGS),
    ...settings,
  };

  const { error } = await supabase
    .from('users')
    .update({ settings: updatedSettings })
    .eq('id', user.id);

  if (error) {
    throw new Error(`Failed to update settings: ${error.message}`);
  }

  return updatedSettings;
}

// Task API
export async function getTasks(): Promise<Task[]> {
  const supabase = getSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getTaskById(taskId: string): Promise<Task> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  if (error) throw error;
  return data;
}

export async function createTask(
  task: Omit<
    Task,
    'id' | 'user_id' | 'created_at' | 'updated_at' | 'completed_at'
  >
): Promise<Task> {
  const supabase = getSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert([
      {
        ...task,
        user_id: user.id,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTask(
  taskId: string,
  updates: Partial<Task>
): Promise<Task> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId);

  if (error) throw error;

  // Return the updated task
  return getTaskById(taskId);
}

export async function deleteTask(taskId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.from('tasks').delete().eq('id', taskId);

  if (error) throw error;
}

export async function toggleTaskCompletion(taskId: string): Promise<Task> {
  const supabase = getSupabaseClient();

  // Get the current task state
  const task = await getTaskById(taskId);

  // Set the opposite completion state
  const updates = {
    is_completed: !task.is_completed,
    completed_at: task.is_completed ? null : new Date().toISOString(),
  };

  // Update the task
  return updateTask(taskId, updates);
}

// Session API
export async function getSessions(): Promise<Session[]> {
  const supabase = getSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getSessionById(sessionId: string): Promise<Session> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) throw error;
  return data;
}

export async function createSession(
  session: Omit<Session, 'id' | 'user_id' | 'started_at' | 'ended_at'>
): Promise<Session> {
  const supabase = getSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('sessions')
    .insert([
      {
        ...session,
        user_id: user.id,
        started_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function completeSession(sessionId: string): Promise<Session> {
  const supabase = getSupabaseClient();

  // First update the session
  const { data, error } = await supabase
    .from('sessions')
    .update({
      is_completed: true,
      ended_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;

  // If this is a work session for a task, increment the completed_pomodoros count
  if (data.task_id && data.type === 'work') {
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .select('completed_pomodoros')
      .eq('id', data.task_id)
      .single();

    if (taskError) {
      console.error('Error fetching task for pomodoro increment:', taskError);
    } else if (taskData) {
      // Update the task with an incremented pomodoro count
      await supabase
        .from('tasks')
        .update({
          completed_pomodoros: (taskData.completed_pomodoros || 0) + 1,
        })
        .eq('id', data.task_id);
    }
  }

  return data;
}

// User Profile API
export async function getUserProfile() {
  const supabase = getSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data;
}

export async function updateUserProfile(updates: {
  username?: string;
  profile_picture?: string | null;
}) {
  const supabase = getSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Check if username already exists (if username update is requested)
  if (updates.username) {
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', updates.username)
      .neq('id', user.id)
      .single();

    if (existingUser) {
      throw new Error('Username already taken');
    }
  }

  const { data, error } = await supabase
    .from('users')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Friends API
export async function searchUsers(username: string) {
  const supabase = getSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // First try exact match
  const { data: exactMatch } = await supabase
    .from('users')
    .select('id, username, profile_picture')
    .eq('username', username.trim())
    .neq('id', user.id)
    .single();

  if (exactMatch) {
    return exactMatch;
  }

  // Then try partial match
  const { data: partialMatches } = await supabase
    .from('users')
    .select('id, username, profile_picture')
    .ilike('username', `%${username.trim()}%`)
    .neq('id', user.id)
    .limit(5);

  return partialMatches || [];
}

export async function getFriends() {
  const supabase = getSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get friend IDs
  const { data: friendIds, error: friendError } = await supabase
    .from('user_friends')
    .select('friend_id')
    .eq('user_id', user.id);

  if (friendError) throw friendError;

  if (!friendIds || friendIds.length === 0) {
    return [];
  }

  // Get friend details
  const friendIdArray = friendIds.map(
    (row: { friend_id: string }) => row.friend_id
  );

  const { data: friends, error } = await supabase
    .from('users')
    .select(
      'id, username, profile_picture, total_focus_time, completed_tasks_count, streak_days, is_premium'
    )
    .in('id', friendIdArray);

  if (error) throw error;
  return friends || [];
}

export async function sendFriendRequest(recipientId: string) {
  const supabase = getSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Check if request already exists
  const { data: existingRequest } = await supabase
    .from('friend_requests')
    .select('id, status')
    .or(
      `and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`
    )
    .maybeSingle();

  if (existingRequest) {
    throw new Error('A friend request already exists between these users');
  }

  // Create the friend request
  const { data, error } = await supabase
    .from('friend_requests')
    .insert([
      {
        sender_id: user.id,
        recipient_id: recipientId,
        status: 'pending',
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getFriendRequests() {
  const supabase = getSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get received requests
  const { data: receivedRequests, error: receivedError } = await supabase
    .from('friend_requests')
    .select(
      `
      id, sender_id, recipient_id, status, created_at,
      sender:sender_id(username, profile_picture)
    `
    )
    .eq('recipient_id', user.id)
    .eq('status', 'pending');

  if (receivedError) throw receivedError;

  // Get sent requests
  const { data: sentRequests, error: sentError } = await supabase
    .from('friend_requests')
    .select(
      `
      id, sender_id, recipient_id, status, created_at,
      recipient:recipient_id(username, profile_picture)
    `
    )
    .eq('sender_id', user.id)
    .eq('status', 'pending');

  if (sentError) throw sentError;

  return {
    received: receivedRequests || [],
    sent: sentRequests || [],
  };
}

export async function respondToFriendRequest(
  requestId: string,
  accept: boolean
) {
  const supabase = getSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get request details
  const { data: request, error: requestError } = await supabase
    .from('friend_requests')
    .select('sender_id, recipient_id')
    .eq('id', requestId)
    .single();

  if (requestError) throw requestError;

  // Update request status
  const { error: updateError } = await supabase
    .from('friend_requests')
    .update({ status: accept ? 'accepted' : 'rejected' })
    .eq('id', requestId);

  if (updateError) throw updateError;

  // If accepted, create friend relationship
  if (accept) {
    try {
      await supabase.from('user_friends').insert([
        { user_id: user.id, friend_id: request.sender_id },
        { user_id: request.sender_id, friend_id: user.id },
      ]);
    } catch (error) {
      console.error('Error creating friendship:', error);
      throw new Error('Failed to create friendship');
    }
  }

  return { success: true };
}

export async function removeFriend(friendId: string) {
  const supabase = getSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Delete both friendship entries
  await Promise.all([
    supabase
      .from('user_friends')
      .delete()
      .eq('user_id', user.id)
      .eq('friend_id', friendId),

    supabase
      .from('user_friends')
      .delete()
      .eq('user_id', friendId)
      .eq('friend_id', user.id),
  ]);

  return { success: true };
}

// Analytics API
export async function getAnalyticsData(
  period: 'week' | 'month' | 'all' = 'week'
) {
  const supabase = getSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get cutoff date based on period
  let cutoffDate = new Date();
  if (period === 'week') {
    cutoffDate.setDate(cutoffDate.getDate() - 7);
  } else if (period === 'month') {
    cutoffDate.setDate(cutoffDate.getDate() - 30);
  } else {
    cutoffDate = new Date(2000, 0, 1); // A long time ago
  }

  const cutoffString = cutoffDate.toISOString();

  // Get sessions for the period
  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', user.id)
    .gte('started_at', cutoffString)
    .order('started_at', { ascending: false });

  if (sessionsError) throw sessionsError;

  // Get tasks for the period
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', cutoffString);

  if (tasksError) throw tasksError;

  return {
    sessions: sessions || [],
    tasks: tasks || [],
  };
}

// Premium Status API
export async function updatePremiumStatus(isPremium: boolean) {
  const supabase = getSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('users')
    .update({
      is_premium: isPremium,
      premium_purchased_at: isPremium ? new Date().toISOString() : null,
    })
    .eq('id', user.id);

  if (error) throw error;

  return { success: true };
}

export async function recordFocusSession(durationSeconds: number) {
  const supabase = getSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Update total focus time
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('total_focus_time')
    .eq('id', user.id)
    .single();

  if (userError) throw userError;

  const currentTotalTime = userData.total_focus_time || 0;
  const newTotalTime = currentTotalTime + durationSeconds;

  const { error } = await supabase
    .from('users')
    .update({
      total_focus_time: newTotalTime,
      last_active_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) throw error;

  return { totalFocusTime: newTotalTime };
}

export async function getLeaderboardData() {
  const supabase = getSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get top focus time users
  const { data: focusLeaders, error: focusError } = await supabase
    .from('users')
    .select(
      'id, username, profile_picture, total_focus_time, completed_tasks_count, streak_days, is_premium'
    )
    .order('total_focus_time', { ascending: false })
    .limit(10);

  if (focusError) throw focusError;

  // Get top task completers
  const { data: taskLeaders, error: taskError } = await supabase
    .from('users')
    .select(
      'id, username, profile_picture, total_focus_time, completed_tasks_count, streak_days, is_premium'
    )
    .order('completed_tasks_count', { ascending: false })
    .limit(10);

  if (taskError) throw taskError;

  // Get friend IDs for friend leaderboard
  const { data: friendIds, error: friendError } = await supabase
    .from('user_friends')
    .select('friend_id')
    .eq('user_id', user.id);

  if (friendError) throw friendError;

  let friendLeaders = [];
  if (friendIds && friendIds.length > 0) {
    const friendIdArray = friendIds.map(
      (row: { friend_id: string }) => row.friend_id
    );

    // Get friend leaderboard data
    const { data: friends, error: friendsError } = await supabase
      .from('users')
      .select(
        'id, username, profile_picture, total_focus_time, completed_tasks_count, streak_days, is_premium'
      )
      .in('id', friendIdArray)
      .order('total_focus_time', { ascending: false });

    if (friendsError) throw friendsError;
    friendLeaders = friends || [];
  }

  return {
    focusLeaders: focusLeaders || [],
    taskLeaders: taskLeaders || [],
    friendLeaders,
  };
}
