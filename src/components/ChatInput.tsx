"use client"

import { useState, useRef, useEffect } from "react"
import { Plus, Mic, ArrowUp, Loader2 } from "lucide-react"

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSendMessage: (content: string, fileUrl?: string, fileType?: string) => Promise<void>;
  isLoading: boolean;
  variant?: string;
  disabled?: boolean;
}

export default function ChatInput({ input, onInputChange, onSendMessage, isLoading, variant, disabled = false }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = async () => {
    if (!input.trim() || disabled) return
    await onSendMessage(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !disabled) {
      e.preventDefault()
      handleSend()
    }
  }

  const adjustHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px"
    }
  }

  useEffect(() => {
    adjustHeight()
  }, [input])

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="relative flex items-end gap-2 bg-[#3a3a3a] rounded-full px-3 py-2 sm:px-4 sm:py-3 shadow-lg">
        {/* Left: Plus button */}
        <button
          type="button"
          className="w-9 h-9 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition"
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything"
          rows={1}
          disabled={disabled}
          className="flex-1 bg-transparent text-white placeholder-gray-400 border-none outline-none resize-none text-base leading-6 max-h-[200px] overflow-y-auto mb-1 disabled:opacity-50 disabled:cursor-not-allowed"
        />

        {/* Mic button (always visible) */}
        <button
          type="button"
          disabled={disabled}
          className="w-9 h-9 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Mic className="w-5 h-5 hover:text-white" />
        </button>

        {/* Send button (only shows if input exists) */}
        {input.trim() && (
          <button
            type="button"
            onClick={handleSend}
            disabled={isLoading || disabled}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white text-black hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ArrowUp className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
    </div>
  )
}
