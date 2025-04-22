import { getServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const supabase = await getServerSupabaseClient();

  // Get the URL for the Google OAuth sign-in
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${requestUrl.origin}/auth/callback`,
    },
  });

  if (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(
      `${requestUrl.origin}/sign-in?error=${encodeURIComponent(error.message)}`,
      {
        status: 301,
      }
    );
  }

  if (!data.url) {
    console.error('No OAuth URL returned');
    return NextResponse.redirect(
      `${requestUrl.origin}/sign-in?error=Failed to initialize Google sign in`,
      {
        status: 301,
      }
    );
  }

  return NextResponse.redirect(data.url, {
    status: 301,
  });
}
