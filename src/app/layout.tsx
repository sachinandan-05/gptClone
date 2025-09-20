import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "@/components/Providers";
import { Sidebar } from "@/components/Sidebar";
import "./globals.css";

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
      <html
        lang="en"
        className="font-sans"
        suppressHydrationWarning
      >
        <body className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100" suppressHydrationWarning>
          <Providers>
            <div className="flex h-screen">
              {/* <Sidebar /> */}
              <main className="flex-1 overflow-y-auto">
                {children}
              </main>
            </div>
            <Analytics />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
