import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhook(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  // If the route is public, allow access
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }
  
  // Otherwise, check if user is authenticated
  const session = await auth();
  if (!session.userId) {
    // Redirect to sign-in page if not authenticated
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }
  
  return NextResponse.next();
}, {
  debug: process.env.NODE_ENV === 'development',
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
