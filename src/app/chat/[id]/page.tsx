import ChatUI, { Message } from '@/components/ChatUI';
import { getChatById, ChatMessage } from '@/lib/mongodb';
import { notFound } from 'next/navigation';

interface ChatPageProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export const dynamic = 'force-dynamic';

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = params;
  let initialMessages: Message[] = [];
  
  try {
    if (id !== 'new') {
      const chat = await getChatById(id);
      if (chat) {
        // Convert ChatMessage[] to Message[]
        initialMessages = chat.messages.map((msg, index) => ({
          id: `${id}-${index}`,
          content: msg.content,
          role: msg.role === 'assistant' ? 'assistant' as const : 'user' as const,
          timestamp: new Date()
        }));
      } else {
        notFound();
      }
    }
  } catch (error) {
    console.error('Error loading chat:', error);
    // Continue with empty messages if there's an error
  }

  return <ChatUI initialMessages={initialMessages} chatId={id === 'new' ? undefined : id} />;
}