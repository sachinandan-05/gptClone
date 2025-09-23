"use client";

import { useState, useRef, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, Sidebar as SidebarIcon, Dot, Paperclip,  Loader, Copy, SquarePen, Send } from "lucide-react";
import Navbar from './Navbar';
import ChatInput from './ChatInput';
import { Sidebar} from './Sidebar';
import { MarkdownRenderer } from '../app/helper/MarkdownRenderer';

// Typing indicator component with smooth animation
const TypingIndicator = () => (
  <div className="flex items-center space-x-1 p-2">
    <div className="w-2 h-2 rounded-full bg-gray-400" style={{
      animation: 'bounce 1.4s infinite ease-in-out',
      animationDelay: '0s'
    }} />
    <div className="w-2 h-2 rounded-full bg-gray-400" style={{
      animation: 'bounce 1.4s infinite ease-in-out',
      animationDelay: '0.2s'
    }} />
    <div className="w-2 h-2 rounded-full bg-gray-400" style={{
      animation: 'bounce 1.4s infinite ease-in-out',
      animationDelay: '0.4s'
    }} />
    <style jsx>{`
      @keyframes bounce {
        0%, 60%, 100% { transform: translateY(0); }
        30% { transform: translateY(-6px); }
      }
    `}</style>
  </div>
);

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  fileUrl?: string;
  fileType?: 'image' | 'document' | 'video' | 'audio' | 'other';
}

interface ChatUIProps {
  initialMessages?: Message[];
  chatId?: string;
  initialInput?: string;
  onNewChatCreated?: (chatId: string) => void;
  onSendMessage?: (content: string, fileUrl?: string, fileType?: 'image' | 'document' | 'video' | 'audio' | 'other') => void;
}

