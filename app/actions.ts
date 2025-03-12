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

  if (!email) {
    return encodedRedirect('error', '/forgot-password', 'Email is required');
  }

  try {
    // Use a longer expiration time for the reset link and set the correct type
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback`,
      // Don't include query parameters here - they might be causing issues
    });

    if (error) {
      console.error('Password reset error:', error.message);
      return encodedRedirect(
        'error',
        '/forgot-password',
        'Could not reset password: ' + error.message
      );
    }

    return encodedRedirect(
      'success',
      '/forgot-password',
      'Check your email for a password reset link. The link will be valid for 1 hour.'
    );
  } catch (err: any) {
    console.error('Exception in password reset:', err);
    return encodedRedirect(
      'error',
      '/forgot-password',
      'An unexpected error occurred: ' + err.message
    );
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
