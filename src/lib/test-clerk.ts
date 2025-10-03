// Simple test script to verify Clerk configuration
// Run this in the browser console to check Clerk status

console.log('🔐 Clerk Configuration Test');
console.log('Environment:', {
  publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'Set' : 'Missing',
  signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || '/sign-in',
  signUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || '/sign-up'
});

if (typeof window !== 'undefined') {
  console.log('Clerk Status:', {
    clerkExists: !!(window as any).Clerk,
    clerkLoaded: !!(window as any).Clerk?.loaded,
    version: (window as any).Clerk?.version
  });

  // Wait a bit and check again
  setTimeout(() => {
    console.log('Clerk Status (after 5s):', {
      clerkExists: !!(window as any).Clerk,
      clerkLoaded: !!(window as any).Clerk?.loaded,
      version: (window as any).Clerk?.version
    });
  }, 5000);
}