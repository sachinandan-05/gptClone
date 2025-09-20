"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider } from "@/hooks/use-sidebar";
import { useAuth } from "@clerk/nextjs";

export function Providers({ children }: { children: React.ReactNode }) {
  const { isLoaded, userId } = useAuth();

  // Show loading state while auth is being checked
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-200 dark:border-gray-600"></div>
      </div>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      {userId ? (
        <SidebarProvider>{children}</SidebarProvider>
      ) : (
        <>{children}</>
      )}
    </ThemeProvider>
  );
}