export default function ChatUI({ initialMessages = [], chatId, initialInput = '', onNewChatCreated }: ChatUIProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState(initialInput);
  const [isNewChat, setIsNewChat] = useState(!chatId);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(chatId || null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");

  const toggleSidebarCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    // Reset any other chat-related state here
    if (onNewChatCreated) {
      onNewChatCreated('');
    }
  };

  const handleSendMessage = async (content: string, fileUrl?: string, fileType?: string) => {
    // Update the input with the content and submit
    setInput(content);
    await handleSubmit(undefined, fileUrl, fileType as 'image' | 'document' | 'video' | 'audio' | 'other' | undefined);
  };
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load initial messages
  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listen for delete-current-chat from navbar menu
  useEffect(() => {
    const handler = async () => {
      if (!currentChatId) return;
      try {
        await fetch(`/api/chat/${currentChatId}`, { method: 'DELETE' });
        // Reset UI after delete
        setMessages([]);
        setCurrentChatId(null);
        setIsNewChat(true);
        // Navigate to home/new chat
        if (typeof window !== 'undefined') {
          window.history.pushState({}, '', '/');
        }
      } catch (e) {
        console.error('Failed to delete chat', e);
      }
    };
    // @ts-ignore CustomEvent
    window.addEventListener('delete-current-chat', handler as any);
    return () => {
      // @ts-ignore CustomEvent
      window.removeEventListener('delete-current-chat', handler as any);
    };
  }, [currentChatId]);

  // Treat a default assistant greeting as empty state so the centered input shows
  const isAssistantGreeting = (m: Message) => {
    const text = (m.content || '').trim();
    return (
      m.role === 'assistant' && /hello!\s*how can i assist you today\?/i.test(text)
    );
  };

  const isEmptyLike = messages.length === 0 || (messages.length === 1 && isAssistantGreeting(messages[0]));
  const visibleMessages = isEmptyLike ? [] : messages;

  const handleSubmit = async (e?: React.FormEvent, fileUrl?: string, fileType?: 'image' | 'document' | 'video' | 'audio' | 'other') => {
    e?.preventDefault?.();
    if ((!input.trim() && !fileUrl) || isLoading) return;

    // If there's no text input but there is a file, use a default message
    const messageContent = input.trim() || (fileType === 'image' ? '[Image]' : '[File]');

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: messageContent,
      role: 'user',
      timestamp: new Date(),
      ...(fileUrl && fileType && { fileUrl, fileType })
    };

    // Update local state immediately with user message
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");

    // Add loading state for the assistant's response
    setIsLoading(true);

    // Add placeholder for assistant's response
    const assistantPlaceholder: Message = {
      id: `assistant-${Date.now()}`,
      content: '',
      role: 'assistant',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantPlaceholder]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          messages: updatedMessages,
          chatId: currentChatId || undefined,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to send message');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let chatIdFromResponse: string | null = null;

      try {
        // Process the stream
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n\n').filter(line => line.trim() !== '');

          for (const line of lines) {
            if (line === 'data: [DONE]') continue;

            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.substring(6));

                // Handle chat ID if it's a new chat
                if (data.chatId) {
                  chatIdFromResponse = data.chatId;
                  setCurrentChatId(data.chatId);
                  if (isNewChat) {
                    window.history.replaceState({}, '', `/chat/${data.chatId}`);
                    setIsNewChat(false);
                    onNewChatCreated?.(data.chatId);
                  }
                  continue;
                }

                // Handle message chunks
                if (data.choices?.[0]?.delta?.content) {
                  const content = data.choices[0].delta.content;
                  assistantContent += content;

                  // Update the assistant's message with the new content
                  setMessages(prev =>
                    prev.map(msg =>
                      msg.id === assistantPlaceholder.id
                        ? { ...msg, content: assistantContent }
                        : msg
                    )
                  );
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      // Final update to the assistant's message with the complete content
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantPlaceholder.id
            ? {
              ...msg,
              id: `msg-${Date.now()}`,
              content: assistantContent,
            }
            : msg
        )
      );

    } catch (error) {
      console.error('Error sending message:', error);
      // Remove the loading message and show error
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== assistantPlaceholder.id);
        return [
          ...filtered,
          {
            id: `error-${Date.now()}`,
            content: "Sorry, there was an error processing your message. Please try again.",
            role: "assistant" as const,
            timestamp: new Date(),
          }
        ];
      });
    } finally {
      // Always reset loading state
      setIsLoading(false);
    }
  };

  // Edit + Regenerate handlers
  const startEdit = (m: Message) => {
    if (m.role !== 'user') return;
    setEditingId(m.id);
    setEditingText(m.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };

  const saveEditAndRegenerate = async (messageId: string) => {
    const idx = messages.findIndex(m => m.id === messageId);
    if (idx === -1) return;

    const updatedUser: Message = { ...messages[idx], content: editingText };
    const trimmed = [...messages.slice(0, idx), updatedUser];
    setMessages(trimmed);
    setEditingId(null);
    setEditingText("");

    setIsLoading(true);

    const assistantPlaceholder: Message = {
      id: `assistant-${Date.now()}`,
      content: '',
      role: 'assistant',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, assistantPlaceholder]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
        body: JSON.stringify({
          messages: trimmed.map(m => ({ role: m.role, content: m.content })),
          chatId: currentChatId || undefined,
          stream: true,
          regenerateFromIndex: idx,
          editedContent: updatedUser.content,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to regenerate');
      }
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n\n').filter(line => line.trim() !== '');
          for (const line of lines) {
            if (line === 'data: [DONE]') continue;
            if (!line.startsWith('data: ')) continue;
            try {
              const data = JSON.parse(line.substring(6));
              if (data.chatId) { setCurrentChatId(data.chatId); continue; }
              if (data.choices?.[0]?.delta?.content) {
                const content = data.choices[0].delta.content;
                assistantContent += content;
                setMessages(prev => prev.map(msg => msg.id === assistantPlaceholder.id ? { ...msg, content: assistantContent } : msg));
              }
            } catch {}
          }
        }
      } finally {
        reader.releaseLock();
      }

      setMessages(prev => prev.map(msg => msg.id === assistantPlaceholder.id ? { ...msg, id: `msg-${Date.now()}`, content: assistantContent } : msg));
    } catch (err) {
      console.error('Regenerate failed:', err);
      setMessages(prev => prev.filter(m => m.id !== assistantPlaceholder.id));
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div 
      className="flex h-screen bg-[#212121] min-w-0 overflow-x-hidden"
      style={{
        fontFamily: 'ui-sans-serif, -apple-system, system-ui, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"',
        fontSize: '16px',
        fontWeight: 400,
        lineHeight: '28px',
        color: 'rgb(255, 255, 255)'
      }}
    >
      {showSidebar && (
        <div className="fixed inset-0 z-1 w-[259px] ">
          <Sidebar
            isCollapsed={isCollapsed}
            onToggleCollapse={toggleSidebarCollapse}
            onClose={() => setShowSidebar(false)}
            onNewChat={handleNewChat}
          />
        </div>
      )}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <Navbar 
          isCollapsed={isCollapsed}
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
        />
        <div className="flex-1 w-full overflow-hidden">
        <ScrollArea className="h-full w-full">
          <div className="max-w-3xl mx-auto w-full min-w-0 px-4 sm:px-6 py-6 space-y-6">
            {isEmptyLike ? (
              <div className="flex flex-col items-center justify-center h-[65vh] text-center px-4">
                <h1 className="mb-6 text-3xl sm:text-4xl font-semibold text-white">What's on the agenda today?</h1>
                <div className="w-full max-w-4xl">
                  <ChatInput
                    input={input}
                    onInputChange={setInput}
                    onSendMessage={handleSendMessage}
                    isLoading={isLoading}
                    variant="heroSingle"
                  />
                </div>
              </div>
            ) : (
              <>
                {visibleMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`group relative max-w-[calc(100%-2rem)] sm:max-w-[80%] rounded-lg px-4 py-1 ${message.role === 'user' ? 'bg-[#303030]' : 'bg-none'}`}
                    >
                      {message.fileUrl && message.fileType === 'image' && (
                        <div className="mb-2">
                          <img
                            src={message.fileUrl}
                            alt="Uploaded content"
                            className="max-h-60 max-w-full rounded-md object-contain"
                          />
                        </div>
                      )}
                      {message.fileUrl && message.fileType === 'document' && (
                        <div className="mb-2 p-2 bg-white/10 rounded-md">
                          <a
                            href={message.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-300 hover:underline flex items-center"
                          >
                            <Paperclip className="w-4 h-4 mr-1" />
                            View Document
                          </a>
                        </div>
                      )}
                      {editingId === message.id ? (
                        <div className="mt-2 space-y-2">
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="w-full bg-[#2b2b2b] text-white rounded-md p-2"
                            rows={3}
                          />
                          <div className="flex items-center gap-3 text-sm">
                            <button
                              onClick={() => saveEditAndRegenerate(message.id)}
                              className="p-1.5 rounded-md bg-white text-black"
                              aria-label="Send"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                            <button onClick={cancelEdit} className="px-3 py-1 border border-gray-600 rounded-md">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          {message.content && <MarkdownRenderer content={message.content} />}
                          
                          {/* Hover UI positioned below the message bubble */}
                          {message.role === 'user' && (
                            <div className="absolute -bottom-10 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => navigator.clipboard.writeText(message.content)}
                                  className="p-2 rounded-lg bg-[#424242] hover:bg-[#525252] transition-colors cursor-pointer"
                                  aria-label="Copy message"
                                  title="Copy"
                                >
                                  <Copy className="w-4 h-4 text-white" />
                                </button>
                                <button
                                  onClick={() => startEdit(message)}
                                  className="p-2 rounded-lg bg-[#424242] hover:bg-[#525252] transition-colors cursor-pointer"
                                  aria-label="Edit message"
                                  title="Edit message"
                                >
                                  <SquarePen className="w-4 h-4 text-white" />
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {/* For assistant messages, keep the simple inline style */}
                          {message.role === 'assistant' && (
                            <div className="mt-1 flex gap-3 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => navigator.clipboard.writeText(message.content)}
                                className="flex items-center gap-1 hover:text-white"
                                aria-label="Copy message"
                                title="Copy"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[calc(100%-2rem)] sm:max-w-[80%] rounded-lg px-4 py-1">
                      <TypingIndicator />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </ScrollArea>
        </div>

        {!isEmptyLike && (
          <div className="w-full">
            <div className="w-full max-w-3xl mx-auto px-4 sm:px-6">
              <ChatInput
                input={input}
                onInputChange={setInput}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}