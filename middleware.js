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

// List of file extensions to handle as static files
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

  // Add security headers to all responses
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Cache control for static assets
  if (staticExtensions.some(ext => pathname.endsWith(ext))) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  
  return response;
});

// Only run middleware on specific paths
export const config = {
  matcher: [
    // Skip all internal paths and static files
    '/((?!_next/static|_next/image|favicon.ico|static/|api/|.*\..*$).*)',
  ],
};
