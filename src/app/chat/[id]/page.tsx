import ChatUI, { Message } from '@/components/ChatUI';
import { getChatById, getMessagesByChatId } from '@/lib/mongodb';
import { notFound } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { IMessage } from '@/models/message';
import Link from 'next/link';

interface ChatPageProps {
  params: { id: string };
  searchParams: { guestId?: string };
}

export const dynamic = 'force-dynamic';

export default async function ChatPage({ params, searchParams }: ChatPageProps) {
  try {
    // Ensure params is fully resolved before destructuring
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    if (id === 'new') {
      return <ChatUI initialMessages={[]} />;
    }

    const user = await currentUser();
    const isGuest = !user;
    const guestId = searchParams.guestId;

    // Get chat and verify ownership
    const chat = await getChatById(id);
    if (!chat) {
      notFound();
    }

    // Verify ownership - either userId matches or guestId matches
    const isOwner = isGuest 
      ? chat.guestId === guestId
      : (chat.userId && user?.id && chat.userId === user.id);

    if (!isOwner) {
      notFound();
    }
    
    // Get messages with appropriate user/guest context
    console.log(`Fetching messages for chat ${id} (${isGuest ? 'guest' : 'user'}: ${isGuest ? guestId : user.id})`);
    const messages = await getMessagesByChatId(id, isGuest ? undefined : user.id, guestId);
    
    if (!messages || messages.length === 0) {
      console.log('No messages found for chat:', id);
      return <ChatUI initialMessages={[]} chatId={id} />;
    }
    
    console.log(`Found ${messages.length} messages for chat ${id}`);
    
    // Convert to Message[] format expected by ChatUI
    const initialMessages: Message[] = messages
      .filter((msg: IMessage) => msg.content && msg.role) // Filter out invalid messages
      .map((msg: IMessage) => {
        // Normalize role to ensure it's either 'assistant' or 'user'
        const role = msg.role?.toLowerCase() === 'assistant' ? 'assistant' as const : 'user' as const;
        return {
          id: msg._id?.toString() || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          content: msg.content || '',
          role,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
        };
      });
    
    console.log('Processed messages:', initialMessages);
    return <ChatUI initialMessages={initialMessages} chatId={id} />;
    
  } catch (error) {
    console.error('Error in ChatPage:', error);
    // Show error state to user
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Chat</h1>
        <p className="text-gray-600">
          {error instanceof Error ? error.message : 'An unexpected error occurred'}
        </p>
        <Link 
          href="/" 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    );
  }
}
