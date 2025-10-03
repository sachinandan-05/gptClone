"use client";

import ChatUI from '@/components/ChatUI';
import { Message } from '@/types/chat';
import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';

interface ClientChatPageProps {
  chatId: string;
  initialMessages?: Message[];
  error?: string;
}

export default function ClientChatPage({ chatId, initialMessages = [], error }: ClientChatPageProps) {
  const [mounted, setMounted] = useState(false);
  const { isLoaded } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Chat</h1>
        <p className="text-gray-600">{error}</p>
        <Link 
          href="/" 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return <ChatUI initialMessages={initialMessages} chatId={chatId} />;
}