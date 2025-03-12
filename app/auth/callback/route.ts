import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (!code) {
    // If there's no code, redirect to the main reset password page
    // This way we can still handle the hash fragment error
    return NextResponse.redirect(`${origin}/reset-password`);
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth callback error:', error.message);

      // If the error contains OTP expired, redirect to reset-password page to handle it
      if (error.message.includes('expired')) {
        return NextResponse.redirect(
          `${origin}/reset-password#error=access_denied&error_code=otp_expired&error_description=${encodeURIComponent(error.message)}`
        );
      }

      // For other errors, go to sign-in
      return NextResponse.redirect(
        `${origin}/sign-in?error=${encodeURIComponent(error.message)}`
      );
    }

    // Successfully exchanged code for session, now check what type of auth flow this is
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // If this is a password reset (no session.user.email_confirmed_at or recent confirmation)
    // Check the user's metadata or email_confirmed_at timestamp if available
    if (
      session &&
      (!session.user.email_confirmed_at ||
        new Date(session.user.email_confirmed_at).getTime() >
          Date.now() - 5 * 60 * 1000)
    ) {
      // This is likely a recent confirmation or password reset
      return NextResponse.redirect(`${origin}/reset-password`);
    }

    // Otherwise just go to the protected area
    return NextResponse.redirect(`${origin}/protected`);
  } catch (err) {
    console.error('Unexpected error in auth callback:', err);
    return NextResponse.redirect(
      `${origin}/sign-in?error=An unexpected error occurred`
    );
  }
}
