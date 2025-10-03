import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "@/components/Providers";
import { Sidebar } from "@/components/Sidebar";
import { ThemeProvider } from '@/components/theme-provider';
import { ClientClerkProvider } from '@/components/ClientClerkProvider';
import ClerkErrorBoundary from '@/components/ClerkErrorBoundary';
import { cn } from '@/lib/utils';
import "./globals.css";

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
  adjustFontFallback: true
});

export const metadata: Metadata = {
  title: "ChatGPT",
  description: "A modern AI chat application",
  generator: "v0.app",
  other: {
    'cache-control': 'no-store, no-cache, must-revalidate',
  }
};

// Disable caching for this layout to prevent server action caching issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="overflow-x-hidden">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        {/* Prevent browser caching of server actions */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        {/* Let Clerk handle its own JS loading - don't preload to avoid DNS issues */}
      </head>
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased overflow-x-hidden w-full",
        inter.variable
      )}>
        <ClerkErrorBoundary>
          <ClientClerkProvider>
            {children}
          </ClientClerkProvider>
        </ClerkErrorBoundary>
      </body>
    </html>
  );
}
