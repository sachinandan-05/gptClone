import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/test-auth',
  '/api/auth(.*)'  // Allow Clerk auth routes
]);

export default clerkMiddleware((auth, req) => {
  const url = new URL(req.url);
  
  // Allow Clerk server actions (they have specific headers)
  const isClerkAction = req.headers.get('next-action') !== null;
  
  // Block accidental POST to non-API routes (old server action submissions)
  // but allow Clerk's internal server actions
  if (req.method === 'POST' && !url.pathname.startsWith('/api/') && !isClerkAction) {
    return NextResponse.json(
      {
        error: 'METHOD_NOT_ALLOWED',
        message: `POST to ${url.pathname} is not supported. Use /api/chat instead.`,
        hint: 'Clear your browser cache (Cmd+Shift+Delete) and hard refresh (Cmd+Shift+R)'
      },
      {
        status: 405,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }

  if (!isPublicRoute(req)) {
    auth.protect();
  }
  
  // Add no-cache headers to all responses to prevent stale action references
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};