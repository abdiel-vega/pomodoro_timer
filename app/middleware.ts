import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  // Create a Supabase client for auth verification
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          // This is a read-only operation in middleware
        },
        remove(name, options) {
          // This is a read-only operation in middleware
        },
      },
    }
  );

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
