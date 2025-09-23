import { NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
]);

// List of static files and directories to bypass middleware
const staticPaths = [
  '/_next',
  '/static',
  '/favicon.ico',
  '/site.webmanifest',
  '/sitemap.xml',
  '/robots.txt',
];

// File extensions to bypass middleware
const staticExtensions = [
  '.js',
  '.css',
  '.json',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.webp',
  '.map',
  '.mp4',
  '.webm',
  '.ogg',
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx'
];

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  // Skip middleware for static files and API routes
  if (
    staticPaths.some(path => pathname.startsWith(path)) ||
    staticExtensions.some(ext => pathname.endsWith(ext)) ||
    pathname.startsWith('/api/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Handle public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Handle authenticated routes
  const { userId } = await auth();
  if (!userId) {
    // Redirect to sign-in for unauthenticated users
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip all internal paths and static files
    '/((?!_next/static|_next/image|favicon.ico|static/|api/|.*\..*$).*)',
  ],
};
