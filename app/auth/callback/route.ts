// app/auth/callback/route.ts
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Get the URL and parameters
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;
  const type = requestUrl.searchParams.get('type');

  // Create Supabase client
  const supabase = await createClient();

  // Handle different auth callback types
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth callback error:', error.message);
      // Redirect to sign-in with error message
      return NextResponse.redirect(
        `${origin}/sign-in?error=${encodeURIComponent(error.message)}`
      );
    }

    // For password recovery specifically, always redirect to reset password page
    if (type === 'recovery') {
      return NextResponse.redirect(`${origin}/protected/reset-password`);
    }

    // For other successful auth flows, redirect to protected area
    return NextResponse.redirect(`${origin}/protected`);
  }

  // If no code is present, redirect to homepage
  return NextResponse.redirect(`${origin}`);
}
