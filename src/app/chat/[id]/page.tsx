import ClientChatPage from '@/components/ClientChatPage';

interface ChatPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ guestId?: string }>;
}

export const dynamic = 'force-dynamic';

export default async function ChatPage({ params, searchParams }: ChatPageProps) {
  // Next.js 15+ requires awaiting params and searchParams
  const { id } = await params;
  const { guestId } = await searchParams;

  if (id === 'new') {
    return <ClientChatPage chatId={id} initialMessages={[]} />;
  }

  // Let ClientChatPage handle client-side fetching
  return <ClientChatPage chatId={id} initialMessages={[]} />;
}
