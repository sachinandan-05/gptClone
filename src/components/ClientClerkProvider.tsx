"use client";

import { ClerkProvider } from "@clerk/nextjs";

interface ClientClerkProviderProps {
  children: React.ReactNode;
}

export function ClientClerkProvider({ children }: ClientClerkProviderProps) {
  // Check if Clerk environment variables are configured
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    console.error('🔐 NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not configured');
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-6">
          <div className="text-red-500 mb-4">⚠️ Configuration Error</div>
          <p className="text-gray-600">Authentication service is not properly configured.</p>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      afterSignOutUrl="/"
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: "#000000",
        },
      }}
      telemetry={false}
    >
      {children}
    </ClerkProvider>
  );
}