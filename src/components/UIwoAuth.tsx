"use client";

import React, { useState, useRef, useEffect } from "react";
import { CircleQuestionMark, Paperclip, HelpCircle, Copy, SquarePen, Send } from "lucide-react";
import { useUser, useClerk } from "@clerk/nextjs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import ChatInput from "./ChatInput";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getGuestId } from "@/lib/guestUtils";


interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  fileUrl?: string;
  fileType?: 'image' | 'document' | 'video' | 'audio' | 'other';
}

// Typing indicator component
const TypingIndicator = () => (
  <div className="flex space-x-1 p-2">
    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
  </div>
);

export default function UIwoAuth() {
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const [guestId, setGuestId] = useState<string>(() => getGuestId());
  const [guestMessageCount, setGuestMessageCount] = useState<number>(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const GUEST_MESSAGE_LIMIT = 10;
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");

  const hasReachedLimit = !isSignedIn && guestMessageCount >= GUEST_MESSAGE_LIMIT;

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (content: string, fileUrl?: string, fileType?: 'image' | 'document' | 'video' | 'audio' | 'other') => {
    if ((!content.trim() && !fileUrl) || isLoading || hasReachedLimit) return;

    setIsLoading(true);

    try {
      const userMessage: Message = {
        id: Date.now().toString(),
        content,
        role: "user",
        timestamp: new Date(),
        fileUrl,
        fileType,
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput("");

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (!isSignedIn) headers["x-guest-id"] = guestId;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          ...headers,
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content,
            ...(fileUrl && { fileUrl }),
            ...(fileType && { fileType }),
          }],
          chatId: currentChatId,
          stream: true,
        }),
      });

      if (!response.ok) {
        let errorData: any = null;
        const text = await response.text();
        try {
          errorData = JSON.parse(text);
        } catch {
          // Non-JSON (e.g., HTML error page)
        }
        if (errorData?.error === "GUEST_LIMIT_REACHED") {
          setShowUpgradeModal(true);
          return;
        }
        const message = errorData?.message || errorData?.error || text || "Something went wrong";
        throw new Error(message);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessageContent = "";
      let chatId = currentChatId;

      if (reader) {
        const processStream = async () => {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
              if (line === 'data: [DONE]') {
                continue; // Skip the [DONE] message
              }
              
              if (line.startsWith('data: ')) {
                try {
                  const content = line.substring(6).trim();
                  if (!content) continue;
                  
                  const data = JSON.parse(content);
                  
                  if (data.chatId) {
                    chatId = data.chatId;
                    setCurrentChatId(chatId);
                    continue;
                  }

                  if (data.choices?.[0]?.delta?.content) {
                    assistantMessageContent += data.choices[0].delta.content;
                    
                    setMessages(prev => {
                      const existing = prev.find(m => m.role === 'assistant' && m.id === 'temp-assistant');
                      if (existing) {
                        return prev.map(m => 
                          m.id === 'temp-assistant' 
                            ? { ...m, content: assistantMessageContent }
                            : m
                        );
                      } else {
                        return [
                          ...prev,
                          {
                            id: 'temp-assistant',
                            content: assistantMessageContent,
                            role: 'assistant' as const,
                            timestamp: new Date(),
                          }
                        ];
                      }
                    });
                  }
                } catch (e) {
                  console.error('Error parsing stream data:', e);
                }
              }
            }
          }

          // Finalize the assistant message with a proper ID
          setMessages(prev => {
            const finalMessage = {
              id: Date.now().toString(),
              content: assistantMessageContent,
              role: 'assistant' as const,
              timestamp: new Date(),
            };
            
            return prev.map(m => 
              m.id === 'temp-assistant' ? finalMessage : m
            );
          });

          if (!isSignedIn) {
            setGuestMessageCount(prev => prev + 1);
          }
        };

        await processStream();
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

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

    // stream new assistant reply from this point
    try {
      setIsLoading(true);
      const headers: Record<string, string> = { "Content-Type": "application/json", Accept: 'text/event-stream' };
      if (!isSignedIn) headers["x-guest-id"] = guestId;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages: trimmed.map(m => ({ role: m.role, content: m.content })),
          chatId: currentChatId,
          stream: true,
          regenerateFromIndex: idx,
          editedContent: updatedUser.content,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        try { const e = JSON.parse(text); throw new Error(e.message || e.error || text); }
        catch { throw new Error(text); }
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessageContent = "";
      let chatId = currentChatId;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim() !== '');
          for (const line of lines) {
            if (line === 'data: [DONE]') continue;
            if (!line.startsWith('data: ')) continue;
            try {
              const data = JSON.parse(line.substring(6).trim());
              if (data.chatId) { chatId = data.chatId; setCurrentChatId(chatId); continue; }
              if (data.choices?.[0]?.delta?.content) {
                assistantMessageContent += data.choices[0].delta.content;
                setMessages(prev => {
                  const existing = prev.find(m => m.role === 'assistant' && m.id === 'temp-assistant');
                  if (existing) {
                    return prev.map(m => m.id === 'temp-assistant' ? { ...m, content: assistantMessageContent } : m);
                  } else {
                    return [...prev, { id: 'temp-assistant', content: assistantMessageContent, role: 'assistant' as const, timestamp: new Date() }];
                  }
                });
              }
            } catch {}
          }
        }
        // finalize
        setMessages(prev => prev.map(m => m.id === 'temp-assistant' ? ({ id: Date.now().toString(), content: assistantMessageContent, role: 'assistant' as const, timestamp: new Date() }) : m));
      }
    } catch (e) {
      console.error('Regenerate failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="flex flex-col h-screen bg-[#212121] text-white overflow-x-hidden"
      style={{
        fontFamily: 'ui-sans-serif, -apple-system, system-ui, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"',
        fontSize: '16px',
        fontWeight: 400,
        lineHeight: '28px',
        color: 'rgb(255, 255, 255)'
      }}
    >
        {/* Header */}
        <div className="flex items-center justify-between p-4  ">
          <div className="flex items-center space-x-4">
          
            <div className="w-8 h-8 text-white rounded-sm flex items-center justify-center">
             <img src="image.png" alt="" className="w-full h-full object-cover filter brightness-0 invert"/>
            </div>
            <span className="text-lg font-medium"></span>
          </div>
          <div className="flex items-center space-x-3">
            {!isSignedIn && (
              <>
                <Button onClick={() => openSignIn()} className="text-black bg-white px-4 py-2 rounded-full text-sm font-medium">
                  Log in
                </Button>
                <Button onClick={() => openSignIn()} className=" hidden lg:block text-white bg-transparent border border-gray-600 px-4 py-2 rounded-full text-sm">
                  Sign up for free
                </Button>
              </>
            )}
            <CircleQuestionMark size={20} className="hover:bg-gray-800 rounded-full cursor-pointer text-white" />
          </div>
        </div>

        {/* Chat messages */}
        <ScrollArea className="flex-1">
          <div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[65vh] text-center px-4">
                <h1 className="mb-6 text-3xl sm:text-4xl font-semibold text-white">ChatGPT</h1>
                <div className="w-full max-w-3xl">
                  <ChatInput
                    input={input}
                    onInputChange={setInput}
                    onSendMessage={handleSendMessage}
                    isLoading={isLoading}
                    disabled={hasReachedLimit}
                    variant="hero"
                  />
                  {hasReachedLimit && (
                    <p className="mt-2 text-center text-sm text-gray-400">
                      You&#39;ve reached {GUEST_MESSAGE_LIMIT} messages. {" "}
                      <Button variant="link" onClick={() => openSignIn()} className="text-blue-400 hover:underline p-0 h-auto">
                        Sign up
                      </Button>{" "}
                      to continue chatting.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`group relative max-w-[80%] rounded-lg px-4 py-3 break-words overflow-x-hidden ${
                      message.role === 'user' ? 'bg-[#303030]' : 'bg-none'
                    }`}
                  >
                    {message.fileUrl && message.fileType?.startsWith('image/') && (
                      <div className="mb-2">
                        <img
                          src={message.fileUrl}
                          alt="Uploaded content"
                          className="max-h-60 max-w-full rounded-md object-contain"
                        />
                      </div>
                    )}
                    {message.fileUrl && !message.fileType?.startsWith('image/') && (
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
                            className="p-1.5 rounded-md bg-white text-black hover:bg-gray-100"
                            aria-label="Send"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          <Button variant="outline" onClick={cancelEdit} className="border border-gray-600 bg-transparent text-white hover:bg-gray-800 px-3 py-1 h-auto">Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <MarkdownRenderer content={message.content} />
                        <div className="mt-1 flex gap-3 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => navigator.clipboard.writeText(message.content)}
                            className="flex items-center gap-1 hover:text-white"
                            aria-label="Copy message"
                            title="Copy"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          {message.role === 'user' && (
                            <button
                              onClick={() => startEdit(message)}
                              className="flex items-center gap-1 hover:text-white"
                              aria-label="Edit message"
                              title="Edit"
                            >
                              <SquarePen className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-4 py-3">
                  <TypingIndicator />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input at bottom once conversation has started */}
        {messages.length > 0 && (
          <div className="p-4">
            <div className="max-w-3xl mx-auto">
              <ChatInput
                input={input}
                onInputChange={setInput}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                disabled={hasReachedLimit}
              />
              {hasReachedLimit && (
                <p className="mt-2 text-center text-sm text-gray-400">
                  You&#39;ve reached {GUEST_MESSAGE_LIMIT} messages. {" "}
                  <Button variant="link" onClick={() => openSignIn()} className="text-blue-400 hover:underline p-0 h-auto">
                    Sign up
                  </Button>{" "}
                  to continue chatting.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Upgrade Modal */}
        <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
          <DialogContent className="sm:max-w-[425px] bg-[#212121] border border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center mb-4 text-white">
                Message Limit Reached
              </DialogTitle>
              <DialogDescription className="text-center text-gray-300">
                You&apos;ve used all {GUEST_MESSAGE_LIMIT} free messages. Sign up to continue without limits!
                <div className="flex flex-col space-y-3 mt-4">
                  <Button onClick={() => openSignIn()} className="w-full bg-white text-black hover:bg-gray-100">
                    Sign Up for Free
                  </Button>
                  <Button onClick={() => openSignIn()} className="w-full border border-gray-600 text-white hover:bg-gray-800 bg-transparent">
                    Already have an account? Sign In
                  </Button>
                </div>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    
  );
}
