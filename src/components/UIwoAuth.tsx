"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bot, User, Paperclip, HelpCircle } from "lucide-react";
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
  fileType?: string;
}

// Typing indicator
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

  const hasReachedLimit = !isSignedIn && guestMessageCount >= GUEST_MESSAGE_LIMIT;

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (content: string, fileUrl?: string, fileType?: string) => {
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
        headers,
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
            ...(m.fileUrl && { fileUrl: m.fileUrl }),
            ...(m.fileType && { fileType: m.fileType }),
          })),
          chatId: currentChatId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "GUEST_LIMIT_REACHED") {
          setShowUpgradeModal(true);
          return;
        }
        throw new Error(data?.message || "Something went wrong");
      }

      if (data.chatId && !currentChatId) setCurrentChatId(data.chatId);
      if (!isSignedIn) setGuestMessageCount((prev) => prev + 1);

      const assistantMessage: Message = {
        id: Date.now().toString(),
        content: data.reply || "I received your message!",
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-[#212121] text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center">
            <Bot className="w-5 h-5 text-black" />
          </div>
          <span className="text-lg font-medium">ChatGPT</span>
        </div>
        <div className="flex items-center space-x-3">
          {!isSignedIn && (
            <>
              <Button onClick={() => openSignIn()} className="text-black bg-white px-4 py-2 rounded-full text-sm font-medium">
                Log in
              </Button>
              <Button onClick={() => openSignIn()} className="text-white bg-transparent border border-gray-600 px-4 py-2 rounded-full text-sm">
                Sign up
              </Button>
            </>
          )}
          <HelpCircle size={20} className="hover:bg-gray-800 p-2 rounded-full cursor-pointer" />
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
              <h1 className="text-4xl font-light text-white mb-6">ChatGPT</h1>
              <p className="text-gray-400 text-lg">How can I help you today?</p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <div key={message.id} className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                    {message.role === "user" ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="text-sm font-medium text-gray-300">
                      {message.role === "user" ? "You" : "ChatGPT"}
                    </div>
                    {message.fileUrl && (
                      <div className="mb-2">
                        {message.fileType?.startsWith("image/") ? (
                          <img
                            src={message.fileUrl}
                            alt="Uploaded content"
                            className="max-h-60 max-w-full rounded-md object-contain border border-gray-600"
                          />
                        ) : (
                          <a
                            href={message.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-300 hover:underline flex items-center"
                          >
                            <Paperclip className="w-4 h-4 mr-1" /> View attached file
                          </a>
                        )}
                      </div>
                    )}
                    <div className="text-white whitespace-pre-wrap leading-relaxed">
                      <MarkdownRenderer content={message.content} />
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                    <Bot size={16} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="text-sm font-medium text-gray-300">ChatGPT</div>
                    <TypingIndicator />
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-700 p-4">
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
              You've reached {GUEST_MESSAGE_LIMIT} messages.{" "}
              <Button onClick={() => openSignIn} className="text-blue-400 hover:underline">
                Sign up
              </Button>{" "}
              to continue chatting.
            </p>
          )}
        </div>
      </div>

      {/* Upgrade Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="sm:max-w-[425px] bg-[#212121] border border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center mb-4 text-white">
              Message Limit Reached
            </DialogTitle>
            <DialogDescription className="text-center text-gray-300">
              You've used all {GUEST_MESSAGE_LIMIT} free messages. Sign up to continue without limits!
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
