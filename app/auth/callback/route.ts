// app/auth/callback/route.ts
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type');
  const origin = requestUrl.origin;

  console.log('Auth callback received with type:', type);

  if (!code) {
    console.warn('No auth code provided');
    return NextResponse.redirect(
      `${origin}/forgot-password?error=Missing+authorization+code`
    );
  }

  const supabase = await createClient();

  try {
    // Log for debugging the timestamp issue
    console.log('Processing auth callback at time:', new Date().toISOString());

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth callback error:', error.message);
      return NextResponse.redirect(
        `${origin}/forgot-password?error=${encodeURIComponent(error.message)}`
      );
    }

    // For password reset (recovery) flow
    if (type === 'recovery') {
      return NextResponse.redirect(`${origin}/auth/reset-password`);
    }

    // Check if user has a username (for OAuth users like Google sign-in)
    if (data.session) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('username')
        .eq('id', data.session.user.id)
        .single();

      // If no username, redirect to username setup
      if (!userData?.username || userError) {
        return NextResponse.redirect(`${origin}/profile/setup`);
      }
    }

    // Otherwise go to protected page
    return NextResponse.redirect(`${origin}/protected`);
  } catch (err: any) {
    console.error('Unexpected error in auth callback:', err);
    return NextResponse.redirect(
      `${origin}/forgot-password?error=${encodeURIComponent(err.message || 'An unexpected error occurred')}`
    );
  }
}
