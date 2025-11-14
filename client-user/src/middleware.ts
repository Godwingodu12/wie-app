import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/signup', '/verify-otp', '/auth/google/callback'];
  
  // Check if the current route is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // If route is protected and no token, redirect to login
  if (!isPublicRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is authenticated and tries to access auth pages, redirect to home
  if (token && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};