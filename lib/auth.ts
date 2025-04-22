import { User } from '@/types/user';
import { getSupabaseClient } from '@/lib/supabase';

export async function signIn({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}

export async function signOut() {
  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = getSupabaseClient();

  try {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      console.warn('Auth error or no user:', authError);
      return null;
    }

    // Get full user profile
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (error) {
      console.warn('Error getting user profile:', error);

      // Fallback to basic user info
      return {
        id: authUser.id,
        email: authUser.email || '',
        username: authUser.user_metadata?.username || null,
        profile_picture: null,
        created_at: authUser.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_premium: false,
        total_focus_time: 0,
        completed_tasks_count: 0,
      };
    }

    return data as User;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}
