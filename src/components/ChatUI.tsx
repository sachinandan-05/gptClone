"use client";

import { useState, useRef, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, Sidebar as SidebarIcon, Dot, Paperclip } from "lucide-react";
import Navbar from './Navbar';
import ChatInput from './ChatInput';
import { Sidebar } from './Sidebar';
import { MarkdownRenderer } from '../app/helper/MarkdownRenderer';

// Typing indicator component
const TypingIndicator = () => (
  <div className="flex space-x-1 p-2">
    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(initialInput);
  const [isNewChat, setIsNewChat] = useState(!chatId);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
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
          chatId: chatId || undefined,
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


  return (
    <div className="flex h-screen bg-[#212121]">
      <Sidebar isCollapsed={isCollapsed} onToggleCollapse={toggleSidebar} />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Navbar onToggleSidebar={toggleSidebar} isCollapsed={isCollapsed} isSidebarOpen={!isCollapsed} />
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
                how can i help you today?
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'assistant' ? 'justify-start' : 'justify-end'}
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      message.role === 'user' ? 'bg-[#303030]' : 'bg-none'
                    }`}
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
                    {message.content && <MarkdownRenderer content={message.content} />}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="">
          <div className="w-full max-w-3xl mx-auto">
            <ChatInput
              input={input}
              onInputChange={setInput}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
