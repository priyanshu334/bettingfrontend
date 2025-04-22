import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  const isAuthenticated = !!token;
  const { pathname } = req.nextUrl;

  // Redirect unauthenticated users to /login (except already on /login)
  if (!isAuthenticated && pathname !== '/login') {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login
  if (isAuthenticated && pathname === '/login') {
    const homeUrl = req.nextUrl.clone();
    homeUrl.pathname = '/';
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}
