"use client"

import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Import the Message type from ChatUI
import type { Message } from '@/components/ChatUI';

// Dynamically import components to ensure proper client-side rendering
const UIwoAuth = dynamic(() => import('@/components/UIwoAuth'), { ssr: false });
const ChatUI = dynamic(() => import('@/components/ChatUI'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  )
});

const initialMessages: Message[] = [
  {
    id: "1",
    content: "Hello! How can I assist you today?",
    role: "assistant",
    timestamp: new Date(),
  },
];

export default function Home() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();

  // Show loading state while auth is being checked
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If not signed in, show the auth UI
  if (!userId) {
    return <UIwoAuth />;
  }
  console.log(userId , "User is signed in");

  // If signed in, show the chat UI
  return (
    <div className='w-full h-full flex flex-col overflow-hidden'>
      <ChatUI initialMessages={initialMessages} />
    </div>
  );
}