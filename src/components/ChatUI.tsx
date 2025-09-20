"use client";

import { useState, useRef, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, Sidebar as SidebarIcon } from "lucide-react";
import Navbar from './Navbar';
import ChatInput from './ChatInput';
import { Sidebar } from './Sidebar';
import { MarkdownRenderer } from '../app/helper/MarkdownRenderer';

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface ChatUIProps {
  initialMessages?: Message[];
  chatId?: string;
  initialInput?: string;
}

export default function ChatUI({ initialMessages = [], chatId, initialInput = '' }: ChatUIProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState(initialInput);
  const [isNewChat, setIsNewChat] = useState(!chatId);
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    handleSubmit(e);
  };
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault?.();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date(),
    };

    // Update local state immediately
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages,
          chatId: chatId || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const data = await response.json();
      
      // If this was a new chat, update the chatId from the response
      if (isNewChat && data.chatId) {
        window.history.replaceState({}, '', `/chat/${data.chatId}`);
        setIsNewChat(false);
      }

      // Update messages with the complete response
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: data.content,
        role: 'assistant',
        timestamp: new Date(),
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "Sorry, there was an error processing your message. Please try again.",
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#212121]">
      <Sidebar 
        isCollapsed={isCollapsed} 
        onToggleCollapse={toggleSidebar} 
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar isSidebarOpen={!isCollapsed}>
          <button 
            onClick={toggleSidebar} 
            className="md:hidden p-2 rounded-md hover:bg-gray-700 text-gray-300"
          >
            <SidebarIcon size={20} />
          </button>
        </Navbar>
        <ScrollArea className="flex-1 overflow-y-auto px-4 py-4 md:px-8 transition-all duration-300">
          <div className="space-y-4 max-w-3xl mx-auto w-full">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full ">
                Start a conversation with the AI assistant
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  } w-full`}
                >
                  <div
                    className={`max-w-3xl w-full ${
                      message.role === "user" ? "text-right" : "text-left"
                    }`}
                  >
                    <div
                      className={`${message.role === "user"
                        ? "bg-[#303030] rounded-2xl px-4 py-3 text-white text-md font-normal inline-block max-w-full break-words"
                        : "rounded-lg px-4 py-3 text-white "
                        }`}
                    >
                      {message.role === "user" ? (
                        <p className="whitespace-pre-wrap text-left ">{message.content}</p>
                      ) : (
                        <div className="prose prose-invert max-w-none">
                          <MarkdownRenderer content={message.content} />
                        </div>
                      )}
                    </div>
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
              isLoading={isLoading}
              onInputChange={setInput}
              onSendMessage={handleSendMessage}
              onFileUpload={(files) => {
                // Handle file uploads if needed
                console.log('Files to upload:', files);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
