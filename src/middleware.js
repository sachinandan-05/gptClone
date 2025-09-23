import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhook(.*)',
  '/api/trpc(.*)',
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

  // In development, bypass middleware to avoid edge header mutation issues
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  // Always allow static assets
  if (pathname.startsWith('/_next') || pathname.startsWith('/static')) {
    return NextResponse.next();
  }

  // Allow access to public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }
  
  const { userId } = await auth();

  // For API routes: do NOT redirect when unauthenticated (guests allowed), but let Clerk run
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // For app routes: require authentication
  if (!userId) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Run on API and non-static app routes (skip _next, static, and file assets)
    '/((?!_next/static|_next/image|favicon.ico|static/|.*\.(?:svg|png|jpg|jpeg|gif|webp|ttf|woff|woff2|css|js)$).*)',
    '/(api|trpc)(.*)'
  ],
};
