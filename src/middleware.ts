// src/middleware.ts
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/profile', '/favorites'];

// Routes only for unauthenticated users
const AUTH_ROUTES = ['/login'];

export default auth((req) => {
  const { nextUrl, auth: session } = req as NextRequest & { auth: any };
  const isLoggedIn = !!session?.user;
  const path = nextUrl.pathname;

  // Redirect authenticated users away from login
  if (isLoggedIn && AUTH_ROUTES.some(r => path.startsWith(r))) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  // Redirect unauthenticated users to login
  if (!isLoggedIn && PROTECTED_ROUTES.some(r => path.startsWith(r))) {
    const loginUrl = new URL('/login', nextUrl);
    loginUrl.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all routes except static files and API auth routes
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
