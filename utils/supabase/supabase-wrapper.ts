import { createClient } from '@/utils/supabase/client';

let supabaseClient: ReturnType<typeof createClient> | null = null;
let initializationPromise: Promise<ReturnType<typeof createClient>> | null =
  null;
let initializationAttempts = 0;
const MAX_ATTEMPTS = 3;

export function getSupabaseClient() {
  // Return existing client if already initialized
  if (supabaseClient) return supabaseClient;

  // Return in-progress initialization if one exists
  if (initializationPromise) return initializationPromise;

  // Create new initialization promise with async/await pattern
  initializationPromise = new Promise<ReturnType<typeof createClient>>(
    async (resolve, reject) => {
      try {
        initializationAttempts++;
        console.log(
          `Supabase initialization attempt: ${initializationAttempts}`
        );

        const client = createClient();

        // Test the client with a more robust check
        const { data, error } = await client.auth.getSession();

        if (error && initializationAttempts < MAX_ATTEMPTS) {
          // Retry initialization on error
          console.warn('Supabase initialization error, retrying:', error);
          initializationPromise = null;
          setTimeout(() => {
            resolve(getSupabaseClient());
          }, 1000); // Retry after 1 second
          return;
        }

        console.log('Supabase client initialized successfully');
        supabaseClient = client;
        resolve(client);
      } catch (error) {
        console.error('Supabase initialization failed:', error);
        if (initializationAttempts < MAX_ATTEMPTS) {
          // Retry on exceptions too
          initializationPromise = null;
          setTimeout(() => {
            resolve(getSupabaseClient());
          }, 1000);
          return;
        }

        // After max attempts, create a client anyway but log the error
        console.error(
          'Max initialization attempts reached, creating client without validation'
        );
        const fallbackClient = createClient();
        supabaseClient = fallbackClient;
        resolve(fallbackClient);
      }
    }
  );

  return initializationPromise;
}
