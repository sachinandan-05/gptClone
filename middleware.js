import { NextResponse } from 'next/server';

export function middleware(request) {
  // Handle static files and API routes
  if (
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.startsWith('/static/') ||
    request.nextUrl.pathname.startsWith('/api/') ||
    request.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  // Handle client-side routing
  const url = request.nextUrl.clone();
  url.pathname = '/';
  return NextResponse.rewrite(url);
}
