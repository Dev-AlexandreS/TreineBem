import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/', '/workout', '/history', '/plan', '/goals'];
const AUTH_ROUTES = ['/login', '/signup'];

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const pathname = request.nextUrl.pathname;
  const isProtected = PROTECTED_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + '/')
  );
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  // If Supabase env vars are missing, redirect protected routes to login
  if (!supabaseUrl || !supabaseAnonKey) {
    if (isProtected) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh session (keeps JWT alive)
  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error) user = data.user;
  } catch {
    // Network error — treat as unauthenticated
  }

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
