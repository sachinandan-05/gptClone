import { NextResponse } from 'next/server';

// List of file extensions to handle as static files
const staticExtensions = [
  // Image formats
  'jpg', 'jpeg', 'png', 'gif', 'ico', 'svg', 'webp',
  // Font formats
  'woff', 'woff2', 'ttf', 'eot',
  // Other static assets
  'css', 'js', 'map', 'json', 'txt', 'xml',
  // Video formats
  'mp4', 'webm', 'ogg',
  // Document formats
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'
];

// List of paths to exclude from middleware
const excludedPaths = [
  '/_next',
  '/static',
  '/api',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml'
];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and API routes
  if (
    excludedPaths.some(path => pathname.startsWith(path)) ||
    staticExtensions.some(ext => pathname.endsWith(`.${ext}`))
  ) {
    return NextResponse.next();
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
  if (staticExtensions.some(ext => pathname.endsWith(`.${ext}`))) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  
  return response;
}

// Only run middleware on specific paths
export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - static (static files)
    '/((?!api|_next/static|_next/image|favicon.ico|static).*)',
  ],
};
