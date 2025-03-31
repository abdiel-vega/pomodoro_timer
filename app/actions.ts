'use server';

import { encodedRedirect } from '@/utils/utils';
import { createClient } from '@/utils/supabase/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export const signUpAction = async (formData: FormData) => {
  const email = formData.get('email')?.toString();
  const password = formData.get('password')?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get('origin');

  if (!email || !password) {
    return encodedRedirect(
      'error',
      '/sign-up',
      'Email and password are required'
    );
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error(error.code + ' ' + error.message);
    return encodedRedirect('error', '/sign-up', error.message);
  } else {
    // Redirect to confirmation page instead of showing a message
    return redirect('/sign-up/confirmation');
  }
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect('error', '/sign-in', error.message);
  }

  return redirect('/protected');
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get('email')?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get('origin');

  console.log('Local server time:', new Date().toISOString());
  console.log('Local server timezone offset:', new Date().getTimezoneOffset());

  if (!email) {
    // Return an object instead of redirecting
    return { error: 'Email is required' };
  }

  try {
    // Log the timestamp for debugging the time discrepancy
    console.log(
      'Server time when sending reset email:',
      new Date().toISOString()
    );

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?type=recovery`,
    });

    if (error) {
      console.error('Password reset error:', error.message);
      // Return an object instead of redirecting
      return { error: 'Could not reset password: ' + error.message };
    }

    // Return success message instead of redirecting
    return {
      success:
        'Check your email for a password reset link. Please check both inbox and spam folders.',
    };
  } catch (err: any) {
    console.error('Exception in password reset:', err);
    // Return an object instead of redirecting
    return { error: 'An unexpected error occurred: ' + err.message };
  }
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      'error',
      '/protected/reset-password',
      'Password and confirm password are required'
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      'error',
      '/protected/reset-password',
      'Passwords do not match'
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      'error',
      '/protected/reset-password',
      'Password update failed'
    );
  }

  encodedRedirect('success', '/protected/reset-password', 'Password updated');
};

export const signOutAction = async () => {
  const supabase = await createClient();

  try {
    // Sign out the user
    await supabase.auth.signOut();
    console.log('User signed out successfully');

    // Redirect to sign-in page
    return redirect('/sign-in');
  } catch (error) {
    console.error('Error signing out:', error);
    // Even if there's an error, redirect to sign-in
    return redirect('/sign-in');
  }
};

export async function handleGoogleAuthCallback(userId: string) {
  try {
    const supabase = await createClient();

    // Get user info
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('Failed to get user');
    }

    // Check if user already exists in our users table
    const { data: existingUser, error: existingError } = await supabase
      .from('users')
      .select('id, username')
      .eq('id', userId)
      .single();

    // If user doesn't exist or doesn't have a username, create a temporary one
    if (!existingUser || !existingUser.username) {
      // Extract name from email (before @)
      const emailName = user.email?.split('@')[0] || '';

      // Generate a base username from email or name
      let baseUsername = '';
      if (user.user_metadata?.full_name) {
        baseUsername = user.user_metadata.full_name.split(' ')[0].toLowerCase();
      } else {
        baseUsername = emailName.toLowerCase();
      }

      // Clean the username (replace special chars with _)
      baseUsername = baseUsername.replace(/[^a-z0-9]/gi, '_');

      // Try to create a unique username by adding random numbers if needed
      let username = baseUsername;
      let isUnique = false;
      let attempts = 0;

      while (!isUnique && attempts < 5) {
        // Check if username is already taken
        const { data: usernameCheck } = await supabase
          .from('users')
          .select('username')
          .eq('username', username)
          .single();

        if (!usernameCheck) {
          isUnique = true;
        } else {
          // Add random numbers to make it unique
          username = `${baseUsername}${Math.floor(Math.random() * 1000)}`;
          attempts++;
        }
      }

      // Insert or update the user record
      const { error: insertError } = await supabase.from('users').upsert({
        id: userId,
        email: user.email,
        username,
        created_at: user.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (insertError) {
        throw insertError;
      }

      return { needsProfile: true };
    }

    return { needsProfile: false };
  } catch (error) {
    console.error('Error handling Google auth:', error);
    return { error: 'Failed to process authentication' };
  }
}
