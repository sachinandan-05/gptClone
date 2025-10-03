"use client";

import dynamic from 'next/dynamic';

// Dynamically import the client component to avoid SSR issues
const ClientHome = dynamic(() => import('@/components/ClientHome'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  )
});

export default function Home() {
  return <ClientHome />;
}