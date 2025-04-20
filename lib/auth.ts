import { User } from '@/types/user';
import { getSupabaseClient, getServerSupabaseClient } from './supabase';

export async function signIn({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function signOut() {
  const supabase = getSupabaseClient();
  await supabase.auth.signOut();
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = getSupabaseClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    // Get full user profile
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    return data;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Server-side auth functions
export async function getServerUser() {
  const supabase = await getServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get full user profile
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  return data;
}
