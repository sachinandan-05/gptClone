"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sidebar as SidebarIcon, Dot, Check,Paperclip,  Loader, Copy, Send } from "lucide-react";
import { GoPencil } from "react-icons/go";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Navbar from './Navbar';
import ChatInput from './ChatInput';
import { Sidebar} from './Sidebar';
import { MarkdownRenderer } from '../app/helper/MarkdownRenderer';
import { Message } from '@/types/chat';

// Re-export Message type for compatibility
export type { Message };

// Typing indicator component with smooth fade in-out animation
const TypingIndicator = () => (
  <div className="flex items-center space-x-1 py-3">
    <div className="relative w-8 h-8 flex items-center justify-center">
      {/* Single white dot with fade in-out */}
      <div 
        className="w-3 h-3 rounded-full bg-white"
        style={{
          animation: 'fade-in-out 1.4s ease-in-out infinite'
        }}
      />
    </div>

    <style>{`
      @keyframes fade-in-out {
        0%, 100% {
          opacity: 0.3;
        }
        50% {
          opacity: 1;
        }
      }
    `}</style>
  </div>
);



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
  
  // Custom function to open sidebar and ensure it's expanded on mobile
  const handleShowSidebar = (show: boolean) => {
    setShowSidebar(show);
    // On mobile, always show expanded sidebar
    if (show && window.innerWidth < 1024) {
      setIsCollapsed(false);
    }
  };
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(chatId || null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  // Load messages when chatId changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!chatId) return;
      
      try {
        const response = await fetch(`/api/chat/${chatId}`);
        if (!response.ok) {
          console.error('Failed to fetch messages');
          return;
        }
        
        const data = await response.json();
        if (data.messages && Array.isArray(data.messages)) {
          setMessages(data.messages);
          setCurrentChatId(chatId);
          setIsNewChat(false);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    loadMessages();
  }, [chatId]);

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
    <TooltipProvider>
    <div 
      className="flex flex-col lg:flex-row h-screen bg-[#212121] w-full overflow-hidden"
      style={{
        fontFamily: 'ui-sans-serif, -apple-system, system-ui, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"',
        fontSize: '16px',
        fontWeight: 400,
        lineHeight: '28px',
        color: 'rgb(255, 255, 255)'
      }}
    >
      {/* Sidebar - Desktop persistent, Mobile overlay */}
      {showSidebar && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setShowSidebar(false)} />
      )}
      <div className={`${showSidebar ? 'fixed lg:relative' : 'hidden lg:block'} inset-0 lg:inset-auto z-50 lg:z-auto`}>
        <Sidebar
          key={isCollapsed ? 'collapsed' : 'expanded'}
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
          onClose={() => setShowSidebar(false)}
          onNewChat={handleNewChat}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full w-full overflow-hidden">
        <Navbar 
          isCollapsed={isCollapsed}
          showSidebar={showSidebar}
          setShowSidebar={handleShowSidebar}
        />
        <div className="flex-1 w-full overflow-hidden">
        <ScrollArea className="h-full w-full custom-scrollbar">
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
              <div className="flex flex-col h-full w-full space-y-4" >
                {visibleMessages.map((message, index) => (
                  <div 
                    key={message.id || `message-${index}-${Date.now()}`}
                    className={`group flex flex-col w-full ${message.role === 'assistant' ? 'items-start' : 'items-end '}`}
                  >
                    <div
                      className={`relative max-w-[calc(100%-2rem)] sm:max-w-[80%] rounded-lg px-4 break-words overflow-x-hidden ${
                        message.role === 'user' ? 'bg-[#303030] pt-1' : 'bg-none '
                      } ${message.role === 'user' ? 'shadow-[0_8px_30px_rgba(0,0,0,0.2)]' : ''}`}
                    >
                      {message.fileUrl && message.fileType === 'image' && (
                        <div key={`image-${message.id}`} className="mb-2">
                          <img
                            src={message.fileUrl}
                            alt="Uploaded content"
                            className="max-h-60 max-w-full rounded-md object-contain"
                          />
                        </div>
                      )}
                      {message.fileUrl && message.fileType === 'document' && (
                        <div key={`doc-${message.id}`} className="mb-2 p-2 bg-white/10 rounded-md">
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
                        <div className="w-full max-w-[850px] bg-[#2a2a2a] p-4 rounded-lg space-y-3 bg-[#303030]">
                          <div className="relative bg-[#303030]">
                          <textarea
                  value={editingText}
                  onChange={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 500)}px`;
                    setEditingText(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      saveEditAndRegenerate(message.id);
                    }
                  }}
                  className="text-white p-4 resize overflow-y-auto border-0 focus:outline-none bg-[#303030] h-[300px] w-[520px] "
                  style={{ maxHeight: '500px' }}
                  placeholder="Ask anything..."
                  autoFocus
                />

                          </div>
                          <div className="flex justify-end items-center gap-2">
                            <Button 
                              variant="outline" 
                              onClick={cancelEdit} 
                              className="h-9 px-4 py-2 text-sm font-medium text-white hover:bg-[#3a3a3a] border-[#4a4a4a] bg-transparent hover:border-[#5a5a5a] transition-colors rounded-full hover:cursor-pointer"
                            >
                              Cancel
                            </Button>
                            <Button 
                              onClick={() => saveEditAndRegenerate(message.id)}
                              className="h-9 px-4 py-2 text-sm font-medium bg-white  text-black rounded-full transition-colors flex items-center gap-1.5  hover:cursor-pointer"
                              disabled={!editingText.trim()}
                            >
                            
                              Send
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <MarkdownRenderer content={message.content} />
                      )}
                    </div>
                    
                    {/* Action buttons outside the bubble */}
                    <div className={`flex gap-2 mt-1 ${message.role === 'assistant' ? 'justify-start' : 'justify-end' }`}>
                      {message.role === 'user' ? (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                key={`copy-${message.id}`}
                                onClick={() => {
                                  navigator.clipboard.writeText(message.content);
                                  setCopiedId(message.id);
                                  setTimeout(() => setCopiedId(null), 2000);
                                }}
                                className="p-2 rounded-lg hover:bg-[#303030] transition-colors cursor-pointer opacity-0 group-hover:opacity-100 z-10"
                                aria-label="Copy message"
                              >
                                {copiedId === message.id ? (
                                  <Check className="w-4 h-4 text-white" />
                                ) : (
                                  <Copy className="w-4 h-4 text-white" />
                                )}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              <p>{copiedId === message.id ? 'Copied!' : 'Copy'}</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                key={`edit-${message.id}`}
                                onClick={() => startEdit(message)}
                                className="p-2 rounded-lg hover:bg-[#303030] transition-colors cursor-pointer opacity-0 group-hover:opacity-100 z-10"
                                aria-label="Edit message"
                              >
                                <GoPencil className="w-4 h-4 text-white" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              <p>Edit message</p>
                            </TooltipContent>
                          </Tooltip>
                        </>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              key={`copy-${message.id}`}
                              onClick={() => {
                                navigator.clipboard.writeText(message.content);
                                setCopiedId(message.id);
                                setTimeout(() => setCopiedId(null), 2000);
                              }}
                              className="p-2 rounded-lg hover:bg-[#303030] transition-colors cursor-pointer opacity-0 group-hover:opacity-100 z-10"
                              aria-label="Copy message"
                            >
                              {copiedId === message.id ? (
                                <Check className="w-4 h-4 text-white" />
                              ) : (
                                <Copy className="w-4 h-4 text-white" />
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            <p>{copiedId === message.id ? 'Copied!' : 'Copy'}</p>
                          </TooltipContent>
                        </Tooltip>
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
              </div>
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
    </TooltipProvider>
  );
}