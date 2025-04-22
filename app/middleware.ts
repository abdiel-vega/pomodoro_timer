import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase-server';

export async function middleware(request: NextRequest) {
  // Create a Supabase client for auth verification
  const supabase = await getServerSupabaseClient();

  // Verify session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Check if the route requires auth
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith('/protected') ||
    request.nextUrl.pathname.startsWith('/settings') ||
    request.nextUrl.pathname.startsWith('/profile') ||
    request.nextUrl.pathname.startsWith('/premium');

  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/sign-in', request.url);
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

// Specify which routes use this middleware
export const config = {
  matcher: [
    '/protected/:path*',
    '/settings/:path*',
    '/profile/:path*',
    '/premium/:path*',
    '/friends/:path*',
  ],
};
