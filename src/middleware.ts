import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

const PROTECTED_ROUTES = ['/dashboard', '/profile', '/favorites'];
const AUTH_ROUTES = ['/login'];

export default auth((req) => {
  const isLoggedIn = !!req.auth?.user;
  const path = req.nextUrl.pathname;

  if (isLoggedIn && AUTH_ROUTES.some(r => path.startsWith(r))) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }

  if (!isLoggedIn && PROTECTED_ROUTES.some(r => path.startsWith(r))) {
    const loginUrl = new URL('/login', req.nextUrl);
    loginUrl.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
