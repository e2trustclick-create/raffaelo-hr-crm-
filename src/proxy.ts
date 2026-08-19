import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const PUBLIC_ROUTES = ['/login'];

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isPublicRoute = PUBLIC_ROUTES.includes(req.nextUrl.pathname);

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  if (isLoggedIn && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|assets|favicon.ico).*)'],
};
