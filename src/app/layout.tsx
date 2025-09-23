import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from 'next/font/google';
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "@/components/Providers";
import { Sidebar } from "@/components/Sidebar";
import { ThemeProvider } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import "./globals.css";

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  preload: false,
  adjustFontFallback: false
});

export const metadata: Metadata = {
  title: "ChatGPT",
  description: "A modern AI chat application",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning className="overflow-x-hidden">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        </head>
        <body className={cn(
          "min-h-screen bg-background font-sans antialiased overflow-x-hidden w-full",
          inter.variable
        )}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <Providers>
              <div className="flex flex-col h-screen w-screen overflow-hidden">
                {/* <Sidebar /> */}
                <div className="flex-1 overflow-y-auto w-full max-w-full">
                  {children}
                </div>
              </div>
            </Providers>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
