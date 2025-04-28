// lib/supabase.ts (client-side only)
import { createBrowserClient } from '@supabase/ssr';

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return supabaseClient;
}

// For backward compatibility
export const createClient = getSupabaseClient;

/**
 * Executes a Supabase query with a timeout
 * @param queryPromise - The Supabase query promise
 * @param timeoutMs - Timeout in milliseconds (default: 5000ms)
 * @returns Promise that resolves with the query result or rejects with timeout
 */
export async function executeWithTimeout<T>(
  queryPromise: Promise<T>,
  timeoutMs: number = 5000
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new Error(`Query timeout after ${timeoutMs}ms`)),
      timeoutMs
    );
  });

  return Promise.race([queryPromise, timeoutPromise]);
}
