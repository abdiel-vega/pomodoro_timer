import { createClient } from '@/utils/supabase/client';

// Global client reference
let supabaseClient: ReturnType<typeof createClient> | null = null;
let initializationPromise: Promise<ReturnType<typeof createClient>> | null =
  null;

export function getSupabaseClient() {
  // Return existing client if already initialized
  if (supabaseClient) return supabaseClient;

  // Return in-progress initialization if one exists
  if (initializationPromise) return initializationPromise;

  // Create new initialization promise with async/await pattern
  initializationPromise = new Promise<ReturnType<typeof createClient>>(
    async (resolve) => {
      const client = createClient();

      try {
        // Use auth API which is guaranteed to exist in any Supabase project
        await client.auth.getSession();
        console.log('Supabase client initialized successfully');
      } catch (error) {
        // Log but continue if test fails
        console.warn('Supabase initialization check failed:', error);
      }

      // Always resolve with the client
      supabaseClient = client;
      resolve(client);
    }
  );

  return initializationPromise;
}
