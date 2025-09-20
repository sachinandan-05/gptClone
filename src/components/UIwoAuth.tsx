"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Search, Paperclip, Send, User as UserIcon, Bot as BotIcon, CircleQuestionMark } from 'lucide-react';
import { Button } from "@/components/ui/button"; 
import { Input } from "@/components/ui/input";
import { useUser, useClerk, SignInButton, SignUpButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { DropdownMenuCheckboxes } from '@/app/helper/dropdown';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export default function ChatGPTClone() {
  const { isSignedIn, user } = useUser();
  const { openSignIn } = useClerk();
  const router = useRouter();
  
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selected, setSelected] = useState("ChatGPT");
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on load
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    if (!isSignedIn) {
      openSignIn();
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          chatId: currentChatId,
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      if (data.chatId && !currentChatId) {
        setCurrentChatId(data.chatId);
      }
      
      const assistantMessage: Message = {
        id: Date.now().toString(),
        content: data.content || "I'm sorry, I couldn't process your request.",
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: 'Sorry, there was an error processing your message. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-[#212121] text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 ">
        <div className="flex items-center space-x-4">
    
        <img src="image.png" 
        alt="Logo"
        className="h-6 w-6 rounded-sm filter brightness-0 invert" 

         />
         <DropdownMenuCheckboxes selected={selected} setSelected={setSelected} />

        </div>
        <div className="flex items-center space-x-4">
          {!isSignedIn ? (
            <>
              <SignInButton mode="modal">
                <Button 
                  className="text-black bg-white hover:bg-gray-100 px-3 py-1 rounded-full text-sm font-medium hover:cursor-pointer"
                  onClick={() => openSignIn()}
                >
                  Log in
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button className="text-white bg-[#212121] hover:bg-[#2F2F2F] border border-gray-600 hover:cursor-pointer px-3 py-1 rounded-full text-sm">
                  Sign up for free
                </Button>
              </SignUpButton>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-300">
                {user?.firstName || user?.username}
              </span>
              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                {user?.firstName?.[0] || user?.username?.[0] || 'U'}
              </div>
            </div>
          )}
          <div className='hover:bg-[#303030] p-1 rounded-full cursor-pointer'>
            <CircleQuestionMark size={20}/>
          </div>
       
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <h1 className="text-4xl font-normal text-white mb-8">ChatGPT</h1>
            <p className="text-gray-400">How can I help you today?</p>
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}
            >
              <div className={`flex items-start max-w-3xl w-full ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center mr-2 flex-shrink-0">
                    <BotIcon size={16} />
                  </div>
                )}
                <div 
                  className={`rounded-lg px-4 py-2 ${message.role === 'user' 
                    ? 'bg-[#40414f] text-white' 
                    : 'bg-[#343541] text-white'}`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center ml-2 flex-shrink-0">
                    <UserIcon size={16} />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="mb-[300px] ">
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <div className="bg-[#303030]  ">
              <div className="relative">
                {/* <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Message ChatGPT..."
                  className="w-full bg-transparent text-white placeholder-gray-400 p-4 pr-12 resize-none border-none outline-none min-h-[56px] max-h-[200px]"
                  rows={1}
                  disabled={isLoading}
                  style={{ resize: 'none' }}
                /> */}
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={isSignedIn ? 'Message ChatGPT...' : 'Sign in to chat'}
                  className="w-full bg-transparent text-white placeholder-gray-400 p-6 pr-12 border-none outline-none resize-none min-h-[56px] max-h-[400px]"
                  disabled={!isSignedIn || isLoading}
                  size={20}
                  height={56}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading || !isSignedIn}
                  className={`absolute right-3 bottom-3 p-1 rounded-md ${!input.trim() || isLoading || !isSignedIn 
                    ? 'text-gray-500' 
                    : 'text-white bg-green-600 hover:bg-green-700'}`}
                  title={!isSignedIn ? 'Sign in to chat' : 'Send message'}
                >
                  {isLoading ? (
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </div>
              {/* <div className="flex items-center justify-between p-2 px-4">
                <div className="flex items-center space-x-2">
                  <button className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-gray-600">
                    <Paperclip size={18} />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-gray-600">
                    <Search size={18} />
                  </button>
                </div>
               
              </div> */}
            </div>
          </div>
          
        </div>
      </div>
      <p className="text-xs text-center text-gray-400 mt-2">
            Free Research Preview. ChatGPT may produce inaccurate information about people, places, or facts. <a href="#" className="underline">ChatGPT September 25 Version</a>
          </p>
    </div>
  );
}