// utils/supabase.ts
import { getSupabaseClient } from '@/lib/supabase';
import { getServerSupabaseClient } from '@/lib/supabase-server';

// Re-export the client functions
export { getSupabaseClient };

// For backward compatibility
export const createClient = getSupabaseClient;

// Warn about server client usage
export const createServerClient = () => {
  console.warn(
    'createServerClient from utils/supabase.ts is deprecated. Import getServerSupabaseClient from lib/supabase-server.ts instead.'
  );
  throw new Error('Server client cannot be used in client components');
};
